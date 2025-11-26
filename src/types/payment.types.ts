/**
 * Payment Types
 * Phase 13: Payment Integration
 */

export type PaymentProvider = 'stripe' | 'apple' | 'google' | 'mock';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'one_time' | 'subscription';
  billingPeriod?: 'monthly' | 'yearly'; // For subscriptions
  renewalPrice?: number; // For subscriptions
  trialPeriodDays?: number; // For subscriptions
}

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  productId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  clientSecret?: string; // Stripe
  createdAt: number;
}

export interface PaymentResult {
  success: boolean;
  provider: PaymentProvider;
  transactionId?: string;
  subscriptionId?: string; // For subscription purchases
  receipt?: string;
  error?: string;
  timestamp: number;
}

export interface PurchaseRecord {
  userId: string;
  productId: string;
  provider: PaymentProvider;
  transactionId: string;
  receipt?: string;
  purchaseDate: number;
  deviceFingerprint: string;
  validated: boolean;
}

export interface RestoreResult {
  success: boolean;
  purchases: PurchaseRecord[];
  error?: string;
}

/**
 * Stripe-specific types
 */
export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
  expiresAt: number;
}

/**
 * Apple In-App Purchase types
 */
export interface AppleReceiptData {
  transactionId: string;
  productId: string;
  purchaseDate: number;
  originalTransactionId: string;
  receipt: string; // Base64 receipt
}

/**
 * Google Play Billing types
 */
export interface GooglePurchaseData {
  orderId: string;
  packageName: string;
  productId: string;
  purchaseTime: number;
  purchaseToken: string;
  signature: string;
}

/**
 * Subscription Management Types (Phase 7)
 */
export interface SubscriptionStatus {
  isActive: boolean;
  expiryDate?: number; // Timestamp when subscription expires
  willRenew: boolean; // Will auto-renew on expiry date
  autoRenewEnabled: boolean; // User has enabled auto-renewal
}

export interface CancellationResult {
  success: boolean;
  subscriptionId?: string;
  effectiveDate?: number; // When cancellation takes effect
  error?: string;
}
