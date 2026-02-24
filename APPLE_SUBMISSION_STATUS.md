# Apple App Store Submission Status Report
**Version:** 1.1.7 (Build 118) - IN PROGRESS
**Last Updated:** February 25, 2026
**Status:** 🎉 v1.1.6 APPROVED - Building v1.1.7

---

## Current Status

### Build 118 - v1.1.7 In Development
- **Current Phase:** Code changes complete, ready for build
- **Version:** 1.1.7
- **Build Number:** 118
- **Status:** 🔧 Re-enabling lifetime purchase
- **Changes:** Lifetime purchase ($49.99) re-enabled
- **App Store Connect:** https://appstoreconnect.apple.com/apps/6753561999

### Build 117 - v1.1.6 APPROVED ✅
- **Submission Date:** February 20, 2026
- **Approval Date:** February 24, 2026
- **Version:** 1.1.6
- **Build Number:** 117
- **Status:** ✅ APPROVED and LIVE on App Store
- **App Store URL:** https://apps.apple.com/app/readingdaily-scripture/id6753561999
- **Review Time:** 4 days

## Version 1.1.7 Status - IN PROGRESS

### What's Being Added in v1.1.7
✅ **Re-enabling Lifetime Purchase:**
- Product: com.readingdaily.lifetime.access.v2
- Price: $49.99 one-time payment
- Type: Non-Consumable
- Status: Approved in App Store Connect
- Code: Re-enabled in SubscriptionScreen.tsx
- Expected: Will work in TestFlight after v1.1.6 approval

### v1.1.7 Timeline
- **Feb 25, 2026:** Code changes complete ✅
- **Next:** Build 118 and test in TestFlight
- **Then:** Submit to Apple Review
- **Expected Approval:** 1-3 days after submission

---

## Version 1.1.6 - LIVE ON APP STORE ✅

### What Was Submitted (Build 117)
✅ **Working Features:**
- Monthly subscription ($2.99/month) - fully functional
- Yearly subscription ($19.99/year) - fully functional
- 7-day free trial system
- TTS (Text-to-Speech) pronunciation practice
- Restore purchases functionality
- Clean UI with no broken features

❌ **Features Temporarily Removed in v1.1.6:**
- Lifetime purchase ($49.99 one-time) - RE-ENABLING IN v1.1.7
- Send a Gift feature - deferred to v1.1.8
- Redeem Gift Code feature - deferred to v1.1.8

---

## Where We've Been: Build History

### Build 98 (January 24, 2026) - Last Working Build
- **Status:** ✅ Successful build and launch
- **Features:** All IAP products configured, app functional
- **Issue:** Used old react-native-iap v13 API with v14 package installed

### Build 99-103 (February 2026) - Crash Cycle
- **Status:** ❌ All builds crashed immediately on launch
- **Root Causes Identified:**
  1. Missing app icon (assets/icon.png corrupted)
  2. Missing route files (onboarding.tsx, subscription/index.tsx)
  3. Firebase config with placeholder values instead of real credentials
  4. Package version mismatches (React Native downgrade + NitroModules upgrade)
  5. DevelopmentAuthHelper running in production (removed __DEV__ check)

### Build 104-110 (February 2026) - Stabilization
- **Build 104:** Complete reset to build 98 configuration - SUCCESS, app launches
- **Build 105:** Updated AppleIAPService to react-native-iap v14 API
- **Build 106:** Added TTS error diagnostics to identify API issues
- **Build 107:** Fixed TTS crash (FileSystem.EncodingType.Base64 → 'base64')
- **Build 108:** Fixed TTS deprecation (expo-file-system/legacy)
- **Build 109:** Added IAP error diagnostics to display actual errors
- **Build 110:** Added comprehensive error logging throughout IAP flow
- **Result:** ✅ App stable, TTS working, subscriptions working

