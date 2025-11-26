/**
 * Progress Cloud Functions
 *
 * Serverless functions for progress tracking:
 * - Automatic streak calculation
 * - Badge awarding logic
 * - Progress aggregation
 *
 * Phase E: Progress Tracking
 * Created: November 8, 2025
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firestore (already initialized in index.ts)
const db = admin.firestore();

/**
 * Badge Definitions (synced with client-side badges.ts)
 *
 * Each badge has a requirement that must be met
 */
const BADGES = {
  BRONZE_READER: { id: 'bronze_reader', requirement: { type: 'readings', value: 1 } },
  SILVER_READER: { id: 'silver_reader', requirement: { type: 'readings', value: 10 } },
  GOLD_READER: { id: 'gold_reader', requirement: { type: 'readings', value: 50 } },
  PLATINUM_READER: { id: 'platinum_reader', requirement: { type: 'readings', value: 100 } },
  WEEK_WARRIOR: { id: 'week_warrior', requirement: { type: 'consecutive_days', value: 7 } },
  MONTH_MASTER: { id: 'month_master', requirement: { type: 'consecutive_days', value: 30 } },
  YEAR_ROUND: { id: 'year_round', requirement: { type: 'consecutive_days', value: 365 } },
  COMEBACK_KING: { id: 'comeback_king', requirement: { type: 'consecutive_days', value: 7 } },
};

const STREAK_RESET_DAYS = 2; // Streak resets after 2 days of no reading

/**
 * Cloud Function: onReadingRecorded
 *
 * Triggers when a reading is recorded in Firestore
 * Automatically:
 * 1. Calculates and updates streaks
 * 2. Checks and awards badges
 * 3. Updates progress statistics
 *
 * Trigger: Firestore document write to /users/{userId}/progress/readings/{date}
 *
 * @param snap - Firestore document snapshot
 * @param context - Function context with userId and date
 *
 * @example
 * // Reading recorded on 2025-11-08
 * // Function triggers automatically
 * // Updates streak: increments or resets based on last reading date
 * // Checks all badges against current progress
 * // Awards new badges if conditions met
 */
