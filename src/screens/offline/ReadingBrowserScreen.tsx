/**
 * Reading Browser Screen
 * Browse cached readings by date with calendar interface
 * Shows reading content and navigation controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { ListSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common';
import { ReadingService } from '@/services/readings/ReadingService';
import { CachedReadingsCalendar } from '@/components/offline/CachedReadingsCalendar';
import { ScriptureText } from '@/components/reading';
import { EnhancedAudioPlayer } from '@/components/audio';
import type { DailyReadings } from '@/types/reading.types';

interface ReadingBrowserScreenProps {
  onBack?: () => void;
}

/**
 * Reading Browser Screen
 */
export const ReadingBrowserScreen: React.FC<ReadingBrowserScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { cachedReadingDates } = useOfflineStore();
  const isDark = useColorScheme() === 'dark';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reading, setReading] = useState<DailyReadings | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [readingStats, setReadingStats] = useState<{
    wordCount: number;
    readingTime: number;
  } | null>(null);

  /**
   * Load reading for selected date
   */
  const loadReading = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      setReading(null);
      setReadingStats(null);

      console.log('[ReadingBrowser] Loading reading for:', date.toISOString().split('T')[0]);

      const reading = await ReadingService.getDailyReadings(date);
      setReading(reading);

      // Calculate reading stats
      if (reading) {
        const gospel = reading.gospel?.text || '';
        const firstReading = reading.firstReading?.text || '';
        const psalm = reading.psalm?.text || '';
        const totalText = gospel + firstReading + psalm;
        const wordCount = totalText.split(/\s+/).filter((w) => w.length > 0).length;
        const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute

        setReadingStats({
          wordCount,
          readingTime: estimatedReadingTime,
        });

        console.log('[ReadingBrowser] Reading loaded:', {
          wordCount,
          readingTime: estimatedReadingTime,
        });
      }
    } catch (error) {
      console.error('[ReadingBrowser] Failed to load reading:', error);
      setReading(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle date selection
   */
  const handleDateSelect = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      loadReading(date);
    },
    [loadReading]
  );

  /**
   * Handle previous month
   */
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  /**
   * Handle next month
   */
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  /**
   * Handle previous day
   */
  const handlePrevDay = useCallback(() => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    handleDateSelect(prevDate);

    // Update month if day is in different month
    if (prevDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(prevDate);
    }
  }, [selectedDate, currentMonth, handleDateSelect]);

  /**
   * Handle next day
   */
  const handleNextDay = useCallback(() => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    handleDateSelect(nextDate);

    // Update month if day is in different month
    if (nextDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(nextDate);
    }
  }, [selectedDate, currentMonth, handleDateSelect]);

  // Load initial reading
  useEffect(() => {
    loadReading(selectedDate);
  }, []);

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDateCached = cachedReadingDates?.includes(
    selectedDate.toISOString().split('T')[0]
  ) ?? false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LinearGradient
        colors={[colors.primary.blue, colors.primary.blue]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text.white} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.text.white }]}>
            Reading Browser
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar */}
          <CachedReadingsCalendar
            cachedDates={cachedReadingDates || []}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />

          {/* Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity
              onPress={handlePrevDay}
              style={[styles.navButton, { backgroundColor: colors.background.card }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary.blue} />
            </TouchableOpacity>

            <View style={[styles.dateDisplay, { backgroundColor: colors.background.card }]}>
              <Text style={[styles.dateText, { color: colors.text.primary }]}>
                {formatDateDisplay(selectedDate)}
              </Text>
              <Text
                style={[
                  styles.cacheStatusText,
                  { color: isDateCached ? Colors.status.success : Colors.status.error },
                ]}
              >
                {isDateCached ? '✅ Cached' : '❌ Not Cached'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleNextDay}
              style={[styles.navButton, { backgroundColor: colors.background.card }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.primary.blue} />
            </TouchableOpacity>
          </View>

          {/* Reading Content */}
          {loading ? (
            <ListSkeleton itemCount={1} />
          ) : reading ? (
            <View style={styles.readingContainer}>
              {/* Gospel */}
              {reading.gospel && (
                <View style={styles.readingSection}>
                  <Text style={[styles.readingTitle, { color: colors.text.primary }]}>
                    Gospel
                  </Text>
                  <ScriptureText reading={reading.gospel} />
                </View>
              )}

              {/* First Reading */}
              {reading.firstReading && (
                <View style={styles.readingSection}>
                  <Text style={[styles.readingTitle, { color: colors.text.primary }]}>
                    First Reading
                  </Text>
                  <ScriptureText reading={reading.firstReading} />
                </View>
              )}

              {/* Psalm */}
              {reading.psalm && (
                <View style={styles.readingSection}>
                  <Text style={[styles.readingTitle, { color: colors.text.primary }]}>
                    Psalm
                  </Text>
                  <ScriptureText reading={reading.psalm} />
                </View>
              )}

              {/* Audio Player */}
              {reading.gospel && (
                <View style={styles.audioPlayerContainer}>
                  <EnhancedAudioPlayer reading={reading.gospel} />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noReadingContainer}>
              <EmptyState
                icon="document-outline"
                title="No Reading Available"
                message="This date doesn't have a cached reading available. Try selecting a different date from the calendar."
                tips={[
                  '📅 Use the calendar to select a cached date',
                  '✅ Cached dates are highlighted in the calendar',
                  '📱 Download readings from the main app when online',
                ]}
              />
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Bottom Stats */}
      {reading && readingStats && (
        <View style={[styles.statsBar, { backgroundColor: colors.background.card }]}>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary.blue} />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Words
              </Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {readingStats.wordCount.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.ui.divider }]} />

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={18} color={colors.primary.blue} />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Est. Time
              </Text>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {readingStats.readingTime} min
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.ui.divider }]} />

          <View style={styles.statItem}>
            <Ionicons
              name={isDateCached ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={isDateCached ? Colors.status.success : Colors.status.error}
            />
            <View style={styles.statText}>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Cache
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isDateCached ? Colors.status.success : Colors.status.error },
                ]}
              >
                {isDateCached ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.lg,
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  dateDisplay: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cacheStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  readingContainer: {
    paddingHorizontal: Spacing.md,
  },
  readingSection: {
    marginBottom: Spacing.lg,
  },
  readingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  audioPlayerContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    marginTop: Spacing.md,
  },
  noReadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noReadingText: {
    fontSize: 14,
    marginTop: Spacing.md,
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.sm,
  },
});
