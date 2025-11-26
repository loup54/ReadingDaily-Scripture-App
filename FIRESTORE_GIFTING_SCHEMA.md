# Firestore Gifting System Schema

## Overview

This document defines the Firestore collections and document structure needed for the subscription gifting system.

**Firebase Project ID:** `readingdaily-scripture-fe502`

---

## Collection Hierarchy

```
giftCodes/
├── {giftCodeId}
│   ├── code: string (GIFT-XXXXXXXX-XXXX)
│   ├── tier: string (basic | premium | lifetime)
│   ├── status: string (active | redeemed | expired | cancelled)
│   ├── senderUserId: string
│   ├── recipientEmail: string
│   ├── recipientUserId: string (null until redeemed)
│   ├── createdAt: timestamp
│   ├── expiresAt: timestamp
│   ├── redeemedAt: timestamp (null if not redeemed)
│   ├── redeemedByUserId: string (null if not redeemed)
│   ├── personalMessage: string
│   ├── durationMonths: number (subscription length)
│   ├── price: number (USD amount)
│   └── metadata: object
│       ├── ipAddress: string
│       ├── userAgent: string
│       ├── redemptionAttempts: number
│       ├── lastAttemptAt: timestamp

users/{userId}/giftHistory/
├── {giftId}
│   ├── type: string (sent | received)
│   ├── giftCodeId: string (reference to giftCodes)
│   ├── tier: string
│   ├── recipientEmail: string (if sent)
│   ├── recipientUserId: string (if received)
│   ├── senderUserId: string (if received)
│   ├── createdAt: timestamp
│   ├── status: string (pending | completed | expired)
│   ├── expiresAt: timestamp
│   ├── personalMessage: string
│   └── durationMonths: number

redemptions/
├── {redemptionId}
│   ├── giftCodeId: string
│   ├── userId: string (user who redeemed)
│   ├── tier: string
│   ├── redeemedAt: timestamp
│   ├── durationMonths: number
│   ├── subscriptionStartDate: timestamp
│   ├── subscriptionEndDate: timestamp
│   ├── status: string (success | pending)
│   ├── ipAddress: string
│   ├── deviceId: string
│   └── metadata: object
│       ├── riskScore: number (0-100)
│       ├── fraudChecksRun: array[string]
│       └── notes: string

giftCodeStats/
├── {dateString (YYYY-MM-DD)}
│   ├── totalCreated: number
│   ├── totalRedeemed: number
│   ├── totalRevenue: number
│   ├── byTier: object
│   │   ├── basic: object (count, revenue)
│   │   ├── premium: object (count, revenue)
│   │   └── lifetime: object (count, revenue)
│   ├── redemptionRate: number (percentage)
│   └── updatedAt: timestamp
```

---

## Document Schemas

### 1. Gift Code Document (`giftCodes/{giftCodeId}`)

**Purpose:** Primary record for each gift code

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Format: GIFT-{8 ALPHANUMERIC}-{4 ALPHANUMERIC}, e.g., GIFT-ABC12345-XYZ7 |
| tier | string | Yes | Enum: basic, premium, lifetime |
| status | string | Yes | Enum: active, redeemed, expired, cancelled |
| senderUserId | string | Yes | Firebase UID of gift sender |
| recipientEmail | string | Yes | Email address of recipient |
| recipientUserId | string | No | Firebase UID (populated after redemption) |
| createdAt | timestamp | Yes | When the gift code was created |
| expiresAt | timestamp | Yes | When the gift code expires (typically 365 days from creation) |
| redeemedAt | timestamp | No | When the code was successfully redeemed |
| redeemedByUserId | string | No | Firebase UID of who actually redeemed (may differ from recipientUserId) |
| personalMessage | string | No | Custom message from sender to recipient |
| durationMonths | number | Yes | Subscription duration (12 for basic/premium, null for lifetime) |
| price | number | Yes | USD amount charged |
| metadata | object | Yes | Additional tracking data |
| metadata.ipAddress | string | No | Sender IP address |
| metadata.userAgent | string | No | Sender device/browser info |
| metadata.redemptionAttempts | number | Yes | Count of redemption attempts (default: 0) |
| metadata.lastAttemptAt | timestamp | No | Timestamp of last redemption attempt |

