/**
 * Test Pronunciation Screen
 * Phase D2: Pronunciation Comparison
 *
 * Demo screen for testing pronunciation comparison functionality
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RecordingButton } from '@/components/audio/RecordingButton';
import { AudioPlayback } from '@/components/audio/AudioPlayback';
import { PronunciationScore } from '@/components/audio/PronunciationScore';
import { speechToTextService } from '@/services/speech/SpeechToTextService';
import type { TranscriptionResult, ComparisonResult } from '@/services/speech/SpeechToTextService';
import { Colors, Typography, Spacing } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

// Sample texts for practice
const PRACTICE_TEXTS = [
  {
    id: 1,
    text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    reference: 'John 1:1',
  },
  {
    id: 2,
    text: 'For God so loved the world that he gave his one and only Son.',
    reference: 'John 3:16',
  },
  {
    id: 3,
    text: 'The Lord is my shepherd, I shall not want.',
    reference: 'Psalm 23:1',
  },
];

export default function TestPronunciationScreen() {
  const { colors } = useTheme();
  const [selectedText, setSelectedText] = useState(PRACTICE_TEXTS[0]);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    transcription: TranscriptionResult;
    comparison: ComparisonResult;
    score: number;
    feedback: string;
  } | null>(null);

  const handleRecordingComplete = async (uri: string) => {
    console.log('[TestPronunciation] Recording complete:', uri);
    setRecordingUri(uri);
    setAnalysisResult(null);

    // Automatically analyze pronunciation
    await analyzePronunciation(uri);
  };

  const analyzePronunciation = async (uri: string) => {
    try {
      setIsAnalyzing(true);
      console.log('[TestPronunciation] Analyzing pronunciation...');

      const result = await speechToTextService.analyzePronunciation(
        uri,
        selectedText.text,
        'en-US'
      );

      console.log('[TestPronunciation] Analysis complete:', result);
      setAnalysisResult(result);
    } catch (error: any) {
      console.error('[TestPronunciation] Analysis failed:', error);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyze pronunciation. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = () => {
    console.log('[TestPronunciation] Recording deleted');
    setRecordingUri(null);
    setAnalysisResult(null);
  };

  const handleRetry = () => {
    setRecordingUri(null);
    setAnalysisResult(null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Pronunciation Practice
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Read the text below and get instant feedback
        </Text>
      </View>

      {/* Practice Text Selection */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Select Practice Text
        </Text>
        <View style={styles.textSelection}>
          {PRACTICE_TEXTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.textOption,
                {
                  backgroundColor: selectedText.id === item.id
                    ? `${colors.primary.blue}20`
                    : 'transparent',
                  borderColor: selectedText.id === item.id
                    ? colors.primary.blue
                    : colors.background.tertiary,
                },
              ]}
              onPress={() => {
                setSelectedText(item);
                setRecordingUri(null);
                setAnalysisResult(null);
              }}
            >
              <Text
                style={[
                  styles.textReference,
                  {
                    color: selectedText.id === item.id
                      ? colors.primary.blue
                      : colors.text.secondary,
                  },
                ]}
              >
                {item.reference}
              </Text>
              <Text
                style={[
                  styles.textPreview,
                  { color: colors.text.primary },
                ]}
                numberOfLines={2}
              >
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Text to Read */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Read This Text
        </Text>
        <Text style={[styles.practiceText, { color: colors.text.primary }]}>
          "{selectedText.text}"
        </Text>
        <Text style={[styles.reference, { color: colors.text.secondary }]}>
          — {selectedText.reference}
        </Text>
      </View>

      {/* Recording Section */}
      {!recordingUri && !analysisResult && (
        <View style={styles.recordingSection}>
          <RecordingButton
            onRecordingComplete={handleRecordingComplete}
            disabled={isAnalyzing}
          />
        </View>
      )}

      {/* Playback Section */}
      {recordingUri && !analysisResult && (
        <View style={styles.playbackSection}>
          <AudioPlayback uri={recordingUri} onDelete={handleDelete} />
        </View>
      )}

      {/* Analyzing State */}
      {isAnalyzing && (
        <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={[styles.analyzingText, { color: colors.text.secondary }]}>
            Analyzing your pronunciation...
          </Text>
        </View>
      )}

      {/* Results Section */}
      {analysisResult && !isAnalyzing && (
        <>
          <PronunciationScore
            score={analysisResult.score}
            feedback={analysisResult.feedback}
            transcription={analysisResult.transcription}
            comparison={analysisResult.comparison}
            expectedText={selectedText.text}
          />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary.blue }]}
              onPress={handleRetry}
            >
              <Text style={[styles.actionButtonText, { color: colors.text.white }]}>
                Try Again
              </Text>
            </TouchableOpacity>
            {recordingUri && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => analyzePronunciation(recordingUri)}
              >
                <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>
                  Re-analyze
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.title,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
  },
  section: {
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    fontSize: 18,
    fontWeight: '600',
  },
  textSelection: {
    gap: Spacing.sm,
  },
  textOption: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    gap: Spacing.xs,
  },
  textReference: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textPreview: {
    ...Typography.body,
    fontSize: 14,
  },
  practiceText: {
    ...Typography.body,
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
  },
  reference: {
    ...Typography.caption,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  playbackSection: {
    paddingVertical: Spacing.md,
  },
  analyzingText: {
    ...Typography.body,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
