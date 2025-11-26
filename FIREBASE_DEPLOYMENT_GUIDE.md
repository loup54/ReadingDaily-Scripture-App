# Firebase Deployment Guide for Gifting System

## Prerequisites

Before deploying Cloud Functions, ensure you have:

1. **Firebase CLI installed**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Account & Project**:
   - Go to https://console.firebase.google.com
   - Create a new project or use an existing one
   - Note the Project ID

3. **Authentication**:
   ```bash
   firebase login
   ```

## Step 1: Initialize Firebase Project

If not already initialized:

```bash
firebase init functions
```

Choose:
- Language: **TypeScript**
- ESLint: **Yes**
- Install dependencies: **Yes**

## Step 2: Set Up Functions Directory

The Cloud Functions should be in a `functions` directory at the project root.

### Directory Structure:
```
/functions
  ├── src/
  │   ├── index.ts (main exports)
  │   ├── gifting/
  │   │   ├── redeemGiftCode.ts
  │   │   ├── sendGift.ts
  │   │   └── utils.ts
  │   └── shared/
  │       └── firestore.ts
  ├── .env.local (for environment variables)
  ├── package.json
  └── tsconfig.json
```

## Step 3: Cloud Functions to Deploy

### Function 1: `redeemGiftCode`
**File**: `functions/src/gifting/redeemGiftCode.ts`

Handles gift code validation and redemption by:
1. Validating gift code format
2. Checking Firestore for gift record
3. Verifying code hasn't been redeemed
4. Updating user subscription
5. Marking code as redeemed
6. Sending confirmation email

**Triggers**: HTTPS Callable
**Auth**: Required (Firebase Auth)

### Function 2: `sendGift`
**File**: `functions/src/gifting/sendGift.ts`

Handles gift creation and delivery:
1. Validating sender (must have active subscription)
2. Generating unique gift code
3. Creating Firestore record
4. Sending email to recipient
5. Returning gift code to sender

**Triggers**: HTTPS Callable
**Auth**: Required (Firebase Auth)

## Step 4: Environment Variables

Create `.env.local` in the functions directory:

```env
# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDER_EMAIL=noreply@readingdaily.app

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# Subscription Configuration
SUBSCRIPTION_TIERS_PRICING={"basic":4.99,"premium":19.99,"lifetime":99.99}
GIFT_VALIDITY_DAYS=365
```

Load these in `index.ts`:
```typescript
import * as functions from 'firebase-functions';
const admin = require('firebase-admin');

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

admin.initializeApp(firebaseConfig);
```

## Step 5: Firestore Security Rules

Update your Firestore rules (`firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Gift codes collection - write only by functions, read by authenticated users
    match /giftCodes/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }

    // User gift history - read only own data
    match /users/{userId}/giftHistory/{docId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Only backend can write
    }

    // Redemptions - read only own data
    match /redemptions/{docId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if false; // Only backend can write
    }
  }
}
```

## Step 6: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:redeemGiftCode
firebase deploy --only functions:sendGift
```

## Step 7: Verify Deployment

After deployment:

1. Go to Firebase Console → Functions
2. Verify both functions are listed as "ACTIVE"
3. Test with Firestore emulator or call from app

## Step 8: Call Functions from App

The app already imports these functions:

```typescript
// In RedeemGiftScreen.tsx (line 89-90)
const functions = getFunctions();
const redeemGiftCode = httpsCallable(functions, 'redeemGiftCode');

// In SendGiftScreen.tsx
const sendGift = httpsCallable(functions, 'sendGift');
```

## Troubleshooting

### Issue: "Cannot find module firebase-admin"
**Solution**: Ensure firebase-admin is in `functions/package.json` dependencies

### Issue: "Function not found"
**Solution**: Deploy functions first, then clear app cache

### Issue: "Permission denied" error
**Solution**: Update Firestore security rules and ensure user is authenticated

## Testing Locally

Use Firebase Emulator:

```bash
firebase emulators:start
```

Update app to use emulator:
```typescript
connectEmulator('http://localhost:5001');
```

## Next Steps

After deployment:
1. Create Firestore collections (see Step 3 in main guide)
2. Test gift sending from app
3. Monitor functions in Firebase Console
4. Set up email service (SendGrid or similar)