**Example Document:**

```json
{
  "code": "GIFT-ABC12345-XYZ7",
  "tier": "premium",
  "status": "active",
  "senderUserId": "user_123abc",
  "recipientEmail": "friend@example.com",
  "recipientUserId": null,
  "createdAt": "2025-11-26T14:30:00Z",
  "expiresAt": "2026-11-26T14:30:00Z",
  "redeemedAt": null,
  "redeemedByUserId": null,
  "personalMessage": "Happy Birthday! I hope you enjoy this gift.",
  "durationMonths": 12,
  "price": 19.99,
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "redemptionAttempts": 0,
    "lastAttemptAt": null
  }
}
```

---

### 2. User Gift History Document (`users/{userId}/giftHistory/{giftId}`)

**Purpose:** Personal record of gifts sent and received by each user

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Enum: sent, received |
| giftCodeId | string | Yes | Reference to document in giftCodes collection |
| tier | string | Yes | Subscription tier (basic, premium, lifetime) |
| recipientEmail | string | Yes | Recipient email (for sent gifts) |
| recipientUserId | string | No | Recipient UID (for received gifts after redemption) |
| senderUserId | string | Yes | Sender's Firebase UID |
| createdAt | timestamp | Yes | When the gift was created/received |
| status | string | Yes | Enum: pending, completed, expired |
| expiresAt | timestamp | Yes | When gift expires |
| personalMessage | string | No | Message from sender |
| durationMonths | number | Yes | Subscription length |

**Example: Sent Gift**

```json
{
  "type": "sent",
  "giftCodeId": "gift_xyz789",
  "tier": "premium",
  "recipientEmail": "friend@example.com",
  "recipientUserId": null,
  "senderUserId": "user_123abc",
  "createdAt": "2025-11-26T14:30:00Z",
  "status": "pending",
  "expiresAt": "2026-11-26T14:30:00Z",
  "personalMessage": "Happy Birthday!",
  "durationMonths": 12
}
```

**Example: Received Gift**

```json
{
  "type": "received",
  "giftCodeId": "gift_xyz789",
  "tier": "premium",
  "recipientEmail": null,
  "recipientUserId": "user_456def",
  "senderUserId": "user_123abc",
  "createdAt": "2025-11-26T14:30:00Z",
  "status": "completed",
  "expiresAt": "2026-11-26T14:30:00Z",
  "personalMessage": "Happy Birthday!",
  "durationMonths": 12
}
```

---

### 3. Redemption Record (`redemptions/{redemptionId}`)

**Purpose:** Audit trail of all gift code redemptions

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| giftCodeId | string | Yes | Reference to giftCodes document |
| userId | string | Yes | User who redeemed the code |
| tier | string | Yes | Subscription tier redeemed |
| redeemedAt | timestamp | Yes | Exact timestamp of redemption |
| durationMonths | number | Yes | Duration of subscription granted |
| subscriptionStartDate | timestamp | Yes | When subscription starts |
| subscriptionEndDate | timestamp | Yes | When subscription ends |
| status | string | Yes | Enum: success, pending |
| ipAddress | string | No | IP address used for redemption |
| deviceId | string | No | Mobile device ID |
| metadata | object | Yes | Fraud detection and tracking data |
| metadata.riskScore | number | Yes | Fraud risk score 0-100 |
| metadata.fraudChecksRun | array | Yes | Array of check names performed |
| metadata.notes | string | No | Admin notes |

**Example:**

```json
{
  "giftCodeId": "gift_xyz789",
  "userId": "user_456def",
  "tier": "premium",
  "redeemedAt": "2025-11-27T10:15:00Z",
  "durationMonths": 12,
  "subscriptionStartDate": "2025-11-27T10:15:00Z",
  "subscriptionEndDate": "2026-11-27T10:15:00Z",
  "status": "success",
  "ipAddress": "203.0.113.42",
  "deviceId": "device_abc123",
  "metadata": {
    "riskScore": 15,
    "fraudChecksRun": [
      "rate_limit_check",
      "ip_reputation_check",
      "device_fingerprint_check"
    ],
    "notes": "Redeemed successfully, no fraud indicators"
  }
}
```

