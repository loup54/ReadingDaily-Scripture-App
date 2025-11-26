/**
 * Full Text Translation Modal Component
 * Phase C2: Translation UI
 *
 * Modal that displays full passage translation with language selection
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

interface FullTextTranslationProps {
  visible: boolean;
  title: string;
  reference: string;
  text: string;
  onClose: () => void;
  defaultTargetLang?: string;
}

export const FullTextTranslation: React.FC<FullTextTranslationProps> = ({
  visible,
  title,
  reference,
  text,
  onClose,
  defaultTargetLang = 'es', // Spanish by default
}) => {
  const { colors } = useTheme();
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState(defaultTargetLang);
  const [showLanguageList, setShowLanguageList] = useState(false);

  // Update target language when defaultTargetLang prop changes
  useEffect(() => {
    setTargetLang(defaultTargetLang);
  }, [defaultTargetLang]);

  // Translate text whenever it changes or target language changes
  useEffect(() => {
    if (visible && text) {
      translateText();
    }
  }, [text, targetLang, visible]);

  const translateText = async () => {
    try {
      setLoading(true);
      setError(null);

      const service = getTranslationService();
      const result = await service.translateSentence(text, targetLang, 'en');
      setTranslation(result);
    } catch (err) {
      console.error('[FullTextTranslation] Translation failed:', err);
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background.primary }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
              <Text style={[styles.reference, { color: colors.text.secondary }]}>{reference}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={28} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Language Selector */}
          <TouchableOpacity
            style={[styles.languageSelector, { backgroundColor: colors.background.secondary }]}
            onPress={() => setShowLanguageList(!showLanguageList)}
          >
            <View style={styles.languageSelectorContent}>
              <Ionicons name="language" size={20} color={colors.primary.blue} />
              <Text style={[styles.languageName, { color: colors.text.primary }]}>
                {selectedLanguage?.nativeName || 'Select Language'}
              </Text>
              <Ionicons
                name={showLanguageList ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text.secondary}
              />
            </View>
          </TouchableOpacity>

          {/* Language List */}
          {showLanguageList ? (
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
          ) : (
            <>
              {/* Translation Content */}
              <ScrollView
                style={styles.contentScroll}
                showsVerticalScrollIndicator={true}
              >
                {loading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.blue} />
                    <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                      Translating passage...
                    </Text>
                  </View>
                )}

                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={40} color={colors.accent.red} />
                    <Text style={[styles.errorText, { color: colors.accent.red }]}>{error}</Text>
                    <TouchableOpacity
                      style={[styles.retryButton, { backgroundColor: colors.primary.blue }]}
                      onPress={translateText}
                    >
                      <Text style={[styles.retryButtonText, { color: colors.text.white }]}>
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {translation && !loading && !error && (
                  <View style={styles.translationContent}>
                    {/* Original Text */}
                    <View style={[styles.textSection, { backgroundColor: colors.background.secondary }]}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                          English
                        </Text>
                      </View>
                      <Text style={[styles.textContent, { color: colors.text.primary }]}>
                        {text}
                      </Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider}>
                      <Ionicons name="arrow-down" size={24} color={colors.primary.blue} />
                    </View>

                    {/* Translated Text */}
                    <View style={[styles.textSection, { backgroundColor: colors.background.secondary }]}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
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
                      <Text style={[styles.textContent, { color: colors.primary.blue }]}>
                        {translation.translatedText}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    height: '90%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs / 2,
  },
  reference: {
    ...Typography.label,
  },
  languageSelector: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  languageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageName: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  languageList: {
    flex: 1,
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
  contentScroll: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  errorText: {
    ...Typography.body,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
  },
  translationContent: {
    gap: Spacing.md,
  },
  textSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    fontWeight: '600',
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
  textContent: {
    ...Typography.body,
    lineHeight: 24,
  },
  divider: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
});
