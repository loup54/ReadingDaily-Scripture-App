/**
 * AsyncStorage Timing Data Provider
 * Caches word timing data locally for offline access
 * Reduces Firestore reads and enables offline highlighting
 * Implements IHighlightingProvider interface
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SentenceTimingData, IHighlightingProvider, CachedHighlightingData } from '@/types';

/**
 * Configuration for caching behavior
 */
const CACHE_CONFIG = {
  // Cache expires after 7 days
  ttlMs: 7 * 24 * 60 * 60 * 1000,
  // Maximum cache size: 50MB (we'll store much less)
  maxCacheSizeBytes: 50 * 1024 * 1024,
  // Storage key prefix
  keyPrefix: '@highlight_cache/',
};

/**
 * Provider for local caching of timing data using AsyncStorage
 */
export class AsyncStorageTimingDataProvider implements IHighlightingProvider {
  private static instance: AsyncStorageTimingDataProvider;

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): AsyncStorageTimingDataProvider {
    if (!AsyncStorageTimingDataProvider.instance) {
      AsyncStorageTimingDataProvider.instance = new AsyncStorageTimingDataProvider();
    }
    return AsyncStorageTimingDataProvider.instance;
  }

  /**
   * Get timing data from local cache
   * Returns null if not found or expired
   */
  async getTimingData(
    readingId: string,
    readingType: string,
    date?: Date,
  ): Promise<SentenceTimingData | null> {
    try {
      const cacheKey = this.generateCacheKey(readingId, readingType);
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) {
        console.log(`[AsyncStorageProvider] Cache miss: ${readingId}/${readingType}`);
        return null;
      }

      const cached = JSON.parse(cachedData) as CachedHighlightingData;

      // Check if cache has expired
      const cachedAt = new Date(cached.cachedAt).getTime();
      const now = Date.now();
      const ageMs = now - cachedAt;

      if (ageMs > cached.ttlMs) {
        console.log(`[AsyncStorageProvider] Cache expired: ${readingId}/${readingType}`);
        // Delete expired cache
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      console.log(
        `[AsyncStorageProvider] ✅ Cache hit: ${readingId}/${readingType} (age: ${(ageMs / 1000 / 60).toFixed(1)}min)`,
      );

      return cached.timingData;
    } catch (error) {
      console.error('[AsyncStorageProvider] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Save timing data to local cache
   */
  async saveTimingData(data: SentenceTimingData): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(data.readingId, data.readingType);

      const cached: CachedHighlightingData = {
        timingData: data,
        cachedAt: new Date(),
        ttlMs: CACHE_CONFIG.ttlMs,
        cacheKey,
      };

      const serialized = JSON.stringify(cached);
      const sizeBytes = new Blob([serialized]).size;

      // Check size limit (basic check, not precise)
      if (sizeBytes > CACHE_CONFIG.maxCacheSizeBytes / 10) {
        console.warn('[AsyncStorageProvider] Single item approaching size limit');
      }

      await AsyncStorage.setItem(cacheKey, serialized);
      console.log(`[AsyncStorageProvider] ✅ Saved to cache: ${data.readingId}/${data.readingType}`);
    } catch (error) {
      console.error('[AsyncStorageProvider] Error saving to cache:', error);
      throw error;
    }
  }

  /**
   * Get cached data directly (for inspection)
   */
  async getCachedTimingData(cacheKey: string): Promise<CachedHighlightingData | null> {
    try {
      const fullKey = `${CACHE_CONFIG.keyPrefix}${cacheKey}`;
      const cachedData = await AsyncStorage.getItem(fullKey);

      if (!cachedData) {
        return null;
      }

      return JSON.parse(cachedData) as CachedHighlightingData;
    } catch (error) {
      console.error('[AsyncStorageProvider] Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clear all timing data cache
   */
  async clearCache(): Promise<void> {
    try {
      console.log('[AsyncStorageProvider] Clearing all timing cache...');

      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) => key.startsWith(CACHE_CONFIG.keyPrefix));

      if (cacheKeys.length === 0) {
        console.log('[AsyncStorageProvider] No cache to clear');
        return;
      }

      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[AsyncStorageProvider] ✅ Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('[AsyncStorageProvider] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   * Useful for monitoring cache health
   */
  async getCacheStats(): Promise<{
    entriesCount: number;
    oldestEntryAgeMs: number;
    newestEntryAgeMs: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) => key.startsWith(CACHE_CONFIG.keyPrefix));

      if (cacheKeys.length === 0) {
        return {
          entriesCount: 0,
          oldestEntryAgeMs: 0,
          newestEntryAgeMs: 0,
        };
      }

      const cachedDataPromises = cacheKeys.map((key) => AsyncStorage.getItem(key));
      const cachedDataArray = await Promise.all(cachedDataPromises);

      let oldestAgeMs = 0;
      let newestAgeMs = Infinity;
      const now = Date.now();

      for (const cachedDataStr of cachedDataArray) {
        if (!cachedDataStr) continue;

        try {
          const cached = JSON.parse(cachedDataStr) as CachedHighlightingData;
          const ageMs = now - new Date(cached.cachedAt).getTime();

          oldestAgeMs = Math.max(oldestAgeMs, ageMs);
          newestAgeMs = Math.min(newestAgeMs, ageMs);
        } catch (e) {
          // Skip malformed entries
        }
      }

      return {
        entriesCount: cacheKeys.length,
        oldestEntryAgeMs: oldestAgeMs,
        newestEntryAgeMs: newestAgeMs === Infinity ? 0 : newestAgeMs,
      };
    } catch (error) {
      console.error('[AsyncStorageProvider] Error getting cache stats:', error);
      return {
        entriesCount: 0,
        oldestEntryAgeMs: 0,
        newestEntryAgeMs: 0,
      };
    }
  }

  /**
   * Clean up expired entries
   * Call periodically to maintain cache health
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) => key.startsWith(CACHE_CONFIG.keyPrefix));

      let expiredCount = 0;
      const now = Date.now();

      for (const key of cacheKeys) {
        const cachedDataStr = await AsyncStorage.getItem(key);
        if (!cachedDataStr) continue;

        try {
          const cached = JSON.parse(cachedDataStr) as CachedHighlightingData;
          const cachedAt = new Date(cached.cachedAt).getTime();
          const ageMs = now - cachedAt;

          if (ageMs > cached.ttlMs) {
            await AsyncStorage.removeItem(key);
            expiredCount++;
          }
        } catch (e) {
          // Remove malformed entries
          await AsyncStorage.removeItem(key);
          expiredCount++;
        }
      }

      console.log(`[AsyncStorageProvider] ✅ Cleaned up ${expiredCount} expired entries`);
      return expiredCount;
    } catch (error) {
      console.error('[AsyncStorageProvider] Error cleaning up cache:', error);
      return 0;
    }
  }

  /**
   * Generate cache key from reading ID and type
   */
  private generateCacheKey(readingId: string, readingType: string): string {
    return `${CACHE_CONFIG.keyPrefix}${readingId}_${readingType}`;
  }
}

/**
 * Export singleton instance
 */
export const asyncStorageTimingDataProvider = AsyncStorageTimingDataProvider.getInstance();
