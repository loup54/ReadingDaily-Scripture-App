/**
 * Audio Services
 * Phase 11: Audio Implementation
 */

export {
  TTSService,
  TTS_VOICES,
  base64ToDataUri,
  estimateAudioDuration,
  formatDuration,
} from './TTSService';

export type {
  TTSVoiceGender,
  TTSLanguageCode,
  TTSVoiceConfig,
  TTSRequest,
  TTSResponse,
  TTSError,
} from './TTSService';

export {
  AudioPlaybackService,
  audioPlaybackService,
} from './AudioPlaybackService';

export type {
  AudioPlaybackState,
  AudioCacheEntry,
} from './AudioPlaybackService';
