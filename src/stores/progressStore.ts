/**
 * Progress Store
 *
 * Zustand store for managing progress state globally
 * Handles streaks, badges, reading history, and statistics
 *
 * Phase E: Progress Tracking
 * Created: November 8, 2025
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ProgressService } from '@/services/progress/ProgressService';
import { ProgressData, Badge } from '@/types/progress.types';

/**
 * Progress Store State
 *
 * Holds all progress-related state
 */
interface ProgressState {
  // Data
  progressData: ProgressData | null;
  newlyEarnedBadges: Badge[];

  // UI State
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  fetchProgress: (userId: string) => Promise<void>;
  recordReading: (userId: string, date: string) => Promise<void>;
  refreshBadges: (userId: string) => Promise<void>;
  updateReadingMetadata: (
    userId: string,
    date: string,
    metadata: {
      audioUsed?: boolean;
      pronunciationUsed?: boolean;
      duration?: number;
    }
  ) => Promise<void>;
  clearNewlyEarned: () => void;
  reset: () => void;
}

/**
 * Create Progress Store
 *
 * Uses Zustand with Immer middleware for immutable updates
 */
export const useProgressStore = create<ProgressState>()(
  immer((set, get) => {
    // Initialize service
    const progressService = new ProgressService();

    return {
        // ==================== INITIAL STATE ====================
        progressData: null,
        newlyEarnedBadges: [],
        loading: false,
        error: null,
        lastUpdated: null,

        // ==================== ACTIONS ====================

        /**
         * Fetch complete progress dashboard for a user
         *
         * Loads:
         * - Current streak data
         * - All badge progress
         * - Reading history (90 days)
         * - Aggregate statistics
         *
         * @param userId - User ID to fetch progress for
         * @throws Error if fetch fails
         */
        fetchProgress: async (userId: string) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const data = await progressService.getProgressDashboard(userId);

            set((state) => {
              state.progressData = data;
              state.loading = false;
              state.lastUpdated = new Date();
              state.error = null;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress';

            set((state) => {
              state.loading = false;
              state.error = errorMessage;
              state.progressData = null;
            });

            throw error;
          }
        },

        /**
         * Record a reading for a specific date
         *
         * Steps:
         * 1. Record reading in Firestore
         * 2. Update local streak data
         * 3. Check for newly earned badges
         * 4. Refresh progress dashboard
         *
         * @param userId - User ID
         * @param date - Reading date (YYYY-MM-DD)
         * @throws Error if recording fails
         */
        recordReading: async (userId: string, date: string) => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            // Record the reading
            await progressService.recordReading(userId, date, 'full');

            // Fetch updated progress
            const updatedData = await progressService.getProgressDashboard(userId);

            // Check for newly earned badges
            const oldBadges = get().progressData?.badges || [];
            const newBadges = updatedData.badges || [];

            const newlyEarned: Badge[] = [];

            // Compare old and new badges to find newly earned ones
            for (const newBadge of newBadges) {
              const oldBadge = oldBadges.find((b) => b.badgeId === newBadge.badgeId);

              // If badge is now earned but wasn't before
              if (newBadge.earned && (!oldBadge || !oldBadge.earned)) {
                // Find the badge definition
                const { BADGES } = await import('@/services/progress/badges');
                const badgeDefinition = BADGES[newBadge.badgeId];

                if (badgeDefinition) {
                  newlyEarned.push(badgeDefinition);
                }
              }
            }

            set((state) => {
              state.progressData = updatedData;
              state.newlyEarnedBadges = newlyEarned;
              state.loading = false;
              state.lastUpdated = new Date();
              state.error = null;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to record reading';

            set((state) => {
              state.loading = false;
              state.error = errorMessage;
            });

            throw error;
          }
        },

        /**
         * Refresh badge data
         *
         * Checks current progress against all badge conditions
         * and awards any newly earned badges
         *
         * @param userId - User ID
         * @throws Error if refresh fails
         */
        refreshBadges: async (userId: string) => {
          try {
            // Check and award badges
            const newlyEarned = await progressService.checkAndAwardBadges(userId);

            // Fetch updated progress
            const updatedData = await progressService.getProgressDashboard(userId);

            set((state) => {
              state.progressData = updatedData;
              state.newlyEarnedBadges = newlyEarned;
              state.lastUpdated = new Date();
              state.error = null;
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh badges';

            set((state) => {
              state.error = errorMessage;
            });

            throw error;
          }
        },

        /**
         * Update reading metadata
         *
         * Called after a reading is complete to add metadata:
         * - Audio playback used
         * - Pronunciation practice used
         * - Duration of reading session
         *
         * @param userId - User ID
         * @param date - Reading date
         * @param metadata - Metadata to update
         * @throws Error if update fails
         */
        updateReadingMetadata: async (userId: string, date: string, metadata) => {
          try {
            await progressService.updateReadingMetadata(userId, date, metadata);

            // Update reading in local state if it exists
            set((state) => {
              if (state.progressData?.readings[date]) {
                if (metadata.audioUsed !== undefined) {
                  state.progressData.readings[date].audioUsed = metadata.audioUsed;
                }
                if (metadata.pronunciationUsed !== undefined) {
                  state.progressData.readings[date].pronunciationUsed = metadata.pronunciationUsed;
                }
                if (metadata.duration !== undefined) {
                  state.progressData.readings[date].duration = metadata.duration;
                }
              }
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update reading metadata';

            set((state) => {
              state.error = errorMessage;
            });

            throw error;
          }
        },

        /**
         * Clear newly earned badges array
         *
         * Called after showing the badge unlock celebration
         * to dismiss the notification
         */
        clearNewlyEarned: () => {
          set((state) => {
            state.newlyEarnedBadges = [];
          });
        },

        /**
         * Reset store to initial state
         *
         * Used when user logs out or needs to clear progress data
         */
        reset: () => {
          set((state) => {
            state.progressData = null;
            state.newlyEarnedBadges = [];
            state.loading = false;
            state.error = null;
            state.lastUpdated = null;
          });
        },
      };
    })
);

/**
 * Progress Store Selectors
 *
 * Convenience selectors for accessing specific parts of state
 */

/**
 * Get current streak
 */
export const useCurrentStreak = () =>
  useProgressStore((state) => state.progressData?.streaks.currentStreak ?? 0);

/**
 * Get longest streak
 */
export const useLongestStreak = () =>
  useProgressStore((state) => state.progressData?.streaks.longestStreak ?? 0);

/**
 * Get all badge progress
 */
export const useBadges = () => useProgressStore((state) => state.progressData?.badges ?? []);

/**
 * Get earned badges only
 */
export const useEarnedBadges = () =>
  useProgressStore((state) => state.progressData?.badges.filter((b) => b.earned) ?? []);

/**
 * Get uneearned badges with progress
 */
export const useUnearnedBadges = () =>
  useProgressStore((state) => state.progressData?.badges.filter((b) => !b.earned) ?? []);

/**
 * Get newly earned badges (for celebration animation)
 */
export const useNewlyEarnedBadges = () => useProgressStore((state) => state.newlyEarnedBadges);

/**
 * Get progress statistics
 */
export const useProgressStats = () => useProgressStore((state) => state.progressData?.stats);

/**
 * Get reading history
 */
export const useReadingHistory = () => useProgressStore((state) => state.progressData?.readings ?? {});

/**
 * Get loading state
 */
export const useProgressLoading = () => useProgressStore((state) => state.loading);

/**
 * Get error state
 */
export const useProgressError = () => useProgressStore((state) => state.error);

/**
 * Get last update time
 */
export const useProgressLastUpdated = () => useProgressStore((state) => state.lastUpdated);
