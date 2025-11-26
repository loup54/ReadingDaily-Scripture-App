/**
 * Storage Quota Service
 * Monitors and manages AsyncStorage quota to prevent storage overflow
 * Tracks cache usage by category and provides cleanup recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingDownloadService } from '@/services/offline/ReadingDownloadService';
import { CacheService } from '@/services/cache/CacheService';

export interface StorageQuota {
  used: number; // bytes
  available: number; // bytes
  total: number; // bytes
  percentage: number; // 0-100
}

export interface StorageCategory {
  category: string;
  size: number; // bytes
  percentage: number;
  itemCount: number;
}

export interface StorageAlert {
  level: 'warning' | 'critical';
  message: string;
  suggestedAction: string;
}

const DEFAULT_MAX_STORAGE_MB = 50; // 50MB limit for offline data

/**
 * Service for managing AsyncStorage quota
 */
export class StorageQuotaService {
  private static readonly STORAGE_KEY_PREFIXES = {
    offlineReadings: '@offline_readings_',
    audioCache: '@audio_cache_',
    translationCache: '@translation_cache_',
    practiceHistory: '@practice_',
    settings: 'settings-',
    auth: 'auth-',
    theme: 'THEME_',
  };

  /**
   * Get current storage quota usage
   */
  static async getQuota(): Promise<StorageQuota> {
    try {
      const used = await this.getTotalStorageUsed();
      const maxStorage = DEFAULT_MAX_STORAGE_MB * 1024 * 1024;

      return {
        used,
        available: Math.max(0, maxStorage - used),
        total: maxStorage,
        percentage: Math.round((used / maxStorage) * 100),
      };
    } catch (error) {
      console.error('[StorageQuotaService] Error getting quota:', error);
      return {
        used: 0,
        available: DEFAULT_MAX_STORAGE_MB * 1024 * 1024,
        total: DEFAULT_MAX_STORAGE_MB * 1024 * 1024,
        percentage: 0,
      };
    }
  }

