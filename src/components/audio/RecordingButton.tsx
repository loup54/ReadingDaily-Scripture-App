/**
 * Recording Button Component
 * Phase D1: Audio Recording
 *
 * Button for recording user's voice with visual feedback
 * Enhanced with pulsing animation and instructional overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AudioRecordingService from '@/services/speech/AudioRecordingService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import type { RecordingInfo } from '@/services/speech/AudioRecordingService';

interface RecordingButtonProps {
  onRecordingComplete?: (uri: string) => void;
  disabled?: boolean;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const hintOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check permissions on mount
    checkPermissions();
    // Start pulsing animation
    startPulseAnimation();
  }, []);

  useEffect(() => {
    // Update duration periodically
    if (isRecording) {
      const interval = setInterval(() => {
        setDuration(prev => prev + 100);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isRecording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const dismissHint = () => {
    Animated.timing(hintOpacityAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowHint(false);
    });
  };

  const checkPermissions = async () => {
    try {
      const granted = await AudioRecordingService.hasPermissions();
      setHasPermission(granted);
    } catch (error) {
      console.error('[RecordingButton] Initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize audio recording');
    }
  };

  const handlePress = async () => {
    if (disabled) return;

    // Dismiss hint on first interaction
    if (showHint && !hasInteracted) {
      setHasInteracted(true);
      dismissHint();
    }

    try {
      if (isRecording) {
        // Stop recording
        const recordingInfo = await AudioRecordingService.stopRecording();
        setIsRecording(false);
        setDuration(0);

        // Call callback with the recording URI
        if (onRecordingComplete && recordingInfo?.uri) {
          onRecordingComplete(recordingInfo.uri);
        }
      } else {
        // Check permissions
        if (hasPermission === false) {
          const granted = await AudioRecordingService.requestPermissions();
          setHasPermission(granted);

          if (!granted) {
            Alert.alert(
              'Permission Required',
              'Microphone permission is required to record audio. Please enable it in Settings.'
            );
            return;
          }
        }

        // Start recording
        await AudioRecordingService.startRecording();
        setIsRecording(true);
        setDuration(0);
      }
    } catch (error: any) {
      console.error('[RecordingButton] Recording error:', error);
      Alert.alert('Error', error.message || 'Failed to record audio');
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const buttonColor = isRecording ? colors.accent.red : colors.primary.blue;
  const buttonSize = 120;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <View style={styles.container}>
      {/* Pulsing ring (only when not recording) */}
      {!isRecording && !disabled && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              backgroundColor: buttonColor,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}

      {/* Duration display */}
      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={[styles.recordingIndicator, { backgroundColor: colors.accent.red }]} />
          <Text style={[styles.durationText, { color: colors.text.primary }]}>
            {formatDuration(duration)}
          </Text>
        </View>
      )}

      {/* Main Record Button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: buttonColor,
            width: buttonSize,
            height: buttonSize,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={isRecording ? 40 : 48}
          color={colors.text.white}
        />
      </TouchableOpacity>

      {/* Label text */}
      <Text style={[styles.labelText, { color: colors.text.secondary }]}>
        {isRecording ? 'Tap to stop' : 'Tap to record'}
      </Text>

      {/* Instructional Overlay - First Visit */}
      {showHint && !isRecording && (
        <Animated.View style={[styles.hintOverlay, { opacity: hintOpacityAnim }]}>
          <View style={[styles.hintBox, { backgroundColor: colors.primary.blue }]}>
            <Ionicons name="arrow-up" size={24} color={colors.text.white} />
            <Text style={[styles.hintText, { color: colors.text.white }]}>
              Tap the button to start recording
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 1,
  },
  button: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 2,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  durationText: {
    ...Typography.title,
    fontVariant: ['tabular-nums'],
  },
  labelText: {
    ...Typography.body,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  hintOverlay: {
    position: 'absolute',
    bottom: -60,
    alignItems: 'center',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  hintText: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '500',
  },
});
