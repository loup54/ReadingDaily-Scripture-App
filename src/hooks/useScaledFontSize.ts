/**
 * Font Size Scaling Hook
 *
 * Dynamically scales font sizes based on system accessibility preferences
 * and user-set text size multiplier.
 *
 * Supports:
 * - System text size preferences (iOS/Android accessibility settings)
 * - User-defined text scale multiplier
 * - Maintains WCAG 2.1 AA compliance
 * - Supports up to 200% text magnification
 *
 * @example
 * // Scale a font size based on system preferences
 * const { scaledSize } = useScaledFontSize(FontSizes.md);
 * // With 1.5x system scale: 16 * 1.5 = 24
 *
 * @example
 * // Get scaled typography style
 * const { scaledStyle } = useScaledFontSize(Typography.body);
 */

import { useWindowDimensions } from 'react-native';
import { FontSizes } from '@/constants/typography';

/**
 * Font scaling result
 */
export interface ScaledFontResult {
  /**
   * Scaled font size in points
   */
  scaledSize: number;

  /**
   * Scaled typography style object
   */
  scaledStyle: {
    fontSize: number;
    lineHeight: number;
  };

  /**
   * Current scale factor (e.g., 1.5 for 150%)
   */
  scaleFactor: number;

  /**
   * Whether text is at max scaling (200%)
   */
  isMaxScale: boolean;

  /**
   * Whether text is below normal (< 100%)
   */
  isBelowNormal: boolean;
}

/**
 * Options for font scaling
 */
export interface ScaledFontOptions {
  /**
   * Additional multiplier on top of system scale
   * Default: 1.0 (no additional scaling)
   * Example: 1.2 = 120% of system scale
   */
  multiplier?: number;

  /**
   * Line height for scaled font
   * If not provided, will be calculated proportionally
   */
  lineHeight?: number;

  /**
   * Minimum scale factor (e.g., 0.8 for 80% minimum)
   * Default: 0.75 (75% minimum)
   */
  minScale?: number;

  /**
   * Maximum scale factor (e.g., 2.0 for 200% maximum)
   * Default: 2.0 (200% maximum per WCAG)
   */
  maxScale?: number;
}

/**
 * Hook to get dynamically scaled font size based on system preferences
 *
 * The system's fontScale property reflects:
 * - iOS: Settings > Accessibility > Display & Text Size > Larger Accessibility Sizes
 * - Android: Settings > Accessibility > Display > Font size
 *
 * @param baseFontSize - Base font size (usually from FontSizes or Typography)
 * @param options - Scaling options
 * @returns Scaled font result with size, style, and metadata
 *
 * @example
 * // Simple usage - scale a base size
 * const { scaledSize } = useScaledFontSize(FontSizes.md);
 *
 * @example
 * // With line height
 * const { scaledStyle } = useScaledFontSize(FontSizes.lg, {
 *   lineHeight: 28,
 * });
 *
 * @example
 * // Additional multiplier (1.5x more than system)
 * const { scaledSize } = useScaledFontSize(FontSizes.md, {
 *   multiplier: 1.5, // Extra 50% on top of system scale
 * });
 *
 * @example
 * // Custom scale bounds
 * const { scaledSize } = useScaledFontSize(FontSizes.md, {
 *   minScale: 0.8,  // Don't go below 80%
 *   maxScale: 1.8,  // Don't go above 180%
 * });
 */
export const useScaledFontSize = (
  baseFontSize: number,
  options: ScaledFontOptions = {}
): ScaledFontResult => {
  const { fontScale: systemScale } = useWindowDimensions();

  const {
    multiplier = 1.0,
    lineHeight: providedLineHeight,
    minScale = 0.75,
    maxScale = 2.0,
  } = options;

  // Calculate total scale factor
  let scaleFactor = systemScale * multiplier;

  // Clamp to min/max bounds
  scaleFactor = Math.max(minScale, Math.min(maxScale, scaleFactor));

  // Calculate scaled size
  const scaledSize = Math.round(baseFontSize * scaleFactor);

  // Calculate scaled line height
  const scaledLineHeight = providedLineHeight
    ? Math.round(providedLineHeight * scaleFactor)
    : Math.round(baseFontSize * scaleFactor * 1.5); // Default 1.5x multiplier

  // Create scaled style object
  const scaledStyle = {
    fontSize: scaledSize,
    lineHeight: scaledLineHeight,
  };

  // Determine scale status
  const isMaxScale = scaleFactor >= maxScale;
  const isBelowNormal = scaleFactor < 1.0;

  return {
    scaledSize,
    scaledStyle,
    scaleFactor,
    isMaxScale,
    isBelowNormal,
  };
};

