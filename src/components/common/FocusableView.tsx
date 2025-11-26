/**
 * FocusableView Component
 *
 * Wrapper component that displays animated focus ring for keyboard navigation.
 * Essential for web accessibility and keyboard-first navigation.
 *
 * Features:
 * - Animated focus ring on focus
 * - Customizable focus styles
 * - Motion-safe support
 * - Works with any child content
 * - Keyboard navigation support
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@constants';
import { SpringAnimations } from '@/constants/animations';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export type FocusRingStyle = 'standard' | 'subtle' | 'bold';

export interface FocusableViewProps {
  /** Child content */
  children: React.ReactNode;

  /** Focus ring color (default: Colors.primary.blue) */
  focusColor?: string;

  /** Focus ring width (default: 3) */
  focusWidth?: number;

  /** Focus ring offset from edge (default: 2) */
  focusOffset?: number;

  /** Focus ring style preset (default: 'standard') */
  ringStyle?: FocusRingStyle;

  /** Border radius (default: BorderRadius.md) */
  borderRadius?: number;

  /** Container style */
  style?: ViewStyle;

  /** Handle focus change */
  onFocus?: (focused: boolean) => void;

  /** Disable focus ring (useful for mouse-only inputs) */
  disableFocusRing?: boolean;
}

/**
 * FocusableView Component
 *
 * Provides animated focus ring for keyboard navigation.
 *
 * @example
 * <FocusableView onFocus={(isFocused) => console.log(isFocused)}>
 *   <TextInput placeholder="Type here..." />
 * </FocusableView>
 */
export const FocusableView: React.FC<FocusableViewProps> = ({
  children,
  focusColor = Colors.primary.blue,
  focusWidth = 3,
  focusOffset = 2,
  ringStyle = 'standard',
  borderRadius = BorderRadius.md,
  style,
  onFocus,
  disableFocusRing = false,
}) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const ringOpacityAnim = useRef(new Animated.Value(0)).current;
  const ringScaleAnim = useRef(new Animated.Value(0.98)).current;

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus(true);

    if (disableFocusRing || prefersReducedMotion) {
      ringOpacityAnim.setValue(1);
      ringScaleAnim.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(ringOpacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(ringScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        ...SpringAnimations.GENTLE,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onFocus) onFocus(false);

    if (disableFocusRing || prefersReducedMotion) {
      ringOpacityAnim.setValue(0);
      ringScaleAnim.setValue(0.98);
      return;
    }

    Animated.parallel([
      Animated.timing(ringOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(ringScaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        ...SpringAnimations.GENTLE,
      }),
    ]).start();
  };

  // Platform-specific: focus ring only visible on web/keyboard navigation
  const showFocusRing = Platform.OS === 'web' && !disableFocusRing;

  const getFocusRingStyle = (): ViewStyle => {
    switch (ringStyle) {
      case 'subtle':
        return {
          borderWidth: 2,
          borderColor: focusColor,
          borderRadius: borderRadius + focusOffset,
        };
      case 'bold':
        return {
          borderWidth: focusWidth,
          borderColor: focusColor,
          borderRadius: borderRadius + focusOffset,
          shadowColor: focusColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: focusWidth + 2,
        };
      case 'standard':
      default:
        return {
          borderWidth: focusWidth,
          borderColor: focusColor,
          borderRadius: borderRadius + focusOffset,
        };
    }
  };

  // Web platform: use onFocus/onBlur event listeners
  if (Platform.OS === 'web') {
    return (
      <View
        style={[style, { borderRadius }]}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {showFocusRing && (
          <Animated.View
            style={[
              styles.focusRing,
              getFocusRingStyle(),
              {
                opacity: ringOpacityAnim,
                transform: [{ scale: ringScaleAnim }],
              },
            ]}
            pointerEvents="none"
          />
        )}
        {children}
      </View>
    );
  }

  // Mobile/native: still render but no focus ring visible
  return <View style={[style, { borderRadius }]}>{children}</View>;
};

const styles = StyleSheet.create({
  focusRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    pointerEvents: 'none',
  },
});
