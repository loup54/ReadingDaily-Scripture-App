# Future Work Queue
**Last Updated:** February 25, 2026
**Current Version:** 1.1.7 (Build 118) - IN DEVELOPMENT
**Status:** 🎉 v1.1.6 APPROVED - Re-enabling lifetime purchase in v1.1.7

---

## Current Status

### Version 1.1.7 (Build 118) - IN PROGRESS
- **Status:** 🔧 CODE CHANGES COMPLETE (February 25, 2026)
- **Changes:** Re-enabled lifetime purchase ($49.99)
- **Next:** Build, test in TestFlight, submit to Apple
- **Expected Submission:** February 25-26, 2026
- **Expected Approval:** February 27-March 1, 2026 (1-3 days after submission)

### Version 1.1.6 (Build 117) - LIVE ✅
- **Status:** ✅ APPROVED and LIVE on App Store (February 24, 2026)
- **App Store URL:** https://apps.apple.com/app/readingdaily-scripture/id6753561999
- **Features:** Monthly/yearly subscriptions, 7-day trial, TTS pronunciation
- **Deferred to v1.1.7:** Lifetime purchase (NOW BEING ADDED)

---

## Version 1.1.7 - High Priority (After v1.1.6 Approval)

### 1. Re-enable Lifetime Purchase ⭐ IN PROGRESS
**Priority:** P0 - First task after approval
**Effort:** 1-2 hours
**Status:** ✅ CODE CHANGES COMPLETE (Feb 25, 2026)

**Files to Modify:**
- `src/screens/subscription/SubscriptionScreen.tsx`
  - Uncomment `handlePurchase()` function (lines 51-80)
  - Uncomment lifetime tier UI (lines 493-589)

**Testing Required:**
- ✅ Verify lifetime purchase modal appears in TestFlight
- ✅ Verify StoreKit processes purchase successfully
- ✅ Verify purchase confirmation flow works
- ✅ Verify restore purchases includes lifetime

**Why Deferred:** Non-Consumable IAP products need Apple Review approval before TestFlight recognizes them. After v1.1.6 is approved, the product will become available.

**Expected Result:** Lifetime purchase will work immediately in TestFlight after v1.1.6 approval.

---

### 2. Fix Send a Gift Feature ⭐ HIGH PRIORITY
**Priority:** P1 - Second task after lifetime is working
**Effort:** 4-8 hours (debugging + testing)
**Status:** Requires Firebase auth token fix

**Problem:** Firebase Cloud Function auth token becomes invalid after app reinstall, causing "Please sign in again" errors even for logged-in users.

**Options to Investigate:**
**A) Client-Side Token Refresh (Recommended)**
- Implement token refresh on app start
- Check token validity before Cloud Function calls
- Automatically re-authenticate if token expired
- **Files:** `src/config/firebase.ts`, `src/stores/useAuthStore.ts`

**B) Server-Side Token Validation Update**
- Update Cloud Function to accept longer-lived tokens
- Implement custom token generation with longer expiry
- **Files:** `functions/src/gifting/sendGift.ts`

**C) Alternative Auth Approach**
- Use Firestore security rules instead of Cloud Functions
- Store gift codes in Firestore with uid-based access control
- Eliminate need for Cloud Function auth entirely
- **Files:** New Firestore schema, remove Cloud Function dependency

**Testing Required:**
- ✅ Verify gift sending works after app reinstall
- ✅ Verify logged-in users can send gifts without re-auth
- ✅ Verify guest users see "Account Required" message
- ✅ Verify gift codes are generated and stored correctly

**Files to Re-enable:**
- `src/screens/subscription/SubscriptionScreen.tsx` - Re-enable buttons
- `src/screens/subscription/SendGiftScreen.tsx` - May need auth fixes

---

### 3. Re-enable Redeem Gift Code ⭐ MEDIUM PRIORITY
**Priority:** P2 - After Send a Gift is fixed
**Effort:** 1 hour (just re-enable button)
**Status:** Dependent on Send a Gift working

**Files to Modify:**
- `src/screens/subscription/SubscriptionScreen.tsx`
  - Re-enable "Redeem a Gift Code" button
  - Verify navigation to redeem screen works

**Testing Required:**
- ✅ Verify button appears for all users
- ✅ Verify navigation to redeem screen
- ✅ Verify gift code validation works
- ✅ Verify successful redemption flow

