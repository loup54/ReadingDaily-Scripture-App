/**
 * Highlighting Audio Service
 * Wrapper around expo-av Sound with highlighting integration
 * Bridges audio playback with AudioHighlightingService
 *
 * Manages:
 * - Audio file loading and playback
 * - Position tracking for highlighting
 * - Play/pause/seek/rate control
 * - Error handling and cleanup
 */

import { Audio } from 'expo-av';
import { audioHighlightingService } from './AudioHighlightingService';

/**
 * Configuration for audio playback
 */
export interface AudioPlaybackConfig {
  /** Initial playback rate (1.0 = normal) */
  rate?: number;
  /** Enable volume control */
  shouldCorrectPitch?: boolean;
  /** Position update interval (ms) */
  updateIntervalMs?: number;
  /** Auto-play when ready */
  autoPlay?: boolean;
}

/**
 * Status of audio playback
 */
export interface AudioPlaybackStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  rate: number;
  isBuffering: boolean;
  error?: string;
}

/**
 * Service for audio playback with highlighting integration
 */
export class HighlightingAudioService {
  private static instance: HighlightingAudioService;

  private sound: Audio.Sound | null = null;
  private updateIntervalId: NodeJS.Timeout | null = null;
  private isInitialized = false;

  // Configuration
  private config: Required<AudioPlaybackConfig> = {
    rate: 1.0,
    shouldCorrectPitch: true,
    updateIntervalMs: 100,
    autoPlay: false,
  };

  // Status tracking
  private status: AudioPlaybackStatus = {
    isLoaded: false,
    isPlaying: false,
    positionMs: 0,
    durationMs: 0,
    rate: 1.0,
    isBuffering: false,
  };

