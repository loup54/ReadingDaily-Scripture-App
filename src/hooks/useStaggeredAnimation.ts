/**
 * useStaggeredAnimation Hook
 *
 * Creates staggered fade-in animations for list items with motion-safe support.
 * Useful for animating FlatList, SectionList, or ScrollView items.
 *
 * Features:
 * - Configurable base delay between items
 * - Respects prefers-reduced-motion setting
 * - Fade-in with optional scale/translate
 * - Easy integration with existing lists
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { AnimationDurations, SpringAnimations } from '@/constants/animations';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export interface StaggeredAnimationConfig {
  /** Base delay between items (default: 50ms) */
  baseDelay?: number;
  /** Duration for each item's animation (default: 300ms) */
  duration?: number;
  /** Enable fade-in animation (default: true) */
  enableFadeIn?: boolean;
  /** Enable scale animation (default: false) */
  enableScale?: boolean;
  /** Initial opacity (default: 0) */
  initialOpacity?: number;
  /** Target opacity (default: 1) */
  targetOpacity?: number;
  /** Initial scale (default: 0.9) */
  initialScale?: number;
  /** Target scale (default: 1) */
  targetScale?: number;
  /** Translate Y distance (default: 0) */
  translateY?: number;
}

export const DEFAULT_STAGGERED_CONFIG: StaggeredAnimationConfig = {
  baseDelay: 50,
  duration: AnimationDurations.FAST,
  enableFadeIn: true,
  enableScale: false,
  initialOpacity: 0,
  targetOpacity: 1,
  initialScale: 0.9,
  targetScale: 1,
  translateY: 0,
};

export interface StaggeredAnimationItem {
  id: string | number;
  opacityAnim: Animated.Value;
  scaleAnim: Animated.Value;
  translateYAnim: Animated.Value;
}

/**
 * Hook for staggered list item animations
 *
 * @example
 * const { animateItems, getAnimatedStyle } = useStaggeredAnimation(items, config);
 */
export const useStaggeredAnimation = (
  items: any[],
  config?: Partial<StaggeredAnimationConfig>
) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const mergedConfig = { ...DEFAULT_STAGGERED_CONFIG, ...config };
  const animationsRef = useRef<StaggeredAnimationItem[]>([]);

  // Initialize animation values for each item
  const initializeAnimations = useCallback(() => {
    animationsRef.current = items.map((item, index) => ({
      id: item.id || index,
      opacityAnim: new Animated.Value(
        mergedConfig.enableFadeIn ? mergedConfig.initialOpacity! : mergedConfig.targetOpacity!
      ),
      scaleAnim: new Animated.Value(
        mergedConfig.enableScale ? mergedConfig.initialScale! : mergedConfig.targetScale!
      ),
      translateYAnim: new Animated.Value(
        mergedConfig.enableScale ? mergedConfig.translateY! : 0
      ),
    }));
  }, [items, mergedConfig]);

  // Animate items with stagger effect
  const animateItems = useCallback(() => {
    if (prefersReducedMotion) {
      // Instant visibility when motion reduced
      animationsRef.current.forEach((anim) => {
        anim.opacityAnim.setValue(mergedConfig.targetOpacity!);
        anim.scaleAnim.setValue(mergedConfig.targetScale!);
        anim.translateYAnim.setValue(0);
      });
      return;
    }

    animationsRef.current.forEach((anim, index) => {
      const delay = (mergedConfig.baseDelay! * index);

      setTimeout(() => {
        const animations: Animated.CompositeAnimation[] = [];

        // Fade-in animation
        if (mergedConfig.enableFadeIn) {
          animations.push(
            Animated.timing(anim.opacityAnim, {
              toValue: mergedConfig.targetOpacity!,
              duration: mergedConfig.duration!,
              useNativeDriver: true,
            })
          );
        }

        // Scale animation
        if (mergedConfig.enableScale) {
          animations.push(
            Animated.spring(anim.scaleAnim, {
              toValue: mergedConfig.targetScale!,
              useNativeDriver: true,
              ...SpringAnimations.GENTLE,
            })
          );

          // Translate Y animation
          animations.push(
            Animated.spring(anim.translateYAnim, {
              toValue: 0,
              useNativeDriver: true,
              ...SpringAnimations.GENTLE,
            })
          );
        }

        if (animations.length > 0) {
          Animated.parallel(animations).start();
        }
      }, delay);
    });
  }, [prefersReducedMotion, mergedConfig]);

  // Get animated style for list item at index
  const getAnimatedStyle = useCallback(
    (index: number) => {
      if (index >= animationsRef.current.length) {
        return {};
      }

      const anim = animationsRef.current[index];

      return {
        opacity: anim.opacityAnim,
        transform: [
          {
            scale: anim.scaleAnim,
          },
          {
            translateY: anim.translateYAnim,
          },
        ],
      };
    },
    []
  );

  // Initialize on mount and when items change
  useEffect(() => {
    initializeAnimations();
  }, [items, initializeAnimations]);

  return {
    animateItems,
    getAnimatedStyle,
    animationsRef,
  };
};

/**
 * Helper function to stagger multiple animations
 *
 * @param animations Array of animated values to stagger
 * @param baseDelay Delay between each animation
 * @param prefersReducedMotion Whether to skip animations
 */
export const getMotionSafeStaggerDelay = (
  index: number,
  baseDelay: number,
  prefersReducedMotion: boolean
): number => {
  if (prefersReducedMotion) {
    return 0;
  }
  return index * baseDelay;
};
