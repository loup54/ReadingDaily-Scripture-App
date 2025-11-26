/**
 * Payment Service Factory
 * Phase 13: Payment Integration
 *
 * Factory for creating appropriate payment service based on platform and configuration.
 */

import { Platform } from 'react-native';
import { IPaymentService } from './IPaymentService';
import { MockPaymentService } from './MockPaymentService';
import { StripePaymentService } from './StripePaymentService';
// Don't import native modules at top level - they crash in Expo Go
// import { AppleIAPService } from './AppleIAPService';
// import { GooglePlayService } from './GooglePlayService';

export class PaymentServiceFactory {
  /**
   * Create payment service based on platform and environment
   */
  static create(): IPaymentService {
    // Check if we're in development/testing mode
    const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_USE_MOCK_PAYMENTS === 'true';

    if (isDevelopment) {
      console.log('[PaymentServiceFactory] Using MockPaymentService');
      return new MockPaymentService();
    }

    // Production: Use platform-specific service
    if (Platform.OS === 'web') {
      console.log('[PaymentServiceFactory] Using StripePaymentService for web');

      const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      const backendUrl = process.env.EXPO_PUBLIC_PAYMENT_BACKEND_URL;

      if (!stripeKey || !backendUrl) {
        console.warn('[PaymentServiceFactory] Stripe not configured, falling back to Mock');
        return new MockPaymentService();
      }

      return new StripePaymentService(stripeKey, backendUrl);
    }

    if (Platform.OS === 'ios') {
      console.log('[PaymentServiceFactory] iOS detected - but using Mock to avoid Expo Go crash');
      console.warn('[PaymentServiceFactory] Native IAP requires development build or production app');
      return new MockPaymentService();
    }

    if (Platform.OS === 'android') {
      console.log('[PaymentServiceFactory] Android detected - but using Mock to avoid Expo Go crash');
      console.warn('[PaymentServiceFactory] Native IAP requires development build or production app');
      return new MockPaymentService();
    }

    // Fallback to mock
    console.warn('[PaymentServiceFactory] Unknown platform, using Mock');
    return new MockPaymentService();
  }
}