  // Callbacks
  private onStatusChange?: (status: AudioPlaybackStatus) => void;
  private onError?: (error: Error) => void;
  private onComplete?: () => void;

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): HighlightingAudioService {
    if (!HighlightingAudioService.instance) {
      HighlightingAudioService.instance = new HighlightingAudioService();
    }
    return HighlightingAudioService.instance;
  }

  /**
   * Initialize audio system
   * Must be called once before loading audio
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request audio permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Audio permissions not granted');
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('[HighlightingAudioService] ✅ Initialized');
    } catch (error) {
      console.error('[HighlightingAudioService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Load audio file and prepare for playback
   */
  async loadAudio(
    sourceUri: string,
    config?: Partial<AudioPlaybackConfig>,
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Update config
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Cleanup previous audio
      await this.cleanup();

      console.log(`[HighlightingAudioService] Loading audio: ${sourceUri}`);

      // Create and load sound
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: sourceUri },
        {
          rate: this.config.rate,
          shouldCorrectPitch: this.config.shouldCorrectPitch,
          positionMillis: 0,
          progressUpdateIntervalMillis: this.config.updateIntervalMs,
        },
        this.onSoundStatusUpdate.bind(this),
      );

      this.sound = sound;

      // Initial status update
      if (status.isLoaded) {
        this.status = {
          isLoaded: true,
          isPlaying: false,
          positionMs: status.positionMillis || 0,
          durationMs: status.durationMillis || 0,
          rate: status.rate || 1.0,
          isBuffering: status.isBuffering || false,
        };
      }

      // Auto-play if configured
      if (this.config.autoPlay) {
        await this.play();
      }

      console.log(`[HighlightingAudioService] ✅ Loaded: ${Math.round(this.status.durationMs / 1000)}s`);
    } catch (error) {
      console.error('[HighlightingAudioService] Error loading audio:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      await this.sound.playAsync();
      this.startPositionTracking();

      console.log('[HighlightingAudioService] ▶️ Playing');
    } catch (error) {
      console.error('[HighlightingAudioService] Error playing:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Pause audio
   */
  async pause(): Promise<void> {
    try {
      if (!this.sound) return;

      await this.sound.pauseAsync();
      this.stopPositionTracking();

      console.log('[HighlightingAudioService] ⏸️ Paused');
    } catch (error) {
      console.error('[HighlightingAudioService] Error pausing:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Stop audio and reset position
   */
  async stop(): Promise<void> {
    try {
      if (!this.sound) return;

      await this.sound.stopAsync();
      this.stopPositionTracking();

      this.status.isPlaying = false;
      this.status.positionMs = 0;

      console.log('[HighlightingAudioService] ⏹️ Stopped');
    } catch (error) {
      console.error('[HighlightingAudioService] Error stopping:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Seek to position
   */
  async seekToPosition(positionMs: number): Promise<void> {
    try {
      if (!this.sound) return;

      // Clamp to valid range
      const clampedPosition = Math.max(0, Math.min(positionMs, this.status.durationMs));

      await this.sound.setPositionAsync(clampedPosition);

      // Update highlighting service
      audioHighlightingService.updateAudioPosition(clampedPosition);

      console.log(`[HighlightingAudioService] Seeked to ${clampedPosition}ms`);
    } catch (error) {
      console.error('[HighlightingAudioService] Error seeking:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Set playback rate
   */
  async setRate(rate: number): Promise<void> {
    try {
      if (!this.sound) return;

      // Clamp rate between 0.5x and 2.0x
      const clampedRate = Math.max(0.5, Math.min(rate, 2.0));

      await this.sound.setRateAsync(clampedRate, this.config.shouldCorrectPitch);

      this.config.rate = clampedRate;
      this.status.rate = clampedRate;

      console.log(`[HighlightingAudioService] Rate set to ${clampedRate}x`);
    } catch (error) {
      console.error('[HighlightingAudioService] Error setting rate:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get current status
   */
  getStatus(): AudioPlaybackStatus {
    return { ...this.status };
  }

  /**
   * Set status change callback
   */
  onStatusChangeListener(callback: (status: AudioPlaybackStatus) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Set error callback
   */
  onErrorListener(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Set completion callback
   */
  onCompleteListener(callback: () => void): void {
    this.onComplete = callback;
  }

  /**
   * Handle sound status updates from expo-av
   */
  private onSoundStatusUpdate(status: Audio.AVPlaybackStatus): void {
    if (!status.isLoaded) {
      this.status.error = status.error?.message || 'Unknown error';
      return;
    }

    this.status = {
      isLoaded: true,
      isPlaying: status.isPlaying,
      positionMs: Math.round(status.positionMillis || 0),
      durationMs: Math.round(status.durationMillis || 0),
      rate: status.rate || 1.0,
      isBuffering: status.isBuffering || false,
    };

    // Emit status change
    this.onStatusChange?.(this.status);

    // Update highlighting service
    if (this.status.isPlaying) {
      audioHighlightingService.updateAudioPosition(this.status.positionMs);
    }

    // Check for completion
    if (
      this.status.isPlaying &&
      this.status.positionMs >= this.status.durationMs - 100
    ) {
      this.onComplete?.();
    }
  }

  /**
   * Start position tracking for highlighting updates
   */
  private startPositionTracking(): void {
    if (this.updateIntervalId) {
      return;
    }

    this.updateIntervalId = setInterval(() => {
      if (this.status.isPlaying) {
        audioHighlightingService.updateAudioPosition(this.status.positionMs);
      }
    }, this.config.updateIntervalMs);
  }

  /**
   * Stop position tracking
   */
  private stopPositionTracking(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Cleanup and unload audio
   */
  async cleanup(): Promise<void> {
    try {
      this.stopPositionTracking();

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.status = {
        isLoaded: false,
        isPlaying: false,
        positionMs: 0,
        durationMs: 0,
        rate: 1.0,
        isBuffering: false,
      };

      console.log('[HighlightingAudioService] ✅ Cleaned up');
    } catch (error) {
      console.error('[HighlightingAudioService] Error cleaning up:', error);
    }
  }

  /**
   * Destroy service (cleanup)
   */
  async destroy(): Promise<void> {
    await this.cleanup();
  }
}

/**
 * Export singleton instance
 */
export const highlightingAudioService = HighlightingAudioService.getInstance();
