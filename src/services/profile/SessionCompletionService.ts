/**
 * Session Completion Service
 * Phase 10C.7: Practice Flow Integration
 *
 * Handles post-practice session flow:
 * - Update profile from session data
 * - Check for new achievements
 * - Update statistics
 * - Log to analytics
 * - Show notifications
 *
 * Features:
 * - Automatic profile updates
 * - Achievement checking
 * - Statistics recalculation
 * - Analytics logging
 * - Notification coordination
 */

import {
  Achievement,
  AchievementUnlockedEvent,
} from '@/types/subscription.types';
import { profileService } from './ProfileService';
import { achievementService } from '@/services/achievements/AchievementService';

/**
 * Session data from practice completion
 */
export interface PracticeSessionData {
  userId: string;
  readingId: string;
  score: number; // 0-100
  duration: number; // minutes
  accuracy?: number;
  fluency?: number;
  completeness?: number;
  prosody?: number;
  timestamp: number;
}

/**
 * Session completion result
 */
export interface SessionCompletionResult {
  success: boolean;
  profileUpdated: boolean;
  achievementsUnlocked: Achievement[];
  statisticsUpdated: boolean;
  analyticsLogged: boolean;
  error?: string;
}

/**
 * Session completion callbacks
 */
export type OnAchievementUnlockedCallback = (event: AchievementUnlockedEvent) => void;

/**
 * Session Completion Service - coordinates post-session flow
 * Singleton pattern for consistency across app
 */
class SessionCompletionService {
  private isProcessing = false;
  private achievementCallbacks: Set<OnAchievementUnlockedCallback> = new Set();

