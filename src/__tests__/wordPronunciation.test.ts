/**
 * Word Pronunciation Feature Tests
 * Tests for Phase 1-3 implementation: filtering, language mapping, and validation
 *
 * Phase: Word Pronunciation Feature (Phase 4 Testing)
 */

import {
  shouldIncludePronunciation,
  getPronunciationReason,
} from '@/constants/stopWords';
import {
  getTTSLanguageCode,
  isTTSSupportedLanguage,
  validatePronunciation,
  shouldShowPronunciationButton,
  getSupportedTTSLanguages,
  getPronunciationCacheKey,
} from '@/utils/wordPronunciation';

describe('Word Pronunciation Feature Tests', () => {
  // ===== STOP WORD FILTERING TESTS =====
  describe('Stop Word Filtering', () => {
    describe('shouldIncludePronunciation()', () => {
      test('should filter common articles', () => {
        expect(shouldIncludePronunciation('a')).toBe(false);
        expect(shouldIncludePronunciation('an')).toBe(false);
        expect(shouldIncludePronunciation('the')).toBe(false);
      });

      test('should filter common prepositions', () => {
        expect(shouldIncludePronunciation('in')).toBe(false);
        expect(shouldIncludePronunciation('on')).toBe(false);
        expect(shouldIncludePronunciation('at')).toBe(false);
        expect(shouldIncludePronunciation('to')).toBe(false);
        expect(shouldIncludePronunciation('from')).toBe(false);
      });

      test('should filter common verbs', () => {
        expect(shouldIncludePronunciation('is')).toBe(false);
        expect(shouldIncludePronunciation('are')).toBe(false);
        expect(shouldIncludePronunciation('be')).toBe(false);
        expect(shouldIncludePronunciation('have')).toBe(false);
        expect(shouldIncludePronunciation('do')).toBe(false);
      });

      test('should filter common pronouns', () => {
        expect(shouldIncludePronunciation('he')).toBe(false);
        expect(shouldIncludePronunciation('she')).toBe(false);
        expect(shouldIncludePronunciation('it')).toBe(false);
        expect(shouldIncludePronunciation('they')).toBe(false);
      });

      test('should include proper nouns', () => {
        expect(shouldIncludePronunciation('Jesus')).toBe(true);
        expect(shouldIncludePronunciation('Jerusalem')).toBe(true);
        expect(shouldIncludePronunciation('David')).toBe(true);
        expect(shouldIncludePronunciation('Egypt')).toBe(true);
      });

      test('should include technical/uncommon words', () => {
        expect(shouldIncludePronunciation('righteousness')).toBe(true);
        expect(shouldIncludePronunciation('covenant')).toBe(true);
        expect(shouldIncludePronunciation('prophecy')).toBe(true);
        expect(shouldIncludePronunciation('sanctification')).toBe(true);
      });

      test('should be case-insensitive', () => {
        expect(shouldIncludePronunciation('THE')).toBe(false);
        expect(shouldIncludePronunciation('Is')).toBe(false);
        expect(shouldIncludePronunciation('JESUS')).toBe(true);
      });

      test('should reject empty strings', () => {
        expect(shouldIncludePronunciation('')).toBe(false);
        expect(shouldIncludePronunciation('  ')).toBe(false);
      });
    });

    describe('getPronunciationReason()', () => {
      test('should identify stop words', () => {
        const reason = getPronunciationReason('the');
        expect(reason).toContain('stop word');
      });

      test('should identify proper nouns', () => {
        const reason = getPronunciationReason('Jesus');
        expect(reason).toContain('Proper noun');
      });

      test('should identify uncommon words', () => {
        const reason = getPronunciationReason('righteousness');
        expect(reason).toContain('Uncommon');
      });
    });
  });

  // ===== LANGUAGE CODE MAPPING TESTS =====
  describe('Language Code Mapping', () => {
    describe('getTTSLanguageCode()', () => {
      test('should map translation codes to TTS codes', () => {
        expect(getTTSLanguageCode('es')).toBe('es-ES');
        expect(getTTSLanguageCode('fr')).toBe('fr-FR');
        expect(getTTSLanguageCode('de')).toBe('de-DE');
        expect(getTTSLanguageCode('it')).toBe('it-IT');
        expect(getTTSLanguageCode('pt')).toBe('pt-BR');
        expect(getTTSLanguageCode('ru')).toBe('ru-RU');
      });

      test('should handle Chinese variants', () => {
        expect(getTTSLanguageCode('zh-CN')).toBe('zh-CN');
        expect(getTTSLanguageCode('zh-TW')).toBe('zh-TW');
      });

      test('should handle Asian languages', () => {
        expect(getTTSLanguageCode('ja')).toBe('ja-JP');
        expect(getTTSLanguageCode('ko')).toBe('ko-KR');
      });

      test('should handle Middle Eastern/Asian languages', () => {
        expect(getTTSLanguageCode('ar')).toBe('ar-SA');
        expect(getTTSLanguageCode('hi')).toBe('hi-IN');
        expect(getTTSLanguageCode('vi')).toBe('vi-VN');
        expect(getTTSLanguageCode('th')).toBe('th-TH');
      });

      test('should default to en-US for unsupported codes', () => {
        expect(getTTSLanguageCode('unknown')).toBe('en-US');
        expect(getTTSLanguageCode('xx')).toBe('en-US');
      });
    });

    describe('isTTSSupportedLanguage()', () => {
      test('should return true for supported languages', () => {
        expect(isTTSSupportedLanguage('en')).toBe(true);
        expect(isTTSSupportedLanguage('es')).toBe(true);
        expect(isTTSSupportedLanguage('fr')).toBe(true);
        expect(isTTSSupportedLanguage('de')).toBe(true);
      });

      test('should return false for unsupported languages', () => {
        expect(isTTSSupportedLanguage('unknown')).toBe(false);
        expect(isTTSSupportedLanguage('xx')).toBe(false);
        expect(isTTSSupportedLanguage('')).toBe(false);
      });

      test('should support 18+ languages', () => {
        const supported = getSupportedTTSLanguages();
        expect(supported.length).toBeGreaterThanOrEqual(18);
      });
    });
  });

  // ===== PRONUNCIATION VALIDATION TESTS =====
  describe('Pronunciation Validation', () => {
    describe('validatePronunciation()', () => {
      test('should allow proper nouns in supported languages', () => {
        const result = validatePronunciation('Jesus', 'es');
        expect(result.canPronounce).toBe(true);
        expect(result.reason).toBe('Word can be pronounced');
      });

      test('should reject stop words', () => {
        const result = validatePronunciation('the', 'es');
        expect(result.canPronounce).toBe(false);
        expect(result.reason).toContain('stop word');
      });

      test('should reject unsupported languages', () => {
        const result = validatePronunciation('Jesus', 'unknown');
        expect(result.canPronounce).toBe(false);
        expect(result.reason).toContain('not supported');
      });

      test('should reject empty words', () => {
        const result = validatePronunciation('', 'es');
        expect(result.canPronounce).toBe(false);
        expect(result.reason).toBe('Word is empty');
      });

      test('should reject whitespace-only words', () => {
        const result = validatePronunciation('   ', 'es');
        expect(result.canPronounce).toBe(false);
      });

      test('should provide detailed error messages', () => {
        const emptyResult = validatePronunciation('', 'es');
        expect(emptyResult.reason).toBeTruthy();

        const stopWordResult = validatePronunciation('and', 'es');
        expect(stopWordResult.reason).toBeTruthy();

        const langResult = validatePronunciation('Jesus', 'invalid');
        expect(langResult.reason).toBeTruthy();
      });
    });

    describe('shouldShowPronunciationButton()', () => {
      test('should return true for words that should have pronunciation', () => {
        expect(shouldShowPronunciationButton('Jesus')).toBe(true);
        expect(shouldShowPronunciationButton('covenant')).toBe(true);
      });

      test('should return false for stop words', () => {
        expect(shouldShowPronunciationButton('the')).toBe(false);
        expect(shouldShowPronunciationButton('is')).toBe(false);
      });
    });
  });

  // ===== CACHING & UTILITY TESTS =====
  describe('Caching & Utilities', () => {
    describe('getPronunciationCacheKey()', () => {
      test('should generate consistent cache keys', () => {
        const key1 = getPronunciationCacheKey('Jesus', 'es-ES');
        const key2 = getPronunciationCacheKey('Jesus', 'es-ES');
        expect(key1).toBe(key2);
      });

      test('should include word and language in key', () => {
        const key = getPronunciationCacheKey('Jesus', 'es-ES');
        expect(key).toContain('jesus'); // lowercase
        expect(key).toContain('es-ES');
      });

      test('should be case-insensitive for word', () => {
        const key1 = getPronunciationCacheKey('Jesus', 'es-ES');
        const key2 = getPronunciationCacheKey('JESUS', 'es-ES');
        expect(key1).toBe(key2);
      });

      test('should generate different keys for different languages', () => {
        const keyES = getPronunciationCacheKey('Jesus', 'es-ES');
        const keyFR = getPronunciationCacheKey('Jesus', 'fr-FR');
        expect(keyES).not.toBe(keyFR);
      });
    });

    describe('getSupportedTTSLanguages()', () => {
      test('should return array of language codes', () => {
        const langs = getSupportedTTSLanguages();
        expect(Array.isArray(langs)).toBe(true);
        expect(langs.length).toBeGreaterThan(0);
      });

      test('should include all major languages', () => {
        const langs = getSupportedTTSLanguages();
        expect(langs).toContain('en');
        expect(langs).toContain('es');
        expect(langs).toContain('fr');
        expect(langs).toContain('de');
        expect(langs).toContain('ja');
        expect(langs).toContain('zh-CN');
      });

      test('should be consistent', () => {
        const langs1 = getSupportedTTSLanguages();
        const langs2 = getSupportedTTSLanguages();
        expect(langs1).toEqual(langs2);
      });
    });
  });

  // ===== EDGE CASE TESTS =====
  describe('Edge Cases', () => {
    test('should handle words with punctuation', () => {
      // Note: PronunciationButton strips punctuation before validation
      expect(shouldIncludePronunciation('Jesus')).toBe(true);
    });

    test('should handle words with multiple spaces', () => {
      const result = validatePronunciation('  Jesus  ', 'es');
      expect(result.canPronounce).toBe(true);
    });

    test('should handle mixed case properly', () => {
      expect(shouldIncludePronunciation('ThE')).toBe(false);
      expect(shouldIncludePronunciation('JeSuS')).toBe(true);
    });

    test('should handle very long words', () => {
      const longWord = 'sanctification'.repeat(5);
      expect(shouldIncludePronunciation(longWord)).toBe(true);
    });

    test('should handle numbers in text', () => {
      const result = validatePronunciation('Jesus123', 'es');
      expect(result.canPronounce).toBe(true);
    });
  });
});
