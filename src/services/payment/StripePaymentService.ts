/**
 * Stripe Payment Service
 * Phase 13: Payment Integration
 *
 * Stripe implementation for web and universal platforms.
 * Uses Stripe Checkout for one-time purchases.
 */

import { IPaymentService } from './IPaymentService';
import {
  PaymentProvider,
  PaymentProduct,
  PaymentIntent,
  PaymentResult,
  RestoreResult,
  StripeCheckoutSession,
  SubscriptionStatus,
  CancellationResult,
} from '../../types/payment.types';
import { Platform, Linking } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';
import { analyticsService } from '../analytics/AnalyticsService';

export class StripePaymentService implements IPaymentService {
  readonly provider: PaymentProvider = 'stripe';

  private publishableKey: string;
  private backendUrl: string; // Cloud Function URL (for reference, but we use Firebase SDK)
  private functions = getFunctions(app);

  constructor(publishableKey: string, backendUrl: string) {
    this.publishableKey = publishableKey;
    this.backendUrl = backendUrl;
  }

  async initialize(): Promise<void> {
    console.log('[StripePaymentService] Initialized');
    if (!this.publishableKey) {
      throw new Error('Stripe publishable key not configured');
    }
  }

  async isAvailable(): Promise<boolean> {
    // Stripe is available on web and can be used on mobile with webview
    return Platform.OS === 'web' || Platform.OS === 'android' || Platform.OS === 'ios';
  }

