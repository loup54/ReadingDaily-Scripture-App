/**
 * Cloud Function: Redeem Gift Code
 * Firebase Cloud Callable Function for gift code redemption
 *
 * This function wraps the SubscriptionGiftingService.redeemGiftCode() method
 * and provides server-side validation, authentication, and error handling.
 *
 * Can be deployed as:
 * exports.redeemGiftCode = functions.https.onCall(redeemGiftCodeFunction);
 */

import * as admin from 'firebase-admin';
import { subscriptionGiftingService } from './SubscriptionGiftingService';
import { RedemptionResult } from '@/types/gifting.types';

// Initialize Firebase Admin (if not already done)
if (!admin.apps.length) {
  admin.initializeApp();
}

interface RedeemGiftCodeRequest {
  code: string; // The gift code to redeem (e.g., "GIFT-ABC123-XYZ")
  ipAddress?: string; // Client's IP address
  deviceId?: string; // Device identifier
}

interface RedeemGiftCodeResponse {
  success: boolean;
  message: string;
  giftCodeId?: string;
  subscriptionActivated?: {
    tier: string;
    expiresAt: number;
    durationMonths: number | null;
  };
  error?: string;
}

/**
 * Cloud Function handler for gift code redemption
 *
 * @param data - Request data containing gift code and device info
 * @param context - Firebase context with authenticated user info
 * @returns Redemption result
 *
 * @throws FirebaseError if user is not authenticated
 * @throws Error if redemption fails for any reason
 */
export const redeemGiftCodeFunction = async (
  data: RedeemGiftCodeRequest,
  context: any // firebase.functions.https.CallableContext
): Promise<RedeemGiftCodeResponse> => {
  try {
    // 1. Validate user is authenticated
    if (!context.auth) {
      return {
        success: false,
        message: 'User must be authenticated to redeem gift codes',
        error: 'AUTHENTICATION_REQUIRED',
      };
    }

    const userId = context.auth.uid;
    const userEmail = context.auth.token.email || context.auth.token.email_verified ? context.auth.token.email : '';

    // 2. Validate input
    if (!data.code || typeof data.code !== 'string') {
      return {
        success: false,
        message: 'Gift code is required and must be a string',
        error: 'INVALID_INPUT',
      };
    }

    const code = data.code.trim();

    if (code.length === 0) {
      return {
        success: false,
        message: 'Gift code cannot be empty',
        error: 'INVALID_INPUT',
      };
    }

    console.log('[redeemGiftCodeFunction] Attempting redemption', {
      userId,
      code: code.substring(0, 6) + '***', // Log sanitized code
      timestamp: new Date().toISOString(),
    });

    // 3. Call the service to redeem the code
    const result: RedemptionResult = await subscriptionGiftingService.redeemGiftCode(
      code,
      userId,
      userEmail,
      {
        ipAddress: data.ipAddress,
        deviceId: data.deviceId,
      }
    );

    // 4. If redemption succeeded, update user's subscription in Firestore
    if (result.success && result.subscriptionActivated) {
      try {
        const expiresAt = result.subscriptionActivated.expiresAt;
        const tier = result.subscriptionActivated.tier;

        // Update user's subscription document
        await admin
          .firestore()
          .collection('users')
          .doc(userId)
          .update({
            subscriptionStatus: 'active',
            subscriptionTier: tier,
            subscriptionExpiresAt: expiresAt,
            subscriptionActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
            subscriptionActivatedVia: 'giftCode',
            lastGiftCodeRedeemedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log('[redeemGiftCodeFunction] User subscription updated', {
          userId,
          tier,
          expiresAt,
        });
      } catch (updateError) {
        console.error('[redeemGiftCodeFunction] Error updating user subscription:', updateError);
        // Don't fail the response if user update fails, but log it
        // The gift code redemption was successful
      }
    }

    console.log('[redeemGiftCodeFunction] Redemption result:', {
      success: result.success,
      giftCodeId: result.giftCodeId,
    });

    // 5. Return the result to client
    return {
      success: result.success,
      message: result.message,
      giftCodeId: result.giftCodeId,
      subscriptionActivated: result.subscriptionActivated,
    };
  } catch (error) {
    console.error('[redeemGiftCodeFunction] Unexpected error:', error);

    return {
      success: false,
      message: 'An unexpected error occurred while redeeming your gift code. Please try again later.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
};

/**
 * Client-side callable function wrapper
 * Use this in React components to call the Cloud Function
 *
 * Example usage:
 * ```typescript
 * const functions = getFunctions();
 * const redeemGift = httpsCallable(functions, 'redeemGiftCode');
 *
 * try {
 *   const result = await redeemGift({
 *     code: 'GIFT-ABC123-XYZ',
 *     ipAddress: clientIpAddress,
 *     deviceId: deviceId,
 *   });
 *
 *   if (result.data.success) {
 *     // Gift redeemed successfully
 *   } else {
 *     // Show error message
 *   }
 * } catch (error) {
 *   console.error('Failed to redeem gift:', error);
 * }
 * ```
 */

/**
 * Validation helpers for client-side pre-validation before calling function
 */

/**
 * Validate gift code format before submission
 * Format: GIFT-{8 alphanumeric}-{4 alphanumeric}
 * Example: GIFT-ABC12345-XYZ7
 *
 * @param code - The code to validate
 * @returns true if code format is valid
 */
export function isValidGiftCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const giftCodeRegex = /^GIFT-[A-Z0-9]{8}-[A-Z0-9]{4}$/i;
  return giftCodeRegex.test(code.trim().toUpperCase());
}

/**
 * Format gift code to standard format (uppercase, hyphens)
 * Input: "giftabc12345xyz7" or "GIFT-ABC12345-XYZ7" or "GIFTABC12345XYZ7"
 * Output: "GIFT-ABC12345-XYZ7"
 *
 * @param code - The code to format
 * @returns Formatted code or empty string if invalid
 */
export function formatGiftCode(code: string): string {
  if (!code) return '';

  // Remove all spaces and special chars except alphanumeric
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Should be 16 characters total (4 + 8 + 4 = 16 without hyphens)
  if (cleaned.length !== 16) {
    return '';
  }

  // Extract the three segments: GIFT + 8 chars + 4 chars
  const segment1 = cleaned.substring(0, 4); // Should be "GIFT"
  const segment2 = cleaned.substring(4, 12); // 8 chars
  const segment3 = cleaned.substring(12, 16); // 4 chars

  if (segment1 !== 'GIFT') {
    return '';
  }

  return `${segment1}-${segment2}-${segment3}`;
}

/**
 * Error messages for common redemption failures
 */
export const GiftRedemptionErrors = {
  GIFT_NOT_FOUND: 'Gift code not found. Please check and try again.',
  GIFT_ALREADY_REDEEMED: 'This gift code has already been redeemed.',
  GIFT_EXPIRED: 'This gift code has expired.',
  GIFT_CANCELLED: 'This gift code has been cancelled.',
  INVALID_FORMAT: 'Please enter a valid gift code in format: GIFT-XXXXXXXX-XXXX',
  AUTHENTICATION_REQUIRED: 'Please sign in to redeem a gift code.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;
