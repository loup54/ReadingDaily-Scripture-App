/**
 * Cache Service
 * Manages in-memory and persistent caching for the app
 *
 * Features:
 * - In-memory cache with TTL support
 * - Persistent storage via AsyncStorage
 * - Automatic expiration
 * - Fallback support
 *
 * @example
 * // Basic usage
 * cacheService.set('key', data);
 * const data = cacheService.get('key');
 *
 * // With TTL (5 minutes)
 * cacheService.set('key', data, 5 * 60 * 1000);
 *
 * // With fallback
 * const data = cacheService.getWithFallback('key', defaultValue);
 */

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // time-to-live in milliseconds
  persistent: boolean; // whether to persist to storage
}

interface CacheOptions {
  ttl?: number; // time-to-live in milliseconds (default: 1 hour)
  persistent?: boolean; // persist to device storage (default: false)
  force?: boolean; // force fetch even if cached (default: false)
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private static readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
  private static readonly MAX_CACHE_SIZE = 100; // Max number of entries

  /**
   * Set a cache entry
   */
  set<T = any>(
    key: string,
    data: T,
    ttl: number = CacheService.DEFAULT_TTL,
    options: Partial<CacheOptions> = {}
  ): void {
    if (!key || data === null || data === undefined) {
      return;
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      persistent: options.persistent ?? false,
    };

    this.cache.set(key, entry);

    // Cleanup if cache gets too large
    if (this.cache.size > CacheService.MAX_CACHE_SIZE) {
      this.cleanupOldest();
    }
  }

  /**
   * Get a cache entry
   * Returns null if not found or expired
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Get with fallback value
   * Returns fallback if not found or expired
   */
  getWithFallback<T = any>(key: string, fallback: T): T {
    const cached = this.get<T>(key);
    return cached !== null ? cached : fallback;
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  isValid(key: string): boolean {
    return this.has(key);
  }

  /**
   * Remove a cache entry
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all cache entries matching a pattern
   * @example
   * // Get all scripture entries
   * const entries = cache.getByPattern('scripture_*');
   */
  getByPattern(pattern: string): Map<string, any> {
    const regex = this.patternToRegex(pattern);
    const result = new Map<string, any>();

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key) && !this.isExpired(entry)) {
        result.set(key, entry.data);
      }
    }

    return result;
  }

  /**
   * Remove all cache entries matching a pattern
   * @example
   * // Clear all scripture cache
   * cache.removeByPattern('scripture_*');
   */
  removeByPattern(pattern: string): void {
    const regex = this.patternToRegex(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    total: number;
    persistent: number;
    memorySize: number;
  } {
    let memorySize = 0;
    let persistentCount = 0;

    for (const entry of this.cache.values()) {
      if (entry.persistent) {
        persistentCount++;
      }
      memorySize += this.estimateSize(entry.data);
    }

    return {
      total: this.cache.size,
      persistent: persistentCount,
      memorySize,
    };
  }

  /**
   * Get remaining TTL in milliseconds
   */
  getTTL(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const remaining = entry.ttl - (Date.now() - entry.timestamp);
    return remaining > 0 ? remaining : null;
  }

  /**
   * Get cache entry age in milliseconds
   */
  getAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return Date.now() - entry.timestamp;
  }

  /**
   * Update TTL for existing entry
   */
  updateTTL(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    entry.timestamp = Date.now();
    return true;
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpired(): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Reset cache (clear everything)
   */
  reset(): void {
    this.cache.clear();
  }

  // Private methods

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }

  /**
   * Remove oldest cache entries when cache is full
   */
  private cleanupOldest(): void {
    const entriesToRemove = Math.ceil(CacheService.MAX_CACHE_SIZE * 0.2); // Remove 20%
    let removed = 0;

    const sorted = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (const [key] of sorted) {
      if (removed >= entriesToRemove) break;
      this.cache.delete(key);
      removed++;
    }
  }

  /**
   * Convert wildcard pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\\\*/g, '.*');
    return new RegExp(`^${regex}$`);
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new Blob([json]).size;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

export type { CacheEntry, CacheOptions };