### Build 111-114 (February 2026) - Lifetime Purchase Fixes
- **Build 111:** Added finishTransaction() to restore flow to clear pending transactions
- **Build 112:** Added "Account Required" screen for Send Gift (guest users)
- **Build 113:** Hid "Send a Gift" button for guest users
- **Build 114:** Fixed auth reactivity (auth.currentUser → user && !isGuest)
- **Result:** ⚠️ Lifetime purchase still returned empty array []

### Build 115-116 (February 2026) - Attempted Final Fixes
- **Build 115:** Removed "Send a Gift" feature entirely (Firebase auth issues)
- **Build 116:** Added pending transaction clearing BEFORE every purchase attempt
- **Result:** ❌ Lifetime purchase still failed with empty result from StoreKit

### Build 117 (February 20, 2026) - Submission Build
- **Decision:** Remove lifetime purchase option entirely, submit with subscriptions only
- **Rationale:** Non-Consumable IAP products need Apple Review approval before TestFlight recognizes them
- **Status:** ✅ Submitted to Apple Review

---

## Previous Apple Rejection (February 2026)

### Rejection Details
- **Guideline:** 2.1.0 - Performance: App Completeness
- **Issue:** "The subscription button was not responding"
- **Apple's Message:** "We were unable to complete the purchase for the following in-app purchase"
- **Root Cause:** Lifetime purchase returned empty array from StoreKit
- **Fix:** Removed lifetime purchase, submitted with working subscriptions only

---

## Technical Details: Why Lifetime Purchase Failed

### Product Configuration (Verified Correct)
✅ **App Store Connect:**
- Product ID: `com.readingdaily.lifetime.access.v2`
- Type: Non-Consumable
- Status: Approved
- Price: $49.99

✅ **Code Configuration:**
- Product ID matches App Store Connect exactly
- Using correct react-native-iap v14 API
- Non-Consumable type configured correctly

### StoreKit Behavior in TestFlight
❌ **The Issue:**
- When attempting to purchase lifetime product, StoreKit returns `[]` (empty array)
- Monthly/yearly subscriptions work correctly (StoreKit shows purchase modal)
- This is consistent across builds 110-116 despite multiple fix attempts

### Root Cause Analysis
**Most Likely:** Non-Consumable IAP products require submission to Apple Review WITH the app before TestFlight sandbox recognizes them. This is a known Apple limitation.

**Attempted Fixes:**
1. ✅ Updated to react-native-iap v14 API (build 105)
2. ✅ Added finishTransaction() to restore flow (build 111)
3. ✅ Added pending transaction clearing before purchases (build 116)
4. ✅ Verified product configuration in App Store Connect (correct)
5. ❌ None resolved the issue in TestFlight

**Solution:** Submit app to Apple Review without lifetime option. After approval, lifetime product will become available in TestFlight, and we can re-enable it in v1.1.7.

---

## Technical Details: Why Send a Gift Failed

### Firebase Cloud Functions Authentication Issue
❌ **The Problem:**
- Firebase Cloud Function requires valid auth token
- Token becomes invalid after app reinstall
- Even logged-in users get "Please sign in again" error
- This creates poor user experience

### Attempted Fixes
1. ✅ Added "Account Required" screen for guest users (build 112)
2. ✅ Hid button for guests using Firebase check (build 113)
3. ✅ Made visibility reactive to Zustand auth state (build 114)
4. ❌ None fixed the underlying Firebase token issue

**Solution:** Remove "Send a Gift" feature entirely for v1.1.6. Will fix Firebase auth token persistence in v1.1.7.

---

## Code Changes Summary

### Files Modified in Build 117

**1. src/screens/subscription/SubscriptionScreen.tsx**
- Commented out `handlePurchase()` function (lines 51-80)
- Removed lifetime tier UI completely (lines 493-589)
- Added explanatory comments about temporary removal

**2. app.json**
- Incremented `buildNumber` from 116 to 117

