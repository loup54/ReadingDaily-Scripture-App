/**
 * Basic Settings View Component
 *
 * Simplified settings interface for new users showing only essential options.
 * Hides advanced settings until user has been using app for configured days.
 * Phase 5: Progressive Settings Disclosure
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { SettingRow } from './SettingRow';

export interface BasicSettingsViewProps {
  /**
   * Current audio speed setting
   */
  audioSpeed: number;
  onAudioSpeedChange: (speed: number) => void;

  /**
   * Word highlighting enabled
   */
  enableAudioHighlighting: boolean;
  onAudioHighlightingChange: (enabled: boolean) => void;

  /**
   * Translations enabled
   */
  enableTranslation: boolean;
  onTranslationChange: (enabled: boolean) => void;

  /**
   * Selected translation language
   */
  translationLanguage: string;
  onTranslationLanguageChange: (language: string) => void;

  /**
   * Dark mode enabled
   */
  enableDarkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;

  /**
   * Callback to unlock advanced settings
   */
  onUnlockAdvanced?: () => void;

  /**
   * Days until advanced settings unlock
   */
  daysUntilUnlock?: number;
}

/**
 * BasicSettingsView - Simplified settings for new users
 *
 * Shows only essential settings:
 * - Audio playback speed
 * - Word highlighting
 * - Translation settings
 * - Dark mode
 *
 * Hides advanced options until user reaches usage threshold
 */
export const BasicSettingsView: React.FC<BasicSettingsViewProps> = ({
  audioSpeed,
  onAudioSpeedChange,
  enableAudioHighlighting,
  onAudioHighlightingChange,
  enableTranslation,
  onTranslationChange,
  translationLanguage,
  onTranslationLanguageChange,
  enableDarkMode,
  onDarkModeChange,
  onUnlockAdvanced,
  daysUntilUnlock = 0,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Essential Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Most important settings for your reading experience
        </Text>
      </View>

      {/* Audio Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          🔊 Audio
        </Text>

        <SettingRow
          label="Playback Speed"
          tooltip="Control how fast the audio plays. 1.0x is normal speed."
        >
          <View style={styles.speedControls}>
            {[0.75, 1.0, 1.25, 1.5].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  audioSpeed === speed && {
                    backgroundColor: colors.primary.blue,
                  },
                ]}
                onPress={() => onAudioSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    {
                      color:
                        audioSpeed === speed
                          ? colors.text.white
                          : colors.text.primary,
                    },
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingRow>

        <SettingRow
          label="Word Highlighting"
          tooltip="Words highlight as the audio plays, helping you follow along."
        >
          <Switch
            value={enableAudioHighlighting}
            onValueChange={onAudioHighlightingChange}
            trackColor={{ false: '#767577', true: colors.primary.blue }}
          />
        </SettingRow>
      </View>

      {/* Translation Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          🌍 Translation
        </Text>

        <SettingRow
          label="Enable Translation"
          tooltip="Tap any word to see its instant translation. Great for language learning."
        >
          <Switch
            value={enableTranslation}
            onValueChange={onTranslationChange}
            trackColor={{ false: '#767577', true: colors.primary.blue }}
          />
        </SettingRow>

        {enableTranslation && (
          <SettingRow label="Translation Language" tooltip="Choose your translation language">
            <View
              style={[
                styles.languageDisplay,
                { backgroundColor: colors.background.card },
              ]}
            >
              <Text style={[styles.languageText, { color: colors.text.primary }]}>
                {translationLanguage}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.text.secondary}
              />
            </View>
          </SettingRow>
        )}
      </View>

      {/* Display Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          🎨 Display
        </Text>

        <SettingRow
          label="Dark Mode"
          tooltip="Switch to dark theme for more comfortable reading in low light."
        >
          <Switch
            value={enableDarkMode}
            onValueChange={onDarkModeChange}
            trackColor={{ false: '#767577', true: colors.primary.blue }}
          />
        </SettingRow>
      </View>

      {/* Unlock Advanced Settings Card */}
      {daysUntilUnlock > 0 && (
        <View
          style={[
            styles.unlockedCard,
            { backgroundColor: colors.background.card },
          ]}
        >
          <View style={styles.unlockedIconContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={colors.primary.blue}
            />
          </View>

          <Text style={[styles.unlockedTitle, { color: colors.text.primary }]}>
            Advanced Settings Locked
          </Text>

          <Text style={[styles.unlockedMessage, { color: colors.text.secondary }]}>
            Continue using the app to unlock advanced settings.
          </Text>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.primary.blue + '30',
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary.blue,
                    width: `${Math.min(100, ((3 - daysUntilUnlock) / 3) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.daysText, { color: colors.text.secondary }]}>
              {daysUntilUnlock} day{daysUntilUnlock !== 1 ? 's' : ''} until unlock
            </Text>
          </View>

          {onUnlockAdvanced && (
            <TouchableOpacity
              style={[
                styles.unlockButton,
                { backgroundColor: colors.primary.blue },
              ]}
              onPress={onUnlockAdvanced}
            >
              <Text style={styles.unlockButtonText}>
                Unlock Advanced Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    color: Colors.text.primary,
  },

  headerSubtitle: {
    ...Typography.body,
    fontSize: 14,
  },

  section: {
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  speedControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  speedButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary.blue,
    alignItems: 'center',
  },

  speedButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },

  languageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  languageText: {
    fontSize: 14,
    fontWeight: '500',
  },

  unlockedCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },

  unlockedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.blue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  unlockedTitle: {
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },

  unlockedMessage: {
    ...Typography.body,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  progressContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },

  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  daysText: {
    fontSize: 12,
    textAlign: 'center',
  },

  unlockButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },

  unlockButtonText: {
    ...Typography.label,
    color: Colors.text.white,
    fontWeight: '600',
  },
});
