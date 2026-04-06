/**
 * Feature flags — toggle experimental features without a store build.
 * All flags default to false (safe). Enable via OTA update only once tested.
 */

export const FEATURE_FLAGS = {
  /** Phase 1: Liturgical colour themes — season-aware palette that intensifies toward highpoints */
  ENABLE_LITURGICAL_THEMES: true,
} as const;
