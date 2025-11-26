/**
 * Reading Download Service
 * Handles downloading and caching readings for offline access
 * Stores readings in AsyncStorage with metadata for easy retrieval
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingService } from '@/services/readings/ReadingService';
import { DailyReadings } from '@/types/reading.types';

export interface OfflineReadingMetadata {
  date: string; // YYYY-MM-DD
  downloadedAt: number; // timestamp
  size: number; // bytes
  hasGospel: boolean;
  hasFirstReading: boolean;
  hasPsalm: boolean;
}

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentDate: string;
  isDownloading: boolean;
}

/**
 * Service for managing offline reading downloads
 */
export class ReadingDownloadService {
  private static readonly STORAGE_PREFIX = '@offline_readings_';
  private static readonly METADATA_KEY = '@offline_readings_metadata';
  private static readonly MAX_OFFLINE_STORAGE_MB = 50;
  private static currentProgress: DownloadProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    currentDate: '',
    isDownloading: false,
  };

  /**
   * Download readings for a date range
   * Default: next 7 days
   */
  static async downloadReadingsForDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{ success: number; failed: number; totalSize: number }> {
    console.log('[ReadingDownloadService] Starting download for date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    try {
      this.currentProgress.isDownloading = true;

      // Generate date array
      const dates = this.generateDateRange(startDate, endDate);
      this.currentProgress.total = dates.length;
      this.currentProgress.completed = 0;
      this.currentProgress.failed = 0;

      let totalSize = 0;
      let successCount = 0;

      // Download each date
      for (const date of dates) {
        try {
          this.currentProgress.currentDate = date;

          const reading = await ReadingService.getDailyReadings(
            new Date(date)
          );

          if (!reading) {
            console.warn('[ReadingDownloadService] No reading found for:', date);
            this.currentProgress.failed++;
            this.currentProgress.completed++;
            continue;
          }

          // Store reading in AsyncStorage
          const size = await this.storeReading(date, reading);
          totalSize += size;

          successCount++;
          this.currentProgress.completed++;
          this.currentProgress.percentage = Math.round(
            (this.currentProgress.completed / this.currentProgress.total) * 100
          );

          console.log(
            `[ReadingDownloadService] Downloaded reading for ${date} (${this.currentProgress.percentage}%)`
          );
        } catch (error) {
          console.error(
            '[ReadingDownloadService] Error downloading reading for',
            date,
            error
          );
          this.currentProgress.failed++;
          this.currentProgress.completed++;
        }
      }

      // Save metadata
      await this.updateMetadata();

      this.currentProgress.isDownloading = false;

      console.log('[ReadingDownloadService] ✅ Download complete:', {
        success: successCount,
        failed: this.currentProgress.failed,
        totalSize: this.formatBytes(totalSize),
      });

      return {
        success: successCount,
        failed: this.currentProgress.failed,
        totalSize,
      };
    } catch (error) {
      console.error('[ReadingDownloadService] Download failed:', error);
      this.currentProgress.isDownloading = false;
      throw error;
    }
  }

  /**
   * Download next N days of readings
   */
  static async downloadNextNDays(days: number = 7): Promise<{
    success: number;
    failed: number;
    totalSize: number;
  }> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.downloadReadingsForDateRange(startDate, endDate);
  }

  /**
   * Store a single reading in AsyncStorage
   */
  private static async storeReading(
    dateStr: string,
    reading: DailyReadings
  ): Promise<number> {
    try {
      const key = `${this.STORAGE_PREFIX}${dateStr}`;
      const data = JSON.stringify(reading);

      await AsyncStorage.setItem(key, data);

      // Calculate size (rough estimate)
      const size = data.length;

      return size;
    } catch (error) {
      console.error(
        '[ReadingDownloadService] Error storing reading for',
        dateStr,
        error
      );
      throw error;
    }
  }

  /**
   * Get a cached reading for a specific date
   */
  static async getCachedReading(date: Date): Promise<DailyReadings | null> {
    try {
      const dateStr = this.formatDate(date);
      const key = `${this.STORAGE_PREFIX}${dateStr}`;

      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as DailyReadings;
    } catch (error) {
      console.error('[ReadingDownloadService] Error retrieving cached reading:', error);
      return null;
    }
  }

  /**
   * Check if a reading is cached offline
   */
  static async isReadingCached(date: Date): Promise<boolean> {
    try {
      const dateStr = this.formatDate(date);
      const key = `${this.STORAGE_PREFIX}${dateStr}`;
      const data = await AsyncStorage.getItem(key);
      return data !== null;
    } catch (error) {
      console.error('[ReadingDownloadService] Error checking cache:', error);
      return false;
    }
  }

  /**
   * Get all downloaded dates
   */
  static async getDownloadedDates(): Promise<string[]> {
    try {
      const metadata = await this.getMetadata();
      return Object.keys(metadata).sort();
    } catch (error) {
      console.error('[ReadingDownloadService] Error getting downloaded dates:', error);
      return [];
    }
  }

  /**
   * Get metadata for all offline readings
   */
  private static async getMetadata(): Promise<
    Record<string, OfflineReadingMetadata>
  > {
    try {
      const data = await AsyncStorage.getItem(this.METADATA_KEY);
      return data ? (JSON.parse(data) as Record<string, OfflineReadingMetadata>) : {};
    } catch (error) {
      console.error('[ReadingDownloadService] Error getting metadata:', error);
      return {};
    }
  }

  /**
   * Update metadata for all downloaded readings
   */
  private static async updateMetadata(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const offlineKeys = allKeys.filter((key) =>
        key.startsWith(this.STORAGE_PREFIX)
      );

      const metadata: Record<string, OfflineReadingMetadata> = {};

      for (const key of offlineKeys) {
        const dateStr = key.replace(this.STORAGE_PREFIX, '');
        const data = await AsyncStorage.getItem(key);

        if (data) {
          const reading = JSON.parse(data) as DailyReadings;
          metadata[dateStr] = {
            date: dateStr,
            downloadedAt: Date.now(),
            size: data.length,
            hasGospel: !!reading.gospel?.content,
            hasFirstReading: !!reading.firstReading?.content,
            hasPsalm: !!reading.psalm?.content,
          };
        }
      }

      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[ReadingDownloadService] Error updating metadata:', error);
    }
  }

  /**
   * Get total storage used by offline readings
   */
  static async getStorageUsed(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const offlineKeys = allKeys.filter((key) =>
        key.startsWith(this.STORAGE_PREFIX)
      );

      let totalSize = 0;

      for (const key of offlineKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[ReadingDownloadService] Error calculating storage used:', error);
      return 0;
    }
  }

  /**
   * Clear all offline readings
   */
  static async clearAllReadings(): Promise<void> {
    try {
      console.log('[ReadingDownloadService] Clearing all offline readings');

      const allKeys = await AsyncStorage.getAllKeys();
      const offlineKeys = allKeys.filter((key) =>
        key.startsWith(this.STORAGE_PREFIX)
      );

      await AsyncStorage.multiRemove(offlineKeys);
      await AsyncStorage.removeItem(this.METADATA_KEY);

      console.log('[ReadingDownloadService] ✅ Offline readings cleared');
    } catch (error) {
      console.error('[ReadingDownloadService] Error clearing readings:', error);
      throw error;
    }
  }

  /**
   * Clear readings older than N days
   */
  static async clearOldReadings(daysToKeep: number = 7): Promise<void> {
    try {
      console.log('[ReadingDownloadService] Clearing readings older than', daysToKeep, 'days');

      const metadata = await this.getMetadata();
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      const keysToRemove: string[] = [];

      for (const [date, meta] of Object.entries(metadata)) {
        if (meta.downloadedAt < cutoffTime) {
          keysToRemove.push(`${this.STORAGE_PREFIX}${date}`);
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        await this.updateMetadata();
        console.log('[ReadingDownloadService] ✅ Removed', keysToRemove.length, 'old readings');
      }
    } catch (error) {
      console.error('[ReadingDownloadService] Error clearing old readings:', error);
    }
  }

  /**
   * Get current download progress
   */
  static getProgress(): DownloadProgress {
    return { ...this.currentProgress };
  }

  /**
   * Generate array of dates for a range
   */
  private static generateDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
