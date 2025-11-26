/**
 * Offline Download Coordinator
 * Orchestrates downloading readings, audio, and translations for offline access
 * Manages the complete offline sync workflow
 */

import { ReadingDownloadService } from './ReadingDownloadService';
import { AudioDownloadService } from './AudioDownloadService';
import { TranslationPreCacheService } from './TranslationPreCacheService';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TTS_VOICES, TTSVoiceConfig } from '@/services/audio/TTSService';

export type DownloadStep = 'readings' | 'audio' | 'translations' | 'complete' | 'failed';

export interface DownloadProgress {
  step: DownloadStep;
  itemsCompleted: number;
  itemsTotal: number;
  percentage: number;
  currentItem?: string;
  error?: string;
  elapsedMs: number;
  estimatedRemainingMs: number;
}

export interface OfflineDownloadConfig {
  autoDownloadEnabled: boolean;
  wifiOnlyEnabled: boolean;
  selectedLanguages: string[];
  audioVoicePreference: string;
  audioSpeedPreference: number;
  daysToDownload: number;
}

/**
 * Coordinator for managing offline downloads
 */
export class OfflineDownloadCoordinator {
  private static readonly LAST_DOWNLOAD_KEY = '@offline_last_download_timestamp';
  private static isDownloading = false;
  private static progressCallbacks: Set<(progress: DownloadProgress) => void> = new Set();
  private static downloadStartTime = 0;

  /**
   * Check if automatic download should occur
   */
  static async shouldAutoDownload(config: OfflineDownloadConfig): Promise<boolean> {
    try {
      // Check if auto-download is enabled
      if (!config.autoDownloadEnabled) {
        console.log('[OfflineDownloadCoordinator] Auto-download disabled');
        return false;
      }

      // Check network status
      const networkState = NetworkStatusService.getCurrentState();
      const isOnline = networkState.status === 'online';

      if (!isOnline) {
        console.log('[OfflineDownloadCoordinator] Device is offline');
        return false;
      }

      // Check WiFi requirement
      if (config.wifiOnlyEnabled && networkState.type !== 'wifi') {
        console.log('[OfflineDownloadCoordinator] WiFi-only enabled but using:', networkState.type);
        return false;
      }

      // Check last download time
      const lastDownloadStr = await AsyncStorage.getItem(this.LAST_DOWNLOAD_KEY);
      if (lastDownloadStr) {
        const lastDownloadTime = parseInt(lastDownloadStr, 10);
        const hoursSinceDownload = (Date.now() - lastDownloadTime) / (1000 * 60 * 60);

        if (hoursSinceDownload < 24) {
          console.log(`[OfflineDownloadCoordinator] Last download was ${hoursSinceDownload.toFixed(1)} hours ago`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[OfflineDownloadCoordinator] Error checking download conditions:', error);
      return false;
    }
  }

  /**
   * Start coordinated download with progress tracking
   */
  static async startCoordinatedDownload(
    config: OfflineDownloadConfig,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; summary: string }> {
    try {
      // Prevent concurrent downloads
      if (this.isDownloading) {
        console.warn('[OfflineDownloadCoordinator] Download already in progress');
        return { success: false, summary: 'Download already in progress' };
      }

      this.isDownloading = true;
      this.downloadStartTime = Date.now();

      if (onProgress) {
        this.progressCallbacks.add(onProgress);
      }

      console.log('[OfflineDownloadCoordinator] Starting coordinated offline download');

      // Step 1: Download readings
      await this.downloadReadings(config);

      // Step 2: Download audio
      await this.downloadAudio(config);

      // Step 3: Pre-cache translations
      await this.downloadTranslations(config);

      // Save last download timestamp
      await this.saveLastDownloadTime();

      // Notify completion
      this.notifyProgress({
        step: 'complete',
        itemsCompleted: 1,
        itemsTotal: 1,
        percentage: 100,
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });

      this.isDownloading = false;
      this.progressCallbacks.delete(onProgress!);

      console.log('[OfflineDownloadCoordinator] ✅ Coordinated download complete');
      return { success: true, summary: 'All offline data downloaded successfully' };
    } catch (error) {
      this.isDownloading = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OfflineDownloadCoordinator] Download failed:', errorMsg);

      this.notifyProgress({
        step: 'failed',
        itemsCompleted: 0,
        itemsTotal: 1,
        percentage: 0,
        error: errorMsg,
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });

      if (onProgress) {
        this.progressCallbacks.delete(onProgress);
      }

      return { success: false, summary: `Download failed: ${errorMsg}` };
    }
  }

  /**
   * Download readings for configured days
   */
  private static async downloadReadings(config: OfflineDownloadConfig): Promise<void> {
    try {
      this.notifyProgress({
        step: 'readings',
        itemsCompleted: 0,
        itemsTotal: config.daysToDownload,
        percentage: 0,
        currentItem: 'Downloading readings...',
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });

      console.log(`[OfflineDownloadCoordinator] Downloading readings for ${config.daysToDownload} days`);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + config.daysToDownload);

      const result = await ReadingDownloadService.downloadReadingsForDateRange(startDate, endDate);

      console.log(`[OfflineDownloadCoordinator] Readings downloaded: ${result.success} success, ${result.failed} failed`);

      this.notifyProgress({
        step: 'readings',
        itemsCompleted: result.success,
        itemsTotal: config.daysToDownload,
        percentage: 100,
        currentItem: `Downloaded ${result.success} readings`,
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });
    } catch (error) {
      console.error('[OfflineDownloadCoordinator] Error downloading readings:', error);
      throw error;
    }
  }

  /**
   * Download audio for downloaded readings
   */
  private static async downloadAudio(config: OfflineDownloadConfig): Promise<void> {
    try {
      this.notifyProgress({
        step: 'audio',
        itemsCompleted: 0,
        itemsTotal: 1,
        percentage: 0,
        currentItem: 'Generating audio...',
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });

      console.log('[OfflineDownloadCoordinator] Downloading audio for readings');

      // Find the voice config matching preference
      const voiceKey = config.audioVoicePreference as keyof typeof TTS_VOICES;
      const voiceConfig = TTS_VOICES[voiceKey] || TTS_VOICES.FEMALE_PRIMARY;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + config.daysToDownload);

      const result = await AudioDownloadService.downloadAudioForDateRange(
        startDate,
        endDate,
        voiceConfig,
        config.audioSpeedPreference
      );

      console.log(`[OfflineDownloadCoordinator] Audio downloaded: ${result.success} success, ${result.failed} failed`);

      this.notifyProgress({
        step: 'audio',
        itemsCompleted: 1,
        itemsTotal: 1,
        percentage: 100,
        currentItem: `Generated audio for ${result.success} readings`,
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });
    } catch (error) {
      console.warn('[OfflineDownloadCoordinator] Audio download failed (non-critical):', error);
      // Don't throw - audio is optional
    }
  }

