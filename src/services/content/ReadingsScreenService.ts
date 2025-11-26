/**
 * Readings Screen Service
 * Phase 10D.5: Screen Data Aggregation
 *
 * Aggregates content for readings screen display:
 * - Featured readings
 * - Today's readings
 * - Reading recommendations
 * - Screen data refresh
 *
 * Features:
 * - Screen-specific data queries
 * - Featured content
 * - Daily readings
 * - Smart recommendations
 * - Data caching
 */

import { contentService, ContentSearchResult } from './ContentService';
import { favoritesService, FavoritesStats } from './FavoritesService';
import { contentDatabaseService, ContentReading } from './ContentDatabaseService';
import { cacheService } from '@/services/cache/CacheService';

export interface ReadingsScreenData {
  featured: ContentReading[];
  today: ContentReading[];
  recommended: ContentReading[];
  favorites: FavoritesStats;
  lastRefreshed: number;
}

export interface FeaturedReadingsData {
  title: string;
  description: string;
  readings: ContentReading[];
  category: 'popular' | 'trending' | 'featured';
}

export interface ScreenSection {
  id: string;
  title: string;
  description?: string;
  readings: ContentReading[];
  type: 'featured' | 'today' | 'recommended' | 'favorites';
  refreshInterval: number; // milliseconds
}

interface CachedScreenData {
  data: ReadingsScreenData;
  timestamp: number;
}

class ReadingsScreenService {
  private isInitialized = false;
  private cachedData: Map<string, CachedScreenData> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private screenCacheKey = 'screen_data_';
  private defaultCacheDuration = 5 * 60 * 1000; // 5 minutes
  private featuredReadingCount = 5;
  private recommendedReadingCount = 5;

  /**
   * Initialize readings screen service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[ReadingsScreenService] Already initialized');
        return;
      }

      // Ensure all dependencies are ready
      if (!contentService.isReady()) {
        await contentService.initialize();
      }
      if (!favoritesService.isReady()) {
        await favoritesService.initialize();
      }

      this.isInitialized = true;
      console.log('[ReadingsScreenService] Initialized');
    } catch (error) {
      console.error('[ReadingsScreenService] Initialization failed:', error);
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
   * Initialize screen with all data sections
   */
  async initializeScreen(screenId: string = 'main'): Promise<ReadingsScreenData> {
    try {
      // Check cache first
      const cached = this.cachedData.get(screenId);
      if (cached && Date.now() - cached.timestamp < this.defaultCacheDuration) {
        console.log('[ReadingsScreenService] Using cached screen data:', screenId);
        return cached.data;
      }

      // Fetch all screen data in parallel
      const [featured, today, recommended, favorites] = await Promise.all([
        this.getFeaturedReadings(),
        this.getTodayReadings(),
        this.getRecommendedReadings(),
        favoritesService.getStatistics(),
      ]);

      const screenData: ReadingsScreenData = {
        featured,
        today,
        recommended,
        favorites,
        lastRefreshed: Date.now(),
      };

      // Cache the data
      this.cachedData.set(screenId, {
        data: screenData,
        timestamp: Date.now(),
      });

      // Cache in service
      await cacheService.cachePracticeSession?.({
        id: `${this.screenCacheKey}${screenId}`,
        user_id: 'system',
        reading_id: 'screen_data',
        recording_uri: null,
        result: screenData,
        timestamp: Date.now(),
      });

      console.log('[ReadingsScreenService] Initialized screen:', screenId);
      return screenData;
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to initialize screen:', error);
      throw error;
    }
  }

  /**
   * Get featured readings
   */
  async getFeaturedReadings(): Promise<ContentReading[]> {
    try {
      // Get popular readings (most favorited)
      const featured = await contentService.getPopularReadings(this.featuredReadingCount);

      console.log('[ReadingsScreenService] Got', featured.length, 'featured readings');
      return featured;
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to get featured readings:', error);
      return [];
    }
  }

  /**
   * Get today's readings
   */
  async getTodayReadings(): Promise<ContentReading[]> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Get readings for today
      const todayReadings = await contentService.getReadingsForDate(today);

