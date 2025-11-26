/**
 * Cache Service
 * Phase 10A.2: Offline Support & Sync
 *
 * Provides dual-layer caching:
 * - In-memory cache for fast access
 * - SQLite persistence for offline availability
 *
 * Features:
 * - Automatic expiration (TTL)
 * - Periodic cleanup
 * - Filtering support
 * - Memory-first fallback to database
 */

import { databaseService } from '@/services/database/DatabaseService';
import {
  CacheEntry,
  CacheStats,
  CacheConfig,
  ReadingFilterOptions,
} from '@/types/cache.types';
import { PracticeSession } from '@/types/practice.types';

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50 MB
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoCleanup: true,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

export class CacheService {
  private config: CacheConfig = { ...DEFAULT_CONFIG };
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  /**
   * Initialize cache service with optional config override
   */
  async initialize(config?: Partial<CacheConfig>): Promise<void> {
    try {
      if (this.initialized) {
        console.warn('[CacheService] Already initialized');
        return;
      }

      // Merge config
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Ensure database is initialized
      if (!databaseService.isReady?.()) {
        await databaseService.initialize();
      }

      // Start cleanup timer if enabled
      if (this.config.autoCleanup) {
        this.startCleanupTimer();
      }

      this.initialized = true;
      console.log('[CacheService] Initialized with config:', {
        maxSize: this.formatBytes(this.config.maxSize),
        ttl: `${this.config.ttl / 1000 / 60 / 60 / 24} days`,
        autoCleanup: this.config.autoCleanup,
      });
    } catch (error) {
      console.error('[CacheService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Cache a practice session with expiration
   */
  async cachePracticeSession(session: PracticeSession): Promise<void> {
    try {
      const expiresAt = Date.now() + this.config.ttl;
      const entry: CacheEntry<PracticeSession> = {
        key: `session:${session.id}`,
        value: session,
        timestamp: Date.now(),
        expiresAt,
      };

      // Add to memory cache
      this.memoryCache.set(entry.key, entry);

      // Persist to database
      await databaseService.savePracticeSession(session);

      console.log('[CacheService] Cached practice session:', session.id);
    } catch (error) {
      console.error('[CacheService] Failed to cache session:', error);
      throw error;
    }
  }

  /**
   * Get cached practice sessions (memory-first with DB fallback)
   */
  async getCachedSessions(userId?: string): Promise<PracticeSession[]> {
    try {
      const sessions: PracticeSession[] = [];

      // Check memory cache first
      for (const [key, entry] of this.memoryCache.entries()) {
        if (key.startsWith('session:') && !this.isExpired(entry)) {
          const session = entry.value as PracticeSession;
          if (!userId || session.user_id === userId) {
            sessions.push(session);
          }
        }
      }

      // If found in memory, return
      if (sessions.length > 0) {
        return sessions;
      }

      // Fallback to database
      const dbSessions = await databaseService.getUserSessions(userId);
      const validSessions = dbSessions.filter((s) => {
        const expiresAt = s.cached_at ? s.cached_at + this.config.ttl : 0;
        return expiresAt > Date.now();
      });

      // Restore to memory cache
      for (const session of validSessions) {
        const expiresAt = session.cached_at ? session.cached_at + this.config.ttl : Date.now();
        this.memoryCache.set(`session:${session.id}`, {
          key: `session:${session.id}`,
          value: session,
          timestamp: session.cached_at || Date.now(),
          expiresAt,
        });
      }

      return validSessions;
    } catch (error) {
      console.error('[CacheService] Failed to get sessions:', error);
      return [];
    }
  }

  /**
   * Get single cached practice session
   */
  async getCachedSession(sessionId: string): Promise<PracticeSession | null> {
    try {
      const key = `session:${sessionId}`;

      // Check memory cache
      const entry = this.memoryCache.get(key);
      if (entry && !this.isExpired(entry)) {
        return entry.value as PracticeSession;
      }

      // Remove expired entry
      if (entry && this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }

      // Check database
      const session = await databaseService.getCachedReading(sessionId);
      if (session) {
        // Restore to memory
        const expiresAt = Date.now() + this.config.ttl;
        this.memoryCache.set(key, {
          key,
          value: session,
          timestamp: Date.now(),
          expiresAt,
        });
        return session;
      }

      return null;
    } catch (error) {
      console.error('[CacheService] Failed to get session:', error);
      return null;
    }
  }

  /**
   * Cache multiple readings with expiration
   */
  async cacheReadings(readings: any[]): Promise<void> {
    try {
      const expiresAt = Date.now() + this.config.ttl;

      for (const reading of readings) {
        const entry: CacheEntry<any> = {
          key: `reading:${reading.id}`,
          value: reading,
          timestamp: Date.now(),
          expiresAt,
        };

        // Check size before adding
        const size = this.estimateSize(entry);
        if (this.getTotalCacheSize() + size > this.config.maxSize) {
          console.warn('[CacheService] Cache size limit reached, clearing expired entries');
          await this.clearExpiredEntries();
        }

        // Add to memory cache
        this.memoryCache.set(entry.key, entry);
      }

      // Persist all readings to database
      await databaseService.cacheReadings(readings);

      console.log('[CacheService] Cached', readings.length, 'readings');
    } catch (error) {
      console.error('[CacheService] Failed to cache readings:', error);
      throw error;
    }
  }

  /**
   * Get cached readings with optional filtering
   */
  async getCachedReadings(filters?: ReadingFilterOptions): Promise<any[]> {
    try {
      const readings: any[] = [];

      // Check memory cache first
      for (const [key, entry] of this.memoryCache.entries()) {
        if (key.startsWith('reading:') && !this.isExpired(entry)) {
          readings.push(entry.value);
        }
      }

      // Apply filters
      let filtered = readings;
      if (filters) {
        filtered = this.applyFilters(readings, filters);
      }

      if (filtered.length > 0) {
        return filtered;
      }

      // Fallback to database
      const dbReadings = await databaseService.getCachedReadings();
      const validReadings = dbReadings.filter((r) => {
        const expiresAt = r.cached_at ? r.cached_at + this.config.ttl : 0;
        return expiresAt > Date.now();
      });

      // Apply filters
      let finalReadings = validReadings;
      if (filters) {
        finalReadings = this.applyFilters(validReadings, filters);
      }

      // Restore to memory cache
      for (const reading of validReadings) {
        const expiresAt = reading.cached_at ? reading.cached_at + this.config.ttl : Date.now();
        this.memoryCache.set(`reading:${reading.id}`, {
          key: `reading:${reading.id}`,
          value: reading,
          timestamp: reading.cached_at || Date.now(),
          expiresAt,
        });
      }

      return finalReadings;
    } catch (error) {
      console.error('[CacheService] Failed to get readings:', error);
      return [];
    }
  }

  /**
   * Get single cached reading
   */
  async getCachedReading(readingId: string): Promise<any | null> {
    try {
      const key = `reading:${readingId}`;

      // Check memory cache
      const entry = this.memoryCache.get(key);
      if (entry && !this.isExpired(entry)) {
        return entry.value;
      }

      // Remove expired entry
      if (entry && this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }

      // Check database
      const reading = await databaseService.getCachedReading(readingId);
      if (reading) {
        // Restore to memory
        const expiresAt = Date.now() + this.config.ttl;
        this.memoryCache.set(key, {
          key,
          value: reading,
          timestamp: Date.now(),
          expiresAt,
        });
        return reading;
      }

      return null;
    } catch (error) {
      console.error('[CacheService] Failed to get reading:', error);
      return null;
    }
  }

  /**
   * Clear expired entries from both memory and database
   */
  async clearExpiredEntries(): Promise<number> {
    try {
      let removedCount = 0;

      // Clear from memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          removedCount++;
        }
      }

      // Clear from database
      await databaseService.clearExpiredReadings();

      console.log('[CacheService] Cleared', removedCount, 'expired entries');
      return removedCount;
    } catch (error) {
      console.error('[CacheService] Failed to clear expired entries:', error);
      return 0;
    }
  }

  /**
   * Clear entire cache
   */
  async clearCache(): Promise<void> {
    try {
      this.memoryCache.clear();
      await databaseService.clearAll();
      console.log('[CacheService] Cache cleared');
    } catch (error) {
      console.error('[CacheService] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const totalSize = this.getTotalCacheSize();
      const stats: CacheStats = {
        totalEntries: this.memoryCache.size,
        totalSize,
        oldestEntry: null,
        newestEntry: null,
      };

      // Find oldest and newest
      let oldestTs: number | null = null;
      let newestTs: number | null = null;

      for (const entry of this.memoryCache.values()) {
        if (!oldestTs || entry.timestamp < oldestTs) {
          oldestTs = entry.timestamp;
        }
        if (!newestTs || entry.timestamp > newestTs) {
          newestTs = entry.timestamp;
        }
      }

      stats.oldestEntry = oldestTs;
      stats.newestEntry = newestTs;

      return stats;
    } catch (error) {
      console.error('[CacheService] Failed to get stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Shutdown the cache service
   */
  async shutdown(): Promise<void> {
    try {
      this.stopCleanupTimer();
      this.memoryCache.clear();
      await databaseService.close();
      this.initialized = false;
      console.log('[CacheService] Shutdown complete');
    } catch (error) {
      console.error('[CacheService] Shutdown error:', error);
      throw error;
    }
  }

  // ============ Private Helpers ============

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return entry.expiresAt < Date.now();
  }

  /**
   * Estimate size of cache entry in bytes
   */
  private estimateSize(entry: CacheEntry<any>): number {
    try {
      const json = JSON.stringify(entry);
      return json.length * 2; // Rough estimate (2 bytes per char)
    } catch {
      return 0;
    }
  }

  /**
   * Get total cache size
   */
  private getTotalCacheSize(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) {
      total += this.estimateSize(entry);
    }
    return total;
  }

  /**
   * Apply filters to readings
   */
  private applyFilters(readings: any[], filters: ReadingFilterOptions): any[] {
    return readings.filter((reading) => {
      // Difficulty filter
      if (filters.difficulty) {
        const [min, max] = filters.difficulty;
        if (reading.difficulty < min || reading.difficulty > max) {
          return false;
        }
      }

      // Language filter
      if (filters.language && reading.language !== filters.language) {
        return false;
      }

      // Word count filters
      if (filters.minWords && reading.word_count < filters.minWords) {
        return false;
      }
      if (filters.maxWords && reading.word_count > filters.maxWords) {
        return false;
      }

      // Categories filter
      if (filters.categories && reading.categories) {
        const hasCategory = reading.categories.some((cat: string) =>
          filters.categories?.includes(cat)
        );
        if (!hasCategory) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.clearExpiredEntries().catch((err) => {
        console.error('[CacheService] Cleanup timer error:', err);
      });
    }, this.config.cleanupInterval);

    console.log('[CacheService] Cleanup timer started');
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
      console.log('[CacheService] Cleanup timer stopped');
    }
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const cacheService = new CacheService();
