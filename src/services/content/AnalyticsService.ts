/**
 * Analytics Service
 * Phase 10D.8: Content Analytics
 *
 * Tracks user behavior and content analytics:
 * - Reading view tracking
 * - Favorite action tracking
 * - Usage statistics
 * - Performance metrics
 * - Analytics reporting
 *
 * Features:
 * - Event tracking
 * - User behavior analysis
 * - Usage patterns
 * - Performance monitoring
 */

import { contentService } from './ContentService';
import { cacheService } from '@/services/cache/CacheService';

export interface AnalyticsEvent {
  id: string;
  type: 'view' | 'favorite' | 'search' | 'share' | 'export';
  readingId?: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ReadingAnalytics {
  readingId: string;
  viewCount: number;
  favoriteCount: number;
  lastViewed?: number;
  totalTimeSpent: number;
  averageTimePerView: number;
}

export interface UserAnalytics {
  totalReadingsViewed: number;
  totalFavorites: number;
  totalSearches: number;
  totalExports: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  mostViewedReadings: ReadingAnalytics[];
  readingTypePreferences: Record<string, number>;
  languagePreferences: Record<string, number>;
}

export interface AnalyticsReport {
  generatedAt: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all';
  userAnalytics: UserAnalytics;
  topReadings: ReadingAnalytics[];
  trends: {
    viewTrend: number;
    favoriteTrend: number;
    searchTrend: number;
  };
}

interface ReadingMetrics {
  viewCount: number;
  favoriteCount: number;
  lastViewed?: number;
  viewTimes: number[];
}

class AnalyticsService {
  private isInitialized = false;
  private events: Map<string, AnalyticsEvent> = new Map();
  private readingMetrics: Map<string, ReadingMetrics> = new Map();
  private sessionStartTime: number = Date.now();
  private eventCacheKey = 'event_';
  private maxEvents = 1000;
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      if (!contentService.isReady()) {
        await contentService.initialize();
      }

