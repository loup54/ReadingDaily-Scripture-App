/**
 * SentenceExtractionService Tests
 */

import SentenceExtractionService from '../SentenceExtractionService';
import { DailyReadings, Reading } from '@/types/reading.types';

describe('SentenceExtractionService', () => {
  // Mock readings
  const mockReading: Reading = {
    id: 'test-1',
    type: 'gospel',
    reference: 'John 3:16',
    content: 'For God so loved the world that he gave his only Son. Everyone who believes in him may have eternal life. This is a very short sentence. This sentence has exactly five words in it. This is a medium length sentence with several words.',
    audioUrl: '',
    translation: 'NIV',
  };

  const mockReadings: DailyReadings = {
    gospel: mockReading,
    firstReading: {
      ...mockReading,
      type: 'first-reading',
      id: 'test-2',
      reference: 'Genesis 1:1',
      content: 'In the beginning God created the heavens and the earth. The earth was formless and empty.',
    },
    psalm: {
      ...mockReading,
      type: 'psalm',
      id: 'test-3',
      reference: 'Psalm 23:1',
      content: 'The Lord is my shepherd, I shall not want. He makes me lie down in green pastures.',
    },
  };

  describe('extractPracticeSentences', () => {
    it('should extract sentences from readings', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      expect(sentences).toBeDefined();
      expect(Array.isArray(sentences)).toBe(true);
      expect(sentences.length).toBeGreaterThan(0);
      expect(sentences.length).toBeLessThanOrEqual(5);
    });

    it('should include sentences from different sources', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      const sources = new Set(sentences.map(s => s.source));
      expect(sources.size).toBeGreaterThan(1); // Should have variety
    });

    it('should filter sentences by word count (5-25 words)', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      sentences.forEach(sentence => {
        expect(sentence.wordCount).toBeGreaterThanOrEqual(5);
        expect(sentence.wordCount).toBeLessThanOrEqual(25);
      });
    });

    it('should assign difficulty levels', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      sentences.forEach(sentence => {
        expect(['easy', 'medium', 'hard']).toContain(sentence.difficulty);
      });
    });

    it('should include reference information', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      sentences.forEach(sentence => {
        expect(sentence.reference).toBeDefined();
        expect(sentence.reference.length).toBeGreaterThan(0);
      });
    });

    it('should create unique IDs for sentences', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      const ids = sentences.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length); // All IDs should be unique
    });
  });

  describe('validateSentences', () => {
    it('should validate correct sentences', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);
      const validation = SentenceExtractionService.validateSentences(sentences);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect empty sentence list', () => {
      const validation = SentenceExtractionService.validateSentences([]);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No sentences extracted');
    });

    it('should detect sentences that are too short', () => {
      const shortSentence = {
        id: 'test',
        text: 'Too short',
        source: 'Gospel',
        reference: 'Test 1:1',
        difficulty: 'easy' as const,
        wordCount: 2,
      };

      const validation = SentenceExtractionService.validateSentences([shortSentence]);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('too short'))).toBe(true);
    });

    it('should detect sentences that are too long', () => {
      const longSentence = {
        id: 'test',
        text: 'This is a very long sentence with way more than twenty five words in it which should fail validation',
        source: 'Gospel',
        reference: 'Test 1:1',
        difficulty: 'hard' as const,
        wordCount: 30,
      };

      const validation = SentenceExtractionService.validateSentences([longSentence]);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('too long'))).toBe(true);
    });

    it('should detect empty sentence text', () => {
      const emptySentence = {
        id: 'test',
        text: '   ',
        source: 'Gospel',
        reference: 'Test 1:1',
        difficulty: 'easy' as const,
        wordCount: 10,
      };

      const validation = SentenceExtractionService.validateSentences([emptySentence]);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Empty sentence'))).toBe(true);
    });
  });

  describe('getDifficultyDistribution', () => {
    it('should count sentences by difficulty', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);
      const distribution = SentenceExtractionService.getDifficultyDistribution(sentences);

      expect(distribution).toHaveProperty('easy');
      expect(distribution).toHaveProperty('medium');
      expect(distribution).toHaveProperty('hard');

      const total = distribution.easy + distribution.medium + distribution.hard;
      expect(total).toBe(sentences.length);
    });

    it('should handle empty sentence list', () => {
      const distribution = SentenceExtractionService.getDifficultyDistribution([]);

      expect(distribution.easy).toBe(0);
      expect(distribution.medium).toBe(0);
      expect(distribution.hard).toBe(0);
    });
  });

  describe('getSourceDistribution', () => {
    it('should count sentences by source', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);
      const distribution = SentenceExtractionService.getSourceDistribution(sentences);

      expect(typeof distribution).toBe('object');

      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(sentences.length);
    });

    it('should handle empty sentence list', () => {
      const distribution = SentenceExtractionService.getSourceDistribution([]);

      expect(Object.keys(distribution)).toHaveLength(0);
    });

    it('should group by source correctly', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);
      const distribution = SentenceExtractionService.getSourceDistribution(sentences);

      // Each count should be a positive number
      Object.values(distribution).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('Difficulty calculation', () => {
    it('should classify short sentences as easy', () => {
      const shortReading: Reading = {
        ...mockReading,
        content: 'This is a simple sentence. Another easy one here.',
      };

      const readings: DailyReadings = {
        gospel: shortReading,
        firstReading: mockReadings.firstReading,
        psalm: mockReadings.psalm,
      };

      const sentences = SentenceExtractionService.extractPracticeSentences(readings);
      const easySentences = sentences.filter(s => s.difficulty === 'easy');

      expect(easySentences.length).toBeGreaterThan(0);
    });

    it('should classify sentences with long words as harder', () => {
      const complexReading: Reading = {
        ...mockReading,
        content: 'The righteousness and sanctification of believers demonstrates manifestation.',
      };

      const readings: DailyReadings = {
        gospel: complexReading,
        firstReading: mockReadings.firstReading,
        psalm: mockReadings.psalm,
      };

      const sentences = SentenceExtractionService.extractPracticeSentences(readings);

      // Should have at least some medium/hard sentences
      const complexSentences = sentences.filter(s => s.difficulty !== 'easy');
      expect(complexSentences.length).toBeGreaterThan(0);
    });

    it('should classify sentences with complex punctuation as harder', () => {
      const punctuatedReading: Reading = {
        ...mockReading,
        content: 'Jesus said, "I am the way, the truth, and the life: no one comes to the Father except through me."',
      };

      const readings: DailyReadings = {
        gospel: punctuatedReading,
        firstReading: mockReadings.firstReading,
        psalm: mockReadings.psalm,
      };

      const sentences = SentenceExtractionService.extractPracticeSentences(readings);

      // Sentence with quotes and complex punctuation should not all be easy
      const complexSentences = sentences.filter(s => s.difficulty !== 'easy');
      expect(complexSentences.length).toBeGreaterThan(0);
    });
  });

  describe('Sentence diversity', () => {
    it('should select sentences from different sources', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      const sources = sentences.map(s => s.source);
      const uniqueSources = new Set(sources);

      // Should have variety (not all from one source)
      expect(uniqueSources.size).toBeGreaterThan(1);
    });

    it('should limit to target sentence count', () => {
      const sentences = SentenceExtractionService.extractPracticeSentences(mockReadings);

      expect(sentences.length).toBeLessThanOrEqual(5); // TARGET_SENTENCE_COUNT = 5
    });
  });

  describe('Edge cases', () => {
    it('should handle readings with no valid sentences', () => {
      const emptyReadings: DailyReadings = {
        gospel: { ...mockReading, content: 'A. B. C.' }, // Too short
        firstReading: { ...mockReading, content: 'D. E.' },
        psalm: { ...mockReading, content: 'F.' },
      };

      const sentences = SentenceExtractionService.extractPracticeSentences(emptyReadings);

      expect(Array.isArray(sentences)).toBe(true);
      // Should return empty array or very few sentences
    });

    it('should handle readings with only long sentences', () => {
      const longReadings: DailyReadings = {
        gospel: {
          ...mockReading,
          content: 'This is an extremely long sentence that goes on and on with more than twenty five words which should be filtered out by the word count validation logic.',
        },
        firstReading: mockReadings.firstReading,
        psalm: mockReadings.psalm,
      };

      const sentences = SentenceExtractionService.extractPracticeSentences(longReadings);

      // Should still extract some valid sentences from other readings
      expect(sentences.length).toBeGreaterThan(0);
    });

    it('should handle special characters in text', () => {
      const specialReading: Reading = {
        ...mockReading,
        content: 'Jesus said, "Follow me!" The disciples followed him faithfully.',
      };

      const readings: DailyReadings = {
        gospel: specialReading,
        firstReading: mockReadings.firstReading,
        psalm: mockReadings.psalm,
      };

      const sentences = SentenceExtractionService.extractPracticeSentences(readings);

      expect(sentences.length).toBeGreaterThan(0);
      sentences.forEach(s => {
        expect(s.text.length).toBeGreaterThan(0);
      });
    });
  });
});
