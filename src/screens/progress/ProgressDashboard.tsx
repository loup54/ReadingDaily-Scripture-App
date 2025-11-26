/**
 * Progress Dashboard Screen
 *
 * Main screen displaying user progress, streaks, badges, and reading calendar
 * Integrates all progress tracking components
 * Phase E: Progress Tracking (Task 2.5)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProgressStore } from '@/stores/progressStore';
import { DashboardSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common';
import { StreakDisplay } from '@/components/progress/StreakDisplay';
import { BadgeCard } from '@/components/progress/BadgeCard';
import { ReadingCalendar } from '@/components/progress/ReadingCalendar';
import { BadgeUnlockedAnimation } from '@/components/progress/BadgeUnlockedAnimation';
import { BADGES } from '@/services/progress/badges';
import type { Badge } from '@/types/progress.types';

export interface ProgressDashboardProps {
  userId?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userId: propUserId,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const { progressData, loading, error, fetchProgress, refreshBadges, newlyEarnedBadges, clearNewlyEarned } = useProgressStore();

  const [refreshing, setRefreshing] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);

  // Determine which user ID to use
  const currentUserId = propUserId || user?.id;

  /**
   * Load progress on mount
   */
  useEffect(() => {
    if (currentUserId) {
      fetchProgress(currentUserId);
    }
  }, [currentUserId, fetchProgress]);

  /**
   * Watch for newly earned badges and queue them for display
   */
  useEffect(() => {
    if (newlyEarnedBadges && newlyEarnedBadges.length > 0) {
      setBadgeQueue(newlyEarnedBadges);
      // Show the first badge
      if (newlyEarnedBadges[0]) {
        setUnlockedBadge(newlyEarnedBadges[0]);
        setShowBadgeAnimation(true);
      }
    }
  }, [newlyEarnedBadges]);

  /**
   * Handle badge animation dismissal and show next badge in queue
   */
  const handleDismissBadgeAnimationWithQueue = useCallback((): void => {
    setShowBadgeAnimation(false);
    setUnlockedBadge(null);

    // Remove the first badge from queue
    setBadgeQueue((prev) => {
      const newQueue = prev.slice(1);

      // If there are more badges, show the next one after a short delay
      if (newQueue.length > 0) {
        setTimeout(() => {
          setUnlockedBadge(newQueue[0]);
          setShowBadgeAnimation(true);
        }, 500);
      } else {
        // All badges shown, clear from store
        clearNewlyEarned();
      }

      return newQueue;
    });
  }, [clearNewlyEarned]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    if (!currentUserId) return;

    setRefreshing(true);
    try {
      await fetchProgress(currentUserId);
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId, fetchProgress]);

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, [logout]);

  /**
   * Handle badge press
   */
  const handleBadgePress = (badgeId: string): void => {
    // Could expand badge details or show more info
    console.log('Badge pressed:', badgeId);
  };

  /**
   * Get all earned badges
   */
  const getEarnedBadges = (): Badge[] => {
    if (!progressData) return [];

    return Object.values(BADGES).filter((badge) => {
      const badgeProgress = progressData.badges?.find(
        (bp) => bp.badgeId === badge.id
      );
      return badgeProgress?.earned;
    });
  };

  /**
   * Get all unearned (upcoming) badges with progress
   */
  const getUpcomingBadges = (): Badge[] => {
    if (!progressData) return [];

    return Object.values(BADGES).filter((badge) => {
      const badgeProgress = progressData.badges?.find(
        (bp) => bp.badgeId === badge.id
      );
      return !badgeProgress?.earned;
    });
  };

  /**
   * Get badge progress for a specific badge
   */
  const getBadgeProgress = (badgeId: string) => {
    return progressData?.badges?.find((bp) => bp.badgeId === badgeId) || {
      badgeId,
      current: 0,
      required: 0,
      earned: false,
    };
  };


  // Loading state
  if (!progressData && loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !progressData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.ui.error}
          />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Unable to Load Progress
          </Text>
          <Text style={[styles.errorMessage, { color: colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary.main }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.retryButtonText, { color: colors.text.white }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No data state
  if (!progressData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
        <EmptyState
          icon="stats-chart-outline"
          title="No Progress Yet"
          message="Track your reading progress by completing scripture readings. Your stats will appear here as you read."
          tips={[
            '📖 Go to Daily Readings to start your first reading',
            '✓ Complete readings to earn progress streaks',
            '🏆 Track your consistency and reading time',
            '🎯 Set reading goals in Settings',
          ]}
          actionButton={{
            label: 'Start Your First Reading',
            onPress: () => router.push('/(tabs)/readings'),
          }}
        />
      </SafeAreaView>
    );
  }

  const earnedBadges = getEarnedBadges();
  const upcomingBadges = getUpcomingBadges();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.main }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.main}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with User Avatar and Personalized Greeting */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            {/* User Avatar */}
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.primary.main },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.text.white }]}>
                {user?.displayName
                  ? user.displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </Text>
            </View>

            {/* Personalized Greeting */}
            <View style={styles.greetingContainer}>
              <Text style={[styles.headerGreeting, { color: colors.text.primary }]}>
                Welcome back!
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                {user?.displayName ? `${user.displayName}'s Progress` : 'Your Progress'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: colors.background.secondary },
              ]}
              onPress={handleRefresh}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={colors.primary.main}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: colors.background.secondary, marginLeft: 8 },
              ]}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out"
                size={20}
                color={colors.ui.error}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak Display */}
        <View style={styles.section}>
          <StreakDisplay
            currentStreak={progressData.streaks?.currentStreak || 0}
            longestStreak={progressData.streaks?.longestStreak || 0}
            lastReadingDate={
              progressData.streaks?.lastReadingDate || new Date()
            }
            style={[
              Shadows.lg,
              {
                backgroundColor: colors.background.card,
              },
            ]}
          />
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsSection}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.ui.border,
              },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={24}
              color={colors.primary.main}
            />
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.text.secondary,
                },
              ]}
            >
              Total Readings
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.primary.main,
                },
              ]}
            >
              {progressData.streaks?.totalReadings || 0}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.ui.border,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.primary.main}
            />
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.text.secondary,
                },
              ]}
            >
              Days Read
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.primary.main,
                },
              ]}
            >
              {progressData.streaks?.totalDays || 0}
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.ui.border,
              },
            ]}
          >
            <Ionicons
              name="medal-outline"
              size={24}
              color={colors.primary.main}
            />
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.text.secondary,
                },
              ]}
            >
              Badges Earned
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color: colors.primary.main,
                },
              ]}
            >
              {earnedBadges.length}
            </Text>
          </View>
        </View>

        {/* Earned Badges Section */}
        {earnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              🏆 Badges Earned
            </Text>
            {earnedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                progress={getBadgeProgress(badge.id)}
                earned={true}
                earnedDate={
                  progressData.badges?.find((bp) => bp.badgeId === badge.id)
                    ?.earnedDate
                }
                onPress={() => handleBadgePress(badge.id)}
              />
            ))}
          </View>
        )}

        {/* Upcoming Badges Section */}
        {upcomingBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              🔒 Next Badges
            </Text>
            {upcomingBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                progress={getBadgeProgress(badge.id)}
                earned={false}
                onPress={() => handleBadgePress(badge.id)}
              />
            ))}
          </View>
        )}

        {/* Reading Calendar Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            📅 Reading History
          </Text>
          <View
            style={[
              styles.calendarContainer,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.ui.border,
              },
            ]}
          >
            <ReadingCalendar
              readings={progressData.readings || {}}
              onDayPress={(date) => {
                console.log('Day pressed:', date);
              }}
            />
          </View>
        </View>

        {/* Empty Badge State */}
        {earnedBadges.length === 0 && upcomingBadges.length === 0 && (
          <View style={styles.section}>
            <EmptyState
              icon="medal-outline"
              title="No Badges Yet"
              message="Start completing your daily readings to unlock badges and celebrate your reading achievements."
              tips={[
                '📖 Complete readings every day to build a streak',
                '🎯 Unlock badges at different milestones',
                '🏆 Share your achievements with friends',
              ]}
            />
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Badge Unlocked Animation */}
      {unlockedBadge && (
        <BadgeUnlockedAnimation
          visible={showBadgeAnimation}
          badge={unlockedBadge}
          onDismiss={handleDismissBadgeAnimationWithQueue}
          autoDismissMs={3000}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },

  scrollView: {
    flex: 1,
  },

  gradientHeader: {
    paddingVertical: Spacing.lg,
  },

  headerGradient: {
    paddingVertical: Spacing.lg,
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },

  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  avatarText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },

  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  headerGreeting: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: 2,
    letterSpacing: 0.3,
  },

  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary.main + '20',
  },

  // Statistics
  statsSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.md,
    overflow: 'hidden',
  },

  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginVertical: Spacing.xs,
    textAlign: 'center',
  },

  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },

  // Calendar
  calendarContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },

  loadingText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  errorTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },

  retryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },

  emptyMessage: {
    fontSize: FontSizes.md,
    textAlign: 'center',
  },

  emptyBadgesContainer: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },

  emptyBadgesText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },

  // Bottom Spacing
  bottomSpacer: {
    height: Spacing.xl,
  },
});
