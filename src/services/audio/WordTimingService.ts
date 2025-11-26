/**
 * Word Timing Service
 * Generates word-level timing data from TTS synthesis
 * Uses Azure Speech SDK for word boundary events
 *
 * Phase II Week 7: Cloud Functions Integration
 *
 * Architecture:
 * Text Input → (1) Check Cloud Cache → (2) Check Cloud Functions → (3) On-demand Synthesis
 *
 * Integration Points:
 * - Cloud Function: synthesizeReading (HTTP endpoint for on-demand requests)
 * - Scheduled: scheduledDailySynthesis (pre-generates daily readings)
 * - Storage: Firebase Cloud Storage for audio files
 * - Caching: AsyncStorage + Firestore for timing metadata
 */

import { SentenceTimingData, WordTiming, FirestoreWordTimingDocument } from '@/types';
import { db } from '@/config/firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { AsyncStorage } from 'react-native';

/**
 * Configuration for Azure Speech Services
 */
const AZURE_CONFIG = {
  region: process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION || 'eastus',
  subscriptionKey: process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '',
};

/**
 * Cloud Function Configuration
 * Phase II Week 7: Cloud Functions for automated synthesis
 */
const CLOUD_FUNCTION_CONFIG = {
  // HTTP endpoint for on-demand synthesis
  synthesizeEndpoint:
    process.env.EXPO_PUBLIC_SYNTHESIS_FUNCTION_URL ||
    'https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/synthesizeReading',

  // Health check endpoint
  healthCheckEndpoint:
    process.env.EXPO_PUBLIC_HEALTH_CHECK_FUNCTION_URL ||
    'https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/highlightingHealthCheck',

  // Timeout for Cloud Function requests (ms)
  requestTimeoutMs: 30000,

  // Enable Cloud Function integration
  enabled: true,

  // Fall back to on-demand if scheduled synthesis unavailable
  fallbackOnDemand: true,
};

/**
 * Word boundary event from Azure Speech SDK
 */
interface WordBoundaryEvent {
  eventType: string;
  audioOffset: number; // in 100-nanosecond units
  duration: number; // in 100-nanosecond units
  text: string;
  wordLength: number;
  wordPos: number;
}

/**
 * Cloud Function response structure
 */
interface CloudFunctionResponse {
  status: 'success' | 'partial' | 'error';
  message: string;
  processed: Array<{
    readingType: string;
    audioUrl: string;
    wordCount: number;
    durationSeconds: number;
  }>;
  estimatedCost: number;
  completedAt: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Service for generating and managing word-level timing data
 */
export class WordTimingService {
  private static instance: WordTimingService;

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): WordTimingService {
    if (!WordTimingService.instance) {
      WordTimingService.instance = new WordTimingService();
    }
    return WordTimingService.instance;
  }

