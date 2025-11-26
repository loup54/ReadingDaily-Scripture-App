/**
 * useAudioPosition Hook
 * Tracks audio playback position from expo-av
 * Emits position updates at regular intervals
 */

import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import type { AudioPositionUpdate } from '@/types';

/**
 * Configuration for audio position tracking
 */
const POSITION_UPDATE_CONFIG = {
  // Update frequency (100ms = 10 updates per second)
  updateIntervalMs: 100,
  // Maximum polling attempts before giving up
  maxRetries: 5,
};

/**
 * Hook for tracking audio playback position
 * Subscribes to audio position updates and calls callback
 *
 * @param soundRef Reference to expo-av Sound object
 * @param onPositionUpdate Callback when position changes
 * @param enabled Whether tracking is active
 *
 * @example
 * const soundRef = useRef<Audio.Sound | null>(null);
 * useAudioPosition(soundRef, (update) => {
 *   console.log(`Position: ${update.positionMs}ms / ${update.durationMs}ms`);
 * });
 */
export function useAudioPosition(
  soundRef: React.MutableRefObject<Audio.Sound | null>,
  onPositionUpdate?: (update: AudioPositionUpdate) => void,
  enabled: boolean = true,
): AudioPositionUpdate | null {
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<number>(0);
  const [currentUpdate, setCurrentUpdate] = React.useState<AudioPositionUpdate | null>(null);

  /**
   * Get current position and status from audio
   */
  const getAudioPosition = useCallback(async (): Promise<AudioPositionUpdate | null> => {
    try {
      if (!soundRef.current) {
        return null;
      }

      const status = await soundRef.current.getStatusAsync();

      if (!status.isLoaded) {
        return null;
      }

      const update: AudioPositionUpdate = {
        positionMs: Math.round(status.positionMillis || 0),
        durationMs: Math.round(status.durationMillis || 0),
        isPlaying: status.isPlaying,
        timestamp: Date.now(),
      };

      // Only emit if position actually changed (avoid unnecessary updates)
      if (update.positionMs !== lastPositionRef.current) {
        lastPositionRef.current = update.positionMs;
        return update;
      }

      return null;
    } catch (error) {
      console.error('[useAudioPosition] Error getting position:', error);
      return null;
    }
  }, [soundRef]);

  /**
   * Start position tracking loop
   */
  const startTracking = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(async () => {
      try {
        const update = await getAudioPosition();
        if (update) {
          setCurrentUpdate(update);
          onPositionUpdate?.(update);
        }
      } catch (error) {
        console.error('[useAudioPosition] Error in tracking loop:', error);
      }
    }, POSITION_UPDATE_CONFIG.updateIntervalMs);
  }, [getAudioPosition, onPositionUpdate]);

  /**
   * Stop position tracking
   */
  const stopTracking = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  /**
   * Setup/cleanup effect
   */
  useEffect(() => {
    if (enabled && soundRef.current) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, soundRef, startTracking, stopTracking]);

  return currentUpdate;
}

/**
 * Hook for getting single audio position (non-tracking)
 * Useful for reading current position without continuous updates
 */
export function useCurrentAudioPosition(
  soundRef: React.MutableRefObject<Audio.Sound | null>,
): AudioPositionUpdate | null {
  const [position, setPosition] = React.useState<AudioPositionUpdate | null>(null);

  const getPosition = useCallback(async () => {
    try {
      if (!soundRef.current) {
        return;
      }

      const status = await soundRef.current.getStatusAsync();

      if (!status.isLoaded) {
        return;
      }

      setPosition({
        positionMs: Math.round(status.positionMillis || 0),
        durationMs: Math.round(status.durationMillis || 0),
        isPlaying: status.isPlaying,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[useCurrentAudioPosition] Error:', error);
    }
  }, [soundRef]);

  return position;
}

/**
 * Hook for tracking audio playback state (not position)
 * Tracks: isPlaying, duration, isLoaded
 */
export function useAudioPlaybackState(
  soundRef: React.MutableRefObject<Audio.Sound | null>,
): {
  isPlaying: boolean;
  durationMs: number;
  isLoaded: boolean;
} {
  const [state, setState] = React.useState({
    isPlaying: false,
    durationMs: 0,
    isLoaded: false,
  });

  useEffect(() => {
    const checkState = async () => {
      try {
        if (!soundRef.current) return;

        const status = await soundRef.current.getStatusAsync();

        setState({
          isPlaying: status.isPlaying,
          durationMs: status.durationMillis || 0,
          isLoaded: status.isLoaded,
        });
      } catch (error) {
        console.error('[useAudioPlaybackState] Error:', error);
      }
    };

    // Check immediately
    checkState();

    // Check periodically (less frequently than position tracking)
    const interval = setInterval(checkState, 500);

    return () => clearInterval(interval);
  }, [soundRef]);

  return state;
}
