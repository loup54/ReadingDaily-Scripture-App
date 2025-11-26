/**
 * Settings Store using Zustand
 *
 * Manages user preferences for audio, translation, theme,
 * notifications, and privacy settings.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  AudioSettings,
  TranslationSettings,
  LocalizationSettings,
  ThemeSettings,
  NotificationSettings,
  PrivacySettings,
  OfflineSettings,
  DEFAULT_SETTINGS,
} from '../types/settings.types';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';
import { SyncQueueService } from '@/services/offline/SyncQueueService';

interface OnboardingState {
  completed: boolean;
  completedAt?: number;
  featuresDiscovered: string[];
  lastSeenFeatureTip?: string;
}

interface SettingsModeState {
  mode: 'basic' | 'advanced';
  unlockedAt?: number;
  daysBeforeAdvanced: number; // Days of usage before showing advanced
}

interface SettingsStoreState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  onboarding: OnboardingState;
  settingsMode: SettingsModeState;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Individual setting updates
  updateAudioSettings: (audio: Partial<AudioSettings>) => Promise<void>;
  updateTranslationSettings: (translation: Partial<TranslationSettings>) => Promise<void>;
  updateLocalizationSettings: (localization: Partial<LocalizationSettings>) => Promise<void>;
  updateThemeSettings: (theme: Partial<ThemeSettings>) => Promise<void>;
  updateNotificationSettings: (notifications: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (privacy: Partial<PrivacySettings>) => Promise<void>;
  updateOfflineSettings: (offline: Partial<OfflineSettings>) => Promise<void>;

  // Onboarding actions
  setOnboardingCompleted: () => void;
  addDiscoveredFeature: (featureName: string) => void;
  hasDiscoveredFeature: (featureName: string) => boolean;

  // Settings mode actions
  setSettingsMode: (mode: 'basic' | 'advanced') => void;
  unlockAdvancedSettings: () => void;
  shouldShowAdvancedSettings: () => boolean;

  // Helpers
  clearError: () => void;
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      loading: false,
      error: null,
      onboarding: {
        completed: false,
        featuresDiscovered: [],
      },
      settingsMode: {
        mode: 'basic',
        daysBeforeAdvanced: 3, // Show advanced after 3 days of usage
      },

      // Load settings from storage
      loadSettings: async () => {
        set({ loading: true, error: null });

        try {
          // Settings are automatically loaded by Zustand persist middleware
          // This method is for any additional initialization if needed

          set({
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load settings',
          });
        }
      },

      // Update complete settings object
      updateSettings: async (updates: Partial<AppSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              ...updates,
              lastUpdated: Date.now(),
            },
            error: null,
          });

          // Queue for sync if offline
          const networkState = NetworkStatusService.getCurrentState();
          if (networkState.status !== 'online') {
            console.log('[SettingsStore] Offline - queuing settings sync');
            try {
              await SyncQueueService.addToQueue({
                type: 'sync_settings',
                timestamp: Date.now(),
                data: updates,
              });
            } catch (queueError) {
              console.warn('[SettingsStore] Failed to queue sync:', queueError);
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update settings',
          });
        }
      },

      // Reset all settings to defaults
      resetSettings: async () => {
        try {
          set({
            settings: {
              ...DEFAULT_SETTINGS,
              lastUpdated: Date.now(),
            },
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reset settings',
          });
        }
      },

      // Update audio settings
      updateAudioSettings: async (audio: Partial<AudioSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              audio: {
                ...currentSettings.audio,
                ...audio,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update audio settings',
          });
        }
      },

      // Update translation settings
      updateTranslationSettings: async (translation: Partial<TranslationSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              translation: {
                ...currentSettings.translation,
                ...translation,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update translation settings',
          });
        }
      },

      // Update localization settings
      updateLocalizationSettings: async (localization: Partial<LocalizationSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              localization: {
                ...currentSettings.localization,
                ...localization,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });

          // Sync i18n language with localization setting
          if (localization.appLanguageCode) {
            console.log(`[SettingsStore] Language changed to: ${localization.appLanguageCode}`);
            try {
              // Import dynamically to avoid circular dependencies
              const i18n = (await import('@/i18n.config')).default;
              await i18n.changeLanguage(localization.appLanguageCode);
            } catch (i18nError) {
              console.warn('[SettingsStore] Failed to update i18n language:', i18nError);
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update localization settings',
          });
        }
      },

      // Update theme settings
      updateThemeSettings: async (theme: Partial<ThemeSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              theme: {
                ...currentSettings.theme,
                ...theme,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update theme settings',
          });
        }
      },

      // Update notification settings
      updateNotificationSettings: async (notifications: Partial<NotificationSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              notifications: {
                ...currentSettings.notifications,
                ...notifications,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });

          // TODO: Schedule/cancel notifications based on settings (Phase 16)
          if (notifications.enabled !== undefined) {
            if (notifications.enabled) {
              console.log('📅 Scheduling daily notifications...');
              // await scheduleNotifications();
            } else {
              console.log('🔕 Cancelling notifications...');
              // await cancelNotifications();
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update notification settings',
          });
        }
      },

      // Update privacy settings
      updatePrivacySettings: async (privacy: Partial<PrivacySettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              privacy: {
                ...currentSettings.privacy,
                ...privacy,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });

          // TODO: Enable/disable analytics based on settings (Phase 17)
          if (privacy.analyticsEnabled !== undefined) {
            if (privacy.analyticsEnabled) {
              console.log('📊 Enabling analytics...');
              // await enableAnalytics();
            } else {
              console.log('🔒 Disabling analytics...');
              // await disableAnalytics();
            }
          }

          if (privacy.crashReportingEnabled !== undefined) {
            if (privacy.crashReportingEnabled) {
              console.log('🐛 Enabling crash reporting...');
              // await enableCrashReporting();
            } else {
              console.log('🔒 Disabling crash reporting...');
              // await disableCrashReporting();
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update privacy settings',
          });
        }
      },

      // Update offline settings
      updateOfflineSettings: async (offline: Partial<OfflineSettings>) => {
        try {
          const currentSettings = get().settings;

          set({
            settings: {
              ...currentSettings,
              offline: {
                ...currentSettings.offline,
                ...offline,
              },
              lastUpdated: Date.now(),
            },
            error: null,
          });

          console.log('[SettingsStore] Offline settings updated:', offline);

          // Queue for sync if offline
          const networkState = NetworkStatusService.getCurrentState();
          if (networkState.status !== 'online') {
            console.log('[SettingsStore] Offline - queuing offline settings sync');
            try {
              await SyncQueueService.addToQueue({
                type: 'sync_settings',
                timestamp: Date.now(),
                data: { offline },
              });
            } catch (queueError) {
              console.warn('[SettingsStore] Failed to queue sync:', queueError);
            }
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update offline settings',
          });
        }
      },

      // Set onboarding as completed
      setOnboardingCompleted: () => {
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            completed: true,
            completedAt: Date.now(),
          },
        }));
      },

      // Add a discovered feature
      addDiscoveredFeature: (featureName: string) => {
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            featuresDiscovered: Array.from(
              new Set([...state.onboarding.featuresDiscovered, featureName])
            ),
          },
        }));
      },

      // Check if feature has been discovered
      hasDiscoveredFeature: (featureName: string) => {
        return get().onboarding.featuresDiscovered.includes(featureName);
      },

      // Set settings mode (basic or advanced)
      setSettingsMode: (mode: 'basic' | 'advanced') => {
        set((state) => ({
          settingsMode: {
            ...state.settingsMode,
            mode,
            unlockedAt: mode === 'advanced' ? Date.now() : state.settingsMode.unlockedAt,
          },
        }));
      },

      // Unlock advanced settings after usage period
      unlockAdvancedSettings: () => {
        set((state) => ({
          settingsMode: {
            ...state.settingsMode,
            mode: 'advanced',
            unlockedAt: Date.now(),
          },
        }));
      },

      // Check if advanced settings should be shown based on usage
      shouldShowAdvancedSettings: () => {
        const state = get();
        const { settingsMode, onboarding } = state;

        // If already unlocked manually, show advanced
        if (settingsMode.mode === 'advanced') {
          return true;
        }

        // If onboarding is completed and enough days passed, show advanced
        if (onboarding.completedAt) {
          const daysSinceOnboarding = Math.floor(
            (Date.now() - onboarding.completedAt) / (1000 * 60 * 60 * 24)
          );
          return daysSinceOnboarding >= settingsMode.daysBeforeAdvanced;
        }

        return false;
      },

      // Clear error message
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'app-settings-storage', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),
      version: 1, // Version for migration tracking - CRITICAL for migrate function to run

      // Persist settings, onboarding state, and settings mode
      partialize: (state) => ({
        settings: state.settings,
        onboarding: state.onboarding,
        settingsMode: state.settingsMode,
      }),

      // Migration: Ensure enableAudioHighlighting defaults to false for existing users
      // This runs when version mismatch is detected (old data without version will be version 0)
      migrate: (persistedState: any, version: number) => {
        console.log('[SettingsStore] Persist middleware migration running, version:', version, 'persistedState exists:', !!persistedState);

        if (!persistedState) {
          console.log('[SettingsStore] No persisted state, using defaults');
          return {
            settings: {
              ...DEFAULT_SETTINGS,
              audio: {
                ...DEFAULT_SETTINGS.audio,
                enableAudioHighlighting: false,
              }
            }
          };
        }

        // Handle old data from version 0 (before versioning was added)
        if (version === 0) {
          console.log('[SettingsStore] Migrating from version 0 - ensuring enableAudioHighlighting is false');
        }

        // Ensure settings object exists
        if (!persistedState.settings) {
          persistedState.settings = DEFAULT_SETTINGS;
        }

        // Ensure audio settings exist
        if (!persistedState.settings.audio) {
          persistedState.settings.audio = DEFAULT_SETTINGS.audio;
        }

        // ALWAYS disable audio highlighting (both for new and existing users)
        // This ensures graceful degradation until timing data is available
        console.log('[SettingsStore] ✅ Persist migration: setting enableAudioHighlighting to false');
        persistedState.settings.audio.enableAudioHighlighting = false;

        return persistedState;
      },

      // Post-hydration hook: Ensure enableAudioHighlighting is false even if migration didn't run
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[SettingsStore] Rehydration error:', error);
            return;
          }

          // CRITICAL FIX: Ensure enableAudioHighlighting is ALWAYS false
          // This handles the case where migration didn't run but old value persisted
          if (state && state.settings && state.settings.audio) {
            const shouldUpdate = state.settings.audio.enableAudioHighlighting !== false;
            if (shouldUpdate) {
              console.log('[SettingsStore] 🔧 Post-hydration fix: Setting enableAudioHighlighting to false');
              state.settings.audio.enableAudioHighlighting = false;
            }
          }
        };
      },
    }
  )
);

/**
 * Manual migration function to fix highlighting setting on app startup
 * Ensures existing users get the correct default (disabled)
 */
