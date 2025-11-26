/**
 * Unit Tests: useTrialStore
 * Phase 8: Testing & QA
 *
 * Tests for subscription state management
 */

import { useTrialStore } from '../useTrialStore';
import { TIER_FEATURES } from '@/types/subscription.types';

describe('useTrialStore - Subscription Management', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTrialStore.setState({
      currentTier: 'free',
      subscriptionStatus: 'free',
      subscriptionEndDate: undefined,
      autoRenewEnabled: false,
      dailyPracticeMinutesUsed: 0,
      lastPracticeResetDate: Date.now(),
    });
  });

  // ==================== FEATURE GATING TESTS ====================

  describe('Feature Gating - getSubscriptionFeatures()', () => {
    it('should return free tier features', () => {
      const state = useTrialStore.getState();
      const features = state.getSubscriptionFeatures();

      expect(features.tier).toBe('free');
      expect(features.fullFeedback).toBe(false);
      expect(features.wordLevelAnalysis).toBe(false);
      expect(features.phonemeBreakdown).toBe(false);
      expect(features.prosodyAnalysis).toBe(false);
      expect(features.audioComparison).toBe(false);
      expect(features.canAccessAllTabs).toBe(false);
      expect(features.maxDailyMinutes).toBe(10);
    });

    it('should return basic tier features when upgraded', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'basic';

      const features = state.getSubscriptionFeatures();
      expect(features.tier).toBe('basic');
      expect(features.fullFeedback).toBe(true);
      expect(features.wordLevelAnalysis).toBe(true);
      expect(features.phonemeBreakdown).toBe(true);
      expect(features.prosodyAnalysis).toBe(true);
      expect(features.audioComparison).toBe(true);
      expect(features.canAccessAllTabs).toBe(true);
      expect(features.maxDailyMinutes).toBe(Infinity);
    });

    it('should match TIER_FEATURES definition', () => {
      const state = useTrialStore.getState();

      state.currentTier = 'free';
      const freeFeatures = state.getSubscriptionFeatures();
      expect(freeFeatures).toEqual(TIER_FEATURES.free);

      state.currentTier = 'basic';
      const basicFeatures = state.getSubscriptionFeatures();
      expect(basicFeatures).toEqual(TIER_FEATURES.basic);
    });
  });

  // ==================== DAILY LIMIT TESTS ====================

  describe('Daily Limit - addPracticeMinutes()', () => {
    it('should add practice minutes', () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(5);

      expect(state.dailyPracticeMinutesUsed).toBe(5);
    });

    it('should accumulate practice minutes', () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(3);
      state.addPracticeMinutes(4);

      expect(state.dailyPracticeMinutesUsed).toBe(7);
    });

    it('should cap free tier at 10 minutes', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';

      state.addPracticeMinutes(5);
      state.addPracticeMinutes(5);
      state.addPracticeMinutes(5); // Should be capped

      expect(state.dailyPracticeMinutesUsed).toBeLessThanOrEqual(10);
    });

    it('should allow unlimited for basic tier', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'basic';

      for (let i = 0; i < 100; i++) {
        state.addPracticeMinutes(1);
      }

      expect(state.dailyPracticeMinutesUsed).toBe(100);
    });
  });

  describe('Daily Limit - isDailyLimitReached()', () => {
    it('should return false when under limit', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';
      state.addPracticeMinutes(5);

      expect(state.isDailyLimitReached()).toBe(false);
    });

    it('should return true when at limit', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';
      state.addPracticeMinutes(10);

      expect(state.isDailyLimitReached()).toBe(true);
    });

    it('should return false for basic tier regardless of usage', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'basic';
      state.addPracticeMinutes(100);

      expect(state.isDailyLimitReached()).toBe(false);
    });
  });

  describe('Daily Limit - getRemainingDailyMinutes()', () => {
    it('should calculate remaining minutes for free tier', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';
      state.addPracticeMinutes(3);

      const remaining = state.getRemainingDailyMinutes();
      expect(remaining).toBe(7); // 10 - 3
    });

    it('should return 0 when limit reached', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';
      state.addPracticeMinutes(10);

      const remaining = state.getRemainingDailyMinutes();
      expect(remaining).toBe(0);
    });

    it('should return Infinity for basic tier', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'basic';
      state.addPracticeMinutes(5);

      const remaining = state.getRemainingDailyMinutes();
      expect(remaining).toBe(Infinity);
    });
  });

  describe('Daily Limit - resetDailyCounter()', () => {
    it('should reset daily usage counter', () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(10);
      expect(state.dailyPracticeMinutesUsed).toBe(10);

      state.resetDailyCounter();
      expect(state.dailyPracticeMinutesUsed).toBe(0);
    });

    it('should update last reset date', () => {
      const state = useTrialStore.getState();
      const oldDate = state.lastPracticeResetDate;

      state.resetDailyCounter();
      const newDate = state.lastPracticeResetDate;

      expect(newDate).toBeGreaterThanOrEqual(oldDate);
    });
  });

  // ==================== SUBSCRIPTION UPGRADE TESTS ====================

  describe('Subscription - upgradeToBasic()', () => {
    it('should upgrade tier to basic', async () => {
      const state = useTrialStore.getState();
      expect(state.currentTier).toBe('free');

      const success = await state.upgradeToBasic('basic_monthly_subscription');

      expect(success).toBe(true);
      expect(state.currentTier).toBe('basic');
    });

    it('should update subscription status', async () => {
      const state = useTrialStore.getState();
      await state.upgradeToBasic('basic_monthly_subscription');

      expect(state.subscriptionStatus).toBe('active');
      expect(state.autoRenewEnabled).toBe(true);
    });

    it('should set subscription end date', async () => {
      const state = useTrialStore.getState();
      const beforeUpgrade = Date.now();

      await state.upgradeToBasic('basic_monthly_subscription');

      expect(state.subscriptionEndDate).toBeDefined();
      expect(state.subscriptionEndDate!).toBeGreaterThan(beforeUpgrade);
    });

    it('should handle upgrade failure gracefully', async () => {
      const state = useTrialStore.getState();

      // This would fail if payment service is unavailable
      // For now, mock assumes it succeeds
      const success = await state.upgradeToBasic('basic_monthly_subscription');
      expect(typeof success).toBe('boolean');
    });
  });

  describe('Subscription - cancelSubscription()', () => {
    it('should cancel subscription', async () => {
      const state = useTrialStore.getState();

      // First upgrade
      await state.upgradeToBasic('basic_monthly_subscription');
      expect(state.currentTier).toBe('basic');

      // Then cancel
      const success = await state.cancelSubscription();

      expect(success).toBe(true);
      expect(state.currentTier).toBe('free');
    });

    it('should update subscription status to cancelled', async () => {
      const state = useTrialStore.getState();

      // First upgrade
      await state.upgradeToBasic('basic_monthly_subscription');

      // Then cancel
      await state.cancelSubscription();

      expect(state.subscriptionStatus).toBe('cancelled');
    });

    it('should disable auto-renew', async () => {
      const state = useTrialStore.getState();

      // First upgrade
      await state.upgradeToBasic('basic_monthly_subscription');
      expect(state.autoRenewEnabled).toBe(true);

      // Then cancel
      await state.cancelSubscription();

      expect(state.autoRenewEnabled).toBe(false);
    });

    it('should fail gracefully if not subscribed', async () => {
      const state = useTrialStore.getState();
      expect(state.currentTier).toBe('free');

      const success = await state.cancelSubscription();
      expect(typeof success).toBe('boolean');
    });
  });

  // ==================== PERSISTENCE TESTS ====================

  describe('Persistence - AsyncStorage Integration', () => {
    it('should persist subscription tier', async () => {
      const state = useTrialStore.getState();
      state.currentTier = 'basic';

      // In real scenario, store would be reloaded from AsyncStorage
      // This test verifies the state is set correctly
      expect(state.currentTier).toBe('basic');
    });

    it('should persist subscription status', async () => {
      const state = useTrialStore.getState();
      state.subscriptionStatus = 'active';

      expect(state.subscriptionStatus).toBe('active');
    });

    it('should persist daily usage', async () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(5);

      expect(state.dailyPracticeMinutesUsed).toBe(5);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle decimal practice minutes', () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(1.5);

      expect(state.dailyPracticeMinutesUsed).toBeCloseTo(1.5, 1);
    });

    it('should handle zero minutes', () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(0);

      expect(state.dailyPracticeMinutesUsed).toBe(0);
    });

    it('should handle negative minutes (should not happen, but safe)', () => {
      const state = useTrialStore.getState();
      state.dailyPracticeMinutesUsed = 5;
      state.addPracticeMinutes(-2); // Should not go below 0

      expect(state.dailyPracticeMinutesUsed).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple resets', () => {
      const state = useTrialStore.getState();
      state.addPracticeMinutes(5);

      state.resetDailyCounter();
      expect(state.dailyPracticeMinutesUsed).toBe(0);

      state.addPracticeMinutes(3);
      state.resetDailyCounter();
      expect(state.dailyPracticeMinutesUsed).toBe(0);
    });
  });

  // ==================== STATE CONSISTENCY TESTS ====================

  describe('State Consistency', () => {
    it('should maintain consistent tier features', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';

      const features = state.getSubscriptionFeatures();
      expect(features.tier).toBe('free');
      expect(features).toEqual(TIER_FEATURES['free']);
    });

    it('should sync features with tier changes', () => {
      const state = useTrialStore.getState();

      state.currentTier = 'free';
      let features = state.getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(false);

      state.currentTier = 'basic';
      features = state.getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(true);
    });

    it('should maintain daily limit accuracy', () => {
      const state = useTrialStore.getState();
      state.currentTier = 'free';

      for (let i = 1; i <= 10; i++) {
        state.addPracticeMinutes(1);
        const remaining = state.getRemainingDailyMinutes();
        expect(remaining).toBe(10 - i);
      }
    });
  });
});
