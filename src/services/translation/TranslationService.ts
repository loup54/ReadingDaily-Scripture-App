/**
 * Translation Service
 * Phase C1: Translation Feature
 *
 * Uses Google Cloud Translation API to translate words and sentences
 * Implements caching to reduce API calls and improve performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const CACHE_PREFIX = '@translation_cache_';
const CACHE_EXPIRY_DAYS = 30;

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
  cached: boolean;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export class TranslationService {
  private apiKey: string;
  private cacheEnabled: boolean;

  constructor(apiKey: string, cacheEnabled: boolean = true) {
    this.apiKey = apiKey;
    this.cacheEnabled = cacheEnabled;
  }

  /**
   * Common languages for ESL learners
   */
  static readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  ];

  /**
   * Translate a single word
   */
  async translateWord(
    word: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<TranslationResult> {
    console.log(`[TranslationService] Translating word: "${word}" from ${sourceLang} to ${targetLang}`);

    // Validate input
    if (!word || word.trim().length === 0) {
      throw new Error('Word cannot be empty');
    }

    // Check cache first
    if (this.cacheEnabled) {
      const cached = await this.getCachedTranslation(word, sourceLang, targetLang);
      if (cached) {
        console.log('[TranslationService] Using cached translation');
        return { ...cached, cached: true };
      }
    }

    // Call Google Translate API
    try {
      const result = await this.callTranslateAPI(word, targetLang, sourceLang);

      // Cache the result
      if (this.cacheEnabled) {
        await this.cacheTranslation(word, sourceLang, targetLang, result);
      }

      return {
        originalText: word,
        translatedText: result.translatedText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        detectedLang: result.detectedSourceLanguage,
        cached: false,
      };
    } catch (error) {
      console.error('[TranslationService] Translation failed:', error);
      throw error;
    }
  }

  /**
   * Translate a sentence or phrase
   */
  async translateSentence(
    sentence: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<TranslationResult> {
    console.log(`[TranslationService] Translating sentence from ${sourceLang} to ${targetLang}`);

    // Validate input
    if (!sentence || sentence.trim().length === 0) {
      throw new Error('Sentence cannot be empty');
    }

    // Check cache first
    if (this.cacheEnabled) {
      const cached = await this.getCachedTranslation(sentence, sourceLang, targetLang);
      if (cached) {
        console.log('[TranslationService] Using cached translation');
        return { ...cached, cached: true };
      }
    }

    // Call Google Translate API
    try {
      const result = await this.callTranslateAPI(sentence, targetLang, sourceLang);

      // Cache the result
      if (this.cacheEnabled) {
        await this.cacheTranslation(sentence, sourceLang, targetLang, result);
      }

      return {
        originalText: sentence,
        translatedText: result.translatedText,
        sourceLang: sourceLang,
        targetLang: targetLang,
        detectedLang: result.detectedSourceLanguage,
        cached: false,
      };
    } catch (error) {
      console.error('[TranslationService] Translation failed:', error);
      throw error;
    }
  }

  /**
   * Translate multiple words/phrases at once
   */
  async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<TranslationResult[]> {
    console.log(`[TranslationService] Batch translating ${texts.length} items`);

    const results: TranslationResult[] = [];

    for (const text of texts) {
      try {
        const result = await this.translateSentence(text, targetLang, sourceLang);
        results.push(result);
      } catch (error) {
        console.error(`[TranslationService] Failed to translate "${text}":`, error);
        // Add placeholder for failed translations
        results.push({
          originalText: text,
          translatedText: text, // Fallback to original
          sourceLang,
          targetLang,
          cached: false,
        });
      }
    }

    return results;
  }

  /**
   * Call Google Translate API
   */
  private async callTranslateAPI(
    text: string,
    targetLang: string,
    sourceLang?: string
  ): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
    // Validate API key is present
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      console.error('[TranslationService] API key is missing or empty');
      throw new Error('Translation API key not configured');
    }

    const url = `${GOOGLE_TRANSLATE_API_URL}?key=${this.apiKey}`;

    const body: any = {
      q: text,
      target: targetLang,
      format: 'text',
    };

    if (sourceLang) {
      body.source = sourceLang;
    }

    console.log('[TranslationService] API key present:', this.apiKey.substring(0, 10) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Translation API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translation = data.data.translations[0];

    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
    };
  }

  /**
   * Get cached translation
   */
  private async getCachedTranslation(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult | null> {
    try {
      const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);

      // Check if cache is expired
      if (this.isCacheExpired(parsed.timestamp)) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return {
        originalText: text,
        translatedText: parsed.translation,
        sourceLang: sourceLang,
        targetLang: targetLang,
        cached: true,
      };
    } catch (error) {
      console.error('[TranslationService] Cache read error:', error);
      return null;
    }
  }

  /**
   * Cache a translation
   */
  private async cacheTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    result: { translatedText: string }
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
      const cacheData = {
        translation: result.translatedText,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[TranslationService] Cache write error:', error);
      // Don't throw - caching failure shouldn't break translation
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    // Normalize text for consistent caching
    const normalized = text.trim().toLowerCase();
    return `${CACHE_PREFIX}${sourceLang}_${targetLang}_${normalized}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isCacheExpired(timestamp: number): boolean {
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp > expiryMs;
  }

  /**
   * Translate word with network awareness
   * If offline and not cached, returns "[Not cached offline]"
   */
  async translateWordOfflineAware(
    word: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<TranslationResult> {
    // Check if translation is cached
    const cached = await this.getCachedTranslation(word, sourceLang, targetLang);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Check network status
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      // Return placeholder for offline, uncached words
      console.log(
        `[TranslationService] Word not cached and offline: "${word}" -> ${targetLang}`
      );
      return {
        originalText: word,
        translatedText: '[Not cached offline]',
        sourceLang: sourceLang,
        targetLang: targetLang,
        cached: false,
      };
    }

    // Online - proceed with translation
    return this.translateWord(word, targetLang, sourceLang);
  }

  /**
   * Translate sentence with network awareness
   * If offline and not cached, returns "[Translation not available offline]"
   */
  async translateSentenceOfflineAware(
    sentence: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<TranslationResult> {
    // Check if translation is cached
    const cached = await this.getCachedTranslation(sentence, sourceLang, targetLang);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Check network status
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      // Return placeholder for offline, uncached sentences
      console.log(
        `[TranslationService] Sentence not cached and offline: "${sentence}" -> ${targetLang}`
      );
      return {
        originalText: sentence,
        translatedText: '[Translation not available offline]',
        sourceLang: sourceLang,
        targetLang: targetLang,
        cached: false,
      };
    }

    // Online - proceed with translation
    return this.translateSentence(sentence, targetLang, sourceLang);
  }

  /**
   * Check if translation is available in cache
   */
  async isTranslationCached(
    text: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<boolean> {
    const cached = await this.getCachedTranslation(text, sourceLang, targetLang);
    return cached !== null;
  }

  /**
   * Clear all translation cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const translationKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(translationKeys);
      console.log(`[TranslationService] Cleared ${translationKeys.length} cached translations`);
    } catch (error) {
      console.error('[TranslationService] Cache clear error:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ count: number; size: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const translationKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

      return {
        count: translationKeys.length,
        size: 0, // AsyncStorage doesn't provide size info
      };
    } catch (error) {
      console.error('[TranslationService] Cache stats error:', error);
      return { count: 0, size: 0 };
    }
  }
}

// Singleton instance
let translationServiceInstance: TranslationService | null = null;

/**
 * Get or create translation service instance
 */
export const getTranslationService = (): TranslationService => {
  if (!translationServiceInstance) {
    const apiKey = ENV.GOOGLE_CLOUD_API_KEY;

    console.log('[TranslationService] Initializing service with API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');

    if (!apiKey || apiKey.trim().length === 0) {
      console.error('[TranslationService] ❌ Google Cloud API key not configured');
      throw new Error('Google Cloud API key not configured');
    }

    console.log('[TranslationService] ✅ Creating new instance with valid API key');
    translationServiceInstance = new TranslationService(apiKey);
  }

  return translationServiceInstance;
};
