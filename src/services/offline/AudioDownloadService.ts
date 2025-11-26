/**
 * Audio Download Service
 * Pre-downloads and caches audio files for offline reading access
 * Handles TTS generation, storage management, and progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TTSService, TTS_VOICES, TTSVoiceConfig } from '@/services/audio/TTSService';
import { ReadingDownloadService } from './ReadingDownloadService';
import { StorageQuotaService } from '@/services/storage/StorageQuotaService';

export interface AudioDownloadProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentDate: string;
  currentSection: string;
  isDownloading: boolean;
  estimatedSizeBytes: number;
}

export interface AudioDownloadMetadata {
  date: string; // YYYY-MM-DD
  section: string; // gospel, firstReading, psalm
  voice: string;
  speed: number;
  downloadedAt: number;
  sizeBytes: number;
}

/**
 * Service for managing offline audio downloads
 */
export class AudioDownloadService {
  private static readonly AUDIO_CACHE_PREFIX = '@audio_cache_data_';
  private static readonly AUDIO_METADATA_KEY = '@audio_download_metadata';
  private static readonly MAX_AUDIO_STORAGE_MB = 30; // Reserve 30MB for audio caching
  private static currentProgress: AudioDownloadProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    currentDate: '',
    currentSection: '',
    isDownloading: false,
    estimatedSizeBytes: 0,
  };

  /**
   * Download audio for a date range with specified voice and speed
   */
  static async downloadAudioForDateRange(
    startDate: Date,
    endDate: Date,
    voice: TTSVoiceConfig = TTS_VOICES.FEMALE_PRIMARY,
    speed: number = 1.0
  ): Promise<{ success: number; failed: number; totalSize: number }> {
    console.log('[AudioDownloadService] Starting audio download for date range:', {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      voice: voice.name,
      speed,
    });

    try {
      this.currentProgress.isDownloading = true;

      // Get dates of offline readings that are available
      const downloadedDates = await ReadingDownloadService.getDownloadedDates();

      // Filter dates within range
      const datesToProcess = downloadedDates.filter((date) => {
        const dateObj = new Date(date);
        return dateObj >= startDate && dateObj <= endDate;
      });

      this.currentProgress.total = datesToProcess.length * 3; // 3 sections per date (gospel, firstReading, psalm)
      this.currentProgress.completed = 0;
      this.currentProgress.failed = 0;

      let totalSize = 0;
      let successCount = 0;

      // Download audio for each date
      for (const date of datesToProcess) {
        try {
          // Get the cached reading
          const reading = await ReadingDownloadService.getCachedReading(new Date(date));

          if (!reading) {
            console.warn('[AudioDownloadService] No reading found for:', date);
            this.currentProgress.failed += 3;
            this.currentProgress.completed += 3;
            continue;
          }

          // Download audio for each section
          const sections = [
            { key: 'gospel', text: reading.gospel?.text },
            { key: 'firstReading', text: reading.firstReading?.text },
            { key: 'psalm', text: reading.psalm?.text },
          ];

          for (const section of sections) {
            this.currentProgress.currentDate = date;
            this.currentProgress.currentSection = section.key;

            if (!section.text) {
              this.currentProgress.failed++;
              this.currentProgress.completed++;
              continue;
            }

            try {
              const readingId = `${section.key}_${date}`;
              const size = await this.downloadAndCacheAudio(
                readingId,
                section.text,
                voice,
                speed
              );

              if (size > 0) {
                totalSize += size;
                successCount++;
              }

              this.currentProgress.completed++;
              this.currentProgress.percentage = Math.round(
                (this.currentProgress.completed / this.currentProgress.total) * 100
              );

              console.log(
                `[AudioDownloadService] Downloaded audio for ${readingId} (${this.currentProgress.percentage}%)`
              );
            } catch (error) {
              console.error(
                '[AudioDownloadService] Error downloading audio for',
                `${section.key}_${date}`,
                error
              );
              this.currentProgress.failed++;
              this.currentProgress.completed++;
            }
          }
        } catch (error) {
          console.error('[AudioDownloadService] Error processing date:', date, error);
          this.currentProgress.failed += 3;
          this.currentProgress.completed += 3;
        }
      }

      // Save metadata
      await this.updateMetadata();

      this.currentProgress.isDownloading = false;

      console.log('[AudioDownloadService] ✅ Audio download complete:', {
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
      console.error('[AudioDownloadService] Download failed:', error);
      this.currentProgress.isDownloading = false;
      throw error;
    }
  }

  /**
   * Download audio for next N days
   */
  static async downloadAudioForNextNDays(
    days: number = 7,
    voice: TTSVoiceConfig = TTS_VOICES.FEMALE_PRIMARY,
    speed: number = 1.0
  ): Promise<{ success: number; failed: number; totalSize: number }> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.downloadAudioForDateRange(startDate, endDate, voice, speed);
  }

  /**
   * Download and cache audio for a specific reading
   */
  private static async downloadAndCacheAudio(
    readingId: string,
    text: string,
    voice: TTSVoiceConfig,
    speed: number
  ): Promise<number> {
    try {
      // Check if audio already cached
      const cached = await this.getAudioCacheKey(readingId, voice.name, speed);
      if (cached) {
        return 0; // Already cached, don't re-download
      }

      // Generate TTS audio
      const base64Audio = await TTSService.synthesizeSpeech(text, voice, speed);

      if (!base64Audio) {
        console.warn('[AudioDownloadService] No audio generated for:', readingId);
        return 0;
      }

      // Check storage quota
      const quota = await StorageQuotaService.getQuota();
      const audioSize = base64Audio.length;

      if (quota.available < audioSize) {
        console.warn('[AudioDownloadService] Insufficient storage for audio:', readingId);
        // Try to cleanup old audio
        await this.cleanupOldAudio(audioSize);
      }

      // Generate cache key (matching AudioPlaybackService pattern)
      const cacheKey = `${readingId}_${voice.name}_${speed.toFixed(1)}`;
      const storageKey = `${this.AUDIO_CACHE_PREFIX}${cacheKey}`;

      // Store audio
      await AsyncStorage.setItem(storageKey, base64Audio);

      // Update metadata
      await this.updateAudioMetadata(readingId, voice.name, speed, audioSize);

      return audioSize;
    } catch (error) {
      console.error('[AudioDownloadService] Error downloading audio:', error);
      throw error;
    }
  }

  /**
   * Check if audio is cached
   */
  static async isAudioCached(
    readingId: string,
    voiceName: string,
    speed: number
  ): Promise<boolean> {
    try {
      const key = await this.getAudioCacheKey(readingId, voiceName, speed);
      return key !== null;
    } catch (error) {
      console.error('[AudioDownloadService] Error checking cache:', error);
      return false;
    }
  }

  /**
   * Get audio cache key if it exists
   */
  private static async getAudioCacheKey(
    readingId: string,
    voiceName: string,
    speed: number
  ): Promise<string | null> {
    try {
      const cacheKey = `${readingId}_${voiceName}_${speed.toFixed(1)}`;
      const storageKey = `${this.AUDIO_CACHE_PREFIX}${cacheKey}`;
      const data = await AsyncStorage.getItem(storageKey);
      return data ? cacheKey : null;
    } catch (error) {
      console.error('[AudioDownloadService] Error getting cache key:', error);
      return null;
    }
  }

  /**
   * Get total audio storage used
   */
  static async getStorageUsed(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const audioKeys = allKeys.filter((key) => key.startsWith(this.AUDIO_CACHE_PREFIX));

      let totalSize = 0;

      for (const key of audioKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[AudioDownloadService] Error calculating storage used:', error);
      return 0;
    }
  }

  /**
   * Estimate total audio size for a date range
   */
  static async estimateAudioSize(
    startDate: Date,
    endDate: Date,
    averageSectionSizeKB: number = 150 // Rough estimate
  ): Promise<number> {
    try {
      const downloadedDates = await ReadingDownloadService.getDownloadedDates();
      const datesToProcess = downloadedDates.filter((date) => {
        const dateObj = new Date(date);
        return dateObj >= startDate && dateObj <= endDate;
      });

      // 3 sections per date, estimated size per section
      const estimatedSize = datesToProcess.length * 3 * averageSectionSizeKB * 1024;
      return estimatedSize;
    } catch (error) {
      console.error('[AudioDownloadService] Error estimating size:', error);
      return 0;
    }
  }

  /**
   * Clear all cached audio
   */
  static async clearAllAudio(): Promise<void> {
    try {
      console.log('[AudioDownloadService] Clearing all cached audio');

      const allKeys = await AsyncStorage.getAllKeys();
      const audioKeys = allKeys.filter((key) => key.startsWith(this.AUDIO_CACHE_PREFIX));

      await AsyncStorage.multiRemove(audioKeys);
      await AsyncStorage.removeItem(this.AUDIO_METADATA_KEY);

      console.log('[AudioDownloadService] ✅ Audio cache cleared');
    } catch (error) {
      console.error('[AudioDownloadService] Error clearing audio:', error);
      throw error;
    }
  }

  /**
   * Clear old cached audio
   */
  static async clearOldAudio(daysToKeep: number = 7): Promise<void> {
    try {
      console.log('[AudioDownloadService] Clearing audio older than', daysToKeep, 'days');

      const metadata = await this.getMetadata();
      const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

      const keysToRemove: string[] = [];

      for (const [cacheKey, meta] of Object.entries(metadata)) {
        if (meta.downloadedAt < cutoffTime) {
          keysToRemove.push(`${this.AUDIO_CACHE_PREFIX}${cacheKey}`);
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        await this.updateMetadata();
        console.log('[AudioDownloadService] ✅ Removed', keysToRemove.length, 'old audio files');
      }
    } catch (error) {
      console.error('[AudioDownloadService] Error clearing old audio:', error);
    }
  }

  /**
   * Cleanup audio if storage is insufficient (private, for internal use)
   */
  private static async cleanupOldAudio(requiredBytes: number): Promise<void> {
    try {
      console.log('[AudioDownloadService] Attempting cleanup for', this.formatBytes(requiredBytes));

      const metadata = await this.getMetadata();
      const entries = Object.entries(metadata);

      // Sort by download time (oldest first)
      entries.sort(([, a], [, b]) => a.downloadedAt - b.downloadedAt);

      let freedBytes = 0;

      for (const [cacheKey, meta] of entries) {
        if (freedBytes >= requiredBytes) break;

        try {
          await AsyncStorage.removeItem(`${this.AUDIO_CACHE_PREFIX}${cacheKey}`);
          freedBytes += meta.sizeBytes;
          delete metadata[cacheKey];
        } catch (error) {
          console.warn('[AudioDownloadService] Failed to remove cache entry:', error);
        }
      }

      await this.updateMetadata();
      console.log('[AudioDownloadService] Freed', this.formatBytes(freedBytes), 'from audio cache');
    } catch (error) {
      console.error('[AudioDownloadService] Cleanup failed:', error);
    }
  }

  /**
   * Get metadata for all cached audio
   */
  private static async getMetadata(): Promise<Record<string, AudioDownloadMetadata>> {
    try {
      const data = await AsyncStorage.getItem(this.AUDIO_METADATA_KEY);
      return data ? (JSON.parse(data) as Record<string, AudioDownloadMetadata>) : {};
    } catch (error) {
      console.error('[AudioDownloadService] Error getting metadata:', error);
      return {};
    }
  }

  /**
   * Update metadata for all cached audio
   */
  private static async updateMetadata(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const audioKeys = allKeys.filter((key) => key.startsWith(this.AUDIO_CACHE_PREFIX));

      const metadata: Record<string, AudioDownloadMetadata> = {};

      for (const key of audioKeys) {
        const cacheKey = key.replace(this.AUDIO_CACHE_PREFIX, '');
        const data = await AsyncStorage.getItem(key);

        if (data) {
          // Parse cache key: readingId_voiceName_speed
          const parts = cacheKey.split('_');
          const speed = parseFloat(parts[parts.length - 1]) || 1.0;
          const voice = parts[parts.length - 2];

          metadata[cacheKey] = {
            date: '', // Will be extracted from reading ID if needed
            section: '',
            voice,
            speed,
            downloadedAt: Date.now(),
            sizeBytes: data.length,
          };
        }
      }

      await AsyncStorage.setItem(this.AUDIO_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[AudioDownloadService] Error updating metadata:', error);
    }
  }

  /**
   * Update metadata for a specific audio file
   */
  private static async updateAudioMetadata(
    readingId: string,
    voice: string,
    speed: number,
    sizeBytes: number
  ): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      const cacheKey = `${readingId}_${voice}_${speed.toFixed(1)}`;

      metadata[cacheKey] = {
        date: '',
        section: readingId.split('_')[0],
        voice,
        speed,
        downloadedAt: Date.now(),
        sizeBytes,
      };

      await AsyncStorage.setItem(this.AUDIO_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[AudioDownloadService] Error updating audio metadata:', error);
    }
  }

  /**
   * Get current download progress
   */
  static getProgress(): AudioDownloadProgress {
    return { ...this.currentProgress };
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