---

### 4. Improve IAP Error Messages
**Priority:** P2 - UX improvement
**Effort:** 2-3 hours
**Status:** Enhancement

**Current Issue:** Generic error messages like "Purchase Failed" don't help users understand what went wrong.

**Improvements Needed:**
- Map StoreKit error codes to user-friendly messages
- Provide actionable next steps (e.g., "Check your payment method in Settings")
- Distinguish between user cancellation vs. actual errors
- Add retry buttons for transient errors

**Files to Modify:**
- `src/services/payment/AppleIAPService.ts` - Error mapping
- `src/screens/subscription/SubscriptionScreen.tsx` - Error display

**Example Error Messages:**
```
E_USER_CANCELLED → "Purchase cancelled"
E_NETWORK_ERROR → "Network error. Check your connection and try again."
E_ALREADY_OWNED → "You already own this product. Tap 'Restore Purchases' to activate it."
E_ITEM_UNAVAILABLE → "This product is currently unavailable. Try again later."
```

---

## Version 1.1.8+ - Medium Priority

### 5. Add Purchase Confirmation Screen
**Priority:** P3 - UX enhancement
**Effort:** 4-6 hours
**Status:** Planning

**Description:** After successful purchase, show a dedicated confirmation screen with:
- Success animation (checkmark, confetti)
- Clear summary of what was purchased
- Benefits reminder
- Call-to-action to start using features

**Benefits:**
- Better user experience
- Reduces support questions "Did my purchase work?"
- Opportunity to guide users to key features

**Files to Create:**
- `src/screens/subscription/PurchaseConfirmationScreen.tsx`
- Update navigation in `SubscriptionScreen.tsx`

---

### 6. Implement Receipt Validation
**Priority:** P3 - Security improvement
**Effort:** 8-12 hours
**Status:** Planning

**Description:** Server-side receipt validation to prevent IAP fraud.

**Implementation:**
- Send purchase receipt to Firebase Cloud Function
- Validate with Apple's App Store API
- Store validated purchase in Firestore
- Sync validated purchases across devices

**Benefits:**
- Prevents IAP piracy/fraud
- Enables cross-device purchase sync
- Better analytics on actual revenue
- Required for business tier

**Files to Create:**
- `functions/src/iap/validateReceipt.ts`
- Update `AppleIAPService.ts` to call validation

---

### 7. Add Family Sharing Support
**Priority:** P4 - Feature request
**Effort:** 6-10 hours
**Status:** Planning

**Description:** Allow users to share IAP purchases with family members via Apple Family Sharing.

**Implementation:**
- Enable Family Sharing in App Store Connect
- Update IAP service to handle shared purchases
- Test with multiple Apple IDs in family group

**Files to Modify:**
- `src/services/payment/AppleIAPService.ts`
- App Store Connect settings

---

## Version 1.2+ - Low Priority

### 8. Add Subscription Management
**Priority:** P5 - Convenience feature
**Effort:** 4-6 hours
**Status:** Planning

**Description:** In-app subscription management (cancel, change tier, etc.)

**Current:** Users must go to iOS Settings → Apple ID → Subscriptions
**Proposed:** Deep link to subscription management from app settings

**Implementation:**
- Add "Manage Subscription" button in Settings
- Deep link to App Store subscription management
- Display current subscription status

---

### 9. Implement Promo Codes
**Priority:** P5 - Marketing feature
**Effort:** 2-4 hours
**Status:** Planning

**Description:** Support Apple promotional codes for free trials or discounts.

**Implementation:**
- Create promo codes in App Store Connect
- Add "Redeem Code" button in app
- Test redemption flow

---

### 10. Add Gift Card Support
**Priority:** P6 - Alternative payment
**Effort:** 10-15 hours
**Status:** Planning

**Description:** Allow users to purchase with Apple Gift Cards.

**Note:** This is automatically supported by StoreKit. Just needs testing and documentation.

---

### 11. Subscription Analytics Dashboard
**Priority:** P6 - Business intelligence
**Effort:** 15-20 hours
**Status:** Planning

**Description:** Admin dashboard showing:
- Subscription conversion rates
- Monthly Recurring Revenue (MRR)
- Churn rate
- Popular tiers
- Trial conversion rates

