/**
 * LoadingState Component
 *
 * Reusable loading indicator with spinner, message, and optional progress bar.
 * Used for contextual loading feedback on screens and operations.
 * Includes subtle pulsing animation for enhanced visual feedback.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { AnimationDurations, TimingConfigs } from '@/constants/animations';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface LoadingStateProps {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md' | 'lg';
  backgroundColor?: string;
  showProgressBar?: boolean;
  progress?: number; // 0-100
  style?: any;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  icon,
  size = 'md',
  backgroundColor = Colors.background.card,
  showProgressBar = false,
  progress = 0,
  style,
}) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (prefersReducedMotion) {
      return; // Skip animation
    }

    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: TimingConfigs.PULSE.duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: TimingConfigs.PULSE.duration / 2,
        useNativeDriver: true,
      }),
    ]);

    const loopAnimation = Animated.loop(pulse);
    loopAnimation.start();

    return () => {
      loopAnimation.stop();
    };
  }, [pulseAnim, prefersReducedMotion]);

  const sizeMap = {
    sm: { spinner: 30, spacing: Spacing.sm },
    md: { spinner: 40, spacing: Spacing.md },
    lg: { spinner: 50, spacing: Spacing.lg },
  };

  const currentSize = sizeMap[size];

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {/* Icon or Spinner with Pulsing Animation */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
        {icon ? (
          <Ionicons name={icon} size={currentSize.spinner} color={Colors.primary.blue} />
        ) : (
          <ActivityIndicator size={currentSize.spinner} color={Colors.primary.blue} />
        )}
      </Animated.View>

      {/* Message */}
      <Text
        style={[
          styles.message,
          {
            marginTop: currentSize.spacing,
            fontSize: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
          },
        ]}
      >
        {message}
      </Text>

      {/* Progress Bar (Optional) */}
      {showProgressBar && (
        <View style={[styles.progressSection, { marginTop: currentSize.spacing }]}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  message: {
    ...Typography.body,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.blue,
    borderRadius: BorderRadius.md,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
});
