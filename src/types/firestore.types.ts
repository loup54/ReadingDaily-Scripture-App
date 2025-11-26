/**
 * Firestore Schema Types
 *
 * TypeScript definitions for Firestore collections and documents
 * Used for backend data management and Cloud Functions
 */

import { SubscriptionTier, SubscriptionStatus } from './subscription.types';

/**
 * User Profile Document
 * Path: users/{userId}
 */
export interface UserProfile {
  // Authentication
  uid: string;
  email: string;
  displayName?: string;

  // Subscription
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp

  // Preferences
  language: string; // e.g., 'en', 'es'
  theme: 'light' | 'dark' | 'system';

  // Metadata
  lastActiveAt?: number; // Timestamp
  fcmToken?: string; // Firebase Cloud Messaging token
}

/**
 * Subscription Document
 * Path: users/{userId}/subscriptions/{subscriptionId}
 */
export interface SubscriptionDocument {
  // Tier and Status
  tier: SubscriptionTier;
  status: SubscriptionStatus;

  // Dates
  startDate: number; // Timestamp when subscription started
  endDate?: number; // Timestamp when subscription ends
  nextBillingDate?: number; // Timestamp of next auto-renewal
  createdAt: number; // Timestamp document created
  updatedAt: number; // Timestamp last updated

  // Auto-Renewal
  autoRenewEnabled: boolean;
  renewalPrice?: number; // Price for renewal (cents)
  renewalCurrency?: string; // e.g., 'USD'

  // Payment Provider
  provider: 'apple' | 'google' | 'stripe' | 'mock';
  providerId?: string; // Provider's subscription ID

  // Product Details
  productId: string; // e.g., 'basic_monthly_subscription'
  productName?: string; // e.g., 'Basic Monthly'
  billingPeriod?: 'monthly' | 'yearly';

  // Transaction
  originalTransactionId?: string; // Provider's transaction ID
  latestTransactionId?: string; // Latest transaction in chain
  purchaseToken?: string; // For validation (Apple/Google)

  // Cancellation
  cancellationDate?: number; // When user cancelled
  cancellationReason?: string;

  // Metadata
  isTrialPeriod: boolean;
  trialEndDate?: number; // When trial period ends
}

/**
 * Daily Usage Document
 * Path: users/{userId}/dailyUsage/{dateString} (e.g., '2025-11-16')
 */
export interface DailyUsageDocument {
  // Date
  date: string; // ISO date string (e.g., '2025-11-16')
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  weekOfYear: number;
  monthYear: string; // 'YYYY-MM'

  // Usage Tracking
  practiceMinutesUsed: number; // Total minutes used this day
  sessionsCount: number; // Number of practice sessions
  longestSessionMinutes?: number; // Longest single session
  averageSessionMinutes?: number; // Average session length

  // Metadata
  createdAt: number; // Timestamp
  lastUpdatedAt: number; // Timestamp
  resetDate: number; // When counter was reset (UTC midnight)

  // Optional: Word count, pronunciation accuracy tracking
  totalWordsAttempted?: number;
  totalWordsCorrect?: number;
  averageAccuracy?: number;
}

/**
 * Practice Session Document
 * Path: users/{userId}/practiceSessions/{sessionId}
 */
export interface PracticeSessionDocument {
  // Session Info
  sessionId: string;
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  durationSeconds: number;

  // Content
  readingId: string; // Reference to reading
  sentenceIndex: number;
  sentence: string;
  referenceText: string;

  // Results
  recordingUri?: string; // Cloud Storage path
  transcribedText?: string;
  accuracy: number; // 0-100
  fluency: number; // 0-100
  completeness: number; // 0-100
  prosody: number; // 0-100
  overallScore: number; // 0-100

  // Feedback
  wordAnalysis?: Array<{
    word: string;
    accuracy: number;
    errorType?: string;
  }>;

  // Metadata
  tier: SubscriptionTier; // Tier at time of session
  createdAt: number;
  updatedAt: number;
}

/**
 * Reading Document (existing, extended for practice tracking)
 * Path: readings/{readingId} or users/{userId}/readings/{readingId}
 */
export interface ReadingDocument {
  // Content
  date: string; // ISO date (e.g., '2025-11-16')
  title: string;
  content: string;
  source?: string; // e.g., 'USCCB Daily Reading'

  // Pronunciation Practice
  isPracticeEnabled: boolean;
  practiceSessions?: number; // Count of sessions for this reading
  bestAccuracy?: number; // Best score across sessions
  lastPracticeDate?: number; // Timestamp of last attempt

  // Metadata
  createdAt: number;
  updatedAt: number;
}

