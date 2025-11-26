/**
 * Translation Settings Store
 * Phase C3: Translation Settings
 *
 * Manages user preferences for translation feature
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATION_SETTINGS_KEY = '@translation_settings';

interface TranslationSettings {
  enabled: boolean;
  preferredLanguage: string; // Language code (e.g., 'es', 'fr')
}

interface TranslationStore extends TranslationSettings {
  isLoaded: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  setPreferredLanguage: (language: string) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: TranslationSettings = {
  enabled: true,
  preferredLanguage: 'es', // Spanish default
};

export const useTranslationStore = create<TranslationStore>((set, get) => ({
  ...DEFAULT_SETTINGS,
  isLoaded: false,

  /**
   * Load settings from AsyncStorage
   */
  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(TRANSLATION_SETTINGS_KEY);
      if (stored) {
        const settings: TranslationSettings = JSON.parse(stored);
        set({
          enabled: settings.enabled,
          preferredLanguage: settings.preferredLanguage,
          isLoaded: true,
        });
        console.log('[TranslationStore] Loaded settings:', settings);
      } else {
        // No stored settings, use defaults
        set({ isLoaded: true });
        console.log('[TranslationStore] Using default settings');
      }
    } catch (error) {
      console.error('[TranslationStore] Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },

  /**
   * Enable or disable translation feature
   */
  setEnabled: async (enabled: boolean) => {
    try {
      const currentSettings = {
        enabled,
        preferredLanguage: get().preferredLanguage,
      };

      await AsyncStorage.setItem(
        TRANSLATION_SETTINGS_KEY,
        JSON.stringify(currentSettings)
      );

      set({ enabled });
      console.log('[TranslationStore] Translation enabled:', enabled);
    } catch (error) {
      console.error('[TranslationStore] Failed to save enabled setting:', error);
    }
  },

  /**
   * Set preferred translation language
   */
  setPreferredLanguage: async (language: string) => {
    try {
      const currentSettings = {
        enabled: get().enabled,
        preferredLanguage: language,
      };

      await AsyncStorage.setItem(
        TRANSLATION_SETTINGS_KEY,
        JSON.stringify(currentSettings)
      );

      set({ preferredLanguage: language });
      console.log('[TranslationStore] Preferred language:', language);
    } catch (error) {
      console.error('[TranslationStore] Failed to save language setting:', error);
    }
  },
}));
