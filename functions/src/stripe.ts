/**
 * Stripe Payment Functions
 * Phase 13.3: Backend Receipt Validation
 *
 * Cloud Functions for Stripe checkout session creation and validation
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
const getStripe = () => {
  const secretKey = functions.config().stripe?.secret_key;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
};

/**
 * Create Stripe Checkout Session
 * Called by client when user initiates purchase
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  const { productId, successUrl, cancelUrl } = data;

  // Validate input
  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID is required');
  }

  // Optional: Authenticate user
  const userId = context.auth?.uid || 'anonymous';

  try {
    const stripe = getStripe();

    // Product configuration
    const productConfig: { [key: string]: { name: string; price: number } } = {
      lifetime_access_001: {
        name: 'Lifetime Access',
        price: 499, // $4.99 in cents
      },
    };

    const product = productConfig[productId];
    if (!product) {
      throw new functions.https.HttpsError('not-found', 'Product not found');
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: 'Unlock all features forever',
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || 'https://yourapp.com/success',
      cancel_url: cancelUrl || 'https://yourapp.com/cancel',
      client_reference_id: userId,
      metadata: {
        productId,
        userId,
        platform: 'web',
      },
    });

    functions.logger.info('Checkout session created', {
      sessionId: session.id,
      userId,
      productId,
    });

    return {
      sessionId: session.id,
      url: session.url,
      expiresAt: session.expires_at,
    };
  } catch (error: any) {
    functions.logger.error('Checkout session creation failed', {
      error: error.message,
      productId,
      userId,
    });
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});

/**
 * Validate Stripe Checkout Session
 * Called by client after payment completion
 */
export const validateSession = functions.https.onCall(async (data, context) => {
  const { sessionId } = data;

  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Session ID is required');
  }

  try {
    const stripe = getStripe();

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check payment status
    if (session.payment_status !== 'paid') {
      return {
        valid: false,
        error: 'Payment not completed',
      };
    }

    const userId = session.client_reference_id || context.auth?.uid || 'anonymous';
    const productId = session.metadata?.productId;

    // Store purchase record in Firestore
    const purchaseRecord = {
      userId,
      productId,
      provider: 'stripe',
      transactionId: session.payment_intent as string,
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
      purchaseDate: admin.firestore.Timestamp.now(),
      validated: true,
      platform: session.metadata?.platform || 'web',
    };

    await admin.firestore().collection('purchases').add(purchaseRecord);

    functions.logger.info('Purchase validated and recorded', {
      sessionId,
      userId,
      productId,
      transactionId: session.payment_intent,
    });

    return {
      valid: true,
      purchase: purchaseRecord,
    };
  } catch (error: any) {
    functions.logger.error('Session validation failed', {
      error: error.message,
      sessionId,
    });
    throw new functions.https.HttpsError('internal', 'Failed to validate session');
  }
});

/**
 * Stripe Webhook Handler
 * Handles asynchronous payment events from Stripe
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe?.webhook_secret;

  if (!webhookSecret) {
    functions.logger.error('Webhook secret not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  try {
    const stripe = getStripe();

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        // Store purchase record
        const purchaseRecord = {
          userId: session.client_reference_id || 'anonymous',
          productId: session.metadata?.productId,
          provider: 'stripe',
          transactionId: session.payment_intent as string,
          sessionId: session.id,
          amount: session.amount_total,
          currency: session.currency,
          purchaseDate: admin.firestore.Timestamp.now(),
          validated: true,
          platform: session.metadata?.platform || 'web',
        };

        await admin.firestore().collection('purchases').add(purchaseRecord);

        functions.logger.info('Checkout session completed', {
          sessionId: session.id,
          userId: session.client_reference_id,
        });
        break;

      case 'payment_intent.succeeded':
        functions.logger.info('Payment succeeded', {
          paymentIntentId: event.data.object.id,
        });
        break;

      case 'payment_intent.payment_failed':
        functions.logger.warn('Payment failed', {
          paymentIntentId: event.data.object.id,
        });
        break;

      default:
        functions.logger.info('Unhandled event type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error: any) {
    functions.logger.error('Webhook error', { error: error.message });
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
