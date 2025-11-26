# Subscription Gifting System Design

## Overview

This document outlines a comprehensive subscription gifting system that allows users to:
1. **Gift subscriptions** to other users (friends, family)
2. **Receive gifted subscriptions** with special redemption codes
3. **Track gifting history** and redemptions
4. **Manage gift expiration** and cleanup
5. **Earn gamification rewards** from gifting

## Use Cases

### 1. Contest Prize
- Organizer buys subscription gifts for contest winners
- Recipients get code via email or in-app notification
- Code redeemable without payment method

### 2. Friend Gift
- User buys subscription for friend
- Friend gets unique redemption code
- Can be from app or gift card generation

### 3. Promotional Campaign
- Business gives away subscription codes
- Bulk generation of codes
- Tracking redemption rates

### 4. Family Sharing
- Parent buys subscription for children's accounts
- Each child gets own code
- Can expire after set period

### 5. Referral Rewards
- Existing user refers friend
- Both get subscription gift
- Tracked for analytics

## Architecture

### 1. Database Schema

#### Gift Codes Collection
```typescript
interface GiftCode {
  // Identity
  giftCodeId: string; // Unique code (e.g., "GIFT-ABC123-XYZ")

  // Ownership & Purchase
  purchaserId: string; // Who bought the gift
  purchaserEmail: string; // For contact/receipt
  purchaseDate: Timestamp;
  purchaseAmount: number;
  paymentMethod: 'apple_pay' | 'google_play' | 'stripe';

  // Gift Details
  subscriptionTier: 'basic' | 'premium' | 'lifetime';
  giftDurationMonths: number; // null for lifetime
  message?: string; // Personal message to recipient

  // Recipient
  recipientEmail?: string; // Pre-assigned recipient (optional)
  recipientUserId?: string; // If already redeemed

  // Status
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  redeemedAt?: Timestamp;
  redeemedBy?: string; // User ID who redeemed

  // Expiration & Validity
  expiresAt: Timestamp; // When code becomes invalid
  expirationDays: number; // Original expiration period (default: 365)

  // Metadata
  giftCategory: 'personal' | 'promotional' | 'contest' | 'referral' | 'corporate';
  campaign?: string; // Campaign name if applicable
  trackingId?: string; // For analytics

  // Redemption
  redeemCode: string; // 12-char code user enters (uppercase, no special chars)

  // Analytics
  emailsSent: number;
  emailSentAt?: Timestamp;
  viewedAt?: Timestamp;
}
```

#### Gift Redemptions Collection (Audit Trail)
```typescript
interface GiftRedemption {
  redemptionId: string;
  giftCodeId: string;
  userId: string;
  userEmail: string;
  redeemedAt: Timestamp;
  redeemCode: string;
  ipAddress: string;
  deviceId: string;
  status: 'successful' | 'failed';
  failureReason?: string;
}
```

#### User Gift History (Subcollection)
```typescript
interface UserGiftHistory {
  // Gifts received
  giftsReceived: {
    giftCodeId: string;
    fromUserEmail?: string;
    giftMessage?: string;
    tier: string;
    redeemedAt: Timestamp;
    expiresAt: Timestamp;
  }[];

  // Gifts sent
  giftsSent: {
    giftCodeId: string;
    toUserEmail?: string;
    sentAt: Timestamp;
    status: 'pending' | 'redeemed' | 'expired';
    redeemedAt?: Timestamp;
  }[];

  // Referral stats
  referralStats?: {
    totalGiftsGiven: number;
    totalGiftsRedeemed: number;
    totalValueGiven: number;
    bonusSubscriptions: number; // Earned through referrals
  };
}
```

### 2. Service Architecture

#### SubscriptionGiftingService
```typescript
class SubscriptionGiftingService {
  // Code Generation & Management
  generateGiftCode(config: GiftCodeConfig): Promise<GiftCode>;
  bulkGenerateGiftCodes(quantity: number, config: GiftCodeConfig): Promise<GiftCode[]>;
  redeemGiftCode(code: string, userId: string): Promise<RedemptionResult>;
  validateGiftCode(code: string): Promise<ValidationResult>;

  // Code Lookup
  getGiftCodeStatus(code: string): Promise<GiftCode>;
  getUserGiftHistory(userId: string): Promise<UserGiftHistory>;

  // Sending Gifts
  sendGiftToEmail(email: string, giftCodeId: string): Promise<boolean>;
  sendBulkGifts(emails: string[], giftCodeId: string): Promise<BulkSendResult>;

  // Gift Management
  cancelGiftCode(giftCodeId: string): Promise<boolean>;
  extendGiftExpiration(giftCodeId: string, days: number): Promise<boolean>;

  // Analytics
  getGiftingAnalytics(dateRange: DateRange): Promise<GiftingAnalytics>;
  getRedemptionRate(): Promise<number>;
}
```

#### Cloud Functions

**Function 1: createGiftCode**
```typescript
exports.createGiftCode = functions.https.onCall(async (data, context) => {
  // Authenticate user
  // Verify payment method
  // Validate gift amount
  // Generate unique code
  // Create gift code document
  // Return code to user
  // Send receipt email
});
```

