/**
 * useHapticFeedback Hook
 * Provides haptic feedback for word highlighting changes
 *
 * Integrates with React Native's Haptics API for:
 * - Word change transitions
 * - Seek events
 * - Play/pause toggles
 * - Error notifications
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback intensity levels
 */
export enum HapticIntensity {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
}

/**
 * Haptic feedback patterns
 */
export enum HapticPattern {
  SELECTION = 'selection', // Light tap
  LIGHT_IMPACT = 'light', // Light impact
  MEDIUM_IMPACT = 'medium', // Medium impact
  HEAVY_IMPACT = 'heavy', // Heavy impact
  SUCCESS = 'success', // Success pattern
  WARNING = 'warning', // Warning pattern
  ERROR = 'error', // Error pattern
}

/**
 * Configuration for haptic feedback
 */
export interface HapticConfig {
  enabled: boolean;
  intensity: HapticIntensity;
  wordChangePattern: HapticPattern;
  seekPattern: HapticPattern;
  playPausePattern: HapticPattern;
  errorPattern: HapticPattern;
}

/**
 * Default haptic configuration
 */
const DEFAULT_HAPTIC_CONFIG: HapticConfig = {
  enabled: true,
  intensity: HapticIntensity.MEDIUM,
  wordChangePattern: HapticPattern.SELECTION,
  seekPattern: HapticPattern.LIGHT_IMPACT,
  playPausePattern: HapticPattern.MEDIUM_IMPACT,
  errorPattern: HapticPattern.ERROR,
};

/**
 * Custom hook for haptic feedback
 * Usage:
 * const { triggerWordChange, triggerSeek, triggerPlayPause, triggerError } = useHapticFeedback();
 *
 * @param config Optional haptic configuration
 * @returns Haptic feedback trigger functions
 */
export function useHapticFeedback(config?: Partial<HapticConfig>) {
  const hapticConfig: HapticConfig = {
    ...DEFAULT_HAPTIC_CONFIG,
    ...config,
  };

  /**
   * Trigger haptic feedback based on pattern
   */
  const triggerHaptic = useCallback(async (pattern: HapticPattern) => {
    if (!hapticConfig.enabled) {
      return;
    }

    // Skip haptics on web and unsupported platforms
    if (Platform.OS === 'web') {
      return;
    }

    try {
      switch (pattern) {
        case HapticPattern.SELECTION:
          await Haptics.selectionAsync();
          break;

        case HapticPattern.LIGHT_IMPACT:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case HapticPattern.MEDIUM_IMPACT:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case HapticPattern.HEAVY_IMPACT:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case HapticPattern.SUCCESS:
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;

        case HapticPattern.WARNING:
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          break;

        case HapticPattern.ERROR:
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          break;

        default:
          await Haptics.selectionAsync();
      }
    } catch (error) {
      console.warn('[useHapticFeedback] Error triggering haptic:', error);
    }
  }, [hapticConfig.enabled]);

  /**
   * Trigger feedback on word change
   */
  const triggerWordChange = useCallback(async () => {
    await triggerHaptic(hapticConfig.wordChangePattern);
  }, [hapticConfig.wordChangePattern, triggerHaptic]);

  /**
   * Trigger feedback on seek
   */
  const triggerSeek = useCallback(async () => {
    await triggerHaptic(hapticConfig.seekPattern);
  }, [hapticConfig.seekPattern, triggerHaptic]);

  /**
   * Trigger feedback on play/pause toggle
   */
  const triggerPlayPause = useCallback(async () => {
    await triggerHaptic(hapticConfig.playPausePattern);
  }, [hapticConfig.playPausePattern, triggerHaptic]);

  /**
   * Trigger feedback on error
   */
  const triggerError = useCallback(async () => {
    await triggerHaptic(hapticConfig.errorPattern);
  }, [hapticConfig.errorPattern, triggerHaptic]);

  /**
   * Trigger custom pattern
   */
  const trigger = useCallback(
    async (pattern: HapticPattern) => {
      await triggerHaptic(pattern);
    },
    [triggerHaptic]
  );

  return {
    triggerWordChange,
    triggerSeek,
    triggerPlayPause,
    triggerError,
    trigger,
    isEnabled: hapticConfig.enabled,
  };
}

/**
 * Hook for word change haptic feedback with debouncing
 * Prevents haptic feedback spam on rapid word changes
 */
export function useDebouncedHapticFeedback(
  config?: Partial<HapticConfig>,
  debounceMs: number = 50
) {
  const { triggerWordChange } = useHapticFeedback(config);
  const lastTriggerRef = useCallback(() => {
    let lastTime = 0;

    return async () => {
      const now = Date.now();
      if (now - lastTime >= debounceMs) {
        lastTime = now;
        await triggerWordChange();
      }
    };
  }, [triggerWordChange, debounceMs]);

  return {
    triggerWordChange: lastTriggerRef(),
  };
}

/**
 * Configuration constants for different feedback styles
 */
export const HapticPresets = {
  /**
   * Subtle feedback (minimal haptics)
   */
  subtle: {
    enabled: true,
    intensity: HapticIntensity.LIGHT,
    wordChangePattern: HapticPattern.SELECTION,
    seekPattern: HapticPattern.LIGHT_IMPACT,
    playPausePattern: HapticPattern.LIGHT_IMPACT,
    errorPattern: HapticPattern.WARNING,
  } as HapticConfig,

  /**
   * Balanced feedback (moderate haptics)
   */
  balanced: {
    enabled: true,
    intensity: HapticIntensity.MEDIUM,
    wordChangePattern: HapticPattern.SELECTION,
    seekPattern: HapticPattern.MEDIUM_IMPACT,
    playPausePattern: HapticPattern.MEDIUM_IMPACT,
    errorPattern: HapticPattern.ERROR,
  } as HapticConfig,

  /**
   * Strong feedback (pronounced haptics)
   */
  strong: {
    enabled: true,
    intensity: HapticIntensity.HEAVY,
    wordChangePattern: HapticPattern.LIGHT_IMPACT,
    seekPattern: HapticPattern.HEAVY_IMPACT,
    playPausePattern: HapticPattern.HEAVY_IMPACT,
    errorPattern: HapticPattern.ERROR,
  } as HapticConfig,

  /**
   * Disabled (no haptics)
   */
  disabled: {
    enabled: false,
    intensity: HapticIntensity.MEDIUM,
    wordChangePattern: HapticPattern.SELECTION,
    seekPattern: HapticPattern.LIGHT_IMPACT,
    playPausePattern: HapticPattern.LIGHT_IMPACT,
    errorPattern: HapticPattern.ERROR,
  } as HapticConfig,
};
