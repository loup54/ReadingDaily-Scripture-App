/**
 * Reading Service - Real Data Implementation
 * Provides daily liturgical readings from Firebase/Firestore
 * with bundled JSON fallback and offline cache support
 */

import { DailyReadings, Reading } from '@/types/reading.types';
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import bundledReadings from '@/assets/readings-bundle.json';
import { ReadingDownloadService } from '@/services/offline/ReadingDownloadService';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';

/**
 * Format date to YYYY-MM-DD in local timezone
 */
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert Firestore reading data to app format
 */
const convertFirestoreReading = (data: any, date: Date): DailyReadings => {
  // Convert reading sections from Firestore format to app format
  const convertSection = (section: any, type: string): Reading | null => {
    if (!section) return null;

    return {
      id: `${type}_${formatDateLocal(date)}`,
      type: type as any,
      title: section.title || '',
      reference: section.reference || section.citation || '',
      content: section.text || '',
      date: date,
      audioUrl: section.audioUrl || null,
    };
  };

  return {
    id: `readings_${formatDateLocal(date)}`,
    date: date,
    gospel: convertSection(data.gospel, 'gospel')!,
    firstReading: convertSection(data.firstReading, 'first-reading')!,
    psalm: convertSection(data.psalm, 'psalm')!,
    secondReading: convertSection(data.secondReading, 'second-reading'),
    feast: data.liturgicalDate?.feastDay || undefined,
    liturgicalSeason: data.liturgicalDate?.season || 'Ordinary Time',
  };
};

/**
 * Get reading from bundled JSON fallback
 */
const getBundledReading = (dateStr: string, date: Date): DailyReadings | null => {
  try {
    const reading = (bundledReadings as any).readings?.[dateStr];
    if (!reading) {
      console.warn(`No bundled reading found for ${dateStr}`);
      return null;
    }

    return convertFirestoreReading(reading, date);
  } catch (error) {
    console.error('Error loading bundled reading:', error);
    return null;
  }
};

export class ReadingService {
  /**
   * Get daily readings for a specific date
   * Prioritizes offline cache when offline, otherwise uses Firestore
   * Fallback order:
   * 1. Offline cache (if offline)
   * 2. Firestore (if online)
   * 3. Bundled JSON
   * 4. Demo reading
   */
  static async getDailyReadings(date: Date): Promise<DailyReadings> {
    // Format date for Firestore document ID (YYYY-MM-DD)
    const dateStr = formatDateLocal(date);

    // Check if date is in the future (beyond today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(date);
    requestedDate.setHours(0, 0, 0, 0);
    const isFutureDate = requestedDate.getTime() > today.getTime();

    // Check network status
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    // If offline, prioritize cached readings
    if (!isOnline) {
      console.log(`[ReadingService] Device offline, checking cache for ${dateStr}`);
      const cachedReading = await ReadingDownloadService.getCachedReading(date);
      if (cachedReading) {
        console.log(`✅ Using cached offline reading for ${dateStr}`);
        return cachedReading;
      }
    }

    try {
      // Try fetching from Firestore
      console.log(`[ReadingService] Fetching reading for ${dateStr} from Firestore...`);

      const docRef = doc(db, 'readings', dateStr);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Log what fields are in the document
        console.log('[ReadingService] Firestore document fields:', Object.keys(data));
        console.log('[ReadingService] Has gospel?', !!data.gospel);
        console.log('[ReadingService] Has secondReading?', !!data.secondReading);

        // Check if data is fresh (less than 24 hours old)
        if (data.metadata?.scrapedAt) {
          const scrapedAt = new Date(data.metadata.scrapedAt);
          const ageHours = (Date.now() - scrapedAt.getTime()) / (1000 * 60 * 60);

          if (ageHours < 24) {
            console.log(`✅ Using Firestore reading (${ageHours.toFixed(1)}h old)`);
            return convertFirestoreReading(data, date);
          } else {
            console.warn(`⚠️ Firestore reading is stale (${ageHours.toFixed(1)}h old)`);
          }
        } else {
          // No metadata, but use it anyway
          console.log('✅ Using Firestore reading (no timestamp)');
          return convertFirestoreReading(data, date);
        }
      } else {
        console.warn(`No Firestore document found for ${dateStr}`);
      }
    } catch (error) {
      console.error('[ReadingService] Error fetching from Firestore:', error);

      // If online request failed, try offline cache as fallback
      if (isOnline) {
        console.log(`[ReadingService] Firestore failed, checking cache fallback for ${dateStr}`);
        const cachedReading = await ReadingDownloadService.getCachedReading(date);
        if (cachedReading) {
          console.log(`✅ Using cached reading (online request failed)`);
          return cachedReading;
        }
      }
    }

