/**
 * Subscription Gifting Cloud Functions
 *
 * Handles creation and redemption of gift codes for subscriptions
 * - sendGift: Creates a gift code for a subscription
 * - redeemGiftCode: Redeems a gift code and applies subscription
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Interface for sendGift request
 */
interface SendGiftRequest {
  recipientEmail: string;
  subscriptionTier: 'premium' | 'pro';
  expiresInDays: number;
  message?: string;
}

/**
 * Interface for sendGift response
 */
interface SendGiftResponse {
  success: boolean;
  giftCode: string;
  recipientEmail: string;
  expiresAt: number;
  message: string;
}

/**
 * Interface for redeemGiftCode request
 */
interface RedeemGiftRequest {
  giftCode: string;
}

/**
 * Interface for redeemGiftCode response
 */
interface RedeemGiftResponse {
  success: boolean;
  subscriptionTier: string;
  subscriptionEndsAt: number;
  message: string;
}

/**
 * Generate a unique gift code in format: GIFT-{8 ALPHANUMERIC}-{4 ALPHANUMERIC}
 * Example: GIFT-ABC12345-XY9Z
 */
function generateGiftCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code1 = '';
  let code2 = '';

  for (let i = 0; i < 8; i++) {
    code1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 4; i++) {
    code2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `GIFT-${code1}-${code2}`;
}

/**
 * HTTP Callable Function: Send a subscription gift code
 *
 * Creates a gift code and stores it in Firestore. The code can be shared with
 * another user who can redeem it to get a subscription.
 *
 * Authentication: Required (user must be authenticated)
 * Request: { recipientEmail, subscriptionTier, expiresInDays, message? }
 * Response: { success, giftCode, recipientEmail, expiresAt, message }
 */
export const sendGift = functions.https.onCall(
  async (data: SendGiftRequest, context): Promise<SendGiftResponse> => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const senderId = context.auth.uid;
    const currentTime = Date.now();
    const expiresAt = currentTime + data.expiresInDays * 24 * 60 * 60 * 1000;

    try {
      // Validate input
      if (!data.recipientEmail || !data.subscriptionTier || !data.expiresInDays) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required fields: recipientEmail, subscriptionTier, expiresInDays'
        );
      }

      if (data.expiresInDays < 1 || data.expiresInDays > 365) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'expiresInDays must be between 1 and 365'
        );
      }

      if (!['premium', 'pro'].includes(data.subscriptionTier)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'subscriptionTier must be either "premium" or "pro"'
        );
      }

      // Generate unique gift code
      let giftCode = generateGiftCode();
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure unique gift code
      while (codeExists && attempts < maxAttempts) {
        const existingCode = await db.collection('giftCodes').doc(giftCode).get();
        codeExists = existingCode.exists;
        if (codeExists) {
          giftCode = generateGiftCode();
        }
        attempts++;
      }

      if (codeExists) {
        throw new functions.https.HttpsError(
          'internal',
          'Failed to generate unique gift code after multiple attempts'
        );
      }

      // Create gift code document
      const giftCodeDoc = {
        giftCode,
        senderId,
        recipientEmail: data.recipientEmail.toLowerCase(),
        subscriptionTier: data.subscriptionTier,
        status: 'active', // active | redeemed | expired
        message: data.message || '',
        createdAt: currentTime,
        expiresAt,
        redeemedAt: null,
        redeemedBy: null,
      };

      // Store in Firestore
      await db.collection('giftCodes').doc(giftCode).set(giftCodeDoc);

      // Log analytics event
      console.log(
        `Gift code created: ${giftCode} from ${senderId} ` +
          `to ${data.recipientEmail} for ${data.subscriptionTier} tier`
      );

      return {
        success: true,
        giftCode,
        recipientEmail: data.recipientEmail,
        expiresAt,
        message: `Gift code created successfully. It expires in ${data.expiresInDays} days.`,
      };
    } catch (error) {
      console.error('Error creating gift code:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Failed to create gift code');
    }
  }
);

/**
 * HTTP Callable Function: Redeem a subscription gift code
 *
 * Takes a gift code and applies the subscription to the current user's account.
 * Updates the user's subscription tier and end date.
 *
 * Authentication: Required (user must be authenticated)
 * Request: { giftCode }
 * Response: { success, subscriptionTier, subscriptionEndsAt, message }
 */
export const redeemGiftCode = functions.https.onCall(
  async (data: RedeemGiftRequest, context): Promise<RedeemGiftResponse> => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const currentTime = Date.now();

    try {
      // Validate input
      if (!data.giftCode) {
        throw new functions.https.HttpsError('invalid-argument', 'giftCode is required');
      }

      const normalizedCode = data.giftCode.toUpperCase().trim();

      // Get gift code document
      const giftCodeSnap = await db.collection('giftCodes').doc(normalizedCode).get();

      if (!giftCodeSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Gift code not found');
      }

      const giftCodeData = giftCodeSnap.data();

      if (!giftCodeData) {
        throw new functions.https.HttpsError('internal', 'Invalid gift code data');
      }

      // Check if already redeemed
      if (giftCodeData.status === 'redeemed') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'This gift code has already been redeemed'
        );
      }

      // Check if expired
      if (currentTime > giftCodeData.expiresAt) {
        // Mark as expired
        await db.collection('giftCodes').doc(normalizedCode).update({
          status: 'expired',
        });
        throw new functions.https.HttpsError(
          'failed-precondition',
          'This gift code has expired'
        );
      }

      // Subscription duration: 1 year
      const subscriptionEndsAt = currentTime + 365 * 24 * 60 * 60 * 1000;

      // Create batch transaction
      const batch = db.batch();

      // Update gift code status
      batch.update(db.collection('giftCodes').doc(normalizedCode), {
        status: 'redeemed',
        redeemedAt: currentTime,
        redeemedBy: userId,
      });

      // Update user subscription
      batch.update(db.collection('users').doc(userId), {
        subscriptionTier: giftCodeData.subscriptionTier,
        subscriptionEndsAt,
        subscriptionSource: 'gift',
        lastUpdatedAt: currentTime,
      });

      // Create redemption record for audit trail
      batch.set(
        db
          .collection('redemptions')
          .doc(`${normalizedCode}-${userId}`),
        {
          giftCode: normalizedCode,
          redeemedBy: userId,
          redeemedAt: currentTime,
          subscriptionTier: giftCodeData.subscriptionTier,
          subscriptionEndsAt,
          senderEmail: giftCodeData.senderId,
          senderMessage: giftCodeData.message,
        }
      );

      // Update user's gift history
      batch.set(
        db
          .collection('users')
          .doc(userId)
          .collection('giftHistory')
          .doc(`${normalizedCode}-${currentTime}`),
        {
          giftCode: normalizedCode,
          type: 'received',
          subscriptionTier: giftCodeData.subscriptionTier,
          subscriptionEndsAt,
          redeemedAt: currentTime,
        }
      );

      // Commit transaction
      await batch.commit();

      // Log analytics event
      console.log(
        `Gift code redeemed: ${normalizedCode} by ${userId} ` +
          `for ${giftCodeData.subscriptionTier} tier`
      );

      return {
        success: true,
        subscriptionTier: giftCodeData.subscriptionTier,
        subscriptionEndsAt,
        message: `Subscription activated! You now have ${giftCodeData.subscriptionTier} tier access for 1 year.`,
      };
    } catch (error) {
      console.error('Error redeeming gift code:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Failed to redeem gift code');
    }
  }
);
