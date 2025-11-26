/**
 * Google Cloud Text-to-Speech Service
 *
 * Generates natural-sounding audio for pronunciation comparison
 */

import { ENV } from '@/config/env';
import * as FileSystemLegacy from 'expo-file-system/legacy';

// Use the legacy API to avoid deprecation warnings
const FileSystem = FileSystemLegacy;
const cacheDirectory = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';

interface TTSRequest {
  text: string;
  languageCode?: string;
  voiceName?: string;
}

class GoogleTTSService {
  private static API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

  /**
   * Generate speech from text using Google Cloud TTS
   * @param text - The text to convert to speech
   * @param languageCode - Language code (default: 'en-US')
   * @param voiceName - Specific voice to use (optional)
   * @returns URI to the generated audio file
   */
  async speak(
    text: string,
    languageCode: string = 'en-US',
    voiceName?: string
  ): Promise<string> {
    try {
      // Validate API key before making request
      if (!ENV.GOOGLE_CLOUD_API_KEY || ENV.GOOGLE_CLOUD_API_KEY.trim() === '') {
        const errorMsg = 'Google Cloud API key is not configured. Please set EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY in your environment.';
        console.error('[GoogleTTS]', errorMsg);
        throw new Error(errorMsg);
      }

      if (!ENV.GOOGLE_CLOUD_API_KEY.startsWith('AIzaSy')) {
        const errorMsg = 'Google Cloud API key appears to be invalid (should start with AIzaSy). Please check EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY.';
        console.error('[GoogleTTS]', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[GoogleTTS] Generating speech for:', text.substring(0, 50) + '...', 'in language:', languageCode);

      const response = await fetch(`${GoogleTTSService.API_URL}?key=${ENV.GOOGLE_CLOUD_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode,
            name: voiceName || `${languageCode}-Standard-A`,
            ssmlGender: 'NEUTRAL',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TTS API error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error('No audio content in TTS response');
      }

      // Save audio to local file
      const audioUri = `${cacheDirectory}tts_${Date.now()}.mp3`;
      await (FileSystem as any).writeAsStringAsync(audioUri, data.audioContent, {
        encoding: 'base64',
      });

      console.log('[GoogleTTS] Audio saved to:', audioUri);
      return audioUri;
    } catch (error) {
      console.error('[GoogleTTS] Failed to generate speech:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to generate speech: ${error.message}`
          : 'Unknown TTS error'
      );
    }
  }

  /**
   * Generate and cache audio for a word with language code mapping
   * Used by PronunciationButton for word-level pronunciation
   *
   * @param word - The word to generate audio for
   * @param languageCode - TTS language code (e.g., 'es-ES', 'fr-FR')
   * @returns URI to cached audio file
   */
  async generateAndCacheAudio(word: string, languageCode: string = 'en-US'): Promise<string> {
    try {
      // Create cache key
      const cacheKey = `word_${word.toLowerCase()}_${languageCode}`;
      const cachedUri = `${cacheDirectory}${cacheKey}.mp3`;

      // Check if already cached
      try {
        const fileInfo = await (FileSystem as any).getInfoAsync(cachedUri);
        if (fileInfo.exists) {
          console.log('[GoogleTTS] Using cached audio for word:', word);
          return cachedUri;
        }
      } catch {
        // File doesn't exist, continue to generate
      }

      // Generate new audio
      const audioUri = await this.speak(word, languageCode);

      // Rename to cache location if different
      if (audioUri !== cachedUri) {
        try {
          await (FileSystem as any).moveAsync({
            from: audioUri,
            to: cachedUri,
          });
        } catch {
          // If rename fails, just return the generated URI
          return audioUri;
        }
      }

      return cachedUri;
    } catch (error) {
      console.error('[GoogleTTS] Failed to generate and cache audio:', error);
      throw new Error(
        error instanceof Error
          ? `Failed to generate audio: ${error.message}`
          : 'Unknown TTS error'
      );
    }
  }

  /**
   * Clean up generated TTS audio files
   */
  async cleanup(): Promise<void> {
    try {
      const dir = cacheDirectory;
      if (!dir) return;

      const files = await (FileSystem as any).readDirectoryAsync(dir);
      const ttsFiles = files.filter((f: string) =>
        (f.startsWith('tts_') || f.startsWith('word_')) && f.endsWith('.mp3')
      );

      for (const file of ttsFiles) {
        await (FileSystem as any).deleteAsync(`${dir}${file}`, { idempotent: true });
      }

      console.log(`[GoogleTTS] Cleaned up ${ttsFiles.length} TTS files`);
    } catch (error) {
      console.error('[GoogleTTS] Cleanup failed:', error);
    }
  }
}

/**
 * Export both instance and factory function
 */
export const getGoogleTTSService = (): GoogleTTSService => {
  return googleTTSService;
};

// Export singleton instance
export const googleTTSService = new GoogleTTSService();
