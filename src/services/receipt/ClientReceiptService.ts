/**
 * Client Receipt Service
 *
 * Handles receipt collection from App Store and Google Play
 * Sends receipts to backend for validation
 */

import { auth } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import * as StoreKit from 'react-native-store-kit-2';

export interface ReceiptValidationRequest {
  provider: 'apple' | 'google';
  data: AppleReceiptData | GooglePlayReceiptData;
}

export interface AppleReceiptData {
  receipt: string; // base64 encoded
  password?: string;
}

export interface GooglePlayReceiptData {
  packageName: string;
  subscriptionId: string;
  token: string; // Purchase token
}

export interface ReceiptValidationResponse {
  isValid: boolean;
  subscriptionId: string;
  expiryDate?: number;
  reason?: string;
}

class ClientReceiptServiceClass {
  /**
   * Get latest Apple App Store receipt
   */
  async getAppleReceipt(): Promise<string | null> {
    try {
      const receipt = await StoreKit.requestReceipt();
      if (!receipt) {
        console.warn('[ClientReceiptService] No Apple receipt available');
        return null;
      }
      return receipt;
    } catch (error) {
      console.error('[ClientReceiptService] Error getting Apple receipt:', error);
      return null;
    }
  }

  /**
   * Validate Apple receipt with backend
   */
  async validateAppleReceipt(receipt: string): Promise<ReceiptValidationResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          isValid: false,
          subscriptionId: '',
          reason: 'User not authenticated',
        };
      }

      const validateReceiptFunction = httpsCallable<
        ReceiptValidationRequest,
        ReceiptValidationResponse
      >(functions, 'validateReceipt');

      const response = await validateReceiptFunction({
        provider: 'apple',
        data: {
          receipt,
          password: process.env.EXPO_PUBLIC_APPLE_SHARED_SECRET,
        },
      });

      console.log('[ClientReceiptService] Apple receipt validation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ClientReceiptService] Error validating Apple receipt:', error);
      return {
        isValid: false,
        subscriptionId: '',
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get Google Play purchase token for subscription
   */
  async getGooglePlayPurchaseToken(subscriptionId: string): Promise<string | null> {
    try {
      // This would use Google Play Billing Library v5+
      // Implementation depends on how it's integrated with React Native
      console.log('[ClientReceiptService] Getting Google Play token for:', subscriptionId);
      // Placeholder - actual implementation uses Play Billing Library
      return null;
    } catch (error) {
      console.error('[ClientReceiptService] Error getting Google Play token:', error);
      return null;
    }
  }

  /**
   * Validate Google Play receipt with backend
   */
  async validateGooglePlayReceipt(
    packageName: string,
    subscriptionId: string,
    token: string
  ): Promise<ReceiptValidationResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          isValid: false,
          subscriptionId: '',
          reason: 'User not authenticated',
        };
      }

      const validateReceiptFunction = httpsCallable<
        ReceiptValidationRequest,
        ReceiptValidationResponse
      >(functions, 'validateReceipt');

      const response = await validateReceiptFunction({
        provider: 'google',
        data: {
          packageName,
          subscriptionId,
          token,
        },
      });

      console.log('[ClientReceiptService] Google Play receipt validation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ClientReceiptService] Error validating Google Play receipt:', error);
      return {
        isValid: false,
        subscriptionId: '',
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh receipt (e.g., after subscription renewal)
   */
  async refreshReceipt(): Promise<boolean> {
    try {
      await StoreKit.requestReceipt();
      console.log('[ClientReceiptService] Receipt refreshed');
      return true;
    } catch (error) {
      console.error('[ClientReceiptService] Error refreshing receipt:', error);
      return false;
    }
  }
}

// Export singleton instance
export const clientReceiptService = new ClientReceiptServiceClass();
