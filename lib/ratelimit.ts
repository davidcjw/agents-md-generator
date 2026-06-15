// Lightweight in-memory rate limiter for serverless API routes.
//
// NOTE: serverless functions are ephemeral and scale horizontally, so this
// counter is PER WARM INSTANCE — it throttles casual abuse from a single client
// (the common case) but is not a hard global guarantee. For production-grade,
// edge-enforced protection, also add a Vercel WAF rate-limit rule (free on
// Hobby, blocks before the function — and the paid API call — even runs).

interface Bucket {
  count: number;
  /** epoch ms when this window resets */
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** seconds until the limit resets (for a Retry-After header) */
  retryAfterSec: number;
}

const store = new Map<string, Bucket>();

/** Drop expired buckets so the map can't grow unbounded under many keys. */
export function sweep(now: number = Date.now()): void {
  for (const [k, b] of store) if (now >= b.resetAt) store.delete(k);
}

/**
 * Fixed-window counter. Returns whether the request is allowed and, if not, how
 * long to wait. `now` is injectable for tests.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  const { limit, windowMs } = opts;
  if (store.size > 5000) sweep(now); // bound memory before inserting new keys

  const b = store.get(key);
  if (!b || now >= b.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }
  if (b.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}

/** Best-effort client IP from the usual proxy headers (Vercel sets these). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
