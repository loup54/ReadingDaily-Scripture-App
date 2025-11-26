/**
 * Progress Service
 *
 * Handles all progress tracking operations including:
 * - Streak calculation and management
 * - Reading recording
 * - Badge checking and awarding
 * - Progress queries and aggregation
 *
 * Phase E: Progress Tracking
 * Created: November 8, 2025
 */

import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  Badge,
  BadgeProgress,
  StreakData,
  ReadingRecord,
  ProgressData,
  ProgressStats,
  ProgressError,
  FirestoreStreaksData,
  FirestoreBadgeData,
  FirestoreReadingData,
} from '@/types/progress.types';
import { BADGES } from './badges';

/**
 * ProgressService
 *
 * Service for managing user progress, streaks, badges, and reading history
 */
export class ProgressService {
  private readonly PROGRESS_COLLECTION = 'progress';
  private readonly STREAKS_DOC = 'streaks';
  private readonly BADGES_DOC = 'badges';
  private readonly READINGS_DOC = 'readings';
  private readonly STREAK_RESET_DAYS = 2; // Streak resets after 2 days of no reading

  /**
   * Calculate user's current streak
   *
   * Logic:
   * - If read today: increment streak
   * - If last read yesterday: increment streak
   * - If gap >= 2 days: reset streak to 1
   *
   * @param userId - User ID
   * @returns Streak data
   * @throws ProgressError if calculation fails
   */
  async calculateStreak(userId: string): Promise<StreakData> {
    try {
      const streakRef = doc(db, 'users', userId, this.PROGRESS_COLLECTION, this.STREAKS_DOC);
      const streakSnap = await getDoc(streakRef);

      // Default streak data for new users
      if (!streakSnap.exists()) {
        const defaultStreak: StreakData = {
          currentStreak: 0,
          longestStreak: 0,
          lastReadingDate: new Date(), // Today's date for new users
          totalReadings: 0,
          totalDays: 0,
          joinedDate: new Date(),
          lastUpdated: new Date(),
        };
        return defaultStreak;
      }

      const firestoreData = streakSnap.data() as FirestoreStreaksData;
      const lastReadingDate = firestoreData.lastReadingDate?.toDate?.() || new Date();

      const streak: StreakData = {
        currentStreak: firestoreData.currentStreak || 0,
        longestStreak: firestoreData.longestStreak || 0,
        lastReadingDate,
        totalReadings: firestoreData.totalReadings || 0,
        totalDays: firestoreData.totalDays || 0,
        joinedDate: firestoreData.joinedDate?.toDate?.() || new Date(),
        lastUpdated: firestoreData.lastUpdated?.toDate?.() || new Date(),
      };

      return streak;
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to calculate streak for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Record a reading for a specific date
   *
   * - Creates/updates reading record in Firestore
   * - Updates streak if applicable
   * - Checks for new badge awards
   *
   * @param userId - User ID
   * @param date - Reading date (YYYY-MM-DD format)
   * @param readingType - Type of reading ('full' or 'quick')
   * @throws ProgressError if recording fails
   */
  async recordReading(
    userId: string,
    date: string,
    readingType: 'full' | 'quick' = 'full'
  ): Promise<void> {
    try {
      // Use transaction to ensure atomicity
      await runTransaction(db, async (transaction) => {
        const readingsRef = doc(db, 'users', userId, this.PROGRESS_COLLECTION, this.READINGS_DOC);
        const streakRef = doc(db, 'users', userId, this.PROGRESS_COLLECTION, this.STREAKS_DOC);

        // 1. Record the reading
        const readingData: FirestoreReadingData = {
          date,
          readingType,
          timestamp: Timestamp.now(),
          readingCount: 3, // Gospel + First Reading + Psalm
          audioUsed: false, // Will be updated by app if audio used
          pronunciationUsed: false, // Will be updated if pronunciation used
          duration: 0, // Will be updated based on actual duration
        };

        // Update the readings document with the new reading (keyed by date)
        transaction.set(readingsRef, { [date]: readingData }, { merge: true });

        // 2. Update streak
        const streakData = await this.calculateStreak(userId);
        const today = this.getDateString(new Date());
        const lastReadingDateStr = this.getDateString(streakData.lastReadingDate);

        let newCurrentStreak = streakData.currentStreak;
        let newLongestStreak = streakData.longestStreak;

        // Calculate days since last reading
        const daysSinceLastReading = this.getDaysDifference(lastReadingDateStr, today);

        if (daysSinceLastReading === 0) {
          // Already read today, don't increment again
          newCurrentStreak = streakData.currentStreak || 1;
        } else if (daysSinceLastReading === 1) {
          // Read yesterday, continue streak
          newCurrentStreak = (streakData.currentStreak || 0) + 1;
        } else if (daysSinceLastReading >= this.STREAK_RESET_DAYS) {
          // Gap too large, reset streak
          newCurrentStreak = 1;
        } else {
          // Shouldn't happen (negative or fractional days)
          newCurrentStreak = streakData.currentStreak || 1;
        }

        // Update longest streak if current exceeds it
        newLongestStreak = Math.max(newCurrentStreak, streakData.longestStreak || 0);

        const updatedStreak = {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastReadingDate: Timestamp.now(),
          totalReadings: (streakData.totalReadings || 0) + 1,
          totalDays: daysSinceLastReading !== 0 ? (streakData.totalDays || 0) + 1 : streakData.totalDays,
          lastUpdated: Timestamp.now(),
        };

        transaction.set(streakRef, updatedStreak, { merge: true });
      });

      // 3. Check and award badges (after transaction completes)
      await this.checkAndAwardBadges(userId);
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to record reading for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Check user's progress and award any new badges
   *
   * Evaluates all badges against user's current progress
   * and awards badges that have been newly earned
   *
   * @param userId - User ID
   * @returns Array of newly earned badges (empty if none)
   * @throws ProgressError if check fails
   */
  async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    try {
      const streakData = await this.calculateStreak(userId);
      const badgeRef = doc(db, 'users', userId, this.PROGRESS_COLLECTION, this.BADGES_DOC);
      const badgeSnap = await getDoc(badgeRef);
      const existingBadges = (badgeSnap.data() as FirestoreBadgeData) || {};

      const newlyEarned: Badge[] = [];
      const updatedBadges: FirestoreBadgeData = { ...existingBadges };

      // Check each badge against current progress
      for (const [badgeId, badgeDefinition] of Object.entries(BADGES)) {
        const alreadyEarned = existingBadges[badgeId]?.earned || false;

        if (alreadyEarned) {
          continue; // Skip already earned badges
        }

        // Check if badge should be awarded
        const shouldAward = this.evaluateBadgeCondition(badgeDefinition, streakData);

        if (shouldAward) {
          updatedBadges[badgeId] = {
            earned: true,
            earnedDate: Timestamp.now(),
            progress: {
              current: this.getProgressValue(badgeDefinition, streakData),
              required: badgeDefinition.requirement.value,
            },
          };
          newlyEarned.push(badgeDefinition);
        } else {
          // Update progress for unearned badges
          const currentValue = this.getProgressValue(badgeDefinition, streakData);
          if (currentValue < badgeDefinition.requirement.value) {
            updatedBadges[badgeId] = {
              earned: false,
              progress: {
                current: currentValue,
                required: badgeDefinition.requirement.value,
              },
            };
          }
        }
      }

      // Save updated badge data
      if (Object.keys(updatedBadges).length > 0) {
        await setDoc(badgeRef, updatedBadges);
      }

      return newlyEarned;
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to check badges for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get all badges for a user with their progress
   *
   * @param userId - User ID
   * @returns Array of badge progress for all badges
   * @throws ProgressError if query fails
   */
  async getUserBadges(userId: string): Promise<BadgeProgress[]> {
    try {
      const badgeRef = doc(db, 'users', userId, this.PROGRESS_COLLECTION, this.BADGES_DOC);
      const badgeSnap = await getDoc(badgeRef);

      if (!badgeSnap.exists()) {
        // Return empty progress for new users
        return Object.entries(BADGES).map(([badgeId, badge]) => ({
          badgeId,
          current: 0,
          required: badge.requirement.value,
          earned: false,
        }));
      }

      const firestoreData = badgeSnap.data() as FirestoreBadgeData;
      const badges: BadgeProgress[] = [];

      for (const [badgeId, badgeDefinition] of Object.entries(BADGES)) {
        const data = firestoreData[badgeId];
        badges.push({
          badgeId,
          current: data?.progress?.current || 0,
          required: data?.progress?.required || badgeDefinition.requirement.value,
          earned: data?.earned || false,
          earnedDate: data?.earnedDate?.toDate?.(),
        });
      }

      return badges;
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to get badges for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get complete progress dashboard data
   *
   * Aggregates streaks, badges, readings, and statistics
   * into a single comprehensive object
   *
   * @param userId - User ID
   * @returns Complete progress data
   * @throws ProgressError if query fails
   */
  async getProgressDashboard(userId: string): Promise<ProgressData> {
    try {
      const [streakData, badges, readings] = await Promise.all([
        this.calculateStreak(userId),
        this.getUserBadges(userId),
        this.getReadingHistory(userId, 90),
      ]);

      const stats = this.calculateStats(streakData, readings);

      const readingsMap: Record<string, ReadingRecord> = {};
      readings.forEach((record) => {
        readingsMap[record.date] = record;
      });

      return {
        streaks: streakData,
        badges,
        readings: readingsMap,
        stats,
      };
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to get progress dashboard for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get reading history for a user
   *
   * Retrieves all reading records within the specified number of days
   * Reads from the readings collection at /users/{userId}/readings/
   * where individual date documents are stored
   *
   * @param userId - User ID
   * @param days - Number of days to look back (default: 90)
   * @returns Array of reading records
   * @throws ProgressError if query fails
   */
  async getReadingHistory(userId: string, days: number = 90): Promise<ReadingRecord[]> {
    try {
      // Query the readings collection at /users/{userId}/readings/
      // This is where individual date documents are stored by the app
      const readingsCollectionRef = collection(db, 'users', userId, 'readings');
      const readingsSnap = await getDocs(readingsCollectionRef);

      if (readingsSnap.empty) {
        return [];
      }

      const records: ReadingRecord[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Convert documents to reading records
      readingsSnap.docs.forEach((doc) => {
        const data = doc.data() as FirestoreReadingData;
        const recordDate = new Date(data.date);

        if (recordDate >= cutoffDate) {
          records.push({
            date: data.date,
            readingType: data.readingType,
            timestamp: data.timestamp?.toDate?.() || new Date(),
            readingCount: data.readingCount || 3,
            audioUsed: data.audioUsed || false,
            pronunciationUsed: data.pronunciationUsed || false,
            duration: data.duration || 0,
          });
        }
      });

      // Sort by date descending
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return records;
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to get reading history for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Update reading metadata (audio used, pronunciation, duration)
   *
   * Called after a reading is completed with additional info
   *
   * @param userId - User ID
   * @param date - Reading date
   * @param metadata - Metadata to update
   */
  async updateReadingMetadata(
    userId: string,
    date: string,
    metadata: Partial<{
      audioUsed: boolean;
      pronunciationUsed: boolean;
      duration: number;
    }>
  ): Promise<void> {
    try {
      const readingsRef = doc(db, 'users', userId, this.PROGRESS_COLLECTION, this.READINGS_DOC);

      // Update the specific reading within the readings document
      const updateData: Record<string, any> = {};
      Object.entries(metadata).forEach(([key, value]) => {
        updateData[`${date}.${key}`] = value;
      });

      await updateDoc(readingsRef, updateData);
    } catch (error) {
      throw new ProgressError(
        'FIRESTORE_ERROR',
        `Failed to update reading metadata for user ${userId}: ${(error as Error).message}`
      );
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Evaluate if user meets badge condition
   *
   * @private
   */
  private evaluateBadgeCondition(badge: Badge, streak: StreakData): boolean {
    switch (badge.requirement.type) {
      case 'readings':
        return streak.totalReadings >= badge.requirement.value;
      case 'consecutive_days':
        return streak.currentStreak >= badge.requirement.value;
      case 'calendar_days':
        // Not implemented yet - would need calendar data
        return false;
      case 'feature_usage':
        // Not implemented yet - would need feature usage tracking
        return false;
      default:
        return false;
    }
  }

  /**
   * Get current progress value for a badge
   *
   * @private
   */
  private getProgressValue(badge: Badge, streak: StreakData): number {
    switch (badge.requirement.type) {
      case 'readings':
        return streak.totalReadings;
      case 'consecutive_days':
        return streak.currentStreak;
      default:
        return 0;
    }
  }

  /**
   * Calculate aggregate statistics
   *
   * @private
   */
  private calculateStats(streak: StreakData, readings: ReadingRecord[]): ProgressStats {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthReadings = readings.filter((r) => new Date(r.date) >= currentMonthStart).length;

    // Consistency: percentage of days in current month with readings
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysSoFar = today.getDate();
    const consistency = daysSoFar > 0 ? Math.round((currentMonthReadings / daysSoFar) * 100) : 0;

    return {
      totalReadings: streak.totalReadings,
      uniqueDaysRead: streak.totalDays,
      currentMonthReadings,
      consistency: Math.min(100, consistency),
    };
  }

  /**
   * Get date string in YYYY-MM-DD format
   *
   * @private
   */
  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate days difference between two date strings
   *
   * @private
   */
  private getDaysDifference(dateStr1: string, dateStr2: string): number {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    const diffTime = date2.getTime() - date1.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

// Export singleton instance
export const progressService = new ProgressService();
