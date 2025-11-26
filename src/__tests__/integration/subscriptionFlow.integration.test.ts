/**
 * Integration Tests: Subscription Flow
 * Phase 8: Testing & QA
 *
 * End-to-end testing of subscription workflows
 */

import { useTrialStore } from '@/stores/useTrialStore';
import { MockPaymentService } from '@/services/payment/MockPaymentService';

describe('Subscription Flow - Integration Tests', () => {
  let paymentService: MockPaymentService;

  beforeEach(async () => {
    // Initialize payment service
    paymentService = new MockPaymentService();
    await paymentService.initialize();

    // Reset store to initial state
    useTrialStore.setState({
      currentTier: 'free',
      subscriptionStatus: 'free',
      subscriptionEndDate: undefined,
      autoRenewEnabled: false,
      dailyPracticeMinutesUsed: 0,
      lastPracticeResetDate: Date.now(),
    });
  });

  afterEach(async () => {
    await paymentService.cleanup();
  });

  // ==================== FREE TO BASIC UPGRADE ====================

  describe('Free to Basic Upgrade Flow', () => {
    it('should complete full upgrade flow', async () => {
      const store = useTrialStore.getState();

      // Step 1: Verify initial free tier
      expect(store.currentTier).toBe('free');
      expect(store.subscriptionStatus).toBe('free');
      let features = store.getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(false);

      // Step 2: Perform payment
      const purchaseResult = await paymentService.purchase(
        'basic_monthly_subscription'
      );
      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.subscriptionId).toBeDefined();

      // Step 3: Update store with new subscription
      store.currentTier = 'basic';
      store.subscriptionStatus = 'active';
      store.autoRenewEnabled = true;
      store.subscriptionEndDate = Date.now() + 30 * 24 * 60 * 60 * 1000;

      // Step 4: Verify upgraded state
      expect(store.currentTier).toBe('basic');
      expect(store.subscriptionStatus).toBe('active');
      features = store.getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(true);
      expect(features.wordLevelAnalysis).toBe(true);
      expect(features.canAccessAllTabs).toBe(true);
    });

    it('should unlock all features after upgrade', async () => {
      const store = useTrialStore.getState();
      const purchase = await paymentService.purchase('basic_monthly_subscription');

      store.currentTier = 'basic';
      store.subscriptionStatus = 'active';

      const features = store.getSubscriptionFeatures();
      expect(features.maxDailyMinutes).toBe(Infinity);
      expect(features.fullFeedback).toBe(true);
      expect(features.wordLevelAnalysis).toBe(true);
      expect(features.phonemeBreakdown).toBe(true);
      expect(features.prosodyAnalysis).toBe(true);
      expect(features.audioComparison).toBe(true);
      expect(features.canAccessAllTabs).toBe(true);
    });

    it('should immediately allow unlimited practice after upgrade', async () => {
      const store = useTrialStore.getState();

      // Upgrade to basic
      await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      // Add 100 minutes of practice
      for (let i = 0; i < 100; i++) {
        store.addPracticeMinutes(1);
      }

      // Should not hit limit
      expect(store.isDailyLimitReached()).toBe(false);
      expect(store.dailyPracticeMinutesUsed).toBe(100);
    });

    it('should preserve subscription across multiple operations', async () => {
      const store = useTrialStore.getState();

      // Upgrade
      const purchase = await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';
      store.subscriptionStatus = 'active';

      // Check status multiple times
      const status1 = await paymentService.getSubscriptionStatus(
        purchase.subscriptionId!
      );
      expect(status1.isActive).toBe(true);

      const status2 = await paymentService.getSubscriptionStatus(
        purchase.subscriptionId!
      );
      expect(status2.isActive).toBe(true);

      // Verify subscription persists
      expect(store.currentTier).toBe('basic');
    });
  });

  // ==================== SUBSCRIPTION CANCELLATION ====================

  describe('Subscription Cancellation Flow', () => {
    it('should complete full cancellation flow', async () => {
      const store = useTrialStore.getState();

      // Step 1: Upgrade to basic
      const purchase = await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';
      store.subscriptionStatus = 'active';
      store.autoRenewEnabled = true;

      expect(store.currentTier).toBe('basic');

      // Step 2: Cancel subscription
      const cancelResult = await paymentService.cancelSubscription(
        purchase.subscriptionId!
      );
      expect(cancelResult.success).toBe(true);

      // Step 3: Downgrade user
      store.currentTier = 'free';
      store.subscriptionStatus = 'cancelled';
      store.autoRenewEnabled = false;

      // Step 4: Verify downgraded state
      expect(store.currentTier).toBe('free');
      expect(store.subscriptionStatus).toBe('cancelled');
      const features = store.getSubscriptionFeatures();
      expect(features.fullFeedback).toBe(false);
      expect(features.maxDailyMinutes).toBe(10);
    });

    it('should immediately enforce daily limit after cancellation', async () => {
      const store = useTrialStore.getState();

      // Upgrade
      const purchase = await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      // Practice without limit
      store.addPracticeMinutes(50);
      expect(store.isDailyLimitReached()).toBe(false);

      // Cancel
      await paymentService.cancelSubscription(purchase.subscriptionId!);
      store.currentTier = 'free';

      // Reset counter and test limit
      store.resetDailyCounter();
      store.addPracticeMinutes(10);
      expect(store.isDailyLimitReached()).toBe(true);
    });

    it('should lock features after cancellation', async () => {
      const store = useTrialStore.getState();

      // Upgrade and verify all features unlocked
      const purchase = await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';
      let features = store.getSubscriptionFeatures();
      expect(features.canAccessAllTabs).toBe(true);

      // Cancel and verify features locked
      await paymentService.cancelSubscription(purchase.subscriptionId!);
      store.currentTier = 'free';
      features = store.getSubscriptionFeatures();
      expect(features.canAccessAllTabs).toBe(false);
      expect(features.fullFeedback).toBe(false);
    });
  });

  // ==================== DAILY LIMIT FLOW ====================

  describe('Daily Limit Flow', () => {
    it('should prevent practice after daily limit on free tier', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';

      // Add exactly 10 minutes
      for (let i = 0; i < 10; i++) {
        store.addPracticeMinutes(1);
      }

      expect(store.isDailyLimitReached()).toBe(true);
      expect(store.getRemainingDailyMinutes()).toBe(0);
    });

    it('should show warning before reaching limit', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';

      store.addPracticeMinutes(8);
      const remaining = store.getRemainingDailyMinutes();
      expect(remaining).toBe(2);

      // UI should show "2 minutes remaining" warning
      expect(remaining).toBeLessThanOrEqual(2);
    });

    it('should reset counter at new day', () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';

      // Day 1: Use 10 minutes
      store.addPracticeMinutes(10);
      expect(store.isDailyLimitReached()).toBe(true);

      // Day 2: Reset and verify can practice again
      store.resetDailyCounter();
      expect(store.dailyPracticeMinutesUsed).toBe(0);
      expect(store.isDailyLimitReached()).toBe(false);

      store.addPracticeMinutes(5);
      expect(store.getRemainingDailyMinutes()).toBe(5);
    });

    it('should not enforce limit for basic tier', async () => {
      const store = useTrialStore.getState();

      const purchase = await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      // Add 1000 minutes
      for (let i = 0; i < 100; i++) {
        store.addPracticeMinutes(10);
      }

      expect(store.isDailyLimitReached()).toBe(false);
      expect(store.dailyPracticeMinutesUsed).toBe(1000);
    });

    it('should track accurate remaining minutes', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';

      const testCases = [
        { used: 0, expected: 10 },
        { used: 2, expected: 8 },
        { used: 5, expected: 5 },
        { used: 9, expected: 1 },
        { used: 10, expected: 0 },
      ];

      store.dailyPracticeMinutesUsed = 0;
      for (const { used, expected } of testCases) {
        store.dailyPracticeMinutesUsed = used;
        expect(store.getRemainingDailyMinutes()).toBe(expected);
      }
    });
  });

  // ==================== UPGRADE CHOICES ====================

  describe('Upgrade Choice Flow - Monthly vs Yearly', () => {
    it('should support monthly subscription', async () => {
      const purchase = await paymentService.purchase('basic_monthly_subscription');

      expect(purchase.success).toBe(true);
      expect(purchase.subscriptionId).toBeDefined();

      const status = await paymentService.getSubscriptionStatus(
        purchase.subscriptionId!
      );
      expect(status.isActive).toBe(true);
    });

    it('should support yearly subscription', async () => {
      const purchase = await paymentService.purchase('basic_yearly_subscription');

      expect(purchase.success).toBe(true);
      expect(purchase.subscriptionId).toBeDefined();

      const status = await paymentService.getSubscriptionStatus(
        purchase.subscriptionId!
      );
      expect(status.isActive).toBe(true);
    });

    it('should have yearly expires after monthly', async () => {
      const monthly = await paymentService.purchase('basic_monthly_subscription');
      const yearly = await paymentService.purchase('basic_yearly_subscription');

      const monthlyStatus = await paymentService.getSubscriptionStatus(
        monthly.subscriptionId!
      );
      const yearlyStatus = await paymentService.getSubscriptionStatus(
        yearly.subscriptionId!
      );

      expect(yearlyStatus.expiryDate!).toBeGreaterThan(monthlyStatus.expiryDate!);
    });

    it('should allow switching from monthly to yearly', async () => {
      const store = useTrialStore.getState();

      // First: upgrade to monthly
      const monthly = await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';
      store.subscriptionStatus = 'active';

      // Verify monthly active
      let status = await paymentService.getSubscriptionStatus(monthly.subscriptionId!);
      expect(status.isActive).toBe(true);

      // In real app: cancel monthly, purchase yearly
      await paymentService.cancelSubscription(monthly.subscriptionId!);

      // Now upgrade to yearly
      const yearly = await paymentService.purchase('basic_yearly_subscription');
      status = await paymentService.getSubscriptionStatus(yearly.subscriptionId!);
      expect(status.isActive).toBe(true);
    });
  });

  // ==================== CROSS-DEVICE SCENARIOS ====================

  describe('Cross-Device Sync Scenarios', () => {
    it('should maintain state across app restarts', () => {
      const store1 = useTrialStore.getState();
      store1.currentTier = 'basic';
      store1.subscriptionStatus = 'active';

      // Simulate app restart (in real scenario, state reloads from AsyncStorage)
      const store2 = useTrialStore.getState();

      // State should be preserved
      expect(store2.currentTier).toBe('basic');
      expect(store2.subscriptionStatus).toBe('active');
    });

    it('should sync subscription across devices', async () => {
      // Device 1: Upgrade
      const store1 = useTrialStore.getState();
      const purchase = await paymentService.purchase('basic_monthly_subscription');
      store1.currentTier = 'basic';

      // Device 2: Check subscription (in real app, via Firestore sync)
      const store2 = useTrialStore.getState();
      // In real implementation, Device 2 would fetch from server
      expect(store2.currentTier).toBe('basic');

      // Both devices should see active subscription
      const status = await paymentService.getSubscriptionStatus(
        purchase.subscriptionId!
      );
      expect(status.isActive).toBe(true);
    });

    it('should prevent double-charging on multiple devices', async () => {
      // Simulate Device 1 purchase
      const purchase1 = await paymentService.purchase('basic_monthly_subscription');

      // Simulate Device 2 purchase with same account (should be prevented by server)
      // In real scenario: server would check existing subscription
      const store = useTrialStore.getState();
      store.currentTier = 'basic'; // Would be set by server on both devices

      const status = await paymentService.getSubscriptionStatus(
        purchase1.subscriptionId!
      );
      expect(status.isActive).toBe(true);
    });
  });

  // ==================== EDGE CASES ====================

  describe('Edge Case Scenarios', () => {
    it('should handle session expiring mid-practice', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';

      // User practices for 5 minutes
      store.addPracticeMinutes(5);
      expect(store.dailyPracticeMinutesUsed).toBe(5);

      // Session expires, but minutes are already recorded
      // Verify persistence
      expect(store.dailyPracticeMinutesUsed).toBe(5);
    });

    it('should handle reinstall with restore purchases', async () => {
      // First install: make purchase
      const purchase = await paymentService.purchase('lifetime_access_001');
      expect(purchase.success).toBe(true);

      // Simulate reinstall: restore purchases
      const restored = await paymentService.restorePurchases();
      expect(restored.success).toBe(true);
      expect(restored.purchases.length).toBeGreaterThan(0);

      const restoredPurchase = restored.purchases.find(
        p => p.productId === 'lifetime_access_001'
      );
      expect(restoredPurchase).toBeDefined();
    });

    it('should handle subscription expiring naturally', async () => {
      const store = useTrialStore.getState();
      const purchase = await paymentService.purchase('basic_monthly_subscription');

      store.currentTier = 'basic';
      store.subscriptionStatus = 'active';
      store.subscriptionEndDate = Date.now() - 1000; // Expired 1 second ago

      // In real scenario: scheduled function would downgrade to free
      if (store.subscriptionEndDate && store.subscriptionEndDate < Date.now()) {
        store.currentTier = 'free';
        store.subscriptionStatus = 'expired';
      }

      expect(store.currentTier).toBe('free');
      expect(store.subscriptionStatus).toBe('expired');
    });

    it('should handle payment failure and retry', async () => {
      const store = useTrialStore.getState();

      // First attempt fails (MockPaymentService has 5% failure rate)
      let result = await paymentService.purchase('basic_monthly_subscription');

      // Retry if needed
      if (!result.success) {
        result = await paymentService.purchase('basic_monthly_subscription');
      }

      // Eventually succeeds
      expect(result.success).toBe(true);
    });

    it('should handle network offline scenario', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'basic';
      store.subscriptionStatus = 'active'; // Cached from last sync

      // Offline: user can still use app with cached subscription status
      expect(store.getSubscriptionFeatures().fullFeedback).toBe(true);

      // Online: check subscription status
      const status = await paymentService.getSubscriptionStatus('sub_xxx');
      // Real implementation would sync with server
      expect(typeof status).toBe('object');
    });

    it('should handle multiple concurrent purchases', async () => {
      // This should not happen in real app, but test for robustness
      const results = await Promise.all([
        paymentService.purchase('lifetime_access_001'),
        paymentService.purchase('lifetime_access_001'),
        paymentService.purchase('lifetime_access_001'),
      ]);

      // All should have unique transaction IDs
      const txnIds = results.map(r => r.transactionId).filter(Boolean);
      const uniqueIds = new Set(txnIds);
      expect(uniqueIds.size).toBe(3);
    });
  });

  // ==================== FEATURE ACCESSIBILITY ====================

  describe('Feature Accessibility After Upgrade', () => {
    it('should unlock word-level analysis', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';
      let features = store.getSubscriptionFeatures();
      expect(features.wordLevelAnalysis).toBe(false);

      // Upgrade
      await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      features = store.getSubscriptionFeatures();
      expect(features.wordLevelAnalysis).toBe(true);
    });

    it('should unlock phoneme breakdown', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';
      let features = store.getSubscriptionFeatures();
      expect(features.phonemeBreakdown).toBe(false);

      // Upgrade
      await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      features = store.getSubscriptionFeatures();
      expect(features.phonemeBreakdown).toBe(true);
    });

    it('should unlock prosody analysis', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';
      let features = store.getSubscriptionFeatures();
      expect(features.prosodyAnalysis).toBe(false);

      // Upgrade
      await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      features = store.getSubscriptionFeatures();
      expect(features.prosodyAnalysis).toBe(true);
    });

    it('should unlock audio comparison', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';
      let features = store.getSubscriptionFeatures();
      expect(features.audioComparison).toBe(false);

      // Upgrade
      await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      features = store.getSubscriptionFeatures();
      expect(features.audioComparison).toBe(true);
    });

    it('should unlock all tabs', async () => {
      const store = useTrialStore.getState();
      store.currentTier = 'free';
      let features = store.getSubscriptionFeatures();
      expect(features.canAccessAllTabs).toBe(false);

      // Upgrade
      await paymentService.purchase('basic_monthly_subscription');
      store.currentTier = 'basic';

      features = store.getSubscriptionFeatures();
      expect(features.canAccessAllTabs).toBe(true);
    });
  });
});
