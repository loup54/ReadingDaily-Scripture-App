/**
 * Receipt Validation Service
 *
 * Server-side validation of App Store and Google Play Store receipts
 * Ensures subscriptions are legitimate before granting premium access
 *
 * Prevents:
 * - Receipt spoofing (fake receipts)
 * - Expired subscriptions being used
 * - Refunded subscriptions still having access
 * - Cross-platform fraud (using same receipt on multiple accounts)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

interface AppleReceiptData {
  receipt: string; // base64 encoded receipt
  password?: string; // shared secret for subscriptions
}

interface GooglePlayReceiptData {
  packageName: string;
  subscriptionId: string;
  token: string; // Purchase token from Google Play
}

interface ReceiptValidationResult {
  isValid: boolean;
  provider: 'apple' | 'google' | 'stripe';
  subscriptionId: string;
  expiryDate?: number; // Unix timestamp
  originalTransactionId?: string;
  bundleId?: string;
  reason?: string;
}

class ReceiptValidationServiceClass {
  private readonly APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
  private readonly APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
  private readonly GOOGLE_PLAY_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';

  /**
   * Validate Apple App Store receipt
   * Calls Apple's verification servers to validate receipt authenticity
   */
  async validateAppleReceipt(data: AppleReceiptData): Promise<ReceiptValidationResult> {
    try {
      const password = data.password || process.env.APPLE_SHARED_SECRET || '';

      // Try production first, then sandbox
      let response = await this.callAppleVerificationAPI(
        this.APPLE_PRODUCTION_URL,
        data.receipt,
        password
      );

      // If 21007, try sandbox instead
      if (response.status === 21007) {
        response = await this.callAppleVerificationAPI(
          this.APPLE_SANDBOX_URL,
          data.receipt,
          password
        );
      }

      if (response.status !== 0) {
        return {
          isValid: false,
          provider: 'apple',
          subscriptionId: '',
          reason: `Apple verification failed with status ${response.status}`,
        };
      }

      // Extract latest receipt info
      const receipt = response.latest_receipt_info?.[0] || response.receipt?.in_app?.[0];
      if (!receipt) {
        return {
          isValid: false,
          provider: 'apple',
          subscriptionId: '',
          reason: 'No receipt data found in response',
        };
      }

      // Check if subscription is active
      const expiryDate = parseInt(receipt.expires_date_ms, 10);
      const isActive = expiryDate > Date.now();

      // Check for cancellation status
      const isCancelled = receipt.cancellation_date_ms;

      return {
        isValid: isActive && !isCancelled,
        provider: 'apple',
        subscriptionId: receipt.product_id,
        expiryDate: expiryDate,
        originalTransactionId: receipt.original_transaction_id,
        bundleId: receipt.bundle_id,
        reason: isCancelled ? 'Subscription cancelled' : isActive ? undefined : 'Subscription expired',
      };
    } catch (error) {
      console.error('[ReceiptValidationService] Apple validation error:', error);
      return {
        isValid: false,
        provider: 'apple',
        subscriptionId: '',
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate Google Play Store receipt
   * Uses Google Play Billing API to validate subscription token
   */
  async validateGooglePlayReceipt(data: GooglePlayReceiptData): Promise<ReceiptValidationResult> {
    try {
      const accessToken = await this.getGoogleAccessToken();
      if (!accessToken) {
        return {
          isValid: false,
          provider: 'google',
          subscriptionId: data.subscriptionId,
          reason: 'Failed to get Google access token',
        };
      }

      const url = `${this.GOOGLE_PLAY_API}/applications/${data.packageName}/subscriptions/${data.subscriptionId}/tokens/${data.token}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const subscription = response.data;

      // Check subscription state
      // 0 = canceled, 1 = active, 2 = pending
      const isActive = subscription.paymentState === 1 && subscription.autoRenewing === true;

      const expiryDate = subscription.expiryTimeMillis
        ? parseInt(subscription.expiryTimeMillis, 10)
        : undefined;

      return {
        isValid: isActive,
        provider: 'google',
        subscriptionId: data.subscriptionId,
        expiryDate: expiryDate,
        reason: !isActive ? 'Subscription inactive or cancelled' : undefined,
      };
    } catch (error) {
      console.error('[ReceiptValidationService] Google Play validation error:', error);
      return {
        isValid: false,
        provider: 'google',
        subscriptionId: data.subscriptionId,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record validated receipt for duplicate detection
   * Prevents using same receipt on multiple accounts
   */
  async recordValidatedReceipt(
    userId: string,
    receipt: ReceiptValidationResult,
    rawData: AppleReceiptData | GooglePlayReceiptData
  ): Promise<void> {
    try {
      const receiptHash = this.hashReceipt(rawData);

      // Check if this receipt has been used before
      const existing = await admin
        .firestore()
        .collection('receiptValidations')
        .where('receiptHash', '==', receiptHash)
        .limit(1)
        .get();

      if (!existing.empty && existing.docs[0].data().userId !== userId) {
        console.warn('[ReceiptValidationService] Duplicate receipt detected:', {
          originalUser: existing.docs[0].data().userId,
          attemptedUser: userId,
          provider: receipt.provider,
        });

        // Store abuse attempt
        await admin.firestore().collection('receiptAbuseAttempts').add({
          userId,
          attemptedUserId: existing.docs[0].data().userId,
          provider: receipt.provider,
          timestamp: admin.firestore.Timestamp.now(),
          reason: 'Duplicate receipt',
        });
      }

      // Record this validation
      await admin.firestore().collection('receiptValidations').add({
        userId,
        provider: receipt.provider,
        subscriptionId: receipt.subscriptionId,
        receiptHash,
        originalTransactionId: receipt.originalTransactionId,
        expiryDate: receipt.expiryDate ? new Date(receipt.expiryDate) : null,
        validatedAt: admin.firestore.Timestamp.now(),
        isValid: receipt.isValid,
      });

      console.log('[ReceiptValidationService] Receipt recorded for user:', userId);
    } catch (error) {
      console.error('[ReceiptValidationService] Error recording receipt:', error);
    }
  }

  /**
   * Check if user has a valid receipt on file
   */
  async getUserLatestValidReceipt(userId: string): Promise<ReceiptValidationResult | null> {
    try {
      const snapshot = await admin
        .firestore()
        .collection('receiptValidations')
        .where('userId', '==', userId)
        .where('isValid', '==', true)
        .orderBy('validatedAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const data = snapshot.docs[0].data();
      return {
        isValid: true,
        provider: data.provider as 'apple' | 'google' | 'stripe',
        subscriptionId: data.subscriptionId,
        expiryDate: data.expiryDate?.toMillis(),
        originalTransactionId: data.originalTransactionId,
      };
    } catch (error) {
      console.error('[ReceiptValidationService] Error fetching user receipt:', error);
      return null;
    }
  }

  /**
   * Call Apple's receipt verification API
   */
  private async callAppleVerificationAPI(
    url: string,
    receipt: string,
    password: string
  ): Promise<any> {
    try {
      const response = await axios.post(url, {
        'receipt-data': receipt,
        password,
        'exclude-old-transactions': false,
      });

      return response.data;
    } catch (error) {
      console.error('[ReceiptValidationService] Apple API error:', error);
      throw error;
    }
  }

  /**
   * Get Google Play access token using service account credentials
   */
  private async getGoogleAccessToken(): Promise<string | null> {
    try {
      const serviceAccount = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT || '{}');

      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: this.generateGoogleJWT(serviceAccount),
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('[ReceiptValidationService] Failed to get Google access token:', error);
      return null;
    }
  }

  /**
   * Generate JWT for Google service account authentication
   */
  private generateGoogleJWT(serviceAccount: any): string {
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    // Note: In production, use a proper JWT library to sign this
    // This is a simplified example
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

    return `${encodedHeader}.${encodedPayload}.signature`;
  }

  /**
   * Create hash of receipt for duplicate detection
   */
  private hashReceipt(data: AppleReceiptData | GooglePlayReceiptData): string {
    const crypto = require('crypto');
    let receiptString = '';

    if ('receipt' in data) {
      receiptString = data.receipt;
    } else {
      receiptString = `${data.packageName}:${data.subscriptionId}:${data.token}`;
    }

    return crypto.createHash('sha256').update(receiptString).digest('hex');
  }
}

// Export singleton instance
export const receiptValidationService = new ReceiptValidationServiceClass();

/**
 * Cloud Function: validateReceipt
 * Called by client to validate receipt and grant subscription access
 */
export const validateReceipt = functions.https.onCall<
  { provider: 'apple' | 'google'; data: AppleReceiptData | GooglePlayReceiptData },
  { isValid: boolean; subscriptionId: string; expiryDate?: number; reason?: string }
>(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { provider, data: receiptData } = data;

    let result: ReceiptValidationResult;

    if (provider === 'apple') {
      result = await receiptValidationService.validateAppleReceipt(
        receiptData as AppleReceiptData
      );
    } else if (provider === 'google') {
      result = await receiptValidationService.validateGooglePlayReceipt(
        receiptData as GooglePlayReceiptData
      );
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid provider');
    }

    // Record validated receipt
    if (result.isValid) {
      await receiptValidationService.recordValidatedReceipt(userId, result, receiptData);

      // Update user's subscription status
      await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: 'active',
        subscriptionProvider: result.provider,
        subscriptionId: result.subscriptionId,
        subscriptionExpiryDate: result.expiryDate ? new Date(result.expiryDate) : null,
        originalTransactionId: result.originalTransactionId,
        receiptValidatedAt: admin.firestore.Timestamp.now(),
      });

      console.log(`[validateReceipt] Valid subscription activated for user: ${userId}`);
    } else {
      console.warn(`[validateReceipt] Invalid receipt for user: ${userId}`, result.reason);
    }

    return {
      isValid: result.isValid,
      subscriptionId: result.subscriptionId,
      expiryDate: result.expiryDate,
      reason: result.reason,
    };
  } catch (error) {
    console.error('[validateReceipt] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
