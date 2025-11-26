/**
 * Practice Store using Zustand
 * Manages pronunciation practice state across the app
 */

import { create } from 'zustand';
import {
  PracticeSession,
  PracticeAttempt,
  PracticeSentence,
  PronunciationResult,
  RecordingState,
  PracticeError,
} from '@/types/practice.types';
import { DailyReadings } from '@/types/reading.types';
import { SentenceExtractionService, PracticeStorageService, PracticeHistory, PracticeStats } from '@/services/practice';
import { AudioRecordingService, AzureSpeechService } from '@/services/speech';

interface PracticeStoreState {
  // Current session
  currentSession: PracticeSession | null;

  // Recording state
  recordingState: RecordingState;
  recordingDuration: number;

  // Latest attempt
  latestAttempt: PracticeAttempt | null;
  latestResult: PronunciationResult | null;

  // Error state
  error: PracticeError | null;

  // Permissions
  hasPermissions: boolean;

  // Loading states
  isLoadingSession: boolean;
  isAssessing: boolean;

  // Progress tracking
  history: PracticeHistory | null;
  stats: PracticeStats | null;
  isLoadingHistory: boolean;

  // Actions - Session Management
  startSession: (readings: DailyReadings) => Promise<void>;
  endSession: () => void;
  nextSentence: () => void;
  previousSentence: () => void;
  goToSentence: (index: number) => void;

  // Actions - Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  updateRecordingDuration: (duration: number) => void;

  // Actions - Assessment
  assessPronunciation: (audioUri: string, referenceText: string) => Promise<void>;

  // Actions - Permissions
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;

  // Actions - Error handling
  clearError: () => void;
  setError: (error: PracticeError) => void;

  // Actions - Progress tracking
  loadHistory: () => Promise<void>;
  loadStats: () => Promise<void>;
  saveSession: () => Promise<void>;

  // Actions - Utilities
  reset: () => void;
}

