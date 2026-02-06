# Build 83 - Step-by-Step Testing Guide

**Before Apple Submission:** Test Build 83 to verify the critical IAP fix works

---

## Prerequisites

### What You Need
- ✅ Build 83 completed (Version 1.1.5)
- ✅ Physical iOS device (iPhone/iPad) - **Simulator cannot test IAP**
- ✅ TestFlight installed on device
- ✅ Apple Sandbox test account (for IAP testing)

### Important Notes
- ⚠️ **Simulator CANNOT test real IAP** - You must use TestFlight on physical device
- ⚠️ **Sandbox account required** - Real purchases won't work in TestFlight
- ⚠️ **Don't sign in initially** - Test guest mode first

---

## Step 1: Submit Build 83 to TestFlight

### 1.1 Run Submission Command
```bash
cd ~/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
eas submit --platform ios --latest --non-interactive
```

**Expected output:**
```
✔ Submission started
✔ Uploaded to App Store Connect
✔ Submission complete
```

**Timeline:** 2-10 minutes for TestFlight processing

### 1.2 Verify Submission in App Store Connect
1. Go to: https://appstoreconnect.apple.com
2. My Apps → ReadingDaily Scripture App
3. TestFlight tab
4. **Check for:** Build 1.1.5 (83) appears in "iOS Builds" section
5. **Status should be:** "Ready to Test" or "Processing"

### 1.3 Wait for Processing
- **Processing time:** 5-15 minutes typically
- **Email notification:** Apple sends "Build Ready" email when done
- **Status check:** Refresh TestFlight page until status = "Ready to Test"

---

## Step 2: Install Build 83 on Physical Device

### 2.1 Open TestFlight App
- Launch TestFlight app on your iPhone/iPad
- Should see "ReadingDaily Scripture App"

### 2.2 Install Build 83
1. Tap "ReadingDaily Scripture App"
2. Look for Build 1.1.5 (83)
3. Tap "Install" or "Update"
4. Wait for download (~50-100 MB)
5. Tap "Open" when ready

### 2.3 Verify Version
- After app opens, check version somewhere (Settings → About if available)
- Should show: Version 1.1.5 (83)

---

## Step 3: Test Guest Mode IAP Purchase (CRITICAL)

**This is the test Apple will perform - must pass!**

### 3.1 Ensure Guest Mode Active
1. **Do NOT sign in** when app launches
2. If onboarding appears, complete it
3. You should land on Readings tab as guest
4. **Verify:** No user profile/authentication shown

### 3.2 Navigate to Subscription Screen
**Path varies - try one of these:**

**Option A:** From Settings
1. Tap Settings tab (bottom right)
2. Look for "Subscription" or "Upgrade" option
3. Tap to open subscription screen

**Option B:** From prompt
1. Try playing audio on a reading (if available)
2. Should show sign-in/subscribe prompt for guests
3. Tap "Subscribe" or "Upgrade"

**Option C:** Direct navigation
1. Look for subscription tab or menu item
2. Navigate to pricing/subscription screen

### 3.3 THE CRITICAL TEST - Purchase as Guest
**This is what Apple tests:**

1. On subscription screen, you should see 3 tiers:
   - Basic ($2.99/month)
   - Premium ($19.99/year)
   - Lifetime ($4.99 one-time)

2. **Tap "Subscribe to Basic"** (or any tier)

3. **EXPECTED BEHAVIOR (Build 83):**
   ```
   → Apple IAP prompt appears immediately ✅
   → Shows subscription details
   → Shows price ($2.99)
   → "Subscribe" button visible
   → NO sign-in requirement first ✅
   ```

4. **WRONG BEHAVIOR (Previous builds):**
   ```
   → "Please sign in" alert appears ❌
   → Forced to authenticate first ❌
   → No Apple IAP prompt ❌
   ```

### 3.4 Complete Test Purchase
**If Apple IAP prompt appears (success!):**

1. Tap "Subscribe" on Apple prompt
2. Use your **sandbox test account** credentials
   - Email: Your Apple sandbox tester email
   - Password: Sandbox account password

