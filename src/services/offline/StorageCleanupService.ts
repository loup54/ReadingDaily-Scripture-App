/**
 * Storage Cleanup Service
 * Manages storage quota and cleans up expired offline data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingDownloadService } from './ReadingDownloadService';
import { AudioPlaybackService } from '@/services/audio/AudioPlaybackService';
import { TranslationService, getTranslationService } from '@/services/translation/TranslationService';

export interface StorageStats {
  readingsBytes: number;
  audioBytes: number;
  translationsBytes: number;
  totalBytes: number;
  totalMB: number;
  readingCount: number;
  audioFileCount: number;
}

/**
 * Service for managing offline storage cleanup and quota
 */
export class StorageCleanupService {
  private static readonly MAX_STORAGE_MB = 50;
  private static readonly WARNING_THRESHOLD_PERCENT = 80;
  private static readonly CLEANUP_THRESHOLD_PERCENT = 90;

  /**
   * Get detailed storage statistics
   */
  static async getStorageStats(): Promise<StorageStats> {
    try {
      const readingsBytes = await ReadingDownloadService.getStorageUsed();

      // Get audio cache stats
      let audioBytes = 0;
      let audioFileCount = 0;
      try {
        const audioIndexJson = await AsyncStorage.getItem('@audio_cache_index');
        if (audioIndexJson) {
          const audioIndex = JSON.parse(audioIndexJson);
          audioFileCount = Object.keys(audioIndex).length;

          // Estimate audio bytes (roughly 100KB per file average)
          audioBytes = audioFileCount * 100000;
        }
      } catch (error) {
        console.warn('[StorageCleanupService] Error getting audio stats:', error);
      }

      // Get translation cache stats
      let translationsBytes = 0;
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const translationKeys = allKeys.filter((key) => key.startsWith('@translation_cache_'));

        for (const key of translationKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            translationsBytes += data.length;
          }
        }
      } catch (error) {
        console.warn('[StorageCleanupService] Error getting translation stats:', error);
      }

      const totalBytes = readingsBytes + audioBytes + translationsBytes;
      const totalMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;

      // Get reading count
      const readingDates = await ReadingDownloadService.getDownloadedDates();
      const readingCount = readingDates.length;

      return {
        readingsBytes,
        audioBytes,
        translationsBytes,
        totalBytes,
        totalMB,
        readingCount,
        audioFileCount,
      };
    } catch (error) {
      console.error('[StorageCleanupService] Error getting storage stats:', error);
      return {
        readingsBytes: 0,
        audioBytes: 0,
        translationsBytes: 0,
        totalBytes: 0,
        totalMB: 0,
        readingCount: 0,
        audioFileCount: 0,
      };
    }
  }

  /**
   * Check if storage is above warning threshold
   */
  static async shouldWarn(): Promise<boolean> {
    try {
      const stats = await this.getStorageStats();
      const maxStorageBytes = this.MAX_STORAGE_MB * 1024 * 1024;
      const usagePercent = (stats.totalBytes / maxStorageBytes) * 100;

      return usagePercent >= this.WARNING_THRESHOLD_PERCENT;
    } catch (error) {
      console.error('[StorageCleanupService] Error checking warning threshold:', error);
      return false;
    }
  }

  /**
   * Check if cleanup is needed (storage above cleanup threshold)
   */
  static async shouldCleanup(): Promise<boolean> {
    try {
      const stats = await this.getStorageStats();
      const maxStorageBytes = this.MAX_STORAGE_MB * 1024 * 1024;
      const usagePercent = (stats.totalBytes / maxStorageBytes) * 100;

      return usagePercent >= this.CLEANUP_THRESHOLD_PERCENT;
    } catch (error) {
      console.error('[StorageCleanupService] Error checking cleanup threshold:', error);
      return false;
    }
  }

  /**
   * Get storage usage percentage
   */
  static async getStorageUsagePercent(): Promise<number> {
    try {
      const stats = await this.getStorageStats();
      const maxStorageBytes = this.MAX_STORAGE_MB * 1024 * 1024;
      return Math.round((stats.totalBytes / maxStorageBytes) * 1000) / 10; // One decimal place
    } catch (error) {
      console.error('[StorageCleanupService] Error getting storage percentage:', error);
      return 0;
    }
  }

  /**
   * Cleanup old readings
   */
  static async cleanupOldReadings(daysToKeep: number = 7): Promise<{ removed: number }> {
    try {
      console.log(`[StorageCleanupService] Cleaning up readings older than ${daysToKeep} days`);

      const metadataKey = '@offline_readings_metadata';
      const storagePrefix = '@offline_readings_';

      const metadata = await this.getMetadata(metadataKey);
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      const keysToRemove: string[] = [];

      for (const [date, meta] of Object.entries(metadata)) {
        if (meta.downloadedAt < cutoffTime) {
          keysToRemove.push(`${storagePrefix}${date}`);
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);

        // Update metadata
        for (const key of keysToRemove) {
          const date = key.replace(storagePrefix, '');
          delete metadata[date];
        }

        await AsyncStorage.setItem(metadataKey, JSON.stringify(metadata));

        console.log(`[StorageCleanupService] Removed ${keysToRemove.length} old readings`);
        return { removed: keysToRemove.length };
      }

      return { removed: 0 };
    } catch (error) {
      console.error('[StorageCleanupService] Error cleaning up old readings:', error);
      return { removed: 0 };
    }
  }

  /**
   * Clear all offline data
   */
  static async clearAllOfflineData(): Promise<void> {
    try {
      console.log('[StorageCleanupService] Clearing all offline data');

      // Clear readings
      await ReadingDownloadService.clearAllReadings();

      // Clear audio cache
      await AudioPlaybackService.clearCache();

      // Clear translations
      const translationService = getTranslationService();
      await translationService.clearCache();

      console.log('[StorageCleanupService] ✅ All offline data cleared');
    } catch (error) {
      console.error('[StorageCleanupService] Error clearing offline data:', error);
      throw error;
    }
  }

  /**
   * Auto-cleanup if needed
   */
  static async autoCleanupIfNeeded(): Promise<boolean> {
    try {
      const shouldClean = await this.shouldCleanup();

      if (shouldClean) {
        console.log('[StorageCleanupService] Auto-cleanup triggered');
        const result = await this.cleanupOldReadings(7);

        // If still above threshold, clear audio cache (non-essential)
        const stillAbove = await this.shouldCleanup();
        if (stillAbove) {
          console.log('[StorageCleanupService] Still above threshold, clearing audio cache');
          await AudioPlaybackService.clearCache();
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('[StorageCleanupService] Auto-cleanup failed:', error);
      return false;
    }
  }

  /**
   * Private helper: Get metadata
   */
  private static async getMetadata(key: string): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn(`[StorageCleanupService] Error reading metadata from ${key}:`, error);
      return {};
    }
  }
}