export const usePracticeStore = create<PracticeStoreState>((set, get) => ({
  // Initial state
  currentSession: null,
  recordingState: 'idle',
  recordingDuration: 0,
  latestAttempt: null,
  latestResult: null,
  error: null,
  hasPermissions: false,
  isLoadingSession: false,
  isAssessing: false,
  history: null,
  stats: null,
  isLoadingHistory: false,

  // Session Management
  startSession: async (readings: DailyReadings) => {
    set({ isLoadingSession: true, error: null });

    try {
      // Extract practice sentences
      const sentences = SentenceExtractionService.extractPracticeSentences(readings);

      // Validate sentences
      const validation = SentenceExtractionService.validateSentences(sentences);
      if (!validation.valid) {
        throw {
          code: 'UNKNOWN',
          message: 'Invalid practice sentences',
          details: validation.errors.join(', '),
        } as PracticeError;
      }

      // Create new session
      const session: PracticeSession = {
        id: `session-${Date.now()}`,
        readingId: readings.gospel.id, // Use gospel ID as primary
        date: new Date().toISOString(),
        sentences,
        attempts: [],
        currentIndex: 0,
        completed: false,
        startTime: Date.now(),
      };

      set({
        currentSession: session,
        isLoadingSession: false,
        latestAttempt: null,
        latestResult: null,
      });

      console.log('✅ Practice session started:', session.id);
    } catch (error) {
      const practiceError = error as PracticeError;
      set({
        isLoadingSession: false,
        error: practiceError,
      });
      console.error('Failed to start practice session:', practiceError);
    }
  },

  endSession: async () => {
    const session = get().currentSession;
    if (!session) return;

    const updatedSession: PracticeSession = {
      ...session,
      completed: true,
      endTime: Date.now(),
    };

    set({
      currentSession: updatedSession,
    });

    // Save to history
    try {
      await PracticeStorageService.addToHistory(updatedSession);
      await get().loadHistory();
      await get().loadStats();
    } catch (error) {
      console.error('Failed to save session to history:', error);
    }

    console.log('✅ Practice session completed:', updatedSession.id);
  },

  nextSentence: () => {
    const session = get().currentSession;
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.sentences.length) {
      // Session complete
      get().endSession();
      return;
    }

    set({
      currentSession: {
        ...session,
        currentIndex: nextIndex,
      },
      latestAttempt: null,
      latestResult: null,
    });
  },

  previousSentence: () => {
    const session = get().currentSession;
    if (!session) return;

    const prevIndex = Math.max(0, session.currentIndex - 1);
    set({
      currentSession: {
        ...session,
        currentIndex: prevIndex,
      },
      latestAttempt: null,
      latestResult: null,
    });
  },

  goToSentence: (index: number) => {
    const session = get().currentSession;
    if (!session) return;

    if (index < 0 || index >= session.sentences.length) return;

    set({
      currentSession: {
        ...session,
        currentIndex: index,
      },
      latestAttempt: null,
      latestResult: null,
    });
  },

  // Recording
  startRecording: async () => {
    set({ error: null });

    try {
      // Check permissions
      const hasPermission = await AudioRecordingService.hasPermissions();
      if (!hasPermission) {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'Microphone permission required',
        } as PracticeError;
      }

      // Start recording
      await AudioRecordingService.startRecording();

      set({
        recordingState: 'recording',
        recordingDuration: 0,
      });

      console.log('🎤 Recording started');
    } catch (error) {
      const practiceError = error as PracticeError;
      set({
        recordingState: 'error',
        error: practiceError,
      });
      console.error('Failed to start recording:', practiceError);
    }
  },

  stopRecording: async () => {
    set({ recordingState: 'processing' });

    try {
      const recordingInfo = await AudioRecordingService.stopRecording();

      set({
        recordingState: 'complete',
        recordingDuration: recordingInfo.duration,
      });

      console.log('✅ Recording stopped:', recordingInfo);

      // Auto-assess the recording
      const session = get().currentSession;
      if (session) {
        const currentSentence = session.sentences[session.currentIndex];
        await get().assessPronunciation(recordingInfo.uri, currentSentence.text);
      }
    } catch (error) {
      const practiceError = error as PracticeError;
      set({
        recordingState: 'error',
        error: practiceError,
      });
      console.error('Failed to stop recording:', practiceError);
    }
  },

  cancelRecording: async () => {
    try {
      await AudioRecordingService.cancelRecording();
      set({
        recordingState: 'idle',
        recordingDuration: 0,
      });
      console.log('🚫 Recording cancelled');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  },

  updateRecordingDuration: (duration: number) => {
    set({ recordingDuration: duration });
  },

  // Assessment
  assessPronunciation: async (audioUri: string, referenceText: string) => {
    set({ isAssessing: true, error: null });

    try {
      // Perform pronunciation assessment
      const result = await AzureSpeechService.assessPronunciation(audioUri, referenceText);

      // Create attempt record
      const attempt: PracticeAttempt = {
        id: `attempt-${Date.now()}`,
        sentenceId: get().currentSession?.sentences[get().currentSession.currentIndex].id || '',
        audioUri,
        result,
        timestamp: Date.now(),
      };

      // Update session with new attempt
      const session = get().currentSession;
      if (session) {
        const updatedSession: PracticeSession = {
          ...session,
          attempts: [...session.attempts, attempt],
        };

        set({
          currentSession: updatedSession,
          latestAttempt: attempt,
          latestResult: result,
          isAssessing: false,
        });

        console.log('✅ Pronunciation assessed:', result.scores);
      }
    } catch (error) {
      const practiceError = error as PracticeError;
      set({
        isAssessing: false,
        error: practiceError,
      });
      console.error('Failed to assess pronunciation:', practiceError);
    }
  },

  // Permissions
  requestPermissions: async () => {
    try {
      const granted = await AudioRecordingService.requestPermissions();
      set({ hasPermissions: granted });
      return granted;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  },

  checkPermissions: async () => {
    const granted = await AudioRecordingService.hasPermissions();
    set({ hasPermissions: granted });
  },

  // Error handling
  clearError: () => {
    set({ error: null });
  },

  setError: (error: PracticeError) => {
    set({ error });
  },

  // Progress tracking
  loadHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const history = await PracticeStorageService.getHistory();
      set({ history, isLoadingHistory: false });
    } catch (error) {
      console.error('Failed to load practice history:', error);
      set({ isLoadingHistory: false });
    }
  },

  loadStats: async () => {
    try {
      const stats = await PracticeStorageService.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to load practice stats:', error);
    }
  },

  saveSession: async () => {
    const session = get().currentSession;
    if (!session) return;

    try {
      await PracticeStorageService.saveSession(session);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  // Utilities
  reset: () => {
    set({
      currentSession: null,
      recordingState: 'idle',
      recordingDuration: 0,
      latestAttempt: null,
      latestResult: null,
      error: null,
      isLoadingSession: false,
      isAssessing: false,
    });
  },
}));
