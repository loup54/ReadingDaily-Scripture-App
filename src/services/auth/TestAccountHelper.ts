/**
 * Test Account Helper
 * Provides utilities for creating and managing test accounts for development/testing
 */

import { AuthService } from './AuthService';

export class TestAccountHelper {
  /**
   * Create a test account with the given email and password
   * Returns the created user details
   */
  static async createTestAccount(
    email: string,
    password: string,
    fullName: string = 'Test User'
  ) {
    try {
      console.log('[TestAccountHelper] Creating test account:', email);

      const response = await AuthService.signUp({
        email,
        password,
        fullName,
        acceptTerms: true,
      });

      console.log('[TestAccountHelper] Test account created successfully:', email);
      return {
        success: true,
        user: response.user,
        email,
        password,
        message: `Test account created: ${email}`,
      };
    } catch (error: any) {
      console.error('[TestAccountHelper] Error creating test account:', error);
      return {
        success: false,
        error: error.message,
        email,
        message: `Failed to create test account: ${error.message}`,
      };
    }
  }

  /**
   * Test login with given credentials
   */
  static async testLogin(email: string, password: string) {
    try {
      console.log('[TestAccountHelper] Testing login:', email);

      const response = await AuthService.signIn({
        email,
        password,
      });

      console.log('[TestAccountHelper] Login successful:', email);
      return {
        success: true,
        user: response.user,
        message: `Successfully logged in as: ${email}`,
      };
    } catch (error: any) {
      console.error('[TestAccountHelper] Login failed:', error);
      return {
        success: false,
        error: error.message,
        message: `Login failed: ${error.message}`,
      };
    }
  }

  /**
   * Get suggested test account credentials
   * These can be used for testing
   */
  static getSuggestedTestAccounts() {
    const timestamp = Date.now();
    return [
      {
        email: `test.user.${timestamp}@readingdaily.app`,
        password: 'TestPassword123!@#',
        fullName: 'Test User 1',
        description: 'Standard test account',
      },
      {
        email: `qa.tester.${timestamp}@readingdaily.app`,
        password: 'TestPassword123!@#',
        fullName: 'QA Tester',
        description: 'QA testing account',
      },
      {
        email: `dev.test.${timestamp}@readingdaily.app`,
        password: 'TestPassword123!@#',
        fullName: 'Developer Test',
        description: 'Development testing account',
      },
    ];
  }

  /**
   * Print instructions for manual testing
   */
  static printTestInstructions() {
    const accounts = this.getSuggestedTestAccounts();
    console.log('\n========== FIREBASE TEST ACCOUNT SETUP ==========');
    console.log('To test the app, create accounts with these credentials:');
    console.log('');

    accounts.forEach((account, index) => {
      console.log(`Account ${index + 1} (${account.description}):`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Password: ${account.password}`);
      console.log(`  Name: ${account.fullName}`);
      console.log('');
    });

    console.log('Steps:');
    console.log('1. On the Landing screen, tap "Start Free Trial"');
    console.log('2. Fill in the signup form with credentials above');
    console.log('3. Tap "Start Free Trial" button to create account');
    console.log('4. Once signed up, you\'ll be logged in automatically');
    console.log('5. To test login, sign out and use "Already have an account? Sign In"');
    console.log('================================================\n');
  }
}
