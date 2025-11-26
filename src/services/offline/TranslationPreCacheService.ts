/**
 * Translation Pre-Cache Service
 * Pre-caches common scripture words and phrases for offline translation access
 * Reduces API calls and enables offline-first translation workflows
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranslationService } from '@/services/translation/TranslationService';
import { ENV } from '@/config/env';

export interface TranslationCacheProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  currentWord: string;
  currentLanguage: string;
  isProcessing: boolean;
  estimatedTimeMs: number;
}

export interface PreCacheMetadata {
  language: string;
  cachedAt: number;
  wordCount: number;
  phraseCount: number;
  totalSize: number;
}

/**
 * Common scripture words that benefit from pre-caching
 * These are frequently used terms in scripture readings
 */
const SCRIPTURE_WORDS = [
  'Lord',
  'God',
  'Jesus',
  'Christ',
  'Spirit',
  'love',
  'faith',
  'grace',
  'salvation',
  'redemption',
  'covenant',
  'prophet',
  'kingdom',
  'eternal',
  'blessed',
  'righteous',
  'repent',
  'forgive',
  'mercy',
  'justice',
  'wisdom',
  'understand',
  'believe',
  'follow',
  'obey',
  'worship',
  'praise',
  'prayer',
  'hope',
  'peace',
  'truth',
  'light',
  'darkness',
  'sin',
  'temptation',
  'strength',
  'weakness',
  'guidance',
  'counsel',
  'resurrection',
  'judgment',
];

/**
 * Common scripture phrases for translation pre-caching
 */
const SCRIPTURE_PHRASES = [
  'the Lord said',
  'fear of the Lord',
  'kingdom of God',
  'Son of Man',
  'Holy Spirit',
  'good news',
  'everlasting life',
  'love your neighbor',
  'forgive us our sins',
  'thy kingdom come',
  'daily bread',
  'lead us not into temptation',
  'for God so loved',
  'believe in me',
  'the truth shall set you free',
  'blessed are the',
  'take up your cross',
  'greater love hath no man',
  'let there be light',
  'in the beginning',
];

/**
 * Service for pre-caching translations offline
 */
