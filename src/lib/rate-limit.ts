// Simple in-memory rate limiter. Resets on server restart.
// For production, replace with Upstash Redis or edge middleware.
type RateLimitEntry = { count: number; resetAt: number };
const store = new Map<string, RateLimitEntry>();

const EVICTION_INTERVAL_MS = 60_000;
let lastEviction = 0;

function evictExpired(now: number): void {
  if (now - lastEviction < EVICTION_INTERVAL_MS) return;
  lastEviction = now;
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

export function checkRateLimit(
  key: string,
  limit = 3,
  windowMs = 15 * 60 * 1000,
): boolean {
  const now = Date.now();
  evictExpired(now);
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