export async function migrateSettingsIfNeeded() {
  try {
    console.log('[SettingsStore] Checking if settings migration is needed...');
    const store = useSettingsStore.getState();

    // Check if highlighting is enabled (old default)
    if (store.settings.audio.enableAudioHighlighting === true) {
      console.log('[SettingsStore] Found enableAudioHighlighting=true, migrating to false');

      // Update in-memory store
      await store.updateAudioSettings({ enableAudioHighlighting: false });

      // Force persistence by updating the entire settings object
      await AsyncStorage.setItem('app-settings-storage', JSON.stringify({
        state: {
          settings: {
            ...store.settings,
            audio: {
              ...store.settings.audio,
              enableAudioHighlighting: false,
            }
          }
        },
        version: 0
      }));

      console.log('[SettingsStore] ✅ Settings migrated successfully');
    } else {
      console.log('[SettingsStore] Settings already correct, no migration needed');
    }
  } catch (error) {
    console.error('[SettingsStore] Migration error:', error);
  }
}

/**
 * Hook to get specific setting values
 * Makes it easy to access individual settings without subscribing to the whole store
 */
export const useAudioSettings = () => useSettingsStore((state) => state.settings.audio);
export const useTranslationSettings = () => useSettingsStore((state) => state.settings.translation);
export const useLocalizationSettings = () => useSettingsStore((state) => state.settings.localization);
export const useThemeSettings = () => useSettingsStore((state) => state.settings.theme);
export const useNotificationSettings = () => useSettingsStore((state) => state.settings.notifications);
export const usePrivacySettings = () => useSettingsStore((state) => state.settings.privacy);
export const useOfflineSettings = () => useSettingsStore((state) => state.settings.offline);
