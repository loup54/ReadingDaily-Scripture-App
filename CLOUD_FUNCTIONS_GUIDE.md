# Firebase Cloud Functions Guide

## Overview
This document describes the Firebase Cloud Functions needed for the Reading Daily Scripture App subscription system.

## Functions to Implement

### 1. cancelSubscription (HTTP Callable Function)

**Location:** `functions/src/subscriptions/cancelSubscription.ts`

**Purpose:** Cancel an active subscription and stop auto-renewal with payment providers (Stripe, Apple IAP, Google Play)

**Implementation:**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface CancellationRequest {
  userId: string;
  subscriptionId: string;
  reason?: 'user_requested' | 'payment_failed' | 'refund' | 'admin_action' | 'other';
  feedback?: string;
  idToken: string;
}

interface CancellationResponse {
  success: boolean;
  message: string;
  cancellationDate?: number;
  refundStatus?: 'pending' | 'approved' | 'denied';
  refundAmount?: number;
  error?: string;
}

export const cancelSubscription = functions.https.onCall<
  CancellationRequest,
  CancellationResponse
>(async (data, context) => {
  try {
    // 1. Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = data.userId;
    if (userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot cancel other users\' subscriptions');
    }

    // 2. Get user's subscription from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    const subscriptionStatus = userData?.subscriptionStatus;

    if (subscriptionStatus !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', 'Subscription is not active');
    }

    // 3. Cancel with Stripe (if applicable)
    let stripeSubscriptionId: string | null = null;
    if (stripeCustomerId) {
      try {
        // Get active subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          stripeSubscriptionId = subscriptions.data[0].id;

          // Cancel the subscription at period end
          await stripe.subscriptions.update(stripeSubscriptionId, {
            cancel_at_period_end: true,
          });

          console.log(`[cancelSubscription] Cancelled Stripe subscription: ${stripeSubscriptionId}`);
        }
      } catch (stripeError) {
        console.error('[cancelSubscription] Stripe cancellation error:', stripeError);
        // Continue - we'll still update local state
      }
    }

    // 4. Handle Apple IAP cancellation (via App Store Connect API)
    // Note: Apple IAP cancellations must typically be done through App Store Connect
    // The user can cancel directly in their subscription settings

    // 5. Handle Google Play cancellation (via Google Play Billing Library)
    // Note: Google Play cancellations are typically handled through Google Play Console
    // or the app can request cancellation through their API

    // 6. Update Firestore subscription status
    const cancellationDate = admin.firestore.Timestamp.now();
    await admin.firestore().collection('users').doc(userId).update({
      subscriptionStatus: 'cancelled',
      subscriptionCancelledAt: cancellationDate,
      subscriptionCancelReason: data.reason || 'unknown',
      autoRenewEnabled: false,
      subscriptionFeedback: data.feedback || null,
    });

    // 7. Create cancellation record for analytics
    await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('subscriptions')
      .add({
        event: 'cancelled',
        timestamp: cancellationDate,
        reason: data.reason || 'unknown',
        feedback: data.feedback || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
      });

    // 8. Send cancellation email (optional)
    const userEmail = userData?.email;
    if (userEmail) {
      // Send transactional email via SendGrid or Firebase email extension
      console.log(`[cancelSubscription] Sending cancellation email to ${userEmail}`);
    }

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      cancellationDate: cancellationDate.toMillis(),
      refundStatus: 'pending',
    };
  } catch (error) {
    console.error('[cancelSubscription] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const httpError = error instanceof functions.https.HttpsError ? error : null;

    return {
      success: false,
      message: httpError?.message || 'Failed to cancel subscription',
      error: errorMessage,
    };
  }
});
```

### 2. getCancellationStatus (HTTP Callable Function)

**Purpose:** Check if a subscription has been cancelled and when

```typescript
export const getCancellationStatus = functions.https.onCall<
  { subscriptionId: string; idToken: string },
  { isCancelled: boolean; cancellationDate?: number; cancellationReason?: string }
