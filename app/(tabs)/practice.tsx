import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { PronunciationPracticeScreen } from '@/screens/practice/PronunciationPracticeScreen';
import { useReadingStore } from '@/stores/useReadingStore';

export default function PracticeTab() {
  const { colors } = useTheme();
  const { readings, loading, loadReadings, currentDate } = useReadingStore();
  const [showingPractice, setShowingPractice] = useState(false);

  // Load today's readings when component mounts
  useEffect(() => {
    loadReadings(new Date());
  }, [loadReadings]);

  // Show pronunciation practice with full session
  if (showingPractice && readings) {
    return (
      <PronunciationPracticeScreen
        onBack={() => setShowingPractice(false)}
        onSettingsPress={() => {
          // Settings handler can be added later
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LinearGradient colors={colors.primary.gradient} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.white }]}>
            Pronunciation Practice
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.white }]}>
            Practice reading and improve your pronunciation
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.blue} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Loading practice sentences...
              </Text>
            </View>
          ) : readings ? (
            <>
              {/* Practice cards */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Reading Passages for {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.text.white }]}>
                  Tap any passage to practice pronunciation
                </Text>

                  {readings && (
                  <TouchableOpacity
                    style={[styles.practiceCard, { backgroundColor: colors.background.card }]}
                    onPress={() => setShowingPractice(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.practiceCardHeader}>
                      <View style={[styles.practiceIcon, { backgroundColor: colors.primary.blue + '20' }]}>
                        <Ionicons name="mic" size={24} color={colors.primary.blue} />
                      </View>
                      <View style={styles.practiceCardTitle}>
                        <Text style={[styles.practiceTitle, { color: colors.text.primary }]}>
                          Daily Scripture Practice
                        </Text>
                        <Text style={[styles.practiceSubtitle, { color: colors.text.secondary }]}>
                          Practice your pronunciation
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    </View>

                    <Text
                      style={[styles.practicePreview, { color: colors.text.secondary }]}
                      numberOfLines={3}
                    >
                      Improve your pronunciation by practicing scripture readings with instant AI feedback. Learn proper pronunciation, pace, and clarity.
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Features Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Practice Features
                </Text>

                <View style={[styles.featureCard, { backgroundColor: colors.background.card }]}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.accent.green + '20' }]}>
                      <Ionicons name="mic-circle" size={32} color={colors.accent.green} />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                        Voice Recording
                      </Text>
                      <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                        Record your pronunciation and get instant feedback
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.featureCard, { backgroundColor: colors.background.card }]}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.primary.blue + '20' }]}>
                      <Ionicons name="analytics" size={32} color={colors.primary.blue} />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                        Word-Level Analysis
                      </Text>
                      <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                        See which words you pronounced correctly
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.featureCard, { backgroundColor: colors.background.card }]}>
                  <View style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.ui.warning + '20' }]}>
                      <Ionicons name="headset" size={32} color={colors.ui.warning} />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
                        Audio Comparison
                      </Text>
                      <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                        Compare your voice with correct pronunciation
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={80} color={colors.text.tertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                No Reading Available
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
                Visit the Reading tab to load today's scripture
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    ...Typography.displayMedium,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 20,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...Typography.body,
    fontSize: 14,
    marginTop: -Spacing.xs,
  },
  practiceCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  practiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  practiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceCardTitle: {
    flex: 1,
  },
  practiceTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
  },
  practiceSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  practicePreview: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  featureCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  featureDescription: {
    ...Typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
    fontSize: 22,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
