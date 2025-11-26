/**
 * Google Cloud Text-to-Speech Service
 *
 * Handles TTS generation for scripture readings using Google Cloud TTS API.
 * Supports multiple voices (male/female) and caching of generated audio.
 *
 * Phase 11: Audio Implementation
 */

import { ENV } from '@/config/env';

export type TTSVoiceGender = 'MALE' | 'FEMALE' | 'NEUTRAL';
export type TTSLanguageCode = 'en-US';

export interface TTSVoiceConfig {
  languageCode: TTSLanguageCode;
  name: string;
  gender: TTSVoiceGender;
}

export interface TTSRequest {
  text: string;
  voice: TTSVoiceConfig;
  speed?: number; // 0.5 - 1.5 (default: 1.0)
}

export interface TTSResponse {
  audioContent: string; // Base64-encoded audio
  audioConfig: {
    audioEncoding: string;
    speakingRate: number;
    pitch: number;
  };
}

export interface TTSError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Available Google Cloud TTS voices for English (US)
 * WaveNet voices provide the most natural-sounding speech
 */
export const TTS_VOICES = {
  FEMALE_PRIMARY: {
    languageCode: 'en-US' as TTSLanguageCode,
    name: 'en-US-Wavenet-C', // Female, warm tone
    gender: 'FEMALE' as TTSVoiceGender,
  },
  FEMALE_SECONDARY: {
    languageCode: 'en-US' as TTSLanguageCode,
    name: 'en-US-Wavenet-F', // Female, clear tone
    gender: 'FEMALE' as TTSVoiceGender,
  },
  MALE_PRIMARY: {
    languageCode: 'en-US' as TTSLanguageCode,
    name: 'en-US-Wavenet-D', // Male, clear tone
    gender: 'MALE' as TTSVoiceGender,
  },
  MALE_SECONDARY: {
    languageCode: 'en-US' as TTSLanguageCode,
    name: 'en-US-Wavenet-A', // Male, warm tone
    gender: 'MALE' as TTSVoiceGender,
  },
} as const;

/**
 * Default TTS configuration
 */
const DEFAULT_TTS_CONFIG = {
  voice: TTS_VOICES.FEMALE_PRIMARY,
  speed: 1.0,
  pitch: 0,
  volumeGainDb: 0,
  audioEncoding: 'MP3',
  sampleRateHertz: 24000,
} as const;

/**
 * Google Cloud TTS API endpoint
 */
const TTS_API_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * TTSService class
 * Handles all Text-to-Speech operations using Google Cloud TTS
 */
export class TTSService {
  private static apiKey: string = ENV.GOOGLE_CLOUD_API_KEY;

  /**
   * Generate speech audio from text
   *
   * @param text - The text to convert to speech
   * @param voice - Voice configuration (defaults to FEMALE_PRIMARY)
   * @param speed - Speaking rate (0.5 - 1.5, default: 1.0)
   * @returns Base64-encoded MP3 audio content
   * @throws Error if API call fails
   */
  static async synthesizeSpeech(
    text: string,
    voice: TTSVoiceConfig = TTS_VOICES.FEMALE_PRIMARY,
    speed: number = 1.0
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Cloud API key not configured. Please check .env file.');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Validate speed
    const validSpeed = Math.max(0.5, Math.min(1.5, speed));
    if (validSpeed !== speed) {
      console.warn(`TTS speed ${speed} out of range, clamped to ${validSpeed}`);
    }

    try {
      const requestBody = {
        input: {
          text: text.trim(),
        },
        voice: {
          languageCode: voice.languageCode,
          name: voice.name,
          ssmlGender: voice.gender,
        },
        audioConfig: {
          audioEncoding: DEFAULT_TTS_CONFIG.audioEncoding,
          speakingRate: validSpeed,
          pitch: DEFAULT_TTS_CONFIG.pitch,
          volumeGainDb: DEFAULT_TTS_CONFIG.volumeGainDb,
          sampleRateHertz: DEFAULT_TTS_CONFIG.sampleRateHertz,
        },
      };

      const response = await fetch(`${TTS_API_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: TTSError = await response.json();
        throw new Error(
          `Google Cloud TTS API error (${errorData.error.code}): ${errorData.error.message}`
        );
      }

      const data: TTSResponse = await response.json();

      if (!data.audioContent) {
        throw new Error('No audio content received from TTS API');
      }

      return data.audioContent;
    } catch (error) {
      if (error instanceof Error) {
        console.error('TTS synthesis failed:', error.message);
        throw error;
      }
      throw new Error('Unknown TTS synthesis error');
    }
  }

  /**
   * Get voice configuration from gender string
   *
   * @param gender - 'male' | 'female'
   * @returns TTSVoiceConfig object
   */
  static getVoiceFromGender(gender: 'male' | 'female'): TTSVoiceConfig {
    return gender === 'male' ? TTS_VOICES.MALE_PRIMARY : TTS_VOICES.FEMALE_PRIMARY;
  }

  /**
   * Estimate TTS cost for given text
   * Google Cloud TTS WaveNet pricing: $16 per 1 million characters
   *
   * @param text - Text to estimate cost for
   * @returns Estimated cost in USD
   */
  static estimateCost(text: string): number {
    const characters = text.length;
    const costPerMillion = 16.0;
    return (characters / 1_000_000) * costPerMillion;
  }

  /**
   * Validate API key format
   * Google Cloud API keys start with "AIzaSy"
   *
   * @returns true if API key is valid format
   */
  static isApiKeyValid(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('AIzaSy');
  }

  /**
   * Get character count for text
   * Useful for quota management
   *
   * @param text - Text to count
   * @returns Character count
   */
  static getCharacterCount(text: string): number {
    return text.length;
  }
}

/**
 * Exported utility functions
 */

/**
 * Convert base64 audio to data URI for Audio component
 *
 * @param base64Audio - Base64-encoded audio from TTS API
 * @returns Data URI string
 */
export function base64ToDataUri(base64Audio: string): string {
  return `data:audio/mp3;base64,${base64Audio}`;
}

/**
 * Estimate reading time for text
 * Average speaking rate: ~150 words per minute
 *
 * @param text - Text to estimate
 * @param speed - Speaking speed multiplier (default: 1.0)
 * @returns Estimated duration in seconds
 */
export function estimateAudioDuration(text: string, speed: number = 1.0): number {
  const words = text.split(/\s+/).length;
  const wordsPerMinute = 150 * speed;
  const minutes = words / wordsPerMinute;
  return Math.ceil(minutes * 60);
}

/**
 * Format duration in MM:SS format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "03:45")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
