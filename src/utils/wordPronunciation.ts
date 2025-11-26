/**
 * Word Pronunciation Utilities
 *
 * Handles language code mapping for TTS and pronunciation logic
 * Maps translation service language codes to Google TTS format
 *
 * Phase: Word Pronunciation Feature (Phase 1)
 */

import { shouldIncludePronunciation } from '@/constants/stopWords';

/**
 * Map translation language codes to Google TTS language codes
 * Translation uses: es, fr, de, it, pt, ru, zh-CN, zh-TW, ja, ko, ar, hi, vi, th, pl, nl, tr
 * Google TTS uses: es-ES, fr-FR, de-DE, it-IT, pt-BR, ru-RU, cmn-CN, yue-HK, ja-JP, ko-KR, ar-SA, etc.
 */
const LANGUAGE_CODE_MAP: Record<string, string> = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-BR',
  'ru': 'ru-RU',
  'zh-CN': 'cmn-CN',  // Mandarin Chinese (simplified) - Google TTS uses cmn-CN not zh-CN
  'zh-TW': 'yue-HK',  // Traditional Chinese (Cantonese) - Hong Kong variant
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'ar': 'ar-XA',      // Arabic - Modern Standard Arabic (ar-XA, not ar-SA)
  'hi': 'hi-IN',
  'vi': 'vi-VN',
  'th': 'th-TH',
  'pl': 'pl-PL',
  'nl': 'nl-NL',
  'tr': 'tr-TR',
};

/**
 * Convert translation language code to Google TTS language code
 * @param translationLangCode - Language code from TranslationService (e.g., 'es')
 * @returns Google TTS language code (e.g., 'es-ES')
 */
export const getTTSLanguageCode = (translationLangCode: string): string => {
  return LANGUAGE_CODE_MAP[translationLangCode] || 'en-US';
};

/**
 * Check if language is supported for TTS pronunciation
 * @param translationLangCode - Language code from TranslationService
 * @returns true if language is supported for TTS
 */
export const isTTSSupportedLanguage = (translationLangCode: string): boolean => {
  return translationLangCode in LANGUAGE_CODE_MAP;
};

/**
 * Check if word should have pronunciation button
 * Filters out common English stop words
 * @param word - The word to check
 * @returns true if word should have pronunciation button
 */
export const shouldShowPronunciationButton = (word: string): boolean => {
  return shouldIncludePronunciation(word);
};

/**
 * Get list of all supported TTS languages
 * @returns Array of language codes supported for TTS
 */
export const getSupportedTTSLanguages = (): string[] => {
  return Object.keys(LANGUAGE_CODE_MAP);
};

/**
 * Validate pronunciation requirements
 * Checks if word and language combination can have pronunciation
 * @param word - The word to pronounce
 * @param langCode - Language code from translation service
 * @returns Object with validation result and reason
 */
export const validatePronunciation = (
  word: string,
  langCode: string
): { canPronounce: boolean; reason: string } => {
  // Check word is valid
  if (!word || word.trim().length === 0) {
    return {
      canPronounce: false,
      reason: 'Word is empty'
    };
  }

  // Check if word should have pronunciation (not a stop word)
  if (!shouldShowPronunciationButton(word)) {
    return {
      canPronounce: false,
      reason: 'Common English word (no pronunciation needed)'
    };
  }

  // Check language is supported
  if (!isTTSSupportedLanguage(langCode)) {
    return {
      canPronounce: false,
      reason: `Language '${langCode}' not supported for pronunciation`
    };
  }

  // All checks passed
  return {
    canPronounce: true,
    reason: 'Word can be pronounced'
  };
};

/**
 * Get pronunciation cache key
 * Used for caching generated audio
 * @param word - The word
 * @param langCode - TTS language code
 * @returns Cache key string
 */
export const getPronunciationCacheKey = (word: string, langCode: string): string => {
  return `pronunciation_${word.toLowerCase()}_${langCode}`;
};

export default {
  getTTSLanguageCode,
  isTTSSupportedLanguage,
  shouldShowPronunciationButton,
  getSupportedTTSLanguages,
  validatePronunciation,
  getPronunciationCacheKey
};
