/**
 * Mock Payment Service
 * Phase 13: Payment Integration
 *
 * Mock implementation for development and testing.
 * Simulates successful purchases without real payment processing.
 */

import { IPaymentService } from './IPaymentService';
import {
  PaymentProvider,
  PaymentProduct,
  PaymentIntent,
  PaymentResult,
  RestoreResult,
  PurchaseRecord,
} from '../../types/payment.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { analyticsService } from '../analytics/AnalyticsService';

const MOCK_PURCHASES_KEY = '@mock_purchases';

export class MockPaymentService implements IPaymentService {
  readonly provider: PaymentProvider = 'mock';

  private products: PaymentProduct[] = [
    {
      id: 'lifetime_access_001',
      name: 'Lifetime Access',
      description: 'Unlock all features forever with a one-time payment',
      price: 5.0,
      currency: 'USD',
      type: 'one_time',
    },
    // NEW - Phase 7: Subscription product
    {
      id: 'basic_monthly_subscription',
      name: 'Basic Monthly',
      description: 'Unlimited daily practice + full AI feedback',
      price: 2.99,
      currency: 'USD',
      type: 'subscription',
      billingPeriod: 'monthly',
      renewalPrice: 2.99,
      trialPeriodDays: 30, // 30-day free trial
    },
    {
      id: 'basic_yearly_subscription',
      name: 'Basic Yearly',
      description: 'Unlimited daily practice + full AI feedback (save 2 months!)',
      price: 27.99,
      currency: 'USD',
      type: 'subscription',
      billingPeriod: 'yearly',
      renewalPrice: 27.99,
      trialPeriodDays: 30,
    },
  ];

  // NEW - Phase 7: Track active subscriptions in mock service
  private activeSubscriptions: Map<
    string,
    {
      subscriptionId: string;
      productId: string;
      startDate: number;
      expiryDate: number;
      autoRenewEnabled: boolean;
      transactionId: string;
    }
  > = new Map();

  async initialize(): Promise<void> {
    console.log('[MockPaymentService] Initialized');
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async getProducts(): Promise<PaymentProduct[]> {
    return this.products;
  }

  async createPaymentIntent(productId: string): Promise<PaymentIntent> {
    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const intentId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${productId}-${Date.now()}`
    );

    return {
      id: intentId,
      provider: this.provider,
      productId,
      amount: product.price,
      currency: product.currency,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  async purchase(productId: string): Promise<PaymentResult> {
    console.log('[MockPaymentService] Processing purchase:', productId);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (!success) {
      const result = {
        success: false,
        provider: this.provider,
        error: 'Mock payment failed (5% chance)',
        timestamp: Date.now(),
      };

      // Log analytics: payment failed
      analyticsService.logPaymentFailed({
        productId,
        provider: this.provider,
        errorCode: 'PAYMENT_DECLINED',
        errorMessage: 'Mock payment failed (5% chance)',
        retryable: true,
      });

      return result;
    }

    // Generate mock transaction ID
    const transactionId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `tx-${productId}-${Date.now()}`
    );

    // Generate mock receipt
    const receipt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `receipt-${transactionId}`
    );

    // NEW - Phase 7: Handle subscription purchases
    const product = this.products.find((p) => p.id === productId);
    if (product?.type === 'subscription') {
      // Generate subscription ID
      const subscriptionId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `sub-${productId}-${Date.now()}`
      );

      // Calculate expiry date (trial period + billing period)
      const trialDays = product.trialPeriodDays || 0;
      const startDate = Date.now();
      const trialEndDate = startDate + trialDays * 24 * 60 * 60 * 1000;
      const billingPeriodMs =
        product.billingPeriod === 'yearly'
          ? 365 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
      const expiryDate = trialEndDate + billingPeriodMs;

      // Store subscription
      this.activeSubscriptions.set(subscriptionId, {
        subscriptionId,
        productId,
        startDate,
        expiryDate,
        autoRenewEnabled: true,
        transactionId,
      });

      console.log(
        '[MockPaymentService] Subscription purchase successful:',
        subscriptionId
      );

      return {
        success: true,
        provider: this.provider,
        transactionId,
        subscriptionId, // NEW: Include subscription ID for subscriptions
        receipt,
        timestamp: Date.now(),
      };
    }

    // Store one-time purchase locally
    await this.storePurchase({
      userId: 'mock_user',
      productId,
      provider: this.provider,
      transactionId,
      receipt,
      purchaseDate: Date.now(),
      deviceFingerprint: 'mock_device',
      validated: true,
    });

    console.log('[MockPaymentService] Purchase successful:', transactionId);

    return {
      success: true,
      provider: this.provider,
      transactionId,
      receipt,
      timestamp: Date.now(),
    };
  }

  async restorePurchases(): Promise<RestoreResult> {
    console.log('[MockPaymentService] Restoring purchases');

    try {
      const stored = await AsyncStorage.getItem(MOCK_PURCHASES_KEY);
      if (!stored) {
        return {
          success: true,
          purchases: [],
        };
      }

      const purchases: PurchaseRecord[] = JSON.parse(stored);
      console.log('[MockPaymentService] Restored purchases:', purchases.length);

      return {
        success: true,
        purchases,
      };
    } catch (error) {
      console.error('[MockPaymentService] Restore failed:', error);
      return {
        success: false,
        purchases: [],
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    // Mock validation always succeeds
    console.log('[MockPaymentService] Validating receipt:', receipt.substring(0, 16));
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true;
  }

  async cleanup(): Promise<void> {
    console.log('[MockPaymentService] Cleaned up');
  }

  // NEW - Phase 7: Subscription management methods
  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    console.log('[MockPaymentService] Cancelling subscription:', subscriptionId);

    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
      };
    }

    // Remove subscription
    this.activeSubscriptions.delete(subscriptionId);

    console.log('[MockPaymentService] Subscription cancelled:', subscriptionId);
    return { success: true };
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<{
    isActive: boolean;
    expiryDate?: number;
    willRenew: boolean;
    autoRenewEnabled: boolean;
  }> {
    const subscription = this.activeSubscriptions.get(subscriptionId);

    if (!subscription) {
      return {
        isActive: false,
        willRenew: false,
        autoRenewEnabled: false,
      };
    }

    const isActive = subscription.expiryDate > Date.now();

    return {
      isActive,
      expiryDate: subscription.expiryDate,
      willRenew: isActive && subscription.autoRenewEnabled,
      autoRenewEnabled: subscription.autoRenewEnabled,
    };
  }

  /**
   * Update payment method (mock: just returns success)
   */
  async updatePaymentMethod(
    subscriptionId: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('[MockPaymentService] Updating payment method:', subscriptionId);

    const subscription = this.activeSubscriptions.get(subscriptionId);
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
      };
    }

    // In mock, just return success
    return { success: true };
  }

  /**
   * Store purchase record locally
   */
  private async storePurchase(purchase: PurchaseRecord): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(MOCK_PURCHASES_KEY);
      const purchases: PurchaseRecord[] = stored ? JSON.parse(stored) : [];
      purchases.push(purchase);
      await AsyncStorage.setItem(MOCK_PURCHASES_KEY, JSON.stringify(purchases));
    } catch (error) {
      console.error('[MockPaymentService] Failed to store purchase:', error);
    }
  }
}
