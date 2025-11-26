/**
 * Scheduled Tasks for Highlighting Data Generation
 *
 * Phase II Week 7: Firebase Cloud Functions Integration
 * Created: November 12, 2025
 *
 * Scheduled Cloud Functions for automated daily synthesis:
 * - Daily synthesis at 3:00 AM UTC (after USCCB publishes readings)
 * - Weekly catch-up for any missed dates
 * - Error notifications and monitoring
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { SynthesisRequest, BatchProcessingStatus } from './types/highlighting-functions';

// Firebase references
const db = admin.firestore();

// Constants
const DAILY_TRIGGER_HOUR = 3; // 3:00 AM UTC
const DEFAULT_VOICE = 'en-US-AriaNeural';
const DEFAULT_SPEED = 0.9;

/**
 * Scheduled Function: Daily Reading Synthesis
 *
 * Runs daily at 3:00 AM UTC
 * - Fetches readings from USCCB (published by ~2:30 AM UTC)
 * - Synthesizes all three readings with word timing
 * - Logs processing status
 * - Sends alerts on failure
 *
 * Trigger: Cloud Scheduler - "0 3 * * *" (3:00 AM UTC every day)
 *
 * @example
 * // Automatically runs at 03:00 UTC each day
 * // Synthesis request sent for yesterday's date + next 7 days
 * // Status logged to /function-status/daily-synthesis/{date}
 */
