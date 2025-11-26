/**
 * Practice Session Service
 *
 * Manages practice session tracking for the freemium model:
 * - Tracks session start/end
 * - Updates daily practice minutes
 * - Checks daily limit for free tier
 * - Handles daily counter reset at midnight
 *
 * Integration point between UI and subscription state
 */

import { useTrialStore } from '@/stores/useTrialStore';
import { v4 as uuidv4 } from 'uuid';

export interface SessionStartResult {
  sessionId: string;
  remainingMinutes: number;
  tier: 'free' | 'basic';
  isLimitReached: boolean;
}

export interface SessionEndResult {
  sessionId: string;
  totalMinutesUsedToday: number;
  remainingMinutes: number;
  limitReached: boolean;
  tier: 'free' | 'basic';
}

/**
 * Practice session service for tracking user practice time
 */
export class PracticeSessionService {
  private static instance: PracticeSessionService;

  /**
   * Get singleton instance
   */
  public static getInstance(): PracticeSessionService {
    if (!PracticeSessionService.instance) {
      PracticeSessionService.instance = new PracticeSessionService();
    }
    return PracticeSessionService.instance;
  }

  /**
   * Start a practice session
   *
   * Call this when user begins practicing (record button pressed)
   */
  public startSession(): SessionStartResult {
    const state = useTrialStore.getState();

    // Ensure daily counter is reset if needed
    state._checkAndResetDailyCounter();

    const remainingMinutes = state.getRemainingDailyMinutes();
    const isLimitReached = state.isDailyLimitReached();

    const sessionId = uuidv4();

    console.log(
      `📱 Session started [${sessionId}] | Remaining: ${remainingMinutes} min | Tier: ${state.currentTier}`
    );

    return {
      sessionId,
      remainingMinutes,
      tier: state.currentTier,
      isLimitReached,
    };
  }

  /**
   * End a practice session and update daily usage
   *
   * Call this when user stops recording and completes analysis
   * @param durationMinutes - How long the user practiced (usually 0.5-5 min per sentence)
   */
  public endSession(durationMinutes: number): SessionEndResult {
    const state = useTrialStore.getState();

    // Add practice minutes to daily counter
    state.addPracticeMinutes(durationMinutes);

    // Check if daily limit reached
    const limitReached = state.isDailyLimitReached();
    const remainingMinutes = state.getRemainingDailyMinutes();
    const totalUsedToday = state.dailyPracticeMinutesUsed;

    const result: SessionEndResult = {
      sessionId: '', // Not tracked in this version
      totalMinutesUsedToday: totalUsedToday,
      remainingMinutes,
      limitReached,
      tier: state.currentTier,
    };

    console.log(
      `⏹️  Session ended | Added: ${durationMinutes} min | Total today: ${totalUsedToday} min | Remaining: ${remainingMinutes} min | Limit reached: ${limitReached}`
    );

    return result;
  }

  /**
   * Check if daily counter needs reset (midnight UTC)
   *
   * Automatically called by the store, but available for manual checks
   */
  public checkAndResetDailyCounter(): void {
    const state = useTrialStore.getState();
    state._checkAndResetDailyCounter();
  }

  /**
   * Manually reset daily counter (for testing or user action)
   */
  public resetDailyCounter(): void {
    const state = useTrialStore.getState();
    state.resetDailyCounter();
    console.log('🔄 Daily counter manually reset');
  }

  /**
   * Get current daily usage info without modifying state
   */
  public getDailyUsageInfo() {
    const state = useTrialStore.getState();

    // Check and reset if needed
    state._checkAndResetDailyCounter();

    return {
      tier: state.currentTier,
      minutesUsedToday: state.dailyPracticeMinutesUsed,
      remainingMinutes: state.getRemainingDailyMinutes(),
      limitReached: state.isDailyLimitReached(),
      lastResetDate: new Date(state.lastPracticeResetDate).toISOString(),
    };
  }

  /**
   * Get subscription features
   */
  public getSubscriptionFeatures() {
    const state = useTrialStore.getState();
    return state.getSubscriptionFeatures();
  }

  /**
   * Get current subscription tier
   */
  public getCurrentTier() {
    const state = useTrialStore.getState();
    return state.currentTier;
  }
}

/**
 * Export singleton instance for convenience
 */
export const practiceSessionService = PracticeSessionService.getInstance();