export const onReadingRecorded = functions.firestore
  .document('users/{userId}/readings/{date}')
  .onWrite(async (change, context) => {
    const { userId, date } = context.params;

    try {
      functions.logger.info(`Processing reading for user ${userId} on ${date}`);

      // Get current streak data
      const streakRef = db.collection('users').doc(userId).collection('progress').doc('streaks');
      const streakSnap = await streakRef.get();

      const streakData = streakSnap.data() || {
        currentStreak: 0,
        longestStreak: 0,
        lastReadingDate: null,
        totalReadings: 0,
        totalDays: 0,
        joinedDate: admin.firestore.Timestamp.now(),
        lastUpdated: admin.firestore.Timestamp.now(),
      };

      // Calculate new streak
      const lastReadingDate = streakData.lastReadingDate
        ? new Date(streakData.lastReadingDate.toDate())
        : new Date(0);

      const currentDate = new Date(date);
      const daysSinceLastReading = Math.floor((currentDate.getTime() - lastReadingDate.getTime()) / (1000 * 60 * 60 * 24));

      let newCurrentStreak = streakData.currentStreak || 0;

      if (daysSinceLastReading === 0) {
        // Already read today, don't increment
        newCurrentStreak = streakData.currentStreak || 1;
      } else if (daysSinceLastReading === 1) {
        // Read yesterday, continue streak
        newCurrentStreak = (streakData.currentStreak || 0) + 1;
      } else if (daysSinceLastReading >= STREAK_RESET_DAYS) {
        // Gap too large, reset streak
        newCurrentStreak = 1;
      } else {
        // Edge case (negative or very small)
        newCurrentStreak = streakData.currentStreak || 1;
      }

      // Update longest streak if current exceeds it
      const newLongestStreak = Math.max(newCurrentStreak, streakData.longestStreak || 0);

      // Update total readings and days
      const newTotalReadings = (streakData.totalReadings || 0) + 1;
      const newTotalDays = daysSinceLastReading === 0 ? streakData.totalDays : (streakData.totalDays || 0) + 1;

      // Update streak in Firestore
      // Use set with merge to create document if it doesn't exist (first reading)
      await streakRef.set({
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastReadingDate: admin.firestore.Timestamp.fromDate(currentDate),
        totalReadings: newTotalReadings,
        totalDays: newTotalDays,
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });

      functions.logger.info(`Updated streak for ${userId}: ${newCurrentStreak} days (longest: ${newLongestStreak})`);

      // Check and award badges
      const badgesRef = db.collection('users').doc(userId).collection('progress').doc('badges');
      const badgesSnap = await badgesRef.get();

      const badgesData = badgesSnap.data() || {};
      const updatedBadges: Record<string, any> = { ...badgesData };

      // Evaluate each badge
      for (const [, badgeDefinition] of Object.entries(BADGES)) {
        const badgeId = badgeDefinition.id;

        // Skip if already earned
        if (badgesData[badgeId]?.earned) {
          continue;
        }

        // Check if badge condition is met
        let shouldAward = false;

        if (badgeDefinition.requirement.type === 'readings') {
          shouldAward = newTotalReadings >= badgeDefinition.requirement.value;
        } else if (badgeDefinition.requirement.type === 'consecutive_days') {
          shouldAward = newCurrentStreak >= badgeDefinition.requirement.value;
        }

        // Award badge if condition met
        if (shouldAward) {
          updatedBadges[badgeId] = {
            earned: true,
            earnedDate: admin.firestore.Timestamp.now(),
            progress: {
              current: badgeDefinition.requirement.type === 'readings' ? newTotalReadings : newCurrentStreak,
              required: badgeDefinition.requirement.value,
            },
          };

          functions.logger.info(`Awarded badge ${badgeId} to user ${userId}`);
        } else {
          // Update progress for unearned badges
          const currentValue =
            badgeDefinition.requirement.type === 'readings' ? newTotalReadings : newCurrentStreak;

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

      // Save updated badges
      // Use merge: true to preserve existing badges when updating
      if (Object.keys(updatedBadges).length > 0) {
        await badgesRef.set(updatedBadges, { merge: true });
        functions.logger.info(`Updated ${Object.keys(updatedBadges).length} badge records for ${userId}`);
      }

      functions.logger.info(`Successfully processed reading for user ${userId}`);
    } catch (error) {
      functions.logger.error(`Error processing reading for ${userId}:`, error);
      throw error;
    }
  });

/**
 * Cloud Function: calculateStreaksDaily (Optional - Scheduled)
 *
 * Runs daily at midnight UTC to reset streaks that have expired
 * (optional enhancement - not required for MVP)
 *
 * Could be scheduled with:
 * @param event - Scheduled event
 *
 * @example
 * // Runs daily at 00:00 UTC
 * // Checks all users' streaks
 * // Resets any expired streaks (>2 days since last reading)
 *
 * Not implemented in MVP - included as comment for future enhancement
 */
// export const calculateStreaksDaily = functions.pubsub
//   .schedule('0 0 * * *')  // Daily at midnight UTC
//   .onRun(async (context) => {
//     functions.logger.info('Running daily streak reset job');
//
//     try {
//       const usersRef = db.collection('users');
//       const usersSnap = await usersRef.get();
//
//       let streaksReset = 0;
//
//       for (const userDoc of usersSnap.docs) {
//         const streakRef = userDoc.ref.collection('progress').doc('streaks');
//         const streakSnap = await streakRef.get();
//
//         if (streakSnap.exists) {
//           const streakData = streakSnap.data();
//           const lastReadingDate = streakData.lastReadingDate?.toDate() || new Date(0);
//           const today = new Date();
//
//           const daysSinceLastReading = Math.floor(
//             (today.getTime() - lastReadingDate.getTime()) / (1000 * 60 * 60 * 24)
//           );
//
//           // Reset if > 2 days
//           if (daysSinceLastReading > 2 && streakData.currentStreak > 0) {
//             await streakRef.update({
//               currentStreak: 0,
//               lastUpdated: admin.firestore.Timestamp.now(),
//             });
//             streaksReset++;
//           }
//         }
//       }
//
//       functions.logger.info(`Daily streak reset completed. Reset ${streaksReset} streaks.`);
//     } catch (error) {
//       functions.logger.error('Error in daily streak reset:', error);
//       throw error;
//     }
//   });

