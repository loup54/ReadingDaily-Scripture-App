/**
 * FreeTierFeedback Component
 *
 * Limited feedback view for free tier users showing:
 * - Overall score with grade
 * - General guidance message
 * - Upgrade prompt to unlock full analysis
 *
 * Hides: Word-level, Phoneme, Prosody, Audio comparison tabs
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PronunciationResult } from '@/types/practice.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface FreeTierFeedbackProps {
  result: PronunciationResult;
  onUpgradePress?: () => void;
}

export const FreeTierFeedback: React.FC<FreeTierFeedbackProps> = ({
  result,
  onUpgradePress,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return Colors.accent.green;
    if (score >= 60) return Colors.ui.warning;
    return Colors.accent.red;
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Practice';
  };

  const getGuidanceMessage = (score: number): string => {
    if (score >= 80) {
      return 'Great pronunciation! Keep practicing to maintain consistency.';
    }
    if (score >= 70) {
      return 'Good effort! Focus on clarity and rhythm in your speech.';
    }
    if (score >= 60) {
      return 'You\'re on the right track. Work on pronunciation accuracy.';
    }
    return 'Keep practicing! Pay attention to each word\'s pronunciation.';
  };

  const scoreColor = getScoreColor(result.scores.overallScore);
  const scoreGrade = getScoreGrade(result.scores.overallScore);
  const guidanceMessage = getGuidanceMessage(result.scores.overallScore);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Overall Score Card */}
      <View style={[styles.scoreCard, Shadows.lg]}>
        <LinearGradient
          colors={[scoreColor, scoreColor + '80']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreGradient}
        >
          <Text style={styles.scoreValue}>
            {Math.round(result.scores.overallScore)}
          </Text>
          <Text style={styles.scoreGrade}>{scoreGrade}</Text>
        </LinearGradient>
      </View>

      {/* Guidance Section */}
      <View style={[styles.guidanceCard, Shadows.sm]}>
        <View style={styles.guidanceHeader}>
          <Ionicons
            name="bulb-outline"
            size={24}
            color={Colors.ui.warning}
            style={styles.guidanceIcon}
          />
          <Text style={styles.guidanceTitle}>General Feedback</Text>
        </View>
        <Text style={styles.guidanceText}>{guidanceMessage}</Text>
      </View>

      {/* Feature Preview */}
      <View style={[styles.featureCard, Shadows.sm]}>
        <Text style={styles.featureTitle}>Unlock Detailed Analysis</Text>
        <Text style={styles.featureSubtitle}>
          Upgrade to Basic to see:
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons
              name="lock-closed"
              size={16}
              color={Colors.text.secondary}
            />
            <Text style={styles.featureItemText}>
              Word-level accuracy breakdown
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons
              name="lock-closed"
              size={16}
              color={Colors.text.secondary}
            />
            <Text style={styles.featureItemText}>
              Phoneme-by-phoneme analysis
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons
              name="lock-closed"
              size={16}
              color={Colors.text.secondary}
            />
            <Text style={styles.featureItemText}>
              Prosody and rhythm feedback
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons
              name="lock-closed"
              size={16}
              color={Colors.text.secondary}
            />
            <Text style={styles.featureItemText}>
              Audio comparison with native speaker
            </Text>
          </View>
        </View>
      </View>

      {/* Upgrade Button */}
      <View style={styles.upgradeSection}>
        <TouchableOpacity
          style={[styles.upgradeButton, Shadows.md]}
          onPress={onUpgradePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.accent.green, Colors.accent.green + 'CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeGradient}
          >
            <Ionicons
              name="star"
              size={20}
              color={Colors.text.white}
              style={styles.upgradeIcon}
            />
            <Text style={styles.upgradeButtonText}>
              Upgrade to Basic - $2.99/month
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.upgradeNote}>
          30-day free trial. Cancel anytime. No commitment.
        </Text>
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  scoreCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  scoreGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  scoreValue: {
    ...Typography.h1,
    fontSize: 64,
    color: Colors.text.white,
    fontWeight: 'bold',
  },
  scoreGrade: {
    ...Typography.h3,
    color: Colors.text.white,
    marginTop: Spacing.sm,
  },
  guidanceCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.ui.warning,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  guidanceIcon: {
    marginRight: Spacing.md,
  },
  guidanceTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    flex: 1,
  },
  guidanceText: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  featureCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
  },
  featureTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  featureSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontSize: 13,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureItemText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  upgradeSection: {
    marginBottom: Spacing.lg,
  },
  upgradeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  upgradeGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  upgradeIcon: {
    marginRight: Spacing.sm,
  },
  upgradeButtonText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
    fontSize: 15,
  },
  upgradeNote: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontSize: 12,
  },
  spacer: {
    height: Spacing.xl,
  },
});