/**
 * Payment Transaction Document
 * Path: users/{userId}/transactions/{transactionId}
 */
export interface PaymentTransactionDocument {
  // Transaction Info
  transactionId: string;
  type: 'purchase' | 'renewal' | 'refund' | 'cancellation';
  status: 'pending' | 'completed' | 'failed' | 'refunded';

  // Amounts (in cents)
  amountCents: number;
  currency: string; // 'USD'

  // Product
  productId: string;
  productName?: string;

  // Provider
  provider: 'apple' | 'google' | 'stripe' | 'mock';
  providerTransactionId?: string;
  receipt?: string; // Encrypted receipt (for validation)

  // Dates
  purchaseDate: number; // Timestamp
  expiryDate?: number; // For trial/renewable
  completedAt?: number; // When status changed to completed

  // Metadata
  isTest: boolean; // Is this a test/sandbox transaction
  createdAt: number;
  updatedAt: number;
}

/**
 * Analytics Event Document
 * Path: analytics/events/{eventId}
 */
export interface AnalyticsEventDocument {
  // Event Info
  eventId: string;
  eventType: string; // e.g., 'paywall_opened', 'upgrade_attempted'
  userId?: string; // Optional: anonymize if needed

  // Context
  context: {
    source?: string; // Where event originated
    tier?: SubscriptionTier;
    appVersion?: string;
    platform?: 'ios' | 'android';
    locale?: string;
  };

  // Data
  data?: Record<string, any>;

  // Timestamp
  createdAt: number;
}

/**
 * Subscription Promo Code Document
 * Path: promoCodes/{codeId}
 */
export interface PromoCodeDocument {
  // Code Info
  code: string; // Unique code (e.g., 'LAUNCH30')
  type: 'discount' | 'free_trial_extension';
  status: 'active' | 'inactive' | 'expired';

  // Benefits
  discountPercent?: number; // For discount codes
  freeDaysAdded?: number; // For trial extension
  maxUses?: number; // -1 for unlimited
  usedCount: number;

  // Dates
  createdAt: number;
  expiryDate?: number; // Timestamp
  activatedAt?: number;

  // Restrictions
  minTierRequired?: SubscriptionTier;
  applicableRegions?: string[]; // Country codes
  newUsersOnly?: boolean;
}

/**
 * Firestore Collection Paths
 */
export const FIRESTORE_PATHS = {
  // User documents
  users: (userId: string) => `users/${userId}`,
  userProfile: (userId: string) => `users/${userId}`,

  // Subscription collection
  subscriptions: (userId: string) => `users/${userId}/subscriptions`,
  subscription: (userId: string, subscriptionId: string) =>
    `users/${userId}/subscriptions/${subscriptionId}`,

  // Daily usage collection
  dailyUsage: (userId: string) => `users/${userId}/dailyUsage`,
  dailyUsageByDate: (userId: string, date: string) =>
    `users/${userId}/dailyUsage/${date}`,

  // Practice sessions collection
  practiceSessions: (userId: string) => `users/${userId}/practiceSessions`,
  practiceSession: (userId: string, sessionId: string) =>
    `users/${userId}/practiceSessions/${sessionId}`,

  // Transactions collection
  transactions: (userId: string) => `users/${userId}/transactions`,
  transaction: (userId: string, transactionId: string) =>
    `users/${userId}/transactions/${transactionId}`,

  // Readings collection
  readings: () => 'readings',
  reading: (readingId: string) => `readings/${readingId}`,
  userReadings: (userId: string) => `users/${userId}/readings`,

  // Analytics
  analyticsEvents: () => 'analytics/events',

  // Promo codes
  promoCodes: () => 'promoCodes',
  promoCode: (codeId: string) => `promoCodes/${codeId}`,
};

/**
 * Firestore Collection Indexes Required
 *
 * These indexes should be created for optimal query performance
 */
export const REQUIRED_INDEXES = [
  // User subscriptions
  {
    collection: 'users',
    fields: [
      { fieldPath: 'subscriptionStatus', order: 'ASCENDING' },
      { fieldPath: 'updatedAt', order: 'DESCENDING' },
    ],
  },
  // Daily usage by date range
  {
    collection: 'users/*/dailyUsage',
    fields: [
      { fieldPath: 'date', order: 'DESCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ],
  },
  // Practice sessions by date
  {
    collection: 'users/*/practiceSessions',
    fields: [
      { fieldPath: 'startTime', order: 'DESCENDING' },
      { fieldPath: 'accuracy', order: 'DESCENDING' },
    ],
  },
  // Transactions by status
  {
    collection: 'users/*/transactions',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'purchaseDate', order: 'DESCENDING' },
    ],
  },
];
