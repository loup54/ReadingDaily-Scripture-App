# Receipt Validation Guide

## Overview

This document describes the server-side receipt validation system for the Reading Daily Scripture App subscription system. Receipt validation ensures that only legitimate, active subscriptions grant premium access to the app.

## Architecture

```
Client (App)
    ↓
Gets Receipt (Apple App Store / Google Play)
    ↓
ClientReceiptService.ts
    ↓
Firebase Cloud Function: validateReceipt
    ↓
ReceiptValidationService.ts
    ↓
Apple Verification API / Google Play Billing API
    ↓
Update User Subscription Status in Firestore
```

## Receipt Validation Flow

### 1. Client-Side (ClientReceiptService.ts)

```typescript
// Get receipt from App Store
const receipt = await clientReceiptService.getAppleReceipt();

// Send to backend for validation
const result = await clientReceiptService.validateAppleReceipt(receipt);

if (result.isValid) {
  // Grant premium access
  updateUserSubscriptionStatus(result.subscriptionId, result.expiryDate);
}
```

### 2. Backend Validation (Firebase Cloud Function)

The `validateReceipt` Cloud Function:
1. Authenticates the user via Firebase Auth token
2. Routes to appropriate provider (Apple or Google)
3. Validates receipt with provider's API
4. Records validated receipt for duplicate detection
5. Updates user's subscription status in Firestore

## Apple App Store Receipt Validation

### Setup

1. **Get Apple Shared Secret**
   - Go to App Store Connect
   - Apps > Your App > App Information > Subscription Key
   - Create a shared secret for your app

2. **Add to Environment Variables**
   ```
   APPLE_SHARED_SECRET=your_shared_secret_here
   ```

### Implementation Details

The validation process:

1. **Request Verification URL**
   - Production: `https://buy.itunes.apple.com/verifyReceipt`
   - Sandbox: `https://sandbox.itunes.apple.com/verifyReceipt`

2. **Send Request**
   ```typescript
   POST /verifyReceipt HTTP/1.1
   Host: buy.itunes.apple.com
   Content-Type: application/x-www-form-urlencoded

   {
     "receipt-data": "[base64 encoded receipt]",
     "password": "[shared secret]",
     "exclude-old-transactions": false
   }
   ```

3. **Check Response Status Codes**
   - `0` = Valid receipt
   - `21000` = Invalid JSON
   - `21002` = Malformed data
   - `21003` = Receipt could not be authenticated
   - `21004` = Shared secret doesn't match
   - `21005` = Receipt server unavailable
   - `21007` = Receipt is sandbox, try with production URL
   - `21008` = Receipt is production, try with sandbox URL

4. **Handle Errors**
   - If status is 21007 or 21008, retry with the other URL
   - If other error, reject the receipt

### Response Structure

```json
{
  "status": 0,
  "latest_receipt_info": [
    {
      "product_id": "basic_subscription",
      "expires_date_ms": "1735689600000",
      "original_transaction_id": "1000000123456789",
      "bundle_id": "com.readingdaily.scripture",
      "cancellation_date_ms": null,
      "in_app_ownership_type": "PURCHASED",
      "web_order_line_item_id": "1000000012345678",
      "subscription_group_identifier": "20000001",
      "is_trial_period": "false"
    }
  ],
  "receipt": {
    "in_app": [
      {
        "product_id": "basic_subscription",
        "expires_date_ms": "1735689600000",
        "original_transaction_id": "1000000123456789"
      }
    ]
  }
}
```

### Validation Checks

1. **Receipt Authenticity** - Apple signature verification
2. **Expiry Date** - Check if subscription is still active
3. **Cancellation Status** - Check for cancellation_date_ms
4. **Bundle ID** - Verify matches your app's bundle ID

## Google Play Store Receipt Validation

### Setup

1. **Create Service Account**
   - Go to Google Play Console
   - Settings > API access > Create Service Account
   - Download JSON credentials file

2. **Grant Permissions**
   - In Google Play Console, add service account
   - Grant "View app information and download bulk reports" permission

3. **Add to Environment Variables**
   ```
   GOOGLE_PLAY_SERVICE_ACCOUNT='{
     "type": "service_account",
     "project_id": "your-project",
     "private_key_id": "xxx",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "xxx@iam.gserviceaccount.com",
     "client_id": "xxx",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "xxx"
   }'
   ```

