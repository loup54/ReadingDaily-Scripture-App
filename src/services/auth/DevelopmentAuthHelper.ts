/**
 * Development Authentication Helper
 *
 * Provides test account auto-login functionality for development/testing
 * In production, this should not be used
 */

import { AuthService } from './AuthService';
import { LoginCredentials } from '@/types/auth.types';

export class DevelopmentAuthHelper {
  // Test account credentials - change these for your testing
  private static readonly TEST_ACCOUNT = {
    email: 'test@readingdaily.dev',
    password: 'TestPassword123!',
    fullName: 'Test User',
  };

  /**
   * Auto-login test account for development
   * Creates account if it doesn't exist
   */
  static async ensureTestAccountLoggedIn(): Promise<boolean> {
    try {
      console.log('[DevelopmentAuthHelper] 🔧 Attempting to auto-login test account...');

      // Try to sign in first
      try {
        console.log('[DevelopmentAuthHelper] Trying to sign in with existing test account...');
        const credentials: LoginCredentials = {
          email: this.TEST_ACCOUNT.email,
          password: this.TEST_ACCOUNT.password,
        };
        await AuthService.signIn(credentials);
        console.log('[DevelopmentAuthHelper] ✅ Successfully signed in with test account');
        return true;
      } catch (signInError: any) {
        // If account doesn't exist, create it
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          console.log('[DevelopmentAuthHelper] Test account doesn\'t exist, creating it...');
          try {
            await AuthService.signUp({
              email: this.TEST_ACCOUNT.email,
              password: this.TEST_ACCOUNT.password,
              fullName: this.TEST_ACCOUNT.fullName,
            });
            console.log('[DevelopmentAuthHelper] ✅ Created and signed in with test account');
            return true;
          } catch (signUpError) {
            console.error('[DevelopmentAuthHelper] Failed to create test account:', signUpError);
            return false;
          }
        } else {
          // Some other error
          console.error('[DevelopmentAuthHelper] Sign in failed with unexpected error:', signInError);
          return false;
        }
      }
    } catch (error) {
      console.error('[DevelopmentAuthHelper] Unexpected error:', error);
      return false;
    }
  }

  /**
   * Get test account credentials (for reference)
   */
  static getTestAccountCredentials() {
    return { ...this.TEST_ACCOUNT };
  }

  /**
   * Check if development mode is enabled
   * Set to false to disable auto-login and test the login screen
   */
  static isDevMode(): boolean {
    // In a real app, this would check an environment variable or config
    // For now, we'll check if running in development
    // DISABLED: return __DEV__ === true;
    return false; // Set to false to disable auto-login for testing login screen
  }
}
