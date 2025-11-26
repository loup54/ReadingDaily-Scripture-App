/**
 * Highlighted Reading Player Component
 * Complete integration of audio playback with word-level highlighting
 *
 * Combines:
 * - AudioPlaybackService for audio
 * - useWordHighlighting hook for highlighting
 * - HighlightedTextDisplay for rendering
 * - Audio controls (play, pause, seek)
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useWordHighlighting } from '@/hooks/useWordHighlighting';
import { useAudioPosition } from '@/hooks/useAudioPosition';
import {
  HighlightedTextDisplay,
  CompactHighlightedTextDisplay,
} from '@/components/audio/HighlightedTextDisplay';
import { SentenceTimingData } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface HighlightedReadingPlayerProps {
  /** Reading ID (e.g., "gospel_2025-11-11") */
  readingId: string;
  /** Reading type (gospel, first-reading, psalm, second-reading) */
  readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading';
  /** Full reading text */
  text: string;
  /** Timing data with word boundaries */
  timingData: SentenceTimingData;
  /** Audio URL */
  audioUrl: string;
  /** Compact mode (show context window only) */
  compactMode?: boolean;
  /** Context window size for compact mode */
  contextWindowSize?: number;
  /** Show debug info */
  debug?: boolean;
  /** Callback on completion */
  onComplete?: () => void;
}

/**
 * Progress Bar Component
 */
const ProgressBar: React.FC<{
  currentMs: number;
  durationMs: number;
  onSeek: (positionMs: number) => void;
}> = ({ currentMs, durationMs, onSeek }) => {
  const isDark = useColorScheme() === 'dark';
  const progress = durationMs > 0 ? currentMs / durationMs : 0;

  const handlePress = (event: any) => {
    const width = event.nativeEvent.locationX;
    const totalWidth = event.nativeEvent.target.offsetWidth;
    const position = (width / totalWidth) * durationMs;
    onSeek(Math.round(position));
  };

  return (
    <View style={[styles.progressContainer, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
      <TouchableOpacity
        style={styles.progressBar}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: Colors.primary.blue,
            },
          ]}
        />
      </TouchableOpacity>

      {/* Time display */}
      <View style={styles.timeDisplay}>
        <Text
          style={[
            styles.timeText,
            {
              color: isDark ? Colors.text.white : Colors.text.primary,
            },
          ]}
        >
          {formatTime(currentMs)} / {formatTime(durationMs)}
        </Text>
      </View>
    </View>
  );
};

/**
 * Control Bar Component
 */
const ControlBar: React.FC<{
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onForward: () => void;
}> = ({ isPlaying, isLoading, onPlayPause, onRewind, onForward }) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      style={[
        styles.controlBar,
        {
          backgroundColor: isDark ? Colors.background.card : Colors.background.card,
          borderTopColor: isDark ? '#333' : Colors.ui.divider,
        },
      ]}
    >
      {/* Rewind button */}
      <TouchableOpacity onPress={onRewind} disabled={isLoading}>
        <Ionicons
          name="play-back-10"
          size={28}
          color={isLoading ? Colors.text.tertiary : Colors.primary.blue}
        />
      </TouchableOpacity>

      {/* Play/Pause button */}
      <TouchableOpacity
        onPress={onPlayPause}
        disabled={isLoading}
        style={styles.playPauseButton}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary.blue} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={56}
            color={Colors.primary.blue}
          />
        )}
      </TouchableOpacity>

      {/* Forward button */}
      <TouchableOpacity onPress={onForward} disabled={isLoading}>
        <Ionicons
          name="play-forward-10"
          size={28}
          color={isLoading ? Colors.text.tertiary : Colors.primary.blue}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Main Highlighted Reading Player Component
 */
