/**
 * Firebase Database Cleanup Script
 *
 * Use this to delete test data from Firestore
 * Run with: node scripts/cleanup-firebase.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../path/to/serviceAccountKey.json'); // Update this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================
// 1. Delete Test Users
// ============================================
async function deleteTestUsers() {
  console.log('🔍 Finding test users...');

  const snapshot = await db.collection('users')
    .where('email', '>=', 'test')
    .where('email', '<', 'tesu')
    .get();

  console.log(`Found ${snapshot.size} test users`);

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    console.log(`  Deleting: ${doc.data().email}`);
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ Test users deleted');
}

// ============================================
// 2. Delete Expired Trials
// ============================================
async function deleteExpiredTrials() {
  console.log('🔍 Finding expired trials...');

  const now = Date.now();
  const snapshot = await db.collection('trials')
    .where('expiresAt', '<', now)
    .get();

  console.log(`Found ${snapshot.size} expired trials`);

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ Expired trials deleted');
}

// ============================================
// 3. Delete Used Gift Codes
// ============================================
async function deleteUsedGiftCodes() {
  console.log('🔍 Finding used gift codes...');

  const snapshot = await db.collection('giftCodes')
    .where('redeemed', '==', true)
    .get();

  console.log(`Found ${snapshot.size} used gift codes`);

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    console.log(`  Deleting code: ${doc.data().code}`);
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ Used gift codes deleted');
}

// ============================================
// 4. Delete Old Test Purchases (Before Launch)
// ============================================
async function deleteTestPurchases() {
  console.log('🔍 Finding test purchases...');

  // Delete purchases from before Feb 24, 2026 (iOS launch date)
  const launchDate = new Date('2026-02-24').getTime();

  const snapshot = await db.collection('purchases')
    .where('createdAt', '<', launchDate)
    .get();

  console.log(`Found ${snapshot.size} test purchases`);

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ Test purchases deleted');
}

// ============================================
// 5. List All Collections (Audit)
// ============================================
async function auditCollections() {
  console.log('\n📊 Database Audit:\n');

  const collections = await db.listCollections();

  for (const collection of collections) {
    const snapshot = await collection.get();
    console.log(`  ${collection.id}: ${snapshot.size} documents`);
  }
}

// ============================================
// Main Cleanup Function
// ============================================
async function cleanup() {
  console.log('🧹 Starting Firebase cleanup...\n');

  try {
    // Audit first
    await auditCollections();

    console.log('\n🗑️  Starting cleanup...\n');

    // Uncomment the operations you want to run:

    // await deleteTestUsers();
    // await deleteExpiredTrials();
    // await deleteUsedGiftCodes();
    // await deleteTestPurchases();

    console.log('\n✅ Cleanup complete!');

    // Audit after cleanup
    console.log('\n📊 After cleanup:');
    await auditCollections();

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Run cleanup
cleanup();
