/**
 * Reduced Motion Support Hook
 * Phase 5: Respect System Accessibility Preferences
 *
 * Detects and responds to the user's `prefers-reduced-motion` setting:
 * - iOS: Settings > Accessibility > Motion > Reduce Motion
 * - Android: Settings > Accessibility > Display > Remove Animations
 * - Web: prefers-reduced-motion CSS media query
 *
 * WCAG 2.1 2.3.3 Animation from Interactions (Level AAA)
 * Users with vestibular disorders, migraines, or motion sensitivity
 * can disable animations that may cause discomfort or dizziness.
 *
 * @example
 * const { prefersReducedMotion } = usePrefersReducedMotion();
 *
 * if (prefersReducedMotion) {
 *   return <InstantTransition />;
 * }
 *
 * return <AnimatedTransition />;
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { AccessibilityInfo, Platform, useWindowDimensions } from 'react-native';

/**
 * Motion preferences configuration
 */
export interface MotionPreferences {
  /**
   * User prefers reduced motion
   */
  prefersReducedMotion: boolean;

  /**
   * User allows auto-play of animations
   */
  allowAutoPlay: boolean;

  /**
   * Animations should be instant (0ms duration)
   */
  animationDuration: number;

  /**
   * Spring animations should be disabled
   */
  disableSpringAnimations: boolean;

  /**
   * Transitions should be instant
   */
  transitionDuration: number;

  /**
   * Whether animations should be disabled entirely
   */
  animationsDisabled: boolean;
}

/**
 * Hook to detect system reduced-motion preference
 *
 * Respects user's accessibility settings:
 * - iOS: Reduce Motion toggle
 * - Android: Remove Animations toggle
 * - Web: prefers-reduced-motion media query
 *
 * @returns Motion preferences and utilities
 *
 * @example
 * const {
 *   prefersReducedMotion,
 *   getAnimationDuration,
 *   shouldAnimate,
 * } = usePrefersReducedMotion();
 *
 * const duration = getAnimationDuration(300); // Returns 0 if motion reduced
 */
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const mediaQueryListRef = useRef<MediaQueryList | null>(null);

  // Check accessibility setting on mount (web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        // Check prefers-reduced-motion media query
        const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQueryListRef.current = mediaQueryList;

        // Set initial state
        setPrefersReducedMotion(mediaQueryList.matches);

        // Listen for changes
        const handleChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches);
        };

        // Use addEventListener for better compatibility
        if (mediaQueryList.addEventListener) {
          mediaQueryList.addEventListener('change', handleChange);
        } else if (mediaQueryList.addListener) {
          // Fallback for older browsers
          mediaQueryList.addListener(handleChange);
        }

        return () => {
          if (mediaQueryList.removeEventListener) {
            mediaQueryList.removeEventListener('change', handleChange);
          } else if (mediaQueryList.removeListener) {
            // Fallback
            mediaQueryList.removeListener(handleChange);
          }
        };
      } catch (e) {
        // If media query fails, assume no preference
        setPrefersReducedMotion(false);
      }
    }

    // For mobile (iOS/Android), check accessibility settings
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      checkAccessibilitySettings();
    }
  }, []);

  // Periodically check if setting changed (for mobile)
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const interval = setInterval(() => {
        checkAccessibilitySettings();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, []);

  const checkAccessibilitySettings = useCallback(async () => {
    try {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled?.();
      if (typeof enabled === 'boolean') {
        setPrefersReducedMotion(enabled);
      }
    } catch (e) {
      // If check fails, assume no preference
    }
  }, []);

  /**
   * Get animation duration respecting reduced motion preference
   * @param baseDuration Base duration in milliseconds
   * @returns Duration (0 if reduced motion, base otherwise)
   */
  const getAnimationDuration = useCallback(
    (baseDuration: number): number => {
      return prefersReducedMotion ? 0 : baseDuration;
    },
    [prefersReducedMotion]
  );

  /**
   * Check if animation should run
   * @returns True if animations should run, false if reduced motion
   */
  const shouldAnimate = useCallback((): boolean => {
    return !prefersReducedMotion;
  }, [prefersReducedMotion]);

  /**
   * Get motion preferences object
   * @param baseDuration Base animation duration
   * @returns Motion preferences for use in components
   */
  const getMotionPreferences = useCallback(
    (baseDuration: number = 300): MotionPreferences => {
      const duration = getAnimationDuration(baseDuration);
      const disabled = prefersReducedMotion;

      return {
        prefersReducedMotion,
        allowAutoPlay: !prefersReducedMotion,
        animationDuration: duration,
        disableSpringAnimations: disabled,
        transitionDuration: duration,
        animationsDisabled: disabled,
      };
    },
    [prefersReducedMotion, getAnimationDuration]
  );

  return {
    /**
     * User prefers reduced motion
     */
    prefersReducedMotion,

    /**
     * Get animation duration (0 if reduced motion)
     */
    getAnimationDuration,

    /**
     * Whether animations should run
     */
    shouldAnimate,

    /**
     * Get full motion preferences object
     */
    getMotionPreferences,

    /**
     * Refresh accessibility settings (manual check)
     */
    refresh: checkAccessibilitySettings,
  };
};

