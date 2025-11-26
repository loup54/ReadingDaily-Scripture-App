/**
 * Animation Configuration Constants
 * Phase 4: Navigation & Flow - Screen Transitions & Animations
 * Phase 5: Reduced Motion Support - WCAG 2.1 2.3.3
 *
 * Centralized animation configuration for consistent app-wide transitions.
 * Use these for navigation, modals, and component animations.
 *
 * ♿ WCAG 2.1 2.3.3 Animation from Interactions:
 * - All animations respect user's prefers-reduced-motion setting
 * - Use usePrefersReducedMotion() hook to get current setting
 * - Use getAnimationDuration() to get motion-safe durations
 * - Instant transitions (0ms) when reduced motion is enabled
 *
 * See: src/hooks/usePrefersReducedMotion.ts for utilities
 */

/**
 * Standard animation timings (in milliseconds)
 */
export const AnimationDurations = {
  /**
   * Fast animations (user interactions, quick feedback)
   */
  FAST: 150,

  /**
   * Standard animations (most screen transitions)
   */
  STANDARD: 300,

  /**
   * Slow animations (introductions, celebratory)
   */
  SLOW: 500,

  /**
   * Very slow animations (long sequences)
   */
  VERY_SLOW: 800,
} as const;

/**
 * Easing functions for animations
 */
export const AnimationEasings = {
  /**
   * Linear easing - constant speed
   */
  LINEAR: 'linear',

  /**
   * Ease-in - slow start, fast end
   */
  EASE_IN: 'ease-in',

  /**
   * Ease-out - fast start, slow end
   */
  EASE_OUT: 'ease-out',

  /**
   * Ease-in-out - slow start and end, fast middle
   */
  EASE_IN_OUT: 'ease-in-out',
} as const;

/**
 * Screen transition configurations
 * Use when navigating between screens
 */
export const ScreenTransitions = {
  /**
   * Default: Natural left-to-right slide (push)
   * For: Going deeper into hierarchy
   */
  PUSH: {
    type: 'slide',
    direction: 'left',
    duration: AnimationDurations.STANDARD,
  } as const,

  /**
   * Right-to-left slide (pop/back)
   * For: Going back in hierarchy
   */
  POP: {
    type: 'slide',
    direction: 'right',
    duration: AnimationDurations.STANDARD,
  } as const,

  /**
   * Fade in/out
   * For: Modal-like transitions, overlays
   */
  FADE: {
    type: 'fade',
    duration: AnimationDurations.STANDARD,
  } as const,

  /**
   * No animation
   * For: Replacing current screen
   */
  NONE: {
    type: 'none',
    duration: 0,
  } as const,

  /**
   * Vertical slide (bottom to top)
   * For: Modals, bottom sheets
   */
  SLIDE_UP: {
    type: 'slide',
    direction: 'up',
    duration: AnimationDurations.STANDARD,
  } as const,

  /**
   * Fade with slight scale
   * For: Dialog transitions
   */
  FADE_SCALE: {
    type: 'fade',
    duration: AnimationDurations.FAST,
  } as const,
} as const;

/**
 * Modal animation configurations
 * Use for modal/overlay transitions
 */
export const ModalTransitions = {
  /**
   * Fade in/out modal
   */
  FADE: {
    animationType: 'fade' as const,
    duration: AnimationDurations.FAST,
  },

  /**
   * Slide up modal
   */
  SLIDE: {
    animationType: 'slide' as const,
    duration: AnimationDurations.STANDARD,
  },

  /**
   * Slide from bottom
   */
  SLIDE_UP: {
    animationType: 'slide' as const,
    duration: AnimationDurations.STANDARD,
  },

  /**
   * Slide from side
   */
  SLIDE_HORIZONTAL: {
    animationType: 'slide' as const,
    duration: AnimationDurations.STANDARD,
  },
} as const;

/**
 * Spring animation configurations
 * For natural, bouncy animations
 */
export const SpringAnimations = {
  /**
   * Gentle spring - minimal bounce
   */
  GENTLE: {
    speed: 7,
    bounciness: 3,
  } as const,

  /**
   * Normal spring - moderate bounce
   */
  NORMAL: {
    speed: 8,
    bounciness: 4,
  } as const,

  /**
   * Bouncy spring - pronounced bounce
   */
  BOUNCY: {
    speed: 9,
    bounciness: 6,
  } as const,

  /**
   * Very bouncy spring
   */
  VERY_BOUNCY: {
    speed: 10,
    bounciness: 8,
  } as const,
} as const;

/**
 * Timing configurations for common patterns
 */
export const TimingConfigs = {
  /**
   * Quick feedback animation (e.g., button press)
   */
  QUICK_FEEDBACK: {
    duration: AnimationDurations.FAST,
    easing: AnimationEasings.EASE_OUT,
  } as const,

  /**
   * Standard screen transition
   */
  STANDARD_TRANSITION: {
    duration: AnimationDurations.STANDARD,
    easing: AnimationEasings.EASE_IN_OUT,
  } as const,

  /**
   * Modal appear animation
   */
  MODAL_APPEAR: {
    duration: AnimationDurations.FAST,
    easing: AnimationEasings.EASE_OUT,
  } as const,

  /**
   * Celebratory animation (badges, achievements)
   */
  CELEBRATION: {
    duration: AnimationDurations.SLOW,
    easing: AnimationEasings.EASE_IN_OUT,
  } as const,

  /**
   * Idle/pulsing animation
   */
  PULSE: {
    duration: 2000,
    easing: AnimationEasings.EASE_IN_OUT,
  } as const,
} as const;

