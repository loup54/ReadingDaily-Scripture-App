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
    // CRITICAL: Force production mode for EAS builds
    // Only use mock in explicit development with environment variable
    const useMockPayments = process.env.EXPO_PUBLIC_USE_MOCK_PAYMENTS === 'true' ||
                            process.env.EXPO_PUBLIC_MOCK_PAYMENTS === 'true';

    if (useMockPayments) {
      console.log('[PaymentServiceFactory] Using MockPaymentService (explicit environment variable)');
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
      // Only use Mock in Expo Go to avoid native module crashes
      // In standalone/production builds (EAS), use real Apple IAP
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';

      if (isExpoGo) {
        console.log('[PaymentServiceFactory] Expo Go detected - using MockPaymentService');
        return new MockPaymentService();
      }

      console.log('[PaymentServiceFactory] Using AppleIAPService for iOS production build');
      const { AppleIAPService } = require('./AppleIAPService');
      return new AppleIAPService();
    }

    if (Platform.OS === 'android') {
      // Only use Mock in Expo Go to avoid native module crashes
      // In standalone/production builds (EAS), use real Google Play Billing
      const Constants = require('expo-constants').default;
      const isExpoGo = Constants.appOwnership === 'expo';

      if (isExpoGo) {
        console.log('[PaymentServiceFactory] Expo Go detected - using MockPaymentService');
        return new MockPaymentService();
      }

      console.log('[PaymentServiceFactory] Using GooglePlayIAPService for Android production build');
      const { GooglePlayIAPService } = require('./GooglePlayIAPService');
      return new GooglePlayIAPService();
    }

    // Fallback to mock
    console.warn('[PaymentServiceFactory] Unknown platform, using Mock');
    return new MockPaymentService();
  }
}
