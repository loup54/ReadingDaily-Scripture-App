/**
 * Handle Payment Webhook Cloud Function
 *
 * Triggered: By payment providers via webhook
 * Purpose: Process payment events and update subscription status
 * Events:
 * - Stripe: payment_intent.succeeded, customer.subscription.updated, customer.subscription.deleted
 * - Apple: purchase, subscription_renew, subscription_cancel
 * - Google: SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELED
 *
 * Implementation checklist:
 * - [ ] Verify webhook signature (security critical!)
 * - [ ] Parse provider-specific event format
 * - [ ] Update subscription document
 * - [ ] Update user tier/status
 * - [ ] Send notification to user
 * - [ ] Log transaction
 * - [ ] Handle errors gracefully
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * HTTP Function: Stripe webhook handler
 *
 * POST /webhooks/stripe
 * Signature verification required via Stripe secret
 */
export const handleStripeWebhook = functions.https.onRequest(
  async (req, res) => {
    // TODO: Implement Stripe webhook handling
    // 1. Verify webhook signature using stripe.webhooks.constructEvent()
    // 2. Handle these event types:
    //    - payment_intent.succeeded → Create transaction, activate subscription
    //    - customer.subscription.updated → Update subscription dates
    //    - customer.subscription.deleted → Cancel subscription
    // 3. Update Firestore documents
    // 4. Send push notification to user
    // 5. Return 200 OK to acknowledge receipt

    res.status(200).send('Webhook processing would occur here');
  }
);

/**
 * HTTP Function: Apple App Store webhook handler
 *
 * POST /webhooks/apple
 * Must verify JWT signature from Apple
 */
export const handleAppleWebhook = functions.https.onRequest(
  async (req, res) => {
    // TODO: Implement Apple webhook handling
    // 1. Verify JWT signature from Apple
    // 2. Decode JWT to get event data
    // 3. Handle these event types:
    //    - SUBSCRIPTION_INITIAL_BUY → Create new subscription
    //    - SUBSCRIPTION_RENEW → Renew subscription, update endDate
    //    - SUBSCRIPTION_EXPIRED → Set status to expired
    //    - SUBSCRIPTION_REVOKED → Cancel subscription
    // 4. Update Firestore documents
    // 5. Send push notification to user
    // 6. Return 200 OK

    res.status(200).send('Webhook processing would occur here');
  }
);

/**
 * HTTP Function: Google Play webhook handler
 *
 * POST /webhooks/google
 * Must verify signed message
 */
export const handleGoogleWebhook = functions.https.onRequest(
  async (req, res) => {
    // TODO: Implement Google Play webhook handling
    // 1. Verify signed message using Google public key
    // 2. Decode message to get subscription event
    // 3. Handle these event types:
    //    - SUBSCRIPTION_PURCHASED → Create new subscription
    //    - SUBSCRIPTION_RENEWED → Renew subscription
    //    - SUBSCRIPTION_EXPIRED → Set status to expired
    //    - SUBSCRIPTION_CANCELED → Cancel subscription
    // 4. Update Firestore documents
    // 5. Send push notification to user
    // 6. Return 200 OK

    res.status(200).send('Webhook processing would occur here');
  }
);

/**
 * Common webhook handler logic
 *
 * Used by all webhook handlers to process subscription events
 */
async function processSubscriptionEvent(
  userId: string,
  event: {
    type:
      | 'subscription_activated'
      | 'subscription_renewed'
      | 'subscription_cancelled'
      | 'subscription_expired';
    provider: 'stripe' | 'apple' | 'google';
    subscriptionId: string;
    productId: string;
    transactionId: string;
    amountCents?: number;
    currency?: string;
    nextBillingDate?: number;
    receipt?: string;
  }
): Promise<void> {
  const batch = db.batch();
  const currentTime = Date.now();

  try {
    const userRef = db.collection('users').doc(userId);
    const subscriptionsRef = userRef.collection('subscriptions');
    const transactionsRef = userRef.collection('transactions');

    // Find subscription document for this provider
    const subscriptionSnapshot = await subscriptionsRef
      .where('provider', '==', event.provider)
      .where('providerId', '==', event.subscriptionId)
      .limit(1)
      .get();

    if (subscriptionSnapshot.empty) {
      console.warn(`No subscription found for user ${userId}, provider ${event.provider}`);
      return;
    }

    const subscriptionRef = subscriptionSnapshot.docs[0].ref;
    const subscriptionId = subscriptionSnapshot.docs[0].id;

    // Handle different event types
    switch (event.type) {
      case 'subscription_activated':
        // New subscription purchased
        batch.update(subscriptionRef, {
          status: 'active',
          startDate: currentTime,
          endDate: event.nextBillingDate || currentTime + 30 * 24 * 60 * 60 * 1000,
          autoRenewEnabled: true,
          latestTransactionId: event.transactionId,
          updatedAt: currentTime,
        });

        batch.update(userRef, {
          subscriptionTier: 'basic',
          subscriptionStatus: 'active',
          updatedAt: currentTime,
        });

        // Record transaction
        const activationTxnRef = transactionsRef.doc();
        batch.set(activationTxnRef, {
          transactionId: activationTxnRef.id,
          type: 'purchase',
          status: 'completed',
          amountCents: event.amountCents || 299,
          currency: event.currency || 'USD',
          productId: event.productId,
          provider: event.provider,
          providerTransactionId: event.transactionId,
          receipt: event.receipt,
          purchaseDate: currentTime,
          expiryDate: event.nextBillingDate,
          completedAt: currentTime,
          isTest: false,
          createdAt: currentTime,
          updatedAt: currentTime,
        });
        break;

      case 'subscription_renewed':
        // Subscription auto-renewed
        batch.update(subscriptionRef, {
          status: 'active',
          endDate: event.nextBillingDate,
          latestTransactionId: event.transactionId,
          updatedAt: currentTime,
        });

        // Record transaction
        const renewalTxnRef = transactionsRef.doc();
        batch.set(renewalTxnRef, {
          transactionId: renewalTxnRef.id,
          type: 'renewal',
          status: 'completed',
          amountCents: event.amountCents || 299,
          currency: event.currency || 'USD',
          productId: event.productId,
          provider: event.provider,
          providerTransactionId: event.transactionId,
          purchaseDate: currentTime,
          expiryDate: event.nextBillingDate,
          completedAt: currentTime,
          isTest: false,
          createdAt: currentTime,
          updatedAt: currentTime,
        });
        break;

      case 'subscription_cancelled':
        // User cancelled subscription
        batch.update(subscriptionRef, {
          status: 'cancelled',
          autoRenewEnabled: false,
          cancellationDate: currentTime,
          updatedAt: currentTime,
        });

        batch.update(userRef, {
          subscriptionTier: 'free',
          subscriptionStatus: 'cancelled',
          updatedAt: currentTime,
        });
        break;

      case 'subscription_expired':
        // Subscription naturally expired
        batch.update(subscriptionRef, {
          status: 'expired',
          updatedAt: currentTime,
        });

        batch.update(userRef, {
          subscriptionTier: 'free',
          subscriptionStatus: 'expired',
          updatedAt: currentTime,
        });
        break;
    }

    await batch.commit();

    console.log(
      `Processed ${event.type} for user ${userId}, subscription ${subscriptionId}`
    );

    // TODO: Send push notification to user
    // await sendNotificationToUser(userId, event.type);
  } catch (error) {
    console.error(`Error processing subscription event: ${error}`);
    throw error;
  }
}

export { processSubscriptionEvent };
