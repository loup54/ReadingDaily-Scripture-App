/**
 * Reading Scraper Cloud Functions
 * Automated daily scraping and manual trigger for USCCB liturgical readings
 *
 * Original vision: 1 week before + 3 weeks after current date (28-day window)
 * Daily update at 1 AM UTC
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { USCCBScraper } from './scrapers/usccb';
import { validateReading, calculateChecksum } from './scrapers/validator';

const logger = functions.logger;

/**
 * Scheduled Scraper - Runs daily at 1 AM UTC
 * Maintains 28-day window: 7 days back + today + 21 days forward
 */
export const scheduledReadingScraper = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      logger.info('🕐 Scheduled scraper triggered');

      // Get current date in US EST timezone (USCCB source timezone)
      const today = new Date();
      const usDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));

      // Calculate 28-day window
      const startDate = new Date(usDate);
      startDate.setDate(startDate.getDate() - 7); // 1 week back

      const endDate = new Date(usDate);
      endDate.setDate(endDate.getDate() + 21); // 3 weeks forward

      let successCount = 0;
      let skipCount = 0;
      let failCount = 0;

      logger.info(`📅 Scraping window: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (28 days)`);

      const scraper = new USCCBScraper();
      const db = admin.firestore();

      // Iterate through all dates in the window
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        try {
          // Check if already exists and is recent
          const docRef = db.collection('readings').doc(dateStr);
          const docSnap = await docRef.get();

          if (docSnap.exists) {
            const data = docSnap.data();
            const metadata = data?.metadata;
            const scrapedAtStr = metadata?.scrapedAt;

            if (scrapedAtStr) {
              // Skip if less than 12 hours old
              const scrapedAt = new Date(scrapedAtStr);
              const ageHours = (Date.now() - scrapedAt.getTime()) / (1000 * 60 * 60);

              if (ageHours < 12) {
                logger.info(`⏭️  Skipping ${dateStr} (${ageHours.toFixed(1)}h old)`);
                skipCount++;
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
              }
            }
          }

          // Scrape reading
          const reading = await scrapeReadingForDate(scraper, currentDate);

          if (reading) {
            // Validate
            const validation = validateReading(reading);

            if (validation.isValid) {
              // Calculate checksum
              const checksum = calculateChecksum(reading);

              // Add metadata
              reading.metadata = {
                ...reading.metadata,
                scrapedAt: new Date().toISOString(),
                checksum,
                validated: true,
                version: '1.0',
                automated: true,
              };

              // Store in Firestore
              await docRef.set(reading);
              successCount++;
              logger.info(`✅ Scraped and stored ${dateStr}`);
            } else {
              logger.error(`❌ Validation failed for ${dateStr}:`, validation.errors);
              failCount++;
            }
          } else {
            logger.error(`❌ Scraping failed for ${dateStr}`);
            failCount++;
          }

        } catch (error) {
          logger.error(`Error processing ${dateStr}:`, error);
          failCount++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Cleanup readings older than 7 days
      const cutoffDate = new Date(usDate);
      cutoffDate.setDate(cutoffDate.getDate() - 8);
      await cleanupOldReadings(cutoffDate);

      logger.info(`🎉 Scheduled scraper complete: ${successCount} scraped, ${skipCount} skipped, ${failCount} failed`);

    } catch (error) {
      logger.error('💥 Scheduled scraper error:', error);
      throw error;
    }
  });

/**
 * Manual Scrape - HTTP endpoint for manual triggering
 * Usage: POST with JSON body: {"date": "2025-10-01"}
 */
