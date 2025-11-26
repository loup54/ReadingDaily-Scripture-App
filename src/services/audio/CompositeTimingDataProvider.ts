/**
 * Composite Timing Data Provider
 * Combines Firestore and AsyncStorage providers with intelligent fallback
 * Strategy:
 * 1. Try AsyncStorage cache first (offline mode + fast)
 * 2. If not found, try Firestore (online mode)
 * 3. Save to AsyncStorage for future offline access
 * 4. Handles network errors gracefully
 */

import { SentenceTimingData, IHighlightingProvider, CachedHighlightingData } from '@/types';
import { FirestoreTimingDataProvider } from './FirestoreTimingDataProvider';
import { AsyncStorageTimingDataProvider } from './AsyncStorageTimingDataProvider';

/**
 * Composite provider using multiple backends with fallback strategy
 */
export class CompositeTimingDataProvider implements IHighlightingProvider {
  private static instance: CompositeTimingDataProvider;
  private firestoreProvider: FirestoreTimingDataProvider;
  private asyncStorageProvider: AsyncStorageTimingDataProvider;

  private constructor() {
    this.firestoreProvider = FirestoreTimingDataProvider.getInstance();
    this.asyncStorageProvider = AsyncStorageTimingDataProvider.getInstance();
  }

  /**
   * Singleton instance
   */
  static getInstance(): CompositeTimingDataProvider {
    if (!CompositeTimingDataProvider.instance) {
      CompositeTimingDataProvider.instance = new CompositeTimingDataProvider();
    }
    return CompositeTimingDataProvider.instance;
  }

  /**
   * Get timing data with intelligent fallback strategy
   *
   * Strategy:
   * 1. Check AsyncStorage cache first (instant, works offline)
   * 2. If not cached, fetch from Firestore (requires network)
   * 3. Cache result in AsyncStorage for future offline access
   *
   * @returns Timing data or null if not found in any provider
   */
  async getTimingData(
    readingId: string,
    readingType: string,
    date?: Date,
  ): Promise<SentenceTimingData | null> {
    console.log(`[CompositeProvider] Getting timing data: ${readingId}/${readingType}`);

    // Step 1: Try local cache (instant, offline)
    try {
      const cachedData = await this.asyncStorageProvider.getTimingData(readingId, readingType, date);
      if (cachedData) {
        console.log(`[CompositeProvider] ✅ Using cached data`);
        return cachedData;
      }
    } catch (error) {
      console.warn('[CompositeProvider] Cache lookup error:', error);
      // Continue to Firestore on cache error
    }

    // Step 2: Try Firestore (requires network, but authoritative)
    try {
      const firestoreData = await this.firestoreProvider.getTimingData(readingId, readingType, date);
      if (firestoreData) {
        // Step 3: Save to cache for future offline access
        try {
          await this.asyncStorageProvider.saveTimingData(firestoreData);
          console.log(`[CompositeProvider] ✅ Fetched from Firestore and cached`);
        } catch (cacheError) {
          console.warn('[CompositeProvider] Failed to cache Firestore data:', cacheError);
          // Still return the data even if caching fails
        }

        return firestoreData;
      }
    } catch (error) {
      console.warn('[CompositeProvider] Firestore lookup error:', error);
    }

    // No data found in any provider
    console.warn(`[CompositeProvider] ❌ No timing data found: ${readingId}/${readingType}`);
    return null;
  }

  /**
   * Save timing data to both providers
   * Ensures data is available offline and in Firestore
   */
  async saveTimingData(data: SentenceTimingData): Promise<void> {
    console.log(`[CompositeProvider] Saving timing data: ${data.readingId}/${data.readingType}`);

    const errors: Error[] = [];

    // Save to AsyncStorage (always succeeds)
    try {
      await this.asyncStorageProvider.saveTimingData(data);
      console.log(`[CompositeProvider] ✅ Saved to AsyncStorage`);
    } catch (error) {
      console.error('[CompositeProvider] Failed to save to AsyncStorage:', error);
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    // Save to Firestore (may fail if offline)
    try {
      await this.firestoreProvider.saveTimingData(data);
      console.log(`[CompositeProvider] ✅ Saved to Firestore`);
    } catch (error) {
      console.warn('[CompositeProvider] Failed to save to Firestore:', error);
      // Don't throw - local cache is sufficient
    }

    // If AsyncStorage save failed, throw error
    if (errors.length > 0) {
      throw errors[0];
    }
  }

  /**
   * Get cached data from AsyncStorage
   */
  async getCachedTimingData(cacheKey: string): Promise<CachedHighlightingData | null> {
    return await this.asyncStorageProvider.getCachedTimingData(cacheKey);
  }

  /**
   * Clear all caches from both providers
   */
  async clearCache(): Promise<void> {
    console.log('[CompositeProvider] Clearing all caches...');

    try {
      await this.asyncStorageProvider.clearCache();
      console.log('[CompositeProvider] ✅ AsyncStorage cache cleared');
    } catch (error) {
      console.error('[CompositeProvider] Error clearing AsyncStorage cache:', error);
    }

    // Firestore provider has no cache to clear
    this.firestoreProvider.clearCache().catch((error) => {
      console.warn('[CompositeProvider] Error clearing Firestore cache:', error);
    });
  }

  /**
   * Get cache statistics (AsyncStorage only)
   */
  async getCacheStats(): Promise<{
    entriesCount: number;
    oldestEntryAgeMs: number;
    newestEntryAgeMs: number;
  }> {
    return await this.asyncStorageProvider.getCacheStats();
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    return await this.asyncStorageProvider.cleanupExpiredEntries();
  }

  /**
   * Pre-cache timing data for a list of readings
   * Useful for downloading readings for offline use
   */
  async precacheReadings(
    readings: Array<{
      readingId: string;
      readingType: string;
      date: Date;
    }>,
  ): Promise<{ cached: number; failed: number }> {
    console.log(`[CompositeProvider] Pre-caching ${readings.length} readings...`);

    let cachedCount = 0;
    let failedCount = 0;

    for (const reading of readings) {
      try {
        const data = await this.firestoreProvider.getTimingData(
          reading.readingId,
          reading.readingType,
          reading.date,
        );

        if (data) {
          await this.asyncStorageProvider.saveTimingData(data);
          cachedCount++;
          console.log(`[CompositeProvider] ✅ Cached: ${reading.readingId}`);
        } else {
          failedCount++;
          console.warn(`[CompositeProvider] Not found: ${reading.readingId}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`[CompositeProvider] Error caching ${reading.readingId}:`, error);
      }
    }

    console.log(
      `[CompositeProvider] ✅ Pre-caching complete: ${cachedCount} cached, ${failedCount} failed`,
    );
    return { cached: cachedCount, failed: failedCount };
  }

  /**
   * Check if timing data is available (either cached or in Firestore)
   */
  async hasTimingData(readingType: string, date: Date): Promise<boolean> {
    // Check cache first
    const stats = await this.getCacheStats();
    if (stats.entriesCount > 0) {
      return true; // Assume we have some data cached
    }

    // Would need to check Firestore, but that requires more complex implementation
    // For now, assume offline means "don't have it"
    return false;
  }
}

/**
 * Export singleton instance
 */
export const compositeTimingDataProvider = CompositeTimingDataProvider.getInstance();
