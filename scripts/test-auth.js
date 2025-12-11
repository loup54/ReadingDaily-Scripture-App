/**
 * Test script to verify Firebase authentication
 * Run with: node scripts/test-auth.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'readingdaily-scripture-fe502'
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔐 Firebase Authentication Test Utility\n');
  console.log('Choose an action:');
  console.log('1. Check user account status');
  console.log('2. Send password reset email');
  console.log('3. Update user password (admin)');
  console.log('4. Test sign-in credentials\n');

  const action = await question('Enter choice (1-4): ');

  if (action === '1') {
    await checkUserStatus();
  } else if (action === '2') {
    await sendPasswordReset();
  } else if (action === '3') {
    await updatePassword();
  } else if (action === '4') {
    await testSignIn();
  } else {
    console.log('Invalid choice');
  }

  rl.close();
}

async function checkUserStatus() {
  const email = await question('Enter email: ');

  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log('\n✅ User found:');
    console.log('  UID:', user.uid);
    console.log('  Email:', user.email);
    console.log('  Email verified:', user.emailVerified);
    console.log('  Disabled:', user.disabled);
    console.log('  Created:', new Date(user.metadata.creationTime).toLocaleString());
    console.log('  Last sign-in:', new Date(user.metadata.lastSignInTime).toLocaleString());
    console.log('  Provider:', user.providerData.map(p => p.providerId).join(', '));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function sendPasswordReset() {
  const email = await question('Enter email: ');

  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    console.log('\n✅ Password reset link generated:');
    console.log(link);
    console.log('\nℹ️  Send this link to the user or use Firebase Console to send an email.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function updatePassword() {
  const email = await question('Enter email: ');
  const newPassword = await question('Enter new password: ');

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, {
      password: newPassword
    });
    console.log('\n✅ Password updated successfully!');
    console.log('   You can now sign in with the new password.');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testSignIn() {
  console.log('\n⚠️  Note: Firebase Admin SDK cannot directly test sign-in.');
  console.log('Use the Firebase Auth REST API or the app itself to test credentials.');
  console.log('\nTo test manually:');
  console.log('1. Use the app sign-in screen');
  console.log('2. Check console logs for detailed error messages');
  console.log('3. Use browser dev tools with Firebase Auth emulator');
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
});
