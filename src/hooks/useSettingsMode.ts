/**
 * useSettingsMode Hook
 *
 * Determines whether to show basic or advanced settings based on:
 * - User's explicit preference
 * - Days since account creation/onboarding
 * - Configurable threshold
 *
 * Phase 5: Progressive Settings Disclosure
 */

import { useCallback, useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';

export interface SettingsModeInfo {
  mode: 'basic' | 'advanced';
  canUnlock: boolean;
  daysUntilUnlock: number;
  daysBeforeAdvanced: number;
  isManuallyUnlocked: boolean;
}

/**
 * useSettingsMode - Determine which settings view to show
 *
 * @returns Settings mode information and control functions
 *
 * @example
 * const { mode, canUnlock, setMode } = useSettingsMode();
 * return mode === 'advanced' ? <AdvancedSettings /> : <BasicSettings />;
 */
export const useSettingsMode = (): SettingsModeInfo & {
  setMode: (mode: 'basic' | 'advanced') => void;
  toggleMode: () => void;
} => {
  const { settingsMode, setSettingsMode, shouldShowAdvancedSettings } =
    useSettingsStore();
  const { user } = useAuthStore();

  /**
   * Calculate days since onboarding started
   */
  const daysSinceOnboarding = useMemo(() => {
    if (!user?.createdAt) {
      return 0;
    }

    const createdAt =
      typeof user.createdAt === 'string'
        ? new Date(user.createdAt)
        : user.createdAt;

    return Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [user?.createdAt]);

  /**
   * Determine if user can unlock advanced settings
   */
  const canUnlock = daysSinceOnboarding >=
    settingsMode.daysBeforeAdvanced && !settingsMode.unlockedAt
    ? false
    : true;

  /**
   * Calculate days until unlock is available
   */
  const daysUntilUnlock = Math.max(
    0,
    settingsMode.daysBeforeAdvanced - daysSinceOnboarding
  );

  /**
   * Determine current mode considering all factors
   */
  const currentMode = useMemo((): 'basic' | 'advanced' => {
    // If manually unlocked, show advanced
    if (settingsMode.mode === 'advanced') {
      return 'advanced';
    }

    // If enough days passed, show advanced
    if (shouldShowAdvancedSettings()) {
      return 'advanced';
    }

    return 'basic';
  }, [settingsMode.mode, shouldShowAdvancedSettings]);

  /**
   * Set settings mode explicitly
   */
  const setMode = useCallback(
    (mode: 'basic' | 'advanced') => {
      setSettingsMode(mode);
    },
    [setSettingsMode]
  );

  /**
   * Toggle between basic and advanced
   */
  const toggleMode = useCallback(() => {
    setMode(currentMode === 'basic' ? 'advanced' : 'basic');
  }, [currentMode, setMode]);

  /**
   * Check if settings were manually unlocked
   */
  const isManuallyUnlocked = settingsMode.unlockedAt !== undefined &&
    daysSinceOnboarding < settingsMode.daysBeforeAdvanced;

  return {
    mode: currentMode,
    canUnlock,
    daysUntilUnlock,
    daysBeforeAdvanced: settingsMode.daysBeforeAdvanced,
    isManuallyUnlocked,
    setMode,
    toggleMode,
  };
};
