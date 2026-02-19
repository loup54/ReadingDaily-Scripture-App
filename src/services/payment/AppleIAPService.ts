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
// Updated to .v2 after recreating IAPs in App Store Connect (January 24, 2026)
const PRODUCT_IDS = [
  'com.readingdaily.lifetime.access.v2',
  // Phase 7: Subscription products
  'com.readingdaily.basic.monthly.v2',
  'com.readingdaily.basic.yearly.v2',
];

export class AppleIAPService implements IPaymentService {
  readonly provider: PaymentProvider = 'apple';

  private products: PaymentProduct[] = [];
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private functions = getFunctions(app);
  private isInitialized: boolean = false;

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
          console.log('[AppleIAPService] Purchase updated:', purchase.id);

          const receipt = purchase.purchaseToken;
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
        console.error('[AppleIAPService] ⚠️ Purchase error from listener:', error);
        console.error('[AppleIAPService] Error code:', error?.code);
        console.error('[AppleIAPService] Error message:', error?.message);
        console.error('[AppleIAPService] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      });

      // Load available products
      await this.loadProducts();

      // Mark as initialized
      this.isInitialized = true;
      console.log('[AppleIAPService] ✅ Initialized successfully with', this.products.length, 'products');
    } catch (error) {
      console.error('[AppleIAPService] Initialization failed:', error);
      this.isInitialized = false;
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


    // Auto-initialize if not already initialized
    if (!this.isInitialized) {
      console.log('⚠️ [IAP] Service not initialized, auto-initializing...');
      try {
        await this.initialize();
        
        // Verify initialization actually succeeded
        if (!this.isInitialized) {
          throw new Error('Initialization completed but isInitialized flag not set');
        }
        
        console.log('✅ [IAP] Auto-initialization successful');
      } catch (error) {
        console.error('❌ [IAP] Auto-initialization failed:', error);
        throw new Error(`Unable to initialize payment service: ${error.message}`);
      }
    }


    // Debug logging: Check service state before purchase
    console.log('[AppleIAPService] Pre-purchase state check:', {
      productsLoaded: this.products.length,
      productsArray: this.products,
      requestedProductId: productId,
      productExists: this.products.some((p) => p.id === productId),
      storeKitInitialized: this.purchaseUpdateSubscription !== null,
      isInitialized: this.isInitialized,
    });

    try {
      // Ensure products are loaded before attempting purchase
      if (this.products.length === 0) {
        console.log('[AppleIAPService] Products not loaded, loading now...');
        await this.loadProducts();
        console.log('[AppleIAPService] Products loaded:', this.products.length);
      }

      // Get product to determine if it's a subscription
      const product = this.products.find((p) => p.id === productId);

      if (!product) {
        console.error('[AppleIAPService] Product not found. Available products:', this.products.map(p => p.id));
        throw new Error(`Product not found: ${productId}. Available: ${this.products.map(p => p.id).join(', ')}`);
      }

      console.log('[AppleIAPService] Found product:', { id: product.id, type: product.type, price: product.price });

      // Phase 7: Handle subscription purchases differently
      if (product.type === 'subscription') {
        console.log('[AppleIAPService] Purchasing subscription:', productId);
        console.log('[AppleIAPService] Calling RNIap.requestPurchase with type: subs');
        const purchaseResult = await RNIap.requestPurchase({
          request: { apple: { sku: productId, andDangerouslyFinishTransactionAutomatically: false } },
          type: 'subs',
        });
        console.log('[AppleIAPService] Subscription purchaseResult type:', typeof purchaseResult, 'isArray:', Array.isArray(purchaseResult), 'length:', Array.isArray(purchaseResult) ? purchaseResult.length : 'N/A');

        if (!purchaseResult) {
          return {
            success: false,
            provider: this.provider,
            error: 'Subscription request failed',
            timestamp: Date.now(),
          };
        }

        const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;

        // Check if purchase is valid
        if (!purchase) {
          console.error('[AppleIAPService] Subscription purchase is undefined!');
          console.error('[AppleIAPService] This means purchaseResult was an empty array [] or the item at [0] is undefined');
          console.error('[AppleIAPService] Full purchaseResult:', JSON.stringify(purchaseResult));
          return {
            success: false,
            provider: this.provider,
            error: 'Subscription request returned empty result - no purchase data received from Apple',
            timestamp: Date.now(),
          };
        }

        const transactionId = purchase.id || 'unknown';
        const receipt = purchase.purchaseToken || '';
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
      console.log('[AppleIAPService] Calling RNIap.requestPurchase with type: in-app, sku:', productId);
      const purchaseResult = await RNIap.requestPurchase({
        request: { apple: { sku: productId, andDangerouslyFinishTransactionAutomatically: false } },
        type: 'in-app',
      });

      console.log('[AppleIAPService] Purchase response type:', typeof purchaseResult, 'isArray:', Array.isArray(purchaseResult), 'length:', Array.isArray(purchaseResult) ? purchaseResult.length : 'N/A');
      console.log('[AppleIAPService] Purchase response:', purchaseResult);

      if (!purchaseResult) {
        return {
          success: false,
          provider: this.provider,
          error: 'Purchase request failed',
          timestamp: Date.now(),
        };
      }

      const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;

      // Check if purchase is valid
      if (!purchase) {
        console.error('[AppleIAPService] ONE-TIME Purchase is undefined!');
        console.error('[AppleIAPService] This means purchaseResult was an empty array [] or the item at [0] is undefined');
        console.error('[AppleIAPService] Full purchaseResult:', JSON.stringify(purchaseResult));
        console.error('[AppleIAPService] This usually means:');
        console.error('[AppleIAPService]   1. Product not available in App Store sandbox/TestFlight');
        console.error('[AppleIAPService]   2. Product misconfigured in App Store Connect');
        console.error('[AppleIAPService]   3. StoreKit rejected the purchase request');
        return {
          success: false,
          provider: this.provider,
          error: 'Purchase request returned empty result - no purchase data received from Apple. Check if product is available in TestFlight.',
          timestamp: Date.now(),
        };
      }

      // Extract transaction details
      const transactionId = purchase.id || 'unknown';
      const receipt = purchase.purchaseToken || '';

      console.log('[AppleIAPService] Purchase successful:', transactionId);

      return {
        success: true,
        provider: this.provider,
        transactionId,
        receipt,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      // Detailed error logging
      console.error('[AppleIAPService] Purchase failed:', error);
      console.error('[AppleIAPService] Error details:', {
        productId,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorName: error?.name,
        errorStack: error?.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // Handle specific error codes
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase cancelled by user';
        console.log('[AppleIAPService] User cancelled the purchase');
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
        console.error('[AppleIAPService] Network error during purchase');
      } else if (error.code === 'E_ALREADY_OWNED') {
        errorMessage = 'You already own this item. Try restoring purchases.';
        console.warn('[AppleIAPService] User already owns this product');
      } else {
        // Log unknown error codes and include details in error message
        console.error('[AppleIAPService] Unknown error code:', error.code);
        // Include actual error details for debugging
        const errorCode = error?.code || 'NO_CODE';
        const errorMsg = error?.message || error?.toString() || 'Unknown error';
        errorMessage = `Purchase failed: ${errorCode} - ${errorMsg}`;
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
            transactionId: purchase.id || 'unknown',
            receipt: purchase.purchaseToken ?? undefined,
            purchaseDate: purchase.transactionDate || Date.now(),
            deviceFingerprint,
            validated: true, // TODO: Validate with server
          };
        })
      );

      // Finish all transactions to clear pending state
      console.log('[AppleIAPService] Finishing', availablePurchases.length, 'transactions');
      for (const purchase of availablePurchases) {
        try {
          await RNIap.finishTransaction({
            purchase,
            isConsumable: false,
          });
          console.log('[AppleIAPService] Finished transaction:', purchase.id);
        } catch (error) {
          console.error('[AppleIAPService] Failed to finish transaction:', purchase.id, error);
        }
      }

      // Filter for lifetime access product
      const lifetimePurchases = purchases.filter(
        (p) => p.productId === 'com.readingdaily.lifetime.access.v2'
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
        productId: productId || 'com.readingdaily.lifetime.access.v2',
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

    // Reset initialization flag
    this.isInitialized = false;
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

      const products = await RNIap.fetchProducts({ skus: PRODUCT_IDS, type: 'all' });
      console.log('[AppleIAPService] Products loaded:', products?.length ?? 0);
      console.log('[AppleIAPService] Raw products from store:', JSON.stringify(products, null, 2));

      if (!products) {
        console.warn('[AppleIAPService] No products returned from store');
        return;
      }

      if (products.length === 0) {
        console.error('[AppleIAPService] Empty products array returned from store - no IAPs available!');
        return;
      }

      this.products = products.map((product) => {
        // v14: product.type is 'in-app' | 'subs', product.id is the SKU
        const isSubscription = product.type === 'subs';
        const billingPeriod = product.id.includes('yearly') ? 'yearly' : 'monthly';
        // v14: product.price is already a number (or null)
        const price = product.price ?? 0;

        const baseProduct: PaymentProduct = {
          id: product.id,
          name: product.title,
          description: product.description,
          price,
          currency: product.currency,
          type: isSubscription ? 'subscription' : 'one_time',
        };

        // Phase 7: Add subscription-specific fields
        if (isSubscription) {
          return {
            ...baseProduct,
            billingPeriod,
            renewalPrice: price,
            trialPeriodDays: 30, // Apple subscriptions typically include trial
          };
        }

        return baseProduct;
      });

      // Log final mapped products
      console.log('[AppleIAPService] Final mapped products:', this.products.map(p => ({ id: p.id, type: p.type, price: p.price })));
    } catch (error) {
      console.error('[AppleIAPService] Failed to load products:', error);

      // Fallback to hardcoded products (for development)
      if (__DEV__) {
        console.warn('[AppleIAPService] Using fallback products');
        this.products = [
          {
            id: 'com.readingdaily.lifetime.access.v2',
            name: 'Lifetime Access',
            description: 'Unlock all features forever',
            price: 49.99,
            currency: 'USD',
            type: 'one_time',
          },
          {
            id: 'com.readingdaily.basic.monthly.v2',
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
            id: 'com.readingdaily.basic.yearly.v2',
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
