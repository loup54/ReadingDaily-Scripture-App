/**
 * Scripture Text with Highlighting Component
 * Renders scripture text with word-level highlighting during audio playback
 * Extends ScriptureText with audioHighlighting features
 *
 * Phase 2: Display Highlighting on Screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Reading } from '@/types/reading.types';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { useTranslationStore } from '@/stores/useTranslationStore';
import { useWordHighlightingState } from '@/hooks/useWordHighlighting';
import { WordTranslation, FullTextTranslation } from '@/components/translation';
import { PronunciationPractice } from '@/screens/PronunciationPractice';

interface ScriptureTextWithHighlightingProps {
  reading: Reading;
}

/**
 * ScriptureTextWithHighlighting Component
 * Same as ScriptureText but with word-level highlighting during audio playback
 */
export const ScriptureTextWithHighlighting: React.FC<ScriptureTextWithHighlightingProps> = ({ reading }) => {
  const { colors } = useTheme();
  const { enabled: translationEnabled, preferredLanguage, loadSettings } = useTranslationStore();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showFullTextTranslation, setShowFullTextTranslation] = useState(false);
  const [showPronunciationPractice, setShowPronunciationPractice] = useState(false);

  // Get highlighting state from hook (read-only, subscribes to highlighting service)
  const highlightingState = useWordHighlightingState(
    reading.id,
    reading.type as 'gospel' | 'first-reading' | 'psalm' | 'second-reading'
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const handleWordPress = (word: string) => {
    // Clean the word (remove punctuation)
    const cleanedWord = word.replace(/[^\w\s]/g, '').trim();
    if (cleanedWord.length > 0) {
      setSelectedWord(cleanedWord);
      setShowTranslation(true);
    }
  };

  // Split reading content into [word, space, word, space, ...] tokens once
  const contentTokens = React.useMemo(
    () => reading.content.split(/(\s+)/),
    [reading.content]
  );

  // Pre-compute the character start offset of each token within reading.content.
  // Used to match timing data charOffset → correct token (robust against word-count mismatches).
  const tokenStartOffsets = React.useMemo(() => {
    let pos = 0;
    return contentTokens.map((token) => {
      const start = pos;
      pos += token.length;
      return start;
    });
  }, [contentTokens]);

  // Build lookup: normalised word text → sorted token indices, computed once per reading.
  // Used as fallback when charOffset doesn't land exactly on a token (TTS preprocessing drift).
  const wordTextToTokenIndices = React.useMemo(() => {
    const map = new Map<string, number[]>();
    contentTokens.forEach((token, idx) => {
      if (token.trim().length === 0) return;
      const key = token.replace(/[^\w]/g, '').toLowerCase();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(idx);
    });
    return map;
  }, [contentTokens]);

  // Resolve which token index to highlight for the current timing word.
  // Step 1: exact charOffset match. Step 2: nearest token by word-text match.
  const currentTokenIdx = React.useMemo(() => {
    if (!highlightingState?.currentWord) return -1;
    const { word, charOffset } = highlightingState.currentWord;

    // Step 1: does charOffset land inside a non-whitespace token?
    for (let i = 0; i < contentTokens.length; i++) {
      const token = contentTokens[i];
      if (token.trim().length === 0) continue;
      const start = tokenStartOffsets[i];
      if (charOffset >= start && charOffset < start + token.length) return i;
    }

    // Step 2: fuzzy — find token whose text matches `word`, closest to charOffset
    const key = word.replace(/[^\w]/g, '').toLowerCase();
    const candidates = wordTextToTokenIndices.get(key);
    if (!candidates || candidates.length === 0) return -1;

    let bestIdx = candidates[0];
    let bestDist = Math.abs(tokenStartOffsets[candidates[0]] - charOffset);
    for (const ci of candidates) {
      const dist = Math.abs(tokenStartOffsets[ci] - charOffset);
      if (dist < bestDist) { bestDist = dist; bestIdx = ci; }
    }
    return bestIdx;
  }, [highlightingState?.currentWord, contentTokens, tokenStartOffsets, wordTextToTokenIndices]);

  const isHighlightingActive = currentTokenIdx >= 0;

  /**
   * Render highlighted text during audio playback.
   * Uses charOffset from timing data to find the correct token — robust against
   * word-count mismatches between TTS generator and component tokenisation.
   */
  const renderContent = () => {
    return (
      <View style={styles.wordsContainer}>
        {contentTokens.map((token, tokenIdx) => {
          if (token.trim().length === 0) {
            return <Text key={tokenIdx} style={[styles.content, { color: colors.text.primary }]} allowFontScaling={false}>{token}</Text>;
          }
          const isCurrent = isHighlightingActive && tokenIdx === currentTokenIdx;
          return (
            <Text
              key={tokenIdx}
              onPress={translationEnabled ? () => handleWordPress(token) : undefined}
              style={[
                styles.content,
                styles.tappableWord,
                {
                  color: isCurrent ? colors.text.white : colors.text.primary,
                  backgroundColor: isCurrent ? colors.primary.blue : 'transparent',
                },
              ]}
              allowFontScaling={false}
            >
              {token}
            </Text>
          );
        })}
      </View>
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

      {/* Scripture Content - With/Without Highlighting */}
      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background.card }]} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Translate Full Text Button - Only show if translation is enabled */}
        {translationEnabled && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary.blue }]}
            onPress={() => setShowFullTextTranslation(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={20} color={colors.text.white} />
            <Text style={[styles.actionButtonText, { color: colors.text.white }]}>
              Translate
            </Text>
          </TouchableOpacity>
        )}

        {/* Practice Pronunciation Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent.orange }]}
          onPress={() => setShowPronunciationPractice(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="mic" size={20} color={colors.text.white} />
          <Text style={[styles.actionButtonText, { color: colors.text.white }]}>
            Practice
          </Text>
        </TouchableOpacity>
      </View>

      {/* Word Translation Modal - Pass preferred language */}
      {selectedWord && translationEnabled && (
        <WordTranslation
          visible={showTranslation}
          word={selectedWord}
          onClose={() => setShowTranslation(false)}
          defaultTargetLang={preferredLanguage}
        />
      )}

      {/* Full Text Translation Modal - Pass preferred language */}
      {translationEnabled && (
        <FullTextTranslation
          visible={showFullTextTranslation}
          title={reading.title}
          reference={reading.reference}
          text={reading.content}
          onClose={() => setShowFullTextTranslation(false)}
          defaultTargetLang={preferredLanguage}
        />
      )}

      {/* Pronunciation Practice Modal — only mount when opened */}
      {showPronunciationPractice && (
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
      )}
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
    marginBottom: Spacing.xs,
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
  },
  content: {
    ...Typography.bodyLarge,
    color: Colors.text.primary,
    lineHeight: 28,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  tappableWord: {
    // No additional styling - words look normal but are tappable
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    ...Typography.button,
    fontWeight: '600',
    fontSize: 14,
  },
});
