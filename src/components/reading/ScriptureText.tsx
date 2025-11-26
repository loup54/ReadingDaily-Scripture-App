import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reading } from '@/types/reading.types';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { LoadingState } from '@/components/common/LoadingState';
import { useTranslationStore } from '@/stores/useTranslationStore';
import { WordTranslation } from '@/components/translation';
import { PronunciationPractice } from '@/screens/PronunciationPractice';
import { getTranslationService, TranslationResult } from '@/services/translation/TranslationService';

interface ScriptureTextProps {
  reading: Reading;
}

export const ScriptureText: React.FC<ScriptureTextProps> = ({ reading }) => {
  const { colors } = useTheme();
  const { enabled: translationEnabled, preferredLanguage, loadSettings } = useTranslationStore();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showPronunciationPractice, setShowPronunciationPractice] = useState(false);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Load translation settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Load translation when reading or language changes
  useEffect(() => {
    if (translationEnabled && reading.content) {
      loadTranslation();
    }
  }, [reading.id, preferredLanguage, translationEnabled]);

  const loadTranslation = async () => {
    try {
      setTranslationLoading(true);
      setTranslationError(null);

      const service = getTranslationService();
      const result = await service.translateSentence(reading.content, preferredLanguage, 'en');
      setTranslation(result);
    } catch (err) {
      console.error('[ScriptureText] Translation failed:', err);
      setTranslationError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleWordPress = (word: string) => {
    // Clean the word (remove punctuation)
    const cleanedWord = word.replace(/[^\w\s]/g, '').trim();
    if (cleanedWord.length > 0) {
      setSelectedWord(cleanedWord);
      setShowTranslation(true);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setCanScrollDown(!isScrolledToBottom);
  };

  const renderTappableText = (text: string) => {
    // Split text into words while preserving spaces and punctuation
    const words = text.split(/(\s+)/);

    return (
      <Text style={[styles.content, { color: colors.text.primary }]}>
        {words.map((word, index) => {
          // Skip whitespace
          if (word.trim().length === 0) {
            return <Text key={index}>{word}</Text>;
          }

          return (
            <Text
              key={index}
              onPress={() => handleWordPress(word)}
              style={styles.tappableWord}
            >
              {word}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.card }]}>
      {/* Header with Title */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={[styles.title, { color: colors.text.primary }]}>{reading.title}</Text>
            <Text style={[styles.reference, { color: colors.text.secondary }]}>{reading.reference}</Text>
          </View>
          {translationEnabled && (
            <View style={[styles.translationBadge, { backgroundColor: colors.primary.blue + '20' }]}>
              <Ionicons name="language" size={14} color={colors.primary.blue} />
              <Text style={[styles.translationBadgeText, { color: colors.primary.blue }]}>
                Tap words
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Combined Scripture + Translation Scrollable View */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* English Reading Section */}
        <View style={styles.readingSection}>
          <View style={styles.textContentWrapper}>
            {renderTappableText(reading.content)}
          </View>
        </View>

        {/* Translation Section - Only show if translation enabled */}
        {translationEnabled && (
          <>
            {/* Divider */}
            <View style={styles.divider}>
              <Ionicons name="arrow-down" size={20} color={colors.primary.blue} />
            </View>

            {/* Translation Content */}
            {translationLoading && (
              <LoadingState
                message={`Translating to ${preferredLanguage.toUpperCase()}...`}
                icon="language"
                size="md"
              />
            )}

            {translationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={32} color={colors.accent.red} />
                <Text style={[styles.errorText, { color: colors.accent.red }]}>
                  {translationError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary.blue }]}
                  onPress={loadTranslation}
                >
                  <Text style={[styles.retryButtonText, { color: colors.text.white }]}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {translation && !translationLoading && !translationError && (
              <View style={styles.translationSection}>
                <View style={[styles.textSectionHeader, { backgroundColor: colors.background.secondary }]}>
                  <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                    Translation
                  </Text>
                </View>
                <Text style={[styles.translationContent, { color: colors.text.primary }]}>
                  {translation.translatedText}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Scroll Indicator Arrow */}
      {canScrollDown && translationEnabled && (
        <View style={styles.scrollIndicator}>
          <Ionicons name="chevron-down" size={24} color={colors.primary.blue} />
        </View>
      )}

      {/* Practice Pronunciation Button */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.accent.orange }]}
        onPress={() => setShowPronunciationPractice(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="mic" size={20} color={colors.text.white} />
        <Text style={[styles.actionButtonText, { color: colors.text.white }]}>
          Practice Pronunciation
        </Text>
      </TouchableOpacity>

      {/* Word Translation Modal - Pass preferred language */}
      {selectedWord && translationEnabled && (
        <WordTranslation
          visible={showTranslation}
          word={selectedWord}
          onClose={() => setShowTranslation(false)}
          defaultTargetLang={preferredLanguage}
        />
      )}

      {/* Pronunciation Practice Modal */}
      <Modal
        visible={showPronunciationPractice}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPronunciationPractice(false)}
      >
        <PronunciationPractice
          text={reading.content}
          reference={reading.reference}
          onClose={() => setShowPronunciationPractice(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.card,
  },
  header: {
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  reference: {
    ...Typography.label,
    color: Colors.text.secondary,
  },
  translationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  translationBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    marginBottom: 0,
  },
  scrollViewContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    flexGrow: 1,
    flexDirection: 'column',
  },
  readingSection: {
    marginBottom: 0,
    marginTop: 0,
    flex: 1,
  },
  textContentWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  translationSection: {
    marginBottom: Spacing.sm,
  },
  textSectionHeader: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  sectionLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: 11,
  },
  content: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    lineHeight: 28,
  },
  translationContent: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  tappableWord: {
    // No additional styling - words look normal but are tappable
  },
  divider: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.sm,
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
    fontWeight: '600',
  },
  scrollIndicator: {
    alignItems: 'center',
    paddingVertical: 0,
    marginBottom: 0,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.button,
    fontWeight: '600',
    fontSize: 14,
  },
});