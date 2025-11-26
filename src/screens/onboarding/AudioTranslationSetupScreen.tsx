/**
 * Audio & Translation Setup Onboarding Screen
 *
 * Allows users to configure:
 * - Speaking speed
 * - Voice preference
 * - Translation language
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTranslationStore } from '@/stores/useTranslationStore';
import { TranslationService } from '@/services/translation/TranslationService';
import { Button } from '@components/common';

interface AudioTranslationSetupScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5;
type VoiceType = 'auto' | 'male' | 'female';

export const AudioTranslationSetupScreen: React.FC<AudioTranslationSetupScreenProps> = ({
  onContinue,
  onSkip,
}) => {
  const { colors } = useTheme();
  const { updateAudioSettings } = useSettingsStore();
  const { setPreferredLanguage } = useTranslationStore();

  const [speed, setSpeed] = useState<PlaybackSpeed>(1.0);
  const [voice, setVoice] = useState<VoiceType>('auto');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es'); // Spanish default
  const [isLoading, setIsLoading] = useState(false);

  const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5];
  const VOICE_OPTIONS: { value: VoiceType; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const handleContinue = useCallback(async () => {
    setIsLoading(true);
    try {
      // Save audio settings
      await updateAudioSettings({
        speed,
        voice,
      });

      // Save translation language
      await setPreferredLanguage(selectedLanguage);

      console.log('[AudioSetup] Settings saved:', {
        speed,
        voice,
        language: selectedLanguage,
      });

      onContinue();
    } catch (error) {
      console.error('[AudioSetup] Failed to save settings:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [speed, voice, selectedLanguage, updateAudioSettings, setPreferredLanguage, onContinue]);

  const handleSkip = useCallback(() => {
    console.log('[AudioSetup] User skipped setup');
    onSkip();
  }, [onSkip]);

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background.primary,
    },
    card: {
      ...styles.card,
      backgroundColor: colors.background.card,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: colors.text.white,
    },
    label: {
      ...styles.label,
      color: colors.text.primary,
    },
    description: {
      ...styles.description,
      color: colors.text.secondary,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <LinearGradient
        colors={colors.primary.gradient}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.white }]}>
            Customize Your Learning
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: `${colors.text.white}80` }]}
          >
            Set up your audio and translation preferences
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Speaking Speed Section */}
          <View style={styles.section}>
            <View style={dynamicStyles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="volume-medium"
                  size={24}
                  color={colors.primary.blue}
                />
                <Text style={dynamicStyles.sectionTitle}>Speaking Speed</Text>
              </View>

              <Text style={dynamicStyles.description}>
                How fast should the audio play?
              </Text>

              <View style={styles.speedButtons}>
                {SPEED_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.speedButton,
                      speed === option && [
                        styles.speedButtonActive,
                        { backgroundColor: colors.primary.blue },
                      ],
                    ]}
                    onPress={() => setSpeed(option)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.speedButtonText,
                        speed === option && styles.speedButtonTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {option}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[
                  styles.selectedValue,
                  { color: colors.primary.blue },
                ]}
              >
                {speed}x Speed
              </Text>
            </View>
          </View>

          {/* Voice Preference Section */}
          <View style={styles.section}>
            <View style={dynamicStyles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="mic"
                  size={24}
                  color={colors.primary.blue}
                />
                <Text style={dynamicStyles.sectionTitle}>Voice</Text>
              </View>

              <Text style={dynamicStyles.description}>
                Which voice would you prefer?
              </Text>

              <View style={styles.voiceButtons}>
                {VOICE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.voiceButton,
                      voice === option.value && [
                        styles.voiceButtonActive,
                        { backgroundColor: colors.primary.blue },
                      ],
                    ]}
                    onPress={() => setVoice(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.voiceButtonText,
                        voice === option.value && styles.voiceButtonTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Translation Language Section */}
          <View style={styles.section}>
            <View style={dynamicStyles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="language"
                  size={24}
                  color={colors.primary.blue}
                />
                <Text style={dynamicStyles.sectionTitle}>
                  Translation Language
                </Text>
              </View>

              <Text style={dynamicStyles.description}>
                Tap words to see their meaning in:
              </Text>

              <View style={styles.languageGrid}>
                {TranslationService.SUPPORTED_LANGUAGES.filter(
                  (lang) => lang.code !== 'en'
                ).map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageButton,
                      selectedLanguage === lang.code && [
                        styles.languageButtonActive,
                        { backgroundColor: colors.primary.blue },
                      ],
                    ]}
                    onPress={() => setSelectedLanguage(lang.code)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.languageButtonText,
                        selectedLanguage === lang.code &&
                          styles.languageButtonTextActive,
                      ]}
                    >
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: `${colors.primary.blue}20` },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary.blue}
            />
            <Text style={[styles.infoText, { color: colors.text.primary }]}>
              You can adjust these settings anytime in Settings
            </Text>
          </View>
        </ScrollView>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.text.white }]}
            onPress={handleSkip}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: colors.text.white }]}>
              Skip
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Button
              title={isLoading ? 'Setting up...' : 'Continue'}
              onPress={handleContinue}
              disabled={isLoading}
              variant="primary"
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.displayMedium,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    ...Typography.body,
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    flex: 1,
  },
  label: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  speedButton: {
    flex: 1,
    minWidth: 55,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedButtonActive: {
    borderWidth: 2,
    borderColor: Colors.primary.blue,
  },
  speedButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
    fontSize: 15,
  },
  speedButtonTextActive: {
    color: Colors.text.white,
  },
  selectedValue: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  voiceButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  voiceButton: {
    flex: 1,
    minHeight: 56,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    borderWidth: 2,
    borderColor: Colors.primary.blue,
  },
  voiceButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
    fontSize: 15,
  },
  voiceButtonTextActive: {
    color: Colors.text.white,
    fontWeight: '600',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  languageButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    borderWidth: 2,
    borderColor: Colors.primary.blue,
  },
  languageButtonText: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  languageButtonTextActive: {
    color: Colors.text.white,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
});