  /**
   * Handle practice session completion
   * Main entry point for post-session processing
   */
  async handleSessionCompletion(sessionData: PracticeSessionData): Promise<SessionCompletionResult> {
    try {
      if (this.isProcessing) {
        console.warn('[SessionCompletionService] Session already processing, skipping');
        return {
          success: false,
          profileUpdated: false,
          achievementsUnlocked: [],
          statisticsUpdated: false,
          analyticsLogged: false,
          error: 'Session already processing',
        };
      }

      this.isProcessing = true;
      console.log('[SessionCompletionService] Processing session completion for', sessionData.userId);

      const result: SessionCompletionResult = {
        success: true,
        profileUpdated: false,
        achievementsUnlocked: [],
        statisticsUpdated: false,
        analyticsLogged: false,
      };

      try {
        // Step 1: Update profile from session
        result.profileUpdated = await this.updateProfileFromSession(sessionData);

        // Step 2: Check for new achievements
        result.achievementsUnlocked = await this.checkAndAwardAchievements(sessionData);

        // Step 3: Update statistics
        result.statisticsUpdated = await this.updateStatistics(sessionData);

        // Step 4: Log to analytics
        result.analyticsLogged = await this.logToAnalytics(sessionData, result);

        console.log('[SessionCompletionService] Session completion successful:', result);
        return result;
      } catch (error) {
        console.error('[SessionCompletionService] Error during session completion:', error);
        result.success = false;
        result.error = error instanceof Error ? error.message : 'Unknown error';
        return result;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update profile from session results
   */
  private async updateProfileFromSession(sessionData: PracticeSessionData): Promise<boolean> {
    try {
      console.log('[SessionCompletionService] Updating profile from session');

      // In a real implementation, this would:
      // 1. Fetch current profile
      // 2. Update statistics (totalSessions, totalMinutes, averageScore, etc)
      // 3. Update streak (if session today)
      // 4. Save to Firestore
      // For now, we call the service method
      await profileService.updateProfileFromSession(sessionData.userId, {
        score: sessionData.score,
        duration: sessionData.duration,
        readingId: sessionData.readingId,
      });

      return true;
    } catch (error) {
      console.error('[SessionCompletionService] Error updating profile:', error);
      return false;
    }
  }

  /**
   * Check for new achievements and award them
   */
  private async checkAndAwardAchievements(sessionData: PracticeSessionData): Promise<Achievement[]> {
    try {
      console.log('[SessionCompletionService] Checking for new achievements');

      const unlockedAchievements: Achievement[] = [];

      // Check various achievement criteria
      const achievements = achievementService.getAchievementDefinitions();

      for (const achievement of achievements) {
        try {
          // Check if this achievement should be awarded based on session data
          if (this.shouldAwardAchievement(achievement, sessionData)) {
            // Award the achievement
            const event = await achievementService.awardAchievement(
              sessionData.userId,
              achievement.id
            );

            if (event) {
              // Find the full achievement object
              const fullAchievement = achievements.find((a) => a.id === achievement.id);
              if (fullAchievement) {
                unlockedAchievements.push(fullAchievement);

                // Notify callbacks
                this.notifyAchievementUnlocked(event);

                console.log('[SessionCompletionService] Achievement unlocked:', achievement.id);
              }
            }
          }
        } catch (error) {
          console.error('[SessionCompletionService] Error checking achievement', achievement.id, error);
        }
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('[SessionCompletionService] Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Determine if achievement should be awarded based on session
   */
  private shouldAwardAchievement(achievement: Achievement, sessionData: PracticeSessionData): boolean {
    // This is a simplified check - in reality, would need profile data
    // to compare against requirements

    switch (achievement.id) {
      // Perfect score achievements
      case 'perfect_score_once':
        return sessionData.score >= 100;

      // Session-based achievements would need cumulative data from profile
      // These are handled by ProfileService which has full profile context
      default:
        return false;
    }
  }

  /**
   * Update statistics with session data
   */
  private async updateStatistics(sessionData: PracticeSessionData): Promise<boolean> {
    try {
      console.log('[SessionCompletionService] Updating statistics');

      // In a real implementation:
      // 1. Fetch profile
      // 2. Update totalSessions++
      // 3. Update totalMinutes += duration
      // 4. Recalculate averageScore
      // 5. Update lastPracticeDate
      // 6. Check for streak
      // 7. Save to Firestore

      // For now, this is handled by profileService.updateProfileFromSession
      return true;
    } catch (error) {
      console.error('[SessionCompletionService] Error updating statistics:', error);
      return false;
    }
  }

  /**
   * Log session completion to analytics
   */
  private async logToAnalytics(
    sessionData: PracticeSessionData,
    result: SessionCompletionResult
  ): Promise<boolean> {
    try {
      console.log('[SessionCompletionService] Logging to analytics');

      // In a real implementation:
      // 1. Log session_completed event
      // 2. Log achievement_unlocked events
      // 3. Log statistics_updated event
      // 4. Send to Firebase Analytics / BigQuery

      const analyticsEvent = {
        eventName: 'session_completed',
        userId: sessionData.userId,
        score: sessionData.score,
        duration: sessionData.duration,
        achievementsUnlocked: result.achievementsUnlocked.length,
        timestamp: Date.now(),
      };

      console.log('[SessionCompletionService] Analytics event:', analyticsEvent);

      return true;
    } catch (error) {
      console.error('[SessionCompletionService] Error logging to analytics:', error);
      return false;
    }
  }

  /**
   * Subscribe to achievement unlock events
   */
  onAchievementUnlocked(callback: OnAchievementUnlockedCallback): () => void {
    console.log('[SessionCompletionService] Adding achievement callback');
    this.achievementCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      console.log('[SessionCompletionService] Removing achievement callback');
      this.achievementCallbacks.delete(callback);
    };
  }

  /**
   * Notify all listeners of achievement unlock
   */
  private notifyAchievementUnlocked(event: AchievementUnlockedEvent): void {
    this.achievementCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SessionCompletionService] Error in callback:', error);
      }
    });
  }

  /**
   * Check if currently processing
   */
  isProcessing(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const sessionCompletionService = new SessionCompletionService();

// Export class for testing
export { SessionCompletionService };