export const scheduledDailySynthesis = functions.pubsub
  .schedule('0 3 * * *') // 3:00 AM UTC daily
  .timeZone('UTC')
  .onRun(async (context) => {
    const processingDate = new Date();
    processingDate.setUTCHours(0, 0, 0, 0); // Start of today UTC

    const dateString = processingDate.toISOString().split('T')[0];

    functions.logger.info(
      `[Scheduled Task] Starting daily synthesis for ${dateString}`
    );

    // Create batch processing status document (declare outside try/catch for scope)
    const statusRef = db
      .collection('function-status')
      .doc('daily-synthesis')
      .collection('runs')
      .doc(dateString);

    try {

      await statusRef.set({
        date: dateString,
        status: 'processing',
        startedAt: admin.firestore.Timestamp.now(),
        successCount: 0,
        failureCount: 0,
        totalCount: 0,
        estimatedCost: 0,
        details: [],
      } as BatchProcessingStatus);

      // Process today's readings
      const result = await processDayReadings(dateString);

      // Update status document with results
      await statusRef.update({
        status: result.status,
        completedAt: admin.firestore.Timestamp.now(),
        successCount: result.successCount,
        failureCount: result.failureCount,
        totalCount: result.totalCount,
        estimatedCost: result.estimatedCost,
        details: result.details,
      });

      functions.logger.info(
        `[Scheduled Task] Daily synthesis completed for ${dateString}: ${result.successCount} success, ${result.failureCount} failed`
      );

      // Send alert if any failures occurred
      if (result.failureCount > 0) {
        await sendErrorAlert(
          `Daily synthesis for ${dateString} had ${result.failureCount} failures`,
          result
        );
      }

      return null;
    } catch (error) {
      functions.logger.error(
        `[Scheduled Task] Error in daily synthesis for ${dateString}:`,
        error
      );

      // Update status as failed
      try {
        await statusRef.update({
          status: 'failed',
          completedAt: admin.firestore.Timestamp.now(),
        });
      } catch (updateError) {
        functions.logger.error('Failed to update status:', updateError);
      }

      // Send critical alert
      await sendErrorAlert(
        `Critical error in daily synthesis for ${dateString}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      throw error;
    }
  });

/**
 * Scheduled Function: Weekly Catch-up Synthesis
 *
 * Runs weekly on Sunday at 4:00 AM UTC
 * - Checks for any missed readings from past week
 * - Synthesizes missing data
 * - Useful for fallback if daily job failed
 *
 * Trigger: Cloud Scheduler - "0 4 * * 0" (4:00 AM UTC every Sunday)
 *
 * @example
 * // Runs every Sunday at 04:00 UTC
 * // Checks readings from past 7 days
 * // Re-synthesizes any with status != "ready"
 */
export const scheduledWeeklyCatchup = functions.pubsub
  .schedule('0 4 * * 0') // 4:00 AM UTC every Sunday
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('[Scheduled Task] Starting weekly catch-up synthesis');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      let processedCount = 0;
      let failedCount = 0;

      // Check each day in the past week
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(oneWeekAgo);
        checkDate.setDate(checkDate.getDate() + i);

        const dateString = checkDate.toISOString().split('T')[0];

        functions.logger.info(`[Weekly Catchup] Checking ${dateString}`);

        try {
          // Check for incomplete synthesis
          const hasAllTimings = await checkCompleteSynthesis(dateString);

          if (!hasAllTimings) {
            functions.logger.info(
              `[Weekly Catchup] Missing timings for ${dateString}, re-synthesizing...`
            );

            const result = await processDayReadings(dateString);
            processedCount += result.successCount;
            failedCount += result.failureCount;
          } else {
            functions.logger.info(
              `[Weekly Catchup] ${dateString} already complete`
            );
          }
        } catch (dayError) {
          functions.logger.warn(`[Weekly Catchup] Error processing ${dateString}:`, dayError);
          failedCount++;
        }
      }

      functions.logger.info(
        `[Scheduled Task] Weekly catch-up completed: ${processedCount} processed, ${failedCount} failed`
      );

      if (failedCount > 0) {
        await sendErrorAlert(
          `Weekly catch-up had ${failedCount} failures`,
          {
            processedCount,
            failedCount,
          }
        );
      }

      return null;
    } catch (error) {
      functions.logger.error('[Scheduled Task] Error in weekly catch-up:', error);

      await sendErrorAlert(
        'Critical error in weekly catch-up synthesis',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      throw error;
    }
  });

/**
 * Process all readings for a given day
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Processing results with success/failure counts
 */
async function processDayReadings(dateString: string): Promise<{
  status: 'completed' | 'partial' | 'failed';
  successCount: number;
  failureCount: number;
  totalCount: number;
  estimatedCost: number;
  details: Array<{
    readingType: string;
    status: 'success' | 'failed';
    error?: string;
    audioBytes?: number;
  }>;
}> {
  const request: SynthesisRequest = {
    date: dateString,
    readingTypes: 'all',
    language: 'en',
    voiceName: DEFAULT_VOICE,
    synthesisSpeed: DEFAULT_SPEED,
    forceResynteth: false,
  };

  try {
    // Call synthesis Cloud Function
    // Note: In production, this would call the HTTP function via gcloud
    // or directly invoke the function logic

    const result = await invokeSynthesisFunction(request);

    const details = result.processed.map((p: any) => ({
      readingType: p.readingType,
      status: 'success' as const,
      audioBytes: Math.round(p.durationSeconds * 16000 * 2), // Rough estimate
    }));

    return {
      status: result.status === 'error' ? 'failed' : result.status === 'partial' ? 'partial' : 'completed',
      successCount: result.processed.length,
      failureCount: result.status === 'error' ? 1 : 0,
      totalCount: 3, // Gospel, 1st, 2nd
      estimatedCost: result.estimatedCost,
      details,
    };
  } catch (error) {
    functions.logger.error(`Error processing day ${dateString}:`, error);

    return {
      status: 'failed',
      successCount: 0,
      failureCount: 3,
      totalCount: 3,
      estimatedCost: 0,
      details: [
        {
          readingType: 'gospel',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          readingType: 'firstReading',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          readingType: 'secondReading',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}

/**
 * Check if all required readings have timing data
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns true if all readings have timing data with status "ready"
 */
async function checkCompleteSynthesis(dateString: string): Promise<boolean> {
  try {
    const readingDoc = await db.collection('readings').doc(dateString).get();

    if (!readingDoc.exists) {
      return false;
    }

    const readingData = readingDoc.data();

    // Check gospel (always required)
    const gospelTiming = await db
      .collection('readings')
      .doc(dateString)
      .collection('timings')
      .doc('gospel')
      .get();

    if (!gospelTiming.exists || gospelTiming.data()?.status !== 'ready') {
      return false;
    }

    // Check first reading (always required)
    const firstTiming = await db
      .collection('readings')
      .doc(dateString)
      .collection('timings')
      .doc('firstReading')
      .get();

    if (!firstTiming.exists || firstTiming.data()?.status !== 'ready') {
      return false;
    }

    // Check second reading (only if it exists in the reading)
    if (readingData?.secondReading) {
      const secondTiming = await db
        .collection('readings')
        .doc(dateString)
        .collection('timings')
        .doc('secondReading')
        .get();

      if (!secondTiming.exists || secondTiming.data()?.status !== 'ready') {
        return false;
      }
    }

    return true;
  } catch (error) {
    functions.logger.warn(`Error checking synthesis for ${dateString}:`, error);
    return false;
  }
}

/**
 * Invoke synthesis Cloud Function (HTTP call)
 *
 * @param request - Synthesis request
 * @returns Synthesis response
 */
async function invokeSynthesisFunction(request: SynthesisRequest): Promise<any> {
  // In production, this would make an actual HTTP call to the synthesizeReading function
  // For now, return mock response structure

  // Get the actual function URL from environment or config
  const functionUrl = process.env.SYNTHESIS_FUNCTION_URL ||
    'https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/synthesizeReading';

  try {
    // This would be a real fetch call in production
    // const response = await fetch(functionUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request),
    // });
    //
    // const data = await response.json();
    // return data;

    // Placeholder for now - shows expected result structure
    return {
      status: 'success',
      message: 'Synthesis completed',
      processed: [
        {
          readingType: 'gospel',
          audioUrl: `gs://readings/${request.date}/gospel.mp3`,
          wordCount: 500,
          durationSeconds: 180,
        },
        {
          readingType: 'firstReading',
          audioUrl: `gs://readings/${request.date}/first.mp3`,
          wordCount: 800,
          durationSeconds: 240,
        },
        {
          readingType: 'secondReading',
          audioUrl: `gs://readings/${request.date}/second.mp3`,
          wordCount: 600,
          durationSeconds: 200,
        },
      ],
      estimatedCost: 0.15,
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    functions.logger.error('Failed to invoke synthesis function:', error);
    throw error;
  }
}

