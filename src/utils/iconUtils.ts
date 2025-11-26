/**
 * Icon Utilities
 * Phase 1: Design System Optimization - Icon Alignment
 *
 * Helper functions for working with icons and theme colors.
 */

import { IconColorMap, IconContexts, IconSizes } from '@/constants/icons';

/**
 * Get icon color from theme using semantic color path
 *
 * @param colorPath - Dot-notation path to color (e.g., 'primary.blue')
 * @param colors - Theme colors object from useTheme()
 * @returns Hex color string
 *
 * @example
 * const { colors } = useTheme();
 * const primaryColor = getIconColor('primary.blue', colors);
 *
 * Or using constants:
 * const activeColor = getIconColor(IconColorMap.PRIMARY, colors);
 */
export const getIconColor = (colorPath: string, colors: any): string => {
  const parts = colorPath.split('.');
  let value: any = colors;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      console.warn(`Icon color path "${colorPath}" not found in theme`);
      return '#999999'; // Fallback gray
    }
  }

  if (typeof value === 'string') {
    return value;
  }

  console.warn(`Icon color path "${colorPath}" did not resolve to a color string`);
  return '#999999'; // Fallback gray
};

/**
 * Get icon configuration for a specific context
 *
 * @param context - Key from IconContexts
 * @param colors - Theme colors object
 * @returns { size, color } configuration object
 *
 * @example
 * const { colors } = useTheme();
 * const tabConfig = getContextIconConfig('TAB_ICON', colors);
 * <Ionicons size={tabConfig.size} color={tabConfig.activeColor} />
 */
export const getContextIconConfig = (
  context: keyof typeof IconContexts,
  colors: any,
  isActive: boolean = true
) => {
  const config = IconContexts[context];

  const colorKey = isActive && 'activeColor' in config
    ? (config as any).activeColor
    : (config as any).color || (config as any).inactiveColor;

  return {
    size: config.size,
    color: typeof colorKey === 'string' ? getIconColor(colorKey, colors) : colorKey,
  };
};

/**
 * Validate icon size is from standard sizes
 *
 * @param size - Icon size to validate
 * @returns true if size is standard
 *
 * @example
 * if (!isStandardSize(16)) {
 *   console.warn('Use IconSizes.SMALL (20) or MEDIUM (24) instead');
 * }
 */
export const isStandardSize = (size: number): boolean => {
  const standardSizes = Object.values(IconSizes);
  return standardSizes.includes(size);
};

/**
 * Get closest standard icon size
 *
 * Useful for migrating from hardcoded sizes.
 *
 * @param size - Desired size
 * @returns Closest standard IconSize
 *
 * @example
 * const standardSize = getClosestStandardSize(18);  // Returns 20 (SMALL)
 * const standardSize = getClosestStandardSize(26);  // Returns 24 (MEDIUM)
 */
export const getClosestStandardSize = (size: number): number => {
  const standardSizes = Object.values(IconSizes);
  let closest = standardSizes[0];
  let minDiff = Math.abs(size - closest);

  for (const standardSize of standardSizes) {
    const diff = Math.abs(size - standardSize);
    if (diff < minDiff) {
      minDiff = diff;
      closest = standardSize;
    }
  }

  return closest;
};

/**
 * Log icon usage violations for debugging
 *
 * Call during development to find hardcoded icon sizes/colors.
 *
 * @param componentName - Name of component with violation
 * @param size - Icon size that was hardcoded
 * @param color - Icon color that was hardcoded
 *
 * @example
 * logIconViolation('MyButton', 24, '#4A90E2');
 */
export const logIconViolation = (
  componentName: string,
  size?: number,
  color?: string
): void => {
  let message = `[IconUtils] ⚠️  ${componentName} using non-standard icon properties:`;

  if (size && !isStandardSize(size)) {
    const closest = getClosestStandardSize(size);
    message += `\n  - Size: ${size}px (use IconSizes constant, closest: ${closest}px)`;
  }

  if (color && !color.startsWith('colors.')) {
    message += `\n  - Color: ${color} (use useTheme() + IconColorMap)`;
  }

  console.warn(message);
};

/**
 * Types for icon usage
 */
export type IconSize = typeof IconSizes[keyof typeof IconSizes];
export type IconColorKey = keyof typeof IconColorMap;
export type IconContext = keyof typeof IconContexts;

/**
 * MIGRATION GUIDE
 *
 * From hardcoded sizes to IconSizes:
 *
 * ❌ BEFORE:
 * <Ionicons size={24} />
 * <Ionicons size={20} />
 * <Ionicons size={32} />
 *
 * ✅ AFTER:
 * import { IconSizes } from '@/constants/icons';
 * <Ionicons size={IconSizes.MEDIUM} />
 * <Ionicons size={IconSizes.SMALL} />
 * <Ionicons size={IconSizes.EXTRA_LARGE} />
 *
 *
 * From hardcoded colors to theme colors:
 *
 * ❌ BEFORE:
 * <Ionicons color="#4A90E2" />
 * <Ionicons color="#999999" />
 *
 * ✅ AFTER:
 * import { useTheme } from '@/hooks/useTheme';
 * const { colors } = useTheme();
 * <Ionicons color={colors.primary.blue} />
 * <Ionicons color={colors.text.tertiary} />
 */
