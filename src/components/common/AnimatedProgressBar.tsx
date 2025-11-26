/**
 * AnimatedProgressBar Component
 *
 * Smooth progress bar with animated fill width.
 * Used for downloads, uploads, batch operations, data loading.
 *
 * Features:
 * - Smooth width animation to new progress
 * - Progress percentage display (optional)
 * - Customizable colors and height
 * - Motion-safe support
 * - Non-blocking animations
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { AnimationDurations } from '@/constants/animations';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface AnimatedProgressBarProps {
  /** Progress value 0-100 */
  progress: number;

  /** Height of progress bar (default: 6) */
  height?: number;

  /** Background color (default: Colors.background.secondary) */
  backgroundColor?: string;

  /** Fill color (default: Colors.primary.blue) */
  fillColor?: string;

  /** Show percentage label (default: false) */
  showPercentage?: boolean;

  /** Percentage text color (default: Colors.text.secondary) */
  percentageColor?: string;

  /** Smooth animation duration (default: 300ms) */
  duration?: number;

  /** Optional custom container style */
  containerStyle?: ViewStyle;

  /** Optional custom text style */
  textStyle?: TextStyle;

  /** Label text (e.g., "Downloading") */
  label?: string;

  /** Disable animation (show instant updates) */
  disableAnimation?: boolean;
}

/**
 * AnimatedProgressBar Component
 *
 * Displays smooth animated progress bar.
 *
 * @example
 * <AnimatedProgressBar
 *   progress={65}
 *   showPercentage={true}
 *   label="Downloading..."
 * />
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 6,
  backgroundColor = Colors.background.secondary,
  fillColor = Colors.primary.blue,
  showPercentage = false,
  percentageColor = Colors.text.secondary,
  duration = AnimationDurations.STANDARD,
  containerStyle,
  textStyle,
  label,
  disableAnimation = false,
}) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const widthAnim = useRef(new Animated.Value(0)).current;

  // Clamp progress to 0-100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  useEffect(() => {
    const targetValue = clampedProgress / 100;

    if (prefersReducedMotion || disableAnimation) {
      // Instant update
      widthAnim.setValue(targetValue);
    } else {
      // Smooth animation
      Animated.timing(widthAnim, {
        toValue: targetValue,
        duration,
        useNativeDriver: false, // Width animations require false
      }).start();
    }
  }, [clampedProgress, prefersReducedMotion, disableAnimation, duration, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const showLabel = label || showPercentage;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label and Percentage Row */}
      {showLabel && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, textStyle]}>{label}</Text>}
          {showPercentage && (
            <Text style={[styles.percentage, { color: percentageColor }, textStyle]}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBar,
          {
            height,
            backgroundColor,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth,
              backgroundColor: fillColor,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  percentage: {
    ...Typography.body,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
