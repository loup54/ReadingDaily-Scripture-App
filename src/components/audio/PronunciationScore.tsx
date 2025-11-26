/**
 * Pronunciation Score Component
 * Phase D2: Pronunciation Comparison
 *
 * Component for displaying pronunciation analysis results
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import type { ComparisonResult, TranscriptionResult } from '@/services/speech/SpeechToTextService';
import { AudioComparison } from './AudioComparison';
import { WordLevelFeedback } from './WordLevelFeedback';

interface PronunciationScoreProps {
  score: number;
  feedback: string;
  transcription: TranscriptionResult;
  comparison: ComparisonResult;
  expectedText: string;
  userRecordingUri?: string;
}

export const PronunciationScore: React.FC<PronunciationScoreProps> = ({
  score,
  feedback,
  transcription,
  comparison,
  expectedText,
  userRecordingUri,
}) => {
  const { colors } = useTheme();

  // Determine score color based on percentage
  const getScoreColor = (score: number): string => {
    if (score >= 90) return colors.accent.green;
    if (score >= 75) return colors.primary.blue;
    if (score >= 60) return colors.ui.warning;
    return colors.accent.red;
  };

  // Determine score icon
  const getScoreIcon = (score: number): keyof typeof Ionicons.glyphMap => {
    if (score >= 90) return 'checkmark-circle';
    if (score >= 75) return 'thumbs-up';
    if (score >= 60) return 'information-circle';
    return 'close-circle';
  };

  const scoreColor = getScoreColor(score);
  const scoreIcon = getScoreIcon(score);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Score Display */}
      <View style={[styles.scoreCard, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.scoreHeader}>
          <Ionicons name={scoreIcon} size={48} color={scoreColor} />
          <View style={styles.scoreTextContainer}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {Math.round(score)}%
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.text.secondary }]}>
              Accuracy
            </Text>
          </View>
        </View>
        <Text style={[styles.feedback, { color: colors.text.primary }]}>
          {feedback}
        </Text>
      </View>

      {/* Transcription Results */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          What You Said
        </Text>
        <Text style={[styles.transcriptText, { color: colors.text.primary }]}>
          "{transcription.transcript || '(No speech detected)'}"
        </Text>
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceLabel, { color: colors.text.secondary }]}>
            Confidence:
          </Text>
          <Text style={[styles.confidenceValue, { color: colors.text.primary }]}>
            {Math.round(transcription.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Audio Comparison - Phase D4 */}
      {userRecordingUri && (
        <AudioComparison text={expectedText} userRecordingUri={userRecordingUri} />
      )}

      {/* Word-Level Feedback - Phase D4 */}
      <WordLevelFeedback comparison={comparison} expectedText={expectedText} />

      {/* Tips Section */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Tips for Improvement
        </Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Ionicons name="mic" size={20} color={colors.primary.blue} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Speak clearly and at a moderate pace
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="volume-high" size={20} color={colors.primary.blue} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Ensure you're in a quiet environment
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="refresh" size={20} color={colors.primary.blue} />
            <Text style={[styles.tipText, { color: colors.text.secondary }]}>
              Practice multiple times to improve your score
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  scoreCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoreTextContainer: {
    flex: 1,
  },
  scoreValue: {
    ...Typography.displayMedium,
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    ...Typography.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  feedback: {
    ...Typography.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  transcriptText: {
    ...Typography.body,
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  confidenceLabel: {
    ...Typography.caption,
  },
  confidenceValue: {
    ...Typography.caption,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    ...Typography.displayMedium,
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.caption,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  wordChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  wordText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  wordSubtext: {
    ...Typography.caption,
    fontSize: 10,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tipText: {
    ...Typography.body,
    flex: 1,
  },
});
