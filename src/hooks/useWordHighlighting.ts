/**
 * useWordHighlighting Hook
 * Manages word-level highlighting state during audio playback
 * Integrates with AudioHighlightingService
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HighlightingState,
  HighlightingOptions,
  HighlightingStateListener,
  WordTiming,
} from '@/types';
import { audioHighlightingService } from '@/services/audio/AudioHighlightingService';

/**
 * Hook for managing word-level highlighting
 *
 * @param readingId Unique reading identifier
 * @param readingType Type of reading (gospel, first-reading, etc.)
 * @param options Highlighting configuration and callbacks
 *
 * @example
 * const { currentWord, currentWordIndex, isPlaying } = useWordHighlighting(
 *   'gospel_2025-11-11',
 *   'gospel',
 *   {
 *     config: { highlightColor: '#FF6B6B' },
 *     onWordChange: (index, word) => console.log(`Word: ${word.word}`),
 *   }
 * );
 */
export function useWordHighlighting(
  readingId: string,
  readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading',
  options?: Partial<HighlightingOptions>,
): {
  currentWord: WordTiming | undefined;
  currentWordIndex: number;
  isPlaying: boolean;
  durationMs: number;
  currentPositionMs: number;
  isLoading: boolean;
  error: Error | null;
  updateAudioPosition: (positionMs: number) => void;
  pause: () => void;
  resume: () => void;
  seek: (positionMs: number) => void;
} {
  // State
  const [state, setState] = useState<HighlightingState>({
    currentPositionMs: 0,
    currentWordIndex: -1,
    isPlaying: false,
    durationMs: 0,
    updatedAt: Date.now(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Initialize highlighting service
   */
  useEffect(() => {
    if (isInitializedRef.current) {
      return;
    }

    const initializeHighlighting = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const highlightingOptions: HighlightingOptions = {
          readingId,
          readingType,
          config: options?.config,
          onWordChange: options?.onWordChange,
          onComplete: options?.onComplete,
          onError: (err) => {
            setError(err);
            options?.onError?.(err);
          },
        };

        // Start highlighting
        await audioHighlightingService.startHighlighting(highlightingOptions);

        // Subscribe to state changes
        const unsubscribe = audioHighlightingService.onStateChange(
          ((newState: HighlightingState) => {
            setState(newState);
          }) as HighlightingStateListener,
        );

        unsubscribeRef.current = unsubscribe;
        isInitializedRef.current = true;

        console.log('[useWordHighlighting] ✅ Initialized');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('[useWordHighlighting] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeHighlighting();

    return () => {
      // Cleanup is in the second effect
    };
  }, [readingId, readingType, options]);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      audioHighlightingService.stopHighlighting();
    };
  }, []);

  /**
   * Update audio position (called from audio player)
   */
  const updateAudioPosition = useCallback((positionMs: number) => {
    audioHighlightingService.updateAudioPosition(positionMs);
  }, []);

  /**
   * Pause highlighting
   */
  const pause = useCallback(() => {
    audioHighlightingService.pauseHighlighting();
  }, []);

  /**
   * Resume highlighting
   */
  const resume = useCallback(() => {
    audioHighlightingService.resumeHighlighting();
  }, []);

  /**
   * Seek to position
   */
  const seek = useCallback((positionMs: number) => {
    audioHighlightingService.seekToPosition(positionMs);
  }, []);

  return {
    currentWord: state.currentWord,
    currentWordIndex: state.currentWordIndex,
    isPlaying: state.isPlaying,
    durationMs: state.durationMs,
    currentPositionMs: state.currentPositionMs,
    isLoading,
    error,
    updateAudioPosition,
    pause,
    resume,
    seek,
  };
}

/**
 * Hook for simple word highlighting state (read-only)
 * Useful if you only need to display highlighting, not control it
 */
export function useWordHighlightingState(
  readingId: string,
  readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading',
): HighlightingState | null {
  const [state, setState] = useState<HighlightingState | null>(null);

  useEffect(() => {
    const unsubscribe = audioHighlightingService.onStateChange((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Hook for highlighting metrics (debugging/monitoring)
 */
export function useHighlightingMetrics() {
  const [metrics, setMetrics] = useState({
    wordCount: 0,
    durationMs: 0,
    updateIntervalMs: 100,
    estimatedMemoryKb: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = audioHighlightingService.getMetrics();
      setMetrics(current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/**
 * Hook for word change events with detailed tracking
 */
export function useWordChangeTracker(onWordChange?: (event: { word: WordTiming; previousWord?: WordTiming; positionMs: number; timestamp: number }) => void) {
  useEffect(() => {
    if (!onWordChange) return;

    const unsubscribe = audioHighlightingService.onStateChange((state) => {
      if (state.currentWord) {
        onWordChange({
          word: state.currentWord,
          previousWord: undefined, // Would need to track previous in service
          positionMs: state.currentPositionMs,
          timestamp: state.updatedAt,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onWordChange]);
}
