/**
 * Google Play In-App Purchase Service
 * Phase B1: Google Play IAP Integration
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
} from '../../types/payment.types';
import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import * as Crypto from 'expo-crypto';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';

const ONE_TIME_PRODUCT_IDS = ['com.readingdaily.lifetime.access.v2'];
const SUBSCRIPTION_IDS = [
  'com.readingdaily.basic.monthly.v2',
  'com.readingdaily.basic.yearly.v2',
];

export class GooglePlayIAPService implements IPaymentService {
  readonly provider: PaymentProvider = 'google';

  private products: PaymentProduct[] = [];
  private subscriptionOfferTokens: Map<string, string> = new Map();
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private functions = getFunctions(app);

  async initialize(): Promise<void> {
    console.log('[GooglePlayIAPService] Initializing...');

    if (Platform.OS !== 'android') {
      throw new Error('GooglePlayIAPService is only available on Android');
    }

    try {
      // Initialize connection to Google Play
      await RNIap.initConnection();
      console.log('[GooglePlayIAPService] Connection initialized');

      // Set up purchase update listener
      // NOTE: Do NOT call acknowledgePurchaseAndroid here — purchase() method handles it
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        (purchase: any) => {
          console.log('[GooglePlayIAPService] Purchase updated (listener):', purchase.transactionId);
        }
      );

      // Set up purchase error listener
      this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error: any) => {
        console.error('[GooglePlayIAPService] Purchase error:', error);
      });

      // Load available products
      await this.loadProducts();

      console.log('[GooglePlayIAPService] Initialized successfully');
    } catch (error) {
      console.error('[GooglePlayIAPService] Initialization failed:', error);
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
    console.log('[GooglePlayIAPService] Creating payment intent:', productId);

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
    console.log('[GooglePlayIAPService] Processing purchase:', productId);

    try {
      let purchase: any;

      if (SUBSCRIPTION_IDS.includes(productId)) {
        // Subscriptions use requestPurchase with type:'subs' in react-native-iap v14
        const offerToken = this.subscriptionOfferTokens.get(productId);
        console.log('[GooglePlayIAPService] Requesting subscription, offerToken:', offerToken ? 'found' : 'missing');

        // offerToken is REQUIRED for Google Play Billing 5+ subscriptions
        if (!offerToken) {
          return {
            success: false,
            provider: this.provider,
            error: 'Subscription details not loaded. Please close the app fully and try again.',
            timestamp: Date.now(),
          };
        }

        purchase = await RNIap.requestPurchase({
          request: {
            google: {
              skus: [productId],
              subscriptionOffers: [{ sku: productId, offerToken }],
            },
          },
          type: 'subs',
        });
      } else {
        // One-time purchases use requestPurchase with type:'in-app'
        purchase = await RNIap.requestPurchase({
          request: {
            google: {
              skus: [productId],
            },
          },
          type: 'in-app',
        });
      }

      console.log('[GooglePlayIAPService] Purchase response:', purchase);

      if (!purchase) {
        return {
          success: false,
          provider: this.provider,
          error: 'Purchase request failed',
          timestamp: Date.now(),
        };
      }

      // Extract transaction details (handle array response from subscriptions)
      const purchaseItem = Array.isArray(purchase) ? purchase[0] : purchase;
      const transactionId = purchaseItem?.transactionId || 'unknown';
      const receipt = purchaseItem?.transactionReceipt || '';

      // Acknowledge purchase
      if (purchaseItem?.purchaseToken) {
        await RNIap.acknowledgePurchaseAndroid(purchaseItem.purchaseToken);
      }

      console.log('[GooglePlayIAPService] Purchase successful:', transactionId);

      return {
        success: true,
        provider: this.provider,
        transactionId,
        receipt,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error('[GooglePlayIAPService] Purchase failed:', error);

      // Handle specific error codes
      // react-native-iap v14 uses kebab-case codes (e.g. 'user-cancelled')
      // older versions used E_ prefix (e.g. 'E_USER_CANCELLED')
      let errorMessage = 'Purchase failed';
      const code = error.code ?? '';
      if (code === 'user-cancelled' || code === 'E_USER_CANCELLED' || error.responseCode === 1) {
        errorMessage = 'Purchase cancelled by user';
      } else if (code === 'network-error' || code === 'E_NETWORK_ERROR' || error.responseCode === 2) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (code === 'already-owned' || code === 'E_ALREADY_OWNED' || error.responseCode === 7) {
        errorMessage = 'You already own this item. Try restoring purchases.';
      } else if (code === 'item-unavailable' || code === 'E_ITEM_UNAVAILABLE' || error.responseCode === 4) {
        errorMessage = 'This item is currently unavailable in the store.';
      } else if (code === 'billing-unavailable' || code === 'E_BILLING_RESPONSE_JSON_PARSE_ERROR' || error.responseCode === 3) {
        errorMessage = 'Billing service unavailable. Please try again.';
      } else if (code === 'unknown' || code === 'E_UNKNOWN') {
        // Generic Google Play error - may be a product/account configuration issue
        const debug = error.debugMessage || error.message || '';
        errorMessage = `Purchase failed. Check that you are signed into Google Play with a valid account.${debug ? ' (' + debug + ')' : ''}`;
      } else if (error.responseCode !== undefined && error.responseCode !== null) {
        const debug = error.debugMessage ? `: ${error.debugMessage}` : '';
        errorMessage = `Purchase failed (code ${error.responseCode}${debug})`;
      } else if (code) {
        errorMessage = `Purchase failed (${code})`;
      } else if (error.message) {
        errorMessage = `Purchase failed: ${error.message}`;
      } else {
        try {
          errorMessage = `Purchase failed: ${JSON.stringify(error)}`;
        } catch {
          errorMessage = 'Purchase failed (unknown error)';
        }
      }

      return {
        success: false,
        provider: this.provider,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    console.log('[GooglePlayIAPService] Restoring purchases');

    try {
      // Get available purchases (unacknowledged transactions)
      const availablePurchases = await RNIap.getAvailablePurchases();
      console.log('[GooglePlayIAPService] Available purchases:', availablePurchases.length);

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
        (p) => p.productId === 'com.readingdaily.lifetime.access'
      );

      console.log('[GooglePlayIAPService] Restored purchases:', lifetimePurchases.length);

      return {
        success: true,
        purchases: lifetimePurchases,
      };
    } catch (error) {
      console.error('[GooglePlayIAPService] Restore failed:', error);
      return {
        success: false,
        purchases: [],
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  async validateReceipt(receipt: string, productId?: string): Promise<boolean> {
    console.log('[GooglePlayIAPService] Validating receipt');

    // Development mode: skip validation
    if (__DEV__) {
      console.warn('[GooglePlayIAPService] DEV MODE: Receipt validation skipped');
      return true;
    }

    // Production: Call Firebase Cloud Function for validation
    try {
      const validateGoogleReceipt = httpsCallable(this.functions, 'validateGoogleReceipt');

      const result = await validateGoogleReceipt({
        receipt,
        productId: productId || 'com.readingdaily.lifetime.access',
      });

      const data = result.data as { valid: boolean };
      return data.valid === true;
    } catch (error) {
      console.error('[GooglePlayIAPService] Validation failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log('[GooglePlayIAPService] Cleaning up');

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
      console.log('[GooglePlayIAPService] Connection ended');
    } catch (error) {
      console.error('[GooglePlayIAPService] Cleanup failed:', error);
    }
  }

  /**
   * Load available products from Google Play
   */
  private async loadProducts(): Promise<void> {
    try {
      // Load one-time products (react-native-iap v14 uses fetchProducts)
      console.log('[GooglePlayIAPService] Loading one-time products:', ONE_TIME_PRODUCT_IDS);
      const products = await RNIap.fetchProducts({ skus: ONE_TIME_PRODUCT_IDS, type: 'in-app' });
      console.log('[GooglePlayIAPService] One-time products loaded:', products.length);

      this.products = products.map((product: any) => ({
        id: product.id,
        name: product.displayName || product.nameAndroid || product.id,
        description: product.description || '',
        price: product.price ?? 0,
        currency: product.currency || 'USD',
        type: 'one_time' as const,
      }));

      // Load subscriptions and capture offer tokens
      console.log('[GooglePlayIAPService] Loading subscriptions:', SUBSCRIPTION_IDS);
      const subscriptions = await RNIap.fetchProducts({ skus: SUBSCRIPTION_IDS, type: 'subs' });
      console.log('[GooglePlayIAPService] Subscriptions loaded:', subscriptions.length);

      subscriptions.forEach((sub: any) => {
        // v14: offerToken is in subscriptionOffers[0].offerTokenAndroid
        // or fallback to subscriptionOfferDetailsAndroid[0].offerToken
        const offerToken =
          sub.subscriptionOffers?.[0]?.offerTokenAndroid ||
          sub.subscriptionOfferDetailsAndroid?.[0]?.offerToken;

        if (offerToken) {
          this.subscriptionOfferTokens.set(sub.id, offerToken);
          console.log('[GooglePlayIAPService] Offer token captured for:', sub.id);
        } else {
          console.warn('[GooglePlayIAPService] No offer token found for:', sub.id);
        }

        // v14: price is in subscriptionOffers[0].price (number)
        // or fallback to pricingPhases
        const priceValue =
          sub.subscriptionOffers?.[0]?.price ??
          (sub.subscriptionOfferDetailsAndroid?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.priceAmountMicros
            ? parseInt(sub.subscriptionOfferDetailsAndroid[0].pricingPhases.pricingPhaseList[0].priceAmountMicros) / 1_000_000
            : 0);

        const currency =
          sub.subscriptionOffers?.[0]?.currency ||
          sub.subscriptionOfferDetailsAndroid?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.priceCurrencyCode ||
          'USD';

        this.products.push({
          id: sub.id,
          name: sub.displayName || sub.nameAndroid || sub.id,
          description: sub.description || '',
          price: priceValue,
          currency,
          type: 'subscription' as const,
        });
      });
    } catch (error) {
      console.error('[GooglePlayIAPService] Failed to load products:', error);

      // Fallback to hardcoded products (for development)
      if (__DEV__) {
        console.warn('[GooglePlayIAPService] Using fallback products');
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
            description: 'Monthly subscription',
            price: 2.99,
            currency: 'USD',
            type: 'subscription',
          },
          {
            id: 'com.readingdaily.basic.yearly.v2',
            name: 'Basic Yearly',
            description: 'Yearly subscription',
            price: 19.99,
            currency: 'USD',
            type: 'subscription',
          },
        ];
      }
    }
  }
}
