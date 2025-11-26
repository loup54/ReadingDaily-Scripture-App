/**
 * PhonemeBreakdown Component
 * Phase D4: Pronunciation Feedback
 *
 * Displays phoneme-level pronunciation assessment with:
 * - Expandable word-to-phoneme hierarchy
 * - Individual phoneme scores
 * - Color-coded accuracy
 * - Pronunciation tips
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WordAssessment } from '@/types/practice.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface PhonemeBreakdownProps {
  words: WordAssessment[];
  expanded?: boolean;
}

interface ExpandedWord {
  [key: number]: boolean;
}

export const PhonemeBreakdown: React.FC<PhonemeBreakdownProps> = ({
  words,
  expanded = false,
}) => {
  const [expandedWords, setExpandedWords] = useState<ExpandedWord>(
    expanded ? Object.fromEntries(words.map((_, i) => [i, true])) : {}
  );

  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.accent.green;
    if (score >= 60) return Colors.ui.warning;
    return Colors.accent.red;
  };

  const getPhonemeLabel = (phoneme: string): string => {
    // Remove slashes if present (e.g., /ə/ → ə)
    return phoneme.replace(/\//g, '');
  };

  const toggleWordExpansion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Filter words that have phoneme data
  const wordsWithPhonemes = words.filter((w) => w.phonemes && w.phonemes.length > 0);

  if (wordsWithPhonemes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.text.tertiary} />
        <Text style={styles.emptyText}>No phoneme data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mic" size={20} color={Colors.primary.blue} />
        <Text style={styles.title}>Phoneme Analysis</Text>
        <Text style={styles.subtitle}>({wordsWithPhonemes.length} words analyzed)</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {wordsWithPhonemes.map((word, wordIndex) => {
          const isExpanded = expandedWords[wordIndex];
          const wordColor = getScoreColor(word.accuracyScore);

          return (
            <View key={wordIndex} style={styles.wordSection}>
              {/* Word Header */}
              <TouchableOpacity
                style={[styles.wordHeader, { borderLeftColor: wordColor }]}
                onPress={() => toggleWordExpansion(wordIndex)}
                activeOpacity={0.7}
              >
                <View style={styles.wordInfo}>
                  <Text
                    style={[styles.wordText, { color: wordColor }]}
                    numberOfLines={1}
                  >
                    {word.word}
                  </Text>
                  <Text style={styles.wordScore}>
                    {Math.round(word.accuracyScore)}%
                  </Text>
                </View>

                <View style={styles.phonemeCount}>
                  <Text style={styles.phonemeCountText}>
                    {word.phonemes?.length || 0} phonemes
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.text.secondary}
                  />
                </View>
              </TouchableOpacity>

              {/* Phoneme Details */}
              {isExpanded && word.phonemes && word.phonemes.length > 0 && (
                <View style={styles.phonemeContainer}>
                  {word.phonemes.map((phoneme, phonemeIndex) => {
                    const phonemeColor = getScoreColor(phoneme.accuracyScore);
                    const phonemeLabel = getPhonemeLabel(phoneme.phoneme);

                    return (
                      <View key={phonemeIndex} style={styles.phonemeItem}>
                        {/* Phoneme Label & Score */}
                        <View style={styles.phonemeHeader}>
                          <View
                            style={[
                              styles.phonemeLabel,
                              { backgroundColor: `${phonemeColor}20` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.phonemeLabelText,
                                { color: phonemeColor },
                              ]}
                            >
                              {phonemeLabel}
                            </Text>
                          </View>

                          <View style={styles.phonemeScoreContainer}>
                            <View
                              style={[
                                styles.scoreCircle,
                                { backgroundColor: `${phonemeColor}20` },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.scoreText,
                                  { color: phonemeColor },
                                ]}
                              >
                                {Math.round(phoneme.accuracyScore)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Score Bar */}
                        <View style={styles.scoreBar}>
                          <View
                            style={[
                              styles.scoreBarFill,
                              {
                                width: `${phoneme.accuracyScore}%`,
                                backgroundColor: phonemeColor,
                              },
                            ]}
                          />
                        </View>

                        {/* Status Indicator */}
                        <View style={styles.statusContainer}>
                          {phoneme.accuracyScore >= 80 ? (
                            <View style={styles.statusGood}>
                              <Ionicons name="checkmark-circle" size={14} color={Colors.accent.green} />
                              <Text style={styles.statusText}>Correct</Text>
                            </View>
                          ) : phoneme.accuracyScore >= 60 ? (
                            <View style={styles.statusFair}>
                              <Ionicons name="alert-circle" size={14} color={Colors.ui.warning} />
                              <Text style={styles.statusText}>Fair</Text>
                            </View>
                          ) : (
                            <View style={styles.statusPoor}>
                              <Ionicons name="close-circle" size={14} color={Colors.accent.red} />
                              <Text style={styles.statusText}>Needs Work</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* Word-Level Tips */}
                  <View style={styles.tipsContainer}>
                    <Ionicons name="bulb-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.tipsText}>
                      Focus on phonemes with lower scores for improvement
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  subtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  wordSection: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderLeftWidth: 4,
  },
  wordInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  wordText: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  wordScore: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  phonemeCount: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  phonemeCountText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  phonemeContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  phonemeItem: {
    gap: Spacing.sm,
  },
  phonemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  phonemeLabel: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  phonemeLabelText: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 16,
  },
  phonemeScoreContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    ...Typography.caption,
    fontWeight: 'bold',
    fontSize: 14,
  },
  scoreBar: {
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusGood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusFair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusPoor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
  },
  tipsText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    flex: 1,
    fontSize: 12,
  },
});
