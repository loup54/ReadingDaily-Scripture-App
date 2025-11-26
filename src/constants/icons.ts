/**
 * Icon Standards & Constants
 * Phase 1: Design System Optimization - Icon Alignment
 *
 * Standardizes icon sizes and color patterns across the app.
 * Based on Material Design 3 guidelines.
 */

/**
 * Standard Icon Sizes
 *
 * SMALL (20px)      - UI controls, badges, form icons
 * MEDIUM (24px)     - Navigation, tab bar icons, standard controls
 * LARGE (28px)      - Featured icons, hero elements
 * EXTRA_LARGE (32px)- Splash screens, empty states, primary CTAs
 *
 * @example
 * <Ionicons name="home" size={IconSizes.MEDIUM} color={colors.primary.blue} />
 */
export const IconSizes = {
  SMALL: 20,
  MEDIUM: 24,
  LARGE: 28,
  EXTRA_LARGE: 32,
} as const;

/**
 * Icon Color Patterns
 *
 * Maps semantic names to theme color paths.
 * Always apply via useTheme() at render time.
 *
 * @example
 * const { colors } = useTheme();
 * const primaryColor = colors[IconColorMap.PRIMARY];  // colors.primary.blue
 */
export const IconColorMap = {
  // Primary actions and highlights
  PRIMARY: 'primary.blue',

  // Secondary elements and navigation
  SECONDARY: 'text.secondary',

  // Disabled, hint, or tertiary
  TERTIARY: 'text.tertiary',

  // Success states
  SUCCESS: 'success',

  // Error/warning states
  ERROR: 'error',

  // On dark backgrounds
  INVERTED: 'text.inverted',

  // Placeholder/skeleton
  PLACEHOLDER: 'text.tertiary',
} as const;

/**
 * Icon Usage Contexts
 *
 * Recommended size and color for different UI contexts.
 */
export const IconContexts = {
  // Navigation tab icons
  TAB_ICON: {
    size: IconSizes.MEDIUM,
    activeColor: 'primary.blue',
    inactiveColor: 'text.tertiary',
  },

  // Button icons (inside buttons)
  BUTTON_ICON: {
    size: IconSizes.SMALL,
    color: 'text.primary',
  },

  // List item icons (leading/trailing)
  LIST_ICON: {
    size: IconSizes.MEDIUM,
    color: 'text.secondary',
  },

  // Header/title section icons
  HEADER_ICON: {
    size: IconSizes.MEDIUM,
    color: 'text.primary',
  },

  // Floating action buttons
  FAB_ICON: {
    size: IconSizes.LARGE,
    color: 'text.inverted',
  },

  // Empty state / hero icons
  EMPTY_STATE_ICON: {
    size: IconSizes.EXTRA_LARGE,
    color: 'text.tertiary',
  },

  // Status indicators
  STATUS_ICON: {
    size: IconSizes.SMALL,
    color: 'success',
  },

  // Error/warning indicators
  ERROR_ICON: {
    size: IconSizes.SMALL,
    color: 'error',
  },
} as const;

/**
 * USAGE GUIDE
 *
 * ✅ CORRECT PATTERN:
 *
 * import { IconSizes } from '@/constants/icons';
 * import { useTheme } from '@/hooks/useTheme';
 *
 * export const MyComponent = () => {
 *   const { colors } = useTheme();
 *
 *   return (
 *     <Ionicons
 *       name="home"
 *       size={IconSizes.MEDIUM}
 *       color={colors.primary.blue}
 *     />
 *   );
 * };
 *
 * ❌ WRONG PATTERN:
 *
 * <Ionicons
 *   name="home"
 *   size={24}                    // ❌ Hardcoded size
 *   color="#4A90E2"              // ❌ Hardcoded color
 * />
 */