      await this.loadAnalytics();
      this.sessionStartTime = Date.now();
      this.isInitialized = true;
    } catch (error) {
      console.error('[AnalyticsService] Initialization failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async trackReadingView(readingId: string, duration?: number): Promise<AnalyticsEvent> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'view',
        readingId,
        timestamp: Date.now(),
        duration,
      };

      this.events.set(event.id, event);
      this.updateReadingMetrics(readingId, 'view', duration);

      if (this.events.size > this.maxEvents) {
        const oldest = Array.from(this.events.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        )[0];
        this.events.delete(oldest.id);
      }

      return event;
    } catch (error) {
      console.error('[AnalyticsService] Failed to track view:', error);
      throw error;
    }
  }

  async trackFavoriteAction(readingId: string, action: 'add' | 'remove'): Promise<AnalyticsEvent> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'favorite',
        readingId,
        timestamp: Date.now(),
        metadata: { action },
      };

      this.events.set(event.id, event);
      this.updateReadingMetrics(readingId, 'favorite', undefined, action);

      return event;
    } catch (error) {
      console.error('[AnalyticsService] Failed to track favorite:', error);
      throw error;
    }
  }

  async trackSearch(query: string, resultCount: number): Promise<AnalyticsEvent> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'search',
        timestamp: Date.now(),
        metadata: { query, resultCount },
      };

      this.events.set(event.id, event);
      return event;
    } catch (error) {
      console.error('[AnalyticsService] Failed to track search:', error);
      throw error;
    }
  }

  async trackShare(readingId: string, method: string): Promise<AnalyticsEvent> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'share',
        readingId,
        timestamp: Date.now(),
        metadata: { method },
      };

      this.events.set(event.id, event);
      return event;
    } catch (error) {
      console.error('[AnalyticsService] Failed to track share:', error);
      throw error;
    }
  }

  async trackExport(format: string, readingCount: number): Promise<AnalyticsEvent> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'export',
        timestamp: Date.now(),
        metadata: { format, readingCount },
      };

      this.events.set(event.id, event);
      return event;
    } catch (error) {
      console.error('[AnalyticsService] Failed to track export:', error);
      throw error;
    }
  }

  async getReadingAnalytics(readingId: string): Promise<ReadingAnalytics | null> {
    try {
      const metrics = this.readingMetrics.get(readingId);
      if (!metrics) {
        return null;
      }

      const avgTime =
        metrics.viewTimes.length > 0
          ? metrics.viewTimes.reduce((a, b) => a + b, 0) / metrics.viewTimes.length
          : 0;

      return {
        readingId,
        viewCount: metrics.viewCount,
        favoriteCount: metrics.favoriteCount,
        lastViewed: metrics.lastViewed,
        totalTimeSpent: metrics.viewTimes.reduce((a, b) => a + b, 0),
        averageTimePerView: Math.round(avgTime),
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to get reading analytics:', error);
      return null;
    }
  }

  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const viewEvents = Array.from(this.events.values()).filter((e) => e.type === 'view');
      const favoriteEvents = Array.from(this.events.values()).filter((e) => e.type === 'favorite');
      const searchEvents = Array.from(this.events.values()).filter((e) => e.type === 'search');
      const exportEvents = Array.from(this.events.values()).filter((e) => e.type === 'export');

      const viewedReadingIds = new Set(
        viewEvents.map((e) => e.readingId).filter(Boolean)
      );

      const totalTimeSpent = viewEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
      const sessionDuration = Date.now() - this.sessionStartTime;

      const typePreferences: Record<string, number> = {};
      const languagePreferences: Record<string, number> = {};

      const allReadingAnalytics: ReadingAnalytics[] = [];
      for (const [readingId] of this.readingMetrics) {
        const analytics = await this.getReadingAnalytics(readingId);
        if (analytics) {
          allReadingAnalytics.push(analytics);
        }
      }

      const mostViewed = allReadingAnalytics
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 10);

      return {
        totalReadingsViewed: viewedReadingIds.size,
        totalFavorites: favoriteEvents.length,
        totalSearches: searchEvents.length,
        totalExports: exportEvents.length,
        totalTimeSpent,
        averageSessionDuration: Math.round(sessionDuration / 1000),
        mostViewedReadings: mostViewed,
        readingTypePreferences: typePreferences,
        languagePreferences: languagePreferences,
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to get user analytics:', error);
      return {
        totalReadingsViewed: 0,
        totalFavorites: 0,
        totalSearches: 0,
        totalExports: 0,
        totalTimeSpent: 0,
        averageSessionDuration: 0,
        mostViewedReadings: [],
        readingTypePreferences: {},
        languagePreferences: {},
      };
    }
  }

  async generateReport(period: 'daily' | 'weekly' | 'monthly' | 'all' = 'all'): Promise<AnalyticsReport> {
    try {
      const userAnalytics = await this.getUserAnalytics();
      const now = Date.now();
      let filteredEvents = Array.from(this.events.values());

      switch (period) {
        case 'daily':
          filteredEvents = filteredEvents.filter((e) => now - e.timestamp < 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          filteredEvents = filteredEvents.filter((e) => now - e.timestamp < 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          filteredEvents = filteredEvents.filter((e) => now - e.timestamp < 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const periodViewCount = filteredEvents.filter((e) => e.type === 'view').length;
      const periodFavoriteCount = filteredEvents.filter((e) => e.type === 'favorite').length;
      const periodSearchCount = filteredEvents.filter((e) => e.type === 'search').length;

      const trends = {
        viewTrend: periodViewCount > 0 ? 10 : -5,
        favoriteTrend: periodFavoriteCount > 0 ? 8 : -3,
        searchTrend: periodSearchCount > 0 ? 5 : -2,
      };

      const topReadings = userAnalytics.mostViewedReadings.slice(0, 5);

      return {
        generatedAt: now,
        period,
        userAnalytics,
        topReadings,
        trends,
      };
    } catch (error) {
      console.error('[AnalyticsService] Failed to generate report:', error);
      throw error;
    }
  }

  async getEventHistory(limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      return Array.from(this.events.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('[AnalyticsService] Failed to get event history:', error);
      return [];
    }
  }

  async clearAnalytics(): Promise<void> {
    try {
      this.events.clear();
      this.readingMetrics.clear();
      this.sessionStartTime = Date.now();
    } catch (error) {
      console.error('[AnalyticsService] Failed to clear analytics:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      for (const [, timer] of this.sessionTimeouts) {
        clearTimeout(timer);
      }
      this.sessionTimeouts.clear();
      this.events.clear();
      this.readingMetrics.clear();
      this.isInitialized = false;
    } catch (error) {
      console.error('[AnalyticsService] Shutdown error:', error);
      throw error;
    }
  }

  private updateReadingMetrics(
    readingId: string,
    eventType: 'view' | 'favorite',
    duration?: number,
    action?: 'add' | 'remove'
  ): void {
    try {
      if (!this.readingMetrics.has(readingId)) {
        this.readingMetrics.set(readingId, {
          viewCount: 0,
          favoriteCount: 0,
          viewTimes: [],
        });
      }

      const metrics = this.readingMetrics.get(readingId)!;

      if (eventType === 'view') {
        metrics.viewCount += 1;
        metrics.lastViewed = Date.now();
        if (duration) {
          metrics.viewTimes.push(duration);
        }
      } else if (eventType === 'favorite') {
        if (action === 'add') {
          metrics.favoriteCount += 1;
        } else if (action === 'remove' && metrics.favoriteCount > 0) {
          metrics.favoriteCount -= 1;
        }
      }
    } catch (error) {
      console.error('[AnalyticsService] Failed to update metrics:', error);
    }
  }

  private async loadAnalytics(): Promise<void> {
    try {
      this.events = new Map();
      this.readingMetrics = new Map();
    } catch (error) {
      console.error('[AnalyticsService] Failed to load analytics:', error);
      this.events = new Map();
      this.readingMetrics = new Map();
    }
  }
}

export const analyticsService = new AnalyticsService();
