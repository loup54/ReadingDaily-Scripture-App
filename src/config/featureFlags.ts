/**
 * Feature flags — toggle experimental features without a store build.
 * All flags default to false (safe). Enable via OTA update only once tested.
 */

export const FEATURE_FLAGS = {
  /** Phase 1: Liturgical colour themes — season-aware palette that intensifies toward highpoints */
  ENABLE_LITURGICAL_THEMES: true,
  /** Scripture text follows system text size (Dynamic Type / Android font scale), capped at 1.5x */
  ENABLE_SCRIPTURE_FONT_SCALING: false,
} as const;

/** Font-scaling props for scripture body <Text>. Flag off = old behaviour (fixed size). */
export const SCRIPTURE_TEXT_SCALING_PROPS = FEATURE_FLAGS.ENABLE_SCRIPTURE_FONT_SCALING
  ? { maxFontSizeMultiplier: 1.5 }
  : { allowFontScaling: false };
