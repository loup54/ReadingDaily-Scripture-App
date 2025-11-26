/**
 * App Settings Types
 *
 * User preferences for audio, translation, theme, and app behavior.
 */

/**
 * Audio Settings
 */
export type VoiceType = 'auto' | 'male' | 'female';
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5;

export interface AudioSettings {
  voice: VoiceType;
  speed: PlaybackSpeed;
  autoPlay: boolean;
  downloadForOffline: boolean;
  enableAudioHighlighting: boolean;
}

/**
 * Translation Settings
 */
export type SupportedLanguage = 'spanish' | 'vietnamese' | 'mandarin';
export type AppLanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'ar' | 'hi' | 'vi' | 'th' | 'pl' | 'nl' | 'tr';
export type Accent = 'american' | 'british';

export interface TranslationSettings {
  enabled: boolean;
  language: SupportedLanguage;
  showInlineLearning: boolean; // Show word difficulty badges
  autoTranslate: boolean; // Auto-translate selected text
  tapToTranslate?: boolean; // Tap to translate non-common words
  accent?: Accent; // Pronunciation accent
}

/**
 * App UI Localization Settings
 */
export interface LocalizationSettings {
  appLanguageCode: AppLanguageCode; // i18n language code (en, es, fr, etc.)
}

/**
 * Theme Settings (Future - Phase 15+)
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeSettings {
  mode: ThemeMode;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  fontFamily: 'system' | 'serif' | 'sans-serif';
}

/**
 * Notification Settings (Future - Phase 16+)
 */
export interface NotificationSettings {
  enabled: boolean;
  dailyReadingTime: string; // HH:MM format (e.g., "08:00")
  reminderEnabled: boolean;
  soundEnabled: boolean;
}

/**
 * Privacy Settings
 */
export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
}

/**
 * Offline Settings
 */
export interface OfflineSettings {
  autoDownloadEnabled: boolean;
  wifiOnlyEnabled: boolean;
  autoDownloadFrequency: 'daily' | 'weekly' | 'manual';
  selectedLanguagesForCache: string[];
  audioVoiceForDownload: string;
  audioSpeedForDownload: PlaybackSpeed;
  maxCacheSizeMB: number;
  autoCleanupOldReadings: boolean;
  daysToKeepReadings: number;
}

/**
 * Complete App Settings
 */
export interface AppSettings {
  audio: AudioSettings;
  translation: TranslationSettings;
  localization: LocalizationSettings;
  theme: ThemeSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  offline: OfflineSettings;

  // App metadata
  version: string;
  lastUpdated: number; // Unix timestamp (ms)
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  audio: {
    voice: 'auto',
    speed: 1.0,
    autoPlay: false,
    downloadForOffline: false,
    enableAudioHighlighting: false,
  },
  translation: {
    enabled: false,
    language: 'spanish',
    showInlineLearning: true,
    autoTranslate: true,
    tapToTranslate: false,
    accent: 'british',
  },
  localization: {
    appLanguageCode: 'en',
  },
  theme: {
    mode: 'system',
    fontSize: 'medium',
    fontFamily: 'system',
  },
  notifications: {
    enabled: false,
    dailyReadingTime: '08:00',
    reminderEnabled: false,
    soundEnabled: true,
  },
  privacy: {
    analyticsEnabled: true,
    crashReportingEnabled: true,
  },
  offline: {
    autoDownloadEnabled: true,
    wifiOnlyEnabled: false,
    autoDownloadFrequency: 'daily',
    selectedLanguagesForCache: ['es', 'vi', 'zh'],
    audioVoiceForDownload: 'FEMALE_PRIMARY',
    audioSpeedForDownload: 1.0,
    maxCacheSizeMB: 50,
    autoCleanupOldReadings: true,
    daysToKeepReadings: 7,
  },
  version: '1.0.0',
  lastUpdated: Date.now(),
};

/**
 * Settings Store State
 */
export interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
}

/**
 * Settings Store (Zustand)
 */
export interface SettingsStore extends SettingsState {
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Individual setting updates
  updateAudioSettings: (audio: Partial<AudioSettings>) => Promise<void>;
  updateTranslationSettings: (translation: Partial<TranslationSettings>) => Promise<void>;
  updateThemeSettings: (theme: Partial<ThemeSettings>) => Promise<void>;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (privacy: Partial<PrivacySettings>) => Promise<void>;
}
