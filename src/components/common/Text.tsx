/**
 * Text Component Wrapper
 * Phase 2: Design System Optimization - Typography Centralization
 *
 * Convenience wrapper around React Native's Text component
 * that applies Typography variants and theme colors automatically.
 *
 * @example
 * // Basic usage with variant
 * <Text variant="h1">Heading</Text>
 *
 * // Custom color
 * <Text variant="body" color={colors.text.secondary}>Secondary text</Text>
 *
 * // Centered and bold
 * <Text variant="bodySmall" center bold>Caption</Text>
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Typography } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';
import { useScaledFontSize } from '@/hooks/useScaledFontSize';

/**
 * Supported typography variants
 * Maps to Typography constants from design system
 */
export type TypographyVariant = keyof typeof Typography;

export interface TextProps extends Omit<RNTextProps, 'style'> {
  /**
   * Typography variant to apply
   * @default 'body'
   */
  variant?: TypographyVariant;

  /**
   * Text color
   * If not provided, uses colors.text.primary from theme
   * Can be any color string or from theme colors
   * @example
   * color={colors.text.secondary}
   * color="#FF0000"
   */
  color?: string;

  /**
   * Center text horizontally
   * @default false
   */
  center?: boolean;

  /**
   * Make text bold (fontWeight: '600')
   * @default false
   */
  bold?: boolean;

  /**
   * Make text semi-bold (fontWeight: '500')
   * @default false
   */
  semibold?: boolean;

  /**
   * Disable dynamic font scaling for this text
   * Text will use base font size regardless of system accessibility settings
   * Use for: fixed-width content, codes, badges, or design-critical sizes
   * @default false
   */
  disableScaling?: boolean;

  /**
   * Additional style overrides
   */
  style?: any;

  /**
   * Text content
   */
  children: React.ReactNode;
}

/**
 * Text Component
 *
 * Convenience wrapper that automatically applies typography variants
 * and theme colors to text elements.
 *
 * @example
 * ```tsx
 * // Display large heading
 * <Text variant="displayLarge">Welcome</Text>
 *
 * // Secondary body text
 * <Text variant="body" color={colors.text.secondary}>
 *   Subtitle text
 * </Text>
 *
 * // Centered caption
 * <Text variant="caption" center>
 *   Caption text
 * </Text>
 *
 * // Bold button text
 * <Text variant="button" bold>
 *   Click me
 * </Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  center = false,
  bold = false,
  semibold = false,
  disableScaling = false,
  style,
  children,
  ...props
}) => {
  const { colors } = useTheme();

  // Get typography style for variant
  const typographyStyle = Typography[variant];

  // Get scaled font size (respects system accessibility settings)
  const { scaledStyle } = useScaledFontSize(
    typographyStyle.fontSize,
    { lineHeight: typographyStyle.lineHeight }
  );

  // Determine font weight
  let fontWeight: string | number = typographyStyle.fontWeight;
  if (bold) {
    fontWeight = '600';
  } else if (semibold) {
    fontWeight = '500';
  }

  // Merge styles
  const mergedStyle = [
    // Typography variant base styles
    typographyStyle,
    // Apply scaled font size (or use base if disabled)
    disableScaling ? undefined : scaledStyle,
    // Apply dynamic color
    {
      color: color || colors.text.primary,
      fontWeight,
      textAlign: center ? ('center' as const) : ('auto' as const),
    },
    // User provided overrides
    style,
  ];

  return (
    <RNText {...props} style={mergedStyle}>
      {children}
    </RNText>
  );
};

/**
 * Convenience exports for specific variants
 * Use these if you prefer semantic naming over the variant prop
 *
 * @example
 * // Option 1: Use variant prop
 * <Text variant="h1">Heading</Text>
 *
 * // Option 2: Use semantic component (if exported)
 * <Heading1>Heading</Heading1>
 */

export const Heading1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="h3" {...props} />
);

export const BodyText: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="body" {...props} />
);

export const BodyLarge: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="bodyLarge" {...props} />
);

export const BodySmall: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="bodySmall" {...props} />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="caption" {...props} />
);

export const Label: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="label" {...props} />
);

export const ButtonText: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text variant="button" {...props} />
);
