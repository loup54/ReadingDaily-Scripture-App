/**
 * PracticeSentenceDisplay Component
 *
 * Displays the practice sentence with:
 * - Sentence text with reference
 * - Difficulty indicator
 * - Progress indicator (current sentence / total)
 * - Navigation controls (previous/next)
 * - Source information (Gospel, First Reading, etc.)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from '@/components/common/IconButton';
import { PracticeSentence } from '@/types/practice.types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

interface PracticeSentenceDisplayProps {
  sentence: PracticeSentence;
  currentIndex: number;
  totalSentences: number;
  // Reading navigation (top header)
  onPreviousReading?: () => void;
  onNextReading?: () => void;
  currentReadingIndex?: number;
  totalReadings?: number;
  // Sentence navigation (bottom controls)
  onPreviousSentence?: () => void;
  onNextSentence?: () => void;
  // Sentence position within current reading
  isFirstSentenceInReading?: boolean;
  isLastSentenceInReading?: boolean;
  // Legacy (backward compatibility)
  onPrevious?: () => void;
  onNext?: () => void;
  showNavigation?: boolean;
  recordingState?: string;
  recordingDuration?: number;
  liveDuration?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  recordingDisabled?: boolean;
  onModalClose?: () => void;
}

export const PracticeSentenceDisplay: React.FC<PracticeSentenceDisplayProps> = ({
  sentence,
  currentIndex,
  totalSentences,
  // Reading navigation
  onPreviousReading,
  onNextReading,
  currentReadingIndex = 0,
  totalReadings = 1,
  // Sentence navigation
  onPreviousSentence,
  onNextSentence,
  isFirstSentenceInReading = false,
  isLastSentenceInReading = false,
  // Legacy
  onPrevious,
  onNext,
  showNavigation = true,
  recordingState,
  recordingDuration,
  liveDuration,
  onStartRecording,
  onStopRecording,
  recordingDisabled = false,
  onModalClose,
}) => {
  const { colors } = useTheme();

  // Use sentence-level callbacks if available, otherwise fall back to legacy callbacks
  const handlePreviousSentence = onPreviousSentence || onPrevious;
  const handleNextSentence = onNextSentence || onNext;
  const handlePreviousReading = onPreviousReading || onPrevious;
  const handleNextReading = onNextReading || onNext;

  const isFirstReading = currentReadingIndex === 0;
  const isLastReading = currentReadingIndex === (totalReadings - 1);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return Colors.accent.green;
      case 'medium':
        return Colors.accent.yellow;
      case 'hard':
        return Colors.accent.red;
      default:
        return Colors.text.secondary;
    }
  };

  const getDifficultyIcon = (difficulty: string): keyof typeof Ionicons.glyphMap => {
    switch (difficulty) {
      case 'easy':
        return 'battery-half';
      case 'medium':
        return 'battery-charging';
      case 'hard':
        return 'battery-full';
      default:
        return 'help-circle';
    }
  };

  const isFirstSentence = currentIndex === 0;
  const isLastSentence = currentIndex === totalSentences - 1;

  return (
    <View style={styles.container}>
      {/* TOP HEADER: Left Arrow | Difficulty Badge | Right Arrow | Record Button */}
      {showNavigation && (
        <View style={[styles.topHeaderRow, { backgroundColor: colors.card }]}>
          {/* Left Arrow - Navigate readings (LARGER) */}
          <IconButton
            icon="chevron-back"
            onPress={() => handlePreviousReading?.()}
            size="lg"
            variant="default"
            color={colors.primary}
            disabled={isFirstReading || !handlePreviousReading}
            accessibilityLabel="Previous reading"
          />

          {/* Difficulty Badge - Center (SMALLER) */}
          <View
            style={[
              styles.difficultyBadgeSmall,
              { backgroundColor: getDifficultyColor(sentence.difficulty) + '20' },
            ]}
          >
            <Ionicons
              name={getDifficultyIcon(sentence.difficulty)}
              size={14}
              color={getDifficultyColor(sentence.difficulty)}
            />
            <Text
              style={[
                styles.difficultyTextSmall,
                { color: getDifficultyColor(sentence.difficulty) },
              ]}
            >
              {sentence.difficulty.charAt(0).toUpperCase() + sentence.difficulty.slice(1)}
            </Text>
          </View>

          {/* Right Arrow - Navigate readings (LARGER) */}
          <IconButton
            icon="chevron-forward"
            onPress={() => handleNextReading?.()}
            size="lg"
            variant="default"
            color={colors.primary}
            disabled={isLastReading || !handleNextReading}
            accessibilityLabel="Next reading"
          />

          {/* Small Record Button - Top Right */}
          {recordingState && (
            <IconButton
              icon={recordingState === 'recording' ? 'stop-circle' : 'mic'}
              onPress={recordingState === 'recording' ? onStopRecording : onStartRecording}
              size="sm"
              variant="filled"
              backgroundColor={
                recordingState === 'recording' ? Colors.accent.red : Colors.primary.blue
              }
              disabled={recordingDisabled || recordingState === 'preparing' || recordingState === 'processing'}
            />
          )}
        </View>
      )}

      {/* Full Reading Content */}
      {sentence.readingContent && (
        <View style={[styles.fullReadingCard, Shadows.md]}>
          <View style={styles.fullReadingHeader}>
            <Ionicons name="book" size={18} color={Colors.primary.blue} />
            <Text style={styles.fullReadingTitle}>Full {sentence.source}</Text>
          </View>
          <Text style={styles.fullReadingText}>{sentence.readingContent}</Text>
        </View>
      )}

      {/* Sentence Progress */}
      <View style={styles.sentenceProgressContainer}>
        <Text style={styles.sentenceProgressText}>
          Sentence {currentIndex + 1} of {totalSentences}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / totalSentences) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Sentence Card */}
      <View style={[styles.sentenceCard, Shadows.lg]}>
        {/* Sentence Header with Source */}
        <View style={styles.sentenceHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="text-outline" size={16} color={Colors.primary.blue} />
            <Text style={styles.headerTitle}>{sentence.source}</Text>
          </View>
          <View style={styles.difficultyTag}>
            <Text style={[styles.difficultyTagText, { color: getDifficultyColor(sentence.difficulty) }]}>
              {sentence.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Main Sentence Text */}
        <Text style={styles.sentenceText}>{sentence.text}</Text>

        {/* Reference and Word Count */}
        <View style={styles.sentenceMetadata}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={Colors.text.secondary} />
            <Text style={styles.metaText}>{sentence.reference}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="text-outline" size={13} color={Colors.text.secondary} />
            <Text style={styles.metaText}>{sentence.wordCount} words</Text>
          </View>
        </View>

        {/* Sentence Navigation and Recording Controls - Below card content */}
        <View style={styles.sentenceControlsRow}>
          {/* Left/Right for sentence - ONLY within current reading */}
          <View style={styles.sentenceNavigation}>
            <IconButton
              icon="chevron-back"
              onPress={() => handlePreviousSentence?.()}
              size="md"
              variant="default"
              color={colors.primary}
              disabled={!handlePreviousSentence}
              accessibilityLabel="Previous sentence"
            />
            <View style={styles.dotsContainer}>
              {Array.from({ length: totalSentences }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.dotActive,
                    index === currentIndex && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              ))}
            </View>
            <IconButton
              icon="chevron-forward"
              onPress={() => handleNextSentence?.()}
              size="md"
              variant="default"
              color={colors.primary}
              disabled={!handleNextSentence}
              accessibilityLabel="Next sentence"
            />
          </View>

          {/* Record button for sentence - Right side */}
          {recordingState && (
            <IconButton
              icon={recordingState === 'recording' ? 'stop-circle' : 'mic'}
              onPress={recordingState === 'recording' ? onStopRecording : onStartRecording}
              size="sm"
              variant="filled"
              backgroundColor={
                recordingState === 'recording' ? Colors.accent.red : Colors.primary.blue
              }
              disabled={recordingDisabled || recordingState === 'preparing' || recordingState === 'processing'}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
  },
  difficultyText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  difficultyBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
  },
  difficultyTextSmall: {
    ...Typography.caption,
    marginLeft: Spacing.xs - 2,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontSize: 11,
  },
  fullReadingCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
  },
  fullReadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  fullReadingTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  fullReadingText: {
    ...Typography.body,
    color: Colors.text.primary,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  sentenceProgressContainer: {
    marginBottom: Spacing.lg,
  },
  sentenceProgressText: {
    ...Typography.caption,
    color: Colors.primary.blue,
    marginBottom: Spacing.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontSize: 13,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.text.tertiary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary.blue,
    borderRadius: BorderRadius.md,
  },
  sentenceCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
    ...Shadows.lg,
  },
  sentenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  difficultyTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  difficultyTagText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sentenceText: {
    ...Typography.h2,
    color: Colors.text.primary,
    lineHeight: 36,
    marginBottom: Spacing.lg,
    fontWeight: '700',
  },
  sentenceMetadata: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.text.tertiary,
    opacity: 0.5,
  },
  dotActive: {
    width: 28,
    borderRadius: 5,
    opacity: 1,
  },
  sentenceControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
  },
  sentenceNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
});
