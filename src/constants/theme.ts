/**
 * Combined theme object
 */

import { Colors } from './colors';
import { Spacing, BorderRadius, Shadows } from './spacing';
import { Typography } from './typography';

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  typography: Typography,
} as const;

export type AppTheme = typeof Theme;