  /**
   * Get storage breakdown by category
   */
  static async getStorageByCategory(): Promise<StorageCategory[]> {
    try {
      const categories: Record<string, StorageCategory> = {
        offlineReadings: {
          category: 'Offline Readings',
          size: 0,
          percentage: 0,
          itemCount: 0,
        },
        audioCache: {
          category: 'Audio Cache',
          size: 0,
          percentage: 0,
          itemCount: 0,
        },
        translationCache: {
          category: 'Translation Cache',
          size: 0,
          percentage: 0,
          itemCount: 0,
        },
        practiceHistory: {
          category: 'Practice History',
          size: 0,
          percentage: 0,
          itemCount: 0,
        },
        other: {
          category: 'Other',
          size: 0,
          percentage: 0,
          itemCount: 0,
        },
      };

      const allKeys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of allKeys) {
        const data = await AsyncStorage.getItem(key);
        if (!data) continue;

        const size = data.length;
        totalSize += size;

        // Categorize
        if (key.startsWith(this.STORAGE_KEY_PREFIXES.offlineReadings)) {
          categories.offlineReadings.size += size;
          categories.offlineReadings.itemCount++;
        } else if (key.startsWith(this.STORAGE_KEY_PREFIXES.audioCache)) {
          categories.audioCache.size += size;
          categories.audioCache.itemCount++;
        } else if (key.startsWith(this.STORAGE_KEY_PREFIXES.translationCache)) {
          categories.translationCache.size += size;
          categories.translationCache.itemCount++;
        } else if (key.startsWith(this.STORAGE_KEY_PREFIXES.practiceHistory)) {
          categories.practiceHistory.size += size;
          categories.practiceHistory.itemCount++;
        } else {
          categories.other.size += size;
          categories.other.itemCount++;
        }
      }

      // Calculate percentages
      const result = Object.values(categories).map((cat) => ({
        ...cat,
        percentage:
          totalSize > 0 ? Math.round((cat.size / totalSize) * 100) : 0,
      }));

      // Filter out empty categories
      return result.filter((cat) => cat.size > 0);
    } catch (error) {
      console.error('[StorageQuotaService] Error getting storage by category:', error);
      return [];
    }
  }

  /**
   * Check if storage is below threshold
   */
  static async isStorageCritical(
    thresholdPercent: number = 95
  ): Promise<boolean> {
    const quota = await this.getQuota();
    return quota.percentage >= thresholdPercent;
  }

  /**
   * Get storage alerts
   */
  static async getStorageAlerts(): Promise<StorageAlert[]> {
    const alerts: StorageAlert[] = [];
    const quota = await this.getQuota();

    if (quota.percentage >= 95) {
      alerts.push({
        level: 'critical',
        message: 'Storage is critically low (95%+)',
        suggestedAction:
          'Clear offline readings or old practice history to free up space',
      });
    } else if (quota.percentage >= 80) {
      alerts.push({
        level: 'warning',
        message: 'Storage usage is high (80%+)',
        suggestedAction:
          'Consider clearing old offline readings to maintain device performance',
      });
    }

    return alerts;
  }

  /**
   * Estimate cleanup size for a category
   */
  static async estimateCleanupSize(
    category: 'offlineReadings' | 'audioCache' | 'practiceHistory'
  ): Promise<number> {
    try {
      let size = 0;

      if (category === 'offlineReadings') {
        size = await ReadingDownloadService.getStorageUsed();
      } else if (category === 'audioCache') {
        size = await this.getAudioCacheSize();
      } else if (category === 'practiceHistory') {
        size = await this.getPracticeCacheSize();
      }

      return size;
    } catch (error) {
      console.error('[StorageQuotaService] Error estimating cleanup size:', error);
      return 0;
    }
  }

  /**
   * Suggest cleanup actions
   */
  static async suggestCleanup(): Promise<{
    actions: Array<{ category: string; size: number }>;
    totalFreeable: number;
  }> {
    try {
      const quota = await this.getQuota();

      if (quota.percentage < 80) {
        return { actions: [], totalFreeable: 0 };
      }

      const actions: Array<{ category: string; size: number }> = [];
      let totalFreeable = 0;

      // Suggest clearing old offline readings first
      const readingSize = await this.estimateCleanupSize('offlineReadings');
      if (readingSize > 0) {
        actions.push({
          category: 'Clear offline readings older than 7 days',
          size: readingSize,
        });
        totalFreeable += readingSize;
      }

      // Then audio cache
      const audioSize = await this.estimateCleanupSize('audioCache');
      if (audioSize > 0 && totalFreeable < quota.used * 0.2) {
        actions.push({
          category: 'Clear audio cache',
          size: audioSize,
        });
        totalFreeable += audioSize;
      }

      // Then practice history
      const practiceSize = await this.estimateCleanupSize('practiceHistory');
      if (practiceSize > 0 && totalFreeable < quota.used * 0.3) {
        actions.push({
          category: 'Clear old practice history',
          size: practiceSize,
        });
        totalFreeable += practiceSize;
      }

      return { actions, totalFreeable };
    } catch (error) {
      console.error('[StorageQuotaService] Error suggesting cleanup:', error);
      return { actions: [], totalFreeable: 0 };
    }
  }

  /**
   * Cleanup old offline readings
   */
  static async cleanupOldReadings(daysToKeep: number = 7): Promise<number> {
    try {
      const sizeBefore = await this.getTotalStorageUsed();
      await ReadingDownloadService.clearOldReadings(daysToKeep);
      const sizeAfter = await this.getTotalStorageUsed();
      const freed = Math.max(0, sizeBefore - sizeAfter);

      console.log('[StorageQuotaService] ✅ Cleaned up old readings:', this.formatBytes(freed));
      return freed;
    } catch (error) {
      console.error('[StorageQuotaService] Error cleaning up old readings:', error);
      return 0;
    }
  }

  /**
   * Cleanup all cache
   */
  static async cleanupAllCache(): Promise<number> {
    try {
      const sizeBefore = await this.getTotalStorageUsed();
      await CacheService.clearAllCache();
      const sizeAfter = await this.getTotalStorageUsed();
      const freed = Math.max(0, sizeBefore - sizeAfter);

      console.log('[StorageQuotaService] ✅ Cleaned up all cache:', this.formatBytes(freed));
      return freed;
    } catch (error) {
      console.error('[StorageQuotaService] Error cleaning up cache:', error);
      return 0;
    }
  }

  /**
   * Get total storage used
   */
  private static async getTotalStorageUsed(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of allKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[StorageQuotaService] Error calculating total storage:', error);
      return 0;
    }
  }

  /**
   * Get audio cache size
   */
  private static async getAudioCacheSize(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let size = 0;

      for (const key of allKeys) {
        if (key.startsWith(this.STORAGE_KEY_PREFIXES.audioCache)) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            size += data.length;
          }
        }
      }

      return size;
    } catch (error) {
      console.error('[StorageQuotaService] Error getting audio cache size:', error);
      return 0;
    }
  }

  /**
   * Get practice cache size
   */
  private static async getPracticeCacheSize(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let size = 0;

      for (const key of allKeys) {
        if (key.startsWith(this.STORAGE_KEY_PREFIXES.practiceHistory)) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            size += data.length;
          }
        }
      }

      return size;
    } catch (error) {
      console.error('[StorageQuotaService] Error getting practice cache size:', error);
      return 0;
    }
  }

  /**
   * Format bytes to human-readable size
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
