/**
 * Analytics Types
 * Phase 9: Analytics & Monitoring
 *
 * Type definitions for analytics events and metrics
 */

export type AnalyticsEventName =
  | 'free_tier_selected'
  | 'daily_limit_reached'
  | 'upgrade_prompted'
  | 'upgrade_cancelled'
  | 'subscription_purchased'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'payment_failed'
  | 'payment_retried'
  | 'tab_locked_accessed'
  | 'settings_opened'
  | 'subscription_settings_opened'
  | 'payment_method_updated'
  | 'session_completed'
  | 'feature_accessed';

export type UpgradeSource = 'daily_limit' | 'locked_tab' | 'settings' | 'banner' | 'other';
export type PaymentProvider = 'stripe' | 'apple' | 'google' | 'mock';
export type CancellationReason = 'user_initiated' | 'failed_payment' | 'expired' | 'unknown';

/**
 * Daily Limit Reached Event
 */
export interface DailyLimitReachedEvent {
  minutesUsed: number;
  sessionsCount: number;
  daysActive?: number;
}

/**
 * Upgrade Prompted Event
 */
export interface UpgradePromptedEvent {
  source: UpgradeSource;
  tier: 'basic';
  promptType?: 'inline' | 'modal' | 'banner' | 'dialog';
  timestamp?: number;
}

/**
 * Subscription Purchased Event
 */
export interface SubscriptionPurchasedEvent {
  productId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  billingPeriod?: 'monthly' | 'yearly';
  isRenewal?: boolean;
  trialUsed?: boolean;
}

/**
 * Subscription Cancelled Event
 */
export interface SubscriptionCancelledEvent {
  productId: string;
  daysActive: number;
  reason: CancellationReason;
  amount?: number;
  provider: PaymentProvider;
}

/**
 * Payment Failed Event
 */
export interface PaymentFailedEvent {
  productId: string;
  provider: PaymentProvider;
  errorCode?: string;
  errorMessage?: string;
  retryable: boolean;
}

/**
 * Session Completed Event
 */
export interface SessionCompletedEvent {
  durationSeconds: number;
  overallScore: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  prosody: number;
  wordCount: number;
  wordsCorrect: number;
  subscriptionTier: 'free' | 'basic';
}

/**
 * Feature Accessed Event
 */
export interface FeatureAccessedEvent {
  featureName: string;
  subscriptionTier: 'free' | 'basic';
  wasLocked: boolean;
  accessGranted: boolean;
}

/**
 * Generic Analytics Event
 */
export interface AnalyticsEvent {
  name: AnalyticsEventName;
  params?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

/**
 * Subscription Metrics (for dashboard/reporting)
 */
export interface SubscriptionMetrics {
  totalUsers: number;
  freeUsers: number;
  basicUsers: number;
  upgradedThisMonth: number;
  cancelledThisMonth: number;
  monthlyRecurringRevenue: number; // MRR
  averageLifetimeValue: number; // LTV
  upgradeConversionRate: number; // % of free users who upgrade
  retentionRate30Day: number;
  retentionRate60Day: number;
  retentionRate90Day: number;
  churnRate: number; // % of subscriptions cancelled per month
}

/**
 * User Engagement Metrics
 */
export interface UserEngagementMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number; // seconds
  averageSessionsPerDay: number;
  dailyLimitHitRate: number; // % of free users hitting 10-min limit
  upgradeTriggerSource: {
    dailyLimit: number;
    lockedTab: number;
    settings: number;
    banner: number;
  };
}

/**
 * Analytics Service Interface
 */
export interface IAnalyticsService {
  /**
   * Initialize analytics service
   */
  initialize(): Promise<void>;

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string): Promise<void>;

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): Promise<void>;

  /**
   * Log a generic event
   */
  logEvent(event: AnalyticsEvent): Promise<void>;

  /**
   * Log daily limit reached
   */
  logDailyLimitReached(event: DailyLimitReachedEvent): Promise<void>;

  /**
   * Log upgrade prompt
   */
  logUpgradePrompted(event: UpgradePromptedEvent): Promise<void>;

  /**
   * Log upgrade cancelled
   */
  logUpgradeCancelled(source: UpgradeSource): Promise<void>;

  /**
   * Log subscription purchased
   */
  logSubscriptionPurchased(event: SubscriptionPurchasedEvent): Promise<void>;

  /**
   * Log subscription cancelled
   */
  logSubscriptionCancelled(event: SubscriptionCancelledEvent): Promise<void>;

  /**
   * Log subscription renewed
   */
  logSubscriptionRenewed(event: SubscriptionPurchasedEvent): Promise<void>;

  /**
   * Log payment failed
   */
  logPaymentFailed(event: PaymentFailedEvent): Promise<void>;

  /**
   * Log payment retry
   */
  logPaymentRetried(productId: string, provider: PaymentProvider): Promise<void>;

  /**
   * Log session completed
   */
  logSessionCompleted(event: SessionCompletedEvent): Promise<void>;

  /**
   * Log feature accessed
   */
  logFeatureAccessed(event: FeatureAccessedEvent): Promise<void>;

  /**
   * Log tab locked access attempt
   */
  logTabLockedAccessed(tabName: string, subscriptionTier: 'free' | 'basic'): Promise<void>;

  /**
   * Flush pending events (for shutdown)
   */
  flush(): Promise<void>;
}
