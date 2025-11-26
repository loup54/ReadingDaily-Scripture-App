/**
 * useFeatureDiscovery Hook
 *
 * Manages feature discovery prompts - detecting unused features and
 * determining when to show "Did you know?" style prompts to users.
 * Phase 4: Settings Tooltips & Feature Prompts
 */

import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProgressStore } from '@/stores/progressStore';
import type { ReadingRecord } from '@/types/progress.types';

export interface DiscoveryPromptConfig {
  featureId: string;
  title: string;
  description: string;
  actionLabel: string;
  icon?: string;
  minDaysSinceActivation: number; // Show after N days of not using feature
  daysActiveSinceLastPrompt: number; // Wait N days before showing again
}

interface FeatureUsageMetrics {
  lastUsedDate?: Date;
  daysInactive: number;
  shouldShowPrompt: boolean;
}

/**
 * useFeatureDiscovery - Manage feature discovery and prompts
 *
 * @returns Object with feature usage metrics and discovery state
 *
 * @example
 * const { shouldPromptAudioHighlighting } = useFeatureDiscovery();
 */
export const useFeatureDiscovery = () => {
  const { settings, hasDiscoveredFeature } = useSettingsStore();
  const { progressData } = useProgressStore();

  // Feature usage tracking state
  const [featureUsage, setFeatureUsage] = useState<
    Record<string, FeatureUsageMetrics>
  >({});

  /**
   * Calculate days since feature was last used
   */
  const calculateDaysSinceLastUse = useCallback(
    (featureId: string): number => {
      const now = new Date();
      let lastUseDate: Date | null = null;

      switch (featureId) {
        case 'audio-highlighting':
          // Check if audio highlighting was used in recent readings
          if (progressData?.readings) {
            const recentReadings = Object.values(progressData.readings)
              .filter((r): r is ReadingRecord => r != null && r.audioUsed)
              .sort((a: ReadingRecord, b: ReadingRecord) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              });

            if (recentReadings.length > 0) {
              lastUseDate = new Date(recentReadings[0].date);
            }
          }
          break;

        case 'pronunciation-practice':
          // Check if pronunciation was practiced in recent readings
          if (progressData?.readings) {
            const recentReadings = Object.values(progressData.readings)
              .filter((r): r is ReadingRecord => r != null && r.pronunciationUsed)
              .sort((a: ReadingRecord, b: ReadingRecord) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              });

            if (recentReadings.length > 0) {
              lastUseDate = new Date(recentReadings[0].date);
            }
          }
          break;

        case 'translations':
          // Tap-to-translate doesn't have explicit usage tracking
          // Check if user has enabled it and discovered feature
          if (settings.translation.enabled && hasDiscoveredFeature('translations')) {
            // Mark as recently used if feature is discovered
            lastUseDate = new Date();
          }
          break;

        case 'offline-mode':
          // Check if offline readings were downloaded/used
          if (progressData?.readings) {
            const recentReadings = Object.values(progressData.readings)
              .filter((r): r is ReadingRecord => r != null)
              .sort((a: ReadingRecord, b: ReadingRecord) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
              });

            if (recentReadings.length > 0) {
              lastUseDate = new Date(recentReadings[0].date);
            }
          }
          break;
      }

      if (!lastUseDate) {
        // Feature has never been used
        return Number.MAX_SAFE_INTEGER;
      }

      const daysDiff = Math.floor(
        (now.getTime() - lastUseDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return Math.max(0, daysDiff);
    },
    [progressData, settings, hasDiscoveredFeature]
  );

  /**
   * Determine if a feature should have a discovery prompt shown
   */
  const shouldShowFeaturePrompt = useCallback(
    (config: DiscoveryPromptConfig): boolean => {
      // Don't show if user already discovered this feature
      if (hasDiscoveredFeature(config.featureId)) {
        return false;
      }

      const daysSinceUse = calculateDaysSinceLastUse(config.featureId);

      // Show prompt if feature hasn't been used for configured days
      return daysSinceUse >= config.minDaysSinceActivation;
    },
    [calculateDaysSinceLastUse, hasDiscoveredFeature]
  );

  /**
   * Get metrics for a specific feature
   */
  const getFeatureMetrics = useCallback(
    (featureId: string): FeatureUsageMetrics => {
      const daysSinceUse = calculateDaysSinceLastUse(featureId);

      return {
        daysInactive: daysSinceUse,
        shouldShowPrompt: !hasDiscoveredFeature(featureId) && daysSinceUse >= 1,
      };
    },
    [calculateDaysSinceLastUse, hasDiscoveredFeature]
  );

  /**
   * Update feature usage metrics
   */
  useEffect(() => {
    const metrics: Record<string, FeatureUsageMetrics> = {
      'audio-highlighting': getFeatureMetrics('audio-highlighting'),
      'pronunciation-practice': getFeatureMetrics('pronunciation-practice'),
      translations: getFeatureMetrics('translations'),
      'offline-mode': getFeatureMetrics('offline-mode'),
    };

    setFeatureUsage(metrics);
  }, [getFeatureMetrics]);

  /**
   * Prompts to show based on feature usage
   */
  const shouldPromptAudioHighlighting =
    featureUsage['audio-highlighting']?.shouldShowPrompt || false;
  const shouldPromptPronunciationPractice =
    featureUsage['pronunciation-practice']?.shouldShowPrompt || false;
  const shouldPromptTranslations =
    featureUsage['translations']?.shouldShowPrompt || false;
  const shouldPromptOfflineMode =
    featureUsage['offline-mode']?.shouldShowPrompt || false;

  return {
    // Individual feature prompts
    shouldPromptAudioHighlighting,
    shouldPromptPronunciationPractice,
    shouldPromptTranslations,
    shouldPromptOfflineMode,

    // Utility functions
    shouldShowFeaturePrompt,
    getFeatureMetrics,
    featureUsage,
  };
};
