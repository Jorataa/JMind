// ─────────────────────────────────────────────────────────────────────────────
// Lightweight per-IP rate limiter for public API routes.
//
// WHY: routes like /api/ai forward to a paid/quota'd upstream (Gemini) using a
// secret key, and /api/visitor writes to a Google Sheet. Both are anonymous and
// publicly reachable, so without throttling a single script can exhaust the
// owner's quota/budget or spam the sheet (see SECURITY_AUDIT.md, findings 1 & 4).
//
// SCOPE / LIMITATION: this is an in-memory fixed-window counter. On Vercel each
// serverless instance has its own memory, so the effective limit is per-instance,
// not global. It is a meaningful first layer that stops trivial single-source
// abuse; for a hard budget guarantee across instances, back it with a shared
// store (Vercel KV / Upstash Redis). Kept dependency-free on purpose.
// ─────────────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

// Module-level map persists across requests within the same instance.
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded under many distinct IPs.
const MAX_TRACKED = 10_000;

/**
 * Derives a best-effort client identifier from request headers.
 *
 * TRUST MODEL: on Vercel (non-Enterprise) the platform *overwrites*
 * `x-forwarded-for` with the real client IP and does not forward an external,
 * client-supplied value (per Vercel docs), so keying on it is sound there. On
 * any OTHER host — self-hosted Node, a misconfigured reverse proxy, or a Vercel
 * Enterprise "trusted proxy" setup — `x-forwarded-for` becomes client-spoofable
 * and an attacker can rotate it to get a fresh bucket per request, bypassing the
 * limit. If you deploy off-Vercel, replace this with your platform's trusted
 * client-IP source (e.g. `ipAddress()` from `@vercel/functions`) and a shared
 * store. Falls back to a constant bucket so a missing header still gets *some*
 * throttling rather than no limit at all.
 */
export function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim();
  return ip || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Defense-in-depth body-size guard. The per-field char caps in each route only
 * apply *after* `request.json()` has buffered and parsed the whole body, so a
 * huge payload still costs memory/CPU first. Reject anything whose advertised
 * Content-Length exceeds `maxBytes` before we read it. (Vercel also caps request
 * bodies at the platform level, but this makes the limit explicit and portable.)
 * Returns a 413 Response to return early, or null to proceed.
 */
export function rejectOversizedBody(request: Request, maxBytes: number): Response | null {
  const len = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(len) && len > maxBytes) {
    return new Response(JSON.stringify({ error: "Request body too large." }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets — surfaced as Retry-After on a 429. */
  retryAfter: number;
}

/**
 * Fixed-window limiter: allow `limit` requests per `windowMs` per key.
 * Returns `{ ok: false, retryAfter }` once the window's budget is spent.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Convenience guard for a route handler. Returns a 429 `Response` to return
 * early when the caller is over the limit, or `null` when the request may
 * proceed. Keeps every route's throttling identical and one-line.
 */
export function applyRateLimit(
  request: Request,
  { limit, windowMs }: { limit: number; windowMs: number },
): Response | null {
  const { ok, retryAfter } = rateLimit(clientKey(request), limit, windowMs);
  if (ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}