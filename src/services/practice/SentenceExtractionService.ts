/**
 * Sentence Extraction Service
 *
 * Extracts practice sentences from daily scripture readings.
 * Selects sentences with appropriate length and variety for pronunciation practice.
 */

import { DailyReadings, Reading, ReadingType } from '@/types/reading.types';
import { PracticeSentence } from '@/types/practice.types';

class SentenceExtractionService {
  // Sentence selection criteria
  private static readonly MIN_WORDS = 5;   // At least 5 words per chunk (psalms have short verses)
  private static readonly MAX_WORDS = 100; // At most 100 words per chunk (allows longer scripture verses)
  private static readonly TARGET_SENTENCE_COUNT = 4;  // One per reading type (First, Psalm, 2nd, Gospel)

  /**
   * Extract practice sentences from daily readings
   *
   * @param readings - Daily readings to extract sentences from
   * @returns Array of practice sentences (up to 5)
   */
  static extractPracticeSentences(readings: DailyReadings): PracticeSentence[] {
    const sentences: PracticeSentence[] = [];

    // Extract from each reading type
    const gospel = this.extractFromReading(readings.gospel, 'gospel');
    const firstReading = this.extractFromReading(readings.firstReading, 'first-reading');
    const psalm = this.extractFromReading(readings.psalm, 'psalm');
    const secondReading = readings.secondReading
      ? this.extractFromReading(readings.secondReading, 'second-reading')
      : [];

    console.log('[SentenceExtractionService] Extracted sentences:', {
      gospelCount: gospel.length,
      firstReadingCount: firstReading.length,
      psalmCount: psalm.length,
      secondReadingCount: secondReading.length,
      totalBefore: gospel.length + firstReading.length + psalm.length + secondReading.length,
    });

    // Combine in liturgical order: First Reading → Psalm → Second Reading → Gospel
    const allSentences = [...firstReading, ...psalm, ...secondReading, ...gospel];

    // Select diverse sentences (mix from different sources)
    const selected = this.selectDiverseSentences(allSentences, this.TARGET_SENTENCE_COUNT);

    console.log('[SentenceExtractionService] Selected sentences:', {
      totalSelected: selected.length,
      sources: selected.map(s => s.source),
    });

    return selected;
  }

  /**
   * Extract sentences from a single reading
   */
  private static extractFromReading(reading: Reading, type: ReadingType): PracticeSentence[] {
    const sentences = this.splitIntoSentences(reading.content);
    const source = this.formatReadingSource(type);

    console.log(`[${source}] Extraction:`, {
      contentLength: reading.content?.length || 0,
      sentencesCount: sentences.length,
      sentenceSamples: sentences.slice(0, 2).map(s => s.substring(0, 50) + '...'),
    });

    const filtered = sentences
      .map((text, index) => {
        const wordCount = this.countWords(text);

        // Filter by word count
        if (wordCount < this.MIN_WORDS || wordCount > this.MAX_WORDS) {
          console.log(`[${source}] Sentence ${index} filtered out: ${wordCount} words (${text.substring(0, 40)}...)`);
          return null;
        }

        return {
          id: `${reading.id}-${index}`,
          text: text.trim(),
          source,
          reference: reading.reference,
          difficulty: this.calculateDifficulty(text, wordCount),
          wordCount,
          readingContent: reading.content, // Include full reading for expand/collapse
        };
      })
      .filter((s): s is PracticeSentence => s !== null);

    console.log(`[${source}] After filtering:`, {
      filtered: filtered.length,
      kept: filtered.map(s => ({ words: s.wordCount, text: s.text.substring(0, 40) })),
    });

    return filtered;
  }

  /**
   * Split text into sentences
   * Handles common scripture punctuation patterns
   */
  private static splitIntoSentences(text: string): string[] {
    // Clean up text
    const cleaned = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n/g, ' ') // Remove newlines
      .trim();