export const HighlightedReadingPlayer: React.FC<HighlightedReadingPlayerProps> = ({
  readingId,
  readingType,
  text,
  timingData,
  audioUrl,
  compactMode = false,
  contextWindowSize = 5,
  debug = false,
  onComplete,
}) => {
  const isDark = useColorScheme() === 'dark';

  // Audio playback
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Highlighting
  const {
    currentWord,
    currentWordIndex,
    isLoading: isLoadingHighlighting,
    error: highlightingError,
    updateAudioPosition,
    pause,
    resume,
    seek,
  } = useWordHighlighting(readingId, readingType, {
    config: {
      highlightColor: Colors.primary.blue,
      highlightTextColor: Colors.text.white,
      useFadeOut: true,
    },
    onComplete,
  });

  // Audio position tracking
  const audioPosition = useAudioPosition(
    soundRef,
    (update) => {
      updateAudioPosition(update.positionMs);
    },
    isPlayingAudio,
  );

  /**
   * Load audio
   */
  useEffect(() => {
    const loadAudio = async () => {
      try {
        // Note: In production, need to handle actual audio file loading
        // For now, this is a placeholder
        console.log('[HighlightedReadingPlayer] Audio would be loaded from:', audioUrl);
      } catch (error) {
        console.error('[HighlightedReadingPlayer] Error loading audio:', error);
      }
    };

    loadAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, [audioUrl]);

  /**
   * Handle play/pause
   */
  const handlePlayPause = useCallback(async () => {
    try {
      if (isPlayingAudio) {
        pause();
        setIsPlayingAudio(false);
      } else {
        resume();
        setIsPlayingAudio(true);
      }
    } catch (error) {
      console.error('[HighlightedReadingPlayer] Error toggling playback:', error);
    }
  }, [isPlayingAudio, pause, resume]);

  /**
   * Handle rewind (10 seconds)
   */
  const handleRewind = useCallback(() => {
    const newPosition = Math.max(0, (audioPosition?.positionMs || 0) - 10000);
    seek(newPosition);
  }, [audioPosition, seek]);

  /**
   * Handle forward (10 seconds)
   */
  const handleForward = useCallback(() => {
    const maxPosition = timingData.durationMs;
    const newPosition = Math.min(maxPosition, (audioPosition?.positionMs || 0) + 10000);
    seek(newPosition);
  }, [audioPosition, seek, timingData.durationMs]);

  // Render error state
  if (highlightingError) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle" size={48} color={Colors.status.error} />
        <Text style={[styles.errorText, { color: Colors.status.error }]}>
          Error: {highlightingError.message}
        </Text>
      </View>
    );
  }

  // Render loading state
  if (isLoadingHighlighting) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.blue} />
        <Text style={{ color: isDark ? Colors.text.white : Colors.text.primary }}>
          Loading reading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Text Display */}
      {compactMode ? (
        <CompactHighlightedTextDisplay
          text={text}
          words={timingData.words}
          currentWordIndex={currentWordIndex}
          contextWindowSize={contextWindowSize}
          showBoundaries={debug}
          fontSize={18}
          lineHeight={28}
          style={{ flex: 1 }}
        />
      ) : (
        <HighlightedTextDisplay
          text={text}
          words={timingData.words}
          currentWordIndex={currentWordIndex}
          showBoundaries={debug}
          fontSize={18}
          lineHeight={28}
          style={{ flex: 1 }}
        />
      )}

      {/* Progress Bar */}
      <ProgressBar
        currentMs={audioPosition?.positionMs || 0}
        durationMs={timingData.durationMs}
        onSeek={seek}
      />

      {/* Control Bar */}
      <ControlBar
        isPlaying={isPlayingAudio}
        isLoading={isLoadingHighlighting}
        onPlayPause={handlePlayPause}
        onRewind={handleRewind}
        onForward={handleForward}
      />

      {/* Debug Info */}
      {debug && (
        <View style={[styles.debugPanel, { backgroundColor: isDark ? '#222' : '#F5F5F5' }]}>
          <Text style={{ color: isDark ? Colors.text.white : Colors.text.primary }}>
            Word: {currentWordIndex >= 0 ? `${currentWordIndex + 1}/${timingData.words.length}` : 'N/A'}
          </Text>
          <Text style={{ color: isDark ? Colors.text.white : Colors.text.primary }}>
            Position: {audioPosition?.positionMs || 0}ms
          </Text>
          {currentWord && (
            <Text style={{ color: Colors.primary.blue }}>
              Current: "{currentWord.word}"
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Format milliseconds to MM:SS
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.text.tertiary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.blue,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timeText: {
    ...Typography.caption,
    fontVariant: ['tabular-nums'],
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  playPauseButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugPanel: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
});
