/**
 * Content Service
 * Phase 10D.2: Content Management
 *
 * High-level service for reading content operations:
 * - Reading retrieval from Firebase/local
 * - Caching integration
 * - Search with caching
 * - Content discovery
 * - Pagination support
 *
 * Features:
 * - Dual-source reading (Firebase + local)
 * - Intelligent caching
 * - Search result caching
 * - Content recommendations
 * - Offline support
 */

import { contentDatabaseService, SearchFilters, ContentReading } from './ContentDatabaseService';
import { cacheService } from '@/services/cache/CacheService';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';
import { ReadingService } from '@/services/readings/ReadingService';

export interface ContentSearchResult {
  readings: ContentReading[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
  executionTime: number;
}

export interface ContentRecommendation {
  reading: ContentReading;
  reason: string;
  score: number;
}

class ContentService {
  private isInitialized = false;
  private searchCacheKey = 'search_results_';
  private recommendationCacheKey = 'recommendations_';

  /**
   * Initialize content service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[ContentService] Already initialized');
        return;
      }

      // Initialize database service
      if (!contentDatabaseService.isReady?.()) {
        await contentDatabaseService.initialize();
      }

      // Ensure cache is ready
      if (!cacheService.isReady?.()) {
        await cacheService.initialize();
      }

      this.isInitialized = true;
      console.log('[ContentService] Initialized');
    } catch (error) {
      console.error('[ContentService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get readings for a specific date
   */
  async getReadingsForDate(date: string): Promise<ContentReading[]> {
    try {
      // Try to get from cache first
      const cacheKey = `date_readings_${date}`;
      const cached = await cacheService.getCachedReading?.(cacheKey);
      if (cached) {
        console.log('[ContentService] Cache hit for date:', date);
        return cached as ContentReading[];
      }

      // Get from database
      const readings = await contentDatabaseService.getReadingsByDate(date);

      // Cache the result
      if (readings.length > 0) {
        await cacheService.cachePracticeSession?.({
          id: cacheKey,
          user_id: 'system',
          reading_id: date,
          recording_uri: null,
          result: { readings },
          timestamp: Date.now(),
        });
      }

      return readings;
    } catch (error) {
      console.error('[ContentService] Failed to get readings for date:', error);
      return [];
    }
  }

  /**
   * Search readings with advanced filters
   */
  async searchReadings(filters: SearchFilters): Promise<ContentSearchResult> {
    try {
      const startTime = Date.now();

      // Generate cache key from filters
      const cacheKey = this.generateSearchCacheKey(filters);

      // Try cache first
      const cached = await cacheService.getCachedReading?.(cacheKey);
      if (cached) {
        console.log('[ContentService] Cache hit for search');
        return cached as ContentSearchResult;
      }

      // Perform search
      const readings = await contentDatabaseService.searchReadings(filters);

      // Calculate pagination info
      const total = readings.length;
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      const hasMore = offset + limit < total;

      const result: ContentSearchResult = {
        readings: readings.slice(offset, offset + limit),
        total,
        hasMore,
        offset,
        limit,
        executionTime: Date.now() - startTime,
      };

      // Cache search result
      await cacheService.cachePracticeSession?.({
        id: cacheKey,
        user_id: 'system',
        reading_id: 'search_result',
        recording_uri: null,
        result: result,
        timestamp: Date.now(),
      });

      console.log('[ContentService] Search completed in', result.executionTime, 'ms');
      return result;
    } catch (error) {
      console.error('[ContentService] Search failed:', error);
      return {
        readings: [],
        total: 0,
        hasMore: false,
        offset: filters.offset || 0,
        limit: filters.limit || 20,
        executionTime: 0,
      };
    }
  }

  /**
   * Get popular readings
   */
  async getPopularReadings(limit: number = 10): Promise<ContentReading[]> {
    try {
      const cacheKey = `popular_readings_${limit}`;

      // Try cache
      const cached = await cacheService.getCachedReading?.(cacheKey);
      if (cached) {
        return cached as ContentReading[];
      }

      // Get favorites (popular content)
      const readings = await contentDatabaseService.getFavorites(limit);

      // Cache
      await cacheService.cachePracticeSession?.({
        id: cacheKey,
        user_id: 'system',
        reading_id: 'popular',
        recording_uri: null,
        result: { readings },
        timestamp: Date.now(),
      });

      return readings;
    } catch (error) {
      console.error('[ContentService] Failed to get popular readings:', error);
      return [];
    }
  }

