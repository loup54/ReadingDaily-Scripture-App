/**
 * Firebase Configuration
 * Initialize Firebase app and services
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-app.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
};

console.log('[Firebase Config] Initializing with:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyExists: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-api-key',
});

// Initialize Firebase
let app;
try {
  console.log('[Firebase] Starting initialization...');
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] ✅ Initialized successfully');
} catch (error) {
  console.error('[Firebase] 🔴 INITIALIZATION FAILED:', error);
  console.error('[Firebase] Error details:', {
    message: error instanceof Error ? error.message : String(error),
    code: error instanceof Error && 'code' in error ? (error as any).code : 'unknown',
  });
  // Create a dummy app for development
  app = null as any;
}

export { app };

// Initialize services
export const db = app ? getFirestore(app) : null as any;
export const auth = app
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    })
  : null as any;
export const storage = app ? getStorage(app) : null as any;

// Initialize Analytics (only if supported)
let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { analytics };
