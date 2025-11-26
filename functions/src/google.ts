/**
 * Google Play Billing Validation Functions
 * Phase 13.3: Backend Receipt Validation
 *
 * Cloud Functions for validating Google Play purchase tokens
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

/**
 * Validate Google Play Purchase Token
 * Called by client after completing purchase
 */
export const validateGooglePurchase = functions.https.onCall(async (data, context) => {
  const { packageName, productId, purchaseToken } = data;

  if (!packageName || !productId || !purchaseToken) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Package name, product ID, and purchase token are required'
    );
  }

  const userId = context.auth?.uid || 'anonymous';

  try {
    // Load service account from file
    const serviceAccountPath = './secrets/google-play-service-account.json';

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const authClient = await auth.getClient();
    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: authClient as any,
    });

    // Validate purchase with Google Play API
    const response = await androidPublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    const purchase = response.data;

    // Check purchase state
    // 0 = Purchased, 1 = Canceled, 2 = Pending
    if (purchase.purchaseState !== 0) {
      const stateMessages: { [key: number]: string } = {
        1: 'Purchase was canceled or refunded',
        2: 'Purchase is pending',
      };

      const message = stateMessages[purchase.purchaseState as number] || 'Invalid purchase state';

      functions.logger.warn('Invalid Google purchase state', {
        purchaseState: purchase.purchaseState,
        orderId: purchase.orderId,
        userId,
      });

      return {
        valid: false,
        error: message,
      };
    }

    // Check acknowledgement state
    // 0 = Not acknowledged, 1 = Acknowledged
    const ackState = (purchase as any).acknowledgementState;
    if (ackState === 0) {
      functions.logger.info('Purchase not yet acknowledged', {
        orderId: purchase.orderId,
        userId,
      });
    }

    // Check for duplicate transaction
    const existingPurchase = await admin
      .firestore()
      .collection('purchases')
      .where('orderId', '==', purchase.orderId)
      .limit(1)
      .get();

    if (!existingPurchase.empty) {
      functions.logger.warn('Duplicate transaction detected', {
        orderId: purchase.orderId,
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
      productId,
      provider: 'google',
      orderId: purchase.orderId,
      purchaseToken,
      packageName,
      purchaseDate: admin.firestore.Timestamp.fromMillis(
        parseInt(purchase.purchaseTimeMillis as string)
      ),
      purchaseState: purchase.purchaseState,
      acknowledgementState: (purchase as any).acknowledgementState,
      consumptionState: purchase.consumptionState,
      developerPayload: purchase.developerPayload,
      quantity: (purchase as any).quantity || 1,
      validated: true,
      validatedAt: admin.firestore.Timestamp.now(),
      obfuscatedExternalAccountId: (purchase as any).obfuscatedExternalAccountId,
      obfuscatedExternalProfileId: (purchase as any).obfuscatedExternalProfileId,
    };

    const docRef = await admin.firestore().collection('purchases').add(purchaseRecord);

    functions.logger.info('Google purchase validated and recorded', {
      userId,
      productId,
      orderId: purchase.orderId,
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
    functions.logger.error('Google purchase validation error', {
      error: error.message,
      stack: error.stack,
      userId,
      productId,
    });

    // Check for specific Google API errors
    if (error.code === 401) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Google API authentication failed'
      );
    } else if (error.code === 404) {
      return {
        valid: false,
        error: 'Purchase not found in Google Play',
      };
    }

    throw new functions.https.HttpsError('internal', 'Failed to validate purchase');
  }
});

/**
 * Restore Google Play Purchases
 * Query existing purchases for a user
 */
export const restoreGooglePurchases = functions.https.onCall(async (data, context) => {
  const userId = context.auth?.uid;

  if (!userId) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Query all purchases for this user from Google provider
    const purchasesSnapshot = await admin
      .firestore()
      .collection('purchases')
      .where('userId', '==', userId)
      .where('provider', '==', 'google')
      .where('validated', '==', true)
      .where('purchaseState', '==', 0) // Only purchased items
      .orderBy('purchaseDate', 'desc')
      .get();

    const purchases = purchasesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    functions.logger.info('Google purchases restored', {
      userId,
      count: purchases.length,
    });

    return {
      success: true,
      purchases,
    };
  } catch (error: any) {
    functions.logger.error('Google purchase restoration failed', {
      error: error.message,
      userId,
    });
    throw new functions.https.HttpsError('internal', 'Failed to restore purchases');
  }
});

/**
 * Acknowledge Google Play Purchase
 * Called separately if acknowledgement is needed
 */
export const acknowledgeGooglePurchase = functions.https.onCall(async (data, context) => {
  const { packageName, productId, purchaseToken } = data;

  if (!packageName || !productId || !purchaseToken) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Package name, product ID, and purchase token are required'
    );
  }

  try {
    // Load service account from file
    const serviceAccountPath = './secrets/google-play-service-account.json';

    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    const authClient = await auth.getClient();
    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: authClient as any,
    });

    // Acknowledge the purchase
    await androidPublisher.purchases.products.acknowledge({
      packageName,
      productId,
      token: purchaseToken,
    });

    functions.logger.info('Google purchase acknowledged', {
      productId,
      packageName,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    functions.logger.error('Google purchase acknowledgement failed', {
      error: error.message,
      productId,
    });
    throw new functions.https.HttpsError('internal', 'Failed to acknowledge purchase');
  }
});
