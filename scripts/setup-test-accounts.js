#!/usr/bin/env node

/**
 * Setup Test Accounts Script
 * Generates and prints test account credentials for Firebase testing
 */

const timestamp = Date.now();
const testAccounts = [
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

console.log('\n========== FIREBASE TEST ACCOUNT SETUP ==========\n');
console.log('Firebase Project: readingdaily-scripture-fe502\n');
console.log('To test the app with REAL Firebase authentication:\n');

testAccounts.forEach((account, index) => {
  console.log(`\n${index + 1}. ${account.description}`);
  console.log(`   Email:    ${account.email}`);
  console.log(`   Password: ${account.password}`);
  console.log(`   Name:     ${account.fullName}`);
});

console.log('\n\nTesting Steps:');
console.log('─'.repeat(50));
console.log('1. In the iOS simulator, tap "Start Free Trial"');
console.log('2. Fill in the signup form with one of the accounts above');
console.log('3. Tap "Start Free Trial" to create the account');
console.log('4. Once signed up, you\'ll automatically be logged in');
console.log('5. You\'ll see the main app screens and features');
console.log('6. To test login flow:');
console.log('   - Go to Settings/Profile and tap Logout/Sign Out');
console.log('   - Tap "Already have an account? Sign In"');
console.log('   - Use the same email/password to sign back in');
console.log('\nNotes:');
console.log('─'.repeat(50));
console.log('• Email addresses are unique per test run (timestamp-based)');
console.log('• You can create as many test accounts as you want');
console.log('• Each new run generates different emails');
console.log('• All test accounts use the same password');
console.log('• Firebase stores these accounts permanently');
console.log('• You can view all accounts in Firebase Console');
console.log('================================================\n');
