/**
 * Firebase Sync Service
 * Handles real synchronization of offline changes to Firestore and Cloud Functions
 * Manages settings, progress, and reading completion syncs
 */

import { db, app } from '@/config/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { OfflineNotificationService } from '@/services/offline/OfflineNotificationService';
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  Timestamp,
  FirebaseError,
} from 'firebase/firestore';
import { getFunctions, httpsCallable, HttpsCallableError } from 'firebase/functions';

export interface SyncError {
  type: 'network' | 'auth' | 'data' | 'quota' | 'unknown';
  message: string;
  retriable: boolean;
  originalError?: Error;
}

/**
 * Firebase Sync Service for offline data synchronization
 */
export class FirebaseSyncService {
  private static readonly FUNCTIONS = getFunctions(app, 'us-central1');

  /**
   * Sync settings to Firestore
   */
  static async syncSettingsToFirestore(settings: any): Promise<{ success: boolean; error?: SyncError }> {
    try {
      const user = useAuthStore.getState().user;

      if (!user?.uid) {
        return {
          success: false,
          error: {
            type: 'auth',
            message: 'User not authenticated',
            retriable: false,
          },
        };
      }

      console.log('[FirebaseSyncService] Syncing settings for user:', user.uid);

      // Update user settings document
      const userSettingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      const settingsData = {
        ...settings,
        lastSyncedAt: Timestamp.now(),
        syncedFrom: 'offline',
      };

      await setDoc(userSettingsRef, settingsData, { merge: true });

      console.log('[FirebaseSyncService] ✅ Settings synced successfully');
      return { success: true };
    } catch (error) {
      return this.handleSyncError(error, 'syncSettings');
    }
  }

  /**
   * Sync progress to Firestore
   */
  static async syncProgressToFirestore(progress: any): Promise<{ success: boolean; error?: SyncError }> {
    try {
      const user = useAuthStore.getState().user;

      if (!user?.uid) {
        return {
          success: false,
          error: {
            type: 'auth',
            message: 'User not authenticated',
            retriable: false,
          },
        };
      }

      console.log('[FirebaseSyncService] Syncing progress for user:', user.uid, 'data:', progress);

      // Update user progress document
      const userProgressRef = doc(db, 'users', user.uid);
      const progressData = {
        progress: {
          ...progress,
          lastSyncedAt: Timestamp.now(),
          syncedFrom: 'offline',
        },
      };

      await setDoc(userProgressRef, progressData, { merge: true });

      console.log('[FirebaseSyncService] ✅ Progress synced successfully');
      return { success: true };
    } catch (error) {
      return this.handleSyncError(error, 'syncProgress');
    }
  }

  /**
   * Record reading completion to Cloud Function
   */
  static async recordReadingToCloud(readingData: {
    readingDate: string;
    completedAt?: number;
    pronunciationResults?: any;
  }): Promise<{ success: boolean; error?: SyncError }> {
    try {
      const user = useAuthStore.getState().user;

      if (!user?.uid) {
        return {
          success: false,
          error: {
            type: 'auth',
            message: 'User not authenticated',
            retriable: false,
          },
        };
      }

      console.log('[FirebaseSyncService] Recording reading for user:', user.uid, 'date:', readingData.readingDate);

      // Call Cloud Function to record reading
      const recordReading = httpsCallable(this.FUNCTIONS, 'recordReading');

      const result = await recordReading({
        userId: user.uid,
        readingDate: readingData.readingDate,
        completedAt: readingData.completedAt || Date.now(),
        pronunciationResults: readingData.pronunciationResults,
        syncedFrom: 'offline',
      });

      console.log('[FirebaseSyncService] ✅ Reading recorded successfully:', result.data);
      return { success: true };
    } catch (error) {
      return this.handleSyncError(error, 'recordReading');
    }
  }

