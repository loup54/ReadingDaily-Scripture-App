/**
 * Audio Comparison Component
 * Phase D4: Pronunciation Feedback
 *
 * Compare user recording with TTS pronunciation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { googleTTSService } from '@/services/tts/GoogleTTSService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

interface AudioComparisonProps {
  text: string;
  userRecordingUri: string;
}

export const AudioComparison: React.FC<AudioComparisonProps> = ({
  text,
  userRecordingUri,
}) => {
  const { colors } = useTheme();
  const [ttsSound, setTtsSound] = useState<Audio.Sound | null>(null);
  const [userSound, setUserSound] = useState<Audio.Sound | null>(null);
  const [isLoadingTts, setIsLoadingTts] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [playingSource, setPlayingSource] = useState<'tts' | 'user' | null>(null);

  useEffect(() => {
    // Load user recording
    loadUserRecording();

    return () => {
      // Cleanup
      ttsSound?.unloadAsync();
      userSound?.unloadAsync();
    };
  }, [userRecordingUri]);

  const loadUserRecording = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: userRecordingUri },
        { shouldPlay: false },
        onUserPlaybackStatusUpdate
      );
      setUserSound(sound);
    } catch (error) {
      console.error('[AudioComparison] Failed to load user recording:', error);
    }
  };

  const loadTtsAudio = async () => {
    try {
      setIsLoadingTts(true);
      setTtsError(null);
      console.log('[AudioComparison] Generating TTS audio...');

      // Generate TTS audio
      const audioUri = await googleTTSService.speak(text);

      // Load TTS audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onTtsPlaybackStatusUpdate
      );

      setTtsSound(sound);
      setPlayingSource('tts');

      // Auto-play after loading
      await sound.playAsync();

      console.log('[AudioComparison] TTS audio loaded and playing');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load TTS audio';
      console.error('[AudioComparison] Failed to load TTS audio:', error);
      setTtsError(errorMessage);
      setPlayingSource(null);
    } finally {
      setIsLoadingTts(false);
    }
  };

  const playTts = async () => {
    try {
      // Stop user recording if playing
      if (playingSource === 'user') {
        await userSound?.stopAsync();
      }

      // Load TTS if not loaded
      if (!ttsSound) {
        await loadTtsAudio();
        return; // Will auto-play after loading
      }

      // Play or pause TTS
      const status = await ttsSound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await ttsSound.pauseAsync();
          setPlayingSource(null);
        } else {
          await ttsSound.setPositionAsync(0);
          await ttsSound.playAsync();
          setPlayingSource('tts');
        }
      }
    } catch (error) {
      console.error('[AudioComparison] TTS playback error:', error);
    }
  };

  const playUser = async () => {
    try {
      // Stop TTS if playing
      if (playingSource === 'tts') {
        await ttsSound?.stopAsync();
      }

      if (!userSound) return;

      // Play or pause user recording
      const status = await userSound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await userSound.pauseAsync();
          setPlayingSource(null);
        } else {
          await userSound.setPositionAsync(0);
          await userSound.playAsync();
          setPlayingSource('user');
        }
      }
    } catch (error) {
      console.error('[AudioComparison] User playback error:', error);
    }
  };

  const onTtsPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      setPlayingSource(null);
      ttsSound?.setPositionAsync(0);
    }
  };

  const onUserPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      setPlayingSource(null);
      userSound?.setPositionAsync(0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={styles.header}>
        <Ionicons name="headset" size={20} color={colors.primary.blue} />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Compare Audio
        </Text>
      </View>

      <Text style={[styles.description, { color: colors.text.secondary }]}>
        Listen to the correct pronunciation and compare it with your recording
      </Text>

      <View style={styles.buttonsContainer}>
        {/* TTS Button */}
        <TouchableOpacity
          style={[
            styles.audioButton,
            {
              backgroundColor: ttsError
                ? `${colors.ui.error}20`
                : playingSource === 'tts'
                ? colors.primary.blue
                : `${colors.primary.blue}20`,
              borderColor: ttsError ? colors.ui.error : colors.primary.blue,
            },
          ]}
          onPress={playTts}
          disabled={isLoadingTts || !!ttsError}
        >
          <View style={styles.buttonContent}>
            {isLoadingTts ? (
              <>
                <ActivityIndicator size="small" color={colors.primary.blue} />
                <Text style={[styles.loadingText, { color: colors.primary.blue }]}>Generating...</Text>
              </>
            ) : ttsError ? (
              <Ionicons
                name="alert-circle"
                size={28}
                color={colors.ui.error}
              />
            ) : (
              <Ionicons
                name={playingSource === 'tts' ? 'pause' : 'play'}
                size={28}
                color={playingSource === 'tts' ? colors.text.white : colors.primary.blue}
              />
            )}
            <View style={styles.buttonTextContainer}>
              <Text
                style={[
                  styles.buttonLabel,
                  {
                    color: isLoadingTts
                      ? colors.primary.blue
                      : ttsError
                      ? colors.ui.error
                      : playingSource === 'tts'
                      ? colors.text.white
                      : colors.primary.blue,
                  },
                ]}
              >
                Correct
              </Text>
              <Text
                style={[
                  styles.buttonSubtext,
                  {
                    color: ttsError
                      ? colors.ui.error
                      : playingSource === 'tts'
                      ? `${colors.text.white}80`
                      : colors.text.secondary,
                    fontSize: ttsError ? 11 : 12,
                  },
                ]}
              >
                {ttsError ? 'API Not Configured' : 'Text-to-Speech'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* User Recording Button */}
        <TouchableOpacity
          style={[
            styles.audioButton,
            {
              backgroundColor: playingSource === 'user'
                ? colors.ui.warning
                : `${colors.ui.warning}20`,
              borderColor: colors.ui.warning,
            },
          ]}
          onPress={playUser}
        >
          <View style={styles.buttonContent}>
            <Ionicons
              name={playingSource === 'user' ? 'pause' : 'play'}
              size={28}
              color={playingSource === 'user' ? colors.text.white : colors.ui.warning}
            />
            <View style={styles.buttonTextContainer}>
              <Text
                style={[
                  styles.buttonLabel,
                  {
                    color: playingSource === 'user' ? colors.text.white : colors.ui.warning,
                  },
                ]}
              >
                Your Voice
              </Text>
              <Text
                style={[
                  styles.buttonSubtext,
                  {
                    color: playingSource === 'user'
                      ? `${colors.text.white}80`
                      : colors.text.secondary,
                  },
                ]}
              >
                Your Recording
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tip or Error Message */}
      <View style={[
        styles.tipContainer,
        ttsError && { backgroundColor: `${colors.ui.error}10`, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: -4 }
      ]}>
        <Ionicons
          name={ttsError ? "information-circle-outline" : "bulb-outline"}
          size={16}
          color={ttsError ? colors.ui.error : colors.text.secondary}
        />
        <Text style={[
          styles.tipText,
          {
            color: ttsError ? colors.ui.error : colors.text.secondary,
            flex: 1,
          }
        ]}>
          {ttsError
            ? 'Google Cloud TTS API is not configured. You can still practice with your recording.'
            : 'Play both audios multiple times to identify differences'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  audioButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    minHeight: 100,
    justifyContent: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buttonTextContainer: {
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  buttonLabel: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSubtext: {
    ...Typography.caption,
    fontSize: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  tipText: {
    ...Typography.caption,
    flex: 1,
  },
  loadingText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '500',
  },
});
