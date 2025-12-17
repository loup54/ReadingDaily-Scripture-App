# Build 53 - Bug Fixes & Subscription Model Update

**Build Date:** December 17, 2025
**Branch:** migration/expo-sdk-52
**Previous Build:** 52
**Current Build:** 53

---

## 🎯 Executive Summary

Build 53 addresses critical bugs reported in user feedback and completes the subscription model implementation. All code-level issues have been resolved. Two items require operational tasks (running scraper, normal empty state behavior).

**Status:** ✅ Ready for EAS Build

---

## 📋 Issues Addressed

### ✅ **Issue #1: Subscription Model**
**Status:** FIXED (Previous Session + This Session)
**Priority:** HIGH

**Changes:**
- ✅ Removed old $5 Lifetime Access from trial expiration flow
- ✅ Added 3-tier subscription model:
  - **Basic:** $2.99/month
  - **Premium:** $19.99/year (Popular badge)
  - **Lifetime:** $59.99 one-time (Best Value badge)
- ✅ Added "Have a Coupon Code?" section with redemption button
- ✅ Updated TrialExpiredModal to show Basic/Premium tiers

**Files Modified:**
- `src/screens/subscription/SubscriptionScreen.tsx` (+332/-45 lines)
- `src/components/trial/TrialExpiredModal.tsx` (+50/-30 lines)

**Commits:**
- `ace7e4f` - Update subscription model - Add Basic/Premium/Lifetime tiers + coupon codes

---

### ✅ **Issue #2: Audio Playback Error**
**Status:** FIXED
**Priority:** CRITICAL

**Problem:** "Google Cloud API key not configured" error when trying to play audio

**Root Cause:**
- API key existed in `.env` file but was missing from `eas.json`
- EAS cloud builds don't have access to local `.env` files

**Fix:**
- ✅ Added `EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY` to `eas.json` → `preview` profile
- ✅ Added `EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY` to `eas.json` → `production` profile

**Files Modified:**
- `eas.json:23-25` (preview profile)
- `eas.json:46-48` (production profile)

**Testing Required:**
- [ ] Build with EAS
- [ ] Test audio playback on device
- [ ] Verify pronunciation practice TTS works

**Commits:**
- `822f201` - Build 53 - Bug fixes: Add Google Cloud API key, microphone permissions

---

### ⚠️ **Issue #3: Demo Reading Display**
**Status:** NOT A BUG - Expected Behavior
**Priority:** INFO

**Problem:** "First Reading (Demo)" shows on December 13, 2025

**Analysis:**
- This is **correct behavior** when actual readings don't exist in Firestore
- Reading service fallback hierarchy:
  1. Firestore (none found for 2025-12-13)
  2. Bundled JSON (only has Nov 8-9, 2025)
  3. Demo reading ← **Correctly falling back here**

**Operational Task Required:**
```bash
cd functions
source venv/bin/activate
python populate_readings.py --start-date 2025-12-01 --end-date 2025-12-31
```

**No Code Changes Needed**

---

### ✅ **Issue #4: Microphone Not Active**
**Status:** FIXED
**Priority:** HIGH

**Problem:** Microphone doesn't activate for pronunciation practice

**Root Cause:**
- Missing microphone permissions in `app.json`
- iOS requires `NSMicrophoneUsageDescription`
- Android requires `RECORD_AUDIO` permission

**Fix:**
- ✅ Added iOS microphone permission with description
- ✅ Added Android `RECORD_AUDIO` permission

**Files Modified:**
- `app.json:26-29` (iOS infoPlist)
- `app.json:45-47` (Android permissions)

**Testing Required:**
- [ ] Build with EAS
- [ ] Test pronunciation practice
- [ ] Verify permission prompt appears
- [ ] Test recording functionality

**Commits:**
- `822f201` - Build 53 - Bug fixes: Add Google Cloud API key, microphone permissions

---

### ✅ **Issue #5: Blank Notifications Screen**
**Status:** NOT A BUG - Expected Behavior
**Priority:** INFO

**Problem:** Notifications screen appears blank

**Analysis:**
- Screen is **working correctly**
- Shows proper `EmptyState` component when no notifications exist
- Includes helpful tips and "Load Test Notifications" button for QA

**What Users See:**
```
🔕 No Notifications Yet

You haven't received any notifications yet

Tips:
✓ Enable notifications in Settings → Notifications
✓ Turn on Daily Reminders to receive readings
✓ Notifications appear here when readings are available

[Load Test Notifications] ← For QA testing
```

**Files Verified:**
- `src/screens/NotificationCenterScreen.tsx:344-372` (EmptyState implementation correct)

**No Code Changes Needed**

---

### ✅ **Issue #6: Gift/Coupon Code Feature**
**Status:** IMPLEMENTED
**Priority:** MEDIUM

