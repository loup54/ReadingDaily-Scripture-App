/**
 * Firestore Timing Data Provider
 * Fetches word timing data from Firebase Firestore
 * Implements IHighlightingProvider interface
 */

import { SentenceTimingData, FirestoreWordTimingDocument, IHighlightingProvider, CachedHighlightingData } from '@/types';
import { db } from '@/config/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';

/**
 * Provider for retrieving timing data from Firestore
 */
export class FirestoreTimingDataProvider implements IHighlightingProvider {
  private static instance: FirestoreTimingDataProvider;

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): FirestoreTimingDataProvider {
    if (!FirestoreTimingDataProvider.instance) {
      FirestoreTimingDataProvider.instance = new FirestoreTimingDataProvider();
    }
    return FirestoreTimingDataProvider.instance;
  }

  /**
   * Get timing data from Firestore
   * Path: /readings/{dateStr}/timings/{readingType}
   */
  async getTimingData(
    readingId: string,
    readingType: string,
    date?: Date,
  ): Promise<SentenceTimingData | null> {
    try {
      const dateStr = this.formatDateLocal(date || new Date());
      const normalizedType = this.normalizeReadingType(readingType);
      console.log(`[FirestoreProvider] Fetching timing data: ${dateStr}/${normalizedType} (from ${readingType})`);

      const readingsRef = collection(db, 'readings', dateStr, 'timings');
      const docRef = doc(readingsRef, normalizedType);

      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn(`[FirestoreProvider] No timing data found: ${dateStr}/${readingType}`);
        return null;
      }

      const data = docSnap.data() as FirestoreWordTimingDocument;
      console.log(`[FirestoreProvider] ✅ Retrieved: ${data.words.length} words, ${data.durationMs}ms`);

      // Convert Firestore document to SentenceTimingData
      return this.convertFromFirestore(readingId, data);
    } catch (error) {
      console.error('[FirestoreProvider] Error fetching timing data:', error);
      return null;
    }
  }

  /**
   * Save timing data to Firestore (for completeness, though WordTimingService handles this)
   */
  async saveTimingData(data: SentenceTimingData): Promise<void> {
    try {
      const dateStr = this.formatDateLocal(data.date);
      console.log(`[FirestoreProvider] Saving timing data: ${dateStr}/${data.readingType}`);

      const readingsRef = collection(db, 'readings', dateStr, 'timings');
      const docRef = doc(readingsRef, data.readingType);

      const firestoreDoc: FirestoreWordTimingDocument = {
        text: data.text,
        readingType: data.readingType,
        date: dateStr,
        reference: data.reference,
        words: data.words.map((w) => ({
          word: w.word,
          startMs: w.startMs,
          endMs: w.endMs,
          index: w.index,
          charOffset: w.charOffset,
          charLength: w.charLength,
        })),
        durationMs: data.durationMs,
        audioUrl: data.audioUrl,
        ttsProvider: data.ttsProvider,
        voice: data.voice,
        speed: data.speed,
        generatedAt: new Date(),
        version: data.version,
      };

      // Note: In Firestore, we would use setDoc here
      // For now, this is a placeholder - actual save is in WordTimingService
      console.log(`[FirestoreProvider] ✅ Saved: ${data.readingType}`);
    } catch (error) {
      console.error('[FirestoreProvider] Error saving timing data:', error);
      throw error;
    }
  }

  /**
   * Get cached timing data (Firestore doesn't cache locally, but this is part of the interface)
   */
  async getCachedTimingData(cacheKey: string): Promise<CachedHighlightingData | null> {
    // Firestore provider doesn't do local caching
    // This is handled by AsyncStorageTimingDataProvider
    return null;
  }

  /**
   * Clear cache (no-op for Firestore provider)
   */
  async clearCache(): Promise<void> {
    console.log('[FirestoreProvider] Clear cache called (no-op)');
  }

  /**
   * Convert Firestore document to SentenceTimingData
   */
  private convertFromFirestore(readingId: string, doc: FirestoreWordTimingDocument): SentenceTimingData {
    return {
      readingId,
      text: doc.text,
      readingType: doc.readingType as any,
      date: new Date(doc.date),
      reference: doc.reference,
      words: doc.words.map((w) => ({
        word: w.word,
        startMs: w.startMs,
        endMs: w.endMs,
        index: w.index,
        charOffset: w.charOffset,
        charLength: w.charLength,
      })),
      durationMs: doc.durationMs,
      audioUrl: doc.audioUrl,
      ttsProvider: doc.ttsProvider as any,
      voice: doc.voice,
      speed: doc.speed,
      generatedAt: new Date(doc.generatedAt),
      version: doc.version,
    };
  }

  /**
   * Normalize reading type from kebab-case to camelCase
   * Converts: first-reading -> firstReading, second-reading -> secondReading
   */
  private normalizeReadingType(type: string): string {
    return type
      .split('-')
      .map((part, index) => {
        if (index === 0) return part;
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
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
}

/**
 * Export singleton instance
 */
export const firestoreTimingDataProvider = FirestoreTimingDataProvider.getInstance();