export const manualReadingScrape = functions.https.onRequest(async (req, res) => {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    // Parse request
    const data = req.body;
    if (!data || !data.date) {
      res.status(400).json({ error: 'Missing date parameter' });
      return;
    }

    // Parse date
    const dateStr = data.date;
    const targetDate = new Date(dateStr);

    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    logger.info(`Manual scrape requested for ${dateStr}`);

    // Scrape reading
    const scraper = new USCCBScraper();
    const reading = await scrapeReadingForDate(scraper, targetDate);

    if (reading) {
      // Validate
      const validation = validateReading(reading);

      if (validation.isValid) {
        // Calculate checksum
        const checksum = calculateChecksum(reading);

        // Add metadata
        reading.metadata = {
          ...reading.metadata,
          scrapedAt: new Date().toISOString(),
          checksum,
          validated: true,
          version: '1.0',
          manualTrigger: true,
        };

        // Store in Firestore
        const db = admin.firestore();
        const docRef = db.collection('readings').doc(dateStr);
        await docRef.set(reading);

        res.status(200).json({
          success: true,
          date: dateStr,
          source: reading.metadata.source,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Scraping failed',
      });
    }

  } catch (error) {
    logger.error('Manual scrape error:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * USCCB Structure Health Check - HTTP endpoint for monitoring
 * Tests if USCCB HTML structure is still compatible with our scraper
 * Usage: GET https://your-function-url/usccbHealthCheck
 */
export const usccbHealthCheck = functions.https.onRequest(async (req, res) => {
  try {
    logger.info('Running USCCB structure health check');

    // Test with today's date
    const today = new Date();
    const scraper = new USCCBScraper();
    const reading = await scraper.scrape(today);

    const result: any = {
      timestamp: new Date().toISOString(),
      date: today.toISOString().split('T')[0],
      status: 'unknown',
      details: {},
    };

    if (reading) {
      // Check if all expected sections are present
      const hasFirstReading = !!reading.firstReading;
      const hasPsalm = !!reading.psalm;
      const hasGospel = !!reading.gospel;
      const hasLiturgicalInfo = !!reading.liturgicalDate;

      result.details = {
        firstReading: hasFirstReading,
        psalm: hasPsalm,
        secondReading: !!reading.secondReading,
        gospel: hasGospel,
        liturgicalDate: hasLiturgicalInfo,
      };

      // Validation
      const validation = validateReading(reading);
      result.details.validated = validation.isValid;
      if (!validation.isValid) {
        result.details.validationErrors = validation.errors;
      }

      // Overall health status
      if (hasFirstReading && hasPsalm && hasGospel && hasLiturgicalInfo && validation.isValid) {
        result.status = 'healthy';
        result.message = 'USCCB scraper is working correctly';
      } else {
        result.status = 'degraded';
        result.message = 'Some sections are missing or validation failed';
      }

      res.status(200).json(result);
    } else {
      result.status = 'unhealthy';
      result.message = 'Failed to scrape any data from USCCB. HTML structure may have changed.';
      result.details.error = 'Scraping returned null';

      logger.error('Health check failed: scraping returned null');
      res.status(500).json(result);
    }

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      message: 'Health check encountered an error',
      error: String(error),
    });
  }
});

/**
 * Helper: Scrape reading for a specific date
 */
async function scrapeReadingForDate(scraper: USCCBScraper, date: Date): Promise<any | null> {
  try {
    const reading = await scraper.scrape(date);

    if (reading) {
      logger.info(`✅ Scraped from USCCB for ${date.toISOString().split('T')[0]}`);
      return reading;
    }

    // TODO: Add fallback scrapers (Catholic.org, Universalis, etc.)
    logger.warn(`⚠️ All scrapers failed for ${date.toISOString().split('T')[0]}`);
    return null;

  } catch (error) {
    logger.error(`Error scraping for ${date.toISOString().split('T')[0]}:`, error);
    return null;
  }
}

/**
 * Helper: Delete readings older than cutoff date
 */
async function cleanupOldReadings(cutoffDate: Date): Promise<void> {
  try {
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const db = admin.firestore();

    // Query old readings
    const querySnapshot = await db
      .collection('readings')
      .where('date', '<', cutoffStr)
      .get();

    if (querySnapshot.empty) {
      return;
    }

    // Delete in batches
    const batch = db.batch();
    let deleteCount = 0;

    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    await batch.commit();

    if (deleteCount > 0) {
      logger.info(`🗑️ Cleaned up ${deleteCount} old readings before ${cutoffStr}`);
    }

  } catch (error) {
    logger.error('Cleanup error:', error);
  }
}