  async getProducts(): Promise<PaymentProduct[]> {
    // In production, fetch from backend
    // For now, return hardcoded products
    return [
      {
        id: 'lifetime_access_001',
        name: 'Lifetime Access',
        description: 'Unlock all features forever with a one-time payment',
        price: 5.0,
        currency: 'USD',
        type: 'one_time',
      },
      // Phase 7: Subscription products
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
  }

  async createPaymentIntent(productId: string): Promise<PaymentIntent> {
    console.log('[StripePaymentService] Creating payment intent:', productId);

    try {
      // Call Firebase Cloud Function to create Stripe Checkout Session
      const createCheckoutSession = httpsCallable(this.functions, 'createCheckoutSession');

      const baseUrl = Platform.OS === 'web'
        ? window.location.origin
        : 'readingdailyscripture://';

      const result = await createCheckoutSession({
        productId,
        successUrl: `${baseUrl}/success`,
        cancelUrl: `${baseUrl}/cancel`,
      });

      const session = result.data as StripeCheckoutSession;

      return {
        id: session.sessionId,
        provider: this.provider,
        productId,
        amount: 500, // $5.00 in cents
        currency: 'usd',
        status: 'pending',
        clientSecret: session.sessionId,
        createdAt: Date.now(),
        metadata: {
          checkoutUrl: session.url,
        },
      };
    } catch (error) {
      console.error('[StripePaymentService] Create intent failed:', error);
      throw error;
    }
  }

  async purchase(productId: string): Promise<PaymentResult> {
    console.log('[StripePaymentService] Processing purchase:', productId);

    try {
      // Get product to check if it's a subscription
      const products = await this.getProducts();
      const product = products.find((p) => p.id === productId);

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Phase 7: Handle subscription products differently
      if (product.type === 'subscription') {
        // For subscriptions, create a subscription checkout session
        const createSubscriptionCheckout = httpsCallable(
          this.functions,
          'createSubscriptionCheckout'
        );

        const baseUrl = Platform.OS === 'web'
          ? window.location.origin
          : 'readingdailyscripture://';

        const result = await createSubscriptionCheckout({
          productId,
          successUrl: `${baseUrl}/subscription-success`,
          cancelUrl: `${baseUrl}/subscription-cancel`,
        });

        const session = result.data as {
          sessionId: string;
          url: string;
          subscriptionId?: string;
        };

        if (Platform.OS === 'web') {
          // Redirect to Stripe Checkout
          window.location.href = session.url;
        } else {
          // Mobile: Open Stripe Checkout URL using Linking
          const supported = await Linking.canOpenURL(session.url);
          if (supported) {
            await Linking.openURL(session.url);
          }
        }

        // Return pending result with subscription ID (actual result will come from webhook)
        return {
          success: false,
          provider: this.provider,
          subscriptionId: session.subscriptionId,
          error: 'Redirecting to Stripe Checkout',
          timestamp: Date.now(),
        };
      }

      // One-time purchase flow
      // Create payment intent (checkout session)
      const intent = await this.createPaymentIntent(productId);
      const checkoutUrl = intent.metadata?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from server');
      }

      if (Platform.OS === 'web') {
        // Redirect to Stripe Checkout
        window.location.href = checkoutUrl;

        // Return pending result (actual result will come from webhook)
        return {
          success: false,
          provider: this.provider,
          error: 'Redirecting to Stripe Checkout',
          timestamp: Date.now(),
        };
      } else {
        // Mobile: Open Stripe Checkout URL using Linking
        const supported = await Linking.canOpenURL(checkoutUrl);

        if (supported) {
          await Linking.openURL(checkoutUrl);
          return {
            success: false,
            provider: this.provider,
            error: 'Opening Stripe Checkout',
            timestamp: Date.now(),
          };
        } else {
          throw new Error('Cannot open Stripe Checkout URL');
        }
      }
    } catch (error) {
      console.error('[StripePaymentService] Purchase failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed';

      // Log analytics: payment failed
      analyticsService.logPaymentFailed({
        productId,
        provider: this.provider,
        errorMessage,
        retryable: true,
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
    console.log('[StripePaymentService] Restore not applicable for Stripe');

    // Stripe doesn't have a "restore" concept like mobile IAP
    // Instead, users sign in to their account to access purchases
    return {
      success: false,
      purchases: [],
      error: 'Restore not available. Please sign in to your account.',
    };
  }

  async validateReceipt(receipt: string): Promise<boolean> {
    console.log('[StripePaymentService] Validating receipt:', receipt.substring(0, 16));

    try {
      // Call Firebase Cloud Function to validate Stripe session
      const validateSession = httpsCallable(this.functions, 'validateSession');

      const result = await validateSession({ sessionId: receipt });
      const data = result.data as { valid: boolean };

      return data.valid === true;
    } catch (error) {
      console.error('[StripePaymentService] Validation failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log('[StripePaymentService] Cleaned up');
  }

  // Phase 7: Subscription management methods

  /**
   * Cancel a subscription
   * @param subscriptionId Stripe subscription ID
   */
  async cancelSubscription(subscriptionId: string): Promise<CancellationResult> {
    console.log('[StripePaymentService] Cancelling subscription:', subscriptionId);

    try {
      // Call Firebase Cloud Function to cancel Stripe subscription
      const cancelSubscription = httpsCallable(
        this.functions,
        'cancelStripeSubscription'
      );

      const result = await cancelSubscription({ subscriptionId });
      const data = result.data as { success: boolean; canceledAt?: number };

      if (data.success) {
        return {
          success: true,
          subscriptionId,
          effectiveDate: data.canceledAt || Date.now(),
        };
      } else {
        return {
          success: false,
          error: 'Failed to cancel subscription',
        };
      }
    } catch (error) {
      console.error('[StripePaymentService] Cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Cancellation failed',
      };
    }
  }

  /**
   * Get subscription status
   * @param subscriptionId Stripe subscription ID
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    console.log('[StripePaymentService] Getting subscription status:', subscriptionId);

    try {
      // Call Firebase Cloud Function to get subscription details
      const getSubscriptionStatus = httpsCallable(
        this.functions,
        'getStripeSubscriptionStatus'
      );

      const result = await getSubscriptionStatus({ subscriptionId });
      const data = result.data as {
        status: string;
        currentPeriodEnd?: number;
        cancelAt?: number | null;
      };

      const isActive = data.status === 'active';
      const expiryDate = data.currentPeriodEnd ? data.currentPeriodEnd * 1000 : undefined;
      const willRenew = isActive && !data.cancelAt;
      const autoRenewEnabled = !data.cancelAt;

      return {
        isActive,
        expiryDate,
        willRenew,
        autoRenewEnabled,
      };
    } catch (error) {
      console.error('[StripePaymentService] Get status failed:', error);
      return {
        isActive: false,
        willRenew: false,
        autoRenewEnabled: false,
      };
    }
  }

  /**
   * Update payment method for subscription
   * Opens Stripe Customer Portal where user can manage billing
   * @param subscriptionId Stripe subscription ID
   */
  async updatePaymentMethod(subscriptionId: string): Promise<PaymentResult> {
    console.log('[StripePaymentService] Updating payment method:', subscriptionId);

    try {
      // Call Firebase Cloud Function to create billing portal session
      const createBillingPortal = httpsCallable(
        this.functions,
        'createStripeBillingPortalSession'
      );

      const baseUrl = Platform.OS === 'web'
        ? window.location.origin
        : 'readingdailyscripture://';

      const result = await createBillingPortal({
        subscriptionId,
        returnUrl: `${baseUrl}/settings`,
      });

      const data = result.data as { portalUrl: string };

      if (Platform.OS === 'web') {
        // Redirect to Stripe Customer Portal
        window.location.href = data.portalUrl;
      } else {
        // Mobile: Open in browser
        const supported = await Linking.canOpenURL(data.portalUrl);
        if (supported) {
          await Linking.openURL(data.portalUrl);
        }
      }

      return {
        success: true,
        provider: this.provider,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[StripePaymentService] Update payment method failed:', error);
      return {
        success: false,
        provider: this.provider,
        error: error instanceof Error ? error.message : 'Failed to update payment method',
        timestamp: Date.now(),
      };
    }
  }
}
