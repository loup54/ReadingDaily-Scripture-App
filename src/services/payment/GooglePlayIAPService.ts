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

const PRODUCT_IDS = ['lifetime_access_001']; // Your Google Play product ID

export class GooglePlayIAPService implements IPaymentService {
  readonly provider: PaymentProvider = 'google';

  private products: PaymentProduct[] = [];
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
      // Request purchase
      const purchase = await RNIap.requestPurchase({
        sku: productId,
      });

      console.log('[GooglePlayIAPService] Purchase response:', purchase);

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

      // Acknowledge purchase
      if (purchase.purchaseToken) {
        await RNIap.acknowledgePurchaseAndroid(purchase.purchaseToken);
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
      let errorMessage = 'Purchase failed';
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Purchase cancelled by user';
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.code === 'E_ALREADY_OWNED') {
        errorMessage = 'You already own this item. Try restoring purchases.';
      } else if (error.code === 'E_ITEM_UNAVAILABLE') {
        errorMessage = 'This item is currently unavailable.';
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
        (p) => p.productId === 'lifetime_access_001'
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
        productId: productId || 'lifetime_access_001',
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
      console.log('[GooglePlayIAPService] Loading products:', PRODUCT_IDS);

      const products = await RNIap.getProducts({ skus: PRODUCT_IDS });
      console.log('[GooglePlayIAPService] Products loaded:', products.length);

      this.products = products.map((product) => ({
        id: product.productId,
        name: product.title,
        description: product.description,
        price: parseFloat(product.price),
        currency: product.currency,
        type: 'one_time' as const,
      }));
    } catch (error) {
      console.error('[GooglePlayIAPService] Failed to load products:', error);

      // Fallback to hardcoded product (for development)
      if (__DEV__) {
        console.warn('[GooglePlayIAPService] Using fallback product');
        this.products = [
          {
            id: 'lifetime_access_001',
            name: 'Lifetime Access',
            description: 'Unlock all features forever',
            price: 4.99,
            currency: 'USD',
            type: 'one_time',
          },
        ];
      }
    }
  }
}
