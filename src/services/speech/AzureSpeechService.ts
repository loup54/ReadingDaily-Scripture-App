/**
 * Azure Speech Recognition & Pronunciation Assessment Service
 *
 * Provides professional-grade pronunciation assessment using Azure Cognitive Services.
 * Features:
 * - Speech-to-text recognition
 * - Pronunciation accuracy scoring (0-100)
 * - Fluency, completeness, and prosody assessment
 * - Word-level and phoneme-level feedback
 */

import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { ENV } from '@/config/env';
import {
  PronunciationResult,
  PronunciationScore,
  WordAssessment,
  PhonemeAssessment,
  PracticeError,
} from '@/types/practice.types';

// Use legacy API to avoid deprecation warnings
const FileSystem = FileSystemLegacy;

/**
 * Polyfill crypto.getRandomValues for React Native
 * Required by Azure SDK for UUID generation
 */
if (!global.crypto) {
  global.crypto = {} as any;
}

if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = (array: Uint8Array) => {
    try {
      const randomBytes = Crypto.getRandomBytes(array.length);
      array.set(new Uint8Array(randomBytes));
      return array;
    } catch (error) {
      console.error('[CryptoPolyfill] Failed to get random values:', error);
      // Fallback: use Math.random (less secure but still works)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  };
}

/**
 * Azure Speech Configuration
 */
class AzureSpeechService {
  private static speechConfig: sdk.SpeechConfig | null = null;
  private static isInitialized = false;

  /**
   * Initialize Azure Speech SDK
   * Must be called before using any other methods
   */
  static initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (!ENV.AZURE_SPEECH_KEY || !ENV.AZURE_SPEECH_REGION) {
      throw new Error(
        'Azure Speech credentials not configured. Please set EXPO_PUBLIC_AZURE_SPEECH_KEY and EXPO_PUBLIC_AZURE_SPEECH_REGION in .env'
      );
    }

    try {
      this.speechConfig = sdk.SpeechConfig.fromSubscription(
        ENV.AZURE_SPEECH_KEY,
        ENV.AZURE_SPEECH_REGION
      );

      // Set speech recognition language to US English
      this.speechConfig.speechRecognitionLanguage = 'en-US';

      this.isInitialized = true;
      console.log('✅ Azure Speech Service initialized');
    } catch (error) {
      console.error('Failed to initialize Azure Speech Service:', error);
      throw error;
    }
  }

  /**
   * Assess pronunciation from audio file
   *
   * @param audioFilePath - Path to the recorded audio file (WAV format)
   * @param referenceText - The text the user should have spoken
   * @returns Detailed pronunciation assessment results
   */
  static async assessPronunciation(
    audioFilePath: string,
    referenceText: string
  ): Promise<PronunciationResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.speechConfig) {
      throw this.createError('ASSESSMENT_FAILED', 'Speech config not initialized');
    }

    if (!referenceText || referenceText.trim().length === 0) {
      throw this.createError('ASSESSMENT_FAILED', 'Reference text is required for pronunciation assessment');
    }

    try {
      console.log('[AzureSpeechService] Starting pronunciation assessment...');
      console.log('[AzureSpeechService] Audio file:', audioFilePath);
      console.log('[AzureSpeechService] Reference text:', referenceText.substring(0, 50) + '...');

      // Load audio file as bytes
      const audioBytes = await this.loadAudioBytes(audioFilePath);
      console.log('[AzureSpeechService] Audio file loaded:', audioBytes.length, 'bytes');

      // Create audio config using push stream (compatible with React Native)
      // Use default format - the SDK will detect WAV format from header
      const pushStream = sdk.AudioInputStream.createPushStream();
      pushStream.write(audioBytes);
      pushStream.close();
      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

      // Create speech recognizer
      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);

      // Configure pronunciation assessment
      const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true // Enable miscue calculation
      );

      pronunciationConfig.enableProsodyAssessment = true;
      pronunciationConfig.applyTo(recognizer);

      console.log('[AzureSpeechService] Pronunciation assessment configured');

      // Perform recognition
      const result = await this.recognizeOnce(recognizer);

      console.log('[AzureSpeechService] Recognition complete:', result.text);

      // Parse and return results
      const assessmentResult = this.parseAssessmentResult(result, referenceText);
      console.log('[AzureSpeechService] Assessment complete:', assessmentResult.scores);

      return assessmentResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('[AzureSpeechService] Pronunciation assessment failed:', errorMsg);
      throw this.createError(
        'ASSESSMENT_FAILED',
        `Pronunciation assessment failed: ${errorMsg}`
      );
    }
  }

  /**
   * Perform speech recognition (returns recognized text only, no scoring)
   *
   * @param audioFilePath - Path to the recorded audio file
   * @returns Recognized text
   */
  static async recognizeSpeech(audioFilePath: string): Promise<string> {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (!this.speechConfig) {
      throw this.createError('ASSESSMENT_FAILED', 'Speech config not initialized');
    }

    try {
      const audioConfig = sdk.AudioConfig.fromWavFileInput(
        await this.loadAudioFile(audioFilePath)
      );

      const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
      const result = await this.recognizeOnce(recognizer);

      return result.text || '';
    } catch (error) {
      console.error('Speech recognition failed:', error);
      throw this.createError(
        'ASSESSMENT_FAILED',
        error instanceof Error ? error.message : 'Unknown error during recognition'
      );
    }
  }

  /**
   * Load audio file as byte array
   * Handles both file:// URIs and data: URIs
   * Returns raw bytes for streaming to Azure SDK
   */
  private static async loadAudioBytes(filePath: string): Promise<Uint8Array> {
    try {
      let fileData: string;

      // Normalize file path
      let normalizedPath = filePath;
      if (!normalizedPath.startsWith('file://') && !normalizedPath.startsWith('data:')) {
        // Assume it's a file system path that needs file:// prefix
        normalizedPath = `file://${normalizedPath}`;
      }

      if (normalizedPath.startsWith('data:')) {
        // Already a data URI
        fileData = normalizedPath.split(',')[1];
      } else {
        // Read from file system using base64 encoding
        try {
          const base64Data = await (FileSystem as any).readAsStringAsync(normalizedPath, {
            encoding: 'base64',
          });
          fileData = base64Data;
        } catch (fsError) {
          // If file:// doesn't work, try without it
          const pathWithoutPrefix = normalizedPath.replace('file://', '');
          console.log('[AudioFileLoad] Retrying without file:// prefix:', pathWithoutPrefix);
          const base64Data = await (FileSystem as any).readAsStringAsync(pathWithoutPrefix, {
            encoding: 'base64',
          });
          fileData = base64Data;
        }
      }

      // Convert base64 to bytes
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AudioFileLoad] Failed to load audio file:', errorMsg);
      console.error('[AudioFileLoad] File path was:', filePath);
      throw this.createError(
        'ASSESSMENT_FAILED',
        `Failed to load audio file: ${errorMsg}`
      );
    }
  }

  /**
   * Perform one-shot speech recognition
   */
  private static recognizeOnce(recognizer: sdk.SpeechRecognizer): Promise<sdk.SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          recognizer.close();
          resolve(result);
        },
        (error) => {
          recognizer.close();
          reject(error);
        }
      );
    });
  }

  /**
   * Parse Azure assessment result into our format
   */
  private static parseAssessmentResult(
    result: sdk.SpeechRecognitionResult,
    referenceText: string
  ): PronunciationResult {
    // Parse pronunciation assessment JSON from result
    const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);

    // Extract scores
    const scores: PronunciationScore = {
      accuracyScore: pronunciationResult.accuracyScore,
      fluencyScore: pronunciationResult.fluencyScore,
      completenessScore: pronunciationResult.completenessScore,
      prosodyScore: pronunciationResult.prosodyScore || 0,
      overallScore: pronunciationResult.pronunciationScore,
    };

    // Extract word-level assessments
    const words: WordAssessment[] = pronunciationResult.detailResult?.Words?.map((word: any) => ({
      word: word.Word,
      accuracyScore: word.PronunciationAssessment?.AccuracyScore || 0,
      errorType: word.PronunciationAssessment?.ErrorType || 'None',
      phonemes: word.Phonemes?.map((phoneme: any) => ({
        phoneme: phoneme.Phoneme,
        accuracyScore: phoneme.PronunciationAssessment?.AccuracyScore || 0,
      })) as PhonemeAssessment[],
    })) || [];

    return {
      recognizedText: result.text || '',
      scores,
      words,
      duration: result.duration / 10000000, // Convert from 100-nanosecond units to seconds
      confidence: pronunciationResult.accuracyScore / 100,
    };
  }

  /**
   * Create a standardized error object
   */
  private static createError(
    code: PracticeError['code'],
    message: string,
    details?: string
  ): PracticeError {
    return {
      code,
      message,
      details,
    };
  }

  /**
   * Check if Azure Speech Service is available
   */
  static isAvailable(): boolean {
    return !!ENV.AZURE_SPEECH_KEY && !!ENV.AZURE_SPEECH_REGION;
  }

  /**
   * Get current configuration info (for debugging)
   */
  static getConfigInfo() {
    return {
      isInitialized: this.isInitialized,
      hasKey: !!ENV.AZURE_SPEECH_KEY,
      region: ENV.AZURE_SPEECH_REGION,
      isAvailable: this.isAvailable(),
    };
  }
}

export default AzureSpeechService;