3. Confirm purchase (it's free in sandbox)

4. **EXPECTED after purchase:**
   - Purchase confirmation
   - OPTIONAL prompt: "Sign in to sync across devices?"
   - Choice: "Not Now" or "Create Account"
   - This optional prompt is CORRECT ✅

5. Tap "Not Now" to continue as guest

### 3.5 Verify Purchase Applied
1. Check subscription screen shows active subscription
2. Try premium features (audio, pronunciation)
3. Features should work without signing in

---

## Step 4: Test Additional Features

### 4.1 Audio Playback (Signed-In User)
1. Sign in with test account (tester@readingdaily.app / TestPass123!)
2. Navigate to a reading
3. Tap audio play button
4. **EXPECTED:** Audio plays correctly

### 4.2 Pronunciation Practice (Device Only)
1. Navigate to Practice tab
2. Select a practice sentence
3. Tap record button
4. Speak into microphone
5. **EXPECTED:** Recording works, pronunciation analyzed

### 4.3 Push Notifications
1. Go to Settings → Notifications
2. Enable daily reminders
3. Set reminder time
4. Tap "Test Notification"
5. **EXPECTED:** Test notification appears

### 4.4 Trial Flow (If Not Started)
1. Sign out (if signed in)
2. Fresh app state or reinstall
3. Should see trial available
4. Can start 7-day trial as guest
5. **EXPECTED:** Trial starts without sign-in requirement

---

## Step 5: Known Issues to Document

### Issue 1: Translation Audio Speaker
**Expected error:** Tapping speaker icon on translation shows "MediaRecorder not supported"
**Status:** Known, deferred to Build 84
**Impact:** Low - core app functions work

### Issue 2: Trial Cannot Exit (If Occurs)
**If trial is active and can't purchase:**
1. Note the behavior
2. Check trial expiration date
3. May need to clear app data to test subscription

---

## Step 6: Report Results

### Success Criteria - All Must Pass ✅
- [ ] Build 83 appears in TestFlight
- [ ] Installs on physical device successfully
- [ ] Guest mode works (no forced sign-in)
- [ ] **CRITICAL:** Guest can tap purchase → Apple IAP prompt appears
- [ ] **CRITICAL:** No sign-in required before IAP prompt
- [ ] After purchase, optional sign-in prompt (correct behavior)
- [ ] Audio playback works (signed-in users)
- [ ] App doesn't crash

### If Any Test Fails ❌
**Document:**
1. Which test failed
2. Exact error message or behavior
3. Screenshot if possible
4. Steps to reproduce

**Rollback plan:**
- Build 82 is available (but has wrong version number)
- Can rebuild with reverted code if critical failure

---

## Step 7: Proceed to Apple Submission

### If All Tests Pass ✅

**Before submitting to Apple:**
1. ✅ Guest IAP purchase works in TestFlight
2. ⚠️ **Remove IAP pricing** from App Store Connect metadata
3. ⚠️ Verify EULA uploaded

**Remove IAP Pricing (Required):**
```
App Store Connect → In-App Purchases → Each Product
→ Remove "$" or price references from:
   - Display Name (e.g., "Basic" not "Basic $2.99")
   - Description
   - Promotional images
```

**Submit to Apple:**
1. Go to App Store Connect
2. App Store tab → iOS App
3. Prepare for Submission
4. Select Build 1.1.5 (83)
5. Add review notes (see below)
6. Submit for Review

**Review Notes:**
```
Hello App Review Team,

We have fixed all issues from your January 20, 2026 review:

1. GUEST IAP PURCHASE (Guideline 5.1.1):
   ✅ Technical fix applied in Build 83
   ✅ Guest users can now purchase subscriptions without registration
   ✅ Sign-in is OPTIONAL and only offered AFTER purchase
   ✅ Tested and verified in TestFlight

2. EULA (Guideline 3.1.2):
   ✅ Custom End-User License Agreement uploaded

3. IAP PRICING (Guideline 2.3.2):
   ✅ Removed all price references from IAP metadata

Root cause: Payment service factory configuration bug prevented
real Apple StoreKit integration. This is now resolved.

Thank you!
```

---

## Quick Reference - Test Checklist

**Critical Path (10 minutes):**
```
1. Submit to TestFlight ✓
2. Install Build 83 on device ✓
3. DO NOT sign in (guest mode) ✓
4. Go to subscription screen ✓
5. Tap "Subscribe to Basic" ✓
6. VERIFY: Apple IAP prompt appears (not sign-in) ✓
7. Complete sandbox purchase ✓
8. VERIFY: Optional sign-in after purchase ✓
```

**Result:**
- ✅ Pass → Submit to Apple
- ❌ Fail → Report issue for Build 84

---

## Troubleshooting

### "No builds available in TestFlight"
- Wait 10-15 minutes after submission
- Check App Store Connect for processing status
- Refresh TestFlight app

### "Purchase failed" in TestFlight
- Verify using sandbox test account (not production Apple ID)
- Check sandbox account is active in App Store Connect
- Try different subscription tier

### "Sign in required" appears (Test fails)
- This means Build 83 didn't fix the issue
- Document exact steps
- Check console logs if possible
- May need Build 84 with additional fixes

### Cannot find subscription screen
- Try Settings → Subscription
- Try Settings → Account or Profile
- Look for "Upgrade" or "Premium" options
- Check if subscription tab exists in bottom navigation

---

## Support

**Build Information:**
- Build: 83
- Version: 1.1.5
- Build ID: fa35e189-495a-4693-b36b-ab789f803faf
- Documentation: BUILD_83_DOCUMENTATION.md

**Test Accounts:**
- Email: tester@readingdaily.app
- Password: TestPass123!

---

*Testing Guide Version: 1.0*
*Created: January 21, 2026*
*For: Build 83 Apple IAP Verification*
