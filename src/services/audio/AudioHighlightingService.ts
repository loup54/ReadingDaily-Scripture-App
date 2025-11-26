/**
 * Audio Highlighting Service
 * Orchestrates word-level highlighting synchronized with audio playback
 *
 * Core Responsibilities:
 * - Load timing data from provider
 * - Track audio position (100ms intervals)
 * - Binary search for current word
 * - Emit state updates for UI
 * - Handle play/pause/seek events
 */

import {
  SentenceTimingData,
  HighlightingState,
  HighlightingOptions,
  WordTiming,
  WordChangeEvent,
  HighlightingConfig,
  DEFAULT_HIGHLIGHTING_CONFIG,
  HighlightingStateListener,
  IHighlightingProvider,
} from '@/types';
import { compositeTimingDataProvider } from './CompositeTimingDataProvider';

/**
 * Core highlighting service
 */
export class AudioHighlightingService {
  private static instance: AudioHighlightingService;

  // Current state
  private currentState: HighlightingState = {
    currentPositionMs: 0,
    currentWordIndex: -1,
    isPlaying: false,
    durationMs: 0,
    updatedAt: Date.now(),
  };

  // Configuration
  private config: HighlightingConfig = { ...DEFAULT_HIGHLIGHTING_CONFIG };

  // Timing data
  private timingData: SentenceTimingData | null = null;

  // Listeners
  private stateListeners: Set<HighlightingStateListener> = new Set();

  // Callbacks
  private onWordChangeCallback?: (event: WordChangeEvent) => void;
  private onCompleteCallback?: () => void;
  private onErrorCallback?: (error: Error) => void;

  // Update tracking
  private updateIntervalId: NodeJS.Timeout | null = null;
  private lastEmittedWordIndex: number = -1;

