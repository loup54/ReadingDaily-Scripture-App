/**
 * Typography system for consistent text styles
 */

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Predefined text styles matching the app design
 */
export const Typography = {
  // Display styles
  displayLarge: {
    fontSize: FontSizes.display,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.display * LineHeights.tight,
  },
  displayMedium: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.xxxl * LineHeights.tight,
  },

  // Heading styles
  h1: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.xxl * LineHeights.tight,
  },
  h2: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.xl * LineHeights.tight,
  },
  h3: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.lg * LineHeights.normal,
  },

  // Body styles
  bodyLarge: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.lg * LineHeights.relaxed,
  },
  body: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.md * LineHeights.normal,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },

  // UI text styles
  button: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.md * LineHeights.tight,
  },
  caption: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.xs * LineHeights.normal,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },
} as const;