**Function 2: redeemGiftCode**
```typescript
exports.redeemGiftCode = functions.https.onCall(async (data, context) => {
  // Validate code exists and is active
  // Check expiration
  // Check not already redeemed
  // Apply subscription to user
  // Create redemption record
  // Send confirmation email
  // Update user gift history
});
```

**Function 3: sendGiftEmail**
```typescript
exports.sendGiftEmail = functions.firestore
  .document('giftCodes/{giftCodeId}')
  .onUpdate(async (change) => {
    // Trigger on status change
    // Send email with code
    // Include redemption link
    // Track email send
  });
```

**Function 4: cleanupExpiredCodes**
```typescript
exports.cleanupExpiredCodes = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .onRun(async () => {
    // Find all expired codes
    // Mark as expired
    // Send notification to purchaser if unclaimed
    // Archive old codes
  });
```

### 3. UI Components

#### Gift Code Generation Screen
```typescript
export const CreateGiftScreen: React.FC = () => {
  // Step 1: Select recipient method
  // - Email address
  // - Generate code only
  // - Bulk codes

  // Step 2: Select subscription tier
  // - Basic (monthly/yearly)
  // - Premium (monthly/yearly)
  // - Lifetime

  // Step 3: Add personal message
  // - Optional message to recipient
  // - Gift occasion (birthday, holiday, etc)

  // Step 4: Review & Purchase
  // - Show price
  // - Payment method
  // - Confirmation

  // Step 5: Share Code
  // - Copy code
  // - Share via email/SMS/social
  // - Download receipt
};
```

#### Gift Code Redemption Screen
```typescript
export const RedeemGiftScreen: React.FC = () => {
  // Input field for code
  // - Auto-format input (GIFT-ABC123-XYZ)
  // - Real-time validation
  // - "Can't find your code?" help

  // Show gift details if valid
  // - Tier and duration
  // - Message from sender
  // - Expiration date

  // Redemption button
  // - "Redeem Now"
  // - Apply to account
  // - Confirm subscription activated
};
```

#### Gift History Screen
```typescript
export const GiftHistoryScreen: React.FC = () => {
  // Tabs: Received | Sent | Rewards

  // Received Gifts
  // - List of redeemed gifts
  // - From whom (if known)
  // - When received
  // - Expiration details

  // Sent Gifts
  // - Gifts given to others
  // - Status (pending, redeemed, expired)
  // - Recipient email
  // - Actions (resend, cancel, extend)

  // Referral Rewards
  // - Total gifted count
  // - Total redeemed count
  // - Bonuses earned
  // - Next tier unlock
};
```

## Implementation Strategy

### Phase 1: Core Gifting (Week 1-2)
1. Create database schema (Gift Codes, Redemptions)
2. Build SubscriptionGiftingService
3. Implement code generation algorithm
4. Create Cloud Functions for redemption
5. Build basic UI for code input
6. Test with internal QA

### Phase 2: Sender Experience (Week 3)
1. Create gift creation flow
2. Add payment integration
3. Build code sharing UI
4. Add email notifications
5. Implement gift tracking dashboard

### Phase 3: Enhanced Features (Week 4-5)
1. Add bulk code generation
2. Implement gift expiration handling
3. Add analytics/reporting
4. Create referral system
5. Add gamification (badges, rewards)

### Phase 4: Polish & Scale (Week 6+)
1. Performance optimization
2. Security audit
3. Fraud prevention enhancements
4. Marketing materials
5. User documentation

## Security Considerations

### 1. Code Generation
```typescript
// Never predictable
- Use cryptographically secure random generation
- Combine: timestamp + random + checksum
- Format: "GIFT-{XXXXXXXX}-{XXXX}" (12 alphanumeric)
- Case-insensitive validation
```

### 2. Redemption Security
```typescript
// Prevent abuse
- Rate limiting on redemption attempts
- Max 10 attempts per IP per hour
- Track redemption IP/device
- One code = one redemption
- Check user not already has active sub
```

### 3. Email & Delivery
```typescript
// Verify legitimacy
- Send from verified domain
- Include unique link (not just code)
- Link expires after 30 days
- Sender info in email
- Unsubscribe handling
```

## Pricing Model

### Options:

**Option 1: Add-On**
- User pays for subscription + gifting fee
- Example: Basic ($4.99) + Gift = $5.49

**Option 2: Same Price**
- Gift costs same as subscription
- Volume discount for bulk purchases

**Option 3: Markup**
- Gift costs slightly more (5-10% markup)
- Example: Basic ($4.99) → Gift = $5.49

**Recommendation**: Option 2 (Same Price)
- Simpler for users
- Encourages sharing
- Lower friction for first-time gifters

## Database Queries & Indexing

### Critical Indexes
```
1. giftCodes: status + expiresAt
2. giftCodes: purchaserId + purchaseDate
3. giftCodes: redeemCode (unique)
4. giftRedemptions: giftCodeId + userId
5. giftRedemptions: redeemedAt (for analytics)
```

