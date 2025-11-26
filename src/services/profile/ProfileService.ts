/**
 * Profile Service
 * Phase 10C.2: User Profile Management
 *
 * Manages user profile operations:
 * - Get/update user profiles
 * - Calculate statistics from sessions
 * - Retrieve user achievements
 * - Check for new achievement unlocks
 * - Batch profile updates
 *
 * Features:
 * - Firestore persistence
 * - Local caching
 * - Statistics calculation
 * - Achievement checking
 * - Error handling
 */

import {
  UserProfile,
  Achievement,
  Statistics,
  ProfileUpdate,
  createDefaultUserProfile,
  DEFAULT_ACHIEVEMENTS,
  StatisticsTimeRange,
} from '@/types/subscription.types';
import { firestoreService } from '../firebase/FirestoreService';

interface CachedProfile {
  profile: UserProfile;
  timestamp: number;
}

/**
 * Profile Service - manages user profiles and related data
 * Singleton pattern for consistency across app
 */
class ProfileService {
  private profileCache: Map<string, CachedProfile> = new Map();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
  private isInitialized = false;

  /**
   * Initialize profile service
   * Performs setup and validation
   */
  async initialize(): Promise<void> {
    try {
      console.log('[ProfileService] Initializing');
      // Additional initialization logic can be added here
      this.isInitialized = true;
      console.log('[ProfileService] ✅ Initialized');
    } catch (error) {
      console.error('[ProfileService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get user profile from Firestore or cache
   * Falls back to default profile if not found
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      // Check cache first
      const cached = this.profileCache.get(userId);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
        console.log('[ProfileService] Returning cached profile for', userId);
        return cached.profile;
      }

      console.log('[ProfileService] Fetching profile for', userId);

      // Try to fetch from Firestore
      const profile = await firestoreService.loadProfile(userId);
      if (profile) {
        this.updateCache(userId, profile);
        return profile;
      }

      // Fall back to default profile if not found in Firestore
      const defaultProfile = createDefaultUserProfile(userId, `user-${userId}@readingdaily.app`);
      this.updateCache(userId, defaultProfile);
      return defaultProfile;
    } catch (error) {
      console.error('[ProfileService] Error getting profile:', error);
      const defaultProfile = createDefaultUserProfile(userId, `user-${userId}@readingdaily.app`);
      return defaultProfile;
    }
  }

  /**
   * Update user profile
   * Only updates provided fields
   */
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<void> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      console.log('[ProfileService] Updating profile for', userId);

      // Get current profile
      const currentProfile = await this.getProfile(userId);

