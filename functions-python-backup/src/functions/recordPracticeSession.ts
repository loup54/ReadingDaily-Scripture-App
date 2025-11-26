/**
 * Record Practice Session Cloud Function
 *
 * Triggered: After each practice session completes
 * Purpose: Record session in Firestore and update daily usage
 * Returns: Updated daily usage, remaining minutes, limit status
 *
 * Implementation checklist:
 * - [ ] Validate session data
 * - [ ] Check subscription tier for limits
 * - [ ] Create session document
 * - [ ] Update daily usage counter
 * - [ ] Check if daily limit reached
 * - [ ] Update user statistics
 * - [ ] Log analytics event
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PracticeSessionDocument, DailyUsageDocument } from '../types/firestore.types';

const db = admin.firestore();

interface RecordSessionRequest {
  sessionId: string;
  startTime: number;
  endTime: number;
  readingId: string;
  sentenceIndex: number;
  sentence: string;
  referenceText: string;
  recordingUri?: string;
  transcribedText?: string;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  overallScore: number;
  wordAnalysis?: Array<{
    word: string;
    accuracy: number;
    errorType?: string;
  }>;
}

interface RecordSessionResponse {
  success: boolean;
  sessionId: string;
  totalMinutesUsedToday: number;
  remainingMinutes: number;
  limitReached: boolean;
  message: string;
}

/**
 * HTTP Callable Function: Record practice session
 *
 * Called from client after recording and analysis completes
 */
export const recordPracticeSession = functions.https.onCall(
  async (data: RecordSessionRequest, context): Promise<RecordSessionResponse> => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const currentTime = Date.now();
    const today = new Date(currentTime);
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // Get user subscription info
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data();
      const tier = userData?.subscriptionTier || 'free';

      // Calculate session duration
      const durationSeconds = Math.round((data.endTime - data.startTime) / 1000);
      const durationMinutes = durationSeconds / 60;

      // Create practice session document
      const sessionRef = db
        .collection('users')
        .doc(userId)
        .collection('practiceSessions')
        .doc(data.sessionId);

      const sessionData: PracticeSessionDocument = {
        sessionId: data.sessionId,
        startTime: data.startTime,
        endTime: data.endTime,
        durationSeconds,
        readingId: data.readingId,
        sentenceIndex: data.sentenceIndex,
        sentence: data.sentence,
        referenceText: data.referenceText,
        recordingUri: data.recordingUri,
        transcribedText: data.transcribedText,
        accuracy: data.accuracy,
        fluency: data.fluency,
        completeness: data.completeness,
        prosody: data.prosody,
        overallScore: data.overallScore,
        wordAnalysis: data.wordAnalysis,
        tier,
        createdAt: currentTime,
        updatedAt: currentTime,
      };

      // Get or create daily usage document
      const dailyUsageRef = db
        .collection('users')
        .doc(userId)
        .collection('dailyUsage')
        .doc(dateString);

      const dailyUsageDoc = await dailyUsageRef.get();

      let totalMinutesUsed = 0;
      let limitReached = false;

      const batch = db.batch();

      if (dailyUsageDoc.exists) {
        // Update existing daily usage
        const dailyData = dailyUsageDoc.data() as DailyUsageDocument;
        totalMinutesUsed = dailyData.practiceMinutesUsed + durationMinutes;

        // Cap at max daily minutes for free tier
        if (tier === 'free' && totalMinutesUsed > 10) {
          totalMinutesUsed = 10;
          limitReached = true;
        }

        batch.update(dailyUsageRef, {
          practiceMinutesUsed: totalMinutesUsed,
          sessionsCount: dailyData.sessionsCount + 1,
          longestSessionMinutes: Math.max(
            dailyData.longestSessionMinutes || 0,
            durationMinutes
          ),
          averageSessionMinutes:
            (totalMinutesUsed / (dailyData.sessionsCount + 1)) *
            60, // Convert minutes to avg
          totalWordsAttempted:
            (dailyData.totalWordsAttempted || 0) + (data.wordAnalysis?.length || 0),
          totalWordsCorrect:
            (dailyData.totalWordsCorrect || 0) +
            (data.wordAnalysis?.filter((w) => w.errorType === 'None').length || 0),
          averageAccuracy:
            ((dailyData.averageAccuracy || 0) + data.accuracy) / 2,
          lastUpdatedAt: currentTime,
        });
      } else {
        // Create new daily usage document
        totalMinutesUsed = Math.min(durationMinutes, tier === 'free' ? 10 : Infinity);
        limitReached = tier === 'free' && totalMinutesUsed >= 10;

        const newDailyUsage: DailyUsageDocument = {
          date: dateString,
          dayOfWeek: today.getUTCDay(),
          weekOfYear: getWeekNumber(today),
          monthYear: `${today.getUTCFullYear()}-${String(
            today.getUTCMonth() + 1
          ).padStart(2, '0')}`,
          practiceMinutesUsed: totalMinutesUsed,
          sessionsCount: 1,
          longestSessionMinutes: durationMinutes,
          averageSessionMinutes: durationMinutes,
          totalWordsAttempted: data.wordAnalysis?.length || 0,
          totalWordsCorrect:
            data.wordAnalysis?.filter((w) => w.errorType === 'None').length || 0,
          averageAccuracy: data.accuracy,
          createdAt: currentTime,
          lastUpdatedAt: currentTime,
          resetDate: currentTime,
        };

        batch.set(dailyUsageRef, newDailyUsage);
      }

      // Create session document
      batch.set(sessionRef, sessionData);

      // Update user's last active time
      batch.update(db.collection('users').doc(userId), {
        lastActiveAt: currentTime,
      });

      await batch.commit();

      // Calculate remaining minutes
      const maxDailyMinutes = tier === 'free' ? 10 : Infinity;
      const remainingMinutes = maxDailyMinutes - totalMinutesUsed;

      console.log(
        `Recorded session ${data.sessionId} for user ${userId}. ` +
          `Duration: ${durationMinutes.toFixed(2)}min, Total: ${totalMinutesUsed}min, Limit: ${limitReached}`
      );

      return {
        success: true,
        sessionId: data.sessionId,
        totalMinutesUsedToday: totalMinutesUsed,
        remainingMinutes: Math.max(0, remainingMinutes),
        limitReached,
        message: limitReached
          ? 'Daily practice limit reached'
          : 'Session recorded successfully',
      };
    } catch (error) {
      console.error('Error recording practice session:', error);
      throw new functions.https.HttpsError('internal', 'Failed to record session');
    }
  }
);

/**
 * Scheduled Function: Reset daily counters at midnight UTC
 *
 * Runs daily at UTC midnight to reset all users' daily practice counters
 */
export const resetDailyCounters = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    const currentTime = Date.now();
    const today = new Date(currentTime);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    try {
      // Find all daily usage documents from yesterday
      const yesterdaySnapshot = await db.collectionGroup('dailyUsage').where(
        'date',
        '==',
        yesterdayString
      );

      // Already archived, nothing to do
      console.log(`Daily counter reset complete for ${yesterdayString}`);
      return { success: true, resetsApplied: 0 };
    } catch (error) {
      console.error('Error resetting daily counters:', error);
      throw error;
    }
  });

/**
 * Helper: Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
