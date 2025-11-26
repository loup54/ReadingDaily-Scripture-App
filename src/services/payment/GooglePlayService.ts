/**
 * Google Play Billing Service
 * Phase 13.2: Google Play Integration
 *
 * Google Play Billing implementation for Android in-app purchases.
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
  GooglePurchaseData,
  SubscriptionStatus,
  CancellationResult,
} from '../../types/payment.types';
import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import * as Crypto from 'expo-crypto';
import { analyticsService } from '../analytics/AnalyticsService';

// Product IDs from Google Play Console
const PRODUCT_IDS = [
  'lifetime_access_001',
  // Phase 7: Subscription products
  'com.readingdaily.basic.monthly',
  'com.readingdaily.basic.yearly',
];

export class GooglePlayService implements IPaymentService {
  readonly provider: PaymentProvider = 'google';

  private products: PaymentProduct[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  async initialize(): Promise<void> {
    console.log('[GooglePlayService] Initializing...');

    if (Platform.OS !== 'android') {
      throw new Error('GooglePlayService is only available on Android');
    }

    try {
      // Initialize connection to Google Play Billing
      await RNIap.initConnection();
      console.log('[GooglePlayService] Connection initialized');

      // Flush pending transactions (recommended by Google)
      await RNIap.flushFailedPurchasesCachedAsPendingAndroid();

      // Set up purchase update listener
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase: RNIap.Purchase) => {
          console.log('[GooglePlayService] Purchase updated:', purchase.transactionId);

          // Get purchase token
          const token = purchase.purchaseToken;
          if (token) {
            // Acknowledge purchase (required by Google)
            if (Platform.OS === 'android') {
              await RNIap.acknowledgePurchaseAndroid({
                token,
                developerPayload: purchase.productId,
              });
              console.log('[GooglePlayService] Purchase acknowledged');
            }
          }
        }
      );

      // Set up purchase error listener
      this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
        console.error('[GooglePlayService] Purchase error:', error);
      });

      // Load available products
      await this.loadProducts();

      console.log('[GooglePlayService] Initialized successfully');
    } catch (error) {
      console.error('[GooglePlayService] Initialization failed:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    return Platform.OS === 'android';
  }

  async getProducts(): Promise<PaymentProduct[]> {
    if (this.products.length === 0) {
      await this.loadProducts();
    }
    return this.products;
  }

  async createPaymentIntent(productId: string): Promise<PaymentIntent> {
    console.log('[GooglePlayService] Creating payment intent:', productId);

    const product = this.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // For Google Play, we don't create separate intents
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
    console.log('[GooglePlayService] Processing purchase:', productId);

    try {
      // Get product to determine if it's a subscription
      const product = this.products.find((p) => p.id === productId);

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Phase 7: Handle subscription purchases differently
      if (product.type === 'subscription') {
        console.log('[GooglePlayService] Purchasing subscription:', productId);
        const purchase = await RNIap.requestSubscription({
          sku: productId,
        });

        if (!purchase) {
          return {
            success: false,
            provider: this.provider,
            error: 'Subscription request failed',
            timestamp: Date.now(),
          };
        }

        const transactionId = purchase.transactionId || purchase.purchaseToken || 'unknown';
        const subscriptionId = purchase.transactionId || productId;
        const receipt = JSON.stringify({
          orderId: purchase.transactionId,
          packageName: 'com.readingdaily.scripture',
          productId: purchase.productId,
          purchaseTime: purchase.transactionDate,
          purchaseToken: purchase.purchaseToken,
          signature: purchase.signatureAndroid,
        });

        // Acknowledge subscription (required by Google Play)
        if (purchase.purchaseToken) {
          await RNIap.acknowledgePurchaseAndroid({
            token: purchase.purchaseToken,
            developerPayload: productId,
          });
          console.log('[GooglePlayService] Subscription acknowledged');
        }

        console.log('[GooglePlayService] Subscription purchase successful:', transactionId);

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
      // Request purchase
      const purchase = await RNIap.requestPurchase({
        sku: productId,
      });

      console.log('[GooglePlayService] Purchase response:', purchase);

      if (!purchase) {
        return {
          success: false,
          provider: this.provider,
          error: 'Purchase request failed',
          timestamp: Date.now(),
        };
      }

      // Extract transaction details
      const transactionId = purchase.transactionId || purchase.purchaseToken || 'unknown';
      const receipt = JSON.stringify({
        orderId: purchase.transactionId,
        packageName: 'com.readingdaily.scripture',
        productId: purchase.productId,
        purchaseTime: purchase.transactionDate,
        purchaseToken: purchase.purchaseToken,
        signature: purchase.signatureAndroid,
      });

      // Acknowledge purchase (required by Google Play)
      if (purchase.purchaseToken) {
        await RNIap.acknowledgePurchaseAndroid({
          token: purchase.purchaseToken,
          developerPayload: productId,
        });
        console.log('[GooglePlayService] Purchase acknowledged');
      }

      console.log('[GooglePlayService] Purchase successful:', transactionId);

      return {
        success: true,
        provider: this.provider,
        transactionId,
        receipt,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('[GooglePlayService] Purchase failed:', error);

      // Handle specific error codes
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase cancelled by user';
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'E_ALREADY_OWNED') {
        errorMessage = 'You already own this item. Try restoring purchases.';
      } else if (error.code === 'E_DEVELOPER_ERROR') {
        errorMessage = 'Configuration error. Please contact support.';
      } else if (error.code === 'E_ITEM_UNAVAILABLE') {
        errorMessage = 'This item is not available for purchase.';
      }

      // Log analytics: payment failed
      analyticsService.logPaymentFailed({
        productId,
        provider: this.provider,
        errorCode: error.code,
        errorMessage,
        retryable: error.code !== 'E_USER_CANCELLED' && error.code !== 'E_DEVELOPER_ERROR',
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
    console.log('[GooglePlayService] Restoring purchases');

    try {
      // Get available purchases (unacknowledged purchases)
      const availablePurchases = await RNIap.getAvailablePurchases();
      console.log('[GooglePlayService] Available purchases:', availablePurchases.length);

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
            userId: 'android_user', // TODO: Replace with actual user ID
            productId: purchase.productId,
            provider: this.provider,
            transactionId: purchase.transactionId || purchase.purchaseToken || 'unknown',
            receipt: JSON.stringify({
              orderId: purchase.transactionId,
              purchaseToken: purchase.purchaseToken,
              signature: purchase.signatureAndroid,
            }),
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

      // Acknowledge any unacknowledged purchases
      for (const purchase of availablePurchases) {
        if (purchase.purchaseToken && !purchase.isAcknowledgedAndroid) {
          await RNIap.acknowledgePurchaseAndroid({
            token: purchase.purchaseToken,
            developerPayload: purchase.productId,
          });
          console.log('[GooglePlayService] Acknowledged restored purchase:', purchase.productId);
        }
      }

      console.log('[GooglePlayService] Restored purchases:', lifetimePurchases.length);

      return {
        success: true,
        purchases: lifetimePurchases,
      };
    } catch (error) {
      console.error('[GooglePlayService] Restore failed:', error);
      return {
        success: false,
        purchases: [],
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    console.log('[GooglePlayService] Validating purchase token');

    // TODO: Implement server-side validation
    // For now, accept all receipts (development only)
    if (__DEV__) {
      console.warn('[GooglePlayService] DEV MODE: Receipt validation skipped');
      return true;
    }

    // Production: Send receipt to backend for validation
    // Backend should call Google Play Developer API
    try {
      const backendUrl = process.env.EXPO_PUBLIC_PAYMENT_BACKEND_URL;
      if (!backendUrl) {
        throw new Error('Backend URL not configured');
      }

      const purchaseData = JSON.parse(receipt);

      const response = await fetch(`${backendUrl}/validateGooglePurchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageName: purchaseData.packageName,
          productId: purchaseData.productId,
          purchaseToken: purchaseData.purchaseToken,
          signature: purchaseData.signature,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('[GooglePlayService] Validation failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log('[GooglePlayService] Cleaning up');

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
      console.log('[GooglePlayService] Connection ended');
    } catch (error) {
      console.error('[GooglePlayService] Cleanup failed:', error);
    }
  }

  // Phase 7: Subscription management methods

  /**
   * Cancel a subscription
   * Note: Google Play subscriptions are managed by the user through their Google Account
   * This method cannot directly cancel subscriptions
   */
  async cancelSubscription(subscriptionId: string): Promise<CancellationResult> {
    console.log('[GooglePlayService] Subscription cancellation initiated:', subscriptionId);

    // Google Play doesn't provide a programmatic way to cancel subscriptions
    // Users must manage subscriptions through Google Play app or account settings
    // This is a platform limitation, not an error

    return {
      success: false,
      subscriptionId,
      error: 'Subscriptions must be managed through Google Play. Go to Google Play app > Tap account icon > Manage subscriptions.',
    };
  }

  /**
   * Get subscription status
   * Queries subscription status from Google Play Developer API
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    console.log('[GooglePlayService] Getting subscription status:', subscriptionId);

    try {
      // TODO: Implement server-side validation with Google Play Developer API
      // For now, return inactive status
      return {
        isActive: false,
        willRenew: false,
        autoRenewEnabled: false,
      };
    } catch (error) {
      console.error('[GooglePlayService] Get status failed:', error);
      return {
        isActive: false,
        willRenew: false,
        autoRenewEnabled: false,
      };
    }
  }

  /**
   * Update payment method for subscription
   * Opens Google Play app where user can manage payment method
   */
  async updatePaymentMethod(subscriptionId: string): Promise<PaymentResult> {
    console.log('[GooglePlayService] Update payment method for subscription:', subscriptionId);

    // Google Play doesn't provide a direct API to change payment methods
    // Users must manage this through Google Play app or Google Account
    return {
      success: false,
      provider: this.provider,
      error: 'Payment methods must be updated through Google Play. Go to Google Play app > Tap account icon > Manage subscriptions.',
      timestamp: Date.now(),
    };
  }

  /**
   * Load available products from Google Play Store
   */
  private async loadProducts(): Promise<void> {
    try {
      console.log('[GooglePlayService] Loading products:', PRODUCT_IDS);

      const products = await RNIap.getProducts({ skus: PRODUCT_IDS });
      console.log('[GooglePlayService] Products loaded:', products.length);

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
            trialPeriodDays: 0, // Google Play trial setup varies
          };
        }

        return baseProduct;
      });
    } catch (error) {
      console.error('[GooglePlayService] Failed to load products:', error);

      // Fallback to hardcoded products (for development)
      if (__DEV__) {
        console.warn('[GooglePlayService] Using fallback products');
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
            trialPeriodDays: 0,
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
            trialPeriodDays: 0,
          },
        ];
      }
    }
  }
}
