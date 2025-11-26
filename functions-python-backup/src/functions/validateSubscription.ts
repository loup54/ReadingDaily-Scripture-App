/**
 * Validate Subscription Cloud Function
 *
 * Triggered: On app launch or periodically
 * Purpose: Verify subscription status with payment provider and update Firestore
 * Returns: Current tier, remaining days, auto-renew status
 *
 * Implementation checklist:
 * - [ ] Query user's latest subscription from Firestore
 * - [ ] Check expiration date
 * - [ ] For active subscriptions, validate with payment provider
 * - [ ] Update subscription status if expired
 * - [ ] Sync with local client state
 * - [ ] Log validation results
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SubscriptionDocument } from '../types/firestore.types';

const db = admin.firestore();

interface ValidationRequest {
  userId: string;
  currentDeviceTime: number;
}

interface ValidationResponse {
  tier: 'free' | 'basic';
  status: 'free' | 'trial' | 'active' | 'cancelled' | 'expired';
  isValid: boolean;
  remainingDays?: number;
  autoRenewEnabled: boolean;
  expiryDate?: number;
  message: string;
}

/**
 * HTTP Callable Function: Validate user's subscription
 *
 * Called from client when:
 * - App launches (to sync server state)
 * - User opens settings (to show current status)
 * - Periodically in background
 */
export const validateSubscription = functions.https.onCall(
  async (data: ValidationRequest, context): Promise<ValidationResponse> => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const currentTime = Date.now();

    try {
      // Query user's subscription
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return {
          tier: 'free',
          status: 'free',
          isValid: true,
          autoRenewEnabled: false,
          message: 'No subscription found, user is on free tier',
        };
      }

      const userData = userDoc.data();
      const subscriptionTier = userData?.subscriptionTier || 'free';

      // Get latest subscription document
      const subscriptionsRef = db.collection('users').doc(userId).collection('subscriptions');
      const querySnapshot = await subscriptionsRef
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return {
          tier: 'free',
          status: 'free',
          isValid: true,
          autoRenewEnabled: false,
          message: 'No subscription document found',
        };
      }

      const subscriptionDoc = querySnapshot.docs[0].data() as SubscriptionDocument;

      // Check if subscription has expired
      if (subscriptionDoc.endDate && subscriptionDoc.endDate < currentTime) {
        // Subscription expired - downgrade to free
        if (subscriptionDoc.status !== 'expired') {
          await subscriptionsRef.doc(querySnapshot.docs[0].id).update({
            status: 'expired',
            updatedAt: currentTime,
          });

          // Update user document
          await userDoc.ref.update({
            subscriptionTier: 'free',
            subscriptionStatus: 'expired',
            updatedAt: currentTime,
          });
        }

        return {
          tier: 'free',
          status: 'expired',
          isValid: false,
          autoRenewEnabled: false,
          expiryDate: subscriptionDoc.endDate,
          message: 'Subscription has expired',
        };
      }

      // TODO: Validate with payment provider for active subscriptions
      // For Apple: Use Apple's App Store Server API
      // For Google: Use Google Play Developer API
      // For Stripe: Query Stripe API for subscription status

      // Calculate remaining days
      const remainingMs = (subscriptionDoc.endDate || 0) - currentTime;
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

      return {
        tier: subscriptionDoc.tier,
        status: subscriptionDoc.status,
        isValid: subscriptionDoc.status === 'active',
        remainingDays: Math.max(0, remainingDays),
        autoRenewEnabled: subscriptionDoc.autoRenewEnabled,
        expiryDate: subscriptionDoc.endDate,
        message: 'Subscription validated successfully',
      };
    } catch (error) {
      console.error('Error validating subscription:', error);
      throw new functions.https.HttpsError('internal', 'Failed to validate subscription');
    }
  }
);

/**
 * Scheduled Function: Daily subscription validation
 *
 * Runs daily to check for expired subscriptions and update status
 */
export const dailySubscriptionValidation = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async (context) => {
    const batch = db.batch();
    const currentTime = Date.now();
    const changes: { expired: number; active: number } = { expired: 0, active: 0 };

    try {
      // Find all expired subscriptions
      const expiredSnapshot = await db
        .collectionGroup('subscriptions')
        .where('status', '==', 'active')
        .where('endDate', '<', currentTime)
        .get();

      // Update expired subscriptions
      expiredSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: currentTime,
        });
        changes.expired++;
      });

      // Find all users with expired subscriptions and downgrade to free
      const userSnapshot = await db
        .collection('users')
        .where('subscriptionStatus', '==', 'active')
        .get();

      for (const userDoc of userSnapshot.docs) {
        const subscriptionsRef = db
          .collection('users')
          .doc(userDoc.id)
          .collection('subscriptions');

        const activeSubSnapshot = await subscriptionsRef
          .where('status', '==', 'active')
          .where('endDate', '<', currentTime)
          .get();

        if (!activeSubSnapshot.empty) {
          batch.update(userDoc.ref, {
            subscriptionTier: 'free',
            subscriptionStatus: 'expired',
            updatedAt: currentTime,
          });
          changes.active++;
        }
      }

      await batch.commit();

      console.log(`Daily validation complete. Expired: ${changes.expired}, Updated users: ${changes.active}`);
      return { success: true, changes };
    } catch (error) {
      console.error('Error in daily validation:', error);
      throw error;
    }
  });
