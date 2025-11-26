/**
 * Audio Playback Service
 *
 * Manages audio playback using expo-audio for scripture readings.
 * Handles play/pause, speed control, progress tracking, and caching.
 *
 * Phase 11: Audio Implementation
 */

import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TTSService, base64ToDataUri } from './TTSService';
import type { TTSVoiceConfig } from './TTSService';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';

export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  error: string | null;
  isFinished?: boolean;
}

export interface AudioCacheEntry {
  base64Audio: string;
  voice: string;
  speed: number;
  timestamp: number;
  characterCount: number;
}

/**
 * AudioPlaybackService class
 * Handles all audio playback operations for scripture readings
 */
export class AudioPlaybackService {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;
  private currentUri: string | null = null;
  private listeners: Set<(state: AudioPlaybackState) => void> = new Set();
  private previousWasPlaying: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;  // Timer for polling playback position
  private state: AudioPlaybackState = {
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    speed: 1.0,
    error: null,
  };

  // Cache configuration
  private static readonly MAX_CACHE_ENTRIES = 20; // Store up to 20 audio files
  private static readonly CACHE_EXPIRY_DAYS = 7; // 7-day expiry
  private static readonly CACHE_INDEX_KEY = '@audio_cache_index';
  private static readonly CACHE_DATA_PREFIX = '@audio_cache_data_';

  constructor() {
    this.initializeAudio();
  }

  /**
   * Initialize audio mode for playback
   */
  private async initializeAudio(): Promise<void> {
    try {
      // expo-audio API is different from expo-av
      // Only call setAudioModeAsync if it exists
      if (Audio.setAudioModeAsync) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }
      this.isInitialized = true;
    } catch (error) {
      // Don't fail if audio mode config is not available
      console.warn('Audio mode initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
      this.isInitialized = true;
    }
  }

  /**
   * Load and play audio from text using TTS
   *
   * @param text - Scripture text to convert to speech
   * @param readingId - Unique identifier for caching (e.g., "gospel_2025-10-02")
   * @param voice - TTS voice configuration
   * @param speed - Playback speed (0.5 - 1.5)
   */
  async loadAndPlay(
    text: string,
    readingId: string,
    voice: TTSVoiceConfig,
    speed: number = 1.0
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    this.updateState({ isLoading: true, error: null });

    try {
      // Check cache first
      const cachedUri = await this.getCachedAudio(readingId, voice.name, speed);

      let audioUri: string;

      if (cachedUri) {
        console.log(`Using cached audio for ${readingId}`);
        audioUri = cachedUri;
      } else {
        console.log(`Generating TTS for ${readingId}`);
        // Generate TTS audio
        const base64Audio = await TTSService.synthesizeSpeech(text, voice, speed);

        // Convert to data URI
        audioUri = base64ToDataUri(base64Audio);

        // Cache the audio
        await this.cacheAudio(readingId, base64Audio, voice.name, speed);
      }

      // Load and play
      await this.loadAudioFromUri(audioUri, speed);
      await this.play();

      this.updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown audio error';
      console.error('Audio playback failed:', errorMessage);
      this.updateState({
        isLoading: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Play audio from a direct URI (for simple word pronunciation)
   * Simpler alternative to loadAndPlay - skips TTS generation and caching
   *
   * @param uri - Direct URI to audio file (from GoogleTTSService)
   */
  async playAudioUri(uri: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    try {
      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          rate: 1.0,
          progressUpdateIntervalMillis: 500,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentUri = uri;
      this.updateState({ isPlaying: true, error: null });
      this.startPlaybackPolling();

      console.log('[AudioPlaybackService] Playing audio URI:', uri);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown audio error';
      console.error('[AudioPlaybackService] Failed to play audio URI:', errorMessage);
      this.updateState({ error: errorMessage, isPlaying: false });
      throw new Error(`Failed to play audio: ${errorMessage}`);
    }
  }

  /**
   * Load audio from URI
   */
  private async loadAudioFromUri(uri: string, speed: number): Promise<void> {
    // Unload previous sound
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }

    // Load new sound with progress updates every 500ms
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      {
        shouldPlay: false,
        rate: speed,
        progressUpdateIntervalMillis: 500  // CRITICAL: Request frequent updates during playback
      },
      this.onPlaybackStatusUpdate.bind(this)
    );

    this.sound = sound;
    this.currentUri = uri;
    this.updateState({ speed });
  }

  /**
   * Start polling playback position (since status updates don't fire during playback in some versions)
   */
  private startPlaybackPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    console.log('[AudioPlaybackService] Starting playback polling every 500ms');

    this.pollTimer = setInterval(async () => {
      if (!this.sound) {
        clearInterval(this.pollTimer!);
        this.pollTimer = null;
        return;
      }

      try {
        const status = await this.sound.getStatusAsync();
        console.log('[AudioPlaybackService] Poll status:', {
          isLoaded: status.isLoaded,
          isPlaying: status.isPlaying,
          positionMillis: status.positionMillis,
          durationMillis: status.durationMillis,
        });

        if (status.isLoaded) {
          this.onPlaybackStatusUpdate(status);
        }

        // If audio stopped and we're not in a playing state, stop polling
        if (!status.isPlaying && !this.state.isPlaying) {
          clearInterval(this.pollTimer!);
          this.pollTimer = null;
          console.log('[AudioPlaybackService] Stopping playback polling');
        }
      } catch (error) {
        console.error('[AudioPlaybackService] Polling error:', error);
        clearInterval(this.pollTimer!);
        this.pollTimer = null;
      }
    }, 500);
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.sound) {
      console.warn('No audio loaded');
      return;
    }

    try {
      console.log('[AudioPlaybackService] Starting playback...');
      await this.sound.playAsync();
      this.updateState({ isPlaying: true, error: null, isFinished: false });
      // Start polling to detect completion
      this.startPlaybackPolling();
    } catch (error) {
      console.error('Play failed:', error);
      this.updateState({ error: 'Failed to play audio' });
    }
  }

