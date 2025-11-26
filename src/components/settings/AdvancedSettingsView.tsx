/**
 * Advanced Settings View Component
 *
 * Full-featured settings interface for experienced users with all options.
 * Includes all basic settings plus advanced customization options.
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

export interface AdvancedSettingsViewProps {
  /**
   * Audio speed setting
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
   * Translation language
   */
  translationLanguage: string;
  onTranslationLanguageChange: (language: string) => void;

  /**
   * Dark mode enabled
   */
  enableDarkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;

  /**
   * Auto download enabled
   */
  enableAutoDownload: boolean;
  onAutoDownloadChange: (enabled: boolean) => void;

  /**
   * WiFi only for downloads
   */
  wifiOnly: boolean;
  onWifiOnlyChange: (enabled: boolean) => void;

  /**
   * Daily reminders enabled
   */
  enableDailyReminders: boolean;
  onDailyRemindersChange: (enabled: boolean) => void;

  /**
   * Callback to lock back to basic settings
   */
  onLockBasic?: () => void;
}

/**
 * AdvancedSettingsView - Full settings interface
 *
 * Shows all available settings including:
 * - Audio customization
 * - Translation settings
 * - Display options
 * - Offline/Download settings
 * - Notification preferences
 *
 * Available after user reaches usage threshold or manually unlocks
 */
export const AdvancedSettingsView: React.FC<AdvancedSettingsViewProps> = ({
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
  enableAutoDownload,
  onAutoDownloadChange,
  wifiOnly,
  onWifiOnlyChange,
  enableDailyReminders,
  onDailyRemindersChange,
  onLockBasic,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header with advanced badge */}
      <View style={styles.headerContainer}>
        <View style={styles.headerBadge}>
          <Ionicons name="sparkles" size={16} color={colors.primary.blue} />
          <Text style={[styles.badgeText, { color: colors.primary.blue }]}>
            Advanced
          </Text>
        </View>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          All Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Full control over your reading experience
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
          <SettingRow
            label="Translation Language"
            tooltip="Choose your translation language"
          >
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

      {/* Offline Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          📱 Offline & Storage
        </Text>

        <SettingRow
          label="Auto-Download Readings"
          tooltip="Automatically download new readings when connected to WiFi for offline reading."
        >
          <Switch
            value={enableAutoDownload}
            onValueChange={onAutoDownloadChange}
            trackColor={{ false: '#767577', true: colors.primary.blue }}
          />
        </SettingRow>

        {enableAutoDownload && (
          <SettingRow
            label="WiFi Only"
            tooltip="Only download when on WiFi to save cellular data."
          >
            <Switch
              value={wifiOnly}
              onValueChange={onWifiOnlyChange}
              trackColor={{ false: '#767577', true: colors.primary.blue }}
            />
          </SettingRow>
        )}
      </View>

      {/* Notification Settings Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          🔔 Notifications
        </Text>

        <SettingRow
          label="Daily Reminders"
          tooltip="Receive a reminder each day to encourage consistent reading."
        >
          <Switch
            value={enableDailyReminders}
            onValueChange={onDailyRemindersChange}
            trackColor={{ false: '#767577', true: colors.primary.blue }}
          />
        </SettingRow>
      </View>

      {/* Back to Basic Option */}
      {onLockBasic && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[
              styles.basicButton,
              { borderColor: colors.primary.blue },
            ]}
            onPress={onLockBasic}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={colors.primary.blue}
            />
            <Text style={[styles.basicButtonText, { color: colors.primary.blue }]}>
              Switch to Basic Settings
            </Text>
          </TouchableOpacity>

          <Text style={[styles.footerText, { color: colors.text.secondary }]}>
            Prefer a simpler interface? You can always switch back to basic settings.
          </Text>
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

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  footerContainer: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    alignItems: 'center',
  },

  basicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },

  basicButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  footerText: {
    ...Typography.body,
    fontSize: 12,
    textAlign: 'center',
  },
});
