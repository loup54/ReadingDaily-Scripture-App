/**
 * Speech Recognition Service
 * Phase D1: Audio Recording
 *
 * Service for recording user's voice reading scripture passages
 * Provides microphone recording, playback, and temporary storage
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // milliseconds
  uri: string | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  uri: string | null;
}

export class SpeechRecognitionService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    uri: null,
  };

  /**
   * Initialize audio mode for recording
   */
  async initialize(): Promise<void> {
    try {
      console.log('[SpeechRecognitionService] Initializing...');

      // Set audio mode for recording (only if setAudioModeAsync exists)
      if (Audio.setAudioModeAsync) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else {
        console.warn('[SpeechRecognitionService] Audio.setAudioModeAsync not available');
      }

      console.log('[SpeechRecognitionService] Initialized successfully');
    } catch (error) {
      console.error('[SpeechRecognitionService] Initialization failed:', error);
      throw new Error('Failed to initialize audio mode');
    }
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('[SpeechRecognitionService] Requesting microphone permissions...');

      const { granted } = await Audio.requestPermissionsAsync();

      if (granted) {
        console.log('[SpeechRecognitionService] Permissions granted');
        return true;
      } else {
        console.warn('[SpeechRecognitionService] Permissions denied');
        return false;
      }
    } catch (error) {
      console.error('[SpeechRecognitionService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { granted } = await Audio.getPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('[SpeechRecognitionService] Permission check failed:', error);
      return false;
    }
  }

  /**
   * Start recording user's voice
   */
  async startRecording(): Promise<void> {
    try {
      console.log('[SpeechRecognitionService] Starting recording...');

      // Check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission required');
        }
      }

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Unload any existing sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create new recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();

      this.recording = recording;
      this.recordingState = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        uri: null,
      };

      // Update duration periodically
      this.startDurationTimer();

      console.log('[SpeechRecognitionService] Recording started');
    } catch (error) {
      console.error('[SpeechRecognitionService] Start recording failed:', error);
      throw new Error('Failed to start recording');
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<string> {
    try {
      console.log('[SpeechRecognitionService] Stopping recording...');

      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      this.recording = null;
      this.recordingState = {
        isRecording: false,
        isPaused: false,
        duration: this.recordingState.duration,
        uri,
      };

      // Reset audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('[SpeechRecognitionService] Recording stopped:', uri);

      return uri || '';
    } catch (error) {
      console.error('[SpeechRecognitionService] Stop recording failed:', error);
      throw new Error('Failed to stop recording');
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (!this.recording || !this.recordingState.isRecording) {
        throw new Error('No active recording');
      }

      await this.recording.pauseAsync();
      this.recordingState.isPaused = true;

      console.log('[SpeechRecognitionService] Recording paused');
    } catch (error) {
      console.error('[SpeechRecognitionService] Pause recording failed:', error);
      throw new Error('Failed to pause recording');
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (!this.recording || !this.recordingState.isPaused) {
        throw new Error('No paused recording');
      }

      await this.recording.startAsync();
      this.recordingState.isPaused = false;

      console.log('[SpeechRecognitionService] Recording resumed');
    } catch (error) {
      console.error('[SpeechRecognitionService] Resume recording failed:', error);
      throw new Error('Failed to resume recording');
    }
  }

  /**
   * Get current recording state
   */
  getRecordingState(): RecordingState {
    return { ...this.recordingState };
  }

  /**
   * Play recorded audio
   */
  async playRecording(uri: string): Promise<void> {
    try {
      console.log('[SpeechRecognitionService] Playing recording:', uri);

      // Stop any existing playback
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;

      console.log('[SpeechRecognitionService] Playback started');
    } catch (error) {
      console.error('[SpeechRecognitionService] Playback failed:', error);
      throw new Error('Failed to play recording');
    }
  }

  /**
   * Stop playback
   */
  async stopPlayback(): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;

      console.log('[SpeechRecognitionService] Playback stopped');
    } catch (error) {
      console.error('[SpeechRecognitionService] Stop playback failed:', error);
      throw new Error('Failed to stop playback');
    }
  }

  /**
   * Pause playback
   */
  async pausePlayback(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No active playback');
      }

      await this.sound.pauseAsync();

      console.log('[SpeechRecognitionService] Playback paused');
    } catch (error) {
      console.error('[SpeechRecognitionService] Pause playback failed:', error);
      throw new Error('Failed to pause playback');
    }
  }

  /**
   * Resume playback
   */
  async resumePlayback(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No active playback');
      }

      await this.sound.playAsync();

      console.log('[SpeechRecognitionService] Playback resumed');
    } catch (error) {
      console.error('[SpeechRecognitionService] Resume playback failed:', error);
      throw new Error('Failed to resume playback');
    }
  }

  /**
   * Get playback status
   */
  async getPlaybackStatus(): Promise<PlaybackState | null> {
    try {
      if (!this.sound) {
        return null;
      }

      const status = await this.sound.getStatusAsync();

      if (!status.isLoaded) {
        return null;
      }

      return {
        isPlaying: status.isPlaying,
        position: status.positionMillis,
        duration: status.durationMillis || 0,
        uri: null,
      };
    } catch (error) {
      console.error('[SpeechRecognitionService] Get playback status failed:', error);
      return null;
    }
  }

  /**
   * Save recording to permanent storage
   */
  async saveRecording(uri: string, filename: string): Promise<string> {
    try {
      console.log('[SpeechRecognitionService] Saving recording:', filename);

      const directory = `${FileSystem.documentDirectory}recordings/`;

      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const destination = `${directory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: destination,
      });

      console.log('[SpeechRecognitionService] Recording saved:', destination);

      return destination;
    } catch (error) {
      console.error('[SpeechRecognitionService] Save recording failed:', error);
      throw new Error('Failed to save recording');
    }
  }

  /**
   * Delete recording
   */
  async deleteRecording(uri: string): Promise<void> {
    try {
      console.log('[SpeechRecognitionService] Deleting recording:', uri);

      await FileSystem.deleteAsync(uri, { idempotent: true });

      console.log('[SpeechRecognitionService] Recording deleted');
    } catch (error) {
      console.error('[SpeechRecognitionService] Delete recording failed:', error);
      throw new Error('Failed to delete recording');
    }
  }

  /**
   * List all saved recordings
   */
  async listRecordings(): Promise<string[]> {
    try {
      const directory = `${FileSystem.documentDirectory}recordings/`;

      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(directory);
      return files.map(file => `${directory}${file}`);
    } catch (error) {
      console.error('[SpeechRecognitionService] List recordings failed:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      console.log('[SpeechRecognitionService] Cleaning up...');

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      this.recordingState = {
        isRecording: false,
        isPaused: false,
        duration: 0,
        uri: null,
      };

      console.log('[SpeechRecognitionService] Cleanup complete');
    } catch (error) {
      console.error('[SpeechRecognitionService] Cleanup failed:', error);
    }
  }

  /**
   * Playback status update callback
   */
  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    if (status.didJustFinish) {
      console.log('[SpeechRecognitionService] Playback finished');
      // Reset sound
      this.sound?.setPositionAsync(0);
    }
  };

  /**
   * Start duration timer
   */
  private startDurationTimer() {
    const interval = setInterval(async () => {
      if (!this.recording || !this.recordingState.isRecording) {
        clearInterval(interval);
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          this.recordingState.duration = status.durationMillis;
        }
      } catch (error) {
        console.error('[SpeechRecognitionService] Duration update failed:', error);
        clearInterval(interval);
      }
    }, 100); // Update every 100ms
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();
