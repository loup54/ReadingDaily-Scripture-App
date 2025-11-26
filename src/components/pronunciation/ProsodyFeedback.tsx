/**
 * ProsodyFeedback Component
 * Phase D4: Pronunciation Feedback
 *
 * Displays prosody (rhythm, stress, intonation) feedback with:
 * - Visual prosody score
 * - Specific improvement areas
 * - Actionable tips
 * - Examples and guidance
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface ProsodyFeedbackProps {
  prosodyScore: number;
  completenessScore?: number;
  fluencyScore?: number;
}

export const ProsodyFeedback: React.FC<ProsodyFeedbackProps> = ({
  prosodyScore,
  completenessScore = 0,
  fluencyScore = 0,
}) => {
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

  const getProsodyTips = (score: number): string[] => {
    const tips: string[] = [];

    if (score < 60) {
      tips.push('Pay attention to word stress and emphasis');
      tips.push('Practice grouping words into natural phrases');
      tips.push('Listen to native speakers for intonation patterns');
    } else if (score < 75) {
      tips.push('Work on consistent pacing and rhythm');
      tips.push('Practice primary and secondary word stress');
      tips.push('Record yourself and compare with native pronunciation');
    } else if (score < 85) {
      tips.push('Fine-tune intonation for questions vs statements');
      tips.push('Practice subtle stress variations');
      tips.push('Focus on connected speech and linking');
    } else {
      tips.push('Excellent prosody! Keep practicing for mastery');
      tips.push('Try challenging texts to further improve');
    }

    return tips;
  };

  const prosodyColor = getScoreColor(prosodyScore);
  const tips = getProsodyTips(prosodyScore);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={20} color={Colors.primary.blue} />
        <Text style={styles.title}>Prosody & Rhythm</Text>
      </View>

      {/* Score Card */}
      <View style={[styles.scoreCard, Shadows.md]}>
        <LinearGradient
          colors={[prosodyColor, `${prosodyColor}80`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreGradient}
        >
          <View style={styles.scoreContent}>
            <Text style={styles.scoreValue}>{Math.round(prosodyScore)}</Text>
            <Text style={styles.scoreLabel}>{getScoreLabel(prosodyScore)}</Text>
          </View>

          {/* Visual Indicators */}
          <View style={styles.indicators}>
            <View style={styles.indicator}>
              <Text style={styles.indicatorLabel}>Rhythm</Text>
              <View style={[styles.dotContainer, { opacity: fluencyScore / 100 }]}>
                <View style={[styles.dot, { backgroundColor: Colors.text.white }]} />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.indicator}>
              <Text style={styles.indicatorLabel}>Stress</Text>
              <View style={[styles.dotContainer, { opacity: (prosodyScore * 0.9) / 100 }]}>
                <View style={[styles.dot, { backgroundColor: Colors.text.white }]} />
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.indicator}>
              <Text style={styles.indicatorLabel}>Intonation</Text>
              <View style={[styles.dotContainer, { opacity: (prosodyScore * 0.8) / 100 }]}>
                <View style={[styles.dot, { backgroundColor: Colors.text.white }]} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Detailed Feedback */}
      {prosodyScore < 70 && (
        <View style={[styles.detailedCard, { borderLeftColor: Colors.accent.red }]}>
          <View style={styles.detailedHeader}>
            <Ionicons name="alert-circle" size={18} color={Colors.accent.red} />
            <Text style={[styles.detailedTitle, { color: Colors.accent.red }]}>
              Areas to Improve
            </Text>
          </View>
          <Text style={styles.detailedText}>
            Your rhythm and stress patterns need work. Focus on:
          </Text>
          <Text style={styles.improvementText}>
            • Speaking at a natural, consistent pace{'\n'}
            • Emphasizing important words{'\n'}
            • Using rising intonation for questions{'\n'}
            • Grouping words naturally into phrases
          </Text>
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb" size={18} color={Colors.text.secondary} />
          <Text style={styles.tipsTitle}>Improvement Tips</Text>
        </View>
        <View style={styles.tipsList}>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={[styles.tipNumber, { backgroundColor: prosodyColor + '30' }]}>
                <Text style={[styles.tipNumberText, { color: prosodyColor }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Learning Resources */}
      <View style={styles.resourcesCard}>
        <Text style={styles.resourcesTitle}>How to Improve Prosody:</Text>
        <View style={styles.resourceItem}>
          <Ionicons name="play-circle" size={16} color={Colors.primary.blue} />
          <Text style={styles.resourceText}>
            Listen to native speakers and shadow them
          </Text>
        </View>
        <View style={styles.resourceItem}>
          <Ionicons name="mic-circle" size={16} color={Colors.primary.blue} />
          <Text style={styles.resourceText}>
            Record yourself and compare with the model pronunciation
          </Text>
        </View>
        <View style={styles.resourceItem}>
          <Ionicons name="book" size={16} color={Colors.primary.blue} />
          <Text style={styles.resourceText}>
            Practice with texts that show stress and intonation marks
          </Text>
        </View>
        <View style={styles.resourceItem}>
          <Ionicons name="musical-notes" size={16} color={Colors.primary.blue} />
          <Text style={styles.resourceText}>
            Use rhythm and music to internalize patterns
          </Text>
        </View>
      </View>
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
  scoreCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  scoreGradient: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  scoreContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreValue: {
    ...Typography.h1,
    fontSize: 48,
    color: Colors.text.white,
    fontWeight: 'bold',
  },
  scoreLabel: {
    ...Typography.h3,
    color: Colors.text.white,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.text.white + '30',
  },
  indicator: {
    alignItems: 'center',
    flex: 1,
  },
  indicatorLabel: {
    ...Typography.caption,
    color: Colors.text.white,
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  dotContainer: {
    height: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.text.white + '20',
  },
  detailedCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailedTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
  },
  detailedText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  improvementText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontSize: 13,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs / 2,
  },
  tipNumberText: {
    ...Typography.caption,
    fontWeight: 'bold',
    fontSize: 12,
  },
  tipText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  resourcesCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  resourcesTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  resourceText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
