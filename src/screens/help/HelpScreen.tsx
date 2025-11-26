import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconButton } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { useTheme } from '@/hooks/useTheme';

interface HelpScreenProps {
  onBack?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is ReadingDaily Scripture?',
    answer: 'ReadingDaily Scripture is a Catholic ESL (English as a Second Language) learning app. It provides daily liturgical readings from the Catholic Church with audio narration, pronunciation practice, translations, and tools to help you improve your English while engaging with scripture.',
  },
  {
    question: 'How do I get started?',
    answer: 'Simply open the app and you\'ll see today\'s Catholic liturgical readings. Tap on any reading to view it, listen to the audio narration, or access pronunciation practice. Visit Settings to customize your experience.',
  },
  {
    question: 'What are the Reading, Progress, and Practice tabs?',
    answer: 'The Reading tab shows daily Catholic liturgical readings. The Progress tab tracks your reading history and learning progress. The Practice tab allows you to practice pronunciation and receive AI-powered feedback on your speaking.',
  },
  {
    question: 'How does pronunciation practice work?',
    answer: 'In the Practice tab, select a sentence and tap the record button to practice reading it aloud. Our AI analyzes your pronunciation and provides detailed feedback including word-level accuracy, pace, and clarity improvements.',
  },
  {
    question: 'Can I download readings for offline access?',
    answer: 'Yes! Use the Download feature to save readings for offline access. You can check your offline storage in Settings → Offline. Downloaded readings remain available even without internet.',
  },
  {
    question: 'How do I change the voice and playback speed?',
    answer: 'Go to Settings → Audio & Translation. You can choose from different English accents (Australian, British, or American) and adjust playback speed from 0.5x to 1.5x.',
  },
  {
    question: 'How does translation work?',
    answer: 'Enable "Tap to Translate" in Settings → Audio & Translation, then select your preferred language (English, Spanish, Vietnamese, or Mandarin). While reading, tap any word to see its translation.',
  },
  {
    question: 'Why does translation require internet?',
    answer: 'Translation uses cloud-based AI services to provide accurate, context-aware translations. This ensures high-quality translations but requires an internet connection.',
  },
  {
    question: 'How can I track my progress?',
    answer: 'The Progress tab shows your reading calendar, total readings completed, and learning statistics. You\'ll see personalized progress on the dashboard with your name and avatar.',
  },
  {
    question: 'Can I change the app language?',
    answer: 'Yes! Go to Settings → Language & Accents. You can change the app interface language to English, Spanish, Vietnamese, or Mandarin, and select your preferred English accent.',
  },
  {
    question: 'How do I enable dark mode?',
    answer: 'Go to Settings at the bottom of the app and toggle "Dark Mode" to on. Your preference will be saved automatically.',
  },
  {
    question: 'What should I do if audio is not playing?',
    answer: 'First, check your device volume and ensure it\'s not on silent. Make sure you have an internet connection for the first load. If the issue persists, try restarting the app.',
  },
  {
    question: 'How can I edit my profile?',
    answer: 'Tap Settings, then in the Account section, tap "Edit Profile" to update your display name. You can also change your password from the same Account section.',
  },
  {
    question: 'How do I rate the app?',
    answer: 'Go to Settings, then tap "Rate the App" to leave a review on the App Store or Google Play. Your feedback helps us improve!',
  },
  {
    question: 'Is my reading data synced across devices?',
    answer: 'Your account data and reading history are synced via your account login. Make sure you\'re logged in to see your data across different devices.',
  },
];

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Filter FAQ items based on search query
  const filteredFAQ = FAQ_DATA.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.ui.border }]}>
        {onBack && (
          <IconButton
            icon="chevron-back"
            onPress={onBack}
            variant="default"
            size="md"
            color={colors.text.primary}
          />
        )}
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Help & FAQ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background.card, borderColor: colors.ui.border }]}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search questions"
            placeholderTextColor={colors.text.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {filteredFAQ.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="help-circle-outline"
                size={64}
                color={colors.text.tertiary}
              />
              <Text style={[styles.emptyStateText, { color: colors.text.tertiary }]}>
                No results found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredFAQ.map((item, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View key={index} style={[styles.faqItem, { backgroundColor: colors.background.card, borderColor: colors.ui.border }]}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => toggleExpanded(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestionText, { color: colors.text.primary }]}>{item.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.faqAnswer, { borderTopColor: colors.ui.divider }]}>
                      <Text style={[styles.faqAnswerText, { color: colors.text.secondary }]}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Contact Support */}
        <View style={[styles.contactSection, { backgroundColor: colors.background.secondary }]}>
          <Text style={[styles.contactTitle, { color: colors.text.primary }]}>Still need help?</Text>
          <Text style={[styles.contactText, { color: colors.text.secondary }]}>
            For technical issues, bugs, or feature requests, please contact us at:
          </Text>
          <Text style={[styles.contactText, { color: colors.primary.blue, fontWeight: '600', marginTop: Spacing.xs }]}>
            support@ourengltd.best
          </Text>
          <Text style={[styles.contactText, { color: colors.text.secondary, marginTop: Spacing.sm }]}>
            We aim to respond to all inquiries within 24 hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    color: Colors.text.primary,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  faqContainer: {
    marginBottom: Spacing.xl,
  },
  faqItem: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  faqQuestionText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
  faqAnswerText: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  contactTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  contactText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
});
