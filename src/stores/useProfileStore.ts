/**
 * Profile Store
 * Phase 10C.4: State Management
 *
 * Zustand store for user profile, statistics, and achievements
 *
 * Features:
 * - Profile state management
 * - Statistics caching
 * - Achievement tracking
 * - Loading states
 * - Derived data
 * - Integration with services
 */

import { create } from 'zustand';
import {
  UserProfile,
  Achievement,
  Statistics,
  ProfileUpdate,
  AchievementStats,
  createDefaultUserProfile,
} from '@/types/subscription.types';
import { profileService } from '@/services/profile/ProfileService';
import { achievementService } from '@/services/achievements/AchievementService';
import { firestoreService, SyncStatus } from '@/services/firebase/FirestoreService';

/**
 * Stats summary for quick access
 */
export interface StatsSummary {
  totalSessions: number;
  averageScore: number;
  streakDays: number;
  totalMinutes: number;
  bestScore: number;
}

/**
 * Profile store state and actions
 */
export interface ProfileStoreState {
  // State
  profile: UserProfile | null;
  statistics: Statistics | null;
  achievements: Achievement[];
  achievementStats: AchievementStats | null;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
  syncStatus: SyncStatus;

  // Derived
  statsSummary: StatsSummary | null;
  recentAchievements: Achievement[];
  lockedAchievements: Achievement[];
  nextAchievementToUnlock: Achievement | null;

  // Actions
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  loadStatistics: (userId: string, timeRange?: 'week' | 'month' | 'all') => Promise<void>;
  loadAchievements: (userId: string) => Promise<void>;
  awardAchievement: (userId: string, achievementId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Service listeners
  subscribeToAchievements: (userId: string) => () => void;
  subscribeSyncStatus: () => () => void;
}

/**
 * Create profile store with Zustand
 */
export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  // Initial state
  profile: null,
  statistics: null,
  achievements: [],
  achievementStats: null,
  isLoading: false,
  lastUpdated: null,
  error: null,
  syncStatus: SyncStatus.IDLE,

  // Derived (computed)
  statsSummary: null,
  recentAchievements: [],
  lockedAchievements: [],
  nextAchievementToUnlock: null,

  /**
   * Load user profile
   */
  loadProfile: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const profile = await profileService.getProfile(userId);

      // Compute summary stats
      const statsSummary: StatsSummary = {
        totalSessions: profile.totalSessions,
        averageScore: profile.averageScore,
        streakDays: profile.streakDays,
        totalMinutes: profile.totalMinutes,
        bestScore: profile.bestScore,
      };

      set({
        profile,
        statsSummary,
        lastUpdated: Date.now(),
        isLoading: false,
      });

      console.log('[ProfileStore] Profile loaded for', userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[ProfileStore] Error loading profile:', error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: ProfileUpdate) => {
    try {
      const state = get();
      if (!state.profile?.userId) {
        throw new Error('No user logged in');
      }

      set({ isLoading: true, error: null });

      // Update via service
      await profileService.updateProfile(state.profile.userId, updates);

      // Reload profile
      await get().loadProfile(state.profile.userId);

      console.log('[ProfileStore] Profile updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[ProfileStore] Error updating profile:', error);
    }
  },

  /**
   * Load statistics for time range
   */
  loadStatistics: async (userId: string, timeRange: 'week' | 'month' | 'all' = 'all') => {
    try {
      set({ isLoading: true, error: null });

      const statistics = await profileService.getStatistics(userId, timeRange);

      set({
        statistics,
        lastUpdated: Date.now(),
        isLoading: false,
      });

      console.log('[ProfileStore] Statistics loaded for', timeRange);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[ProfileStore] Error loading statistics:', error);
    }
  },

  /**
   * Load achievements
   */
  loadAchievements: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Get all achievements and stats
      const achievements = await profileService.getAchievements(userId);
      const achievementStats = await achievementService.getAchievementStats(userId);

      // Compute derived data
      const recentAchievements = achievements
        .filter((a) => a.unlockedAt !== undefined)
        .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
        .slice(0, 5);

      const lockedAchievements = achievements.filter((a) => a.unlockedAt === undefined);

      const nextAchievementToUnlock = lockedAchievements.sort((a, b) => {
        const progressA = a.progress || 0;
        const progressB = b.progress || 0;
        const requirementA = a.requirement.value;
        const requirementB = b.requirement.value;

        // Sort by percentage complete (descending)
        const percentA = progressA / requirementA;
        const percentB = progressB / requirementB;
        return percentB - percentA;
      })[0] || null;

      set({
        achievements,
        achievementStats,
        recentAchievements,
        lockedAchievements,
        nextAchievementToUnlock,
        lastUpdated: Date.now(),
        isLoading: false,
      });

