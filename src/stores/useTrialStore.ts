/**
 * Trial Store using Zustand
 *
 * Manages 10-minute trial period with device fingerprinting
 * for abuse prevention and lifetime access purchases.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrialState, DeviceFingerprint, PurchaseResult } from '../types/trial.types';
import {
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionFeatures,
  DailyUsage,
  getFeaturesForTier,
  tierHasFeature,
} from '../types/subscription.types';
import {
  generateDeviceFingerprint,
  compareFingerprints,
  detectSuspiciousActivity,
  serializeFingerprint,
  deserializeFingerprint,
} from '../utils/device-fingerprint';
import { ENV } from '../config/env';
import { PaymentServiceFactory } from '../services/payment';
import { IPaymentService } from '../services/payment/IPaymentService';
import { analyticsService } from '../services/analytics/AnalyticsService';

interface TrialStoreState extends TrialState {
  // Payment service
  paymentService: IPaymentService | null;

  // Subscription state (NEW - Phase 1)
  currentTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: number;
  autoRenewEnabled: boolean;
  dailyPracticeMinutesUsed: number;
  lastPracticeResetDate: number;

  // Trial actions
  initializeTrial: () => Promise<void>;
  startTrial: () => Promise<void>;
  checkTrialStatus: () => Promise<void>;
  purchaseLifetimeAccess: () => Promise<boolean>;
  restorePurchase: () => Promise<boolean>;

  // Subscription actions (NEW - Phase 1)
  upgradeToBasic: (subscriptionId: string) => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  getSubscriptionFeatures: () => SubscriptionFeatures;
  isDailyLimitReached: () => boolean;
  getRemainingDailyMinutes: () => number;
  addPracticeMinutes: (minutes: number) => void;
  resetDailyCounter: () => void;

  // Device fingerprinting
  generateFingerprint: () => Promise<DeviceFingerprint>;
  validateFingerprint: (fingerprint: DeviceFingerprint) => Promise<boolean>;

  // Helpers
  getRemainingTime: () => number;
  getFormattedTimeRemaining: () => string;

  // Internal actions
  _setTrialActive: (active: boolean) => void;
  _setPurchased: (purchased: boolean) => void;
  _updateRemainingTime: () => void;
  _initializePaymentService: () => Promise<void>;
  _checkAndResetDailyCounter: () => void;
}

export const useTrialStore = create<TrialStoreState>()(
  persist(
    (set, get) => ({
      // Initial state - Trial
      isActive: false,
      hasExpired: false,
      hasPurchased: false,
      startTime: null,
      endTime: null,
      remainingMinutes: 0,
      deviceFingerprint: null,
      firstLaunchTime: null,
      trialDurationMinutes: ENV.TRIAL_DURATION_MINUTES,
      lifetimePrice: ENV.LIFETIME_PRICE,
      paymentService: null,

      // Initial state - Subscription (NEW - Phase 1)
      currentTier: 'free',
      subscriptionStatus: 'free',
      subscriptionEndDate: undefined,
      autoRenewEnabled: false,
      dailyPracticeMinutesUsed: 0,
      lastPracticeResetDate: Date.now(),

      // Initialize trial on app startup
      initializeTrial: async () => {
        const state = get();

        // Initialize payment service
        await get()._initializePaymentService();

        // If already purchased, no need to check trial
        if (state.hasPurchased) {
          set({
            isActive: false,
            hasExpired: false,
          });
          return;
        }

        // Generate device fingerprint
        const fingerprint = await generateDeviceFingerprint();

        // First launch - store fingerprint but don't start trial
        if (!state.firstLaunchTime) {
          set({
            deviceFingerprint: fingerprint,
            firstLaunchTime: Date.now(),
          });
          return;
        }

        // Check for suspicious activity
        if (state.deviceFingerprint) {
          const validation = await get().validateFingerprint(fingerprint);
          if (!validation) {
            console.warn('⚠️  Suspicious device fingerprint detected');
            // Block trial if fingerprint doesn't match
            set({
              isActive: false,
              hasExpired: true,
            });
            return;
          }
        }

        // Check if trial has expired
        await get().checkTrialStatus();
      },

      // Start the trial (user action)
      startTrial: async () => {
        const state = get();

        // Can't start if already purchased
        if (state.hasPurchased) {
          return;
        }

        // Can't start if already active
        if (state.isActive) {
          return;
        }

        // Can't start if already expired
        if (state.hasExpired) {
          return;
        }

        const now = Date.now();
        const duration = state.trialDurationMinutes * 60 * 1000; // Convert to ms

        set({
          isActive: true,
          hasExpired: false,
          startTime: now,
          endTime: now + duration,
        });

        // Start countdown
        get()._updateRemainingTime();
      },

      // Check trial status (called periodically)
      checkTrialStatus: async () => {
        const state = get();

        // Skip if purchased
        if (state.hasPurchased) {
          set({
            isActive: false,
            hasExpired: false,
          });
          return;
        }

        // Skip if trial not started
        if (!state.startTime || !state.endTime) {
          return;
        }

        const now = Date.now();

        // Check if trial has expired
        if (now >= state.endTime) {
          set({
            isActive: false,
            hasExpired: true,
            remainingMinutes: 0,
          });
          return;
        }

        // Update remaining time
        get()._updateRemainingTime();
      },

      // Purchase lifetime access
      purchaseLifetimeAccess: async (): Promise<boolean> => {
        try {
          const state = get();

          if (!state.paymentService) {
            throw new Error('Payment service not initialized');
          }

          console.log('💳 Processing purchase via', state.paymentService.provider);

          // Process purchase through payment service
          const result = await state.paymentService.purchase('lifetime_access_001');

          if (result.success) {
            console.log('✅ Purchase successful:', result.transactionId);
            set({
              hasPurchased: true,
              isActive: false,
              hasExpired: false,
            });
            return true;
          } else {
            console.error('❌ Purchase failed:', result.error);
            return false;
          }
        } catch (error) {
          console.error('Purchase exception:', error);
          return false;
        }
      },

      // Restore previous purchase
      restorePurchase: async (): Promise<boolean> => {
        try {
          const state = get();

          if (!state.paymentService) {
            throw new Error('Payment service not initialized');
          }

          console.log('🔄 Restoring purchases via', state.paymentService.provider);

          // Restore purchases through payment service
          const result = await state.paymentService.restorePurchases();

          if (result.success && result.purchases.length > 0) {
            console.log('✅ Purchases restored:', result.purchases.length);

            // Check if lifetime access was purchased
            const hasLifetimeAccess = result.purchases.some(
              (p) => p.productId === 'lifetime_access_001' && p.validated
            );

            if (hasLifetimeAccess) {
              set({
                hasPurchased: true,
                isActive: false,
                hasExpired: false,
              });
              return true;
            }
          }

          console.log('ℹ️  No purchases to restore');
          return false;
        } catch (error) {
          console.error('Restore exception:', error);
          return false;
        }
      },

      // Upgrade to Basic subscription (NEW - Phase 1)
      upgradeToBasic: async (subscriptionId: string): Promise<boolean> => {
        try {
          const state = get();

          if (!state.paymentService) {
            throw new Error('Payment service not initialized');
          }

          console.log('💳 Processing subscription upgrade via', state.paymentService.provider);

          // Process subscription purchase through payment service
          const result = await state.paymentService.purchase(subscriptionId);

          if (result.success) {
            console.log('✅ Subscription upgrade successful:', result.transactionId);
            set({
              currentTier: 'basic',
              subscriptionStatus: 'active',
              autoRenewEnabled: true,
              // Reset daily counter on upgrade
              dailyPracticeMinutesUsed: 0,
              lastPracticeResetDate: Date.now(),
            });

            // Log analytics: subscription purchased
            const amount = subscriptionId.includes('yearly') ? 27.99 : 2.99;
            const billingPeriod = subscriptionId.includes('yearly') ? 'yearly' : 'monthly';
            await analyticsService.logSubscriptionPurchased({
              productId: subscriptionId,
              amount,
              currency: 'USD',
              provider: state.paymentService?.provider || 'unknown',
              billingPeriod: billingPeriod as 'monthly' | 'yearly',
              trialUsed: true,
            });

            return true;
          } else {
            console.error('❌ Subscription upgrade failed:', result.error);

            // Log analytics: payment failed
            await analyticsService.logPaymentFailed({
              productId: subscriptionId,
              provider: state.paymentService?.provider || 'unknown',
              errorMessage: result.error,
              retryable: true,
            });

            return false;
          }
        } catch (error) {
          console.error('Subscription upgrade exception:', error);
          return false;
        }
      },

      // Cancel subscription (NEW - Phase 1, ENHANCED - Phase 5)
      cancelSubscription: async (): Promise<boolean> => {
        try {
          const state = get();

          if (state.currentTier !== 'basic') {
            console.warn('⚠️  Cannot cancel - user is not on basic tier');
            return false;
          }

          console.log('🔄 Processing subscription cancellation via backend');

          // Import cancellation service
          const { subscriptionCancellationService } = await import(
            '@/services/subscription/SubscriptionCancellationService'
          );

          // Call backend Firebase Cloud Function
          const response = await subscriptionCancellationService.cancelSubscription({
            subscriptionId: 'basic_subscription',
            reason: 'user_requested',
          });

          if (!response.success) {
            console.error('❌ Backend cancellation failed:', response.error);
            return false;
          }

          // Update local state after successful backend cancellation
          const daysActive = state.subscriptionEndDate
            ? Math.floor((Date.now() - state.subscriptionEndDate) / (24 * 60 * 60 * 1000))
            : 0;

          set({
            currentTier: 'free',
            subscriptionStatus: 'cancelled',
            autoRenewEnabled: false,
            subscriptionEndDate: Date.now(),
            // Reset daily counter on downgrade
            dailyPracticeMinutesUsed: 0,
            lastPracticeResetDate: Date.now(),
          });

          // Log analytics: subscription cancelled
          await analyticsService.logSubscriptionCancelled({
            productId: 'basic_subscription',
            daysActive,
            reason: 'user_initiated',
            provider: state.paymentService?.provider || 'unknown',
          });

          console.log('✅ Subscription cancelled successfully');
          return true;
        } catch (error) {
          console.error('Subscription cancellation exception:', error);
          return false;
        }
      },

      // Get subscription features for current tier (NEW - Phase 1)
      getSubscriptionFeatures: (): SubscriptionFeatures => {
        const state = get();
        return getFeaturesForTier(state.currentTier);
      },

      // Check if daily limit reached (NEW - Phase 1)
      isDailyLimitReached: (): boolean => {
        const state = get();

        // Check if daily counter needs reset
        get()._checkAndResetDailyCounter();

        const features = getFeaturesForTier(state.currentTier);
        const remaining = state.dailyPracticeMinutesUsed;

        // Free tier: 10 minutes per day
        // Basic tier: Unlimited (Infinity)
        const limitReached = remaining >= features.maxDailyMinutes;

        // Log analytics when daily limit is reached
        if (limitReached && state.currentTier === 'free') {
          analyticsService.logDailyLimitReached({
            minutesUsed: state.dailyPracticeMinutesUsed,
            sessionsCount: state.practiceSessionCount || 1,
          });
        }

        return limitReached;
      },

      // Get remaining daily minutes (NEW - Phase 1)
      getRemainingDailyMinutes: (): number => {
        const state = get();

        // Check if daily counter needs reset
        get()._checkAndResetDailyCounter();

        const features = getFeaturesForTier(state.currentTier);

        // Basic tier has unlimited daily minutes
        if (state.currentTier === 'basic') {
          return Infinity;
        }

        // Free tier: 10 minutes - used = remaining
        return Math.max(0, features.maxDailyMinutes - state.dailyPracticeMinutesUsed);
      },

      // Add practice minutes to daily counter (NEW - Phase 1)
      addPracticeMinutes: (minutes: number) => {
        const state = get();

        // Check if daily counter needs reset
        get()._checkAndResetDailyCounter();

        // Free tier has daily limit
        if (state.currentTier === 'free') {
          const features = getFeaturesForTier('free');
          const newTotal = Math.min(
            state.dailyPracticeMinutesUsed + minutes,
            features.maxDailyMinutes
          );

          set({
            dailyPracticeMinutesUsed: newTotal,
          });

          console.log(
            `📊 Added ${minutes} min practice (total: ${newTotal}/${features.maxDailyMinutes})`
          );
        } else {
          // Basic tier - just track for analytics
          set({
            dailyPracticeMinutesUsed: state.dailyPracticeMinutesUsed + minutes,
          });

          console.log(`📊 Added ${minutes} min practice (unlimited tier)`);
        }
      },

      // Reset daily counter (NEW - Phase 1)
      resetDailyCounter: () => {
        console.log('🔄 Resetting daily practice counter');
        set({
          dailyPracticeMinutesUsed: 0,
          lastPracticeResetDate: Date.now(),
        });
      },

      // Generate device fingerprint
      generateFingerprint: async (): Promise<DeviceFingerprint> => {
        return await generateDeviceFingerprint();
      },

      // Validate fingerprint against stored one
      validateFingerprint: async (fingerprint: DeviceFingerprint): Promise<boolean> => {
        const state = get();

        if (!state.deviceFingerprint) {
          // No stored fingerprint - first launch
          return true;
        }

        // Compare fingerprints
        const match = compareFingerprints(state.deviceFingerprint, fingerprint);

        if (!match) {
          const suspicious = detectSuspiciousActivity(fingerprint, state.deviceFingerprint);
          if (suspicious.suspicious) {
            console.warn('⚠️  Suspicious activity detected:', suspicious.reason);
          }
          return false;
        }

        return true;
      },

      // Get remaining time in milliseconds
      getRemainingTime: (): number => {
        const state = get();

        if (!state.endTime || state.hasPurchased) {
          return 0;
        }

        const now = Date.now();
        const remaining = state.endTime - now;

        return Math.max(0, remaining);
      },

      // Get formatted time remaining (e.g., "5 min 30 sec")
      getFormattedTimeRemaining: (): string => {
        const remaining = get().getRemainingTime();

        if (remaining === 0) {
          return 'Trial expired';
        }

        const minutes = Math.floor(remaining / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

        if (minutes > 0) {
          return `${minutes} min ${seconds} sec`;
        }

        return `${seconds} sec`;
      },

      // Internal: Check and reset daily counter at midnight (NEW - Phase 1)
      _checkAndResetDailyCounter: () => {
        const state = get();

        // Calculate if a new day has started (midnight UTC)
        const lastResetDate = new Date(state.lastPracticeResetDate);
        const today = new Date();

        // Reset if day has changed
        if (
          lastResetDate.getUTCDate() !== today.getUTCDate() ||
          lastResetDate.getUTCMonth() !== today.getUTCMonth() ||
          lastResetDate.getUTCFullYear() !== today.getUTCFullYear()
        ) {
          console.log('📅 New day detected, resetting daily practice counter');
          set({
            dailyPracticeMinutesUsed: 0,
            lastPracticeResetDate: Date.now(),
          });
        }
      },

      // Internal: Set trial active state
      _setTrialActive: (active: boolean) => {
        set({ isActive: active });
      },

      // Internal: Set purchased state
      _setPurchased: (purchased: boolean) => {
        set({ hasPurchased: purchased });
      },

      // Internal: Update remaining time
      _updateRemainingTime: () => {
        const remaining = get().getRemainingTime();
        const remainingMinutes = Math.ceil(remaining / (60 * 1000));

        set({ remainingMinutes });

        // Auto-check expiration
        if (remaining === 0) {
          set({
            isActive: false,
            hasExpired: true,
          });
        }
      },

      // Internal: Initialize payment service
      _initializePaymentService: async () => {
        try {
          const paymentService = PaymentServiceFactory.create();
          await paymentService.initialize();
          set({ paymentService });
          console.log('✅ Payment service initialized:', paymentService.provider);
        } catch (error) {
          console.error('❌ Payment service initialization failed:', error);
        }
      },
    }),
    {
      name: 'trial-storage', // AsyncStorage key
      storage: createJSONStorage(() => AsyncStorage),

      // Custom serialization for device fingerprint and subscription state
      partialize: (state) => ({
        // Trial state
        hasPurchased: state.hasPurchased,
        startTime: state.startTime,
        endTime: state.endTime,
        deviceFingerprint: state.deviceFingerprint
          ? serializeFingerprint(state.deviceFingerprint)
          : null,
        firstLaunchTime: state.firstLaunchTime,

        // Subscription state (NEW - Phase 1)
        currentTier: state.currentTier,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionEndDate: state.subscriptionEndDate,
        autoRenewEnabled: state.autoRenewEnabled,
        dailyPracticeMinutesUsed: state.dailyPracticeMinutesUsed,
        lastPracticeResetDate: state.lastPracticeResetDate,
      }),

      // Custom deserialization
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        deviceFingerprint: persistedState.deviceFingerprint
          ? deserializeFingerprint(persistedState.deviceFingerprint)
          : null,
      }),
    }
  )
);

/**
 * Start a timer to update trial status every second
 * Call this in app initialization (e.g., App.tsx useEffect)
 */
export function startTrialTimer(): NodeJS.Timeout {
  return setInterval(() => {
    const state = useTrialStore.getState();
    if (state.isActive && !state.hasPurchased) {
      state.checkTrialStatus();
    }
  }, 1000); // Update every second
}