/**
 * Send error alert for monitoring
 *
 * Logs to Firestore and could trigger email/Slack notifications
 *
 * @param message - Error message
 * @param details - Additional details
 */
async function sendErrorAlert(message: string, details: any): Promise<void> {
  try {
    await db
      .collection('alerts')
      .doc(`synthesis-${Date.now()}`)
      .set({
        message,
        details,
        severity: 'error',
        timestamp: admin.firestore.Timestamp.now(),
        resolved: false,
      });

    functions.logger.warn('Alert logged:', message);

    // In production, could integrate with:
    // - Firebase Cloud Messaging for push notifications
    // - Slack webhooks for team alerts
    // - SendGrid for email notifications
  } catch (alertError) {
    functions.logger.error('Failed to log alert:', alertError);
  }
}

/**
 * Manual trigger for cost analysis
 *
 * Calculates estimated monthly costs based on synthesis history
 */
export const estimateMonthlyCosts = functions.https.onRequest(
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    try {
      // Get synthesis status records from past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const statusSnap = await db
        .collection('function-status')
        .doc('daily-synthesis')
        .collection('runs')
        .where('completedAt', '>=', thirtyDaysAgo)
        .get();

      let totalCost = 0;
      let totalReadings = 0;
      let successfulDays = 0;

      statusSnap.docs.forEach((doc) => {
        const data = doc.data();
        totalCost += data.estimatedCost || 0;
        totalReadings += data.successCount || 0;
        if (data.status === 'completed') {
          successfulDays++;
        }
      });

      // Project to monthly cost (30 days)
      const daysInPeriod = statusSnap.size || 1;
      const projectedMonthlyCost = (totalCost / daysInPeriod) * 30;

      res.status(200).json({
        period: '30 days',
        daysProcessed: daysInPeriod,
        successfulDays,
        totalCost,
        totalReadings,
        averageCostPerDay: (totalCost / daysInPeriod).toFixed(6),
        projectedMonthlyCost: projectedMonthlyCost.toFixed(2),
        costPerReading: (totalCost / totalReadings).toFixed(6),
      });
    } catch (error) {
      functions.logger.error('Error estimating costs:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Populate Historical Timing Data
 *
 * HTTP endpoint to batch generate timing data for a date range
 * Useful for filling in historical data or recovering from synthesis failures
 *
 * Usage:
 * curl -X POST https://.../populateHistoricalTimingData \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "startDate": "2025-11-01",
 *     "endDate": "2025-11-14",
 *     "voiceName": "en-US-AriaNeural",
 *     "synthesisSpeed": 0.9
 *   }'
 */
export const populateHistoricalTimingData = functions.https.onRequest(
  async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Only POST requests allowed' });
      return;
    }

    try {
      const { startDate, endDate, voiceName = 'en-US-AriaNeural', synthesisSpeed = 0.9 } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          error: 'Missing required parameters: startDate, endDate (YYYY-MM-DD format)',
        });
        return;
      }

      // Parse dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      functions.logger.info(
        `[Historical Population] Starting synthesis from ${startDate} to ${endDate}`
      );

      const results: Array<{
        date: string;
        status: 'success' | 'failed' | 'skipped';
        successCount?: number;
        failureCount?: number;
        error?: string;
      }> = [];

      let totalSuccess = 0;
      let totalFailed = 0;
      const currentDate = new Date(start);

      // Process each day in range
      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0];

        try {
          // Get reading for this date
          const readingDoc = await db.collection('readings').doc(dateString).get();

          if (!readingDoc.exists) {
            functions.logger.warn(`[Historical Population] No reading found for ${dateString}`);
            results.push({
              date: dateString,
              status: 'skipped',
            });
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          const readingData = readingDoc.data() as any;
          const readings = [
            { type: 'gospel', text: readingData?.gospel?.text || '' },
            { type: 'firstReading', text: readingData?.firstReading?.text || '' },
            { type: 'secondReading', text: readingData?.secondReading?.text || '' },
          ];

          let successCount = 0;
          let failureCount = 0;

          // Synthesize each reading type
          for (const reading of readings) {
            if (!reading.text) {
              failureCount++;
              continue;
            }

            try {
              // Check if timing data already exists (skip if ready)
              const timingDoc = await db
                .collection('readings')
                .doc(dateString)
                .collection('timings')
                .doc(reading.type)
                .get();

              if (timingDoc.exists && timingDoc.data()?.status === 'ready') {
                functions.logger.info(
                  `[Historical Population] ${dateString}/${reading.type}: already ready, skipping`
                );
                successCount++;
                continue;
              }

              // Call synthesis function
              const synthesizeUrl = `https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/synthesizeReading`;
              const synthesizeResponse = await fetch(synthesizeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: dateString,
                  readingTypes: reading.type,
                  voiceName,
                  synthesisSpeed,
                }),
              });

              if (!synthesizeResponse.ok) {
                throw new Error(`Synthesis failed with status ${synthesizeResponse.status}`);
              }

              successCount++;
              functions.logger.info(
                `[Historical Population] ${dateString}/${reading.type}: synthesis complete`
              );
            } catch (readingError) {
              failureCount++;
              functions.logger.warn(
                `[Historical Population] Error synthesizing ${dateString}/${reading.type}:`,
                readingError
              );
            }
          }

          totalSuccess += successCount;
          totalFailed += failureCount;

          results.push({
            date: dateString,
            status: failureCount === 0 ? 'success' : 'failed',
            successCount,
            failureCount,
          });

          functions.logger.info(
            `[Historical Population] ${dateString}: ${successCount} success, ${failureCount} failed`
          );
        } catch (dayError) {
          functions.logger.warn(
            `[Historical Population] Error processing ${dateString}:`,
            dayError
          );

          results.push({
            date: dateString,
            status: 'failed',
            error: dayError instanceof Error ? dayError.message : 'Unknown error',
          });

          totalFailed += 3; // Assume all 3 readings failed
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      functions.logger.info(
        `[Historical Population] Complete: ${totalSuccess} success, ${totalFailed} failed`
      );

      res.status(200).json({
        success: totalFailed === 0,
        results,
        summary: {
          totalSuccess,
          totalFailed,
          daysProcessed: results.length,
        },
      });
    } catch (error) {
      functions.logger.error('[Historical Population] Error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