---

### 4. Gift Statistics Document (`giftCodeStats/{YYYY-MM-DD}`)

**Purpose:** Daily statistics for gift code performance tracking

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| totalCreated | number | Yes | Total gift codes created that day |
| totalRedeemed | number | Yes | Total codes redeemed that day |
| totalRevenue | number | Yes | Revenue from new gift codes (USD) |
| byTier | object | Yes | Breakdown by subscription tier |
| byTier.basic | object | Yes | {count, revenue} |
| byTier.premium | object | Yes | {count, revenue} |
| byTier.lifetime | object | Yes | {count, revenue} |
| redemptionRate | number | Yes | Percentage of codes redeemed (0-100) |
| updatedAt | timestamp | Yes | Last update time |

**Example:**

```json
{
  "totalCreated": 42,
  "totalRedeemed": 28,
  "totalRevenue": 679.58,
  "byTier": {
    "basic": {
      "count": 10,
      "revenue": 49.90
    },
    "premium": {
      "count": 25,
      "revenue": 499.75
    },
    "lifetime": {
      "count": 7,
      "revenue": 699.93
    }
  },
  "redemptionRate": 66.67,
  "updatedAt": "2025-11-27T23:59:59Z"
}
```

---

## Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Gift codes collection
    // - Anyone can read gift codes (but not sensitive fields)
    // - Only backend functions can write
    match /giftCodes/{giftCodeId} {
      allow read: if request.auth != null;
      allow create, update, delete: if false; // Backend only

      // Allow reading specific fields for unauthenticated redemption lookup
      allow read: if request.query.limit <= 1 &&
                     resource.data.code == request.query.where('code', '==', request.query.value);
    }

    // User gift history
    // - Users can only read their own gift history
    match /users/{userId}/giftHistory/{giftId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Backend only
    }

    // Redemptions
    // - Users can only read their own redemptions
    match /redemptions/{redemptionId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if false; // Backend only
    }

    // Gift statistics
    // - Admins can read
    // - Backend functions can write
    match /giftCodeStats/{docId} {
      allow read: if false; // Admin only (can be set in custom claims)
      allow write: if false; // Backend only
    }
  }
}
```

---

## Indexes Required

Create these composite indexes in Firebase Console:

### Index 1: Gift Codes by Status and Creation Date
- Collection: `giftCodes`
- Fields:
  - status (Ascending)
  - createdAt (Descending)

### Index 2: Gift Codes by Recipient Email
- Collection: `giftCodes`
- Fields:
  - recipientEmail (Ascending)
  - createdAt (Descending)

### Index 3: Redemptions by User and Date
- Collection: `redemptions`
- Fields:
  - userId (Ascending)
  - redeemedAt (Descending)

### Index 4: Gift History by Type and Creation Date
- Collection: `users/{userId}/giftHistory`
- Fields:
  - type (Ascending)
  - createdAt (Descending)

---

## Implementation Steps

1. **Create Collections** (automatic via document creation)
2. **Set Security Rules** (via Firebase Console)
3. **Create Indexes** (via Firebase Console)
4. **Deploy Cloud Functions** (via firebase deploy)
5. **Test End-to-End** (via app)

---

## Integration with Existing Schema

**Overlaps with Current Collections:**

1. **Subscription Status Tracking**
   - Current: `users/{userId}/subscriptions/{subscriptionId}`
   - New: Will link via `redeemedByUserId` in `giftCodes`

2. **User Profiles**
   - Current: `users/{userId}` has `subscriptionTier`
   - New: Gift redemption updates this field

3. **Firebase Analytics**
   - Current: Events tracked in `analytics/events/{eventId}`
   - New: Gift-specific events can be added

---

## Notes

- All timestamps use ISO 8601 format (Z timezone)
- All currency values in USD
- Gift codes are immutable once created
- Status field is updated by Cloud Functions only
- Fraud detection metadata stored for compliance
- Statistics updated daily via scheduled Cloud Function