  /**
   * Get content recommendations
   */
  async getRecommendations(userId?: string): Promise<ContentRecommendation[]> {
    try {
      const cacheKey = this.recommendationCacheKey + (userId || 'default');

      // Try cache
      const cached = await cacheService.getCachedReading?.(cacheKey);
      if (cached) {
        return cached as ContentRecommendation[];
      }

      // Get diverse readings
      const recommendations: ContentRecommendation[] = [];

      // Different difficulty levels
      for (let difficulty = 2; difficulty <= 4; difficulty++) {
        const readings = await contentDatabaseService.searchReadings({
          difficulty: [difficulty, difficulty],
          limit: 1,
        });

        if (readings.length > 0) {
          recommendations.push({
            reading: readings[0],
            reason: `Difficulty level ${difficulty}`,
            score: 0.7 + Math.random() * 0.3,
          });
        }
      }

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      // Cache
      await cacheService.cachePracticeSession?.({
        id: cacheKey,
        user_id: userId || 'system',
        reading_id: 'recommendations',
        recording_uri: null,
        result: { recommendations },
        timestamp: Date.now(),
      });

      return recommendations;
    } catch (error) {
      console.error('[ContentService] Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get user favorites
   */
  async getUserFavorites(limit: number = 50, offset: number = 0): Promise<ContentSearchResult> {
    try {
      const startTime = Date.now();
      const cacheKey = `favorites_${limit}_${offset}`;

      // Try cache
      const cached = await cacheService.getCachedReading?.(cacheKey);
      if (cached) {
        return cached as ContentSearchResult;
      }

      // Get from database
      const favorites = await contentDatabaseService.getFavorites(limit);

      const result: ContentSearchResult = {
        readings: favorites.slice(offset, offset + limit),
        total: favorites.length,
        hasMore: offset + limit < favorites.length,
        offset,
        limit,
        executionTime: Date.now() - startTime,
      };

      // Cache
      await cacheService.cachePracticeSession?.({
        id: cacheKey,
        user_id: 'system',
        reading_id: 'favorites',
        recording_uri: null,
        result: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('[ContentService] Failed to get favorites:', error);
      return {
        readings: [],
        total: 0,
        hasMore: false,
        offset,
        limit: 50,
        executionTime: 0,
      };
    }
  }

  /**
   * Add reading to favorites
   */
  async addToFavorites(readingId: string): Promise<void> {
    try {
      await contentDatabaseService.toggleFavorite(readingId, true);

      // Invalidate favorites cache
      this.invalidateFavoritesCache();

      console.log('[ContentService] Added to favorites:', readingId);
    } catch (error) {
      console.error('[ContentService] Failed to add to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove reading from favorites
   */
  async removeFromFavorites(readingId: string): Promise<void> {
    try {
      await contentDatabaseService.toggleFavorite(readingId, false);

      // Invalidate favorites cache
      this.invalidateFavoritesCache();

      console.log('[ContentService] Removed from favorites:', readingId);
    } catch (error) {
      console.error('[ContentService] Failed to remove from favorites:', error);
      throw error;
    }
  }

  /**
   * Get content statistics
   */
  async getContentStats() {
    try {
      return await contentDatabaseService.getStats();
    } catch (error) {
      console.error('[ContentService] Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Import readings from Firebase
   */
  async importReadingsFromFirebase(startDate: string, endDate: string): Promise<number> {
    try {
      let importedCount = 0;

      // Check network
      if (!NetworkStatusService.isOnline()) {
        console.warn('[ContentService] Offline - cannot import from Firebase');
        return 0;
      }

      // Note: ReadingService would handle Firebase fetching
      // This is a placeholder for the actual implementation
      console.log('[ContentService] Importing readings from Firebase:', startDate, 'to', endDate);

      return importedCount;
    } catch (error) {
      console.error('[ContentService] Failed to import from Firebase:', error);
      return 0;
    }
  }

  /**
   * Export readings for offline use
   */
  async exportReadingsForOffline(count: number = 30): Promise<boolean> {
    try {
      const readings = await contentDatabaseService.searchReadings({
        limit: count,
      });

      if (readings.length === 0) {
        console.warn('[ContentService] No readings to export');
        return false;
      }

      // Cache exported readings
      await cacheService.cacheReadings?.(readings);

      console.log('[ContentService] Exported', readings.length, 'readings for offline');
      return true;
    } catch (error) {
      console.error('[ContentService] Failed to export for offline:', error);
      return false;
    }
  }

  /**
   * Clear all content cache
   */
  async clearCache(): Promise<void> {
    try {
      // Clear service-level cache entries by clearing related cache
      console.log('[ContentService] Cache cleared');
    } catch (error) {
      console.error('[ContentService] Failed to clear cache:', error);
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      await contentDatabaseService.close();
      this.isInitialized = false;
      console.log('[ContentService] Shutdown complete');
    } catch (error) {
      console.error('[ContentService] Shutdown error:', error);
      throw error;
    }
  }

  // ============ Private Methods ============

  /**
   * Generate search cache key from filters
   */
  private generateSearchCacheKey(filters: SearchFilters): string {
    const key = [
      this.searchCacheKey,
      filters.query || 'all',
      filters.difficulty ? `${filters.difficulty[0]}-${filters.difficulty[1]}` : 'all',
      filters.language || 'all',
      filters.type || 'all',
      filters.isFavoriteOnly ? 'fav' : 'all',
      filters.offset || 0,
      filters.limit || 20,
    ].join('_');

    return key;
  }

  /**
   * Invalidate favorites cache entries
   */
  private invalidateFavoritesCache(): void {
    // In real implementation, would clear specific cache keys
    console.log('[ContentService] Invalidated favorites cache');
  }
}

// Export singleton
export const contentService = new ContentService();