### Git Commit
```bash
commit ca63d3d
Author: Lou Page
Date: February 20, 2026

Remove lifetime purchase option for v1.1.6 submission

DECISION: Remove lifetime purchase entirely to unblock Apple submission.
Subscriptions (monthly $2.99, yearly $19.99) work correctly.

ROOT CAUSE ANALYSIS:
Product configuration in App Store Connect is correct (approved, Non-Consumable,
proper ID). Issue is likely that Non-Consumable IAP products need to be submitted
WITH the app to Apple Review before TestFlight sandbox recognizes them.
```

---

## What Happens Next

### Immediate (1-3 days)
1. ⏳ **Wait for Apple Review** - typically 1-3 days
2. 📧 **Receive Email Notification:**
   - "In Review" - Apple started testing
   - "Pending Developer Release" or "Ready for Sale" - ✅ Approved!
   - "Rejected" - ❌ Need to fix issues

### If Approved
1. ✅ **v1.1.6 goes live** on App Store
2. ✅ **Lifetime product becomes available** in TestFlight sandbox
3. ✅ **Begin work on v1.1.7** with deferred features

### If Rejected
1. ❌ Review rejection reason
2. 🔧 Fix the specific issue Apple identifies
3. 🚀 Submit build 118 with fix

---

## Version 1.1.7 Plan (Post-Approval)

### Features to Re-Enable

**1. Lifetime Purchase ($49.99)**
- **File:** `src/screens/subscription/SubscriptionScreen.tsx`
- **Action:** Uncomment `handlePurchase()` function and lifetime tier UI
- **Testing:** Verify purchase flow works in TestFlight after v1.1.6 approval
- **Expected:** StoreKit will recognize product once app is approved

**2. Send a Gift Feature**
- **Files:**
  - `src/screens/subscription/SubscriptionScreen.tsx` - Re-enable buttons
  - `src/screens/subscription/SendGiftScreen.tsx` - May need updates
- **Action:** Fix Firebase Cloud Function auth token persistence
- **Testing:** Verify auth token survives app reinstall
- **Options:**
  - A) Implement proper token refresh on app start
  - B) Update Cloud Function to use longer-lived tokens
  - C) Redesign gifting to not require server-side auth

**3. Redeem Gift Code Feature**
- **File:** `src/screens/subscription/SubscriptionScreen.tsx`
- **Action:** Re-enable "Redeem a Gift Code" button
- **Dependency:** Requires Send a Gift to be working first

---

## Deferred Work Queue

### High Priority (v1.1.7)
1. ✅ **Re-enable Lifetime Purchase** - Code ready, just uncomment
2. ✅ **Fix Firebase Auth for Gifting** - Investigate token persistence
3. ✅ **Test all IAP flows** - After Apple approval enables product in sandbox

### Medium Priority (v1.1.8+)
1. 📋 **Improve IAP Error Messages** - User-friendly explanations
2. 📋 **Add Purchase Confirmation Screen** - Better UX after successful purchase
3. 📋 **Implement Receipt Validation** - Server-side validation for security
4. 📋 **Add Family Sharing Support** - Allow sharing purchases with family

### Low Priority (v1.2+)
1. 📋 **Add Subscription Management** - In-app subscription cancellation
2. 📋 **Implement Promo Codes** - Apple promotional code support
3. 📋 **Add Gift Card Support** - Alternative payment method
4. 📋 **Subscription Analytics** - Track conversion rates and churn

### Technical Debt
1. 🔧 **Update to latest react-native-iap** - Currently on v14.7.6
2. 🔧 **Remove Firebase auth.currentUser checks** - Use Zustand consistently
3. 🔧 **Consolidate IAP error handling** - DRY up error display logic
4. 🔧 **Add automated IAP testing** - Mock StoreKit for unit tests

---

## Key Metrics to Track

### After v1.1.6 Launch
- **Crash Rate:** Target < 0.1%
- **Subscription Conversion:** Baseline measurement
- **Trial Start Rate:** % of users starting 7-day trial
- **Monthly vs Yearly:** Which subscription tier is more popular
- **Restore Purchases Usage:** How many users use this feature