/**
 * Delay configurations
 * For staggered animations
 */
export const AnimationDelays = {
  /**
   * No delay
   */
  NONE: 0,

  /**
   * Short delay between sequential animations
   */
  SHORT: 50,

  /**
   * Standard delay
   */
  STANDARD: 100,

  /**
   * Long delay
   */
  LONG: 200,

  /**
   * Extra long delay (for badge celebrations, etc)
   */
  EXTRA_LONG: 500,
} as const;

/**
 * Z-Index layers for stacking
 * Use for modals, toasts, overlays
 */
export const ZIndexLayers = {
  /**
   * Default/background
   */
  DEFAULT: 0,

  /**
   * Overlay/dimmer
   */
  OVERLAY: 100,

  /**
   * Modal content
   */
  MODAL: 200,

  /**
   * Toast/notification
   */
  TOAST: 300,

  /**
   * Loading indicator
   */
  LOADING: 250,

  /**
   * Dropdown/popover
   */
  DROPDOWN: 150,
} as const;

/**
 * Common animation sequences
 * Pre-configured animation combinations
 */
export const AnimationSequences = {
  /**
   * Fade in then slide
   */
  FADE_IN_SLIDE: {
    enter: {
      opacity: { duration: AnimationDurations.FAST },
      translateX: { duration: AnimationDurations.STANDARD },
    },
  } as const,

  /**
   * Scale in with fade
   */
  SCALE_IN_FADE: {
    enter: {
      opacity: { duration: AnimationDurations.FAST },
      scale: { duration: AnimationDurations.STANDARD },
    },
  } as const,

  /**
   * Bounce in
   */
  BOUNCE_IN: {
    enter: {
      scale: {
        duration: AnimationDurations.SLOW,
        springBouncy: SpringAnimations.BOUNCY,
      },
    },
  } as const,
} as const;

/**
 * Platform-specific animation configurations
 */
export const PlatformAnimations = {
  /**
   * iOS-style animations
   */
  IOS: {
    /**
     * Push transition: slide from right, shadow before
     */
    push: {
      duration: AnimationDurations.STANDARD,
      easing: AnimationEasings.EASE_OUT,
    },

    /**
     * Pop transition: slide to right
     */
    pop: {
      duration: AnimationDurations.STANDARD,
      easing: AnimationEasings.EASE_IN,
    },

    /**
     * Modal from bottom
     */
    modal: {
      duration: AnimationDurations.STANDARD,
      easing: AnimationEasings.EASE_OUT,
    },
  } as const,

  /**
   * Android-style animations
   */
  ANDROID: {
    /**
     * Material-style slide
     */
    push: {
      duration: AnimationDurations.STANDARD,
      easing: AnimationEasings.EASE_IN_OUT,
    },

    /**
     * Reveal/back transition
     */
    pop: {
      duration: AnimationDurations.STANDARD,
      easing: AnimationEasings.EASE_IN_OUT,
    },

    /**
     * Fade modal
     */
    modal: {
      duration: AnimationDurations.FAST,
      easing: AnimationEasings.EASE_OUT,
    },
  } as const,
} as const;

/**
 * Helper function: Get transition config by type
 *
 * @param type Transition type ('push', 'pop', 'fade', 'none')
 * @returns Transition configuration
 *
 * @example
 * const transition = getTransitionConfig('push');
 * router.push({
 *   pathname: '/readings',
 *   params: { ...transition },
 * });
 */
export const getTransitionConfig = (
  type: keyof typeof ScreenTransitions
) => {
  return ScreenTransitions[type];
};

/**
 * Helper function: Get timing config by name
 *
 * @param name Timing config name
 * @returns Timing configuration
 *
 * @example
 * const timing = getTimingConfig('QUICK_FEEDBACK');
 */
export const getTimingConfig = (name: keyof typeof TimingConfigs) => {
  return TimingConfigs[name];
};

/**
 * Helper function: Stagger animations
 *
 * @param index Item index
 * @param baseDelay Base delay in ms
 * @returns Calculated delay
 *
 * @example
 * const delay = getStaggerDelay(0); // 0
 * const delay = getStaggerDelay(1); // 100
 * const delay = getStaggerDelay(2); // 200
 */
export const getStaggerDelay = (
  index: number,
  baseDelay: number = AnimationDelays.STANDARD
): number => {
  return index * baseDelay;
};

/**
 * Type exports for use in components
 */
export type TransitionType = keyof typeof ScreenTransitions;
export type TimingConfigType = keyof typeof TimingConfigs;
export type SpringConfigType = keyof typeof SpringAnimations;
