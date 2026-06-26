/**
 * In-process token-bucket rate limiter for Next.js API routes.
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
 *   const { success } = limiter.check(clientIp);
 *   if (!success) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
 *
 * Notes:
 * - State lives in the Node.js process. On Vercel each serverless function instance
 *   maintains its own counter, so the effective limit across many instances is
 *   higher than configured. Use Vercel KV / Redis for a true distributed limit.
 * - The Map is never GC'd in a long-lived server; expired entries are cleaned up
 *   lazily on each `check` call to bound memory growth.
 */

interface RateLimiterOptions {
  /** Maximum requests allowed per `windowMs`. */
  limit: number;
  /** Rolling window length in milliseconds. */
  windowMs: number;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const buckets = new Map<string, BucketEntry>();

  return {
    check(key: string): { success: boolean; remaining: number; resetAt: number } {
      const now = Date.now();

      // Lazy cleanup: drop expired entries while we're here.
      for (const [k, entry] of buckets) {
        if (entry.resetAt < now) buckets.delete(k);
      }

      const entry = buckets.get(key);
      if (!entry || entry.resetAt < now) {
        const newEntry: BucketEntry = { count: 1, resetAt: now + windowMs };
        buckets.set(key, newEntry);
        return { success: true, remaining: limit - 1, resetAt: newEntry.resetAt };
      }

      if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count += 1;
      return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
    },
  };
}

/** Extract the best available client IP from an incoming Next.js request. */
export function getClientIp(request: Request): string {
  const h = request.headers;
  // Vercel populates x-forwarded-for; fall back to a fixed string in local dev.
  const forwarded = h.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
}
