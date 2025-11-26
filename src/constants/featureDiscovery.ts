/**
 * Feature Discovery Prompts Configuration
 *
 * Defines "Did you know?" style prompts that appear periodically
 * to encourage users to try unused features.
 * Phase 4: Settings Tooltips & Feature Prompts
 */

export interface DiscoveryPromptConfig {
  featureId: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: string;
  minDaysSinceActivation: number; // Show after N days of not using
  daysBeforeRepeat: number; // Wait N days before showing again
  gradientStart?: string;
  gradientEnd?: string;
}

export const FEATURE_DISCOVERY_PROMPTS: Record<string, DiscoveryPromptConfig> = {
  'audio-highlighting': {
    featureId: 'audio-highlighting',
    title: '💡 Did you know?',
    description:
      'Word highlighting helps you follow along with the audio and improves your reading speed and comprehension.',
    actionLabel: 'Enable Word Highlighting',
    icon: '✨',
    minDaysSinceActivation: 3,
    daysBeforeRepeat: 7,
    gradientStart: '#3B82F6',
    gradientEnd: '#1D4ED8',
  },

  'pronunciation-practice': {
    featureId: 'pronunciation-practice',
    title: '🎤 Improve Your Speaking',
    description:
      'Record yourself reading to get AI feedback on pacing, clarity, and natural rhythm. Available in the Practice tab.',
    actionLabel: 'Try Pronunciation Practice',
    icon: '🎤',
    minDaysSinceActivation: 5,
    daysBeforeRepeat: 7,
    gradientStart: '#EF4444',
    gradientEnd: '#991B1B',
  },

  'badge-system': {
    featureId: 'badge-system',
    title: '🏆 Celebrate Your Achievements',
    description:
      'Unlock badges as you read consistently. Track your progress and celebrate reading milestones on the Progress tab.',
    actionLabel: 'View Badges',
    icon: '🏆',
    minDaysSinceActivation: 7,
    daysBeforeRepeat: 14,
    gradientStart: '#F59E0B',
    gradientEnd: '#B45309',
  },

  'offline-mode': {
    featureId: 'offline-mode',
    title: '📱 Read Without Internet',
    description:
      'Download readings to read offline, perfect for commuting or travel. Enable auto-download in Settings → Offline.',
    actionLabel: 'Enable Offline Mode',
    icon: '🌐',
    minDaysSinceActivation: 7,
    daysBeforeRepeat: 14,
    gradientStart: '#10B981',
    gradientEnd: '#065F46',
  },

  'translations': {
    featureId: 'translations',
    title: '🌍 Learn While You Read',
    description:
      'Tap any word to see its translation instantly. Choose your language in Settings to boost your vocabulary learning.',
    actionLabel: 'Enable Translations',
    icon: '🌍',
    minDaysSinceActivation: 2,
    daysBeforeRepeat: 7,
    gradientStart: '#8B5CF6',
    gradientEnd: '#5B21B6',
  },
};

/**
 * Settings Tooltips - Contextual help for complex settings
 */
export const SETTINGS_TOOLTIPS: Record<string, string> = {
  // Audio Settings
  'speaking-speed':
    'Control how fast the audio plays. 1.0x is normal speed. Higher values play faster, lower values slower.',

  'voice-selection':
    'Choose which voice narrates the readings. Some languages have male/female voice options.',

  'word-highlighting':
    'Words highlight as the audio plays, helping you follow along and improving reading speed.',

  'auto-pronunciation-feedback':
    'Automatically analyze your pronunciation during readings using AI.',

  // Translation Settings
  'enable-translation': 'Tap any word to see its instant translation in your chosen language.',

  'translation-language':
    'Select which language you want translations in. This helps you learn vocabulary.',

  'show-pronunciation':
    'Display pronunciation guides for translated words to help with speaking.',

  // Offline Settings
  'auto-download':
    'Automatically download new readings when connected to WiFi for offline reading.',

  'wifi-only':
    'Only download readings on WiFi to save cellular data. Recommended for most users.',

  'offline-storage':
    'Shows how much storage space offline readings use. You can delete old readings to free up space.',

  // Notification Settings
  'daily-reminders': 'Receive a reminder at your chosen time each day to encourage consistent reading.',

  'achievement-notifications':
    'Get notified when you unlock badges and reach reading milestones.',

  'streak-notifications':
    'Receive encouragement notifications when you\'re close to breaking your reading streak.',

  'new-readings-alerts':
    'Get notified when new readings are available for your selected liturgical calendar.',

  // Theme & Display
  'dark-mode':
    'Switch between light and dark theme. Dark mode is easier on the eyes in low light.',

  'font-size':
    'Adjust the scripture text size for comfortable reading. Larger text is easier for some users.',

  'line-spacing':
    'Increase space between lines for better readability. Helpful for those with dyslexia.',

  // Privacy
  'reading-history':
    'We track which readings you complete to calculate your progress and streak statistics.',

  'analytics':
    'Help us improve the app by sending anonymous usage data. No personal information is collected.',

  'sync-across-devices':
    'Your reading progress automatically syncs across all your devices when logged in.',
};
