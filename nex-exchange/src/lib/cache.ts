import NodeCache from "node-cache";

// In-memory cache for development
const memoryCache = new NodeCache({
  stdTTL: 60, // Default TTL: 60 seconds
  checkperiod: 120, // Check for expired keys every 120 seconds
  useClones: false, // Better performance
});

// Redis cache for production (when available)
let redisClient: any = null;

/**
 * Initialize Redis client (optional)
 */
export async function initRedisCache(redisUrl?: string) {
  if (redisUrl && typeof window === "undefined") {
    try {
      const Redis = (await import("ioredis")).default;
      redisClient = new Redis(redisUrl);
      console.log("Redis cache initialized");
    } catch (error) {
      console.warn("Redis not available, using memory cache:", error);
    }
  }
}

/**
 * Get value from cache
 */
export async function getCache<T>(key: string): Promise<T | undefined> {
  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.error("Redis get error:", error);
      return undefined;
    }
  }
  
  return memoryCache.get<T>(key);
}

/**
 * Set value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = 60
): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return;
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }
  
  memoryCache.set(key, value, ttl);
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (error) {
      console.error("Redis delete error:", error);
    }
  }
  
  memoryCache.del(key);
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.flushdb();
      return;
    } catch (error) {
      console.error("Redis flush error:", error);
    }
  }
  
  memoryCache.flushAll();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  if (redisClient) {
    return {
      type: "redis",
      // Redis stats would be fetched here
    };
  }
  
  const stats = memoryCache.getStats();
  return {
    type: "memory",
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
  };
}