  /**
   * Private: Handle sync errors and categorize them
   */
  private static handleSyncError(
    error: any,
    operation: string
  ): { success: boolean; error: SyncError } {
    console.error(`[FirebaseSyncService] ${operation} failed:`, error);

    // Auth errors (not retriable)
    if (this.isAuthError(error)) {
      const syncError: SyncError = {
        type: 'auth',
        message: 'Authentication failed - please sign in again',
        retriable: false,
        originalError: error instanceof Error ? error : undefined,
      };

      console.error('[FirebaseSyncService] Auth error detected - clearing queue');
      this.handleAuthError();

      return { success: false, error: syncError };
    }

    // Network errors (retriable)
    if (this.isNetworkError(error)) {
      return {
        success: false,
        error: {
          type: 'network',
          message: 'Network error - will retry automatically',
          retriable: true,
          originalError: error instanceof Error ? error : undefined,
        },
      };
    }

    // Quota errors (retriable with backoff)
    if (this.isQuotaError(error)) {
      return {
        success: false,
        error: {
          type: 'quota',
          message: 'Request quota exceeded - will retry later',
          retriable: true,
          originalError: error instanceof Error ? error : undefined,
        },
      };
    }

    // Data validation errors (not retriable)
    if (this.isDataError(error)) {
      return {
        success: false,
        error: {
          type: 'data',
          message: 'Data validation error - skipping this operation',
          retriable: false,
          originalError: error instanceof Error ? error : undefined,
        },
      };
    }

    // Unknown errors (retriable as fallback)
    return {
      success: false,
      error: {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        retriable: true,
        originalError: error instanceof Error ? error : undefined,
      },
    };
  }

  /**
   * Private: Check if error is auth-related
   */
  private static isAuthError(error: any): boolean {
    if (error instanceof FirebaseError) {
      return (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-api-key' ||
        error.code === 'auth/operation-not-allowed' ||
        error.code === 'permission-denied' ||
        error.code === 'unauthenticated'
      );
    }

    if (error instanceof HttpsCallableError) {
      return error.code === 'unauthenticated' || error.code === 'permission-denied';
    }

    return false;
  }

  /**
   * Private: Check if error is network-related
   */
  private static isNetworkError(error: any): boolean {
    if (error instanceof FirebaseError) {
      return (
        error.code === 'service-unavailable' ||
        error.code === 'unavailable' ||
        error.code === 'deadline-exceeded'
      );
    }

    if (error instanceof HttpsCallableError) {
      return error.code === 'unavailable' || error.code === 'deadline-exceeded';
    }

    // Check for generic network errors
    if (error instanceof Error) {
      return (
        error.message.includes('network') ||
        error.message.includes('Network') ||
        error.message.includes('timeout') ||
        error.message.includes('NETWORK')
      );
    }

    return false;
  }

  /**
   * Private: Check if error is quota-related
   */
  private static isQuotaError(error: any): boolean {
    if (error instanceof FirebaseError) {
      return (
        error.code === 'resource-exhausted' ||
        error.code === 'quota-exceeded'
      );
    }

    if (error instanceof HttpsCallableError) {
      return error.code === 'resource-exhausted';
    }

    return false;
  }

  /**
   * Private: Check if error is data validation error
   */
  private static isDataError(error: any): boolean {
    if (error instanceof FirebaseError) {
      return (
        error.code === 'invalid-argument' ||
        error.code === 'failed-precondition' ||
        error.code === 'out-of-range'
      );
    }

    if (error instanceof HttpsCallableError) {
      return error.code === 'invalid-argument' || error.code === 'failed-precondition';
    }

    return false;
  }

  /**
   * Private: Handle auth errors by clearing queue and prompting re-login
   */
  private static handleAuthError(): void {
    console.log('[FirebaseSyncService] Handling auth error - clearing user state');

    // Sign out user
    useAuthStore.getState().logout?.();

    // Show notification to user
    OfflineNotificationService.showAlert(
      'Session Expired',
      'Your session has expired. Please sign in again to sync your changes.',
      [
        {
          text: 'Sign In',
          onPress: () => {
            console.log('[FirebaseSyncService] User tapped sign in');
            // Navigation to login will be handled by auth guard
          },
          style: 'default',
        },
      ]
    );
  }

  /**
   * Verify Firestore connectivity (health check)
   */
  static async verifyConnectivity(): Promise<boolean> {
    try {
      const user = useAuthStore.getState().user;

      if (!user?.uid) {
        console.warn('[FirebaseSyncService] No user authenticated');
        return false;
      }

      // Try to read user doc
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      console.log('[FirebaseSyncService] ✅ Firestore connectivity verified');
      return true;
    } catch (error) {
      console.error('[FirebaseSyncService] Connectivity check failed:', error);
      return false;
    }
  }
}
