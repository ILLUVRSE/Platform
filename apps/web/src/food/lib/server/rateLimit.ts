const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

type Bucket = { count: number; start: number };

const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, opts?: { limit?: number; windowMs?: number }) {
  const limit = opts?.limit ?? MAX_REQUESTS;
  const windowMs = opts?.windowMs ?? WINDOW_MS;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { count: 1, start: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
