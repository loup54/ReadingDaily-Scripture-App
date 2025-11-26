# Gift Code System - Testing Guide

Complete end-to-end testing guide for the subscription gifting system implementation.

## Table of Contents
1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [End-to-End Testing](#end-to-end-testing)
4. [Security Testing](#security-testing)
5. [Performance Testing](#performance-testing)

---

## Unit Testing

### Code Generation (`SubscriptionGiftingService.ts`)

**Test: Unique Code Generation**
- [ ] Test `generateUniqueId()` produces unique IDs on multiple calls
- [ ] Verify format: `{timestamp}-{random}`
- [ ] Run 1000 generation attempts, verify no duplicates

**Test: Redeem Code Format**
- [ ] Test `generateRedeemCode()` produces correct format
- [ ] Expected format: `GIFT-{8 alphanumeric}-{4 alphanumeric}`
- [ ] Verify example: `GIFT-ABC12345-XYZ7`
- [ ] Run 100 generations, verify all match pattern
- [ ] Verify all characters are uppercase A-Z and 0-9

**Test: Random String Generation**
- [ ] Test `generateRandomString()` with various lengths (1, 8, 4, 20)
- [ ] Verify returns correct length
- [ ] Verify only uses A-Z and 0-9
- [ ] Run 100 calls, verify different results each time

### Code Validation (`formatGiftCode()` & `isValidGiftCodeFormat()`)

**Test: Format Validation**
```javascript
// Valid codes
isValidGiftCodeFormat('GIFT-ABC12345-XYZ7') // Should be true
isValidGiftCodeFormat('gift-abc12345-xyz7') // Should be true (case insensitive)
isValidGiftCodeFormat('GIFT-ABCDEFGH-IJKL') // Should be true

// Invalid codes
isValidGiftCodeFormat('GIFT-ABC123-XYZ') // Should be false (wrong length)
isValidGiftCodeFormat('CODE-ABC12345-XYZ7') // Should be false (wrong prefix)
isValidGiftCodeFormat('GIFT-ABC12345-XYZ') // Should be false (wrong suffix length)
isValidGiftCodeFormat('') // Should be false
isValidGiftCodeFormat('GIFT-ABC12345-XY7@') // Should be false (special char)
```

**Test: Format Correction**
```javascript
formatGiftCode('giftabc12345xyz7') // Should return 'GIFT-ABC12345-XYZ7'
formatGiftCode('GIFT ABC12345 XYZ7') // Should return 'GIFT-ABC12345-XYZ7'
formatGiftCode('GIFTABC12345XYZ7') // Should return 'GIFT-ABC12345-XYZ7'
formatGiftCode('invalid') // Should return ''
```

### Service Methods

**Test: `generateGiftCode(config)`**
- [ ] Create with basic tier
- [ ] Create with premium tier
- [ ] Create with lifetime tier
- [ ] Verify all required fields are set
- [ ] Verify status is 'active'
- [ ] Verify expiration is calculated correctly
- [ ] Save to Firestore and verify retrieval

**Test: `bulkGenerateGiftCodes(quantity, config)`**
- [ ] Generate 10 codes
- [ ] Generate 100 codes
- [ ] Generate 1000 codes
- [ ] Verify correct number generated
- [ ] Verify all are unique
- [ ] Verify all have correct tier
- [ ] Verify error handling for failed codes

**Test: `validateGiftCode(code)`**
- [ ] Validate non-existent code: should return `isValid: false`
- [ ] Validate active code: should return `isValid: true`
- [ ] Validate redeemed code: should return `isValid: false` with message
- [ ] Validate expired code: should return `isValid: false` with message
- [ ] Validate cancelled code: should return `isValid: false` with message
- [ ] Case-insensitive validation (test lowercase input)

**Test: `redeemGiftCode(code, userId, userEmail, deviceInfo)`**
- [ ] Redeem valid code
- [ ] Verify gift code status changes to 'redeemed'
- [ ] Verify redemption record is created
- [ ] Verify user gift history is updated
- [ ] Verify purchaser gift history is updated
- [ ] Verify subscription expiration is calculated correctly
- [ ] Test with lifetime duration (should be 100 years)
- [ ] Test with month duration (should be 30 days per month)

---

## Integration Testing

### Firestore Integration

**Test: Database Transactions**
- [ ] Multiple users simultaneously redeeming codes
- [ ] Verify only one redemption succeeds
- [ ] Verify no race conditions
- [ ] Verify transaction rollback on error

**Test: Collection Queries**
- [ ] Query by `redeemCode` works correctly
- [ ] Query by `purchaserId` works correctly
- [ ] Query by `status` works correctly
- [ ] Query by `expiresAt` works correctly
- [ ] Index performance (query with large dataset)

**Test: User Subcollections**
- [ ] Gift history subcollection created on first gift
- [ ] Multiple gifts added to same user
- [ ] Retrieved history contains all gifts
- [ ] Referral stats calculated correctly

### Cloud Function Integration

**Test: `redeemGiftCodeFunction`**
- [ ] Function is callable from client
- [ ] Requires authentication (verify error without auth)
- [ ] Validates input data
- [ ] Calls underlying service correctly
- [ ] Returns proper response format
- [ ] Handles errors gracefully
- [ ] Updates user subscription status

**Test: Error Handling**
- [ ] Invalid code returns error message
- [ ] Expired code returns error message
- [ ] Already redeemed returns error message
- [ ] Network error returns appropriate message
- [ ] Unknown error returns generic message

---

## End-to-End Testing

### User Flow: Create and Redeem Gift

**Setup**
- [ ] Create test user A (purchaser)
- [ ] Create test user B (recipient)
- [ ] Ensure user A has payment method
- [ ] Ensure user B is authenticated

**Scenario 1: Purchaser Creates Gift**
- [ ] User A logs in
- [ ] Navigate to gift creation screen
- [ ] Select subscription tier (basic)
- [ ] Set recipient email to User B
- [ ] Add personal message
- [ ] Complete purchase
- [ ] Verify gift code generated
- [ ] Verify receipt email sent
- [ ] Verify gift code displayed to user A

**Scenario 2: Recipient Redeems Gift**
- [ ] User B receives email with code
- [ ] User B clicks "Redeem Gift" link in email
- [ ] User B enters gift code
- [ ] Code is validated in real-time
- [ ] Gift details displayed (tier, duration, message)
- [ ] User B clicks "Redeem"
- [ ] Subscription activated
- [ ] Confirmation email sent
- [ ] User B can access premium features
- [ ] Verify subscription expiration date is correct

**Scenario 3: User Checks Gift History**
- [ ] User A views "Gifts Sent"
- [ ] Can see redeemed gift with status "Redeemed"
- [ ] Can see redemption date
- [ ] Can see recipient email
- [ ] User B views "Gifts Received"
- [ ] Can see received gift with activation date
- [ ] Can see expiration date

### UI Testing

**RedeemGiftScreen Component**
- [ ] Input field accepts codes
- [ ] Code formatting works (auto-inserts hyphens)
- [ ] Real-time validation shows checkmark for valid codes
- [ ] Error messages display for invalid codes
- [ ] "Redeem Gift" button disabled until valid code
- [ ] Loading state shows while redeeming
- [ ] Success message displays after redemption
- [ ] Help section displays properly
- [ ] All text is readable with good contrast

**Mobile Responsiveness**
- [ ] Layout works on small phones (320px)
- [ ] Layout works on medium phones (375px)
- [ ] Layout works on large phones (414px)
- [ ] Layout works on tablets (768px)
- [ ] Scrolling works smoothly
- [ ] Buttons are easily tappable (44x44 minimum)

---

## Security Testing

### Rate Limiting

**Test: User Rate Limiting**
- [ ] Allow 10 attempts per hour per user
- [ ] Block 11th attempt
- [ ] Reset counter after 1 hour
- [ ] Verify error message displayed

**Test: IP Rate Limiting**
- [ ] Allow 5 attempts per hour per IP
- [ ] Block 6th attempt
- [ ] Flag IP after 10 failed attempts
- [ ] Verify error message displayed

**Test: Device Checking**
- [ ] Flag if same device redeems 3+ codes in 1 hour
- [ ] Add to security violations
- [ ] Calculate risk score correctly

### Fraud Detection

**Test: Suspicious Patterns**
- [ ] Flag if user redeems 5+ codes in 1 day
- [ ] Flag if same IP has 3+ accounts redeeming
- [ ] Flag if new account (<24 hours) redeeming
- [ ] Block redemption if risk score > 60

**Test: Code Validation**
- [ ] Invalid format codes rejected
- [ ] Reject codes with special characters
- [ ] Reject codes with wrong length
- [ ] Reject codes with wrong prefix

**Test: Audit Trail**
- [ ] All redemption attempts logged
- [ ] Partial code stored (not full code)
- [ ] IP address logged
- [ ] Device ID logged
- [ ] Timestamp logged
- [ ] Risk score logged
- [ ] Violations logged

### Data Security

**Test: Code Exposure**
- [ ] Full codes never logged to console
- [ ] Full codes not displayed in analytics
- [ ] Email templates don't expose unnecessary info
- [ ] API responses don't leak information

**Test: User Data**
- [ ] Passwords never stored
- [ ] Biometric credentials stored securely
- [ ] User data encrypted in transit
- [ ] Gift history accessible only to user

---

## Performance Testing

### Code Generation

**Test: Single Code Generation**
- [ ] Single code generated in <100ms
- [ ] 10 codes generated in <1 second
- [ ] 100 codes generated in <10 seconds

**Test: Bulk Generation**
- [ ] 1000 codes generated in <30 seconds
- [ ] Error handling works (partial success)
- [ ] Database writes succeed

### Redemption

**Test: Redemption Speed**
- [ ] Code validation in <200ms
- [ ] Firestore update in <500ms
- [ ] Total redemption flow in <2 seconds
- [ ] Concurrent redemptions handled

**Test: Database Queries**
- [ ] Query by code returns in <100ms
- [ ] Query by user returns in <200ms
- [ ] Query by IP returns in <200ms
- [ ] Index usage verified

### Load Testing

**Test: Concurrent Users**
- [ ] 10 simultaneous redemptions
- [ ] 100 simultaneous validations
- [ ] 1000 generation requests queued
- [ ] Verify no data corruption

---

## Manual Test Cases

### Test Case 1: Basic Redemption

1. Create gift code for user@example.com
2. Share code with recipient
3. Recipient logs in
4. Navigate to "Redeem Gift"
5. Enter code: GIFT-ABC12345-XYZ7
6. Verify code is valid
7. Click "Redeem"
8. Verify success message
9. Verify subscription is active
10. Logout and login again
11. Verify subscription persists

**Expected Result:** ✅ PASS

### Test Case 2: Invalid Code

1. Navigate to "Redeem Gift"
2. Enter invalid code: INVALID-CODE-HERE
3. Verify error message: "Invalid code format"
4. Try with partial code: GIFT-ABC
5. Verify error message
6. Try with expired code (if available)
7. Verify error message: "This gift code has expired"

**Expected Result:** ✅ PASS

### Test Case 3: Already Redeemed

1. Redeem valid gift code
2. Try to redeem same code again
3. Verify error message: "This gift code has already been redeemed"

**Expected Result:** ✅ PASS

### Test Case 4: Email Notifications

1. Create gift code
2. Verify receipt email sent to purchaser
3. Verify gift notification email sent to recipient
4. Click email link in recipient notification
5. Verify redirects to redeem screen with code pre-filled
6. Redeem code
7. Verify confirmation email sent to recipient

**Expected Result:** ✅ PASS

### Test Case 5: Bulk Generation

1. Generate 50 gift codes
2. Verify all codes generated
3. Download CSV export
4. Verify CSV contains all codes
5. Verify CSV format is correct

**Expected Result:** ✅ PASS

---

## Regression Testing Checklist

After making changes, verify:

- [ ] Existing subscription system still works
- [ ] Trial system not affected
- [ ] User authentication not affected
- [ ] Payment processing not affected
- [ ] Email notifications delivery working
- [ ] Analytics not impacted
- [ ] Performance not degraded
- [ ] No new console errors
- [ ] No new TypeScript errors

---

## Sign-Off

**Completed by:** _________________
**Date:** _________________
**Status:** ☐ Pass ☐ Fail ☐ Conditional Pass

**Notes:**
```


```

---

## Appendix: Test Data

### Sample Gift Codes for Testing

```
GIFT-ABCD1234-TEST
GIFT-EFGH5678-CODE
GIFT-IJKL9012-DEMO
```

### Test User Accounts

| Role | Email | Password |
|------|-------|----------|
| Purchaser | purchaser@test.com | TestPass123! |
| Recipient | recipient@test.com | TestPass123! |
| Admin | admin@test.com | AdminPass123! |

### Test Data Scenarios

**Scenario A: Standard Redemption**
- Gift Code Status: Active
- Tier: Basic
- Duration: 12 months
- Recipient: Known email

**Scenario B: Lifetime Gift**
- Gift Code Status: Active
- Tier: Premium
- Duration: Lifetime
- Recipient: Unknown email

**Scenario C: Expired Code**
- Gift Code Status: Expired
- Created: 1 year ago
- Expiration: 1 day ago

**Scenario D: Already Redeemed**
- Gift Code Status: Redeemed
- Redeemed by: test-user-123
- Redeemed date: 30 days ago

---

## References

- [Gift Code System Design](./SUBSCRIPTION_GIFTING_SYSTEM.md)
- [SubscriptionGiftingService Documentation](./src/services/gifting/SubscriptionGiftingService.ts)
- [RedeemGiftScreen Component](./src/screens/subscription/RedeemGiftScreen.tsx)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
