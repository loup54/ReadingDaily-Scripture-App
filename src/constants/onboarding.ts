/**
 * Onboarding & Feature Discovery Constants
 *
 * Defines feature IDs, descriptions, and discovery configurations
 * for the feature discovery and onboarding system.
 */

export const ONBOARDING_FEATURES = {
  AUDIO_HIGHLIGHTING: 'audio-highlighting',
  PRONUNCIATION_PRACTICE: 'pronunciation-practice',
  BADGE_SYSTEM: 'badge-system',
  TRANSLATIONS: 'translations',
  OFFLINE_MODE: 'offline-mode',
} as const;

export type OnboardingFeature = typeof ONBOARDING_FEATURES[keyof typeof ONBOARDING_FEATURES];

export const FEATURE_DESCRIPTIONS: Record<OnboardingFeature, {
  title: string;
  description: string;
  howToUse: string;
}> = {
  [ONBOARDING_FEATURES.AUDIO_HIGHLIGHTING]: {
    title: 'Word-by-Word Highlighting',
    description: 'Watch words highlight as the audio plays. This helps you follow along and improve your reading speed.',
    howToUse: 'Enable in Settings → Audio & Translation → Word Highlighting',
  },
  [ONBOARDING_FEATURES.PRONUNCIATION_PRACTICE]: {
    title: 'Pronunciation Practice',
    description: 'Record yourself reading to get AI feedback on pacing, clarity, and natural rhythm.',
    howToUse: 'Tap the Practice tab, then the microphone icon to start recording.',
  },
  [ONBOARDING_FEATURES.BADGE_SYSTEM]: {
    title: 'Achievements & Badges',
    description: 'Unlock achievements as you read consistently. Track your progress and celebrate milestones.',
    howToUse: 'View your badges in the Progress tab. You earn them by completing readings and building streaks.',
  },
  [ONBOARDING_FEATURES.TRANSLATIONS]: {
    title: 'Tap-to-Translate',
    description: 'Tap any word in the reading to see its translation instantly. Great for language learning.',
    howToUse: 'Just tap any word while reading. Choose your translation language in Settings.',
  },
  [ONBOARDING_FEATURES.OFFLINE_MODE]: {
    title: 'Offline Reading',
    description: 'Download readings to read without internet. Perfect for commuting or travel.',
    howToUse: 'Enable in Settings → Offline → Auto-Download. Readings will download on WiFi automatically.',
  },
};

export const FEATURE_TOOLTIPS: Record<OnboardingFeature, {
  setting: string;
  tooltip: string;
}> = {
  [ONBOARDING_FEATURES.AUDIO_HIGHLIGHTING]: {
    setting: 'Word Highlighting',
    tooltip: 'Words will highlight as the audio plays. Great for following along and improving reading speed.',
  },
  [ONBOARDING_FEATURES.PRONUNCIATION_PRACTICE]: {
    setting: 'Pronunciation Practice',
    tooltip: 'Record yourself reading to get AI feedback on pacing and clarity.',
  },
  [ONBOARDING_FEATURES.BADGE_SYSTEM]: {
    setting: 'Achievements',
    tooltip: 'Earn badges by completing readings consistently. Unlock achievements at different milestones.',
  },
  [ONBOARDING_FEATURES.TRANSLATIONS]: {
    setting: 'Translation Language',
    tooltip: 'Tap any word to see its translation in your chosen language.',
  },
  [ONBOARDING_FEATURES.OFFLINE_MODE]: {
    setting: 'Auto-Download',
    tooltip: 'Automatically download new readings when connected to WiFi for offline reading.',
  },
};