  // Data provider
  private dataProvider: IHighlightingProvider = compositeTimingDataProvider;

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): AudioHighlightingService {
    if (!AudioHighlightingService.instance) {
      AudioHighlightingService.instance = new AudioHighlightingService();
    }
    return AudioHighlightingService.instance;
  }

  /**
   * Start highlighting for a reading
   * Loads timing data and initializes highlighting
   */
  async startHighlighting(options: HighlightingOptions): Promise<void> {
    try {
      console.log(`[AudioHighlighting] Starting: ${options.readingId}/${options.readingType}`);

      // Store callbacks
      this.onWordChangeCallback = options.onWordChange;
      this.onCompleteCallback = options.onComplete;
      this.onErrorCallback = options.onError;

      // Update config with overrides
      this.config = {
        ...DEFAULT_HIGHLIGHTING_CONFIG,
        ...options.config,
      };

      // Load timing data
      // Extract date from readingId (format: "type_YYYY-MM-DD")
      const dateStr = options.readingId.split('_').slice(-1)[0];
      const date = new Date(`${dateStr}T00:00:00Z`);

      this.timingData = await this.dataProvider.getTimingData(
        options.readingId,
        options.readingType,
        date,
      );

      if (!this.timingData) {
        throw new Error(`No timing data found for ${options.readingId}`);
      }

      // Initialize state
      this.currentState = {
        currentPositionMs: 0,
        currentWordIndex: -1,
        isPlaying: true,
        durationMs: this.timingData.durationMs,
        updatedAt: Date.now(),
      };

      this.lastEmittedWordIndex = -1;

      // Start position update loop
      this.startPositionTracking();

      console.log(`[AudioHighlighting] ✅ Started with ${this.timingData.words.length} words`);
    } catch (error) {
      // Log as warning if timing data not available (expected); error if unexpected issue
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isTimingDataMissing = errorMsg.includes('No timing data found');

      if (isTimingDataMissing) {
        console.warn('[AudioHighlighting] Timing data not available (will fallback to audio-only):', error);
      } else {
        console.error('[AudioHighlighting] Failed to start (unexpected error):', error);
      }

      const err = error instanceof Error ? error : new Error(String(error));
      this.onErrorCallback?.(err);
      throw err;
    }
  }

  /**
   * Stop highlighting and cleanup
   */
  stopHighlighting(): void {
    console.log('[AudioHighlighting] Stopping highlighting');

    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }

    this.currentState.isPlaying = false;
    this.emitStateChange();
  }

  /**
   * Update audio position (called from audio player)
   * @param positionMs Current position in milliseconds
   */
  updateAudioPosition(positionMs: number): void {
    if (!this.timingData) return;

    this.currentState.currentPositionMs = positionMs;
    this.currentState.isPlaying = true;
    this.currentState.updatedAt = Date.now();

    // Find current word
    const wordIndex = this.findCurrentWordIndex(positionMs);

    // Check if word changed
    if (wordIndex !== this.lastEmittedWordIndex) {
      this.currentState.currentWordIndex = wordIndex;
      this.currentState.currentWord = wordIndex >= 0 ? this.timingData.words[wordIndex] : undefined;

      if (wordIndex >= 0 && this.lastEmittedWordIndex >= 0) {
        // Emit word change event
        const event: WordChangeEvent = {
          word: this.timingData.words[wordIndex],
          previousWord: this.timingData.words[this.lastEmittedWordIndex],
          positionMs,
          timestamp: Date.now(),
        };
        this.onWordChangeCallback?.(event);
      }

      this.lastEmittedWordIndex = wordIndex;
      this.emitStateChange();
    }

    // Check if playback finished
    if (positionMs >= this.timingData.durationMs) {
      this.onCompleteCallback?.();
    }
  }

  /**
   * Pause highlighting
   */
  pauseHighlighting(): void {
    this.currentState.isPlaying = false;
    this.emitStateChange();
  }

  /**
   * Resume highlighting
   */
  resumeHighlighting(): void {
    this.currentState.isPlaying = true;
    this.emitStateChange();
  }

  /**
   * Seek to position
   * @param positionMs Position in milliseconds
   */
  seekToPosition(positionMs: number): void {
    if (!this.timingData) return;

    // Clamp to valid range
    const clampedPosition = Math.max(0, Math.min(positionMs, this.timingData.durationMs));

    this.currentState.currentPositionMs = clampedPosition;
    this.updateAudioPosition(clampedPosition);
  }

  /**
   * Get current highlighting state
   */
  getCurrentState(): HighlightingState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  onStateChange(listener: HighlightingStateListener): () => void {
    this.stateListeners.add(listener);

    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Emit state change to all listeners
   */
  private emitStateChange(): void {
    const state = { ...this.currentState };
    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch (error) {
        console.error('[AudioHighlighting] Error in state listener:', error);
      }
    }
  }

  /**
   * Start position tracking loop
   * Updates highlighting every updateIntervalMs
   */
  private startPositionTracking(): void {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    this.updateIntervalId = setInterval(() => {
      if (this.currentState.isPlaying && this.timingData) {
        // In a real implementation, this would be called by the audio player
        // For now, just emit periodic updates
        this.emitStateChange();
      }
    }, this.config.updateIntervalMs);
  }

  /**
   * Find current word index using binary search
   * O(log n) complexity - very fast even for long texts
   *
   * @param positionMs Current audio position
   * @returns Word index or -1 if no word found
   */
  private findCurrentWordIndex(positionMs: number): number {
    if (!this.timingData || this.timingData.words.length === 0) {
      return -1;
    }

    const words = this.timingData.words;

    // Binary search for current word
    let left = 0;
    let right = words.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const word = words[mid];

      // Check if position is within this word's range
      if (positionMs >= word.startMs && positionMs < word.endMs) {
        return mid;
      }

      // Position is before this word
      if (positionMs < word.startMs) {
        right = mid - 1;
      }
      // Position is after this word
      else {
        left = mid + 1;
      }
    }

    // No exact match found, return closest word before position
    if (left > 0 && left - 1 < words.length) {
      return left - 1;
    }

    return -1;
  }

  /**
   * Get timing data performance metrics
   */
  getMetrics(): {
    wordCount: number;
    durationMs: number;
    updateIntervalMs: number;
    estimatedMemoryKb: number;
  } {
    if (!this.timingData) {
      return {
        wordCount: 0,
        durationMs: 0,
        updateIntervalMs: this.config.updateIntervalMs,
        estimatedMemoryKb: 0,
      };
    }

    const estimatedMemoryKb = JSON.stringify(this.timingData).length / 1024;

    return {
      wordCount: this.timingData.words.length,
      durationMs: this.timingData.durationMs,
      updateIntervalMs: this.config.updateIntervalMs,
      estimatedMemoryKb,
    };
  }

  /**
   * Get timing data for debugging
   */
  getTimingData(): SentenceTimingData | null {
    return this.timingData;
  }

  /**
   * Set custom data provider (for testing)
   */
  setDataProvider(provider: IHighlightingProvider): void {
    this.dataProvider = provider;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopHighlighting();
    this.stateListeners.clear();
    this.onWordChangeCallback = undefined;
    this.onCompleteCallback = undefined;
    this.onErrorCallback = undefined;
    this.timingData = null;
  }
}

/**
 * Export singleton instance
 */
export const audioHighlightingService = AudioHighlightingService.getInstance();
