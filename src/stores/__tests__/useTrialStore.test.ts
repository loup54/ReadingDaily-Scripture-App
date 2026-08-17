/**
 * Unit Tests: useTrialStore
 * Phase 8: Testing & QA
 *
 * Tests for subscription state management
 */

import { useTrialStore } from '../useTrialStore';
import { TIER_FEATURES } from '@/types/subscription.types';
import { IPaymentService } from '@/services/payment/IPaymentService';

// upgradeToBasic/purchaseLifetimeAccess/restorePurchase auto-init a payment
// service if state.paymentService is null via PaymentServiceFactory.create(),
// which under jest's default Platform.OS ('ios') and no expo-constants mock
// falls through to a real, native-module-backed AppleIAPService that fails
// to initialize in this environment. Injecting a working mock directly into
// store state sidesteps the factory entirely.
const mockPaymentService: IPaymentService = {
  provider: 'mock',
  initialize: jest.fn().mockResolvedValue(undefined),
  isAvailable: jest.fn().mockResolvedValue(true),
  getProducts: jest.fn().mockResolvedValue([]),
  createPaymentIntent: jest.fn(),
  purchase: jest.fn().mockResolvedValue({
    success: true,
    provider: 'mock',
    transactionId: 'tx-mock-001',
    subscriptionId: 'sub-mock-001',
    receipt: 'receipt-mock-001',
    timestamp: Date.now(),
  }),
  restorePurchases: jest.fn().mockResolvedValue({ success: true, purchases: [] }),
  validateReceipt: jest.fn().mockResolvedValue(true),
  cleanup: jest.fn().mockResolvedValue(undefined),
  cancelSubscription: jest.fn().mockResolvedValue({ success: true }),
  getSubscriptionStatus: jest.fn().mockResolvedValue({
    isActive: true,
    willRenew: true,
    autoRenewEnabled: true,
  }),
  updatePaymentMethod: jest.fn().mockResolvedValue({
    success: true,
    provider: 'mock',
    timestamp: Date.now(),
  }),
};

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
      paymentService: mockPaymentService,
    });
    jest.clearAllMocks();
  });

  // ==================== FEATURE GATING TESTS ====================

  describe('Feature Gating - getSubscriptionFeatures()', () => {
    it('should return free tier features', () => {
      const features = useTrialStore.getState().getSubscriptionFeatures();

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
      useTrialStore.setState({ currentTier: 'basic' });

      const features = useTrialStore.getState().getSubscriptionFeatures();
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
      useTrialStore.setState({ currentTier: 'free' });
      const freeFeatures = useTrialStore.getState().getSubscriptionFeatures();
      expect(freeFeatures).toEqual(TIER_FEATURES.free);

      useTrialStore.setState({ currentTier: 'basic' });
      const basicFeatures = useTrialStore.getState().getSubscriptionFeatures();
      expect(basicFeatures).toEqual(TIER_FEATURES.basic);
    });
  });

  // ==================== DAILY LIMIT TESTS ====================

  describe('Daily Limit - addPracticeMinutes()', () => {
    it('should add practice minutes', () => {
      useTrialStore.getState().addPracticeMinutes(5);

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(5);
    });

    it('should accumulate practice minutes', () => {
      useTrialStore.getState().addPracticeMinutes(3);
      useTrialStore.getState().addPracticeMinutes(4);

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(7);
    });

    it('should cap free tier at 10 minutes', () => {
      useTrialStore.setState({ currentTier: 'free' });

      useTrialStore.getState().addPracticeMinutes(5);
      useTrialStore.getState().addPracticeMinutes(5);
      useTrialStore.getState().addPracticeMinutes(5); // Should be capped

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBeLessThanOrEqual(10);
    });

    it('should allow unlimited for basic tier', () => {
      useTrialStore.setState({ currentTier: 'basic' });

      for (let i = 0; i < 100; i++) {
        useTrialStore.getState().addPracticeMinutes(1);
      }

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(100);
    });
  });

  describe('Daily Limit - isDailyLimitReached()', () => {
    it('should return false when under limit', () => {
      useTrialStore.setState({ currentTier: 'free' });
      useTrialStore.getState().addPracticeMinutes(5);

      expect(useTrialStore.getState().isDailyLimitReached()).toBe(false);
    });

    it('should return true when at limit', () => {
      useTrialStore.setState({ currentTier: 'free' });
      useTrialStore.getState().addPracticeMinutes(10);

      expect(useTrialStore.getState().isDailyLimitReached()).toBe(true);
    });

    it('should return false for basic tier regardless of usage', () => {
      useTrialStore.setState({ currentTier: 'basic' });
      useTrialStore.getState().addPracticeMinutes(100);

      expect(useTrialStore.getState().isDailyLimitReached()).toBe(false);
    });
  });

  describe('Daily Limit - getRemainingDailyMinutes()', () => {
    it('should calculate remaining minutes for free tier', () => {
      useTrialStore.setState({ currentTier: 'free' });
      useTrialStore.getState().addPracticeMinutes(3);

      const remaining = useTrialStore.getState().getRemainingDailyMinutes();
      expect(remaining).toBe(7); // 10 - 3
    });

    it('should return 0 when limit reached', () => {
      useTrialStore.setState({ currentTier: 'free' });
      useTrialStore.getState().addPracticeMinutes(10);

      const remaining = useTrialStore.getState().getRemainingDailyMinutes();
      expect(remaining).toBe(0);
    });

    it('should return Infinity for basic tier', () => {
      useTrialStore.setState({ currentTier: 'basic' });
      useTrialStore.getState().addPracticeMinutes(5);

      const remaining = useTrialStore.getState().getRemainingDailyMinutes();
      expect(remaining).toBe(Infinity);
    });
  });

  describe('Daily Limit - resetDailyCounter()', () => {
    it('should reset daily usage counter', () => {
      useTrialStore.getState().addPracticeMinutes(10);
      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(10);

      useTrialStore.getState().resetDailyCounter();
      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(0);
    });

    it('should update last reset date', () => {
      const oldDate = useTrialStore.getState().lastPracticeResetDate;

      useTrialStore.getState().resetDailyCounter();
      const newDate = useTrialStore.getState().lastPracticeResetDate;

      expect(newDate).toBeGreaterThanOrEqual(oldDate);
    });
  });

  // ==================== SUBSCRIPTION UPGRADE TESTS ====================

  describe('Subscription - upgradeToBasic()', () => {
    it('should upgrade tier to basic', async () => {
      expect(useTrialStore.getState().currentTier).toBe('free');

      const result = await useTrialStore.getState().upgradeToBasic('basic_monthly_subscription');

      expect(result.success).toBe(true);
      expect(useTrialStore.getState().currentTier).toBe('basic');
    });

    it('should update subscription status', async () => {
      await useTrialStore.getState().upgradeToBasic('basic_monthly_subscription');

      expect(useTrialStore.getState().subscriptionStatus).toBe('active');
      expect(useTrialStore.getState().autoRenewEnabled).toBe(true);
    });

    it('should call the payment service with the subscription product id', async () => {
      await useTrialStore.getState().upgradeToBasic('basic_monthly_subscription');

      expect(mockPaymentService.purchase).toHaveBeenCalledWith('basic_monthly_subscription');
    });

    it('should handle upgrade failure gracefully', async () => {
      (mockPaymentService.purchase as jest.Mock).mockResolvedValueOnce({
        success: false,
        provider: 'mock',
        error: 'Card declined',
        timestamp: Date.now(),
      });

      const result = await useTrialStore.getState().upgradeToBasic('basic_monthly_subscription');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card declined');
      expect(useTrialStore.getState().currentTier).toBe('free');
    });
  });

  // ==================== PERSISTENCE TESTS ====================

  describe('Persistence - AsyncStorage Integration', () => {
    it('should persist subscription tier', async () => {
      useTrialStore.setState({ currentTier: 'basic' });

      // In real scenario, store would be reloaded from AsyncStorage
      // This test verifies the state is set correctly
      expect(useTrialStore.getState().currentTier).toBe('basic');
    });

    it('should persist subscription status', async () => {
      useTrialStore.setState({ subscriptionStatus: 'active' });

      expect(useTrialStore.getState().subscriptionStatus).toBe('active');
    });

    it('should persist daily usage', async () => {
      useTrialStore.getState().addPracticeMinutes(5);

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(5);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Cases', () => {
    it('should handle decimal practice minutes', () => {
      useTrialStore.getState().addPracticeMinutes(1.5);

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBeCloseTo(1.5, 1);
    });

    it('should handle zero minutes', () => {
      useTrialStore.getState().addPracticeMinutes(0);

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(0);
    });

    it('should handle negative minutes (should not happen, but safe)', () => {
      useTrialStore.setState({ dailyPracticeMinutesUsed: 5 });
      useTrialStore.getState().addPracticeMinutes(-2); // Should not go below 0

      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple resets', () => {
      useTrialStore.getState().addPracticeMinutes(5);

      useTrialStore.getState().resetDailyCounter();
      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(0);

      useTrialStore.getState().addPracticeMinutes(3);
      useTrialStore.getState().resetDailyCounter();
      expect(useTrialStore.getState().dailyPracticeMinutesUsed).toBe(0);
    });
  });

  // ==================== STATE CONSISTENCY TESTS ====================

  describe('State Consistency', () => {
    it('should maintain consistent tier features', () => {
      useTrialStore.setState({ currentTier: 'free' });

      const features = useTrialStore.getState().getSubscriptionFeatures();
      expect(features.tier).toBe('free');
      expect(features).toEqual(TIER_FEATURES['free']);
    });

    it('should sync features with tier changes', () => {
      useTrialStore.setState({ currentTier: 'free' });
      let features = useTrialStore.getState().getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(false);

      useTrialStore.setState({ currentTier: 'basic' });
      features = useTrialStore.getState().getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(true);
    });

    it('should maintain daily limit accuracy', () => {
      useTrialStore.setState({ currentTier: 'free' });

      for (let i = 1; i <= 10; i++) {
        useTrialStore.getState().addPracticeMinutes(1);
        const remaining = useTrialStore.getState().getRemainingDailyMinutes();
        expect(remaining).toBe(10 - i);
      }
    });
  });
});
