/**
 * PracticeStorageService Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PracticeStorageService from '../PracticeStorageService';
import { PracticeSession } from '@/types/practice.types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('PracticeStorageService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
  });

  const mockSession: PracticeSession = {
    id: 'test-session-1',
    readingId: 'reading-1',
    date: new Date().toISOString(),
    sentences: [
      {
        id: 'sentence-1',
        text: 'This is a test sentence for practice.',
        source: 'Gospel',
        reference: 'Test 1:1',
        difficulty: 'medium',
        wordCount: 7,
      },
    ],
    attempts: [
      {
        id: 'attempt-1',
        sentenceId: 'sentence-1',
        audioUri: 'file:///test.wav',
        result: {
          recognizedText: 'This is a test sentence for practice',
          scores: {
            accuracyScore: 85,
            fluencyScore: 80,
            completenessScore: 90,
            prosodyScore: 75,
            overallScore: 82,
          },
          words: [],
          duration: 2.5,
          confidence: 0.85,
        },
        timestamp: Date.now(),
      },
    ],
    currentIndex: 0,
    completed: true,
    startTime: Date.now() - 300000,
    endTime: Date.now(),
  };

  describe('Session Management', () => {
    describe('saveSession', () => {
      it('should save session to AsyncStorage', async () => {
        await PracticeStorageService.saveSession(mockSession);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@practice_current_session',
          JSON.stringify(mockSession)
        );
      });

      it('should handle save errors', async () => {
        (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Save failed'));

        await expect(PracticeStorageService.saveSession(mockSession)).rejects.toThrow();
      });
    });

    describe('loadSession', () => {
      it('should load session from AsyncStorage', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
          JSON.stringify(mockSession)
        );

        const result = await PracticeStorageService.loadSession();

        expect(result).toEqual(mockSession);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@practice_current_session');
      });

      it('should return null if no session exists', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

        const result = await PracticeStorageService.loadSession();

        expect(result).toBeNull();
      });

      it('should handle load errors', async () => {
        (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Load failed'));

        const result = await PracticeStorageService.loadSession();

        expect(result).toBeNull();
      });
    });

    describe('clearSession', () => {
      it('should remove current session from AsyncStorage', async () => {
        await PracticeStorageService.clearSession();

        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@practice_current_session');
      });
    });
  });

  describe('History Management', () => {
    describe('addToHistory', () => {
      it('should add session to history', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
          JSON.stringify({
            sessions: [],
            totalSessions: 0,
            totalAttempts: 0,
            lastPracticeDate: '',
          })
        );

        await PracticeStorageService.addToHistory(mockSession);

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@practice_history',
          expect.stringContaining(mockSession.id)
        );
      });

      it('should update totals when adding to history', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
          JSON.stringify({
            sessions: [],
            totalSessions: 0,
            totalAttempts: 0,
            lastPracticeDate: '',
          })
        );

        await PracticeStorageService.addToHistory(mockSession);

        const savedData = JSON.parse(
          (AsyncStorage.setItem as jest.Mock).mock.calls.find(
            call => call[0] === '@practice_history'
          )?.[1] || '{}'
        );

        expect(savedData.totalSessions).toBe(1);
        expect(savedData.totalAttempts).toBe(mockSession.attempts.length);
      });

      it('should limit history to 50 sessions', async () => {
        // Create 51 sessions
        const existingSessions = Array(50).fill(null).map((_, i) => ({
          ...mockSession,
          id: `session-${i}`,
        }));

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
          JSON.stringify({
            sessions: existingSessions,
            totalSessions: 50,
            totalAttempts: 50,
            lastPracticeDate: '',
          })
        );

        await PracticeStorageService.addToHistory(mockSession);

        const savedData = JSON.parse(
          (AsyncStorage.setItem as jest.Mock).mock.calls.find(
            call => call[0] === '@practice_history'
          )?.[1] || '{}'
        );

        expect(savedData.sessions.length).toBe(50);
        expect(savedData.sessions[0].id).toBe(mockSession.id); // New session at start
      });
    });

    describe('getHistory', () => {
      it('should return empty history if none exists', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

        const result = await PracticeStorageService.getHistory();

        expect(result).toEqual({
          sessions: [],
          totalSessions: 0,
          totalAttempts: 0,
          lastPracticeDate: '',
        });
      });

      it('should return stored history', async () => {
        const mockHistory = {
          sessions: [mockSession],
          totalSessions: 1,
          totalAttempts: 1,
          lastPracticeDate: mockSession.date,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
          JSON.stringify(mockHistory)
        );

        const result = await PracticeStorageService.getHistory();

        expect(result).toEqual(mockHistory);
      });
    });
  });

  describe('Statistics', () => {
    describe('getStats', () => {
      it('should return default stats if none exist', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

        const result = await PracticeStorageService.getStats();

        expect(result).toEqual({
          averageScore: 0,
          averageAccuracy: 0,
          averageFluency: 0,
          averageCompleteness: 0,
          averageProsody: 0,
          totalSentencesPracticed: 0,
          streakDays: 0,
          bestScore: 0,
          improvementRate: 0,
        });
      });

      it('should return stored stats', async () => {
        const mockStats = {
          averageScore: 82,
          averageAccuracy: 85,
          averageFluency: 80,
          averageCompleteness: 90,
          averageProsody: 75,
          totalSentencesPracticed: 25,
          streakDays: 5,
          bestScore: 95,
          improvementRate: 15,
        };

        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
          JSON.stringify(mockStats)
        );

        const result = await PracticeStorageService.getStats();

        expect(result).toEqual(mockStats);
      });
    });
  });

  describe('Data Management', () => {
    describe('clearAll', () => {
      it('should remove all practice data', async () => {
        await PracticeStorageService.clearAll();

        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
          '@practice_history',
          '@practice_current_session',
          '@practice_stats',
        ]);
      });
    });

    describe('exportData', () => {
      it('should export all practice data as JSON', async () => {
        const mockHistory = {
          sessions: [mockSession],
          totalSessions: 1,
          totalAttempts: 1,
          lastPracticeDate: mockSession.date,
        };

        const mockStats = {
          averageScore: 82,
          averageAccuracy: 85,
          averageFluency: 80,
          averageCompleteness: 90,
          averageProsody: 75,
          totalSentencesPracticed: 25,
          streakDays: 5,
          bestScore: 95,
          improvementRate: 15,
        };

        (AsyncStorage.getItem as jest.Mock)
          .mockResolvedValueOnce(JSON.stringify(mockHistory))  // history
          .mockResolvedValueOnce(JSON.stringify(mockStats))    // stats
          .mockResolvedValueOnce(JSON.stringify(mockSession)); // current session

        const result = await PracticeStorageService.exportData();

        expect(typeof result).toBe('string');

        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty('history');
        expect(parsed).toHaveProperty('stats');
        expect(parsed).toHaveProperty('currentSession');
        expect(parsed).toHaveProperty('exportDate');
      });
    });

    describe('importData', () => {
      it('should import practice data from JSON', async () => {
        const exportData = {
          history: {
            sessions: [mockSession],
            totalSessions: 1,
            totalAttempts: 1,
            lastPracticeDate: mockSession.date,
          },
          stats: {
            averageScore: 82,
            averageAccuracy: 85,
            averageFluency: 80,
            averageCompleteness: 90,
            averageProsody: 75,
            totalSentencesPracticed: 25,
            streakDays: 5,
            bestScore: 95,
            improvementRate: 15,
          },
          currentSession: mockSession,
          exportDate: new Date().toISOString(),
        };

        await PracticeStorageService.importData(JSON.stringify(exportData));

        expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@practice_history',
          expect.any(String)
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@practice_stats',
          expect.any(String)
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@practice_current_session',
          expect.any(String)
        );
      });

      it('should handle invalid JSON', async () => {
        await expect(
          PracticeStorageService.importData('invalid json')
        ).rejects.toThrow();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json');

      const result = await PracticeStorageService.loadSession();

      expect(result).toBeNull();
    });

    it('should handle empty sessions array', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          sessions: [],
          totalSessions: 0,
          totalAttempts: 0,
          lastPracticeDate: '',
        })
      );

      const result = await PracticeStorageService.getHistory();

      expect(result.sessions).toEqual([]);
      expect(result.totalSessions).toBe(0);
    });
  });
});