**Files to Create:**
- `src/screens/admin/SubscriptionAnalyticsScreen.tsx`
- Firebase Analytics custom events
- Firestore aggregation queries

---

## Technical Debt Queue

### TD-1: Update react-native-iap to Latest
**Priority:** P3
**Current Version:** 14.7.6
**Latest Version:** Check npm for latest
**Effort:** 2-4 hours (testing)
**Status:** Monitor for breaking changes

**Action:**
1. Check changelog for v15+ releases
2. Test in development build
3. Update if no breaking changes
4. Verify all IAP flows work

---

### TD-2: Remove Firebase auth.currentUser Checks
**Priority:** P4
**Effort:** 2-3 hours
**Status:** Code cleanup

**Problem:** Mixing Firebase `auth.currentUser` with Zustand `user` causes reactivity issues.

**Solution:** Use Zustand consistently everywhere:
```typescript
// Bad
if (auth.currentUser) { ... }

// Good
const { user, isGuest } = useAuthStore();
if (user && !isGuest) { ... }
```

**Files to Search:**
- Grep for `auth.currentUser` usage
- Replace with Zustand store access
- Test auth-dependent features

---

### TD-3: Consolidate IAP Error Handling
**Priority:** P4
**Effort:** 3-4 hours
**Status:** DRY refactoring

**Problem:** Error display logic duplicated across screens.

**Solution:** Create centralized error handler:
```typescript
// src/utils/iap/displayIAPError.ts
export function displayIAPError(error: IAPError) {
  const userMessage = mapErrorToMessage(error);
  Alert.alert('Purchase Error', userMessage, [
    { text: 'OK' },
    { text: 'Try Again', onPress: () => retry() }
  ]);
}
```

---

### TD-4: Add Automated IAP Testing
**Priority:** P5
**Effort:** 8-12 hours
**Status:** Testing improvement

**Problem:** IAP flows can only be tested manually in TestFlight.

**Solution:** Mock StoreKit for unit tests:
- Create mock RNIap implementation
- Test purchase flows with mocked responses
- Test error handling paths
- Test edge cases (network errors, cancellation, etc.)

**Files to Create:**
- `src/services/payment/__mocks__/react-native-iap.ts`
- `src/services/payment/__tests__/AppleIAPService.test.ts`

---

## Visual Hierarchy Enhancements (Phase 9+)

### Deferred from Previous Sessions

**Documents Filed:**
- ✅ `VISUAL_HIERARCHY_ENHANCEMENT_PLAN.md` - Strategic overview
- ✅ `DETAILED_IMPLEMENTATION_PHASES_8A_TO_9.3.md` - Week-by-week roadmap

**Status:** 📋 FILED FOR POST-LAUNCH
**Timeline:** Review 4-6 weeks after v1.1.6 launch
**Scope:** 3 phases, 9 components, 6 major improvements

**When to Review:**
- After v1.1.6 is stable in production
- After v1.1.7 lifetime + gifting are working
- After collecting user feedback data
- After establishing baseline metrics

**Key Phases:**
- **Phase 8A:** Monitoring & data collection (4 weeks)
- **Phase 8B:** Brand kit & component specs (3 weeks)
- **Phase 9.1-9.3:** Incremental UI/UX improvements (7 weeks)

---

## Metrics to Track (Starting v1.1.6)

### IAP Metrics
- **Subscription Conversion Rate:** % of users who subscribe
- **Trial Start Rate:** % of users starting 7-day trial
- **Trial Conversion Rate:** % of trials converting to paid
- **Monthly vs Yearly:** Purchase preference split
- **Restore Usage:** % of users using restore purchases
- **Average Revenue Per User (ARPU)**
- **Monthly Recurring Revenue (MRR)**

### After v1.1.7 Launch
- **Lifetime vs Subscription:** Purchase preference
- **Lifetime Revenue:** Total from one-time purchases
- **Gifting Adoption:** % of users sending gifts
- **Gifting Success Rate:** % of gifts redeemed
- **Gift Redemption Time:** Avg time from send to redeem

### App Health Metrics
- **Crash Rate:** Target < 0.1%
- **Daily Active Users (DAU)**
- **Monthly Active Users (MAU)**
- **Session Duration**
- **Feature Usage:** Which features are most used

---

## Priority Matrix