### Key Queries
```typescript
// Find active unexpired codes
where status = 'active' AND expiresAt > now()

// Find codes for user (gifts given)
where purchaserId = userId AND purchaseDate > X_days_ago

// Find redeemed codes for user
where recipientUserId = userId

// Monthly revenue from gifts
where purchaseDate > startMonth AND status = 'redeemed'
```

## Email Templates

### 1. Gift Received Notification
```
Subject: You've received a gift subscription!

Hi [Recipient],

[Sender Name] just gifted you a [Tier] subscription to Reading Daily!

Your Code: [CODE] (12 characters)
Gift Message: [Optional message]
Expires: [Date]

[Redeem Button] [Learn More]
```

### 2. Receipt for Purchaser
```
Subject: Gift Purchase Confirmation

Thank you for your gift purchase!

Amount: $[Price]
Recipient: [Email]
Code: [CODE]
Tier: [Subscription Tier]
Duration: [Months]

Status: [Sent/Pending/Redeemed]
Redeem Link: [Link]
```

### 3. Redemption Confirmation
```
Subject: Your gift subscription is ready!

Congratulations! Your gift has been redeemed.

Subscription Active: [Start Date]
Expires: [End Date]
Features: [List all features]

[Start Using] [View Account]
```

## Analytics & Reporting

### Key Metrics

**Conversion Metrics**
- Codes generated (daily/monthly)
- Codes redeemed (daily/monthly)
- Redemption rate (%)
- Time to redemption (average)

**Revenue Metrics**
- Total revenue from gifts
- Average gift value
- Revenue per purchaser
- Repeat gifters (%)

**Engagement Metrics**
- Users who gift (%)
- Multiple gifts per user
- Gifts per redeemed user
- Referral chain length

**Fraud Metrics**
- Codes flagged as suspicious
- Redemptions blocked
- Bulk generation patterns
- Email bounces/spam complaints

## Testing Checklist

- [ ] Code generation is truly random
- [ ] Code format validation works
- [ ] Expiration logic blocks after cutoff
- [ ] One-time redemption enforced
- [ ] Email sending succeeds
- [ ] Subscription activates on redemption
- [ ] Duplicate code generation prevented
- [ ] Rate limiting works
- [ ] Fraud detection alerts
- [ ] Analytics accurate
- [ ] Cross-platform works (iOS/Android)
- [ ] Offline handling graceful
- [ ] Performance acceptable at scale

## Rollout Strategy

### Beta Phase (Week 1)
- Internal testing only
- 100 test accounts
- Manual code distribution

### Limited Beta (Week 2)
- Invite 100 real users
- Monitor for issues
- Gather feedback

### Public Beta (Week 3)
- Available to all users
- Feature flags for gradual rollout
- Monitor error rates

### Full Launch (Week 4)
- Remove feature flags
- Full marketing campaign
- Support team trained

## Future Enhancements

1. **Physical Gift Cards**
   - Print codes on cards
   - Ship to recipients
   - Track card redemptions

2. **Social Gifting**
   - Share on social media
   - Social proof (see friends' gifts)
   - Shareable leaderboards

3. **Group Gifts**
   - Multiple people contribute
   - Pool money for premium gift
   - Split payment tracking

4. **Subscription Plans**
   - Monthly gift subscription service
   - Auto-send codes to list
   - Bulk gifting automation

5. **Gift Registry**
   - Users create wishlists
   - Friends see preferences
   - Gift fulfillment tracking

## Compliance & Legal

- [ ] Terms of Service updated (no resale, personal use only)
- [ ] Privacy policy updated (email collection)
- [ ] GDPR compliance (email consent)
- [ ] CCPA compliance (California residents)
- [ ] App Store guidelines review
- [ ] Tax implications researched
- [ ] Fraud policy documented

## Monitoring & Maintenance

### Daily Checks
- Code generation success rate
- Redemption success rate
- Email delivery rate
- Error logs for exceptions

### Weekly Reports
- Revenue from gifts
- Top redemption codes
- Fraud detection alerts
- User feedback analysis

### Monthly Reviews
- Conversion trends
- User engagement metrics
- Feature usage stats
- Competitor analysis

## Support & FAQ

**Q: What happens if I lose my code?**
A: Check your email inbox and spam folder. If you purchased it, sign into your account to view order history.

**Q: How long is the code valid?**
A: Codes expire 1 year from purchase date. Check the expiration date in your email.

**Q: Can I gift a subscription I already have?**
A: Yes! Gift codes are independent of your own subscription.

**Q: Do I need to give my payment info to use a gift code?**
A: No, gift codes don't require payment. Just enter the code during signup.

**Q: Can I gift a subscription to someone outside my country?**
A: Yes, gift codes work globally. Check local terms for restrictions.

## Success Metrics

- **Target**: 25% of new users sign up via gift code (6 months)
- **Target**: 10% of existing users gift at least once (year 1)
- **Target**: 50% redemption rate for codes (industry standard: 40-60%)
- **Target**: 3-week average time to redemption
- **Target**: <0.5% fraud rate on generated codes
