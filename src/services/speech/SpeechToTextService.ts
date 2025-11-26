/**
 * Speech-to-Text Service
 * Phase D2: Pronunciation Comparison
 *
 * Service for transcribing audio recordings using Google Cloud Speech-to-Text API
 */

import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const GOOGLE_CLOUD_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY ||
                              process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY;

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }>;
}

export interface ComparisonResult {
  accuracy: number;
  matchedWords: number;
  totalWords: number;
  differences: Array<{
    expected: string;
    actual: string;
    matched: boolean;
  }>;
}

export class SpeechToTextService {
  private apiKey: string;
  private apiUrl = 'https://speech.googleapis.com/v1/speech:recognize';

  constructor() {
    this.apiKey = GOOGLE_CLOUD_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[SpeechToTextService] ⚠️ Google Cloud API key NOT configured');
      console.warn('[SpeechToTextService] Set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in environment');
    } else {
      console.log('[SpeechToTextService] ✅ API key loaded (length:', this.apiKey.length, ')');
    }
  }

  /**
   * Transcribe audio file to text
   */
  async transcribeAudio(audioUri: string, languageCode: string = 'en-US'): Promise<TranscriptionResult> {
    try {
      console.log('[SpeechToTextService] Transcribing audio:', audioUri);

      // Verify audio file exists
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error(`Audio file not found at: ${audioUri}`);
      }
      console.log('[SpeechToTextService] Audio file exists, size:', fileInfo.size);

      // Read audio file as base64
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: 'base64',
      });

      // Validate base64 content
      if (!audioBase64 || audioBase64.length === 0) {
        throw new Error('Failed to read audio file - empty base64 content');
      }
      console.log('[SpeechToTextService] Audio base64 length:', audioBase64.length);

      // Validate API key before making request
      if (!this.apiKey) {
        throw new Error('Google Cloud API key is not configured - cannot transcribe audio');
      }

      // Prepare request with LINEAR16 encoding (most compatible format)
      const requestBody = {
        config: {
          encoding: 'LINEAR16', // Universal format, most compatible with Google Cloud
          sampleRateHertz: 16000, // Standard for speech recognition
          languageCode,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
        },
        audio: {
          content: audioBase64,
        },
      };

      // Log request details for debugging
      console.log('[SpeechToTextService] Request details:', {
        audioSize: audioBase64.length,
        encoding: requestBody.config.encoding,
        sampleRate: requestBody.config.sampleRateHertz,
        languageCode: requestBody.config.languageCode,
        apiKeyLength: this.apiKey.length,
      });

      // Make API request
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SpeechToTextService] ❌ API Error Response:', errorText);
        console.error('[SpeechToTextService] HTTP Status:', response.status);
        console.error('[SpeechToTextService] Request Body (sanitized):', {
          config: requestBody.config,
          audioLength: requestBody.audio.content.length,
        });

        let errorMessage = `Speech-to-Text API error: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
            console.error('[SpeechToTextService] API Error Details:', errorData.error);
          }
        } catch (e) {
          // Not JSON, use raw text
          console.error('[SpeechToTextService] Raw error response:', errorText);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        console.warn('[SpeechToTextService] No transcription results');
        return {
          transcript: '',
          confidence: 0,
        };
      }

      // Extract transcript and confidence
      const result = data.results[0];
      const alternative = result.alternatives[0];

      const words = alternative.words?.map((wordInfo: any) => ({
        word: wordInfo.word,
        confidence: wordInfo.confidence || 0,
        startTime: parseFloat(wordInfo.startTime?.seconds || '0') +
                   parseFloat(wordInfo.startTime?.nanos || '0') / 1e9,
        endTime: parseFloat(wordInfo.endTime?.seconds || '0') +
                 parseFloat(wordInfo.endTime?.nanos || '0') / 1e9,
      }));

      const transcriptionResult: TranscriptionResult = {
        transcript: alternative.transcript,
        confidence: alternative.confidence || 0,
        words,
      };

      console.log('[SpeechToTextService] ✅ Transcription successful!');
      console.log('[SpeechToTextService] Transcript:', transcriptionResult.transcript);
      console.log('[SpeechToTextService] Confidence:', transcriptionResult.confidence);
      console.log('[SpeechToTextService] Words detected:', transcriptionResult.words?.length || 0);

      return transcriptionResult;
    } catch (error: any) {
      console.error('[SpeechToTextService] Transcription failed:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Compare transcribed text with expected text
   */
  compareTexts(expectedText: string, actualText: string): ComparisonResult {
    try {
      // Validate inputs before processing
      if (!expectedText || typeof expectedText !== 'string') {
        console.error('[SpeechToTextService] ❌ Invalid expectedText:', expectedText);
        throw new Error('Expected text must be a non-empty string');
      }

      if (!actualText || typeof actualText !== 'string') {
        console.error('[SpeechToTextService] ❌ Invalid actualText:', actualText);
        throw new Error('Actual (transcribed) text must be a non-empty string');
      }

      console.log('[SpeechToTextService] Comparing texts');
      console.log('[SpeechToTextService] Expected:', expectedText);
      console.log('[SpeechToTextService] Actual:', actualText);

      // Log text validation details for debugging
      console.log('[SpeechToTextService] Text validation:', {
        expectedText: {
          value: expectedText.substring(0, 50),
          type: typeof expectedText,
          length: expectedText.length,
          isEmpty: expectedText.trim().length === 0,
        },
        actualText: {
          value: actualText.substring(0, 50),
          type: typeof actualText,
          length: actualText.length,
          isEmpty: actualText.trim().length === 0,
        },
      });

      // Normalize texts (lowercase, remove punctuation)
      const normalizeText = (text: string): string[] => {
        return text
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/)
          .filter(word => word.length > 0);
      };

      const expectedWords = normalizeText(expectedText);
      const actualWords = normalizeText(actualText);

      // Calculate word-by-word differences
      const differences: Array<{
        expected: string;
        actual: string;
        matched: boolean;
      }> = [];

      const maxLength = Math.max(expectedWords.length, actualWords.length);
      let matchedCount = 0;

      for (let i = 0; i < maxLength; i++) {
        const expectedWord = expectedWords[i] || '';
        const actualWord = actualWords[i] || '';
        const matched = this.wordsMatch(expectedWord, actualWord);

        differences.push({
          expected: expectedWord,
          actual: actualWord,
          matched,
        });

        if (matched) {
          matchedCount++;
        }
      }

      // Calculate accuracy score
      const accuracy = expectedWords.length > 0
        ? (matchedCount / expectedWords.length) * 100
        : 0;

      const result: ComparisonResult = {
        accuracy: Math.round(accuracy * 10) / 10, // Round to 1 decimal
        matchedWords: matchedCount,
        totalWords: expectedWords.length,
        differences,
      };

      console.log('[SpeechToTextService] Comparison result:', result);

      return result;
    } catch (error: any) {
      console.error('[SpeechToTextService] Comparison failed:', error);
      throw new Error(`Failed to compare texts: ${error.message}`);
    }
  }

  /**
   * Check if two words match (with fuzzy matching)
   */
  private wordsMatch(word1: string, word2: string): boolean {
    // Exact match
    if (word1 === word2) {
      return true;
    }

    // Empty words don't match
    if (!word1 || !word2) {
      return false;
    }

    // Calculate Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);

    // Allow 1 character difference for words > 3 characters
    if (maxLength > 3 && distance <= 1) {
      return true;
    }

    return false;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get pronunciation score with detailed feedback
   */
  async analyzePronunciation(
    audioUri: string,
    expectedText: string,
    languageCode: string = 'en-US'
  ): Promise<{
    transcription: TranscriptionResult;
    comparison: ComparisonResult;
    score: number;
    feedback: string;
  }> {
    try {
      // Validate input parameters
      if (!audioUri || typeof audioUri !== 'string') {
        throw new Error('Audio URI must be provided');
      }

      if (!expectedText || typeof expectedText !== 'string') {
        throw new Error('Expected text must be provided for comparison');
      }

      console.log('[SpeechToTextService] Analyzing pronunciation');
      console.log('[SpeechToTextService] Expected text length:', expectedText.length);

      // Transcribe audio
      const transcription = await this.transcribeAudio(audioUri, languageCode);

      // Validate transcription result
      if (!transcription || !transcription.transcript) {
        console.warn('[SpeechToTextService] ⚠️ Empty transcription received');

        // Provide fallback result instead of throwing error
        const emptyResult: ComparisonResult = {
          accuracy: 0,
          matchedWords: 0,
          totalWords: expectedText.split(/\s+/).length,
          differences: [
            {
              expected: expectedText,
              actual: '',
              matched: false,
            }
          ],
        };

        return {
          transcription: {
            transcript: '',
            confidence: 0,
          },
          comparison: emptyResult,
          score: 0,
          feedback: 'Could not transcribe audio. Please try again with clearer audio.',
        };
      }

      console.log('[SpeechToTextService] Transcription received, length:', transcription.transcript.length);

      // If transcription is empty or very short, provide meaningful feedback
      if (transcription.transcript.trim().length === 0) {
        console.warn('[SpeechToTextService] ⚠️ Transcription is empty');

        const emptyResult: ComparisonResult = {
          accuracy: 0,
          matchedWords: 0,
          totalWords: expectedText.split(/\s+/).length,
          differences: [
            {
              expected: expectedText,
              actual: '',
              matched: false,
            }
          ],
        };

        return {
          transcription,
          comparison: emptyResult,
          score: 0,
          feedback: 'Could not transcribe audio. Please try again with clearer audio.',
        };
      }

      // Compare with expected text
      const comparison = this.compareTexts(expectedText, transcription.transcript);

      // Calculate overall score (weighted average)
      const transcriptionConfidence = transcription.confidence * 100;
      const accuracyScore = comparison.accuracy;
      const score = (transcriptionConfidence * 0.3 + accuracyScore * 0.7);

      // Generate feedback
      let feedback = '';
      if (score >= 90) {
        feedback = 'Excellent! Your pronunciation is very accurate.';
      } else if (score >= 75) {
        feedback = 'Good job! Your pronunciation is mostly accurate.';
      } else if (score >= 60) {
        feedback = 'Not bad! Keep practicing to improve your pronunciation.';
      } else {
        feedback = 'Keep trying! Practice makes perfect.';
      }

      return {
        transcription,
        comparison,
        score: Math.round(score * 10) / 10,
        feedback,
      };
    } catch (error: any) {
      console.error('[SpeechToTextService] Analysis failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const speechToTextService = new SpeechToTextService();