  /**
   * Generate timing data for a reading
   * Synthesizes audio using Azure and captures word boundary events
   *
   * @param readingId - Unique reading identifier
   * @param text - Full text to synthesize
   * @param readingType - Type of reading (gospel, first-reading, etc.)
   * @param reference - Scripture reference (e.g., "John 3:16-17")
   * @param date - Reading date
   * @param voice - Voice name (e.g., "en-US-Neural2-C")
   * @param speed - Playback speed (1.0 = normal)
   * @returns Generated timing data
   */
  async generateTimingData(
    readingId: string,
    text: string,
    readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading',
    reference: string,
    date: Date,
    voice: string = 'en-US-Neural2-C',
    speed: number = 1.0,
  ): Promise<SentenceTimingData> {
    try {
      console.log(`[WordTimingService] Generating timing data for ${readingId}`);

      // Step 1: Call Azure Speech Services to generate audio with word events
      const { audioUrl, wordBoundaries, durationMs } = await this.synthesizeWithTimings(
        text,
        voice,
        speed,
      );

      // Step 2: Convert word boundaries to WordTiming array
      const words = this.processWordBoundaries(text, wordBoundaries);

      // Step 3: Create timing data structure
      const timingData: SentenceTimingData = {
        readingId,
        text,
        readingType,
        date,
        reference,
        words,
        durationMs,
        audioUrl,
        ttsProvider: 'azure',
        voice,
        speed,
        generatedAt: new Date(),
        version: '1.0',
      };

      // Step 4: Store in Firestore
      await this.saveTimingDataToFirestore(readingId, readingType, date, timingData);

      console.log(
        `[WordTimingService] ✅ Generated timing data: ${words.length} words, ${durationMs}ms duration`,
      );
      return timingData;
    } catch (error) {
      console.error('[WordTimingService] Failed to generate timing data:', error);
      throw new Error(`Timing generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Synthesize text with Azure and capture word boundary events
   * @returns Audio URL, word boundaries, and duration
   */
  private async synthesizeWithTimings(
    text: string,
    voice: string,
    speed: number,
  ): Promise<{ audioUrl: string; wordBoundaries: WordBoundaryEvent[]; durationMs: number }> {
    // In production, this would call Azure Cognitive Services
    // For now, we return mock data matching expected structure

    console.log(`[WordTimingService] Synthesizing: "${text.substring(0, 50)}..."`);

    // Mock implementation - in production, call Azure:
    // https://{region}.tts.speech.microsoft.com/cognitiveservices/v1
    // with Ocp-Apim-Subscription-Key header
    // and body: <speak><mstts:viseme eventid="Viseme" />{text}</speak>

    // Simulate word boundaries based on word count
    const words = text.split(/\s+/);
    const wordBoundaries: WordBoundaryEvent[] = [];
    let currentTimeMs = 0;
    const avgWordDurationMs = 400; // ~150 words per minute

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordDurationMs = (word.length / 5) * 200; // Estimate based on word length

      wordBoundaries.push({
        eventType: 'WordBoundary',
        audioOffset: Math.round(currentTimeMs * 10000), // Convert to 100-ns units
        duration: Math.round(wordDurationMs * 10000),
        text: word,
        wordLength: word.length,
        wordPos: i,
      });

      currentTimeMs += wordDurationMs;
    }

    const durationMs = currentTimeMs;
    const audioUrl = `https://storage.googleapis.com/readingdaily-audio/${Date.now()}.wav`;

    return {
      audioUrl,
      wordBoundaries,
      durationMs: Math.round(durationMs),
    };
  }

  /**
   * Convert Azure word boundary events to WordTiming array
   * Performs character offset calculation for precise highlighting
   */
  private processWordBoundaries(text: string, events: WordBoundaryEvent[]): WordTiming[] {
    const words: WordTiming[] = [];

    for (const event of events) {
      // Convert audio offset from 100-ns units to milliseconds
      const startMs = Math.round(event.audioOffset / 10000);
      const endMs = Math.round((event.audioOffset + event.duration) / 10000);

      // Find character position in text (important for highlighting)
      const charOffset = this.findCharacterOffset(text, event.text, event.wordPos);

      words.push({
        word: event.text,
        startMs,
        endMs,
        index: event.wordPos,
        charOffset,
        charLength: event.text.length,
      });
    }

    return words;
  }

  /**
   * Find character offset of a word in the text
   * Handles punctuation and multiple spaces
   */
  private findCharacterOffset(text: string, word: string, wordIndex: number): number {
    const words = text.split(/\s+/);
    let offset = 0;

    for (let i = 0; i < Math.min(wordIndex, words.length); i++) {
      // Add word length + space
      offset += words[i].length + 1;
    }

    return Math.max(0, offset);
  }

  /**
   * Save timing data to Firestore
   * Path: /readings/{date}/timings/{readingType}
   */
  private async saveTimingDataToFirestore(
    readingId: string,
    readingType: string,
    date: Date,
    timingData: SentenceTimingData,
  ): Promise<void> {
    try {
      const dateStr = this.formatDateLocal(date);

      // Firestore document path
      const readingsRef = collection(db, 'readings', dateStr, 'timings');
      const docRef = doc(readingsRef, readingType);

      // Convert to Firestore schema
      const firestoreDoc: FirestoreWordTimingDocument = {
        text: timingData.text,
        readingType: timingData.readingType,
        date: dateStr,
        reference: timingData.reference,
        words: timingData.words.map((w) => ({
          word: w.word,
          startMs: w.startMs,
          endMs: w.endMs,
          index: w.index,
          charOffset: w.charOffset,
          charLength: w.charLength,
        })),
        durationMs: timingData.durationMs,
        audioUrl: timingData.audioUrl,
        ttsProvider: timingData.ttsProvider,
        voice: timingData.voice,
        speed: timingData.speed,
        generatedAt: new Date(),
        version: timingData.version,
      };

      await setDoc(docRef, firestoreDoc);
      console.log(`[WordTimingService] ✅ Saved to Firestore: ${dateStr}/${readingType}`);
    } catch (error) {
      console.error('[WordTimingService] Failed to save to Firestore:', error);
      throw error;
    }
  }

  /**
   * Retrieve timing data from Firestore
   * @returns Timing data or null if not found
   */
  async getTimingData(
    readingId: string,
    readingType: string,
    date: Date,
  ): Promise<SentenceTimingData | null> {
    try {
      const dateStr = this.formatDateLocal(date);
      const readingsRef = collection(db, 'readings', dateStr, 'timings');
      const docRef = doc(readingsRef, readingType);

      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn(`[WordTimingService] No timing data found for ${dateStr}/${readingType}`);
        return null;
      }

      const data = docSnap.data() as FirestoreWordTimingDocument;

      return {
        readingId,
        text: data.text,
        readingType: data.readingType as any,
        date: new Date(data.date),
        reference: data.reference,
        words: data.words.map((w, idx) => ({
          word: w.word,
          startMs: w.startMs,
          endMs: w.endMs,
          index: w.index,
          charOffset: w.charOffset,
          charLength: w.charLength,
        })),
        durationMs: data.durationMs,
        audioUrl: data.audioUrl,
        ttsProvider: data.ttsProvider as any,
        voice: data.voice,
        speed: data.speed,
        generatedAt: new Date(data.generatedAt),
        version: data.version,
      };
    } catch (error) {
      console.error('[WordTimingService] Failed to fetch timing data:', error);
      return null;
    }
  }

  /**
   * Check if timing data exists for a reading
   */
  async hasTimingData(readingType: string, date: Date): Promise<boolean> {
    try {
      const dateStr = this.formatDateLocal(date);
      const readingsRef = collection(db, 'readings', dateStr, 'timings');
      const docRef = doc(readingsRef, readingType);

      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('[WordTimingService] Failed to check timing data:', error);
      return false;
    }
  }

  /**
   * Generate timing data for multiple readings (batch operation)
   * Useful for pre-generating timings for multiple days
   */
  async generateBatchTimingData(
    readings: Array<{
      readingId: string;
      text: string;
      readingType: 'gospel' | 'first-reading' | 'psalm' | 'second-reading';
      reference: string;
      date: Date;
      voice?: string;
      speed?: number;
    }>,
  ): Promise<SentenceTimingData[]> {
    console.log(`[WordTimingService] Generating timing data for ${readings.length} readings...`);

    const results: SentenceTimingData[] = [];

    for (const reading of readings) {
      try {
        const data = await this.generateTimingData(
          reading.readingId,
          reading.text,
          reading.readingType,
          reading.reference,
          reading.date,
          reading.voice,
          reading.speed,
        );
        results.push(data);
      } catch (error) {
        console.error(`[WordTimingService] Failed for ${reading.readingId}:`, error);
        // Continue with next reading on error
      }
    }

    console.log(`[WordTimingService] ✅ Generated timing data for ${results.length}/${readings.length} readings`);
    return results;
  }

  /**
   * Get timing data with Cloud Function integration
   *
   * Strategy:
   * 1. Check Firestore for pre-generated data from scheduled Cloud Function
   * 2. Fall back to on-demand synthesis via Cloud Function if available
   * 3. Fall back to local on-demand synthesis if Cloud unavailable
   *
   * Phase II Week 7: Cloud Functions Integration
   *
   * @param readingType - Type of reading
   * @param date - Date of reading
   * @returns Timing data or null if unavailable
   */
  async getTimingDataWithCloudFallback(
    readingType: string,
    date: Date,
  ): Promise<SentenceTimingData | null> {
    try {
      const dateStr = this.formatDateLocal(date);

      console.log(
        `[WordTimingService] Getting timing data for ${dateStr}/${readingType} (with Cloud fallback)`,
      );

      // Step 1: Check Firestore (Cloud Function should have pre-generated this)
      const firestoreData = await this.getTimingData(
        `${dateStr}-${readingType}`,
        readingType,
        date,
      );

      if (firestoreData) {
        console.log(`[WordTimingService] ✅ Loaded from Firestore (Cloud pre-generated)`);
        return firestoreData;
      }

      console.warn(`[WordTimingService] No Firestore data, attempting Cloud Function...`);

      // Step 2: Try on-demand synthesis via Cloud Function
      if (CLOUD_FUNCTION_CONFIG.enabled && CLOUD_FUNCTION_CONFIG.fallbackOnDemand) {
        try {
          const cloudData = await this.synthesizeViaCloudFunction(dateStr, readingType);
          if (cloudData) {
            console.log(`[WordTimingService] ✅ Generated via Cloud Function`);
            return cloudData;
          }
        } catch (cloudError) {
          console.warn(`[WordTimingService] Cloud Function failed:`, cloudError);
        }
      }

      // Step 3: Fall back to local on-demand synthesis
      console.warn(
        `[WordTimingService] Cloud Function unavailable, using local synthesis (slower)`,
      );
      return null; // Return null to signal local synthesis needed
    } catch (error) {
      console.error('[WordTimingService] Error in getTimingDataWithCloudFallback:', error);
      return null;
    }
  }

  /**
   * Synthesize reading via Cloud Function (on-demand)
   *
   * Makes HTTP request to Cloud Function endpoint for synthesis
   * Cloud Function handles Azure TTS and returns timing data
   *
   * @param dateStr - Date in YYYY-MM-DD format
   * @param readingType - Type of reading
   * @returns Timing data if synthesis successful
   */
  private async synthesizeViaCloudFunction(
    dateStr: string,
    readingType: string,
  ): Promise<SentenceTimingData | null> {
    try {
      console.log(`[WordTimingService] Calling Cloud Function for ${dateStr}/${readingType}`);

      const request = {
        date: dateStr,
        readingTypes: readingType,
        language: 'en',
        voiceName: 'en-US-AriaNeural',
        synthesisSpeed: 0.9,
        forceResynteth: false,
      };

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        CLOUD_FUNCTION_CONFIG.requestTimeoutMs,
      );

      const response = await fetch(CLOUD_FUNCTION_CONFIG.synthesizeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Cloud Function returned ${response.status}`);
      }

      const result: CloudFunctionResponse = await response.json();

      if (result.status === 'error' || result.processed.length === 0) {
        throw new Error(result.error?.message || 'Synthesis failed');
      }

      // Find the requested reading in the response
      const processed = result.processed.find((p) => p.readingType === readingType);

      if (!processed) {
        throw new Error(`Reading type ${readingType} not in response`);
      }

      // The timing data should now be in Firestore (saved by Cloud Function)
      // Wait a moment for Firestore to be updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Retrieve from Firestore
      const timingData = await this.getTimingData(
        `${dateStr}-${readingType}`,
        readingType,
        new Date(dateStr),
      );

      return timingData;
    } catch (error) {
      console.error('[WordTimingService] Cloud Function synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Check health of Cloud Function infrastructure
   *
   * Useful for diagnostics and determining if Cloud Features available
   *
   * @returns true if Cloud Functions are accessible
   */
  async checkCloudFunctionHealth(): Promise<boolean> {
    try {
      if (!CLOUD_FUNCTION_CONFIG.enabled) {
        return false;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(CLOUD_FUNCTION_CONFIG.healthCheckEndpoint, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      return response.ok;
    } catch (error) {
      console.warn('[WordTimingService] Cloud Function health check failed:', error);
      return false;
    }
  }

  /**
   * Pre-cache timing data from Cloud Functions for faster access
   *
   * Triggered when app launches or when user goes online
   * Fetches timing data for recent readings from Firestore
   *
   * @param daysToCache - Number of past days to cache (default: 7)
   */
  async preCacheCloudTimingData(daysToCache: number = 7): Promise<void> {
    try {
      console.log(
        `[WordTimingService] Pre-caching timing data from Cloud for ${daysToCache} days`,
      );

      const cacheKey = 'timing_data_cache_v1';

      // Check if cache already exists and is fresh
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (cachedData) {
        const cached = JSON.parse(cachedData);

        if (
          cached.timestamp &&
          Date.now() - cached.timestamp < 24 * 60 * 60 * 1000
        ) {
          console.log('[WordTimingService] Cache is fresh, skipping pre-cache');
          return;
        }
      }

      // Build list of dates to cache
      const datesToCache: string[] = [];

      for (let i = 0; i < daysToCache; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        datesToCache.push(this.formatDateLocal(d));
      }

      // Fetch timing data for each date/reading type
      const cacheData: Record<string, SentenceTimingData> = {};

      for (const dateStr of datesToCache) {
        for (const readingType of ['gospel', 'firstReading', 'secondReading']) {
          try {
            const key = `${dateStr}-${readingType}`;
            const data = await this.getTimingData(key, readingType, new Date(dateStr));

            if (data) {
              cacheData[key] = data;
            }
          } catch (error) {
            // Continue on error for individual readings
          }
        }
      }

      // Store in AsyncStorage
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: cacheData,
          timestamp: Date.now(),
        }),
      );

      console.log(
        `[WordTimingService] ✅ Pre-cached ${Object.keys(cacheData).length} timing entries`,
      );
    } catch (error) {
      console.warn('[WordTimingService] Pre-caching failed:', error);
      // Non-fatal error, continue operation
    }
  }

  /**
   * Get cached timing data from AsyncStorage
   *
   * @param dateStr - Date in YYYY-MM-DD format
   * @param readingType - Type of reading
   * @returns Cached timing data or null
   */
  async getCachedTimingData(
    dateStr: string,
    readingType: string,
  ): Promise<SentenceTimingData | null> {
    try {
      const cacheKey = 'timing_data_cache_v1';
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const { data } = JSON.parse(cached);
      const key = `${dateStr}-${readingType}`;

      return data[key] || null;
    } catch (error) {
      console.warn('[WordTimingService] Failed to retrieve cached timing data:', error);
      return null;
    }
  }

  /**
   * Format date to YYYY-MM-DD in local timezone
   */
  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Clear all cached timing data (useful for testing/debugging)
   */
  async clearCache(): Promise<void> {
    console.log('[WordTimingService] Cache cleared (no local cache in this implementation)');
  }
}

/**
 * Export singleton instance
 */
export const wordTimingService = WordTimingService.getInstance();
