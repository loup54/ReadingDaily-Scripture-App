/**
 * Test Recording Screen
 * Phase D1: Audio Recording
 *
 * Demo screen for testing audio recording and playback functionality
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RecordingButton } from '@/components/audio/RecordingButton';
import { AudioPlayback } from '@/components/audio/AudioPlayback';
import { Colors, Typography, Spacing } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

export default function TestRecordingScreen() {
  const { colors } = useTheme();
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  const handleRecordingComplete = (uri: string) => {
    console.log('[TestRecording] Recording complete:', uri);
    setRecordingUri(uri);
  };

  const handleDelete = () => {
    console.log('[TestRecording] Recording deleted');
    setRecordingUri(null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Audio Recording Test
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Test microphone recording and playback
        </Text>
      </View>

      {/* Instructions */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Instructions
        </Text>
        <Text style={[styles.instructions, { color: colors.text.secondary }]}>
          1. Tap the microphone button to start recording{'\n'}
          2. Speak into your device's microphone{'\n'}
          3. Tap the stop button to finish recording{'\n'}
          4. Use the playback controls to listen to your recording{'\n'}
          5. Delete the recording to start over
        </Text>
      </View>

      {/* Recording Button */}
      <View style={styles.recordingSection}>
        <RecordingButton
          onRecordingComplete={handleRecordingComplete}
          disabled={false}
        />
      </View>

      {/* Playback Section */}
      {recordingUri && (
        <View style={styles.playbackSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Your Recording
          </Text>
          <AudioPlayback uri={recordingUri} onDelete={handleDelete} />
        </View>
      )}

      {/* Status */}
      <View style={[styles.statusSection, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.statusLabel, { color: colors.text.secondary }]}>
          Status:
        </Text>
        <Text style={[styles.statusText, { color: colors.text.primary }]}>
          {recordingUri ? 'Recording saved' : 'No recording yet'}
        </Text>
        {recordingUri && (
          <Text style={[styles.uriText, { color: colors.text.secondary }]} numberOfLines={2}>
            {recordingUri}
          </Text>
        )}
      </View>

      {/* Tips */}
      <View style={[styles.section, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Tips
        </Text>
        <Text style={[styles.instructions, { color: colors.text.secondary }]}>
          • Make sure you grant microphone permissions when prompted{'\n'}
          • For best quality, record in a quiet environment{'\n'}
          • Hold your device about 6-12 inches from your mouth{'\n'}
          • Recordings are saved temporarily and can be deleted
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.xl,
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
  instructions: {
    ...Typography.body,
    lineHeight: 24,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  playbackSection: {
    gap: Spacing.md,
  },
  statusSection: {
    padding: Spacing.md,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  statusLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusText: {
    ...Typography.body,
    fontWeight: '600',
  },
  uriText: {
    ...Typography.caption,
    fontFamily: 'monospace',
    marginTop: Spacing.xs,
  },
});
