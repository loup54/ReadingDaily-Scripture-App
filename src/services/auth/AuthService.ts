/**
 * Firebase Authentication Service
 * Provides real Firebase authentication with persistence
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User, LoginCredentials, SignUpData, AuthResponse, AuthError } from '@/types/auth.types';

export class AuthService {
  /**
   * Sign in with email and password using Firebase
   */
  static async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!auth) {
      throw this.createError('auth/service-unavailable', 'Authentication service not initialized');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      // Fetch user profile from Firestore
      let userProfile: User;
      try {
        userProfile = await this.getUserProfile(firebaseUser.uid);
      } catch (profileError: any) {
        // If profile doesn't exist, create one (for old Firebase accounts)
        if (profileError.code === 'auth/user-not-found') {
          console.log('[Firebase Auth] Creating profile for old account:', firebaseUser.email);
          userProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            createdAt: new Date(),
            emailVerified: firebaseUser.emailVerified,
            subscription: {
              type: 'trial',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
            },
            preferences: {
              language: 'en',
              notifications: true,
            },
          };

          // Save to Firestore
          if (!db) {
            throw this.createError('auth/service-unavailable', 'Database not initialized');
          }
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...userProfile,
            createdAt: Timestamp.fromDate(userProfile.createdAt),
            subscription: {
              ...userProfile.subscription,
              expiresAt: Timestamp.fromDate(userProfile.subscription.expiresAt),
            },
          });
          console.log('[Firebase Auth] Profile created successfully for:', firebaseUser.email);
        } else {
          // Re-throw if it's a different error
          throw profileError;
        }
      }

      return {
        user: userProfile,
        token: idToken,
        refreshToken: firebaseUser.refreshToken || '',
      };
    } catch (error: any) {
      console.error('[Firebase Auth] Sign in error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Sign up with email and password using Firebase
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    if (!auth || !db) {
      throw this.createError('auth/service-unavailable', 'Authentication service not initialized');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userProfile: User = {
        id: firebaseUser.uid,
        email: data.email,
        fullName: data.fullName,
        createdAt: new Date(),
        emailVerified: false,
        subscription: {
          type: 'trial',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
        },
        preferences: {
          language: 'en',
          notifications: true,
        },
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userProfile,
        createdAt: Timestamp.fromDate(userProfile.createdAt),
        subscription: {
          ...userProfile.subscription,
          expiresAt: Timestamp.fromDate(userProfile.subscription.expiresAt),
        },
      });

      const idToken = await firebaseUser.getIdToken();

      return {
        user: userProfile,
        token: idToken,
        refreshToken: firebaseUser.refreshToken || '',
      };
    } catch (error: any) {
      console.error('[Firebase Auth] Sign up error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Request password reset email
   */
  static async requestPasswordReset(email: string): Promise<void> {
    if (!auth) {
      throw this.createError('auth/service-unavailable', 'Authentication service not initialized');
    }

    try {
      await sendPasswordResetEmail(auth, email);
      console.log('[Firebase Auth] Password reset email sent to:', email);
    } catch (error: any) {
      console.error('[Firebase Auth] Password reset error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Reset password with token from email link
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!auth) {
      throw this.createError('auth/service-unavailable', 'Authentication service not initialized');
    }

    try {
      await confirmPasswordReset(auth, token, newPassword);
      console.log('[Firebase Auth] Password reset completed');
    } catch (error: any) {
      console.error('[Firebase Auth] Confirm password reset error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Verify email (Firebase sends link to email)
   */
  static async verifyEmail(token: string): Promise<void> {
    // Firebase handles email verification through email links
    // This is a placeholder for the verification flow
    console.log('[Firebase Auth] Email verification via link');
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    if (!auth) {
      throw this.createError('auth/service-unavailable', 'Authentication service not initialized');
    }

    try {
      await signOut(auth);
      console.log('[Firebase Auth] User signed out');
    } catch (error: any) {
      console.error('[Firebase Auth] Sign out error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Get current Firebase user
   * Returns null if no user is logged in
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth?.currentUser || null;
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(): Promise<string> {
    const firebaseUser = this.getCurrentUser();

    if (!firebaseUser) {
      throw this.createError('auth/user-not-found', 'No authenticated user');
    }

    try {
      const token = await firebaseUser.getIdToken(true);
      return token;
    } catch (error: any) {
      console.error('[Firebase Auth] Token refresh error:', error);
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Setup auth state listener for persistent login
   * Call this on app startup to automatically restore auth state
   */
  static setupAuthStateListener(callback: (user: User | null) => void): () => void {
    if (!auth) {
      console.error('[Firebase Auth] Auth not initialized');
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userProfile: User;
          try {
            userProfile = await this.getUserProfile(firebaseUser.uid);
          } catch (profileError: any) {
            // If profile doesn't exist, create one (for old Firebase accounts)
            if (profileError.code === 'auth/user-not-found') {
              console.log('[Firebase Auth] Creating profile for old account during app restore:', firebaseUser.email);
              userProfile = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                createdAt: new Date(),
                emailVerified: firebaseUser.emailVerified,
                subscription: {
                  type: 'trial',
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
                },
                preferences: {
                  language: 'en',
                  notifications: true,
                },
              };

              // Save to Firestore
              if (db) {
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  ...userProfile,
                  createdAt: Timestamp.fromDate(userProfile.createdAt),
                  subscription: {
                    ...userProfile.subscription,
                    expiresAt: Timestamp.fromDate(userProfile.subscription.expiresAt),
                  },
                });
              }
            } else {
              throw profileError;
            }
          }
          callback(userProfile);
        } catch (error) {
          console.error('[Firebase Auth] Failed to restore user profile:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }

  /**
   * Helper: Get user profile from Firestore
   */
  private static async getUserProfile(uid: string): Promise<User> {
    if (!db) {
      throw this.createError('auth/service-unavailable', 'Database not initialized');
    }

    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: uid,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          subscription: {
            ...data.subscription,
            expiresAt: data.subscription?.expiresAt?.toDate?.() || new Date(),
          },
        } as User;
      } else {
        throw this.createError('auth/user-not-found', 'User profile not found in Firestore');
      }
    } catch (error: any) {
      console.error('[Firebase Auth] Get user profile error:', error);
      // Check if error has our custom format
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        throw error;
      }
      throw this.createError('auth/unknown', error?.message || 'Unknown error');
    }
  }

  /**
   * Map Firebase errors to standard AuthError
   */
  private static mapFirebaseError(error: any): AuthError {
    const code = error.code || 'auth/unknown';
    let message = error.message || 'An authentication error occurred';

    // Map common Firebase error codes to user-friendly messages
    const errorMap: { [key: string]: string } = {
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/invalid-email': 'The email address is invalid',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many login attempts. Please try again later',
      'auth/account-exists-with-different-credential':
        'An account with this email already exists with a different sign-in method',
    };

    if (errorMap[code]) {
      message = errorMap[code];
    }

    return this.createError(code, message);
  }

  /**
   * Helper to create auth errors
   */
  private static createError(code: string, message: string, field?: string): AuthError {
    return { code, message, field };
  }
}