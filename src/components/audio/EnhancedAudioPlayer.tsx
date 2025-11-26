/**
 * Enhanced Audio Player Component
 * Full-featured audio player with TTS generation and playback controls
 *
 * Phase 11: Audio Implementation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { audioPlaybackService, TTS_VOICES, formatDuration } from '@/services/audio';
import { audioHighlightingService } from '@/services/audio/AudioHighlightingService';
import { useAudioSettings, useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import type { AudioPlaybackState } from '@/services/audio';
import type { Reading } from '@/types/reading.types';

export interface EnhancedAudioPlayerProps {
  reading: Reading;
  onPlaybackComplete?: () => void;
}

/**
 * EnhancedAudioPlayer
 * Integrates with AudioPlaybackService for TTS generation and playback
 */
export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  reading,
  onPlaybackComplete,
}) => {
  const { colors } = useTheme();
  const audioSettings = useAudioSettings();
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    speed: audioSettings.speed,
    error: null,
  });

  // Highlighting state
  const [highlightingInitialized, setHighlightingInitialized] = useState(false);
  const [highlightingError, setHighlightingError] = useState<Error | null>(null);

  // Subscribe to playback state updates
  useEffect(() => {
    console.log('[EnhancedAudioPlayer] Setting up subscription to playback service');
    const unsubscribe = audioPlaybackService.subscribe((state) => {
      console.log('[EnhancedAudioPlayer] State update:', {
        isPlaying: state.isPlaying,
        currentTime: state.currentTime,
        duration: state.duration,
        isFinished: state.isFinished,
        error: state.error
      });
      setPlaybackState(state);

      // Update highlighting service with current audio position
      if (highlightingInitialized && state.isPlaying) {
        audioHighlightingService.updateAudioPosition(state.currentTime);
      }

      // Handle playback completion - detect when isFinished is true
      console.log('[EnhancedAudioPlayer] Checking completion:', {
        isFinished: state.isFinished,
        isFinishedType: typeof state.isFinished,
        willTriggerCallback: state.isFinished === true
      });

      if (state.isFinished) {
        console.log('[EnhancedAudioPlayer] 🎉 COMPLETION DETECTED! Calling onPlaybackComplete');
        onPlaybackComplete?.();
      }
    });

    return () => {
      console.log('[EnhancedAudioPlayer] Unsubscribing from playback service');
      unsubscribe();
    };
  }, [onPlaybackComplete, highlightingInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioPlaybackService.cleanup();
      if (highlightingInitialized) {
        console.log('[EnhancedAudioPlayer] Stopping highlighting on unmount');
        audioHighlightingService.stopHighlighting();
      }
    };
  }, [highlightingInitialized]);

  /**
   * Handle play/pause toggle
   */
  const handlePlayPause = async () => {
    if (playbackState.isLoading) return;

    try {
      if (playbackState.isPlaying) {
        // Pause audio and highlighting
        await audioPlaybackService.pause();
        if (highlightingInitialized) {
          console.log('[EnhancedAudioPlayer] Pausing highlighting');
          audioHighlightingService.pauseHighlighting();
        }
      } else {
        // If no audio loaded, generate and play
        if (playbackState.duration === 0) {
          // Initialize highlighting before playing (only if enabled AND timing data exists)
          // Read the CURRENT store value directly to avoid stale hook values during rehydration
          const currentSettings = useSettingsStore.getState().settings;
          const enableHighlighting = currentSettings.audio.enableAudioHighlighting;
          const shouldInitializeHighlighting = !highlightingInitialized && enableHighlighting;

          console.log('[EnhancedAudioPlayer] Highlighting decision:', {
            highlightingInitialized,
            enableAudioHighlighting: enableHighlighting,
            shouldInitialize: shouldInitializeHighlighting,
          });

          if (shouldInitializeHighlighting) {
            try {
              console.log('[EnhancedAudioPlayer] Initializing highlighting service');
              await audioHighlightingService.startHighlighting({
                readingId: reading.id,
                readingType: reading.type as 'gospel' | 'first-reading' | 'psalm' | 'second-reading',
                onWordChange: (event) => {
                  console.log('[EnhancedAudioPlayer] Word changed:', event.word.word);
                },
                onError: (error) => {
                  console.error('[EnhancedAudioPlayer] Highlighting error:', error);
                  setHighlightingError(error);
                },
              });
              setHighlightingInitialized(true);
            } catch (error) {
              // Log as warning (not error) since this is expected when timing data isn't available yet
              console.warn('[EnhancedAudioPlayer] Highlighting unavailable (timing data not ready):', error);
              setHighlightingError(error instanceof Error ? error : new Error(String(error)));
              // Continue with audio playback even if highlighting fails
            }
          }

          const voice =
            audioSettings.voice === 'male'
              ? TTS_VOICES.MALE_PRIMARY
              : TTS_VOICES.FEMALE_PRIMARY;

          await audioPlaybackService.loadAndPlay(
            reading.content,
            reading.id,
            voice,
            audioSettings.speed
          );
        } else {
          // Resume existing audio and highlighting
          if (highlightingInitialized) {
            console.log('[EnhancedAudioPlayer] Resuming highlighting');
            audioHighlightingService.resumeHighlighting();
          }
          await audioPlaybackService.play();
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert(
        'Audio Error',
        'Failed to play audio. Please check your internet connection and try again.'
      );
    }
  };

  /**
   * Handle speed change
   */
  const handleSpeedChange = async (newSpeed: number) => {
    try {
      await audioPlaybackService.setSpeed(newSpeed);
    } catch (error) {
      console.error('Speed change error:', error);
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    return formatDuration(seconds);
  };

  /**
   * Calculate progress percentage
   */
  const progressPercentage =
    playbackState.duration > 0
      ? (playbackState.currentTime / playbackState.duration) * 100
      : 0;

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5];
  const currentSpeedIndex = speedOptions.indexOf(playbackState.speed);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Error Display */}
      {playbackState.error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.ui.error + '15' }]}>
          <Ionicons name="alert-circle" size={16} color={colors.ui.error} />
          <Text style={[styles.errorText, { color: colors.ui.error }]}>{playbackState.error}</Text>
        </View>
      )}

      {/* Main Controls */}
      <View style={styles.controlsRow}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            { backgroundColor: colors.primary.purple },
            (playbackState.isLoading || playbackState.error) && styles.playButtonDisabled,
          ]}
          onPress={handlePlayPause}
          disabled={playbackState.isLoading || !!playbackState.error}
          activeOpacity={0.7}
          testID="enhanced-audio-play-pause-button"
        >
          {playbackState.isLoading ? (
            <ActivityIndicator size="small" color={colors.text.white} />
          ) : (
            <Ionicons
              name={playbackState.isPlaying ? 'pause' : 'play'}
              size={28}
              color={colors.text.white}
            />
          )}
        </TouchableOpacity>

        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>{formatTime(playbackState.currentTime)}</Text>
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>{formatTime(playbackState.duration)}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: colors.background.secondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, progressPercentage)}%`, backgroundColor: colors.primary.purple },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Speed Control */}
        <TouchableOpacity
          style={[styles.speedButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => {
            const nextIndex = (currentSpeedIndex + 1) % speedOptions.length;
            handleSpeedChange(speedOptions[nextIndex]);
          }}
          disabled={playbackState.isLoading}
          testID="speed-control-button"
        >
          <Text style={[styles.speedText, { color: colors.primary.purple }]}>{playbackState.speed.toFixed(2)}x</Text>
        </TouchableOpacity>
      </View>

      {/* Voice Info */}
      <View style={styles.infoRow}>
        <Ionicons name="mic" size={14} color={colors.text.tertiary} />
        <Text style={[styles.infoText, { color: colors.text.tertiary }]}>
          {audioSettings.voice === 'male' ? 'Male Voice' : 'Female Voice'}
        </Text>
        {playbackState.isLoading && (
          <>
            <Ionicons name="cloud-download" size={14} color={colors.text.tertiary} />
            <Text style={[styles.infoText, { color: colors.text.tertiary }]}>Generating audio...</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.md,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.ui.error + '15',
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.ui.error,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  progressInfo: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  timeText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeights.medium,
  },
  progressBarContainer: {
    height: 24,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.purple,
    borderRadius: 2,
  },
  speedButton: {
    width: 56,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary.purple,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  infoText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
});
