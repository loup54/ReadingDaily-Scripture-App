/**
 * Auth Store using Zustand
 * Manages authentication state across the app
 * Integrates Firebase authentication with automatic persistence
 */

import { create } from 'zustand';
import { User, LoginCredentials, SignUpData, AuthState, AuthError } from '@/types/auth.types';
import { AuthService } from '@/services/auth';

interface AuthStoreState {
  user: User | null;
  token: string | null;
  state: AuthState;
  error: AuthError | null;
  isInitialized: boolean; // Track if auth state has been checked

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  initializeAuthState: () => Promise<void>; // New: Initialize persistent auth on app startup
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => {
  // Store for unsubscribe function
  let unsubscribeAuthListener: (() => void) | null = null;

  return {
    user: null,
    token: null,
    state: 'idle',
    error: null,
    isInitialized: false,

    /**
     * Initialize auth state from Firebase on app startup
     * Sets up listener for persistent login and waits for first callback
     */
    initializeAuthState: async () => {
      set({ state: 'loading', error: null });
      console.log('[useAuthStore] Starting auth state initialization...');

      // Return a Promise that resolves when first auth state is determined
      return new Promise<void>((resolve) => {
        let resolved = false;

        // Safety timeout - if Firebase doesn't respond in 3 seconds, proceed anyway
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            console.warn('[useAuthStore] Auth initialization timeout (3s) - proceeding without persisted state');
            resolved = true;
            set({
              state: 'unauthenticated',
              isInitialized: true,
              error: null,
            });
            resolve();
          }
        }, 3000);

        try {
          // Setup auth state listener for persistence
          unsubscribeAuthListener = AuthService.setupAuthStateListener(async (user) => {
            // Resolve initialization immediately - don't wait for async operations
            if (!resolved) {
              resolved = true;
              clearTimeout(timeoutId);
              console.log('[useAuthStore] Auth state received from Firebase, initializing...');
              resolve();
            }

            // Update auth state asynchronously (don't block initialization)
            if (user) {
              // User logged in - update auth state
              try {
                console.log('[useAuthStore] Processing authenticated user:', user.email);
                const token = await AuthService.refreshToken();
                set({
                  user,
                  token,
                  state: 'authenticated',
                  isInitialized: true,
                  error: null,
                });
                console.log('[useAuthStore] User successfully restored');
              } catch (error) {
                // Handle network errors gracefully - user can still be authenticated
                const errorObj = error as any;
                const isNetworkError = errorObj?.code === 'auth/network-request-failed' ||
                                       errorObj?.message?.includes('network');

                if (isNetworkError) {
                  console.warn('[useAuthStore] Network error during token refresh - keeping user authenticated');
                  // Keep user authenticated despite network error - will retry next time
                  set({
                    user,
                    token: user.refreshToken || '', // Use refresh token as fallback
                    state: 'authenticated',
                    isInitialized: true,
                    error: null,
                  });
                } else {
                  // For other errors (invalid token, etc.), log out the user
                  console.error('[useAuthStore] Failed to refresh token (non-network error):', error);
                  set({
                    user: null,
                    token: null,
                    state: 'unauthenticated',
                    isInitialized: true,
                    error: error as AuthError,
                  });
                }
              }
            } else {
              // User logged out or not authenticated
              console.log('[useAuthStore] No authenticated user found');
              set({
                user: null,
                token: null,
                state: 'unauthenticated',
                isInitialized: true,
                error: null,
              });
            }
          });
        } catch (error) {
          if (!resolved) {
            clearTimeout(timeoutId);
            resolved = true;
            console.error('[useAuthStore] Failed to initialize auth state:', error);
            set({
              state: 'unauthenticated',
              isInitialized: true,
              error: error as AuthError,
            });
            resolve();
          }
        }
      });
    },

    login: async (credentials: LoginCredentials) => {
      set({ state: 'loading', error: null });

      try {
        const response = await AuthService.signIn(credentials);

        set({
          user: response.user,
          token: response.token,
          state: 'authenticated',
          error: null,
        });
      } catch (error) {
        set({
          state: 'error',
          error: error as AuthError,
        });
        throw error;
      }
    },

    signUp: async (data: SignUpData) => {
      set({ state: 'loading', error: null });

      try {
        const response = await AuthService.signUp(data);

        set({
          user: response.user,
          token: response.token,
          state: 'authenticated',
          error: null,
        });
      } catch (error) {
        set({
          state: 'error',
          error: error as AuthError,
        });
        throw error;
      }
    },

    logout: async () => {
      set({ state: 'loading', error: null });

      try {
        await AuthService.signOut();

        // Unsubscribe from auth listener when logging out
        if (unsubscribeAuthListener) {
          unsubscribeAuthListener();
          unsubscribeAuthListener = null;
        }

        set({
          user: null,
          token: null,
          state: 'unauthenticated',
          error: null,
        });
      } catch (error) {
        set({
          state: 'error',
          error: error as AuthError,
        });
      }
    },

    resetPassword: async (email: string) => {
      set({ state: 'loading', error: null });

      try {
        await AuthService.requestPasswordReset(email);

        set({
          state: 'idle',
          error: null,
        });
      } catch (error) {
        set({
          state: 'error',
          error: error as AuthError,
        });
        throw error;
      }
    },

    verifyEmail: async (token: string) => {
      set({ state: 'loading', error: null });

      try {
        await AuthService.verifyEmail(token);

        // Update user's emailVerified status
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, emailVerified: true },
            state: 'authenticated',
            error: null,
          });
        }
      } catch (error) {
        set({
          state: 'error',
          error: error as AuthError,
        });
        throw error;
      }
    },

    /**
     * Refresh authentication token
     * Used to keep Firebase token fresh
     */
    refreshAuth: async () => {
      const currentUser = get().user;

      if (!currentUser) {
        set({ state: 'unauthenticated' });
        return;
      }

      try {
        const token = await AuthService.refreshToken();

        set({
          token,
          state: 'authenticated',
          error: null,
        });
      } catch (error) {
        console.error('[useAuthStore] Token refresh failed:', error);
        set({
          user: null,
          token: null,
          state: 'unauthenticated',
          error: error as AuthError,
        });
      }
    },

    clearError: () => {
      set({ error: null });
    },
  };
});