/**
 * useShakeAnimation Hook
 *
 * Creates a subtle shake animation for error states.
 * Used for validation errors, failed actions, retry prompts.
 *
 * Features:
 * - Configurable shake distance and duration
 * - Respects prefers-reduced-motion setting
 * - Haptic feedback integration
 * - Easy to use with any animated view
 */

import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface ShakeAnimationConfig {
  /** Distance to shake (default: 10) */
  distance?: number;

  /** Duration of entire shake sequence (default: 400) */
  duration?: number;

  /** Number of shakes (default: 4) */
  shakeCount?: number;
}

export const DEFAULT_SHAKE_CONFIG: ShakeAnimationConfig = {
  distance: 10,
  duration: 400,
  shakeCount: 4,
};

/**
 * Hook for shake animation on errors
 *
 * @example
 * const { shake, shakeAnim } = useShakeAnimation({ distance: 15 });
 *
 * // Trigger shake on error
 * const handleError = () => {
 *   shake();
 * };
 *
 * // Apply to animated view
 * <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
 *   <TextInput ... />
 * </Animated.View>
 */
export const useShakeAnimation = (config?: Partial<ShakeAnimationConfig>) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const mergedConfig = { ...DEFAULT_SHAKE_CONFIG, ...config };
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(async () => {
    if (prefersReducedMotion) {
      // Skip animation when motion reduced
      return;
    }

    const shakeDuration = mergedConfig.duration! / (mergedConfig.shakeCount! * 2);
    const shakeAnimations: Animated.CompositeAnimation[] = [];

    // Create shake sequence
    for (let i = 0; i < mergedConfig.shakeCount!; i++) {
      shakeAnimations.push(
        Animated.timing(shakeAnim, {
          toValue: i % 2 === 0 ? -mergedConfig.distance! : mergedConfig.distance!,
          duration: shakeDuration,
          useNativeDriver: true,
        })
      );
    }

    // Return to center
    shakeAnimations.push(
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: shakeDuration,
        useNativeDriver: true,
      })
    );

    Animated.sequence(shakeAnimations).start();
  }, [shakeAnim, prefersReducedMotion, mergedConfig, triggerHaptic]);

  return {
    shake,
    shakeAnim,
  };
};

/**
 * Helper function to create shake animations programmatically
 *
 * @param animatedValue The animated value to shake
 * @param config Configuration options
 * @returns Function to start shake animation
 */
export const createShakeAnimation = (
  animatedValue: Animated.Value,
  config?: Partial<ShakeAnimationConfig>
) => {
  const mergedConfig = { ...DEFAULT_SHAKE_CONFIG, ...config };

  return async (prefersReducedMotion: boolean = false) => {
    if (prefersReducedMotion) {
      return;
    }

    const shakeDuration = mergedConfig.duration! / (mergedConfig.shakeCount! * 2);
    const shakeAnimations: Animated.CompositeAnimation[] = [];

    for (let i = 0; i < mergedConfig.shakeCount!; i++) {
      shakeAnimations.push(
        Animated.timing(animatedValue, {
          toValue: i % 2 === 0 ? -mergedConfig.distance! : mergedConfig.distance!,
          duration: shakeDuration,
          useNativeDriver: true,
        })
      );
    }

    shakeAnimations.push(
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: shakeDuration,
        useNativeDriver: true,
      })
    );

    return new Promise<void>((resolve) => {
      Animated.sequence(shakeAnimations).start(() => resolve());
    });
  };
};