      console.log('[ReadingsScreenService] Got', todayReadings.length, 'today\'s readings');
      return todayReadings;
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to get today\'s readings:', error);
      return [];
    }
  }

  /**
   * Get recommended readings
   */
  async getRecommendedReadings(userId?: string): Promise<ContentReading[]> {
    try {
      // Get content recommendations
      const recommendations = await contentService.getRecommendations(userId);

      // Extract readings from recommendations
      const readings = recommendations
        .slice(0, this.recommendedReadingCount)
        .map((rec) => rec.reading);

      console.log('[ReadingsScreenService] Got', readings.length, 'recommended readings');
      return readings;
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get screen sections
   */
  async getScreenSections(screenId: string = 'main'): Promise<ScreenSection[]> {
    try {
      const screenData = await this.initializeScreen(screenId);

      const sections: ScreenSection[] = [];

      // Featured section
      if (screenData.featured.length > 0) {
        sections.push({
          id: 'featured',
          title: 'Featured Readings',
          description: 'Popular and trending readings',
          readings: screenData.featured,
          type: 'featured',
          refreshInterval: 60 * 60 * 1000, // 1 hour
        });
      }

      // Today section
      if (screenData.today.length > 0) {
        sections.push({
          id: 'today',
          title: 'Today\'s Readings',
          description: 'Readings for today',
          readings: screenData.today,
          type: 'today',
          refreshInterval: 24 * 60 * 60 * 1000, // 1 day
        });
      }

      // Recommended section
      if (screenData.recommended.length > 0) {
        sections.push({
          id: 'recommended',
          title: 'Recommended for You',
          description: 'Personalized recommendations',
          readings: screenData.recommended,
          type: 'recommended',
          refreshInterval: 2 * 60 * 60 * 1000, // 2 hours
        });
      }

      console.log('[ReadingsScreenService] Generated', sections.length, 'sections');
      return sections;
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to get sections:', error);
      return [];
    }
  }

  /**
   * Refresh screen data
   */
  async refreshScreen(screenId: string = 'main'): Promise<ReadingsScreenData> {
    try {
      // Clear cache for this screen
      this.cachedData.delete(screenId);

      // Reinitialize
      const refreshed = await this.initializeScreen(screenId);

      console.log('[ReadingsScreenService] Refreshed screen:', screenId);
      return refreshed;
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to refresh screen:', error);
      throw error;
    }
  }

  /**
   * Set up auto-refresh for a screen
   */
  setupAutoRefresh(
    screenId: string = 'main',
    interval: number = this.defaultCacheDuration
  ): void {
    try {
      // Clear existing timer
      if (this.refreshIntervals.has(screenId)) {
        clearInterval(this.refreshIntervals.get(screenId));
      }

      // Set new timer
      const timerId = setInterval(async () => {
        try {
          await this.refreshScreen(screenId);
        } catch (error) {
          console.error('[ReadingsScreenService] Auto-refresh failed:', error);
        }
      }, interval);

      this.refreshIntervals.set(screenId, timerId);
      console.log('[ReadingsScreenService] Set auto-refresh interval:', screenId, interval);
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to setup auto-refresh:', error);
    }
  }

  /**
   * Cancel auto-refresh for a screen
   */
  cancelAutoRefresh(screenId: string = 'main'): void {
    try {
      if (this.refreshIntervals.has(screenId)) {
        clearInterval(this.refreshIntervals.get(screenId));
        this.refreshIntervals.delete(screenId);
        console.log('[ReadingsScreenService] Cancelled auto-refresh:', screenId);
      }
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to cancel auto-refresh:', error);
    }
  }

  /**
   * Search within screen context
   */
  async searchReadingsOnScreen(
    query: string,
    screenId: string = 'main'
  ): Promise<ContentSearchResult> {
    try {
      return await contentService.searchReadings({
        query,
        limit: 20,
      });
    } catch (error) {
      console.error('[ReadingsScreenService] Search failed:', error);
      return {
        readings: [],
        total: 0,
        hasMore: false,
        offset: 0,
        limit: 20,
        executionTime: 0,
      };
    }
  }

  /**
   * Get screen statistics
   */
  async getScreenStatistics(screenId: string = 'main'): Promise<{
    totalFeatured: number;
    totalToday: number;
    totalRecommended: number;
    totalFavorites: number;
    lastRefreshed: number;
  }> {
    try {
      const screenData = await this.initializeScreen(screenId);

      return {
        totalFeatured: screenData.featured.length,
        totalToday: screenData.today.length,
        totalRecommended: screenData.recommended.length,
        totalFavorites: screenData.favorites.totalFavorites,
        lastRefreshed: screenData.lastRefreshed,
      };
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to get statistics:', error);
      return {
        totalFeatured: 0,
        totalToday: 0,
        totalRecommended: 0,
        totalFavorites: 0,
        lastRefreshed: 0,
      };
    }
  }

  /**
   * Clear all cached screen data
   */
  async clearCache(): Promise<void> {
    try {
      this.cachedData.clear();
      console.log('[ReadingsScreenService] Cache cleared');
    } catch (error) {
      console.error('[ReadingsScreenService] Failed to clear cache:', error);
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      // Clear all refresh timers
      for (const [screenId, timerId] of this.refreshIntervals) {
        clearInterval(timerId);
      }
      this.refreshIntervals.clear();
      this.cachedData.clear();
      this.isInitialized = false;
      console.log('[ReadingsScreenService] Shutdown complete');
    } catch (error) {
      console.error('[ReadingsScreenService] Shutdown error:', error);
      throw error;
    }
  }

  // ============ Private Methods ============

  /**
   * Check if cache is still valid
   */
  private isCacheValid(screenId: string): boolean {
    const cached = this.cachedData.get(screenId);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.defaultCacheDuration;
  }

  /**
   * Get cache expiry time
   */
  private getCacheExpiry(screenId: string): number {
    const cached = this.cachedData.get(screenId);
    if (!cached) return 0;
    const age = Date.now() - cached.timestamp;
    const remaining = Math.max(0, this.defaultCacheDuration - age);
    return remaining;
  }
}

// Export singleton
export const readingsScreenService = new ReadingsScreenService();
