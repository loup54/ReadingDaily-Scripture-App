/**
 * Word Translation Modal Component
 * Phase C1: Translation Service
 *
 * Modal that displays word translation with language selection
 * Includes pronunciation buttons for both English and translated words
 *
 * Phase: Word Pronunciation Feature (Phase 2 Integration)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTranslationService, TranslationResult, SupportedLanguage, TranslationService } from '@/services/translation/TranslationService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { PronunciationButton } from '@/components/common/PronunciationButton';

interface WordTranslationProps {
  visible: boolean;
  word: string;
  onClose: () => void;
  defaultTargetLang?: string;
}

export const WordTranslation: React.FC<WordTranslationProps> = ({
  visible,
  word,
  onClose,
  defaultTargetLang = 'es', // Spanish by default
}) => {
  const { colors } = useTheme();
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(defaultTargetLang);
  const [showLanguageList, setShowLanguageList] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);

  // Update target language when defaultTargetLang prop changes
  useEffect(() => {
    setTargetLang(defaultTargetLang);
  }, [defaultTargetLang]);

  // Translate word whenever it changes or target language changes
  useEffect(() => {
    if (visible && word) {
      translateWord();
    }
  }, [word, targetLang, visible]);

  const translateWord = async () => {
    try {
      setLoading(true);
      setError(null);

      const service = getTranslationService();
      const result = await service.translateWord(word, targetLang, 'en');
      setTranslation(result);
    } catch (err) {
      console.error('[WordTranslation] Translation failed:', err);
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    setTargetLang(langCode);
    setShowLanguageList(false);
  };

  const selectedLanguage = TranslationService.SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === targetLang
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.modal, { backgroundColor: colors.background.primary }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>Translation</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Pronunciation Error Alert */}
          {pronunciationError && (
            <View style={[styles.pronunciationErrorBanner, { backgroundColor: colors.accent.red + '15' }]}>
              <Ionicons name="alert-circle" size={16} color={colors.accent.red} />
              <Text style={[styles.pronunciationErrorText, { color: colors.accent.red }]}>
                {pronunciationError}
              </Text>
            </View>
          )}

          {/* Original Word */}
          <View style={[styles.wordContainer, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>English</Text>
            <View style={styles.wordWithPronunciation}>
              <Text style={[styles.word, { color: colors.text.primary }]}>{word}</Text>
              <PronunciationButton
                word={word}
                language="en"
                size="lg"
                onError={(error) => {
                  console.log('[WordTranslation] Pronunciation error:', error);
                  setPronunciationError(error);
                  // Clear error after 3 seconds
                  setTimeout(() => setPronunciationError(null), 3000);
                }}
              />
            </View>
          </View>

          {/* Language Selector */}
          <TouchableOpacity
            style={[styles.languageSelector, { backgroundColor: colors.background.secondary }]}
            onPress={() => setShowLanguageList(!showLanguageList)}
          >
            <View style={styles.languageSelectorContent}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Translate to</Text>
              <View style={styles.languageRow}>
                <Text style={[styles.languageName, { color: colors.text.primary }]}>
                  {selectedLanguage?.nativeName || 'Select Language'}
                </Text>
                <Ionicons
                  name={showLanguageList ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text.secondary}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Language List */}
          {showLanguageList && (
            <ScrollView style={[styles.languageList, { backgroundColor: colors.background.secondary }]}>
              {TranslationService.SUPPORTED_LANGUAGES.filter((lang) => lang.code !== 'en').map(
                (lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageItem,
                      targetLang === lang.code && {
                        backgroundColor: colors.primary.blue + '20',
                      },
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <Text style={[styles.languageItemName, { color: colors.text.primary }]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[styles.languageItemCode, { color: colors.text.secondary }]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          )}

          {/* Translation Result */}
          {!showLanguageList && (
            <View style={styles.translationContainer}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary.blue} />
                  <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                    Translating...
                  </Text>
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={32} color={colors.accent.red} />
                  <Text style={[styles.errorText, { color: colors.accent.red }]}>{error}</Text>
                </View>
              )}

              {translation && !loading && !error && (
                <View style={[styles.wordContainer, { backgroundColor: colors.background.secondary }]}>
                  <View style={styles.translationHeader}>
                    <Text style={[styles.label, { color: colors.text.secondary }]}>
                      {selectedLanguage?.nativeName}
                    </Text>
                    {translation.cached && (
                      <View style={styles.cachedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.accent.green} />
                        <Text style={[styles.cachedText, { color: colors.accent.green }]}>
                          Cached
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.wordWithPronunciation}>
                    <Text style={[styles.translatedWord, { color: colors.primary.blue }]}>
                      {translation.translatedText}
                    </Text>
                    <PronunciationButton
                      word={translation.translatedText}
                      language={targetLang}
                      size="lg"
                      onError={(error) => {
                        console.log('[WordTranslation] Pronunciation error:', error);
                        setPronunciationError(error);
                        // Clear error after 3 seconds
                        setTimeout(() => setPronunciationError(null), 3000);
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
  },
  wordContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.caption,
    marginBottom: Spacing.xs / 2,
  },
  word: {
    ...Typography.displayMedium,
    fontSize: 28,
    flex: 1,
  },
  translatedWord: {
    ...Typography.displayMedium,
    fontSize: 28,
    flex: 1,
  },
  wordWithPronunciation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  languageSelector: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  languageSelectorContent: {
    gap: Spacing.xs / 2,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageName: {
    ...Typography.body,
    fontWeight: '600',
  },
  languageList: {
    maxHeight: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  languageItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  languageItemName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs / 4,
  },
  languageItemCode: {
    ...Typography.caption,
  },
  translationContainer: {
    minHeight: 120,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  translationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs / 2,
  },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  cachedText: {
    ...Typography.caption,
    fontSize: 11,
  },
  pronunciationErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  pronunciationErrorText: {
    ...Typography.caption,
    fontSize: 12,
    flex: 1,
  },
});
