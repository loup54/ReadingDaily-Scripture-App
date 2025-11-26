/**
 * Firebase Cloud Functions Entry Point
 *
 * Exports all Cloud Functions across all phases:
 * - Payment validation (Stripe, Apple, Google)
 * - Progress tracking (streaks, badges)
 * - Word-level highlighting (TTS synthesis, audio timing)
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import and export Stripe functions
export {
  createCheckoutSession,
  validateSession,
  stripeWebhook,
} from './stripe';

// Import and export Apple IAP functions
export {
  validateAppleReceipt,
  restoreApplePurchases,
} from './apple';

// Import and export Google Play functions
export {
  validateGooglePurchase,
  restoreGooglePurchases,
  acknowledgeGooglePurchase,
} from './google';

// Import and export Progress Tracking functions
// Phase E: Progress tracking with streaks and badges
export {
  onReadingRecorded,
} from './progress';

// Import and export Word-Level Highlighting functions
// Phase II Week 7: Firebase Cloud Functions Integration
export {
  synthesizeReading,
  highlightingHealthCheck,
} from './highlighting';

// Import and export Scheduled Tasks for highlighting
export {
  scheduledDailySynthesis,
  scheduledWeeklyCatchup,
  estimateMonthlyCosts,
  populateHistoricalTimingData,
} from './scheduledTasks';
