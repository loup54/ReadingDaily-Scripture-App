/**
 * Profile Screen
 * Phase 10C.5: User Profile Display
 *
 * Main profile screen showing:
 * - User information (header)
 * - Statistics summary
 * - Progress visualization
 * - Achievement gallery
 * - Settings link
 *
 * Features:
 * - Real-time updates from store
 * - Pull-to-refresh
 * - Scrollable layout
 * - Empty states
 * - Loading states
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/stores/useProfileStore';
import { ProfileSkeleton } from '@/components/common/skeletons';
import { EmptyState } from '@/components/common';
import UserHeader from '@/components/profile/UserHeader';
import StatisticsCard from '@/components/profile/StatisticsCard';
import ProgressChart from '@/components/profile/ProgressChart';
import AchievementsGrid from '@/components/profile/AchievementsGrid';
import { ProgressDashboard } from '@/screens/progress/ProgressDashboard';

/**
 * ProfileScreen component
 */
const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);

  // Get store state
  const profile = useProfileStore((state) => state.profile);
  const statistics = useProfileStore((state) => state.statistics);
  const achievements = useProfileStore((state) => state.achievements);
  const isLoading = useProfileStore((state) => state.isLoading);
  const error = useProfileStore((state) => state.error);

  // Get store actions
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const loadStatistics = useProfileStore((state) => state.loadStatistics);
  const loadAchievements = useProfileStore((state) => state.loadAchievements);
  const clearError = useProfileStore((state) => state.clearError);

  /**
   * Load all profile data on mount
   */
  useEffect(() => {
    if (user?.uid) {
      loadAllData();
    }
  }, [user?.uid]);

  /**
   * Load all data
   */
  const loadAllData = async () => {
    if (!user?.uid) return;

    try {
      await Promise.all([
        loadProfile(user.uid),
        loadStatistics(user.uid, 'month'),
        loadAchievements(user.uid),
      ]);
    } catch (err) {
      console.error('[ProfileScreen] Error loading data:', err);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
    } catch (err) {
      console.error('[ProfileScreen] Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Handle error dismiss
   */
  const handleErrorDismiss = () => {
    clearError();
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Please log in to view your profile</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleErrorDismiss}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Skeleton */}
      {isLoading && !profile && <ProfileSkeleton />}

      {/* Profile Content */}
      {profile && (
        <>
          {/* User Header */}
          <UserHeader profile={profile} />

          {/* Statistics Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <StatisticsCard profile={profile} />
          </View>

          {/* Progress Chart */}
          {statistics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progress</Text>
              <ProgressChart statistics={statistics} />
            </View>
          )}

          {/* Achievements Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {achievements.length > 0 ? (
              <AchievementsGrid achievements={achievements} />
            ) : (
              <EmptyState
                icon="medal-outline"
                title="No Achievements Yet"
                message="Earn achievements by completing readings and maintaining your reading streak."
                tips={[
                  '🎯 Read daily to start your streak',
                  '✓ Complete readings consistently',
                  '🏆 Unlock achievements with milestones',
                ]}
              />
            )}
          </View>

          {/* Progress Dashboard Button */}
          <TouchableOpacity
            style={styles.progressButton}
            onPress={() => setShowProgressDashboard(true)}
          >
            <Ionicons name="trending-up" size={18} color="#FFFFFF" />
            <Text style={styles.progressButtonText}>View Detailed Progress</Text>
          </TouchableOpacity>

          {/* Settings Link */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              // Navigate to settings
              console.log('[ProfileScreen] Navigate to settings');
            }}
          >
            <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
          </TouchableOpacity>

          {/* Spacing */}
          <View style={styles.spacing} />
        </>
      )}

      {/* Progress Dashboard Modal */}
      <Modal
        visible={showProgressDashboard}
        onRequestClose={() => setShowProgressDashboard(false)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {user && (
          <ProgressDashboard
            userId={user.uid}
          />
        )}
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FF3B30',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 12,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  emptyStateContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  progressButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#34C759',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  spacing: {
    height: 40,
  },
});

export default ProfileScreen;