/**
 * Animation configuration that respects reduced motion
 */
export interface MotionSafeAnimation {
  /**
   * Duration in milliseconds (0 if motion reduced)
   */
  duration: number;

  /**
   * Whether animation is effectively disabled
   */
  disabled: boolean;

  /**
   * Delay before animation (0 if motion reduced)
   */
  delay: number;

  /**
   * Easing function (instant if motion reduced)
   */
  easing: string;
}

/**
 * Get motion-safe animation config
 *
 * Automatically disables animations if user prefers reduced motion
 *
 * @param baseDuration Base animation duration
 * @param prefersReducedMotion Whether user prefers reduced motion
 * @param easing Easing function to use
 * @returns Motion-safe animation config
 *
 * @example
 * const { prefersReducedMotion } = usePrefersReducedMotion();
 * const animation = getMotionSafeAnimation(300, prefersReducedMotion);
 * // If reduced motion: { duration: 0, disabled: true, ... }
 * // Otherwise: { duration: 300, disabled: false, ... }
 */
export const getMotionSafeAnimation = (
  baseDuration: number,
  prefersReducedMotion: boolean,
  easing: string = 'ease-in-out'
): MotionSafeAnimation => {
  const disabled = prefersReducedMotion;

  return {
    duration: disabled ? 0 : baseDuration,
    disabled,
    delay: disabled ? 0 : 0,
    easing: disabled ? 'linear' : easing,
  };
};

/**
 * Types for animation configurations
 */
export type AnimationDuration = 'instant' | 'fast' | 'standard' | 'slow';

/**
 * Map animation types to durations (in milliseconds)
 */
const ANIMATION_DURATION_MAP: Record<AnimationDuration, number> = {
  instant: 0,
  fast: 150,
  standard: 300,
  slow: 500,
};

/**
 * Get duration for animation type
 *
 * @param type Animation type
 * @param prefersReducedMotion Whether reduced motion is enabled
 * @returns Duration in milliseconds
 *
 * @example
 * const duration = getAnimationTypeDuration('standard', prefersReducedMotion);
 * // Returns 0 if reduced motion, 300 otherwise
 */
export const getAnimationTypeDuration = (
  type: AnimationDuration,
  prefersReducedMotion: boolean
): number => {
  const baseDuration = ANIMATION_DURATION_MAP[type];
  return prefersReducedMotion ? 0 : baseDuration;
};

/**
 * Presets for motion-safe animations
 */