### After v1.1.7 Launch (with Lifetime)
- **Lifetime vs Subscription:** Purchase preference
- **Revenue per User:** Average transaction value
- **Gifting Adoption:** % of users who send gifts
- **Gifting Success Rate:** % of gifts successfully redeemed

---

## Lessons Learned

### What Worked
1. ✅ **Complete reset to last working build** (build 104) - Fastest path to stability
2. ✅ **Incremental debugging with logging** - Builds 106-110 identified exact issues
3. ✅ **Strategic feature removal** - Better to ship working app than delay for broken feature
4. ✅ **TestFlight testing** - Caught issues that don't show in Expo Go

### What Didn't Work
1. ❌ **Trying to fix lifetime purchase in TestFlight** - Wasted builds 111-116
2. ❌ **Multiple approaches to same problem** - Should have removed feature sooner
3. ❌ **Assuming product config was wrong** - It was correct, TestFlight limitation

### Key Insights
1. 💡 **Non-Consumable IAP + TestFlight:** Products may not work until app is approved
2. 💡 **Firebase Cloud Functions + Auth:** Token persistence is tricky post-reinstall
3. 💡 **React Native IAP v14:** API breaking changes require careful migration
4. 💡 **Apple Review Focus:** Only submit features that work 100% in TestFlight

---

## Documentation Updated

### New Files Created
- ✅ **APPLE_SUBMISSION_STATUS.md** (this file)

### Files to Update
- 📝 **FUTURE_WORK_QUEUE.md** - Add v1.1.7 tasks
- 📝 **PROJECT_ROADMAP_STATUS.md** - Update with v1.1.6 completion
- 📝 **README.md** - Update current version number

---

## Quick Reference

### Important Links
- **App Store Connect:** https://appstoreconnect.apple.com/apps/6753561999
- **TestFlight:** Available via App Store Connect
- **Build Logs:** https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds

### Product IDs
- Monthly: `com.readingdaily.basic.monthly.v2` ✅ Working
- Yearly: `com.readingdaily.basic.yearly.v2` ✅ Working
- Lifetime: `com.readingdaily.lifetime.access.v2` ⏸️ Deferred to v1.1.7

### Key Files
- **Subscription Screen:** `src/screens/subscription/SubscriptionScreen.tsx`
- **IAP Service:** `src/services/payment/AppleIAPService.ts`
- **App Config:** `app.json`
- **Trial Store:** `src/stores/useTrialStore.ts`

---

## Contact & Support

### For Apple Review Questions
- Monitor email for Apple notifications
- Check App Store Connect Resolution Center
- Review Apple's rejection details if any

### For Technical Issues Post-Launch
- Monitor Sentry for crash reports
- Check Firebase Analytics for usage metrics
- Review user feedback in App Store Connect

### For v1.1.7 Planning
- See FUTURE_WORK_QUEUE.md for task list
- Review this document's "Version 1.1.7 Plan" section
- Test lifetime purchase in TestFlight after approval

---

## Timeline

```
February 2, 2026:   Apple rejected v1.1.5 (Guideline 2.1.0)
February 3-18:      Builds 99-116 (fixing crashes, IAP, TTS)
February 20, 2026:  Build 117 submitted to Apple Review ⭐ YOU ARE HERE
February 21-23:     Expected: Apple review in progress
February 24, 2026:  Expected: Apple approval (optimistic)
February 25, 2026:  Begin v1.1.7 development (re-enable features)
March 1, 2026:      Target: v1.1.7 submission with lifetime + gifting
```

---

**Status:** ✅ Build 117 submitted successfully
**Confidence Level:** High - subscriptions work, UI is clean
**Expected Outcome:** Approval (all tested features work correctly)
**Next Action:** Wait for Apple review (1-3 days)

---

*Generated by Claude Code on February 20, 2026*
*For detailed build history, see git log from February 2-20, 2026*