      // Merge updates
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: Date.now(),
      };

      // Validate profile
      this.validateProfile(updatedProfile);

      // Save to Firestore
      const saved = await firestoreService.saveProfile(userId, updatedProfile);
      if (!saved) {
        console.warn('[ProfileService] Profile save queued for offline processing');
      }

      // Update cache
      this.updateCache(userId, updatedProfile);

      console.log('[ProfileService] Profile updated for', userId);
    } catch (error) {
      console.error('[ProfileService] Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple profiles
   */
  async batchUpdateProfiles(
    updates: Array<{ userId: string; updates: ProfileUpdate }>
  ): Promise<{ success: number; failed: number }> {
    try {
      console.log('[ProfileService] Batch updating', updates.length, 'profiles');

      let success = 0;
      let failed = 0;

      for (const { userId, updates: profileUpdates } of updates) {
        try {
          await this.updateProfile(userId, profileUpdates);
          success++;
        } catch (error) {
          console.error(`[ProfileService] Failed to update ${userId}:`, error);
          failed++;
        }
      }

      console.log(
        `[ProfileService] Batch update complete: ${success} succeeded, ${failed} failed`
      );
      return { success, failed };
    } catch (error) {
      console.error('[ProfileService] Batch update error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * Loads from Firestore or calculates from profile
   */
  async getStatistics(userId: string, timeRange: StatisticsTimeRange = 'all'): Promise<Statistics> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      console.log('[ProfileService] Getting statistics for', userId, 'timeRange:', timeRange);

      // Try to load from Firestore first
      const statistics = await firestoreService.loadStatistics(userId);
      if (statistics) {
        return statistics;
      }

      // Fall back to calculating from profile
      const profile = await this.getProfile(userId);
      const calculatedStats = this.calculateStatisticsFromProfile(profile, timeRange);

      return calculatedStats;
    } catch (error) {
      console.error('[ProfileService] Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Calculate statistics from profile
   * In a real implementation, this would query practice sessions
   */
  private calculateStatisticsFromProfile(
    profile: UserProfile,
    timeRange: StatisticsTimeRange
  ): Statistics {
    // Determine date range
    const endDate = new Date();
    let startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(endDate.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate mock daily data (in real app, query from database)
    const sessionsByDay: Array<{ date: string; count: number }> = [];
    const scoresByDay: Array<{ date: string; average: number }> = [];
    const minutesByDay: Array<{ date: string; total: number }> = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Mock data - in real app, query actual sessions
      const mockSessions = Math.floor(Math.random() * 3);
      const mockAvgScore = mockSessions > 0 ? Math.floor(Math.random() * 100) : 0;
      const mockMinutes = mockSessions > 0 ? mockSessions * 5 : 0;

      sessionsByDay.push({ date: dateStr, count: mockSessions });
      scoresByDay.push({ date: dateStr, average: mockAvgScore });
      minutesByDay.push({ date: dateStr, total: mockMinutes });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate dimension scores (mock - in real app, from session data)
    const dimensionScores = {
      accuracy: Math.floor(Math.random() * 100),
      fluency: Math.floor(Math.random() * 100),
      completeness: Math.floor(Math.random() * 100),
      prosody: Math.floor(Math.random() * 100),
    };

    return {
      sessionsByDay,
      scoresByDay,
      minutesByDay,
      averageAccuracy: dimensionScores.accuracy,
      averageFluency: dimensionScores.fluency,
      averageCompleteness: dimensionScores.completeness,
      averageProsody: dimensionScores.prosody,
      scoreProgress: profile.averageScore > 0 ? 15 : 0, // Mock: assume 15% improvement
      engagementTrend: 'up', // Mock trend
      averageSessionDuration: profile.totalSessions > 0 ? profile.totalMinutes / profile.totalSessions : 0,
      timeRange,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }

  /**
   * Get all achievements for user
   * Checks for unlocks and returns current status
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      console.log('[ProfileService] Getting achievements for', userId);

      const profile = await this.getProfile(userId);

      // Map default achievements to user's unlock status
      const userAchievements = DEFAULT_ACHIEVEMENTS.map((achievement) => {
        // In real implementation, check if unlocked in database
        const isUnlocked = this.checkAchievementUnlocked(achievement, profile);

        return {
          ...achievement,
          unlockedAt: isUnlocked ? Date.now() : undefined,
          progress: this.calculateAchievementProgress(achievement, profile),
        };
      });

      return userAchievements;
    } catch (error) {
      console.error('[ProfileService] Error getting achievements:', error);
      throw error;
    }
  }

  /**
   * Check if achievement is unlocked
   * Evaluates requirement against profile data
   */
  private checkAchievementUnlocked(achievement: Achievement, profile: UserProfile): boolean {
    const { requirement } = achievement;

    switch (requirement.type) {
      case 'count':
        // Count-based: sessions, readings, etc.
        switch (achievement.id) {
          case 'first_session':
            return profile.totalSessions >= 1;
          case 'ten_sessions':
            return profile.totalSessions >= 10;
          case 'fifty_sessions':
            return profile.totalSessions >= 50;
          case 'hundred_sessions':
            return profile.totalSessions >= 100;
          case 'perfect_score_five':
            // This would need to track perfect scores separately
            return false; // Mock: not tracked yet
          case 'challenge_difficulty_5':
            // This would need session-level difficulty tracking
            return false; // Mock: not tracked yet
          default:
            return false;
        }

      case 'streak':
        // Streak-based: consecutive days
        return profile.streakDays >= requirement.value;

      case 'score':
        // Score-based: single session score
        return profile.bestScore >= requirement.value;

      default:
        return false;
    }
  }

  /**
   * Calculate progress toward achievement
   * Returns 0-100 percentage or value count
   */
  private calculateAchievementProgress(achievement: Achievement, profile: UserProfile): number {
    const { requirement } = achievement;

    switch (requirement.type) {
      case 'count':
        switch (achievement.id) {
          case 'first_session':
            return Math.min(profile.totalSessions, requirement.value);
          case 'ten_sessions':
            return Math.min(profile.totalSessions, requirement.value);
          case 'fifty_sessions':
            return Math.min(profile.totalSessions, requirement.value);
          case 'hundred_sessions':
            return Math.min(profile.totalSessions, requirement.value);
          default:
            return 0;
        }

      case 'streak':
        return Math.min(profile.streakDays, requirement.value);

      case 'score':
        return Math.min(profile.bestScore, requirement.value);

      default:
        return 0;
    }
  }

  /**
   * Check for newly unlocked achievements
   * Returns list of newly unlocked achievements
   */
  async checkForNewAchievements(userId: string): Promise<Achievement[]> {
    try {
      console.log('[ProfileService] Checking for new achievements for', userId);

      const profile = await this.getProfile(userId);
      const achievements = await this.getAchievements(userId);

      // Find newly unlocked achievements
      // In real implementation, compare with previouslyUnlocked list from database
      const newlyUnlocked = achievements.filter((a) => a.unlockedAt && !this.wasUnlockedBefore(a));

      if (newlyUnlocked.length > 0) {
        console.log('[ProfileService] Found', newlyUnlocked.length, 'new achievements');
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('[ProfileService] Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Check if achievement was unlocked before
   * Mock implementation - in real app, track unlock timestamp
   */
  private wasUnlockedBefore(achievement: Achievement): boolean {
    // In a real implementation, check against database
    // For now, assume all are new
    return false;
  }

  /**
   * Update profile with session results
   * Called after practice session completes
   */
  async updateProfileFromSession(userId: string, sessionData: {
    score: number;
    duration: number;
    readingId: string;
  }): Promise<void> {
    try {
      const profile = await this.getProfile(userId);

      // Update statistics
      const updatedProfile: ProfileUpdate = {
        displayName: profile.displayName,
        preferences: profile.preferences,
      };

      // Update aggregate stats in real implementation
      // For now, just mark as updated
      await this.updateProfile(userId, updatedProfile);

      // Check for new achievements
      const newAchievements = await this.checkForNewAchievements(userId);
      if (newAchievements.length > 0) {
        console.log('[ProfileService] New achievements unlocked:', newAchievements.length);
      }
    } catch (error) {
      console.error('[ProfileService] Error updating from session:', error);
    }
  }

  /**
   * Save statistics to Firestore
   * Called after statistics are updated
   */
  async saveStatistics(userId: string, statistics: Statistics): Promise<boolean> {
    try {
      console.log('[ProfileService] Saving statistics for', userId);
      const saved = await firestoreService.saveStatistics(userId, statistics);
      if (!saved) {
        console.warn('[ProfileService] Statistics save queued for offline processing');
      }
      return saved;
    } catch (error) {
      console.error('[ProfileService] Error saving statistics:', error);
      return false;
    }
  }

  /**
   * Listen to real-time profile updates
   * Returns unsubscribe function
   */
  listenToProfile(userId: string, onData: (profile: UserProfile | null) => void): () => void {
    console.log('[ProfileService] Setting up real-time profile listener for', userId);
    return firestoreService.listenToProfile(userId, onData);
  }

  /**
   * Validate profile data
   */
  private validateProfile(profile: UserProfile): void {
    if (!profile.userId) throw new Error('userId is required');
    if (!profile.email) throw new Error('email is required');
    if (!profile.displayName) throw new Error('displayName is required');
    if (profile.averageScore < 0 || profile.averageScore > 100) {
      throw new Error('averageScore must be 0-100');
    }
    if (profile.bestScore < 0 || profile.bestScore > 100) {
      throw new Error('bestScore must be 0-100');
    }
    if (profile.streakDays < 0) throw new Error('streakDays must be non-negative');
    if (profile.totalSessions < 0) throw new Error('totalSessions must be non-negative');
    if (profile.totalMinutes < 0) throw new Error('totalMinutes must be non-negative');
  }

  /**
   * Clear profile cache for user
   */
  clearCache(userId: string): void {
    console.log('[ProfileService] Clearing cache for', userId);
    this.profileCache.delete(userId);
  }

  /**
   * Clear all profile cache
   */
  clearAllCache(): void {
    console.log('[ProfileService] Clearing all profile cache');
    this.profileCache.clear();
  }

  /**
   * Update cache entry
   */
  private updateCache(userId: string, profile: UserProfile): void {
    this.profileCache.set(userId, {
      profile,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.profileCache.size,
      entries: Array.from(this.profileCache.keys()),
    };
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      console.log('[ProfileService] Shutting down');
      this.profileCache.clear();
      this.isInitialized = false;
      console.log('[ProfileService] ✅ Shutdown complete');
    } catch (error) {
      console.error('[ProfileService] Error during shutdown:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();

// Export class for testing
export { ProfileService };
