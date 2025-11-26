/**
 * AudioPlayer Component
 * Controls for playing scripture readings with speed and voice options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

export type PlaybackSpeed = '0.75x' | '1.0x' | '1.25x' | '1.5x';
export type VoiceType = 'auto' | 'male' | 'female';

export interface AudioPlayerProps {
  audioUrl?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSpeedChange?: (speed: PlaybackSpeed) => void;
  onVoiceChange?: (voice: VoiceType) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  isPlaying = false,
  onPlayPause,
  onSpeedChange,
  onVoiceChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>('1.0x');
  const [voice, setVoice] = useState<VoiceType>('auto');

  const handleSpeedSelect = (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  };

  const handleVoiceSelect = (newVoice: VoiceType) => {
    setVoice(newVoice);
    onVoiceChange?.(newVoice);
  };

  const speedOptions: PlaybackSpeed[] = ['0.75x', '1.0x', '1.25x', '1.5x'];
  const voiceOptions: VoiceType[] = ['auto', 'male', 'female'];

  return (
    <>
      {/* Main Audio Controls Bar */}
      <View style={styles.container}>
        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlayPause}
          activeOpacity={0.7}
          testID="audio-play-pause-button"
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color={Colors.text.white}
          />
        </TouchableOpacity>

        {/* Speed Control */}
        <View style={styles.controls}>
          <Text style={styles.controlLabel}>Speed</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSettings(true)}
            testID="speed-control-button"
          >
            <Text style={styles.controlValue}>{speed}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Voice Control */}
        <View style={styles.controls}>
          <Text style={styles.controlLabel}>Voice</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowSettings(true)}
            testID="voice-control-button"
          >
            <Text style={styles.controlValue}>
              {voice.charAt(0).toUpperCase() + voice.slice(1)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSettings(false)}>
          <View style={styles.modalContent}>
            {/* Speed Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsTitle}>Playback Speed</Text>
              <View style={styles.optionsContainer}>
                {speedOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      speed === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleSpeedSelect(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        speed === option && styles.optionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Voice Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsTitle}>Voice Type</Text>
              <View style={styles.optionsContainer}>
                {voiceOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      voice === option && styles.optionButtonActive,
                    ]}
                    onPress={() => handleVoiceSelect(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        voice === option && styles.optionTextActive,
                      ]}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    gap: Spacing.md,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flex: 1,
  },
  controlLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  controlValue: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  settingsSection: {
    marginBottom: Spacing.lg,
  },
  settingsTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary.purple + '20',
    borderColor: Colors.primary.purple,
  },
  optionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
  },
  optionTextActive: {
    color: Colors.primary.purple,
    fontWeight: FontWeights.semibold,
  },
  closeButton: {
    backgroundColor: Colors.primary.purple,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  closeButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.white,
  },
});
