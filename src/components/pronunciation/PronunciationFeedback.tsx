/**
 * PronunciationFeedback Component
 *
 * Comprehensive pronunciation assessment display with:
 * - Overall score with visual indicator
 * - 4 dimension scores (accuracy, fluency, completeness, prosody)
 * - Enhanced word-level assessment with detailed error info
 * - Phoneme-level breakdown
 * - Prosody feedback with improvement tips
 * - Audio comparison (TTS vs user recording)
 * - Recognized text vs reference text comparison
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PronunciationResult, WordAssessment } from '@/types/practice.types';
import { SubscriptionTier } from '@/types/subscription.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { EnhancedWordHighlight } from './EnhancedWordHighlight';
import { PhonemeBreakdown } from './PhonemeBreakdown';
import { ProsodyFeedback } from './ProsodyFeedback';
import { AudioComparison } from '../audio/AudioComparison';
import { FreeTierFeedback } from './FreeTierFeedback';
import { analyticsService } from '@/services/analytics/AnalyticsService';

interface PronunciationFeedbackProps {
  result: PronunciationResult;
  referenceText: string;
  recordedAudioUri?: string; // For audio comparison
  subscriptionTier?: SubscriptionTier; // NEW: Defaults to 'free' for feature gating
  onUpgradePress?: () => void; // NEW: Callback when user taps upgrade button
}

type FeedbackTab = 'overview' | 'words' | 'phonemes' | 'prosody' | 'audio';

export const PronunciationFeedback: React.FC<PronunciationFeedbackProps> = ({
  result,
  referenceText,
  recordedAudioUri,
  subscriptionTier = 'free', // NEW: Default to free tier
  onUpgradePress,
}) => {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('overview');

  // NEW: Show limited feedback for free tier users
  if (subscriptionTier === 'free') {
    return (
      <FreeTierFeedback
        result={result}
        onUpgradePress={onUpgradePress}
      />
    );
  }

  // NEW: Available tabs based on subscription tier
  const availableTabs: FeedbackTab[] = subscriptionTier === 'basic'
    ? ['overview', 'words', 'phonemes', 'prosody', 'audio']
    : ['overview'];

  // Log when tab is accessed
  const handleTabChange = (tab: FeedbackTab) => {
    setActiveTab(tab);
    analyticsService.logFeatureAccessed({
      featureName: `feedback_tab_${tab}`,
      subscriptionTier,
      wasLocked: false,
      accessGranted: true,
    });
  };

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

  const renderScoreDimension = (
    label: string,
    score: number,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={styles.dimensionContainer}>
      <View style={styles.dimensionHeader}>
        <Ionicons name={icon} size={20} color={Colors.text.secondary} />
        <Text style={styles.dimensionLabel}>{label}</Text>
      </View>
      <View style={styles.dimensionBar}>
        <View
          style={[
            styles.dimensionBarFill,
            {
              width: `${score}%`,
              backgroundColor: getScoreColor(score),
            },
          ]}
        />
      </View>
      <Text style={styles.dimensionScore}>{Math.round(score)}</Text>
    </View>
  );

  const renderWordAssessment = (word: WordAssessment, index: number) => {
    const isError = word.errorType !== 'None';
    const wordColor = isError ? Colors.accent.red : getScoreColor(word.accuracyScore);

    return (
      <View
        key={index}
        style={[
          styles.wordContainer,
          isError && styles.wordError,
          { borderColor: wordColor },
        ]}
      >
        <Text
          style={[
            styles.wordText,
            { color: wordColor },
          ]}
        >
          {word.word}
        </Text>
        {isError && (
          <Ionicons
            name={getErrorTypeIcon(word.errorType)}
            size={12}
            color={Colors.accent.red}
            style={styles.wordErrorIcon}
          />
        )}
        <Text style={styles.wordScore}>{Math.round(word.accuracyScore)}</Text>
      </View>
    );
  };

  // Determine which feedback sections to show based on data
  const hasWords = result.words && result.words.length > 0;
  const hasPhonemes = hasWords && result.words.some(w => w.phonemes && w.phonemes.length > 0);

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
            {/* Overall Score Card */}
            <View style={[styles.scoreCard, Shadows.lg]}>
              <LinearGradient
                colors={[
                  getScoreColor(result.scores.overallScore),
                  getScoreColor(result.scores.overallScore) + '80',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreValue}>
                  {Math.round(result.scores.overallScore)}
                </Text>
                <Text style={styles.scoreGrade}>
                  {getScoreGrade(result.scores.overallScore)}
                </Text>
                <View style={styles.scoreRing}>
                  <View
                    style={[
                      styles.scoreRingFill,
                      {
                        transform: [
                          {
                            rotate: `${(result.scores.overallScore / 100) * 360}deg`,
                          },
                        ],
                        backgroundColor: Colors.text.white,
                      },
                    ]}
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Score Dimensions */}
            <View style={styles.dimensionsCard}>
              <Text style={styles.sectionTitle}>Score Breakdown</Text>
              {renderScoreDimension('Accuracy', result.scores.accuracyScore, 'checkmark-circle')}
              {renderScoreDimension('Fluency', result.scores.fluencyScore, 'flash')}
              {renderScoreDimension('Completeness', result.scores.completenessScore, 'list')}
              {renderScoreDimension('Prosody', result.scores.prosodyScore, 'musical-notes')}
            </View>

            {/* Text Comparison */}
            <View style={styles.comparisonCard}>
              <Text style={styles.sectionTitle}>Reference Text</Text>
              <Text style={styles.referenceText}>{referenceText}</Text>

              <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>
                Recognized Text
              </Text>
              <Text style={styles.recognizedText}>{result.recognizedText}</Text>
            </View>
          </ScrollView>
        );

      case 'words':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
            {hasWords && <EnhancedWordHighlight words={result.words} interactive={true} />}
          </ScrollView>
        );

      case 'prosody':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
            <ProsodyFeedback
              prosodyScore={result.scores.prosodyScore}
              completenessScore={result.scores.completenessScore}
              fluencyScore={result.scores.fluencyScore}
            />
          </ScrollView>
        );

      case 'audio':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={true}>
            {recordedAudioUri ? (
              <AudioComparison
                text={referenceText}
                userRecordingUri={recordedAudioUri}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={40} color={Colors.text.secondary} />
                <Text style={styles.emptyStateText}>No recorded audio available</Text>
              </View>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={[styles.tabNavigation, Shadows.sm]}>
        <View style={styles.tabContent}>
          {[
            { key: 'overview' as FeedbackTab, label: 'Overview', icon: 'stats-chart' as const },
            ...(hasWords ? [{ key: 'words' as FeedbackTab, label: 'Words', icon: 'text' as const }] : []),
            { key: 'phonemes' as FeedbackTab, label: 'Phonemes', icon: 'musical-note' as const }, // NEW: Always show for proper tab cycling
            { key: 'prosody' as FeedbackTab, label: 'Prosody', icon: 'musical-notes' as const },
            ...(recordedAudioUri ? [{ key: 'audio' as FeedbackTab, label: 'Audio', icon: 'volume-medium' as const }] : []),
          ].map((tab) => {
            // NEW: Check if tab is available in this tier
            const isAvailable = availableTabs.includes(tab.key);
            const isLocked = !isAvailable;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabButton,
                  activeTab === tab.key && styles.tabButtonActive,
                  isLocked && styles.tabButtonLocked,
                ]}
                onPress={() => {
                  if (isAvailable) {
                    handleTabChange(tab.key);
                  } else {
                    // Optionally show upgrade prompt when tapping locked tab
                    onUpgradePress?.();
                  }
                }}
                disabled={isLocked}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={
                    isLocked
                      ? Colors.text.tertiary
                      : activeTab === tab.key
                      ? Colors.primary.blue
                      : Colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === tab.key && styles.tabButtonTextActive,
                    isLocked && styles.tabButtonTextLocked,
                  ]}
                >
                  {tab.label}
                </Text>
                {isLocked && (
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color={Colors.text.tertiary}
                    style={styles.lockIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  tabNavigation: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  tabScroll: {
    flex: 1,
  },
  tabContent: {
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    gap: Spacing.sm,
  },
  tabButtonActive: {
    borderLeftColor: Colors.primary.blue,
    backgroundColor: Colors.primary.blue + '10',
    borderRadius: BorderRadius.md,
  },
  tabButtonText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  // NEW: Styles for locked tabs (free tier feature gating)
  tabButtonLocked: {
    opacity: 0.6,
  },
  tabButtonTextLocked: {
    color: Colors.text.tertiary,
    fontWeight: '400',
  },
  lockIcon: {
    marginLeft: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.tertiary,
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
  scoreRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: Colors.text.white + '30',
  },
  scoreRingFill: {
    width: '100%',
    height: '100%',
  },
  dimensionsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  dimensionContainer: {
    marginBottom: Spacing.md,
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dimensionLabel: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  dimensionScore: {
    ...Typography.caption,
    color: Colors.text.secondary,
    position: 'absolute',
    right: 0,
    top: 0,
    fontWeight: 'bold',
  },
  dimensionBar: {
    height: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  dimensionBarFill: {
    height: '100%',
    borderRadius: BorderRadius.sm,
  },
  comparisonCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  referenceText: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  recognizedText: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  wordsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  wordError: {
    backgroundColor: Colors.accent.red + '10',
  },
  wordText: {
    ...Typography.body,
    fontWeight: '500',
  },
  wordErrorIcon: {
    marginLeft: Spacing.xs,
  },
  wordScore: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    fontSize: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
});