export const MotionSafePresets = {
  /**
   * No animation - instant change
   */
  instant: (prefersReducedMotion: boolean): MotionSafeAnimation => ({
    duration: 0,
    disabled: true,
    delay: 0,
    easing: 'linear',
  }),

  /**
   * Quick feedback animation (150ms if motion allowed)
   */
  quick: (prefersReducedMotion: boolean): MotionSafeAnimation =>
    getMotionSafeAnimation(150, prefersReducedMotion, 'ease-out'),

  /**
   * Standard animation (300ms if motion allowed)
   */
  standard: (prefersReducedMotion: boolean): MotionSafeAnimation =>
    getMotionSafeAnimation(300, prefersReducedMotion, 'ease-in-out'),

  /**
   * Slow animation (500ms if motion allowed)
   */
  slow: (prefersReducedMotion: boolean): MotionSafeAnimation =>
    getMotionSafeAnimation(500, prefersReducedMotion, 'ease-in-out'),

  /**
   * Screen transition (300ms if motion allowed)
   */
  transition: (prefersReducedMotion: boolean): MotionSafeAnimation =>
    getMotionSafeAnimation(300, prefersReducedMotion, 'ease-in-out'),

  /**
   * Modal appearance (150ms if motion allowed)
   */
  modal: (prefersReducedMotion: boolean): MotionSafeAnimation =>
    getMotionSafeAnimation(150, prefersReducedMotion, 'ease-out'),
};

/**
 * Utility to conditionally apply animation styles
 *
 * @param animation Animation config
 * @returns Style object for animation
 *
 * @example
 * const animation = MotionSafePresets.standard(prefersReducedMotion);
 * const style = getAnimationStyle(animation);
 * // Returns: { transition: 'all 300ms ease-in-out' } or { transition: 'all 0ms linear' }
 */
export const getAnimationStyle = (animation: MotionSafeAnimation) => {
  if (animation.disabled) {
    return {
      transition: 'none',
    };
  }

  return {
    transition: `all ${animation.duration}ms ${animation.easing}`,
  };
};

/**
 * Provider context for reduced motion setting
 * Use this to wrap your app and provide reduced motion state to all components
 *
 * @example
 * <ReducedMotionProvider>
 *   <App />
 * </ReducedMotionProvider>
 */
export const ReducedMotionContext = {
  /**
   * Use in components to get reduced motion state
   * @example
   * const { prefersReducedMotion } = useContext(ReducedMotionContext);
   */
  displayName: 'ReducedMotionContext',
};

/**
 * Animation delay utilities for staggered animations
 */
export const MotionSafeDelays = {
  /**
   * No delay
   */
  NONE: 0,

  /**
   * Short delay (50ms if motion allowed)
   */
  SHORT: (prefersReducedMotion: boolean) => (prefersReducedMotion ? 0 : 50),

  /**
   * Standard delay (100ms if motion allowed)
   */
  STANDARD: (prefersReducedMotion: boolean) => (prefersReducedMotion ? 0 : 100),

  /**
   * Long delay (200ms if motion allowed)
   */
  LONG: (prefersReducedMotion: boolean) => (prefersReducedMotion ? 0 : 200),

  /**
   * Extra long delay (500ms if motion allowed)
   */
  EXTRA_LONG: (prefersReducedMotion: boolean) => (prefersReducedMotion ? 0 : 500),
};

/**
 * Helper to get stagger delay that respects reduced motion
 *
 * @param index Item index
 * @param baseDelay Base delay in ms
 * @param prefersReducedMotion Whether reduced motion is enabled
 * @returns Calculated delay (0 if reduced motion)
 *
 * @example
 * const delay = getMotionSafeStaggerDelay(2, 100, prefersReducedMotion);
 * // Returns: 0 if reduced motion, 200 otherwise
 */
export const getMotionSafeStaggerDelay = (
  index: number,
  baseDelay: number,
  prefersReducedMotion: boolean
): number => {
  if (prefersReducedMotion) return 0;
  return index * baseDelay;
};

export default usePrefersReducedMotion;
