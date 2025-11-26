/**
 * Audio Playback Component
 * Phase D1: Audio Recording
 *
 * Component for playing back recorded audio with controls
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speechRecognitionService, PlaybackState } from '@/services/speech/SpeechRecognitionService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

interface AudioPlaybackProps {
  uri: string;
  onDelete?: () => void;
}

export const AudioPlayback: React.FC<AudioPlaybackProps> = ({ uri, onDelete }) => {
  const { colors } = useTheme();
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);

  useEffect(() => {
    // Update playback state periodically
    const interval = setInterval(async () => {
      const state = await speechRecognitionService.getPlaybackStatus();
      setPlaybackState(state);
    }, 100);

    return () => {
      clearInterval(interval);
      speechRecognitionService.stopPlayback();
    };
  }, []);

  const handlePlay = async () => {
    try {
      if (playbackState?.isPlaying) {
        await speechRecognitionService.pausePlayback();
      } else if (playbackState && !playbackState.isPlaying) {
        await speechRecognitionService.resumePlayback();
      } else {
        await speechRecognitionService.playRecording(uri);
      }
    } catch (error: any) {
      console.error('[AudioPlayback] Playback error:', error);
      Alert.alert('Error', error.message || 'Failed to play audio');
    }
  };

  const handleStop = async () => {
    try {
      await speechRecognitionService.stopPlayback();
      setPlaybackState(null);
    } catch (error: any) {
      console.error('[AudioPlayback] Stop error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Recording', 'Are you sure you want to delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await speechRecognitionService.stopPlayback();
            await speechRecognitionService.deleteRecording(uri);
            onDelete?.();
          } catch (error: any) {
            console.error('[AudioPlayback] Delete error:', error);
            Alert.alert('Error', 'Failed to delete recording');
          }
        },
      },
    ]);
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const position = playbackState?.position || 0;
  const duration = playbackState?.duration || 0;
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Playback Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.primary.blue }]}
          onPress={handlePlay}
        >
          <Ionicons
            name={playbackState?.isPlaying ? 'pause' : 'play'}
            size={24}
            color={colors.text.white}
          />
        </TouchableOpacity>

        {playbackState && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.text.secondary }]}
            onPress={handleStop}
          >
            <Ionicons name="stop" size={24} color={colors.text.white} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.accent.red }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={24} color={colors.text.white} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {duration > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.background.tertiary }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary.blue,
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>

          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>
              {formatTime(position)}
            </Text>
            <Text style={[styles.timeText, { color: colors.text.secondary }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>
      )}

      {/* Recording Info */}
      <View style={styles.infoContainer}>
        <Ionicons name="mic" size={16} color={colors.text.secondary} />
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          Your Recording
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...Typography.caption,
    fontVariant: ['tabular-nums'],
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    ...Typography.caption,
  },
});
