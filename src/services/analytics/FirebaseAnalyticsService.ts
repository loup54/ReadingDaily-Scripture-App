/**
 * Firebase Analytics Service
 * Phase 9: Analytics & Monitoring
 *
 * Analytics implementation using Firebase Analytics
 */

import { getAnalytics, logEvent, setUserId as setFirebaseUserId, setUserProperties } from 'firebase/analytics';
import { app } from '@/config/firebase';
import {
  IAnalyticsService,
  AnalyticsEvent,
  AnalyticsEventName,
  DailyLimitReachedEvent,
  UpgradePromptedEvent,
  SubscriptionPurchasedEvent,
  SubscriptionCancelledEvent,
  PaymentFailedEvent,
  SessionCompletedEvent,
  FeatureAccessedEvent,
  UpgradeSource,
} from '@/types/analytics.types';

export class FirebaseAnalyticsService implements IAnalyticsService {
  private analytics: any = null;
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      this.analytics = getAnalytics(app);
      this.initialized = true;
      console.log('[FirebaseAnalyticsService] Initialized');
    } catch (error) {
      console.error('[FirebaseAnalyticsService] Initialization failed:', error);
      throw error;
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.initialized) return;

    try {
      setFirebaseUserId(this.analytics, userId);
      console.log('[FirebaseAnalyticsService] User ID set:', userId);
    } catch (error) {
      console.error('[FirebaseAnalyticsService] Failed to set user ID:', error);
    }
  }

  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.initialized) return;

    try {
      setUserProperties(this.analytics, properties);
      console.log('[FirebaseAnalyticsService] User properties set:', Object.keys(properties));
    } catch (error) {
      console.error('[FirebaseAnalyticsService] Failed to set user properties:', error);
    }
  }

  async logEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.initialized) return;

    try {
      logEvent(this.analytics, event.name as AnalyticsEventName, {
        ...event.params,
        timestamp: event.timestamp,
      });
    } catch (error) {
      console.error('[FirebaseAnalyticsService] Failed to log event:', error);
    }
  }

  async logDailyLimitReached(event: DailyLimitReachedEvent): Promise<void> {
    await this.logEvent({
      name: 'daily_limit_reached',
      params: {
        minutesUsed: event.minutesUsed,
        sessionsCount: event.sessionsCount,
        daysActive: event.daysActive || 0,
      },
      timestamp: Date.now(),
    });
  }

  async logUpgradePrompted(event: UpgradePromptedEvent): Promise<void> {
    await this.logEvent({
      name: 'upgrade_prompted',
      params: {
        source: event.source,
        tier: event.tier,
        promptType: event.promptType || 'modal',
      },
      timestamp: Date.now(),
    });
  }

  async logUpgradeCancelled(source: UpgradeSource): Promise<void> {
    await this.logEvent({
      name: 'upgrade_cancelled',
      params: {
        source,
      },
      timestamp: Date.now(),
    });
  }

  async logSubscriptionPurchased(event: SubscriptionPurchasedEvent): Promise<void> {
    await this.logEvent({
      name: 'subscription_purchased',
      params: {
        productId: event.productId,
        amount: event.amount,
        currency: event.currency,
        provider: event.provider,
        billingPeriod: event.billingPeriod || 'monthly',
        isRenewal: event.isRenewal || false,
        trialUsed: event.trialUsed || false,
      },
      timestamp: Date.now(),
    });
  }

  async logSubscriptionCancelled(event: SubscriptionCancelledEvent): Promise<void> {
    await this.logEvent({
      name: 'subscription_cancelled',
      params: {
        productId: event.productId,
        daysActive: event.daysActive,
        reason: event.reason,
        amount: event.amount || 0,
        provider: event.provider,
      },
      timestamp: Date.now(),
    });
  }

  async logSubscriptionRenewed(event: SubscriptionPurchasedEvent): Promise<void> {
    await this.logEvent({
      name: 'subscription_renewed',
      params: {
        productId: event.productId,
        amount: event.amount,
        currency: event.currency,
        provider: event.provider,
        billingPeriod: event.billingPeriod || 'monthly',
      },
      timestamp: Date.now(),
    });
  }

  async logPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    await this.logEvent({
      name: 'payment_failed',
      params: {
        productId: event.productId,
        provider: event.provider,
        errorCode: event.errorCode || 'unknown',
        errorMessage: event.errorMessage || '',
        retryable: event.retryable,
      },
      timestamp: Date.now(),
    });
  }

  async logPaymentRetried(productId: string, provider: string): Promise<void> {
    await this.logEvent({
      name: 'payment_retried',
      params: {
        productId,
        provider,
      },
      timestamp: Date.now(),
    });
  }

  async logSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    await this.logEvent({
      name: 'session_completed',
      params: {
        durationSeconds: event.durationSeconds,
        overallScore: event.overallScore,
        accuracy: event.accuracy,
        fluency: event.fluency,
        completeness: event.completeness,
        prosody: event.prosody,
        wordCount: event.wordCount,
        wordsCorrect: event.wordsCorrect,
        subscriptionTier: event.subscriptionTier,
      },
      timestamp: Date.now(),
    });
  }

  async logFeatureAccessed(event: FeatureAccessedEvent): Promise<void> {
    await this.logEvent({
      name: 'feature_accessed',
      params: {
        featureName: event.featureName,
        subscriptionTier: event.subscriptionTier,
        wasLocked: event.wasLocked,
        accessGranted: event.accessGranted,
      },
      timestamp: Date.now(),
    });
  }

  async logTabLockedAccessed(tabName: string, subscriptionTier: 'free' | 'basic'): Promise<void> {
    await this.logEvent({
      name: 'tab_locked_accessed',
      params: {
        tabName,
        subscriptionTier,
      },
      timestamp: Date.now(),
    });
  }

  async flush(): Promise<void> {
    // Firebase Analytics auto-batches events, but this can be implemented
    // for explicit flushing if needed
    console.log('[FirebaseAnalyticsService] Events flushed');
  }
}