### Implementation Details

The validation process:

1. **Get Access Token**
   - Use service account credentials
   - Request JWT-based OAuth token
   - Scope: `https://www.googleapis.com/auth/androidpublisher`

2. **Call Google Play API**
   ```
   GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/subscriptions/{subscriptionId}/tokens/{token}

   Headers:
   Authorization: Bearer {access_token}
   ```

3. **Check Response**
   ```json
   {
     "kind": "androidpublisher#subscriptionPurchase",
     "startTimeMillis": "1640000000000",
     "expiryTimeMillis": "1735689600000",
     "autoRenewing": true,
     "priceCurrencyCode": "USD",
     "priceAmountMicros": "999000",
     "countryCode": "US",
     "paymentState": 1,
     "orderId": "GPA.123...",
     "linkedPurchaseToken": null,
     "cancelledStateContext": {},
     "userCancellationTimeMillis": null,
     "cancelationReason": null,
     "acknowledgementState": 1,
     "obfuscatedExternalAccountId": null,
     "obfuscatedExternalProfileId": null,
     "emailAddress": null,
     "givenName": null,
     "familyName": null,
     "profileName": null,
     "profileId": null,
     "purchaseType": 0
   }
   ```

### Validation Checks

1. **paymentState** - Must be 1 (Paid) or 2 (Pending) for valid subscriptions
2. **autoRenewing** - Must be true for active subscriptions
3. **expiryTimeMillis** - Check if subscription is still valid
4. **cancelledStateContext** - Check if subscription has been cancelled

## Duplicate Receipt Detection

### Purpose

Prevent users from using the same receipt on multiple accounts to abuse trial periods or get multiple subscription benefits.

### Implementation

1. **Hash the Receipt**
   ```typescript
   const crypto = require('crypto');
   const receiptHash = crypto
     .createHash('sha256')
     .update(receiptData)
     .digest('hex');
   ```

2. **Check for Duplicates**
   ```typescript
   const existing = await firestore
     .collection('receiptValidations')
     .where('receiptHash', '==', receiptHash)
     .limit(1)
     .get();

   if (!existing.empty && existing.docs[0].data().userId !== userId) {
     // Duplicate detected! Fraud attempt
     recordAbuseAttempt(userId, existing.docs[0].data().userId);
   }
   ```

3. **Store Receipt Record**
   ```typescript
   await firestore.collection('receiptValidations').add({
     userId,
     provider: 'apple' | 'google',
     subscriptionId: 'basic_subscription',
     receiptHash,
     originalTransactionId,
     expiryDate,
     validatedAt: timestamp,
     isValid: true,
   });
   ```

## Firestore Schema

### receiptValidations Collection

```typescript
{
  userId: string;
  provider: 'apple' | 'google';
  subscriptionId: string;
  receiptHash: string; // SHA256 hash for duplicate detection
  originalTransactionId: string; // From provider
  expiryDate: Timestamp; // When subscription expires
  validatedAt: Timestamp; // When we validated
  isValid: boolean; // Is current receipt still valid?
}
```

### receiptAbuseAttempts Collection

```typescript
{
  userId: string; // User who attempted fraud
  attemptedUserId: string; // User whose receipt they tried to use
  provider: 'apple' | 'google';
  timestamp: Timestamp;
  reason: string; // 'Duplicate receipt', etc.
}
```

### users Collection (Updated)

```typescript
{
  subscriptionStatus: 'free' | 'active' | 'cancelled' | 'past_due';
  subscriptionProvider: 'apple' | 'google' | 'stripe'; // Which provider
  subscriptionId: string;
  subscriptionExpiryDate: Timestamp;
  originalTransactionId: string; // From provider
  receiptValidatedAt: Timestamp; // When receipt was last validated
}
```

## Security Considerations

### 1. Always Validate on Server

Never trust receipt validation results from the client. Always:
- Validate receipts on your backend
- Use HTTPS for all communication
- Verify Firebase authentication tokens

### 2. Shared Secret Protection

- Store `APPLE_SHARED_SECRET` in Firebase Cloud Functions environment
- Never expose in client-side code or environment files
- Rotate regularly

