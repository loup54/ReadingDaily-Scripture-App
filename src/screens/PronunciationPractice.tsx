/**
 * Pronunciation Practice Screen
 * Phase D3: Pronunciation UI
 *
 * Full pronunciation practice flow integrated with daily readings
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingButton } from '@/components/audio/RecordingButton';
import { AudioPlayback } from '@/components/audio/AudioPlayback';
import { PronunciationScore } from '@/components/audio/PronunciationScore';
import { WaveformVisualization } from '@/components/audio/WaveformVisualization';
import { speechToTextService } from '@/services/speech/SpeechToTextService';
import type { TranscriptionResult, ComparisonResult } from '@/services/speech/SpeechToTextService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useTrialStore } from '@/stores/useTrialStore';
import { analyticsService } from '@/services/analytics/AnalyticsService';

export interface PronunciationPracticeProps {
  text: string;
  reference?: string;
  onClose?: () => void;
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({
  text,
  reference,
  onClose,
}) => {
  const { colors } = useTheme();
  const { currentTier } = useTrialStore();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [analysisResult, setAnalysisResult] = useState<{
    transcription: TranscriptionResult;
    comparison: ComparisonResult;
    score: number;
    feedback: string;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleRecordingComplete = async (uri: string) => {
    console.log('[PronunciationPractice] Recording complete:', uri);
    setRecordingUri(uri);
    setAnalysisResult(null);
    setShowResults(false);

    // Automatically analyze pronunciation
    await analyzePronunciation(uri);
  };

  const analyzePronunciation = async (uri: string) => {
    try {
      setIsAnalyzing(true);
      console.log('[PronunciationPractice] Analyzing pronunciation...');

      const result = await speechToTextService.analyzePronunciation(
        uri,
        text,
        'en-US'
      );

      console.log('[PronunciationPractice] Analysis complete:', result);
      setAnalysisResult(result);
      setShowResults(true);

      // Log session completion analytics
      const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      const wordCount = text.split(/\s+/).length;

      analyticsService.logSessionCompleted({
        durationSeconds,
        overallScore: result.score,
        accuracy: result.comparison?.accuracy || 0,
        fluency: result.comparison?.fluency || 0,
        completeness: result.comparison?.completeness || 0,
        prosody: result.comparison?.prosody || 0,
        wordCount,
        wordsCorrect: Math.round((result.score / 100) * wordCount),
        subscriptionTier: currentTier,
      });
    } catch (error: any) {
      console.error('[PronunciationPractice] Analysis failed:', error);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze pronunciation. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = () => {
    console.log('[PronunciationPractice] Recording deleted');
    setRecordingUri(null);
    setAnalysisResult(null);
    setShowResults(false);
  };

  const handleRetry = () => {
    setRecordingUri(null);
    setAnalysisResult(null);
    setShowResults(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
              Pronunciation Practice
            </Text>
            {reference && (
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                {reference}
              </Text>
            )}
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Practice Text */}
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color={colors.primary.blue} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Read This Text
            </Text>
          </View>
          <Text style={[styles.practiceText, { color: colors.text.primary }]}>
            "{text}"
          </Text>
        </View>

        {/* Instructions */}
        {!recordingUri && !showResults && (
          <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={colors.primary.blue} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                How It Works
              </Text>
            </View>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary.blue }]}>
                  <Text style={[styles.instructionNumberText, { color: colors.text.white }]}>
                    1
                  </Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text.secondary }]}>
                  Tap the microphone button below to start recording
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary.blue }]}>
                  <Text style={[styles.instructionNumberText, { color: colors.text.white }]}>
                    2
                  </Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text.secondary }]}>
                  Read the text above clearly and naturally
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary.blue }]}>
                  <Text style={[styles.instructionNumberText, { color: colors.text.white }]}>
                    3
                  </Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.text.secondary }]}>
                  Tap stop when finished and get instant feedback
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Recording Section */}
        {!recordingUri && !showResults && !isAnalyzing && (
          <View style={styles.recordingSection}>
            <RecordingButton
              onRecordingComplete={handleRecordingComplete}
              disabled={false}
            />
          </View>
        )}

        {/* Waveform Visualization (during analysis) */}
        {isAnalyzing && (
          <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={colors.primary.blue} />
              <Text style={[styles.analyzingText, { color: colors.text.primary }]}>
                Analyzing your pronunciation...
              </Text>
              <Text style={[styles.analyzingSubtext, { color: colors.text.secondary }]}>
                This may take a few seconds
              </Text>
            </View>
            <WaveformVisualization isActive={true} />
          </View>
        )}

        {/* Playback Section */}
        {recordingUri && !showResults && !isAnalyzing && (
          <View style={styles.playbackSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Your Recording
            </Text>
            <AudioPlayback uri={recordingUri} onDelete={handleDelete} />
          </View>
        )}

        {/* Results Section */}
        {showResults && analysisResult && (
          <>
            <PronunciationScore
              score={analysisResult.score}
              feedback={analysisResult.feedback}
              transcription={analysisResult.transcription}
              comparison={analysisResult.comparison}
              expectedText={text}
              userRecordingUri={recordingUri || undefined}
            />

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary.blue }]}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={20} color={colors.text.white} />
                <Text style={[styles.actionButtonText, { color: colors.text.white }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
              {recordingUri && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton, { backgroundColor: colors.background.secondary, borderColor: colors.primary.blue }]}
                  onPress={() => analyzePronunciation(recordingUri)}
                >
                  <Ionicons name="refresh-circle" size={20} color={colors.primary.blue} />
                  <Text style={[styles.actionButtonText, { color: colors.primary.blue }]}>
                    Re-analyze
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '600',
  },
  practiceText: {
    ...Typography.body,
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  instructionsList: {
    gap: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    ...Typography.label,
    fontWeight: 'bold',
  },
  instructionText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 24,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  analyzingContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  analyzingText: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '600',
  },
  analyzingSubtext: {
    ...Typography.body,
  },
  playbackSection: {
    gap: Spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  primaryButton: {
    // backgroundColor set by theme
  },
  secondaryButton: {
    borderWidth: 2,
  },
  actionButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
