/**
 * Apple In-App Purchase Service
 * Phase 13.1: Apple IAP Integration
 *
 * Apple StoreKit implementation for iOS in-app purchases.
 * Uses react-native-iap for cross-platform IAP support.
 */

import { IPaymentService } from './IPaymentService';
import {
  PaymentProvider,
  PaymentProduct,
  PaymentIntent,
  PaymentResult,
  RestoreResult,
  PurchaseRecord,
  AppleReceiptData,
  SubscriptionStatus,
  CancellationResult,
} from '../../types/payment.types';
import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import * as Crypto from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';
import { analyticsService } from '../analytics/AnalyticsService';

// Product IDs from Apple App Store Connect
const PRODUCT_IDS = [
  'lifetime_access_001',
  // Phase 7: Subscription products
  'com.readingdaily.basic.monthly',
  'com.readingdaily.basic.yearly',
];

export class AppleIAPService implements IPaymentService {
  readonly provider: PaymentProvider = 'apple';

  private products: PaymentProduct[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private functions = getFunctions(app);

  async initialize(): Promise<void> {
    console.log('[AppleIAPService] Initializing...');

    if (Platform.OS !== 'ios') {
      throw new Error('AppleIAPService is only available on iOS');
    }

    try {
      // Initialize connection to Apple App Store
      await RNIap.initConnection();
      console.log('[AppleIAPService] Connection initialized');

      // Set up purchase update listener
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase: RNIap.Purchase) => {
          console.log('[AppleIAPService] Purchase updated:', purchase.transactionId);

          const receipt = purchase.transactionReceipt;
          if (receipt) {
            // Finish the transaction
            if (Platform.OS === 'ios') {
              await RNIap.finishTransaction({
                purchase,
                isConsumable: false, // Lifetime access is non-consumable
              });
            }
          }
        }
      );

      // Set up purchase error listener
      this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
        console.error('[AppleIAPService] Purchase error:', error);
      });

      // Load available products
      await this.loadProducts();

      console.log('[AppleIAPService] Initialized successfully');
    } catch (error) {
      console.error('[AppleIAPService] Initialization failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return Platform.OS === 'ios';
  }

  async getProducts(): Promise<PaymentProduct[]> {
    if (this.products.length === 0) {
      await this.loadProducts();
    }
    return this.products;
  }

  async createPaymentIntent(productId: string): Promise<PaymentIntent> {
    console.log('[AppleIAPService] Creating payment intent:', productId);

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // For Apple IAP, we don't create separate intents
    // The intent is implicit in the purchase request
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
    console.log('[AppleIAPService] Processing purchase:', productId);

    try {
      // Get product to determine if it's a subscription
      const product = this.products.find((p) => p.id === productId);

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Phase 7: Handle subscription purchases differently
      if (product.type === 'subscription') {
        console.log('[AppleIAPService] Purchasing subscription:', productId);
        const purchase = await RNIap.requestSubscription({
          sku: productId,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
        });

        if (!purchase) {
          return {
            success: false,
            provider: this.provider,
            error: 'Subscription request failed',
            timestamp: Date.now(),
          };
        }

        const transactionId = purchase.transactionId || 'unknown';
        const receipt = purchase.transactionReceipt || '';
        const subscriptionId = purchase.productId || productId;

        console.log('[AppleIAPService] Subscription purchase successful:', transactionId);

        return {
          success: true,
          provider: this.provider,
          transactionId,
          subscriptionId,
          receipt,
          timestamp: Date.now(),
        };
      }

      // One-time purchase
      const purchase = await RNIap.requestPurchase({
        sku: productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });

      console.log('[AppleIAPService] Purchase response:', purchase);

      if (!purchase) {
        return {
          success: false,
          provider: this.provider,
          error: 'Purchase request failed',
          timestamp: Date.now(),
        };
      }

      // Extract transaction details
      const transactionId = purchase.transactionId || 'unknown';
      const receipt = purchase.transactionReceipt || '';

      console.log('[AppleIAPService] Purchase successful:', transactionId);

      return {
        success: true,
        provider: this.provider,
        transactionId,
        receipt,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('[AppleIAPService] Purchase failed:', error);

      // Handle specific error codes
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase cancelled by user';
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'E_ALREADY_OWNED') {
        errorMessage = 'You already own this item. Try restoring purchases.';
      }

      // Log analytics: payment failed
      analyticsService.logPaymentFailed({
        productId,
        provider: this.provider,
        errorCode: error.code,
        errorMessage,
        retryable: error.code !== 'E_USER_CANCELLED',
      });

      return {
        success: false,
        provider: this.provider,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    console.log('[AppleIAPService] Restoring purchases');

    try {
      // Get available purchases (unfinished transactions)
      const availablePurchases = await RNIap.getAvailablePurchases();
      console.log('[AppleIAPService] Available purchases:', availablePurchases.length);

      if (availablePurchases.length === 0) {
        return {
          success: true,
          purchases: [],
        };
      }

      // Convert to PurchaseRecord format
      const purchases: PurchaseRecord[] = await Promise.all(
        availablePurchases.map(async (purchase) => {
          const deviceFingerprint = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            Platform.OS + (Platform.Version || '')
          );

          return {
            userId: 'ios_user', // TODO: Replace with actual user ID
            productId: purchase.productId,
            provider: this.provider,
            transactionId: purchase.transactionId || 'unknown',
            receipt: purchase.transactionReceipt,
            purchaseDate: purchase.transactionDate || Date.now(),
            deviceFingerprint,
            validated: true, // TODO: Validate with server
          };
        })
      );

      // Filter for lifetime access product
      const lifetimePurchases = purchases.filter(
        (p) => p.productId === 'lifetime_access_001'
      );

      console.log('[AppleIAPService] Restored purchases:', lifetimePurchases.length);

      return {
        success: true,
        purchases: lifetimePurchases,
      };
    } catch (error) {
      console.error('[AppleIAPService] Restore failed:', error);
      return {
        success: false,
        purchases: [],
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  async validateReceipt(receipt: string, productId?: string): Promise<boolean> {
    console.log('[AppleIAPService] Validating receipt');

    // Development mode: skip validation
    if (__DEV__) {
      console.warn('[AppleIAPService] DEV MODE: Receipt validation skipped');
      return true;
    }

    // Production: Call Firebase Cloud Function for validation
    try {
      const validateAppleReceipt = httpsCallable(this.functions, 'validateAppleReceipt');

      const result = await validateAppleReceipt({
        receipt,
        productId: productId || 'lifetime_access_001',
      });

      const data = result.data as { valid: boolean };
      return data.valid === true;
    } catch (error) {
      console.error('[AppleIAPService] Validation failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log('[AppleIAPService] Cleaning up');

    // Remove listeners
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    // End connection
    try {
      await RNIap.endConnection();
      console.log('[AppleIAPService] Connection ended');
    } catch (error) {
      console.error('[AppleIAPService] Cleanup failed:', error);
    }
  }

  // Phase 7: Subscription management methods

  /**
   * Cancel a subscription
   * Note: Apple subscriptions are managed by the user through their Apple Account Settings
   * This method cannot directly cancel subscriptions - it only reflects the user's action
   */
  async cancelSubscription(subscriptionId: string): Promise<CancellationResult> {
    console.log('[AppleIAPService] Subscription cancellation initiated:', subscriptionId);

    // Apple doesn't provide a programmatic way to cancel subscriptions
    // Users must manage subscriptions through their Apple Account Settings
    // This is a platform limitation, not an error

    return {
      success: false,
      subscriptionId,
      error: 'Subscriptions must be managed through Apple Account Settings. Go to Settings > [Your Name] > Subscriptions.',
    };
  }

  /**
   * Get subscription status
   * Queries local receipt or validates with Apple
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    console.log('[AppleIAPService] Getting subscription status:', subscriptionId);

    try {
      // Call Firebase Cloud Function to validate subscription with Apple
      const validateAppleSubscription = httpsCallable(
        this.functions,
        'validateAppleSubscription'
      );

      const result = await validateAppleSubscription({ subscriptionId });
      const data = result.data as {
        isActive: boolean;
        expiryDate?: number;
        autoRenewEnabled?: boolean;
      };

      return {
        isActive: data.isActive,
        expiryDate: data.expiryDate,
        willRenew: data.isActive && data.autoRenewEnabled !== false,
        autoRenewEnabled: data.autoRenewEnabled !== false,
      };
    } catch (error) {
      console.error('[AppleIAPService] Get status failed:', error);
      return {
        isActive: false,
        willRenew: false,
        autoRenewEnabled: false,
      };
    }
  }

  /**
   * Update payment method for subscription
   * Opens Apple Account Settings where user can manage payment method
   */
  async updatePaymentMethod(subscriptionId: string): Promise<PaymentResult> {
    console.log('[AppleIAPService] Update payment method for subscription:', subscriptionId);

    // Apple doesn't provide a direct API to change payment methods
    // Users must manage this through their Apple Account Settings
    return {
      success: false,
      provider: this.provider,
      error: 'Payment methods must be updated through Apple Account Settings. Go to Settings > [Your Name] > Payment & Shipping.',
      timestamp: Date.now(),
    };
  }

  /**
   * Load available products from App Store
   */
  private async loadProducts(): Promise<void> {
    try {
      console.log('[AppleIAPService] Loading products:', PRODUCT_IDS);

      const products = await RNIap.getProducts({ skus: PRODUCT_IDS });
      console.log('[AppleIAPService] Products loaded:', products.length);

      this.products = products.map((product) => {
        // Detect subscription vs one-time based on product ID
        const isSubscription =
          product.productId.includes('monthly') || product.productId.includes('yearly');

        const billingPeriod = product.productId.includes('yearly')
          ? 'yearly'
          : 'monthly';

        const baseProduct: PaymentProduct = {
          id: product.productId,
          name: product.title,
          description: product.description,
          price: parseFloat(product.price),
          currency: product.currency,
          type: isSubscription ? 'subscription' : 'one_time',
        };

        // Phase 7: Add subscription-specific fields
        if (isSubscription) {
          return {
            ...baseProduct,
            billingPeriod,
            renewalPrice: parseFloat(product.price),
            trialPeriodDays: 30, // Apple subscriptions typically include trial
          };
        }

        return baseProduct;
      });
    } catch (error) {
      console.error('[AppleIAPService] Failed to load products:', error);

      // Fallback to hardcoded products (for development)
      if (__DEV__) {
        console.warn('[AppleIAPService] Using fallback products');
        this.products = [
          {
            id: 'lifetime_access_001',
            name: 'Lifetime Access',
            description: 'Unlock all features forever',
            price: 4.99,
            currency: 'USD',
            type: 'one_time',
          },
          {
            id: 'com.readingdaily.basic.monthly',
            name: 'Basic Monthly',
            description: 'Unlimited daily practice + full AI feedback',
            price: 2.99,
            currency: 'USD',
            type: 'subscription',
            billingPeriod: 'monthly',
            renewalPrice: 2.99,
            trialPeriodDays: 30,
          },
          {
            id: 'com.readingdaily.basic.yearly',
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
      }
    }
  }
}
