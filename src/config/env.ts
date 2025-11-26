/**
 * Environment Variables Configuration & Validation
 *
 * This file:
 * 1. Defines all environment variables with proper typing
 * 2. Validates that required variables are present
 * 3. Provides default values where appropriate
 * 4. Throws errors on startup if critical variables are missing
 */

/**
 * Environment variable configuration
 */
export const ENV = {
  // Firebase Configuration
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',

  // Google Cloud API
  GOOGLE_CLOUD_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || '',

  // Azure Speech Service
  AZURE_SPEECH_KEY: process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '',
  AZURE_SPEECH_REGION: process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION || 'eastus',

  // App Configuration
  TRIAL_DURATION_MINUTES: parseInt(process.env.EXPO_PUBLIC_TRIAL_DURATION_MINUTES || '10', 10),
  LIFETIME_PRICE: parseFloat(process.env.EXPO_PUBLIC_LIFETIME_PRICE || '5'),

  // Payment Configuration (Future - Phase 14)
  REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',

  // Development Settings
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  SKIP_TRIAL: process.env.EXPO_PUBLIC_SKIP_TRIAL === 'true',
} as const;

/**
 * Required environment variables
 * These MUST be present for the app to function
 */
const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY',
] as const;

/**
 * Optional environment variables (for future phases)
 * These can be empty during development
 */
const OPTIONAL_ENV_VARS = [
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'EXPO_PUBLIC_REVENUECAT_API_KEY',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_AZURE_SPEECH_KEY',
  'EXPO_PUBLIC_AZURE_SPEECH_REGION',
] as const;

/**
 * Validates all required environment variables are present
 *
 * @throws Error if any required variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];

    if (!value || value.trim() === '' || value.startsWith('your-')) {
      missing.push(varName);
    }
  }

  // Check optional variables (just warnings)
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName];

    if (!value || value.trim() === '' || value.startsWith('your-')) {
      warnings.push(varName);
    }
  }

  // Validate specific formats
  if (ENV.GOOGLE_CLOUD_API_KEY && !ENV.GOOGLE_CLOUD_API_KEY.startsWith('AIzaSy')) {
    missing.push('EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY (invalid format - should start with AIzaSy)');
  }

  if (ENV.FIREBASE_API_KEY && !ENV.FIREBASE_API_KEY.startsWith('AIzaSy')) {
    missing.push('EXPO_PUBLIC_FIREBASE_API_KEY (invalid format - should start with AIzaSy)');
  }

  // Validate numeric values
  if (isNaN(ENV.TRIAL_DURATION_MINUTES) || ENV.TRIAL_DURATION_MINUTES <= 0) {
    missing.push('EXPO_PUBLIC_TRIAL_DURATION_MINUTES (must be a positive number)');
  }

  if (isNaN(ENV.LIFETIME_PRICE) || ENV.LIFETIME_PRICE <= 0) {
    missing.push('EXPO_PUBLIC_LIFETIME_PRICE (must be a positive number)');
  }

  // Report results
  if (missing.length > 0) {
    const errorMessage = [
      '❌ ENVIRONMENT VALIDATION FAILED',
      '',
      'Missing or invalid required environment variables:',
      ...missing.map(v => `  - ${v}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
      '',
      'Required variables:',
      ...REQUIRED_ENV_VARS.map(v => `  - ${v}`),
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Log warnings for optional variables (development only)
  if (__DEV__ && warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set (safe to ignore for now):');
    warnings.forEach(v => console.warn(`  - ${v}`));
  }

  // Success message (development only)
  if (__DEV__) {
    console.log('✅ Environment validation passed');
    console.log(`   Firebase Project: ${ENV.FIREBASE_PROJECT_ID}`);
    console.log(`   Trial Duration: ${ENV.TRIAL_DURATION_MINUTES} minutes`);
    console.log(`   Lifetime Price: $${ENV.LIFETIME_PRICE}`);
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvInfo() {
  return {
    firebaseProjectId: ENV.FIREBASE_PROJECT_ID,
    trialDurationMinutes: ENV.TRIAL_DURATION_MINUTES,
    lifetimePrice: ENV.LIFETIME_PRICE,
    debugMode: ENV.DEBUG_MODE,
    skipTrial: ENV.SKIP_TRIAL,
    hasGoogleCloudKey: !!ENV.GOOGLE_CLOUD_API_KEY,
    hasAzureSpeechKey: !!ENV.AZURE_SPEECH_KEY,
    azureSpeechRegion: ENV.AZURE_SPEECH_REGION,
    hasRevenueCatKey: !!ENV.REVENUECAT_API_KEY,
    hasStripeKey: !!ENV.STRIPE_PUBLISHABLE_KEY,
  };
}
