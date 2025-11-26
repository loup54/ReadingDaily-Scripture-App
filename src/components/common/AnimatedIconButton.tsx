/**
 * AnimatedIconButton Component
 *
 * Icon button with rotation animation on state change.
 * Useful for expand/collapse, play/pause, menu toggles.
 *
 * Features:
 * - Smooth 180° rotation animation
 * - Respects reduced motion preferences
 * - Inherits all IconButton props
 * - Can show different icons based on state
 */

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { AnimationDurations, SpringAnimations } from '@/constants/animations';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { IconButton, IconButtonProps } from './IconButton';
import { Ionicons } from '@expo/vector-icons';

export interface AnimatedIconButtonProps extends Omit<IconButtonProps, 'icon'> {
  /** Icon to display */
  icon: keyof typeof Ionicons.glyphMap;

  /** State to trigger rotation (typically true/false for expanded/collapsed) */
  isActive?: boolean;

  /** Alternative icon to show when active (if not provided, icon rotates) */
  activeIcon?: keyof typeof Ionicons.glyphMap;

  /** Rotation angle in degrees (default: 180) */
  rotationAngle?: number;
}

export const AnimatedIconButton: React.FC<AnimatedIconButtonProps> = ({
  icon,
  isActive = false,
  activeIcon,
  rotationAngle = 180,
  ...iconButtonProps
}) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion) {
      // Skip animation, just set value instantly
      rotateAnim.setValue(isActive ? 1 : 0);
      return;
    }

    Animated.spring(rotateAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      ...SpringAnimations.GENTLE,
    }).start();
  }, [isActive, prefersReducedMotion, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotationAngle}deg`],
  });

  // If activeIcon is provided, show different icon based on state
  if (activeIcon) {
    return (
      <IconButton
        icon={isActive ? activeIcon : icon}
        {...iconButtonProps}
      />
    );
  }

  // Otherwise, wrap the icon with rotation animation
  return (
    <Animated.View
      style={{
        transform: [{ rotate }],
      }}
    >
      <IconButton
        icon={icon}
        {...iconButtonProps}
      />
    </Animated.View>
  );
};