  /**
   * Pause audio
   */
  async pause(): Promise<void> {
    if (!this.sound) return;

    try {
      console.log('[AudioPlaybackService] Pausing playback');
      await this.sound.pauseAsync();
      // Stop polling when paused
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        console.log('[AudioPlaybackService] Stopped polling due to pause');
      }
      this.updateState({ isPlaying: false });
    } catch (error) {
      console.error('Pause failed:', error);
    }
  }

  /**
   * Stop audio and reset position
   */
  async stop(): Promise<void> {
    if (!this.sound) return;

    try {
      console.log('[AudioPlaybackService] Stopping playback');
      await this.sound.stopAsync();
      // Stop polling when stopped
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        console.log('[AudioPlaybackService] Stopped polling due to stop');
      }
      this.updateState({ isPlaying: false, currentTime: 0, isFinished: false });
    } catch (error) {
      console.error('Stop failed:', error);
    }
  }

  /**
   * Set playback speed
   *
   * @param speed - Playback rate (0.5 - 1.5)
   */
  async setSpeed(speed: number): Promise<void> {
    if (!this.sound) return;

    const validSpeed = Math.max(0.5, Math.min(1.5, speed));

    try {
      await this.sound.setRateAsync(validSpeed, true);
      this.updateState({ speed: validSpeed });
    } catch (error) {
      console.error('Failed to set speed:', error);
    }
  }

  /**
   * Seek to position in audio
   *
   * @param positionMillis - Position in milliseconds
   */
  async seekTo(positionMillis: number): Promise<void> {
    if (!this.sound) return;

    try {
      await this.sound.setPositionAsync(positionMillis);
    } catch (error) {
      console.error('Seek failed:', error);
    }
  }

  /**
   * Get current playback state
   */
  getState(): AudioPlaybackState {
    return { ...this.state };
  }

  /**
   * Subscribe to playback state changes
   *
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: AudioPlaybackState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Handle playback status updates from expo-audio
   */
  private onPlaybackStatusUpdate(status: any): void {
    // Debug: Log every status update
    console.log('[AudioPlaybackService] Status update received:', {
      isLoaded: status.isLoaded,
      isPlaying: status.isPlaying,
      positionMillis: status.positionMillis,
      durationMillis: status.durationMillis,
      error: status.error,
      didJustFinish: status.didJustFinish,
    });

    if (!status.isLoaded) {
      if (status.error) {
        console.error('[AudioPlaybackService] Playback error:', status.error);
        this.updateState({ error: `Playback error: ${status.error}` });
      }
      return;
    }

    const currentTime = status.positionMillis;
    const duration = status.durationMillis || 0;
    const isPlaying = status.isPlaying;

    // Debug: Log completion detection logic
    console.log('[AudioPlaybackService] Completion check:', {
      currentTime,
      duration,
      'currentTime >= duration': currentTime >= duration,
      isPlaying,
      '!isPlaying': !isPlaying,
      previousWasPlaying: this.previousWasPlaying,
      durationValid: duration > 0,
    });

    // Detect playback completion: currentTime >= duration AND stopped playing AND duration exists
    const isFinished =
      duration > 0 &&
      currentTime >= duration &&
      !isPlaying &&
      this.previousWasPlaying;

    if (isFinished) {
      console.log('[AudioPlaybackService] 🎉 PLAYBACK COMPLETED! currentTime:', currentTime, 'duration:', duration);
    }

    this.updateState({
      isPlaying,
      currentTime,
      duration,
      isFinished: isFinished ? true : undefined,
    });

    // Track previous playing state
    this.previousWasPlaying = isPlaying;
  }

  /**
   * Update state and notify listeners
   */
  private updateState(updates: Partial<AudioPlaybackState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop polling if running
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      console.log('[AudioPlaybackService] Stopped polling during cleanup');
    }

    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.currentUri = null;
    this.listeners.clear();
    this.updateState({
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      error: null,
    });
  }

  // ===== CACHING METHODS =====

  /**
   * Cache audio to AsyncStorage
   */
  private async cacheAudio(
    readingId: string,
    base64Audio: string,
    voiceName: string,
    speed: number
  ): Promise<void> {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(readingId, voiceName, speed);

      // Store audio data
      await AsyncStorage.setItem(
        `${AudioPlaybackService.CACHE_DATA_PREFIX}${cacheKey}`,
        base64Audio
      );

      // Update cache index
      await this.updateCacheIndex(cacheKey, voiceName, speed, base64Audio.length);

      // Check cache size and cleanup if needed
      await this.cleanupCacheIfNeeded();
    } catch (error) {
      console.error('Failed to cache audio:', error);
    }
  }

  /**
   * Get cached audio data URI if available
   */
  private async getCachedAudio(
    readingId: string,
    voiceName: string,
    speed: number
  ): Promise<string | null> {
    try {
      const cacheKey = this.generateCacheKey(readingId, voiceName, speed);

      // Check if cache entry exists and is not expired
      const cacheIndex = await this.getCacheIndex();
      const entry = cacheIndex[cacheKey];

      if (!entry || this.isCacheExpired(entry.timestamp)) {
        return null;
      }

      // Get cached audio data
      const base64Audio = await AsyncStorage.getItem(
        `${AudioPlaybackService.CACHE_DATA_PREFIX}${cacheKey}`
      );

      if (base64Audio) {
        return base64ToDataUri(base64Audio);
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached audio:', error);
      return null;
    }
  }

  /**
   * Generate cache key from reading ID, voice, and speed
   */
  private generateCacheKey(readingId: string, voiceName: string, speed: number): string {
    // Format: readingId_voiceName_speed
    // Example: gospel_2025-10-02_en-US-Wavenet-C_1.0
    return `${readingId}_${voiceName}_${speed.toFixed(1)}`;
  }

  /**
   * Get cache index from AsyncStorage
   */
  private async getCacheIndex(): Promise<Record<string, AudioCacheEntry>> {
    try {
      const indexJson = await AsyncStorage.getItem(AudioPlaybackService.CACHE_INDEX_KEY);
      return indexJson ? JSON.parse(indexJson) : {};
    } catch (error) {
      console.error('Failed to get cache index:', error);
      return {};
    }
  }

  /**
   * Update cache index with new entry
   */
  private async updateCacheIndex(
    cacheKey: string,
    voice: string,
    speed: number,
    characterCount: number
  ): Promise<void> {
    try {
      const index = await this.getCacheIndex();

      index[cacheKey] = {
        base64Audio: '', // Not stored in index
        voice,
        speed,
        timestamp: Date.now(),
        characterCount,
      };

      await AsyncStorage.setItem(
        AudioPlaybackService.CACHE_INDEX_KEY,
        JSON.stringify(index)
      );
    } catch (error) {
      console.error('Failed to update cache index:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(timestamp: number): boolean {
    const ageMs = Date.now() - timestamp;
    const expiryMs = AudioPlaybackService.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return ageMs > expiryMs;
  }

  /**
   * Cleanup cache if entry count exceeds limit
   */
  private async cleanupCacheIfNeeded(): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      const entries = Object.entries(index);

      if (entries.length > AudioPlaybackService.MAX_CACHE_ENTRIES) {
        // Sort by timestamp (oldest first)
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

        // Delete oldest entries to get back to limit
        const deleteCount = entries.length - AudioPlaybackService.MAX_CACHE_ENTRIES;
        const toDelete = entries.slice(0, deleteCount);

        for (const [key] of toDelete) {
          try {
            await AsyncStorage.removeItem(
              `${AudioPlaybackService.CACHE_DATA_PREFIX}${key}`
            );
            delete index[key];
          } catch (error) {
            // Silently ignore cache deletion errors (non-critical)
            console.warn(`Skipped cache entry ${key}:`, error instanceof Error ? error.message : 'Unknown error');
          }
        }

        // Update index
        await AsyncStorage.setItem(
          AudioPlaybackService.CACHE_INDEX_KEY,
          JSON.stringify(index)
        );

        console.log(`Cleaned up ${deleteCount} cached audio entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }

  /**
   * Clear all cached audio
   */
  static async clearCache(): Promise<void> {
    try {
      // Get all cache keys
      const indexJson = await AsyncStorage.getItem(AudioPlaybackService.CACHE_INDEX_KEY);
      if (indexJson) {
        const index = JSON.parse(indexJson);
        const keys = Object.keys(index);

        // Delete all cache data
        const deletePromises = keys.map((key) =>
          AsyncStorage.removeItem(`${AudioPlaybackService.CACHE_DATA_PREFIX}${key}`)
        );
        await Promise.all(deletePromises);
      }

      // Delete index
      await AsyncStorage.removeItem(AudioPlaybackService.CACHE_INDEX_KEY);
      console.log('Audio cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if audio can be generated (requires network and TTS API)
   */
  canGenerateAudio(): boolean {
    const networkState = NetworkStatusService.getCurrentState();
    return networkState.status === 'online';
  }

  /**
   * Check if audio is cached for a reading
   */
  async isAudioCached(readingId: string, voiceName: string, speed: number): Promise<boolean> {
    const cachedUri = await this.getCachedAudio(readingId, voiceName, speed);
    return cachedUri !== null;
  }

  /**
   * Load and play audio with network awareness
   * If offline and audio not cached, returns false
   */
  async loadAndPlayOfflineAware(
    text: string,
    readingId: string,
    voice: TTSVoiceConfig,
    speed: number = 1.0
  ): Promise<boolean> {
    // Check if audio is cached
    const isCached = await this.isAudioCached(readingId, voice.name, speed);

    // Check if we can generate audio
    const canGenerate = this.canGenerateAudio();

    if (!isCached && !canGenerate) {
      console.warn(
        `[AudioPlaybackService] Audio not cached and offline - cannot generate: ${readingId}`
      );
      return false;
    }

    try {
      await this.loadAndPlay(text, readingId, voice, speed);
      return true;
    } catch (error) {
      console.error('[AudioPlaybackService] Failed to load and play audio:', error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const audioPlaybackService = new AudioPlaybackService();
