/**
 * Mock Analytics Service
 * Phase 9: Analytics & Monitoring
 *
 * Mock implementation for development and testing
 */

import {
  IAnalyticsService,
  AnalyticsEvent,
  DailyLimitReachedEvent,
  UpgradePromptedEvent,
  SubscriptionPurchasedEvent,
  SubscriptionCancelledEvent,
  PaymentFailedEvent,
  SessionCompletedEvent,
  FeatureAccessedEvent,
  UpgradeSource,
} from '@/types/analytics.types';

export class MockAnalyticsService implements IAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userId: string | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('[MockAnalyticsService] Initialized');
  }

  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    console.log('[MockAnalyticsService] User ID set:', userId);
  }

  async setUserProperties(properties: Record<string, any>): Promise<void> {
    console.log('[MockAnalyticsService] User properties set:', properties);
  }

  async logEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.initialized) return;

    this.events.push({
      ...event,
      userId: this.userId || undefined,
    });

    console.log('[MockAnalyticsService] Event logged:', event.name, event.params);
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
      params: { source },
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
      params: { productId, provider },
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
      params: { tabName, subscriptionTier },
      timestamp: Date.now(),
    });
  }

  async flush(): Promise<void> {
    console.log(`[MockAnalyticsService] Flushed ${this.events.length} events`);
  }

  // Test helpers
  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  getEventsByName(name: string): AnalyticsEvent[] {
    return this.events.filter(e => e.name === name);
  }

  clearEvents(): void {
    this.events = [];
  }
}