    // Split on sentence-ending punctuation and clause separators (scripture often uses semicolons, colons, commas)
    const sentences = cleaned.split(/([.!?;:,]+)\s+/).reduce((acc: string[], curr, i, arr) => {
      if (i % 2 === 0 && curr.trim()) {
        const sentence = curr + (arr[i + 1] || '');
        acc.push(sentence.trim());
      }
      return acc;
    }, []);

    return sentences.filter(s => s.length > 0);
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Calculate sentence difficulty based on various factors
   */
  private static calculateDifficulty(
    text: string,
    wordCount: number
  ): 'easy' | 'medium' | 'hard' {
    let difficultyScore = 0;

    // Word count factor
    if (wordCount > 15) difficultyScore += 2;
    else if (wordCount > 10) difficultyScore += 1;

    // Long word count (>8 characters)
    const longWords = text.split(/\s+/).filter(word => word.length > 8).length;
    if (longWords > 3) difficultyScore += 2;
    else if (longWords > 1) difficultyScore += 1;

    // Complex punctuation (commas, semicolons, colons)
    const complexPunctuation = (text.match(/[,;:]/g) || []).length;
    if (complexPunctuation > 2) difficultyScore += 1;

    // Quotations (can be tricky for prosody)
    if (text.includes('"') || text.includes('"')) difficultyScore += 1;

    // Classify based on score
    if (difficultyScore >= 4) return 'hard';
    if (difficultyScore >= 2) return 'medium';
    return 'easy';
  }

  /**
   * Select one sentence from each reading source
   * Returns 3-4 sentences (one per reading type)
   */
  private static selectDiverseSentences(
    sentences: PracticeSentence[],
    targetCount: number
  ): PracticeSentence[] {
    const selected: PracticeSentence[] = [];
    const sources = new Set<string>();

    // Select exactly one sentence from each reading source
    // Maintain order: First Reading → Psalm → 2nd Reading → Gospel
    const sourceOrder = ['First Reading', 'Responsorial Psalm', '2nd Reading', 'Gospel'];

    for (const source of sourceOrder) {
      const sentenceFromSource = sentences.find(s => s.source === source);
      if (sentenceFromSource) {
        selected.push(sentenceFromSource);
      }
    }

    return selected;
  }

  /**
   * Format reading source for display
   */
  private static formatReadingSource(type: ReadingType): string {
    switch (type) {
      case 'gospel':
        return 'Gospel';
      case 'first-reading':
        return 'First Reading';
      case 'second-reading':
        return '2nd Reading';
      case 'psalm':
        return 'Responsorial Psalm';
      default:
        return type;
    }
  }

  /**
   * Get difficulty distribution of sentences
   * Useful for analytics
   */
  static getDifficultyDistribution(sentences: PracticeSentence[]): {
    easy: number;
    medium: number;
    hard: number;
  } {
    return {
      easy: sentences.filter(s => s.difficulty === 'easy').length,
      medium: sentences.filter(s => s.difficulty === 'medium').length,
      hard: sentences.filter(s => s.difficulty === 'hard').length,
    };
  }

  /**
   * Get source distribution of sentences
   * Useful for analytics
   */
  static getSourceDistribution(sentences: PracticeSentence[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const sentence of sentences) {
      distribution[sentence.source] = (distribution[sentence.source] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Validate extracted sentences
   * Ensures quality control
   */
  static validateSentences(sentences: PracticeSentence[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (sentences.length === 0) {
      errors.push('No sentences extracted');
    }

    for (const sentence of sentences) {
      if (sentence.wordCount < this.MIN_WORDS) {
        errors.push(`Sentence too short: ${sentence.id} (${sentence.wordCount} words)`);
      }

      if (sentence.wordCount > this.MAX_WORDS) {
        errors.push(`Sentence too long: ${sentence.id} (${sentence.wordCount} words)`);
      }

      if (!sentence.text.trim()) {
        errors.push(`Empty sentence: ${sentence.id}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default SentenceExtractionService;