  /**
   * Pre-cache translations for selected languages
   */
  private static async downloadTranslations(config: OfflineDownloadConfig): Promise<void> {
    try {
      this.notifyProgress({
        step: 'translations',
        itemsCompleted: 0,
        itemsTotal: config.selectedLanguages.length,
        percentage: 0,
        currentItem: 'Caching translations...',
        elapsedMs: Date.now() - this.downloadStartTime,
        estimatedRemainingMs: 0,
      });

      console.log(`[OfflineDownloadCoordinator] Pre-caching translations for: ${config.selectedLanguages.join(', ')}`);

      for (let i = 0; i < config.selectedLanguages.length; i++) {
        const language = config.selectedLanguages[i];

        try {
          await TranslationPreCacheService.preCacheAllForLanguage(language);
          console.log(`[OfflineDownloadCoordinator] Cached translations for: ${language}`);

          this.notifyProgress({
            step: 'translations',
            itemsCompleted: i + 1,
            itemsTotal: config.selectedLanguages.length,
            percentage: Math.round(((i + 1) / config.selectedLanguages.length) * 100),
            currentItem: `Cached ${language}`,
            elapsedMs: Date.now() - this.downloadStartTime,
            estimatedRemainingMs: 0,
          });
        } catch (langError) {
          console.warn(`[OfflineDownloadCoordinator] Failed to cache ${language}:`, langError);
          // Continue with other languages
        }
      }

      console.log('[OfflineDownloadCoordinator] Translation pre-caching complete');
    } catch (error) {
      console.warn('[OfflineDownloadCoordinator] Translation caching failed (non-critical):', error);
      // Don't throw - translations are optional
    }
  }

  /**
   * Cancel ongoing download
   */
  static cancelDownload(): void {
    console.log('[OfflineDownloadCoordinator] Cancelling download');
    this.isDownloading = false;
    this.progressCallbacks.clear();
  }

  /**
   * Subscribe to download progress
   */
  static onProgress(callback: (progress: DownloadProgress) => void): () => void {
    this.progressCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Get current download status
   */
  static isCurrentlyDownloading(): boolean {
    return this.isDownloading;
  }

  /**
   * Get last download timestamp
   */
  static async getLastDownloadTime(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_DOWNLOAD_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error('[OfflineDownloadCoordinator] Error getting last download time:', error);
      return null;
    }
  }

  /**
   * Private helper: Save last download timestamp
   */
  private static async saveLastDownloadTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_DOWNLOAD_KEY, Date.now().toString());
      console.log('[OfflineDownloadCoordinator] Last download timestamp saved');
    } catch (error) {
      console.error('[OfflineDownloadCoordinator] Error saving last download time:', error);
    }
  }

  /**
   * Private helper: Notify all progress listeners
   */
  private static notifyProgress(progress: DownloadProgress): void {
    this.progressCallbacks.forEach((callback) => {
      try {
        callback(progress);
      } catch (error) {
        console.error('[OfflineDownloadCoordinator] Error in progress callback:', error);
      }
    });
  }
}
