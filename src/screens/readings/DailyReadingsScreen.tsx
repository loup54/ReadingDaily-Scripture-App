import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ReadingTabs, ScriptureText, ScriptureTextWithHighlighting, GestureTutorialOverlay } from '../../components/reading';
import { IconButton, FeatureOverlay } from '../../components/common';
import { EnhancedAudioPlayer } from '../../components/audio';
import { TrialTimer } from '../../components/trial';
import { ListSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common';
import { OfflineMessageBanner } from '@/components/offline/OfflineMessageBanner';
import { PronunciationPractice } from '@/screens/PronunciationPractice';
import { ReadingType, DailyReadings } from '../../types/reading.types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { ONBOARDING_FEATURES } from '@/constants/onboarding';
import { useTrialStore } from '../../stores/useTrialStore';
import { useReadingStore } from '@/stores/useReadingStore';
import { useTheme } from '@/hooks/useTheme';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTranslationStore } from '@/stores/useTranslationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { ReadingService } from '@/services/readings/ReadingService';
import { audioPlaybackService } from '@/services/audio';
import { progressService } from '@/services/progress/ProgressService';

interface DailyReadingsScreenProps {
  readings: DailyReadings;
  activeTab: ReadingType;
  onTabChange: (tab: ReadingType) => void;
  onTomorrowPress: () => void;
  onPlaybackComplete?: () => void;
  onUpgradePress?: () => void;
  onSettingsPress?: () => void;
  onCalendarPress?: () => void;
  selectedDate?: Date;
}

