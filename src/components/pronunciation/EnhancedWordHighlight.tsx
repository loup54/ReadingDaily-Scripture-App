/**
 * EnhancedWordHighlight Component
 * Phase D4: Pronunciation Feedback
 *
 * Displays word-level pronunciation assessment with:
 * - Color-coded accuracy highlighting
 * - Expandable error details
 * - Error type icons and descriptions
 * - Phoneme preview (if available)
 * - Pronunciation tips
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WordAssessment } from '@/types/practice.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface EnhancedWordHighlightProps {
  words: WordAssessment[];
  onWordTap?: (word: WordAssessment, index: number) => void;
  interactive?: boolean;
}

export const EnhancedWordHighlight: React.FC<EnhancedWordHighlightProps> = ({
  words,
  onWordTap,
  interactive = true,
}) => {
  const [selectedWord, setSelectedWord] = useState<WordAssessment | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.accent.green;
    if (score >= 60) return Colors.ui.warning;
    return Colors.accent.red;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Practice';
  };

  const getErrorTypeIcon = (errorType: string): keyof typeof Ionicons.glyphMap => {
    switch (errorType) {
      case 'Mispronunciation':
        return 'alert-circle';
      case 'Omission':
        return 'remove-circle';
      case 'Insertion':
        return 'add-circle';
      case 'UnexpectedBreak':
        return 'pause-circle';
      case 'MissingBreak':
        return 'play-skip-forward';
      default:
        return 'checkmark-circle';
    }
  };

  const getErrorTypeLabel = (errorType: string): string => {
    switch (errorType) {
      case 'Mispronunciation':
        return 'Mispronounced';
      case 'Omission':
        return 'Word Omitted';
      case 'Insertion':
        return 'Extra Word';
      case 'UnexpectedBreak':
        return 'Unexpected Pause';
      case 'MissingBreak':
        return 'Missing Pause';
      default:
        return 'Correct';
    }
  };

  const getErrorTypeDescription = (errorType: string): string => {
    switch (errorType) {
      case 'Mispronunciation':
        return 'This word was pronounced differently than expected. Listen to the reference pronunciation and practice the specific sounds.';
      case 'Omission':
        return 'This word was not pronounced. Make sure to include all words in the text.';
      case 'Insertion':
        return 'You said an extra word that was not in the original text. Re-read carefully before speaking.';
      case 'UnexpectedBreak':
        return 'You paused unexpectedly. Try to maintain a steady flow without breaks in the middle of phrases.';
      case 'MissingBreak':
        return 'You missed a natural pause. Practice grouping words into phrases with appropriate breaks.';
      default:
        return 'Correct pronunciation!';
    }
  };

  const getImprovementTip = (word: WordAssessment): string => {
    if (word.errorType === 'None') {
      return 'Good job! Keep practicing to maintain consistency.';
    }

    if (word.accuracyScore >= 70) {
      return 'Almost there! Focus on the exact sound of each phoneme.';
    }

    if (word.accuracyScore >= 50) {
      return 'Listen carefully to native speakers pronouncing this word.';
    }

    return 'Try breaking this word into individual sounds and practice each one.';
  };

  const handleWordPress = (word: WordAssessment, index: number) => {
    if (!interactive) return;

    setSelectedWord(word);
    setSelectedIndex(index);

    if (onWordTap) {
      onWordTap(word, index);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="text" size={20} color={Colors.primary.blue} />
        <Text style={styles.title}>Word-by-Word Analysis</Text>
      </View>

      {/* Word Chips */}
      <View style={styles.wordsContainer}>
        {words.map((word, index) => {
          const isError = word.errorType !== 'None';
          const wordColor = isError ? Colors.accent.red : getScoreColor(word.accuracyScore);
          const backgroundColor = isError
            ? `${Colors.accent.red}15`
            : `${wordColor}15`;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.wordChip,
                {
                  backgroundColor,
                  borderColor: wordColor,
                },
              ]}
              onPress={() => handleWordPress(word, index)}
              activeOpacity={interactive ? 0.7 : 1}
            >
              {isError && (
                <Ionicons
                  name={getErrorTypeIcon(word.errorType)}
                  size={14}
                  color={Colors.accent.red}
                  style={styles.errorIcon}
                />
              )}
              <Text
                style={[
                  styles.wordText,
                  { color: wordColor },
                ]}
              >
                {word.word}
              </Text>
              <Text
                style={[
                  styles.scoreText,
                  { color: wordColor },
                ]}
              >
                {Math.round(word.accuracyScore)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.accent.green }]} />
          <Text style={styles.legendText}>80+ (Excellent)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.ui.warning }]} />
          <Text style={styles.legendText}>60-79 (Fair)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.accent.red }]} />
          <Text style={styles.legendText}>{'<60'} (Needs Work)</Text>
        </View>
      </View>

      {/* Word Details Modal */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedWord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, Shadows.lg]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedWord && (
                <>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedWord(null)}
                    >
                      <Ionicons name="close" size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Word Details</Text>
                    <View style={{ width: 40 }} />
                  </View>

                  {/* Word Display */}
                  <View style={styles.wordDetailContainer}>
                    <Text style={styles.wordDetail}>{selectedWord.word}</Text>
                    <Text style={styles.accuracyLabel}>
                      {getScoreLabel(selectedWord.accuracyScore)}
                    </Text>
                  </View>

                  {/* Score Circle */}
                  <View style={styles.scoreCircleContainer}>
                    <View
                      style={[
                        styles.scoreCircle,
                        {
                          backgroundColor: `${getScoreColor(
                            selectedWord.accuracyScore
                          )}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scoreCircleText,
                          {
                            color: getScoreColor(
                              selectedWord.accuracyScore
                            ),
                          },
                        ]}
                      >
                        {Math.round(selectedWord.accuracyScore)}%
                      </Text>
                    </View>
                  </View>

                  {/* Error Information */}
                  {selectedWord.errorType !== 'None' && (
                    <View
                      style={[
                        styles.errorInfoCard,
                        Shadows.sm,
                      ]}
                    >
                      <View style={styles.errorHeader}>
                        <Ionicons
                          name={getErrorTypeIcon(selectedWord.errorType)}
                          size={24}
                          color={Colors.accent.red}
                        />
                        <Text style={styles.errorTypeLabel}>
                          {getErrorTypeLabel(selectedWord.errorType)}
                        </Text>
                      </View>
                      <Text style={styles.errorDescription}>
                        {getErrorTypeDescription(selectedWord.errorType)}
                      </Text>
                    </View>
                  )}

                  {/* Phoneme Breakdown */}
                  {selectedWord.phonemes && selectedWord.phonemes.length > 0 && (
                    <View style={styles.phonemeSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="mic" size={18} color={Colors.primary.blue} />
                        <Text style={styles.sectionTitle}>Phonemes in This Word</Text>
                      </View>
                      <View style={styles.phonemeList}>
                        {selectedWord.phonemes.map((phoneme, idx) => {
                          const phonemeColor = getScoreColor(phoneme.accuracyScore);
                          const phonemeLabel = phoneme.phoneme.replace(/\//g, '');

                          return (
                            <View key={idx} style={styles.phonemeItemSmall}>
                              <View
                                style={[
                                  styles.phonemeLabelSmall,
                                  { backgroundColor: `${phonemeColor}20` },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.phonemeLabelTextSmall,
                                    { color: phonemeColor },
                                  ]}
                                >
                                  {phonemeLabel}
                                </Text>
                              </View>
                              <View style={styles.phonemeScoreBarSmall}>
                                <View
                                  style={[
                                    styles.phonemeScoreBarFillSmall,
                                    {
                                      width: `${phoneme.accuracyScore}%`,
                                      backgroundColor: phonemeColor,
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.phonemeScoreSmall}>
                                {Math.round(phoneme.accuracyScore)}%
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Improvement Tip */}
                  <View style={[styles.tipCard, Shadows.sm]}>
                    <View style={styles.tipHeader}>
                      <Ionicons name="bulb" size={18} color={Colors.text.secondary} />
                      <Text style={styles.tipTitle}>Improvement Tip</Text>
                    </View>
                    <Text style={styles.tipText}>{getImprovementTip(selectedWord)}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={() => {
                        setSelectedWord(null);
                        // Could add navigation to audio comparison here
                      }}
                    >
                      <Ionicons name="play-circle" size={20} color={Colors.text.white} />
                      <Text style={styles.buttonText}>Listen to Pronunciation</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={() => setSelectedWord(null)}
                    >
                      <Text style={styles.buttonTextSecondary}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.xs,
  },
  errorIcon: {
    marginRight: Spacing.xs / 2,
  },
  wordText: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
  scoreText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  legendContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay + '90',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  wordDetailContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  wordDetail: {
    ...Typography.h1,
    fontSize: 40,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  accuracyLabel: {
    ...Typography.h3,
    color: Colors.text.secondary,
  },
  scoreCircleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircleText: {
    ...Typography.h2,
    fontWeight: 'bold',
    fontSize: 28,
  },
  errorInfoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.red,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  errorTypeLabel: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.red,
  },
  errorDescription: {
    ...Typography.body,
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  phonemeSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  phonemeList: {
    gap: Spacing.sm,
  },
  phonemeItemSmall: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  phonemeLabelSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  phonemeLabelTextSmall: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 14,
  },
  phonemeScoreBarSmall: {
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  phonemeScoreBarFillSmall: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  phonemeScoreSmall: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tipCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  tipText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary.blue,
  },
  secondaryButton: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.text.tertiary,
  },
  buttonText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonTextSecondary: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
