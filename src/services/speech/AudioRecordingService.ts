/**
 * Audio Recording Service
 *
 * Handles microphone recording for pronunciation practice using expo-audio.
 * Features:
 * - Request microphone permissions
 * - Start/stop recording
 * - WAV format output (required for Azure Speech)
 * - Recording duration tracking
 */

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { PracticeError, RecordingState } from '@/types/practice.types';

export interface RecordingInfo {
  uri: string;
  duration: number; // in milliseconds
  size: number; // in bytes
}

class AudioRecordingService {
  private static recording: Audio.Recording | null = null;
  private static recordingState: RecordingState = 'idle';

  /**
   * Request microphone permissions
   *
   * @returns true if granted, false if denied
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status, granted } = await Audio.requestPermissionsAsync();

      if (granted) {
        console.log('✅ Microphone permission granted');
        return true;
      }

      console.warn('⚠️ Microphone permission denied:', status);
      return false;
    } catch (error) {
      console.error('Failed to request microphone permission:', error);
      return false;
    }
  }

  /**
   * Check if microphone permissions are granted
   */
  static async hasPermissions(): Promise<boolean> {
    const { granted } = await Audio.getPermissionsAsync();
    return granted;
  }

  /**
   * Prepare audio mode for recording
   */
  private static async prepareAudioMode(): Promise<void> {
    // expo-audio API is different from expo-av
    // Only call setAudioModeAsync if it exists
    if (Audio.setAudioModeAsync) {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
    }
  }

  /**
   * Start recording audio
   *
   * @throws PracticeError if permissions denied or recording fails
   */
  static async startRecording(): Promise<void> {
    try {
      // Check permissions
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        throw this.createError(
          'PERMISSION_DENIED',
          'Microphone permission is required for pronunciation practice'
        );
      }

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      this.recordingState = 'preparing';

      // Prepare audio mode
      await this.prepareAudioMode();

      // Create new recording
      const recording = new Audio.Recording();

      // Configure recording options for WAV format (required by Azure)
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000, // Azure prefers 16kHz
          numberOfChannels: 1, // Mono
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000, // Azure prefers 16kHz
          numberOfChannels: 1, // Mono
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      };

      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      this.recording = recording;
      this.recordingState = 'recording';

      console.log('🎤 Recording started');
    } catch (error) {
      this.recordingState = 'error';
      console.error('Failed to start recording:', error);

      throw this.createError(
        'RECORDING_FAILED',
        'Failed to start audio recording',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  /**
   * Stop recording and return file info
   *
   * @returns Recording info with file URI
   * @throws PracticeError if no recording in progress
   */
  static async stopRecording(): Promise<RecordingInfo> {
    if (!this.recording) {
      throw this.createError('RECORDING_FAILED', 'No recording in progress');
    }

    try {
      this.recordingState = 'processing';

      const status = await this.recording.getStatusAsync();
      await this.recording.stopAndUnloadAsync();

      const uri = this.recording.getURI();
      this.recording = null;

      if (!uri) {
        throw this.createError('RECORDING_FAILED', 'Recording URI is null');
      }

      const recordingInfo: RecordingInfo = {
        uri,
        duration: status.durationMillis || 0,
        size: 0, // Size will be determined when needed
      };

      this.recordingState = 'complete';
      console.log('✅ Recording stopped:', recordingInfo);

      return recordingInfo;
    } catch (error) {
      this.recordingState = 'error';
      console.error('Failed to stop recording:', error);

      throw this.createError(
        'RECORDING_FAILED',
        'Failed to stop audio recording',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      // Reset audio mode
      if (Audio.setAudioModeAsync) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      }
    }
  }

  /**
   * Cancel current recording without saving
   */
  static async cancelRecording(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.recordingState = 'idle';
        console.log('🚫 Recording cancelled');
      } catch (error) {
        console.error('Failed to cancel recording:', error);
      }
    }
  }

  /**
   * Get current recording state
   */
  static getRecordingState(): RecordingState {
    return this.recordingState;
  }

  /**
   * Check if currently recording
   */
  static isRecording(): boolean {
    return this.recordingState === 'recording';
  }

  /**
   * Get recording duration in milliseconds
   */
  static async getRecordingDuration(): Promise<number> {
    if (!this.recording) {
      return 0;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return status.durationMillis || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Delete recording file
   */
  static async deleteRecording(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log('🗑️ Recording deleted:', uri);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  }

  /**
   * Create a standardized error
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
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration for display (mm:ss)
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export default AudioRecordingService;
