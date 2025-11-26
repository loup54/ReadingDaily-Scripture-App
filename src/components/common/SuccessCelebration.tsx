/**
 * SuccessCelebration Component
 *
 * Animated checkmark with bounce effect for successful actions.
 * Used for reading completion, save confirmation, task completion, etc.
 *
 * Features:
 * - Scale bounce animation
 * - Haptic feedback integration
 * - Motion-safe support
 * - Customizable duration and icon
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@constants';
import { SpringAnimations } from '@/constants/animations';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface SuccessCelebrationProps {
  /** Show celebration immediately */
  isVisible: boolean;

  /** Icon name (default: 'checkmark-circle') */
  icon?: keyof typeof Ionicons.glyphMap;

  /** Icon size (default: 60) */
  iconSize?: number;

  /** Icon color (default: Colors.accent.green) */
  iconColor?: string;

  /** Container size (default: 100) */
  containerSize?: number;

  /** Container background color (default: Colors.accent.green with opacity) */
  containerBackgroundColor?: string;

  /** Called when animation completes */
  onComplete?: () => void;

  /** Optional custom style */
  style?: ViewStyle;
}

/**
 * SuccessCelebration Component
 *
 * Shows animated checkmark with bounce effect.
 *
 * @example
 * <SuccessCelebration
 *   isVisible={showSuccess}
 *   onComplete={() => navigation.goBack()}
 * />
 */
export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  isVisible,
  icon = 'checkmark-circle',
  iconSize = 60,
  iconColor = Colors.accent.green,
  containerSize = 100,
  containerBackgroundColor = 'rgba(56, 142, 60, 0.15)',
  onComplete,
  style,
}) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isVisible) {
      // Reset animations when not visible
      scaleAnim.setValue(0);
      opacityAnim.setValue(1);
      return;
    }

    if (prefersReducedMotion) {
      // Instant visibility
      scaleAnim.setValue(1);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Scale up bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...SpringAnimations.BOUNCY,
      }),
      // Optional: fade out after showing
      Animated.delay(1500),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  }, [isVisible, prefersReducedMotion, scaleAnim, opacityAnim, onComplete, hapticPattern, disableHaptic, triggerHaptic]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: containerBackgroundColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
});