export class TranslationPreCacheService {
  private static readonly CACHE_PREFIX = '@translation_cache_';
  private static readonly PRECACHE_METADATA_KEY = '@translation_precache_metadata';
  private static currentProgress: TranslationCacheProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    percentage: 0,
    currentWord: '',
    currentLanguage: '',
    isProcessing: false,
    estimatedTimeMs: 0,
  };

  /**
   * Pre-cache common scripture words for a language
   */
  static async preCacheWordsForLanguage(
    targetLanguage: string,
    sourceLang: string = 'en'
  ): Promise<{ cached: number; failed: number; totalSize: number }> {
    console.log(
      `[TranslationPreCacheService] Starting pre-cache for language: ${targetLanguage}`
    );

    try {
      this.currentProgress.isProcessing = true;
      this.currentProgress.currentLanguage = targetLanguage;
      this.currentProgress.total = SCRIPTURE_WORDS.length;
      this.currentProgress.completed = 0;
      this.currentProgress.failed = 0;

      let cachedCount = 0;
      let totalSize = 0;
      const startTime = Date.now();

      // Create translation service instance
      const translationService = new TranslationService(
        ENV.GOOGLE_CLOUD_API_KEY,
        true // Enable caching
      );

      for (const word of SCRIPTURE_WORDS) {
        this.currentProgress.currentWord = word;

        try {
          // Check if already cached
          const cacheKey = `${this.CACHE_PREFIX}${word}_${sourceLang}_${targetLanguage}`;
          const cached = await AsyncStorage.getItem(cacheKey);

          if (cached) {
            cachedCount++;
            this.currentProgress.completed++;
            continue;
          }

          // Translate word
          const result = await translationService.translateWord(word, targetLanguage, sourceLang);

          // Store in cache (TranslationService already caches, but we track metadata)
          const cacheEntry = {
            originalText: result.originalText,
            translatedText: result.translatedText,
            sourceLang: result.sourceLang,
            targetLang: result.targetLang,
            cached: false,
          };

          const size = JSON.stringify(cacheEntry).length;
          totalSize += size;

          cachedCount++;
          this.currentProgress.completed++;
          this.currentProgress.percentage = Math.round(
            (this.currentProgress.completed / this.currentProgress.total) * 100
          );

          console.log(
            `[TranslationPreCacheService] Cached "${word}" (${this.currentProgress.percentage}%)`
          );
        } catch (error) {
          console.warn(
            `[TranslationPreCacheService] Failed to cache word "${word}":`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          this.currentProgress.failed++;
          this.currentProgress.completed++;
        }
      }

      // Update metadata
      await this.updateMetadata(targetLanguage, SCRIPTURE_WORDS.length, 0, totalSize);

      this.currentProgress.isProcessing = false;
      const elapsed = Date.now() - startTime;
      this.currentProgress.estimatedTimeMs = elapsed;

      console.log('[TranslationPreCacheService] ✅ Word pre-cache complete:', {
        cached: cachedCount,
        failed: this.currentProgress.failed,
        totalSize: this.formatBytes(totalSize),
        elapsedMs: elapsed,
      });

      return {
        cached: cachedCount,
        failed: this.currentProgress.failed,
        totalSize,
      };
    } catch (error) {
      console.error('[TranslationPreCacheService] Pre-cache failed:', error);
      this.currentProgress.isProcessing = false;
      throw error;
    }
  }

  /**
   * Pre-cache common scripture phrases for a language
   */
  static async preCachePhrasesForLanguage(
    targetLanguage: string,
    sourceLang: string = 'en'
  ): Promise<{ cached: number; failed: number; totalSize: number }> {
    console.log(
      `[TranslationPreCacheService] Starting phrase pre-cache for language: ${targetLanguage}`
    );

    try {
      this.currentProgress.isProcessing = true;
      this.currentProgress.currentLanguage = targetLanguage;
      this.currentProgress.total = SCRIPTURE_PHRASES.length;
      this.currentProgress.completed = 0;
      this.currentProgress.failed = 0;

      let cachedCount = 0;
      let totalSize = 0;
      const startTime = Date.now();

      // Create translation service instance
      const translationService = new TranslationService(
        ENV.GOOGLE_CLOUD_API_KEY,
        true // Enable caching
      );

      for (const phrase of SCRIPTURE_PHRASES) {
        this.currentProgress.currentWord = phrase;

        try {
          // Check if already cached
          const cacheKey = `${this.CACHE_PREFIX}${phrase}_${sourceLang}_${targetLanguage}`;
          const cached = await AsyncStorage.getItem(cacheKey);

          if (cached) {
            cachedCount++;
            this.currentProgress.completed++;
            continue;
          }

          // Translate phrase
          const result = await translationService.translateSentence(
            phrase,
            targetLanguage,
            sourceLang
          );

          // Store metadata
          const cacheEntry = {
            originalText: result.originalText,
            translatedText: result.translatedText,
            sourceLang: result.sourceLang,
            targetLang: result.targetLang,
            cached: false,
          };

          const size = JSON.stringify(cacheEntry).length;
          totalSize += size;

          cachedCount++;
          this.currentProgress.completed++;
          this.currentProgress.percentage = Math.round(
            (this.currentProgress.completed / this.currentProgress.total) * 100
          );

          console.log(
            `[TranslationPreCacheService] Cached phrase "${phrase}" (${this.currentProgress.percentage}%)`
          );
        } catch (error) {
          console.warn(
            `[TranslationPreCacheService] Failed to cache phrase "${phrase}":`,
            error instanceof Error ? error.message : 'Unknown error'
          );
          this.currentProgress.failed++;
          this.currentProgress.completed++;
        }
      }

      // Update metadata
      await this.updateMetadata(targetLanguage, 0, SCRIPTURE_PHRASES.length, totalSize);

      this.currentProgress.isProcessing = false;
      const elapsed = Date.now() - startTime;
      this.currentProgress.estimatedTimeMs = elapsed;

      console.log('[TranslationPreCacheService] ✅ Phrase pre-cache complete:', {
        cached: cachedCount,
        failed: this.currentProgress.failed,
        totalSize: this.formatBytes(totalSize),
        elapsedMs: elapsed,
      });

      return {
        cached: cachedCount,
        failed: this.currentProgress.failed,
        totalSize,
      };
    } catch (error) {
      console.error('[TranslationPreCacheService] Phrase pre-cache failed:', error);
      this.currentProgress.isProcessing = false;
      throw error;
    }
  }

  /**
   * Pre-cache both words and phrases for a language
   */
  static async preCacheAllForLanguage(
    targetLanguage: string,
    sourceLang: string = 'en'
  ): Promise<{ totalCached: number; totalFailed: number; totalSize: number }> {
    console.log(
      `[TranslationPreCacheService] Starting complete pre-cache for language: ${targetLanguage}`
    );

    try {
      // Cache words first
      const wordsResult = await this.preCacheWordsForLanguage(targetLanguage, sourceLang);

      // Then cache phrases
      const phrasesResult = await this.preCachePhrasesForLanguage(targetLanguage, sourceLang);

      return {
        totalCached: wordsResult.cached + phrasesResult.cached,
        totalFailed: wordsResult.failed + phrasesResult.failed,
        totalSize: wordsResult.totalSize + phrasesResult.totalSize,
      };
    } catch (error) {
      console.error('[TranslationPreCacheService] Complete pre-cache failed:', error);
      throw error;
    }
  }

  /**
   * Pre-cache for multiple languages
   */
  static async preCacheForMultipleLanguages(
    targetLanguages: string[],
    sourceLang: string = 'en'
  ): Promise<Array<{ language: string; cached: number; failed: number; size: number }>> {
    console.log(`[TranslationPreCacheService] Pre-caching for ${targetLanguages.length} languages`);

    const results: Array<{ language: string; cached: number; failed: number; size: number }> = [];

    for (const language of targetLanguages) {
      try {
        const result = await this.preCacheAllForLanguage(language, sourceLang);

        results.push({
          language,
          cached: result.totalCached,
          failed: result.totalFailed,
          size: result.totalSize,
        });
      } catch (error) {
        console.error(
          `[TranslationPreCacheService] Failed to pre-cache ${language}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );

        results.push({
          language,
          cached: 0,
          failed: SCRIPTURE_WORDS.length + SCRIPTURE_PHRASES.length,
          size: 0,
        });
      }
    }

    return results;
  }

  /**
   * Check if a language has been pre-cached
   */
  static async isLanguagePreCached(language: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadata();
      return language in metadata;
    } catch (error) {
      console.error('[TranslationPreCacheService] Error checking pre-cache:', error);
      return false;
    }
  }

  /**
   * Get pre-cache metadata for a language
   */
  static async getLanguageMetadata(language: string): Promise<PreCacheMetadata | null> {
    try {
      const metadata = await this.getMetadata();
      return metadata[language] || null;
    } catch (error) {
      console.error('[TranslationPreCacheService] Error getting metadata:', error);
      return null;
    }
  }

  /**
   * Get total pre-cached translation size
   */
  static async getTotalCacheSize(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      return Object.values(metadata).reduce((sum, meta) => sum + meta.totalSize, 0);
    } catch (error) {
      console.error('[TranslationPreCacheService] Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all pre-cached translations
   */
  static async clearAllCache(): Promise<void> {
    try {
      console.log('[TranslationPreCacheService] Clearing all pre-cached translations');

      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((key) => key.startsWith(this.CACHE_PREFIX));

      await AsyncStorage.multiRemove(cacheKeys);
      await AsyncStorage.removeItem(this.PRECACHE_METADATA_KEY);

      console.log('[TranslationPreCacheService] ✅ Pre-cache cleared');
    } catch (error) {
      console.error('[TranslationPreCacheService] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Clear pre-cached translations for a specific language
   */
  static async clearLanguageCache(language: string): Promise<void> {
    try {
      console.log(`[TranslationPreCacheService] Clearing cache for language: ${language}`);

      const allKeys = await AsyncStorage.getAllKeys();
      const languageKeys = allKeys.filter(
        (key) => key.startsWith(this.CACHE_PREFIX) && key.includes(`_${language}`)
      );

      await AsyncStorage.multiRemove(languageKeys);

      // Update metadata
      const metadata = await this.getMetadata();
      delete metadata[language];
      await this.saveMetadata(metadata);

      console.log(`[TranslationPreCacheService] ✅ Cache cleared for ${language}`);
    } catch (error) {
      console.error('[TranslationPreCacheService] Error clearing language cache:', error);
      throw error;
    }
  }

  /**
   * Get current pre-cache progress
   */
  static getProgress(): TranslationCacheProgress {
    return { ...this.currentProgress };
  }

  /**
   * Get metadata for all pre-cached languages
   */
  private static async getMetadata(): Promise<Record<string, PreCacheMetadata>> {
    try {
      const data = await AsyncStorage.getItem(this.PRECACHE_METADATA_KEY);
      return data ? (JSON.parse(data) as Record<string, PreCacheMetadata>) : {};
    } catch (error) {
      console.error('[TranslationPreCacheService] Error getting metadata:', error);
      return {};
    }
  }

  /**
   * Save metadata for all pre-cached languages
   */
  private static async saveMetadata(metadata: Record<string, PreCacheMetadata>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.PRECACHE_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('[TranslationPreCacheService] Error saving metadata:', error);
    }
  }

  /**
   * Update metadata for a language
   */
  private static async updateMetadata(
    language: string,
    wordCount: number,
    phraseCount: number,
    totalSize: number
  ): Promise<void> {
    try {
      const metadata = await this.getMetadata();

      metadata[language] = {
        language,
        cachedAt: Date.now(),
        wordCount,
        phraseCount,
        totalSize,
      };

      await this.saveMetadata(metadata);
    } catch (error) {
      console.error('[TranslationPreCacheService] Error updating metadata:', error);
    }
  }

  /**
   * Format bytes to human-readable size
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
