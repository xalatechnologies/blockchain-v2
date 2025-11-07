import { getCache, setCache } from "./cache";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Get current rate limit entry
  const entry = await getCache<RateLimitEntry>(key);

  if (!entry || now > entry.resetAt) {
    // Create new window
    await setCache(key, {
      count: 1,
      resetAt: now + windowMs,
    }, windowSeconds);
    return false;
  }

  // Increment count
  entry.count++;
  
  if (entry.count > maxRequests) {
    await setCache(key, entry, Math.ceil((entry.resetAt - now) / 1000));
    return true; // Rate limited
  }

  await setCache(key, entry, Math.ceil((entry.resetAt - now) / 1000));
  return false;
}