**Changes:**
- ✅ Added "Have a Coupon Code?" section to subscription screen
- ✅ "Enter Coupon Code" button wired to existing redemption flow
- ✅ Reuses gift code infrastructure

**Files Modified:**
- `src/screens/subscription/SubscriptionScreen.tsx:468-486`

**Commits:**
- `ace7e4f` - Update subscription model - Add Basic/Premium/Lifetime tiers + coupon codes

---

## 📊 Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Issues** | 6 |
| **Code Fixes** | 3 |
| **Expected Behaviors** | 2 |
| **Operational Tasks** | 1 |
| **Files Modified** | 4 |
| **Lines Added** | +393 |
| **Lines Removed** | -80 |
| **Commits** | 2 |

---

## 🔧 Files Modified

1. **app.json**
   - Bumped build number: 52 → 53
   - Added iOS microphone permission description
   - Added Android RECORD_AUDIO permission

2. **eas.json**
   - Added Google Cloud API key to preview profile
   - Added Google Cloud API key to production profile

3. **src/screens/subscription/SubscriptionScreen.tsx**
   - Added Basic tier ($2.99/month)
   - Added Premium tier ($19.99/year)
   - Added Lifetime tier ($59.99 one-time)
   - Added coupon code section

4. **src/components/trial/TrialExpiredModal.tsx**
   - Updated to show subscription tiers
   - Removed old lifetime access UI

---

## 🚀 Build 53 Deployment Checklist

### Pre-Build
- [x] Bump build number to 53
- [x] Add Google Cloud API key to eas.json
- [x] Add microphone permissions
- [x] Update subscription model
- [x] Commit all changes to git

### Build
- [ ] Run: `eas build --platform ios --profile production`
- [ ] Monitor build progress on Expo dashboard
- [ ] Download build artifact when complete

### Post-Build Testing
- [ ] Install Build 53 on test device
- [ ] **Test Audio Playback:**
  - [ ] Open Daily Readings
  - [ ] Tap "Listen to Reading"
  - [ ] Verify audio plays (no API key error)
- [ ] **Test Microphone:**
  - [ ] Go to Pronunciation Practice
  - [ ] Tap microphone button
  - [ ] Grant permission when prompted
  - [ ] Test recording
- [ ] **Test Subscription Screen:**
  - [ ] Verify all 3 tiers display (Basic/Premium/Lifetime)
  - [ ] Verify coupon code section appears
  - [ ] Test purchase flows
- [ ] **Test Notifications Screen:**
  - [ ] Verify empty state shows
  - [ ] Tap "Load Test Notifications"
  - [ ] Verify notifications display correctly

### Operational Tasks
- [ ] Run Python scraper to populate December readings:
  ```bash
  cd functions
  source venv/bin/activate
  python populate_readings.py --start-date 2025-12-01 --end-date 2025-12-31
  ```
- [ ] Verify readings for December 13, 2025 show correctly (not Demo)

### TestFlight Submission
- [ ] All tests pass
- [ ] No critical bugs found
- [ ] Submit to TestFlight via App Store Connect
- [ ] Add release notes for beta testers

---

## 📝 Commit History

### Commit 1: `822f201`
```
Build 53 - Bug fixes: Add Google Cloud API key, microphone permissions

- Added EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY to eas.json for audio playback
- Added iOS microphone permission (NSMicrophoneUsageDescription)
- Added Android RECORD_AUDIO permission for pronunciation practice
- Bumped build number from 52 to 53

Fixes:
- Issue #2: Audio playback 'API key not configured' error
- Issue #4: Microphone not activating in pronunciation practice
```

### Commit 2: `ace7e4f`
```
Update subscription model - Add Basic/Premium/Lifetime tiers + coupon codes

- Added Basic tier: $2.99/month
- Added Premium tier: $19.99/year (Popular badge)
- Added Lifetime tier: $59.99 one-time (Best Value badge)
- Added coupon code redemption section
- Updated TrialExpiredModal to show subscription options

Fixes Issue #1: Subscription model now matches requirements
Implements Issue #6: Gift/coupon code functionality
```

---

## 🎯 Next Steps

1. **Immediate (Required for Build 53):**
   - Run `eas build --platform ios --profile production`
   - Test all fixes on physical device
   - Run scraper to populate December readings

2. **After Testing:**
   - If all tests pass → Submit to TestFlight
   - If issues found → Create new tickets and iterate

3. **Future Considerations:**
   - Set up automated daily scraper (Cloud Scheduler)
   - Monitor audio playback metrics
   - Track microphone permission grant rates

---

## ✅ Sign-Off

**Build Ready:** Yes
**Blocking Issues:** None
**Manual Testing Required:** Yes
**Operational Tasks:** 1 (run scraper)

**Build 53 is ready for EAS cloud build and subsequent TestFlight submission.**

---

*Generated: December 17, 2025*
*Branch: migration/expo-sdk-52*
*Build Number: 53*
