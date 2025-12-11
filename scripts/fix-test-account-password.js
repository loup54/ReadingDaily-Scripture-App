/**
 * Fix test account password using Firebase Admin SDK
 * Run with: node scripts/fix-test-account-password.js
 */

// Check if firebase-admin is installed
try {
  require.resolve('firebase-admin');
} catch (e) {
  console.error('❌ firebase-admin is not installed. Installing...');
  console.error('Run: npm install firebase-admin --save-dev');
  process.exit(1);
}

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: 'readingdaily-scripture-fe502',
  // We'll use Application Default Credentials
};

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    ...serviceAccount
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.log('ℹ️  Initializing with environment credentials...');
  try {
    admin.initializeApp({
      projectId: serviceAccount.projectId
    });
  } catch (e) {
    console.error('❌ Failed to initialize Firebase Admin:', e.message);
    console.error('\nℹ️  To use this script, you need to:');
    console.error('1. Install Firebase Admin SDK: npm install firebase-admin --save-dev');
    console.error('2. Authenticate: firebase login');
    console.error('3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    process.exit(1);
  }
}

async function fixTestAccount() {
  const email = 'test@readingdaily.dev';
  const newPassword = 'TestPassword123!';

  try {
    console.log(`\n🔍 Looking up user: ${email}`);
    const user = await admin.auth().getUserByEmail(email);

    console.log('✅ User found:');
    console.log('  UID:', user.uid);
    console.log('  Email:', user.email);
    console.log('  Email verified:', user.emailVerified);
    console.log('  Created:', new Date(user.metadata.creationTime).toLocaleString());
    console.log('  Last sign-in:', user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Never');

    console.log(`\n🔧 Updating password for ${email}...`);
    await admin.auth().updateUser(user.uid, {
      password: newPassword,
      emailVerified: true // Also verify the email while we're at it
    });

    console.log('✅ Password updated successfully!');
    console.log(`\n📝 Test credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n✨ You can now sign in with these credentials in the app.');

    // Also check Firestore profile
    console.log('\n🔍 Checking Firestore profile...');
    const db = admin.firestore();
    const profileDoc = await db.collection('users').doc(user.uid).get();

    if (profileDoc.exists) {
      console.log('✅ Firestore profile exists:');
      const profile = profileDoc.data();
      console.log('  Full name:', profile.fullName);
      console.log('  Subscription:', profile.subscription?.type);
      console.log('  Subscription expires:', profile.subscription?.expiresAt?.toDate?.().toLocaleString());
    } else {
      console.log('⚠️  No Firestore profile found');
      console.log('   Creating basic profile...');

      await db.collection('users').doc(user.uid).set({
        id: user.uid,
        email: user.email,
        fullName: 'Test User',
        createdAt: admin.firestore.Timestamp.now(),
        emailVerified: true,
        subscription: {
          type: 'trial',
          expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        },
        preferences: {
          language: 'en',
          notifications: true
        }
      });

      console.log('✅ Firestore profile created');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 User does not exist. Creating new account...');
      try {
        const newUser = await admin.auth().createUser({
          email,
          password: newPassword,
          emailVerified: true
        });
        console.log('✅ User created:', newUser.uid);
        console.log(`\n📝 New account credentials:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${newPassword}`);
      } catch (createError) {
        console.error('❌ Failed to create user:', createError.message);
      }
    }
    process.exit(1);
  }
}

fixTestAccount();
