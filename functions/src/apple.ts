/**
 * Apple In-App Purchase Validation Functions
 * Phase 13.3: Backend Receipt Validation
 *
 * Cloud Functions for validating Apple IAP receipts
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

// Apple receipt validation endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

interface AppleReceiptResponse {
  status: number;
  receipt?: any;
  latest_receipt_info?: any[];
  pending_renewal_info?: any[];
}

/**
 * Validate Apple IAP Receipt
 * Called by client after completing purchase
 */
export const validateAppleReceipt = functions.https.onCall(async (data, context) => {
  const { receipt, productId } = data;

  if (!receipt) {
    throw new functions.https.HttpsError('invalid-argument', 'Receipt is required');
  }

  const userId = context.auth?.uid || 'anonymous';

  try {
    // Get shared secret from config
    const sharedSecret = functions.config().apple?.shared_secret;
    if (!sharedSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Apple shared secret not configured'
      );
    }

    // Try production first
    let response: AppleReceiptResponse & { wasSandbox?: boolean } = await validateWithApple(receipt, sharedSecret, APPLE_PRODUCTION_URL);

    // If status is 21007, receipt is from sandbox - try sandbox endpoint
    if (response.status === 21007) {
      functions.logger.info('Receipt is from sandbox, trying sandbox endpoint');
      response = await validateWithApple(receipt, sharedSecret, APPLE_SANDBOX_URL);
      response.wasSandbox = true;
    }

    // Check validation status
    if (response.status !== 0) {
      const errorMessages: { [key: number]: string } = {
        21000: 'App Store could not read receipt',
        21002: 'Receipt data is malformed',
        21003: 'Receipt could not be authenticated',
        21004: 'Shared secret does not match',
        21005: 'Receipt server is unavailable',
        21006: 'Receipt is valid but subscription has expired',
        21008: 'Receipt is from wrong environment',
        21010: 'Receipt could not be authorized',
      };

      const errorMessage = errorMessages[response.status] || 'Receipt validation failed';

      functions.logger.error('Apple receipt validation failed', {
        status: response.status,
        error: errorMessage,
        userId,
      });

      return {
        valid: false,
        error: errorMessage,
        status: response.status,
      };
    }

    // Extract purchase information
    const receiptInfo = response.receipt || {};
    const inApp = receiptInfo.in_app || [];

    // Find the specific product purchase
    const purchase = inApp.find((item: any) => item.product_id === productId);

    if (!purchase) {
      return {
        valid: false,
        error: 'Product not found in receipt',
      };
    }

    // Check for duplicate transaction
    const existingPurchase = await admin
      .firestore()
      .collection('purchases')
      .where('transactionId', '==', purchase.transaction_id)
      .limit(1)
      .get();

    if (!existingPurchase.empty) {
      functions.logger.warn('Duplicate transaction detected', {
        transactionId: purchase.transaction_id,
        userId,
      });
      return {
        valid: true,
        duplicate: true,
        purchase: existingPurchase.docs[0].data(),
      };
    }

    // Store purchase record in Firestore
    const purchaseRecord = {
      userId,
      productId: purchase.product_id,
      provider: 'apple',
      transactionId: purchase.transaction_id,
      originalTransactionId: purchase.original_transaction_id,
      purchaseDate: admin.firestore.Timestamp.fromMillis(
        parseInt(purchase.purchase_date_ms)
      ),
      quantity: purchase.quantity || 1,
      validated: true,
      validatedAt: admin.firestore.Timestamp.now(),
      environment: (response as any).wasSandbox ? 'sandbox' : 'production',
      receipt: receipt.substring(0, 100), // Store truncated receipt for reference
    };

    const docRef = await admin.firestore().collection('purchases').add(purchaseRecord);

    functions.logger.info('Apple receipt validated and recorded', {
      userId,
      productId: purchase.product_id,
      transactionId: purchase.transaction_id,
      docId: docRef.id,
    });

    return {
      valid: true,
      purchase: {
        ...purchaseRecord,
        id: docRef.id,
      },
    };
  } catch (error: any) {
    functions.logger.error('Apple receipt validation error', {
      error: error.message,
      userId,
      productId,
    });
    throw new functions.https.HttpsError('internal', 'Failed to validate receipt');
  }
});

/**
 * Helper function to validate receipt with Apple
 */
async function validateWithApple(
  receipt: string,
  sharedSecret: string,
  url: string
): Promise<AppleReceiptResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receipt,
      password: sharedSecret,
      'exclude-old-transactions': true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apple API returned ${response.status}`);
  }

  return (await response.json()) as AppleReceiptResponse;
}

/**
 * Restore Apple IAP Purchases
 * Query existing purchases for a user
 */
export const restoreApplePurchases = functions.https.onCall(async (data, context) => {
  const userId = context.auth?.uid;

  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Query all purchases for this user from Apple provider
    const purchasesSnapshot = await admin
      .firestore()
      .collection('purchases')
      .where('userId', '==', userId)
      .where('provider', '==', 'apple')
      .where('validated', '==', true)
      .orderBy('purchaseDate', 'desc')
      .get();

    const purchases = purchasesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    functions.logger.info('Apple purchases restored', {
      userId,
      count: purchases.length,
    });

    return {
      success: true,
      purchases,
    };
  } catch (error: any) {
    functions.logger.error('Apple purchase restoration failed', {
      error: error.message,
      userId,
    });
    throw new functions.https.HttpsError('internal', 'Failed to restore purchases');
  }
});
