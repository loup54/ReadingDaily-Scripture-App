/**
 * useParallax Hook
 *
 * Creates parallax scroll effects with motion-safe support.
 * Use for background images, depth effects, scroll-triggered animations.
 *
 * Features:
 * - Scroll-based position animation
 * - Customizable parallax speed
 * - Motion-safe support (disabled when reduced motion)
 * - Performance optimized for mobile
 * - Depth effect with multiple layers
 */

import { useRef, useCallback } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface ParallaxConfig {
  /** Speed multiplier for parallax (0.5 = half speed) */
  speed?: number;

  /** Input range for scroll distance (default: [0, 500]) */
  inputRange?: number[];

  /** Output range for transform distance (default: [0, -100]) */
  outputRange?: number[];

  /** Enable parallax (default: true) */
  enableParallax?: boolean;

  /** Axis for parallax (default: 'y' for translateY) */
  axis?: 'x' | 'y';
}

export const DEFAULT_PARALLAX_CONFIG: ParallaxConfig = {
  speed: 0.5,
  inputRange: [0, 500],
  outputRange: [0, -100],
  enableParallax: true,
  axis: 'y',
};

/**
 * Hook for parallax scroll effects
 *
 * @example
 * const { scrollAnim, getParallaxStyle, handleScroll } = useParallax({ speed: 0.3 });
 *
 * <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
 *   <Animated.View style={getParallaxStyle()}>
 *     <Image source={require('...')} />
 *   </Animated.View>
 * </ScrollView>
 */
export const useParallax = (config?: Partial<ParallaxConfig>) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const mergedConfig = { ...DEFAULT_PARALLAX_CONFIG, ...config };
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // Handle scroll events
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (prefersReducedMotion || !mergedConfig.enableParallax) {
        return;
      }

      const offset = event.nativeEvent.contentOffset.y;
      scrollAnim.setValue(offset);
    },
    [scrollAnim, prefersReducedMotion, mergedConfig.enableParallax]
  );

  // Get parallax style based on scroll position
  const getParallaxStyle = useCallback(() => {
    if (prefersReducedMotion || !mergedConfig.enableParallax) {
      return {}; // No parallax when motion reduced
    }

    const transform = scrollAnim.interpolate({
      inputRange: mergedConfig.inputRange!,
      outputRange: mergedConfig.outputRange!,
      extrapolate: 'clamp',
    });

    return {
      transform: [
        mergedConfig.axis === 'x'
          ? { translateX: transform }
          : { translateY: transform },
      ],
    };
  }, [scrollAnim, prefersReducedMotion, mergedConfig]);

  return {
    scrollAnim,
    handleScroll,
    getParallaxStyle,
  };
};

/**
 * Helper function to create depth effect with multiple layers
 *
 * Creates array of parallax configs for layered parallax effect.
 *
 * @example
 * const layers = createParallaxLayers(3); // Returns 3 layers with different speeds
 * // [{ speed: 0.3 }, { speed: 0.5 }, { speed: 0.7 }]
 */
export const createParallaxLayers = (
  layerCount: number,
  baseSpeed: number = 0.3
): ParallaxConfig[] => {
  return Array.from({ length: layerCount }, (_, index) => ({
    speed: baseSpeed + index * 0.2,
    inputRange: [0, 500],
    outputRange: [0, -100 * (index + 1)],
    enableParallax: true,
    axis: 'y' as const,
  }));
};

/**
 * Hook for scroll-triggered opacity animation
 *
 * @example
 * const { opacityAnim, handleScroll } = useScrollOpacity([0, 200], [1, 0]);
 */
export const useScrollOpacity = (
  inputRange: number[] = [0, 300],
  outputRange: number[] = [1, 0]
) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (prefersReducedMotion) return;
      scrollAnim.setValue(event.nativeEvent.contentOffset.y);
    },
    [scrollAnim, prefersReducedMotion]
  );

  const opacityAnim = scrollAnim.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });

  return {
    opacityAnim,
    handleScroll,
  };
};

/**
 * Hook for scroll-triggered scale animation
 *
 * @example
 * const { scaleAnim, handleScroll } = useScrollScale([0, 300], [1, 1.1]);
 */
export const useScrollScale = (
  inputRange: number[] = [0, 300],
  outputRange: number[] = [1, 1.1]
) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (prefersReducedMotion) return;
      scrollAnim.setValue(event.nativeEvent.contentOffset.y);
    },
    [scrollAnim, prefersReducedMotion]
  );

  const scaleAnim = scrollAnim.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });

  return {
    scaleAnim,
    handleScroll,
  };
};
