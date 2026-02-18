/**
 * Progress Tab Screen
 *
 * Main tab for displaying user progress tracking, streaks, and badges
 * Integrates ProgressDashboard component
 * Phase E: Progress Tracking (Task 2.6)
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { ProgressDashboard } from '@/screens/progress/ProgressDashboard';
import { EmptyState } from '@/components/common';

/**
 * Progress Tab Component
 *
 * Renders the progress dashboard with user's current data
 * Gets user ID from auth store for data fetching
 * Shows sign-in prompt for guest users
 */
export default function ProgressTab() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { colors } = useTheme();

  // Get user ID from auth store
  const userId = user?.id;

  // Guest user - show sign-in prompt with helpful information
  if (!userId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <EmptyState
          icon="stats-chart-outline"
          title="Sign In to Track Progress"
          message="Create an account or sign in to track your reading streaks, earn badges, and view your reading calendar."
          tips={[
            '📊 Track your daily reading streaks',
            '🏆 Earn badges for milestones',
            '📅 View your reading history calendar',
            '🎯 Monitor your reading consistency',
          ]}
          actionButton={{
            label: 'Sign In or Create Account',
            onPress: () => router.push('/(tabs)/settings'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Signed-in user - show progress dashboard
  return <ProgressDashboard userId={userId} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