/**
 * Hook to get scaled typography style
 *
 * @param typographyStyle - Typography style object (e.g., Typography.body)
 * @param options - Scaling options
 * @returns Scaled typography style with fontSize and lineHeight
 *
 * @example
 * const scaledBodyStyle = useScaledTypography(Typography.body);
 * <Text style={scaledBodyStyle}>Body text</Text>
 */
export const useScaledTypography = (
  typographyStyle: { fontSize: number; lineHeight?: number },
  options: ScaledFontOptions = {}
) => {
  const baseFontSize = typographyStyle.fontSize;
  const baseLineHeight = typographyStyle.lineHeight || baseFontSize * 1.5;

  return useScaledFontSize(baseFontSize, {
    ...options,
    lineHeight: baseLineHeight,
  });
};

/**
 * Hook to get all font sizes scaled
 *
 * Useful for components that need multiple scaled sizes
 *
 * @param options - Scaling options
 * @returns Object with all scaled font sizes
 *
 * @example
 * const fonts = useScaledFonts();
 * const { xs, sm, md, lg, xl, xxl, xxxl, display } = fonts;
 */
export const useScaledFonts = (options: ScaledFontOptions = {}) => {
  return {
    xs: useScaledFontSize(FontSizes.xs, options).scaledSize,
    sm: useScaledFontSize(FontSizes.sm, options).scaledSize,
    md: useScaledFontSize(FontSizes.md, options).scaledSize,
    lg: useScaledFontSize(FontSizes.lg, options).scaledSize,
    xl: useScaledFontSize(FontSizes.xl, options).scaledSize,
    xxl: useScaledFontSize(FontSizes.xxl, options).scaledSize,
    xxxl: useScaledFontSize(FontSizes.xxxl, options).scaledSize,
    display: useScaledFontSize(FontSizes.display, options).scaledSize,
  };
};

/**
 * Hook to check current font scale status
 *
 * Useful for conditional rendering or adapting layout for large text
 *
 * @returns Font scale status
 *
 * @example
 * const { scaleFactor, isMaxScale, isBelowNormal } = useScaledFontStatus();
 * if (isMaxScale) {
 *   // Adjust layout for large text
 * }
 */
export const useScaledFontStatus = () => {
  const { fontScale: systemScale } = useWindowDimensions();
  const maxScale = 2.0;
  const minScale = 0.75;

  const isMaxScale = systemScale >= maxScale;
  const isBelowNormal = systemScale < 1.0;
  const isLargeScale = systemScale > 1.25; // 125% - consider this "large"
  const isExtraLargeScale = systemScale > 1.5; // 150% - extra large

  return {
    /**
     * System's font scale (e.g., 1.5 for 150%)
     */
    scaleFactor: systemScale,

    /**
     * Whether at or above max scale (200%)
     */
    isMaxScale,

    /**
     * Whether below normal scale (< 100%)
     */
    isBelowNormal,

    /**
     * Whether scale is "large" (> 125%)
     */
    isLargeScale,

    /**
     * Whether scale is "extra large" (> 150%)
     */
    isExtraLargeScale,

    /**
     * Percentage representation (e.g., 150 for 150%)
     */
    percentage: Math.round(systemScale * 100),
  };
};

/**
 * Utility function to calculate responsive padding
 * Reduces padding at large scales to prevent layout issues
 *
 * @param basePadding - Base padding value
 * @param options - Options for calculation
 * @returns Responsive padding value
 *
 * @example
 * const padding = useResponsivePadding(16);
 * // At normal scale: 16
 * // At 200% scale: 12 (reduced to fit)
 */
export const useResponsivePadding = (
  basePadding: number,
  options: { scaleWith?: 'none' | 'partial' | 'full' } = {}
) => {
  const { fontScale } = useWindowDimensions();
  const { scaleWith = 'partial' } = options;

  switch (scaleWith) {
    case 'none':
      // Don't scale padding at all
      return basePadding;

    case 'full':
      // Scale fully with font (may cause layout issues at large scales)
      return Math.round(basePadding * fontScale);

    case 'partial':
    default:
      // Scale partially - reduces padding at large scales
      // Formula: basePadding * (0.5 + 0.5 * fontScale)
      // At 1.0x: basePadding * 1.0 = basePadding
      // At 1.5x: basePadding * 1.25 = 25% increase
      // At 2.0x: basePadding * 1.5 = 50% increase (not full 100%)
      return Math.round(basePadding * (0.5 + 0.5 * fontScale));
  }
};

export default useScaledFontSize;