>(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const isCancelled = userData?.subscriptionStatus === 'cancelled';

    return {
      isCancelled,
      cancellationDate: userData?.subscriptionCancelledAt?.toMillis(),
      cancellationReason: userData?.subscriptionCancelReason,
    };
  } catch (error) {
    console.error('[getCancellationStatus] Error:', error);
    throw error;
  }
});
```

### 3. requestRefund (HTTP Callable Function)

**Purpose:** Request a refund for a cancelled subscription

```typescript
export const requestRefund = functions.https.onCall<
  { subscriptionId: string; reason: string; idToken: string },
  { refundId: string; status: 'pending' | 'approved' | 'denied'; amount: number }
>(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    // Create refund request document
    const refundDoc = await admin
      .firestore()
      .collection('refunds')
      .add({
        userId,
        reason: data.reason,
        status: 'pending',
        requestedAt: admin.firestore.Timestamp.now(),
        processedAt: null,
        amount: userData?.lastSubscriptionAmount || 0,
      });

    // If Stripe customer, process refund automatically
    if (stripeCustomerId && userData?.lastChargeId) {
      try {
        const refund = await stripe.refunds.create({
          charge: userData.lastChargeId,
          metadata: {
            refundDocId: refundDoc.id,
            userId,
            reason: data.reason,
          },
        });

        await refundDoc.update({
          status: 'approved',
          stripeRefundId: refund.id,
          processedAt: admin.firestore.Timestamp.now(),
        });

        console.log(`[requestRefund] Refund processed: ${refund.id}`);
      } catch (refundError) {
        console.error('[requestRefund] Stripe refund error:', refundError);
        // Mark as pending for manual review
      }
    }

    return {
      refundId: refundDoc.id,
      status: 'pending',
      amount: userData?.lastSubscriptionAmount || 0,
    };
  } catch (error) {
    console.error('[requestRefund] Error:', error);
    throw error;
  }
});
```

## Firestore Schema

### Users Collection
```typescript
{
  userId: string;
  email: string;
  stripeCustomerId: string; // Stripe customer ID
  subscriptionStatus: 'free' | 'active' | 'cancelled' | 'past_due';
  subscriptionTier: 'free' | 'basic' | 'premium';
  subscriptionCancelledAt: Timestamp;
  subscriptionCancelReason: string;
  autoRenewEnabled: boolean;
  lastSubscriptionAmount: number;
  lastChargeId: string; // For refunds
  subscriptionFeedback?: string;
}
```

### Refunds Collection
```typescript
{
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Timestamp;
  processedAt: Timestamp;
  amount: number;
  stripeRefundId?: string;
}
```

## Environment Variables

Add these to your Firebase Cloud Functions `.env.local` or `.env` file:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG.xxx...
APPLE_SHARED_SECRET=xxx...
```

## Deployment

```bash
# Install dependencies
cd functions
npm install

# Deploy to Firebase
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:cancelSubscription
```

## Testing

```bash
# Test locally
firebase emulators:start

# Call function from client
import { httpsCallable } from 'firebase/functions';
const cancelSubscription = httpsCallable(functions, 'cancelSubscription');

const result = await cancelSubscription({
  userId: 'user-id',
  subscriptionId: 'sub-id',
  reason: 'user_requested',
});
```

## Error Handling

- **unauthenticated**: User not logged in
- **permission-denied**: User trying to modify another user's subscription
- **not-found**: User or subscription not found
- **failed-precondition**: Subscription not in correct state for cancellation

## Security Rules

Add these Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own subscription data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;

      match /subscriptions/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Only admins can read refunds
    match /refunds/{document=**} {
      allow read: if hasRole(request.auth.uid, 'admin');
      allow write: if false;
    }
  }

  function hasRole(uid, role) {
    return get(/databases/$(database)/documents/users/$(uid)).data.roles[role] == true;
  }
}
```

## Next Steps

1. Create `functions` folder at project root
2. Implement the functions above
3. Deploy to Firebase
4. Update `SubscriptionCancellationService.ts` with actual function calls
5. Test cancellation flow end-to-end
