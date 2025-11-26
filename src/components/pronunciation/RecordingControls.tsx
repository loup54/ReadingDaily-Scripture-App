/**
 * RecordingControls Component
 *
 * Provides recording controls for pronunciation practice:
 * - Start/stop recording button
 * - Recording duration display
 * - Recording state indicator (idle, recording, processing)
 * - Microphone permission handling
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from '@/components/common/IconButton';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { RecordingState } from '@/types/practice.types';
import { AudioRecordingService } from '@/services/speech';

interface RecordingControlsProps {
  recordingState: RecordingState;
  recordingDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const [liveDuration, setLiveDuration] = useState(0);

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing' || recordingState === 'preparing';
  const isDisabled = disabled || isProcessing;

  // Live timer during recording
  useEffect(() => {
    if (isRecording) {
      setLiveDuration(0);
      timerInterval.current = setInterval(() => {
        setLiveDuration(prev => prev + 100);
      }, 100);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRecording]);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const getButtonColor = () => {
    if (isRecording) return Colors.accent.red;
    if (isProcessing) return Colors.background.tertiary;
    return Colors.primary.blue;
  };

  const getStatusText = () => {
    switch (recordingState) {
      case 'preparing':
        return 'Preparing...';
      case 'recording':
        return 'Recording';
      case 'processing':
        return 'Processing...';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return 'Tap to Record';
    }
  };

  const isIdleState = recordingState === 'idle' || recordingState === 'error';

  const handlePress = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <View style={[styles.container, isIdleState && styles.containerHorizontal]}>
      {/* Horizontal Layout for Idle State */}
      {isIdleState && (
        <Text style={styles.statusText}>{getStatusText()}</Text>
      )}

      {/* Recording Button Container */}
      <View style={[styles.buttonContainer, isIdleState && styles.buttonContainerCompact]}>
        <View style={[styles.buttonBackdrop, isIdleState && styles.buttonBackdropCompact]} />

        <Animated.View
          style={[
            styles.recordingRing,
            isRecording && {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.3, 0],
              }),
            },
          ]}
        >
          {isRecording && (
            <View
              style={[
                styles.pulseRing,
                { backgroundColor: Colors.accent.red },
              ]}
            />
          )}
        </Animated.View>

        <IconButton
          icon={isRecording ? 'stop-circle' : 'mic'}
          onPress={handlePress}
          size="lg"
          variant="filled"
          backgroundColor={getButtonColor()}
          disabled={isDisabled}
          style={styles.recordButton}
        />
      </View>

      {/* Status Text Below Button (non-idle states) */}
      {!isIdleState && (
        <Text style={styles.statusTextBelow}>{getStatusText()}</Text>
      )}

      {/* Duration Display */}
      {(isRecording || recordingState === 'complete') && (
        <View style={styles.durationContainer}>
          <Ionicons
            name="time-outline"
            size={16}
            color={Colors.text.secondary}
          />
          <Text style={styles.durationText}>
            {AudioRecordingService.formatDuration(isRecording ? liveDuration : recordingDuration)}
          </Text>
        </View>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <View style={styles.indicatorContainer}>
          <View style={styles.indicator} />
          <Text style={styles.indicatorText}>Recording in progress</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  containerHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statusText: {
    ...Typography.body,
    color: Colors.text.primary,
    marginBottom: 0,
    flexShrink: 1,
    maxWidth: '50%',
  },
  statusTextBelow: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    marginBottom: Spacing.md,
  },
  buttonContainerCompact: {
    width: 80,
    height: 80,
    marginBottom: 0,
  },
  recordingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  buttonBackdrop: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primary.blue,
    opacity: 0.08,
  },
  buttonBackdropCompact: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 12,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  durationText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.red,
    marginRight: Spacing.sm,
  },
  indicatorText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
