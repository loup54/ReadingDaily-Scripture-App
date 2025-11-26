/**
 * Word-Level Feedback Component
 * Phase D4: Pronunciation Feedback
 *
 * Visual word-by-word pronunciation feedback with color coding
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComparisonResult } from '@/services/speech/SpeechToTextService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

interface WordLevelFeedbackProps {
  comparison: ComparisonResult;
  expectedText: string;
}

export const WordLevelFeedback: React.FC<WordLevelFeedbackProps> = ({
  comparison,
  expectedText,
}) => {
  const { colors } = useTheme();

  // Calculate statistics
  const correctWords = comparison.differences.filter(d => d.matched).length;
  const incorrectWords = comparison.differences.filter(d => !d.matched && d.expected).length;
  const accuracyPercentage = Math.round(comparison.accuracy);

  // Determine overall feedback color
  const getFeedbackColor = () => {
    if (accuracyPercentage >= 90) return colors.accent.green;
    if (accuracyPercentage >= 75) return colors.primary.blue;
    if (accuracyPercentage >= 60) return colors.ui.warning;
    return colors.accent.red;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color={colors.primary.blue} />
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Word-Level Analysis
        </Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.accent.green}20` }]}>
            <Ionicons name="checkmark" size={20} color={colors.accent.green} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {correctWords}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Correct
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.accent.red}20` }]}>
            <Ionicons name="close" size={20} color={colors.accent.red} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {incorrectWords}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Incorrect
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: `${getFeedbackColor()}20` }]}>
            <Ionicons name="stats-chart" size={20} color={getFeedbackColor()} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={[styles.statValue, { color: colors.text.primary }]}>
              {accuracyPercentage}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Accuracy
            </Text>
          </View>
        </View>
      </View>

      {/* Word-by-Word Display */}
      <View style={styles.wordsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Word Breakdown
        </Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent.green }]} />
            <Text style={[styles.legendText, { color: colors.text.secondary }]}>
              Correct
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent.red }]} />
            <Text style={[styles.legendText, { color: colors.text.secondary }]}>
              Incorrect/Missing
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.wordsScrollView}
        >
          <View style={styles.wordsContainer}>
            {comparison.differences.map((diff, index) => {
              const isCorrect = diff.matched;
              const bgColor = isCorrect
                ? `${colors.accent.green}15`
                : `${colors.accent.red}15`;
              const borderColor = isCorrect ? colors.accent.green : colors.accent.red;
              const textColor = isCorrect ? colors.accent.green : colors.accent.red;

              return (
                <View
                  key={index}
                  style={[
                    styles.wordCard,
                    {
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                    },
                  ]}
                >
                  {/* Icon */}
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={textColor}
                    style={styles.wordIcon}
                  />

                  {/* Expected Word */}
                  <Text
                    style={[
                      styles.wordText,
                      {
                        color: textColor,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {diff.expected || '(missing)'}
                  </Text>

                  {/* Actual Word (if different) */}
                  {!isCorrect && diff.actual && (
                    <Text style={[styles.wordActual, { color: colors.text.secondary }]}>
                      → {diff.actual}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb" size={16} color={colors.ui.warning} />
          <Text style={[styles.tipTitle, { color: colors.text.primary }]}>
            Improvement Tips
          </Text>
        </View>
        <View style={styles.tipsList}>
          {incorrectWords > 0 && (
            <View style={styles.tipItem}>
              <Text style={[styles.tipBullet, { color: colors.text.secondary }]}>•</Text>
              <Text style={[styles.tipText, { color: colors.text.secondary }]}>
                Focus on words marked in red - these need more practice
              </Text>
            </View>
          )}
          <View style={styles.tipItem}>
            <Text style={[styles.tipBullet, { color: colors.text.secondary }]}>•</Text>
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Use the audio comparison to hear the correct pronunciation
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={[styles.tipBullet, { color: colors.text.secondary }]}>•</Text>
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Practice slowly first, then gradually increase your speed
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: {
    gap: 2,
  },
  statValue: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 11,
  },
  wordsSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...Typography.caption,
    fontSize: 12,
  },
  wordsScrollView: {
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  wordsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  wordCard: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
    gap: 2,
  },
  wordIcon: {
    marginBottom: 2,
  },
  wordText: {
    ...Typography.body,
    fontSize: 14,
  },
  wordActual: {
    ...Typography.caption,
    fontSize: 11,
  },
  tipsSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tipTitle: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
  },
  tipsList: {
    gap: Spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tipBullet: {
    ...Typography.body,
    fontSize: 16,
  },
  tipText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
