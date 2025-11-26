/**
 * Payment Service Interface
 * Phase 13: Payment Integration
 *
 * Abstract interface for payment providers.
 * Implementations: Stripe, Apple IAP, Google Play, Mock
 */

import {
  PaymentProvider,
  PaymentProduct,
  PaymentIntent,
  PaymentResult,
  RestoreResult,
  SubscriptionStatus,
  CancellationResult,
} from '../../types/payment.types';

/**
 * Payment service interface
 * All payment providers must implement this interface
 */
export interface IPaymentService {
  /**
   * Provider identifier
   */
  readonly provider: PaymentProvider;

  /**
   * Initialize the payment service
   * Called once during app startup
   */
  initialize(): Promise<void>;

  /**
   * Check if the payment service is available on this platform
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get available products
   */
  getProducts(): Promise<PaymentProduct[]>;

  /**
   * Create a payment intent
   * @param productId Product to purchase
   * @returns Payment intent with client secret (if needed)
   */
  createPaymentIntent(productId: string): Promise<PaymentIntent>;

  /**
   * Process a purchase
   * @param productId Product to purchase
   * @returns Payment result with transaction details
   */
  purchase(productId: string): Promise<PaymentResult>;

  /**
   * Restore previous purchases
   * Used when user reinstalls app or switches devices
   */
  restorePurchases(): Promise<RestoreResult>;

  /**
   * Validate a purchase receipt
   * @param receipt Receipt data (platform-specific)
   * @returns True if receipt is valid
   */
  validateReceipt(receipt: string): Promise<boolean>;

  /**
   * Clean up resources
   * Called when service is no longer needed
   */
  cleanup(): Promise<void>;

  /**
   * Cancel a subscription (Phase 7)
   * @param subscriptionId Subscription ID to cancel
   * @returns Cancellation result with effective date
   */
  cancelSubscription(subscriptionId: string): Promise<CancellationResult>;

  /**
   * Get current subscription status (Phase 7)
   * @param subscriptionId Subscription ID to check
   * @returns Subscription status details (active, expiry date, renewal status)
   */
  getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus>;

  /**
   * Update payment method for a subscription (Phase 7)
   * Opens native payment UI (iOS Wallet, Google Play, Stripe Portal)
   * @param subscriptionId Subscription to update payment method for
   * @returns Payment result indicating success/failure
   */
  updatePaymentMethod(subscriptionId: string): Promise<PaymentResult>;
}