```
P0 (Critical - Do Immediately After Approval):
├── Re-enable Lifetime Purchase (v1.1.7)

P1 (High - Next Sprint):
├── Fix Send a Gift Feature (v1.1.7)

P2 (Medium - Next 2-4 Weeks):
├── Re-enable Redeem Gift Code (v1.1.7)
├── Improve IAP Error Messages (v1.1.8)

P3 (Medium - Next 1-2 Months):
├── Add Purchase Confirmation Screen (v1.1.8)
├── Implement Receipt Validation (v1.1.8)
├── TD-1: Update react-native-iap
├── TD-2: Remove auth.currentUser checks

P4 (Low - Next 2-3 Months):
├── Add Family Sharing Support (v1.2)
├── TD-3: Consolidate IAP error handling

P5 (Low - Future):
├── Add Subscription Management (v1.2)
├── Implement Promo Codes (v1.2)
├── TD-4: Add automated IAP testing

P6 (Very Low - Backlog):
├── Add Gift Card Support (v1.2+)
├── Subscription Analytics Dashboard (v1.2+)
```

---

## Estimated Timeline

```
Week 1 (Feb 20-27):
├── ⏳ Wait for Apple approval (1-3 days)
├── ✅ Re-enable lifetime purchase
├── ✅ Test lifetime in TestFlight
├── 🚀 Submit v1.1.7 to Apple

Week 2-3 (Feb 28 - Mar 13):
├── 🔧 Fix Send a Gift auth issues
├── ✅ Re-enable gift redemption
├── 🧪 Test gifting flows
├── 🚀 Submit v1.1.8 to Apple

Week 4-5 (Mar 14-27):
├── 📊 Collect metrics from v1.1.6/7/8
├── 💬 Gather user feedback
├── 🎨 Improve error messages
├── ✨ Add confirmation screen

Month 2+ (April onwards):
├── 🔐 Receipt validation
├── 👨‍👩‍👧‍👦 Family sharing
├── 📈 Analytics dashboard
├── 🧹 Technical debt cleanup
```

---

## How to Use This Document

### When v1.1.6 Gets Approved:
1. ✅ Celebrate! 🎉
2. ✅ Immediately start work on "Re-enable Lifetime Purchase"
3. ✅ Test lifetime purchase in TestFlight (should work now)
4. ✅ Submit v1.1.7 within 24-48 hours

### When v1.1.7 is Live:
1. ✅ Begin "Fix Send a Gift Feature" investigation
2. ✅ Choose auth fix approach (A, B, or C)
3. ✅ Implement and test thoroughly
4. ✅ Submit v1.1.8 when ready

### When Planning Sprints:
1. ✅ Refer to Priority Matrix
2. ✅ Pick P0/P1 items first
3. ✅ Balance features vs. technical debt
4. ✅ Consider user feedback when prioritizing

### When Reviewing Metrics:
1. ✅ Check "Metrics to Track" section
2. ✅ Compare against baseline
3. ✅ Adjust priorities based on data
4. ✅ Use insights to guide v1.2+ features

---

## Quick Links

### Current Work
- **Status:** [APPLE_SUBMISSION_STATUS.md](./APPLE_SUBMISSION_STATUS.md)
- **Build History:** Git log Feb 2-20, 2026
- **App Store Connect:** https://appstoreconnect.apple.com/apps/6753561999

### Future Planning
- **Visual Enhancements:** [VISUAL_HIERARCHY_ENHANCEMENT_PLAN.md](./VISUAL_HIERARCHY_ENHANCEMENT_PLAN.md)
- **Phase 9 Roadmap:** [DETAILED_IMPLEMENTATION_PHASES_8A_TO_9.3.md](./DETAILED_IMPLEMENTATION_PHASES_8A_TO_9.3.md)

### Reference Docs
- **Project Roadmap:** [PROJECT_ROADMAP_STATUS.md](./PROJECT_ROADMAP_STATUS.md)
- **Deployment:** [PHASE_8_DEPLOYMENT_MIGRATION_PLAN.md](./PHASE_8_DEPLOYMENT_MIGRATION_PLAN.md)

---

## Document Status

**Created:** February 20, 2026
**Last Updated:** February 20, 2026
**Next Review:** After v1.1.6 Apple approval
**Owner:** Development Team
**Status:** ✅ Active - Reference for all future work

---

*This document is the single source of truth for future development work.*
*Update after each version release and sprint planning session.*
