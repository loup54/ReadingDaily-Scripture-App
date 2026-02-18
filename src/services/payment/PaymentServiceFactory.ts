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
// Native IAP modules loaded via dynamic require to avoid Expo Go crash.
// __DEV__ is true in Expo Go, so these paths are never reached there.

export class PaymentServiceFactory {
  /**
   * Create payment service based on platform and environment
   */
  static create(): IPaymentService {
    // In development/Expo Go, __DEV__ is true — use mock to avoid native module crash.
    // EXPO_PUBLIC_USE_MOCK_PAYMENTS can also force mock in a native dev build.
    const isDevelopment = __DEV__ || process.env.EXPO_PUBLIC_USE_MOCK_PAYMENTS === 'true';

    if (isDevelopment) {
      console.log('[PaymentServiceFactory] Using MockPaymentService');
      return new MockPaymentService();
    }

    // Production native build: use real platform payment services.
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
      console.log('[PaymentServiceFactory] Using AppleIAPService for iOS production build');
      // Dynamic require prevents the module from loading in Expo Go (where __DEV__ is true
      // and this branch is never reached).
      const { AppleIAPService } = require('./AppleIAPService');
      return new AppleIAPService();
    }

    if (Platform.OS === 'android') {
      console.log('[PaymentServiceFactory] Using GooglePlayService for Android production build');
      const { GooglePlayService } = require('./GooglePlayService');
      return new GooglePlayService();
    }

    // Fallback to mock
    console.warn('[PaymentServiceFactory] Unknown platform, using Mock');
    return new MockPaymentService();
  }
}