export const DailyReadingsScreen: React.FC<DailyReadingsScreenProps> = ({
  readings,
  activeTab,
  onTabChange,
  onTomorrowPress,
  onPlaybackComplete,
  onUpgradePress,
  onSettingsPress,
  onCalendarPress,
  selectedDate = new Date(),
}) => {
  const { isOnline } = useOfflineStore();
  const { loading } = useReadingStore();
  const { settings: appSettings, addDiscoveredFeature, hasDiscoveredFeature } = useSettingsStore();
  const [isReadingCached, setIsReadingCached] = useState(false);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showPronunciationModal, setShowPronunciationModal] = useState(false);
  const [showAudioHighlightingTip, setShowAudioHighlightingTip] = useState(false);
  const [showGestureTutorial, setShowGestureTutorial] = useState(false);

  // Check if reading is cached offline
  useEffect(() => {
    const checkIfCached = async () => {
      const cached = await ReadingService.isReadingCached(selectedDate);
      setIsReadingCached(cached);
      setShowOfflineMessage(!isOnline && cached);
    };

    checkIfCached();
  }, [selectedDate, isOnline]);

  // Stop audio playback when reading tab changes
  useEffect(() => {
    const stopAudio = async () => {
      try {
        await audioPlaybackService.pause();
      } catch (error) {
        console.log('[DailyReadingsScreen] Audio pause on tab change:', error);
      }
    };

    stopAudio();
  }, [activeTab]);

  // Record reading view for progress tracking
  useEffect(() => {
    const recordReading = async () => {
      if (!userId) return;

      try {
        const currentReading = getCurrentReading();
        await progressService.recordReading(userId, currentReading.id, {
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          completedFully: false,
        });
      } catch (error) {
        console.log('[DailyReadingsScreen] Progress recording:', error);
      }
    };

    recordReading();
  }, [selectedDate, userId]);

  // Show audio highlighting tutorial on first use
  useEffect(() => {
    if (
      appSettings.audio.enableAudioHighlighting &&
      !hasDiscoveredFeature(ONBOARDING_FEATURES.AUDIO_HIGHLIGHTING)
    ) {
      setShowAudioHighlightingTip(true);
    }
  }, [appSettings.audio.enableAudioHighlighting, hasDiscoveredFeature]);

  // Show tap-to-translate gesture tutorial on first use
  useEffect(() => {
    if (
      appSettings.translation.enabled &&
      !hasDiscoveredFeature(ONBOARDING_FEATURES.TRANSLATIONS)
    ) {
      setShowGestureTutorial(true);
    }
  }, [appSettings.translation.enabled, hasDiscoveredFeature]);

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const { colors } = useTheme();
  const { isActive, hasPurchased } = useTrialStore();
  const { settings } = useSettingsStore();
  const { userId } = useAuthStore();
  // Word-level audio highlighting is disabled by default
  // Timing data is generated daily by Cloud Function; users can enable in Settings once available
  const enableAudioHighlighting = settings.audio.enableAudioHighlighting;

  // Get current reading based on active tab
  const getCurrentReading = () => {
    switch (activeTab) {
      case 'first-reading':
        return readings.firstReading;
      case 'psalm':
        return readings.psalm;
      case 'second-reading':
        // Return placeholder if no second reading on non-Feast days
        if (!readings.secondReading) {
          return {
            id: 'no-second-reading',
            type: 'second-reading' as const,
            title: 'No Second Reading',
            reference: '',
            content: 'No 2nd Reading today\n\nSecond readings are provided on Sundays and Feast Days.',
            date: readings.date,
          };
        }
        return readings.secondReading;
      case 'gospel':
        return readings.gospel;
      default:
        return readings.firstReading;
    }
  };

  const currentReading = getCurrentReading();

  // Dynamic styles with theme colors
  const dynamicStyles = {
    content: {
      ...styles.content,
      backgroundColor: colors.background.primary,
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LinearGradient
        colors={[colors.primary.blue, colors.primary.blue]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={onCalendarPress}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar" size={20} color={colors.text.white} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text.white }]}>Daily Readings</Text>
              <Text style={[styles.dateText, { color: colors.text.white }]}>
                {formatDateDisplay(selectedDate)}
              </Text>
            </View>

            <IconButton
              icon="settings-outline"
              onPress={onSettingsPress}
              variant="default"
              size="md"
              color={colors.text.white}
            />
          </View>

          <Text style={[styles.subtitle, { color: colors.text.white }]}>Practice English with Sacred Scripture</Text>
        </View>

        {/* Main Content */}
        <View style={dynamicStyles.content}>
          {/* Loading Skeleton */}
          {loading && !readings?.gospel?.content ? (
            <ListSkeleton itemCount={1} />
          ) : !readings?.gospel?.content && !readings?.firstReading?.content ? (
            // Empty State: No readings available
            <EmptyState
              icon="book-outline"
              title="No Readings Available"
              message="Readings for this date are not available yet. Try selecting a different date or check back later."
              tips={[
                '📅 Use the calendar to navigate to different dates',
                '✓ Daily readings are available for most dates',
                '🔄 Pull to refresh to reload the readings',
              ]}
            />
          ) : (
            <>
              {/* Offline Message (if viewing cached reading offline) */}
              {showOfflineMessage && isReadingCached && (
                <OfflineMessageBanner
                  message="📦 You're viewing a cached reading offline"
                  type="info"
                  autoDismiss={true}
                  dismissDuration={5000}
                />
              )}

              {/* Trial Timer (if trial is active and not purchased) */}
              {isActive && !hasPurchased && (
                <TrialTimer compact onUpgradePress={onUpgradePress} />
              )}

              {/* Reading Tabs */}
              <ReadingTabs activeTab={activeTab} onTabChange={onTabChange} />

              {/* Scripture Display - Flex: 1 to expand and fill space */}
              <View style={styles.scriptureContainer}>
                {enableAudioHighlighting ? (
                  <ScriptureTextWithHighlighting reading={currentReading} />
                ) : (
                  <ScriptureText reading={currentReading} />
                )}
              </View>
            </>
          )}
        </View>

        {/* Enhanced Audio Player - Fixed at bottom */}
        <View style={[styles.audioPlayerContainer, { backgroundColor: colors.background.primary }]}>
          <EnhancedAudioPlayer
            reading={currentReading}
            onPlaybackComplete={onPlaybackComplete}
          />
        </View>
      </LinearGradient>

      {/* Pronunciation Practice Modal */}
      <Modal
        visible={showPronunciationModal}
        onRequestClose={() => setShowPronunciationModal(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PronunciationPractice
          text={currentReading.content}
          reference={currentReading.reference}
          onClose={() => setShowPronunciationModal(false)}
        />
      </Modal>

      {/* Audio Highlighting Tutorial Overlay */}
      <FeatureOverlay
        title="Word Highlighting Active ✨"
        description="Watch the words highlight as you listen to the audio. This helps you follow along and improves your reading speed and comprehension."
        icon="sparkles"
        actionLabel="Got It"
        visible={showAudioHighlightingTip}
        onDismiss={() => {
          setShowAudioHighlightingTip(false);
          addDiscoveredFeature(ONBOARDING_FEATURES.AUDIO_HIGHLIGHTING);
        }}
      />

      {/* Tap-to-Translate Gesture Tutorial */}
      <GestureTutorialOverlay
        word={currentReading?.title || 'reading'}
        translation="Study of religious texts or scriptures"
        visible={showGestureTutorial}
        onDismiss={() => {
          setShowGestureTutorial(false);
          addDiscoveredFeature(ONBOARDING_FEATURES.TRANSLATIONS);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...Typography.displayMedium,
    fontSize: 28,
    color: Colors.text.white,
    marginBottom: Spacing.xs,
  },
  tomorrowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    marginTop: Spacing.xs,
  },
  tomorrowText: {
    ...Typography.label,
    color: Colors.text.white,
  },
  calendarButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontSize: 12,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 0,
  },
  scriptureContainer: {
    flex: 1,
  },
  audioPlayerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});