    // Fallback to bundled JSON
    console.log(`[ReadingService] Falling back to bundled JSON for ${dateStr}...`);
    const bundledReading = getBundledReading(dateStr, date);

    if (bundledReading) {
      console.log('✅ Using bundled reading');
      return bundledReading;
    }

    // For future dates, return unavailable message instead of demo data
    if (isFutureDate) {
      console.warn(`⚠️ No data found for future date ${dateStr}, returning unavailable reading`);
      return this.getUnavailableReading(date);
    }

    // Final fallback: Demo reading for testing (only for past/current dates)
    console.warn('⚠️ No data found, using demo reading for testing');
    return this.getDemoReading(date);
  }

  /**
   * Get unavailable reading message for future dates
   */
  private static getUnavailableReading(date: Date): DailyReadings {
    const dateStr = formatDateLocal(date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      id: `readings_${dateStr}_unavailable`,
      date: date,
      gospel: {
        id: `gospel_${dateStr}_unavailable`,
        type: 'gospel',
        title: 'Reading Not Available',
        reference: '',
        content: `Readings for ${formattedDate} are not yet available. Please check back later when the liturgical data is published.`,
        date: date,
        audioUrl: null,
      },
      firstReading: {
        id: `first-reading_${dateStr}_unavailable`,
        type: 'first-reading',
        title: 'Reading Not Available',
        reference: '',
        content: `Readings for ${formattedDate} are not yet available. Please check back later when the liturgical data is published.`,
        date: date,
        audioUrl: null,
      },
      psalm: {
        id: `psalm_${dateStr}_unavailable`,
        type: 'psalm',
        title: 'Reading Not Available',
        reference: '',
        content: `Readings for ${formattedDate} are not yet available. Please check back later when the liturgical data is published.`,
        date: date,
        audioUrl: null,
      },
      secondReading: null,
      feast: undefined,
      liturgicalSeason: 'Unavailable',
    };
  }

  /**
   * Get demo reading for testing when no data is available
   */
  private static getDemoReading(date: Date): DailyReadings {
    const dateStr = formatDateLocal(date);

    return {
      id: `readings_${dateStr}_demo`,
      date: date,
      gospel: {
        id: `gospel_${dateStr}_demo`,
        type: 'gospel',
        title: 'Gospel (Demo)',
        reference: 'John 3:16-17',
        content:
          'For God so loved the world that he gave his only Son, so that everyone who believes in him might not perish but might have eternal life. For God did not send his Son into the world to condemn the world, but that the world might be saved through him.',
        date: date,
        audioUrl: null,
      },
      firstReading: {
        id: `first-reading_${dateStr}_demo`,
        type: 'first-reading',
        title: 'First Reading (Demo)',
        reference: 'Isaiah 55:10-11',
        content:
          'Thus says the LORD: Just as from the heavens the rain and snow come down and do not return there till they have watered the earth, making it fertile and fruitful, giving seed to the one who sows and bread to the one who eats, so shall my word be that goes forth from my mouth; my word shall not return to me void, but shall do my will, achieving the end for which I sent it.',
        date: date,
        audioUrl: null,
      },
      psalm: {
        id: `psalm_${dateStr}_demo`,
        type: 'psalm',
        title: 'Responsorial Psalm (Demo)',
        reference: 'Psalm 23:1-6',
        content:
          'The LORD is my shepherd; there is nothing I lack. In green pastures you let me graze; to safe waters you lead me; you restore my strength. You guide me along the right path for the sake of your name. Even when I walk through a dark valley, I fear no harm for you are at my side; your rod and staff give me courage.',
        date: date,
        audioUrl: null,
      },
      secondReading: null,
      feast: undefined,
      liturgicalSeason: 'Demo Mode',
    };
  }

  /**
   * Get readings for today (user's local timezone)
   */
  static async getTodayReadings(): Promise<DailyReadings> {
    const today = new Date();
    return this.getDailyReadings(today);
  }

  /**
   * Get readings for tomorrow
   */
  static async getTomorrowReadings(): Promise<DailyReadings> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getDailyReadings(tomorrow);
  }

  /**
   * Get readings for yesterday
   */
  static async getYesterdayReadings(): Promise<DailyReadings> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.getDailyReadings(yesterday);
  }

  /**
   * Search readings by reference or content
   * NOTE: This searches only cached/bundled readings
   * For full search, would need backend index
   */
  static async searchReadings(query: string): Promise<Reading[]> {
    // TODO: Implement search across Firestore
    // For now, search only bundled readings
    const results: Reading[] = [];
    const queryLower = query.toLowerCase();

    try {
      const readings = (bundledReadings as any).readings || {};

      for (const [dateStr, reading] of Object.entries(readings as any)) {
        const date = new Date(dateStr);

        // Check gospel
        if (
          reading.gospel?.reference?.toLowerCase().includes(queryLower) ||
          reading.gospel?.text?.toLowerCase().includes(queryLower)
        ) {
          const convertedReading = convertFirestoreReading(reading, date);
          if (convertedReading.gospel) {
            results.push(convertedReading.gospel);
          }
        }

        // Check first reading
        if (
          reading.firstReading?.reference?.toLowerCase().includes(queryLower) ||
          reading.firstReading?.text?.toLowerCase().includes(queryLower)
        ) {
          const convertedReading = convertFirestoreReading(reading, date);
          if (convertedReading.firstReading) {
            results.push(convertedReading.firstReading);
          }
        }

        // Check psalm
        if (
          reading.psalm?.reference?.toLowerCase().includes(queryLower) ||
          reading.psalm?.text?.toLowerCase().includes(queryLower)
        ) {
          const convertedReading = convertFirestoreReading(reading, date);
          if (convertedReading.psalm) {
            results.push(convertedReading.psalm);
          }
        }
      }
    } catch (error) {
      console.error('Error searching readings:', error);
    }

    return results;
  }

  /**
   * Get reading by ID
   * Format: {type}_{date} (e.g., "gospel_2025-10-01")
   */
  static async getReadingById(id: string): Promise<Reading | null> {
    try {
      // Parse ID to extract date and type
      const parts = id.split('_');
      if (parts.length < 2) return null;

      const type = parts[0];
      const dateStr = parts.slice(1).join('_');
      const date = new Date(dateStr);

      // Get the full day's readings
      const readings = await this.getDailyReadings(date);

      // Return the requested reading type
      switch (type) {
        case 'gospel':
          return readings.gospel;
        case 'first-reading':
          return readings.firstReading;
        case 'psalm':
          return readings.psalm;
        case 'second-reading':
          return readings.secondReading || null;
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting reading by ID:', error);
      return null;
    }
  }

  /**
   * Get list of cached reading dates for offline access
   */
  static async getCachedReadingDates(): Promise<string[]> {
    try {
      return await ReadingDownloadService.getDownloadedDates();
    } catch (error) {
      console.error('[ReadingService] Error getting cached reading dates:', error);
      return [];
    }
  }

  /**
   * Check if a reading is cached for offline access
   */
  static async isReadingCached(date: Date): Promise<boolean> {
    try {
      return await ReadingDownloadService.isReadingCached(date);
    } catch (error) {
      console.error('[ReadingService] Error checking if reading is cached:', error);
      return false;
    }
  }
}