      console.log('[ProfileStore] Achievements loaded:', achievements.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load achievements';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[ProfileStore] Error loading achievements:', error);
    }
  },

  /**
   * Award achievement
   */
  awardAchievement: async (userId: string, achievementId: string) => {
    try {
      set({ isLoading: true, error: null });

      const event = await achievementService.awardAchievement(userId, achievementId);

      if (event) {
        // Reload achievements to update state
        await get().loadAchievements(userId);
        console.log('[ProfileStore] Achievement awarded:', achievementId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to award achievement';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[ProfileStore] Error awarding achievement:', error);
    }
  },

  /**
   * Subscribe to achievement unlock events
   */
  subscribeToAchievements: (userId: string) => {
    const unsubscribe = achievementService.onAchievementUnlocked((event) => {
      console.log('[ProfileStore] Achievement unlocked notification:', event.achievementName);

      // Reload achievements to get latest state
      get().loadAchievements(userId);
    });

    return unsubscribe;
  },

  /**
   * Subscribe to sync status changes
   */
  subscribeSyncStatus: () => {
    const unsubscribe = firestoreService.onSyncStatusChange((status) => {
      console.log('[ProfileStore] Sync status changed:', status);
      set({ syncStatus: status });
    });

    return unsubscribe;
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      profile: null,
      statistics: null,
      achievements: [],
      achievementStats: null,
      isLoading: false,
      lastUpdated: null,
      error: null,
      syncStatus: SyncStatus.IDLE,
      statsSummary: null,
      recentAchievements: [],
      lockedAchievements: [],
      nextAchievementToUnlock: null,
    });
    console.log('[ProfileStore] Reset to initial state');
  },
}));

/**
 * Selectors for common use cases
 */

/**
 * Select profile only
 */
export const selectProfile = (state: ProfileStoreState) => state.profile;

/**
 * Select stats summary only
 */
export const selectStatsSummary = (state: ProfileStoreState) => state.statsSummary;

/**
 * Select achievement info
 */
export const selectAchievementInfo = (state: ProfileStoreState) => ({
  achievements: state.achievements,
  stats: state.achievementStats,
  recent: state.recentAchievements,
  next: state.nextAchievementToUnlock,
});

/**
 * Select loading state
 */
export const selectLoading = (state: ProfileStoreState) => state.isLoading;

/**
 * Select all user info (profile + stats + achievements)
 */
export const selectUserInfo = (state: ProfileStoreState) => ({
  profile: state.profile,
  stats: state.statsSummary,
  statistics: state.statistics,
  achievements: state.achievements,
  achievementStats: state.achievementStats,
  recentAchievements: state.recentAchievements,
  nextAchievementToUnlock: state.nextAchievementToUnlock,
});

/**
 * Select subscription info
 */
export const selectSubscription = (state: ProfileStoreState) =>
  state.profile ? {
    tier: state.profile.currentTier,
    startDate: state.profile.subscriptionStartDate,
    endDate: state.profile.subscriptionEndDate,
    totalSpent: state.profile.totalSpent,
  } : null;

/**
 * Select user preferences
 */
export const selectPreferences = (state: ProfileStoreState) =>
  state.profile?.preferences || null;

/**
 * Hooks for common patterns
 */

/**
 * Hook to load all user data
 */
export const useLoadUserData = () => {
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const loadStatistics = useProfileStore((state) => state.loadStatistics);
  const loadAchievements = useProfileStore((state) => state.loadAchievements);
  const subscribeToAchievements = useProfileStore((state) => state.subscribeToAchievements);

  return async (userId: string) => {
    try {
      // Load in parallel
      await Promise.all([
        loadProfile(userId),
        loadStatistics(userId),
        loadAchievements(userId),
      ]);

      // Subscribe to achievement events
      subscribeToAchievements(userId);

      console.log('[useLoadUserData] All user data loaded');
    } catch (error) {
      console.error('[useLoadUserData] Error loading user data:', error);
      throw error;
    }
  };
};

/**
 * Hook to update profile
 */
export const useUpdateProfile = () => {
  return useProfileStore((state) => state.updateProfile);
};

/**
 * Hook to check achievements
 */
export const useLoadAchievements = () => {
  return useProfileStore((state) => state.loadAchievements);
};

/**
 * Hook to award achievement
 */
export const useAwardAchievement = () => {
  return useProfileStore((state) => state.awardAchievement);
};

/**
 * Hook to get current stats
 */
export const useCurrentStats = () => {
  return useProfileStore((state) => state.statsSummary);
};

/**
 * Hook to get achievement stats
 */
export const useAchievementStats = () => {
  return useProfileStore((state) => state.achievementStats);
};

/**
 * Hook to get next achievement
 */
export const useNextAchievement = () => {
  return useProfileStore((state) => state.nextAchievementToUnlock);
};

/**
 * Hook to get recent achievements
 */
export const useRecentAchievements = () => {
  return useProfileStore((state) => state.recentAchievements);
};

/**
 * Hook to check loading state
 */
export const useProfileLoading = () => {
  return useProfileStore((state) => state.isLoading);
};

/**
 * Hook to check error state
 */
export const useProfileError = () => {
  return useProfileStore((state) => state.error);
};

/**
 * Hook to check sync status
 */
export const useSyncStatus = () => {
  return useProfileStore((state) => state.syncStatus);
};
