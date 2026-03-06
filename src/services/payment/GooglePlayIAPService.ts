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
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase: RNIap.Purchase) => {
          console.log('[GooglePlayIAPService] Purchase updated:', purchase.transactionId);

          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              // Acknowledge the purchase (required for Google Play)
              if (Platform.OS === 'android') {
                await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken!);
                console.log('[GooglePlayIAPService] Purchase acknowledged');
              }
            } catch (error) {
              console.error('[GooglePlayIAPService] Failed to acknowledge purchase:', error);
            }
          }
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
        // Subscriptions require requestSubscription with offer token on Android
        const offerToken = this.subscriptionOfferTokens.get(productId);
        console.log('[GooglePlayIAPService] Requesting subscription, offerToken:', offerToken ? 'found' : 'missing');

        purchase = await RNIap.requestSubscription({
          sku: productId,
          ...(offerToken && {
            subscriptionOffers: [{ sku: productId, offerToken }],
          }),
        });
      } else {
        // One-time purchases use requestPurchase
        purchase = await RNIap.requestPurchase({ sku: productId });
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

      // Handle specific error codes (react-native-iap may use code string or responseCode number)
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED' || error.responseCode === 1) {
        errorMessage = 'Purchase cancelled by user';
      } else if (error.code === 'E_NETWORK_ERROR' || error.responseCode === 2) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'E_ALREADY_OWNED' || error.responseCode === 7) {
        errorMessage = 'You already own this item. Try restoring purchases.';
      } else if (error.code === 'E_ITEM_UNAVAILABLE' || error.responseCode === 4) {
        errorMessage = 'This item is currently unavailable in the store.';
      } else if (error.code === 'E_BILLING_RESPONSE_JSON_PARSE_ERROR' || error.responseCode === 3) {
        errorMessage = 'Billing service unavailable. Please try again.';
      } else if (error.responseCode !== undefined && error.responseCode !== null) {
        const debug = error.debugMessage ? `: ${error.debugMessage}` : '';
        errorMessage = `Purchase failed (code ${error.responseCode}${debug})`;
      } else if (error.code) {
        errorMessage = `Purchase failed (${error.code})`;
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
      // Load one-time products
      console.log('[GooglePlayIAPService] Loading one-time products:', ONE_TIME_PRODUCT_IDS);
      const products = await RNIap.getProducts({ skus: ONE_TIME_PRODUCT_IDS });
      console.log('[GooglePlayIAPService] One-time products loaded:', products.length);

      this.products = products.map((product) => ({
        id: product.productId,
        name: product.title,
        description: product.description,
        price: parseFloat(product.price),
        currency: product.currency,
        type: 'one_time' as const,
      }));

      // Load subscriptions and capture offer tokens
      console.log('[GooglePlayIAPService] Loading subscriptions:', SUBSCRIPTION_IDS);
      const subscriptions = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_IDS });
      console.log('[GooglePlayIAPService] Subscriptions loaded:', subscriptions.length);

      subscriptions.forEach((sub: any) => {
        // Extract offer token from first available offer
        const offerToken = sub.subscriptionOfferDetails?.[0]?.offerToken;
        if (offerToken) {
          this.subscriptionOfferTokens.set(sub.productId, offerToken);
          console.log('[GooglePlayIAPService] Offer token captured for:', sub.productId);
        }

        const price = sub.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.priceAmountMicros;
        const priceValue = price ? parseInt(price) / 1_000_000 : 0;

        this.products.push({
          id: sub.productId,
          name: sub.name || sub.title,
          description: sub.description,
          price: priceValue,
          currency: sub.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.priceCurrencyCode || 'USD',
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
