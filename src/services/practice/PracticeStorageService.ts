/**
 * Practice Storage Service
 *
 * Handles persistent storage of practice sessions and history.
 * Features:
 * - Save/load practice sessions
 * - Track practice history and statistics
 * - Calculate progress metrics
 * - Store attempt records
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PracticeSession, PracticeAttempt, PronunciationScore } from '@/types/practice.types';

const STORAGE_KEYS = {
  PRACTICE_HISTORY: '@practice_history',
  CURRENT_SESSION: '@practice_current_session',
  PRACTICE_STATS: '@practice_stats',
} as const;

export interface PracticeHistory {
  sessions: PracticeSession[];
  totalSessions: number;
  totalAttempts: number;
  lastPracticeDate: string;
}

export interface PracticeStats {
  averageScore: number;
  averageAccuracy: number;
  averageFluency: number;
  averageCompleteness: number;
  averageProsody: number;
  totalSentencesPracticed: number;
  streakDays: number;
  bestScore: number;
  improvementRate: number; // percentage change over last 10 sessions
}

class PracticeStorageService {
  /**
   * Save current practice session
   */
  static async saveSession(session: PracticeSession): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_SESSION,
        JSON.stringify(session)
      );
      console.log('✅ Practice session saved:', session.id);
    } catch (error) {
      console.error('Failed to save practice session:', error);
      throw error;
    }
  }

  /**
   * Load current practice session
   */
  static async loadSession(): Promise<PracticeSession | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (!data) return null;

      return JSON.parse(data) as PracticeSession;
    } catch (error) {
      console.error('Failed to load practice session:', error);
      return null;
    }
  }

  /**
   * Clear current session
   */
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
      console.log('🗑️ Current practice session cleared');
    } catch (error) {
      console.error('Failed to clear practice session:', error);
    }
  }

  /**
   * Add completed session to history
   */
  static async addToHistory(session: PracticeSession): Promise<void> {
    try {
      const history = await this.getHistory();

      // Add session to history
      history.sessions.unshift(session); // Add to beginning

      // Keep only last 50 sessions
      if (history.sessions.length > 50) {
        history.sessions = history.sessions.slice(0, 50);
      }

      // Update totals
      history.totalSessions = history.sessions.length;
      history.totalAttempts = history.sessions.reduce(
        (sum, s) => sum + s.attempts.length,
        0
      );
      history.lastPracticeDate = session.date;

      await AsyncStorage.setItem(
        STORAGE_KEYS.PRACTICE_HISTORY,
        JSON.stringify(history)
      );

      // Update stats
      await this.updateStats(history);

      console.log('✅ Session added to practice history:', session.id);
    } catch (error) {
      console.error('Failed to add session to history:', error);
      throw error;
    }
  }

  /**
   * Get practice history
   */
  static async getHistory(): Promise<PracticeHistory> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_HISTORY);
      if (!data) {
        return {
          sessions: [],
          totalSessions: 0,
          totalAttempts: 0,
          lastPracticeDate: '',
        };
      }

      return JSON.parse(data) as PracticeHistory;
    } catch (error) {
      console.error('Failed to get practice history:', error);
      return {
        sessions: [],
        totalSessions: 0,
        totalAttempts: 0,
        lastPracticeDate: '',
      };
    }
  }

  /**
   * Get practice statistics
   */
  static async getStats(): Promise<PracticeStats> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_STATS);
      if (!data) {
        return this.getDefaultStats();
      }

      return JSON.parse(data) as PracticeStats;
    } catch (error) {
      console.error('Failed to get practice stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Update practice statistics from history
   */
  private static async updateStats(history: PracticeHistory): Promise<void> {
    try {
      const stats = await this.calculateStats(history);

      await AsyncStorage.setItem(
        STORAGE_KEYS.PRACTICE_STATS,
        JSON.stringify(stats)
      );

      console.log('✅ Practice stats updated');
    } catch (error) {
      console.error('Failed to update practice stats:', error);
    }
  }

  /**
   * Calculate statistics from history
   */
  private static async calculateStats(history: PracticeHistory): Promise<PracticeStats> {
    if (history.sessions.length === 0) {
      return this.getDefaultStats();
    }

    // Collect all scores from all attempts
    const allScores: PronunciationScore[] = [];
    let totalSentences = 0;

    for (const session of history.sessions) {
      totalSentences += session.sentences.length;
      for (const attempt of session.attempts) {
        if (attempt.result) {
          allScores.push(attempt.result.scores);
        }
      }
    }

    if (allScores.length === 0) {
      return this.getDefaultStats();
    }

    // Calculate averages
    const averageScore = allScores.reduce((sum, s) => sum + s.overallScore, 0) / allScores.length;
    const averageAccuracy = allScores.reduce((sum, s) => sum + s.accuracyScore, 0) / allScores.length;
    const averageFluency = allScores.reduce((sum, s) => sum + s.fluencyScore, 0) / allScores.length;
    const averageCompleteness = allScores.reduce((sum, s) => sum + s.completenessScore, 0) / allScores.length;
    const averageProsody = allScores.reduce((sum, s) => sum + s.prosodyScore, 0) / allScores.length;

    // Find best score
    const bestScore = Math.max(...allScores.map(s => s.overallScore));

    // Calculate improvement rate (last 10 vs previous 10)
    const improvementRate = this.calculateImprovementRate(allScores);

    // Calculate streak
    const streakDays = this.calculateStreak(history);

    return {
      averageScore: Math.round(averageScore),
      averageAccuracy: Math.round(averageAccuracy),
      averageFluency: Math.round(averageFluency),
      averageCompleteness: Math.round(averageCompleteness),
      averageProsody: Math.round(averageProsody),
      totalSentencesPracticed: totalSentences,
      streakDays,
      bestScore: Math.round(bestScore),
      improvementRate: Math.round(improvementRate),
    };
  }

  /**
   * Calculate improvement rate
   */
  private static calculateImprovementRate(scores: PronunciationScore[]): number {
    if (scores.length < 10) return 0;

    // Get recent 10 scores
    const recent10 = scores.slice(0, 10);
    const recentAvg = recent10.reduce((sum, s) => sum + s.overallScore, 0) / 10;

    // Get previous 10 scores (if available)
    if (scores.length < 20) {
      // Not enough data, compare with overall average
      const overallAvg = scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
      return ((recentAvg - overallAvg) / overallAvg) * 100;
    }

    const previous10 = scores.slice(10, 20);
    const previousAvg = previous10.reduce((sum, s) => sum + s.overallScore, 0) / 10;

    if (previousAvg === 0) return 0;

    return ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  /**
   * Calculate practice streak in days
   */
  private static calculateStreak(history: PracticeHistory): number {
    if (history.sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    for (const session of history.sessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      // Check if session is on current date
      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        // Gap in streak
        break;
      }
    }

    return streak;
  }

  /**
   * Get default stats
   */
  private static getDefaultStats(): PracticeStats {
    return {
      averageScore: 0,
      averageAccuracy: 0,
      averageFluency: 0,
      averageCompleteness: 0,
      averageProsody: 0,
      totalSentencesPracticed: 0,
      streakDays: 0,
      bestScore: 0,
      improvementRate: 0,
    };
  }

  /**
   * Clear all practice data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PRACTICE_HISTORY,
        STORAGE_KEYS.CURRENT_SESSION,
        STORAGE_KEYS.PRACTICE_STATS,
      ]);
      console.log('🗑️ All practice data cleared');
    } catch (error) {
      console.error('Failed to clear practice data:', error);
      throw error;
    }
  }

  /**
   * Export practice data (for backup or analysis)
   */
  static async exportData(): Promise<string> {
    try {
      const history = await this.getHistory();
      const stats = await this.getStats();
      const currentSession = await this.loadSession();

      const exportData = {
        history,
        stats,
        currentSession,
        exportDate: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export practice data:', error);
      throw error;
    }
  }

  /**
   * Import practice data (from backup)
   */
  static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (data.history) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PRACTICE_HISTORY,
          JSON.stringify(data.history)
        );
      }

      if (data.stats) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PRACTICE_STATS,
          JSON.stringify(data.stats)
        );
      }

      if (data.currentSession) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CURRENT_SESSION,
          JSON.stringify(data.currentSession)
        );
      }

      console.log('✅ Practice data imported successfully');
    } catch (error) {
      console.error('Failed to import practice data:', error);
      throw error;
    }
  }
}

export default PracticeStorageService;