### 3. Service Account Credentials

- Store `GOOGLE_PLAY_SERVICE_ACCOUNT` JSON in Firebase Secrets Manager
- Never commit to version control
- Use least-privilege scopes

### 4. Rate Limiting

```typescript
// Prevent brute force receipt validation attempts
const rateLimitKey = `receipt_validation:${userId}`;
const attemptCount = await redis.incr(rateLimitKey);

if (attemptCount > 10) {
  throw new Error('Too many validation attempts');
}

await redis.expire(rateLimitKey, 3600); // 1 hour window
```

### 5. Logging and Monitoring

```typescript
console.log('[validateReceipt] Validation attempt:', {
  userId,
  provider,
  subscriptionId,
  expiryDate,
  timestamp: new Date().toISOString(),
});

// Log fraud attempts
console.warn('[validateReceipt] Suspected fraud:', {
  userId,
  reason: 'Duplicate receipt',
  originalUserId,
  timestamp: new Date().toISOString(),
});
```

## Deployment

### 1. Add Environment Variables

```bash
# For Apple
export APPLE_SHARED_SECRET="your_shared_secret"

# For Google
export GOOGLE_PLAY_SERVICE_ACCOUNT='{"type": "service_account", ...}'
```

### 2. Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions:validateReceipt
```

### 3. Update Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Receipt validations are write-only (from Cloud Functions)
    match /receiptValidations/{document=**} {
      allow read: if hasRole(request.auth.uid, 'admin');
      allow write: if false; // Cloud Functions write this
    }

    // Abuse attempts are read-only for admins
    match /receiptAbuseAttempts/{document=**} {
      allow read: if hasRole(request.auth.uid, 'admin');
      allow write: if false;
    }

    // Users can see their own subscription status
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Cloud Functions write this
    }
  }

  function hasRole(uid, role) {
    return get(/databases/$(database)/documents/users/$(uid)).data.roles[role] == true;
  }
}
```

## Testing

### Manual Testing

```typescript
// Test Apple receipt validation
const result = await clientReceiptService.validateAppleReceipt(testReceipt);
console.log('Apple validation:', result);

// Test Google Play validation
const result = await clientReceiptService.validateGooglePlayReceipt(
  'com.readingdaily.scripture',
  'basic_subscription',
  testToken
);
console.log('Google Play validation:', result);
```

### Unit Tests

```typescript
describe('ReceiptValidationService', () => {
  it('should validate active subscriptions', async () => {
    const result = await receiptValidationService.validateAppleReceipt({
      receipt: validReceipt,
      password: sharedSecret,
    });

    expect(result.isValid).toBe(true);
    expect(result.subscriptionId).toBe('basic_subscription');
  });

  it('should reject expired subscriptions', async () => {
    const result = await receiptValidationService.validateAppleReceipt({
      receipt: expiredReceipt,
      password: sharedSecret,
    });

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('should detect duplicate receipts', async () => {
    // First validation
    await receiptValidationService.recordValidatedReceipt(
      'user1',
      validResult,
      receiptData
    );

    // Try same receipt with different user
    const abuseDocs = await getAbuseAttempts();
    expect(abuseDocs.length).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Apple Receipt Validation Fails

**Issue**: Status 21008 (Production receipt in sandbox)
**Solution**: The app is trying production receipt verification in sandbox. Check environment.

**Issue**: Status 21007 (Sandbox receipt in production)
**Solution**: The app is using sandbox receipt in production. Check if using TestFlight.

### Google Play Token Invalid

**Issue**: "Invalid purchase token"
**Solution**: Token may be expired. Refresh the token from client-side.

**Issue**: "Service account not authorized"
**Solution**: Check service account has API access in Google Play Console.

### Duplicate Receipt Blocked

**Issue**: User getting blocked as fraud
**Solution**: This is intentional. You can manually clear fraudulent flag if necessary.

## Next Steps

1. Implement the Firebase Cloud Functions
2. Deploy receipt validation endpoints
3. Integrate ClientReceiptService in your subscription UI
4. Test with sandbox/test receipts
5. Monitor fraud attempts via Firestore logs
6. Set up alerts for unusual activity
