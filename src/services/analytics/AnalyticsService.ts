/**
 * Analytics Service Manager
 * Phase 9: Analytics & Monitoring
 *
 * Central service for managing analytics across the app
 */

import { IAnalyticsService } from '@/types/analytics.types';
import { FirebaseAnalyticsService } from './FirebaseAnalyticsService';
import { MockAnalyticsService } from './MockAnalyticsService';
import type {
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

class AnalyticsServiceManager {
  private service: IAnalyticsService | null = null;
  private initialized = false;

  /**
   * Initialize analytics service
   * Uses Firebase in production, Mock in development
   */
  async initialize(useMock = __DEV__): Promise<void> {
    if (this.initialized) return;

    try {
      if (useMock) {
        this.service = new MockAnalyticsService();
      } else {
        this.service = new FirebaseAnalyticsService();
      }

      await this.service.initialize();
      this.initialized = true;
      console.log('[AnalyticsService] Initialized:', useMock ? 'Mock' : 'Firebase');
    } catch (error) {
      console.error('[AnalyticsService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.service) {
      throw new Error('Analytics service not initialized. Call initialize() first.');
    }
  }

  /**
   * Set user ID for analytics
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.setUserId(userId);
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.setUserProperties(properties);
  }

  /**
   * Log a generic event
   */
  async logEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logEvent(event);
  }

  /**
   * Log daily limit reached
   */
  async logDailyLimitReached(event: DailyLimitReachedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logDailyLimitReached(event);
  }

  /**
   * Log upgrade prompted
   */
  async logUpgradePrompted(event: UpgradePromptedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logUpgradePrompted(event);
  }

  /**
   * Log upgrade cancelled
   */
  async logUpgradeCancelled(source: UpgradeSource): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logUpgradeCancelled(source);
  }

  /**
   * Log subscription purchased
   */
  async logSubscriptionPurchased(event: SubscriptionPurchasedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logSubscriptionPurchased(event);
  }

  /**
   * Log subscription cancelled
   */
  async logSubscriptionCancelled(event: SubscriptionCancelledEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logSubscriptionCancelled(event);
  }

  /**
   * Log subscription renewed
   */
  async logSubscriptionRenewed(event: SubscriptionPurchasedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logSubscriptionRenewed(event);
  }

  /**
   * Log payment failed
   */
  async logPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logPaymentFailed(event);
  }

  /**
   * Log payment retried
   */
  async logPaymentRetried(productId: string, provider: string): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logPaymentRetried(productId, provider);
  }

  /**
   * Log session completed
   */
  async logSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logSessionCompleted(event);
  }

  /**
   * Log feature accessed
   */
  async logFeatureAccessed(event: FeatureAccessedEvent): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logFeatureAccessed(event);
  }

  /**
   * Log tab locked accessed
   */
  async logTabLockedAccessed(tabName: string, subscriptionTier: 'free' | 'basic'): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.logTabLockedAccessed(tabName, subscriptionTier);
  }

  /**
   * Flush pending events
   */
  async flush(): Promise<void> {
    if (!this.initialized || !this.service) return;
    await this.service.flush();
  }

  /**
   * Get underlying service (for testing/debugging)
   */
  getService(): IAnalyticsService | null {
    return this.service;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsServiceManager();
