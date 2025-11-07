import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Cache Service
 * 
 * Provides caching functionality using Redis.
 * Wraps the NestJS cache manager with additional utility methods.
 * 
 * @class CacheService
 * @example
 * ```typescript
 * // Get or set with caching
 * const data = await cacheService.getOrSet('key', async () => {
 *   return expensiveOperation();
 * }, 300); // 5 minutes TTL
 * ```
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Gets a value from cache.
   * 
   * @template T - Type of the cached value
   * @param {string} key - Cache key
   * @returns {Promise<T | undefined>} Cached value or undefined
   * @example
   * ```typescript
   * const value = await cacheService.get<string>('my-key');
   * ```
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Sets a value in cache.
   * 
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - Time to live in seconds (optional)
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * await cacheService.set('my-key', 'value', 300); // 5 minutes
   * ```
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Deletes a value from cache.
   * 
   * @param {string} key - Cache key to delete
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * await cacheService.del('my-key');
   * ```
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Clears all cache.
   * 
   * @returns {Promise<void>}
   * @example
   * ```typescript
   * await cacheService.reset();
   * ```
   */
  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  /**
   * Gets a value from cache, or sets it if not found.
   * 
   * This is a convenience method that combines get and set operations.
   * 
   * @template T - Type of the value
   * @param {string} key - Cache key
   * @param {() => Promise<T>} fn - Function to generate value if not cached
   * @param {number} [ttl] - Time to live in seconds (optional)
   * @returns {Promise<T>} Cached or newly generated value
   * @example
   * ```typescript
   * const data = await cacheService.getOrSet('key', async () => {
   *   // Expensive operation
   *   return await fetchDataFromDatabase();
   * }, 300);
   * ```
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Wraps a function with caching.
   * 
   * Alias for getOrSet.
   * 
   * @template T - Type of the return value
   * @param {string} key - Cache key
   * @param {() => Promise<T>} fn - Function to wrap
   * @param {number} [ttl] - Time to live in seconds (optional)
   * @returns {Promise<T>} Cached or newly generated value
   * @example
   * ```typescript
   * const result = await cacheService.wrap('key', expensiveFunction, 300);
   * ```
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    return this.getOrSet(key, fn, ttl);
  }
}
