# Build 74 - TestFlight Submission & Testing Guide

**Build Number:** 74
**Version:** 1.1.1
**Build ID:** fdf55e4d-8de6-4013-b07b-2c953a61e1de
**Created:** 2026-01-12
**Purpose:** Push notification testing on physical device

---

## What's New in Build 74

### Push Notification System ✨
- **DailyReminderScheduler** - Complete notification scheduling service
- **iOS Notification Permissions** - Proper permission handling
- **Settings UI Controls** - Toggle, time picker, and test button
- **Automatic Scheduling** - Integrated with useSettingsStore
- **Test Notification** - Immediate testing capability

### Files Included
1. `src/services/notifications/DailyReminderScheduler.ts` (NEW)
2. `src/stores/useSettingsStore.ts` (Updated)
3. `src/screens/settings/SettingsScreen.tsx` (Updated)
4. `app.json` (expo-notifications plugin + iOS permissions)

---

## Step 1: Wait for Build Completion

### Current Status
```
✅ Project files uploaded
⏳ Build in progress
📍 Estimated time: 8-12 minutes remaining
```

### How to Monitor
**Build URL:**
https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds/fdf55e4d-8de6-4013-b07b-2c953a61e1de

You'll know the build is complete when you see:
- ✅ Green checkmark in EAS dashboard
- Terminal shows: "Build finished"
- You receive an email notification (if enabled)

---

## Step 2: Submit to TestFlight

### Prerequisites
- Build 74 must be complete ✅
- Apple Developer account must be active ✅
- App Store Connect credentials configured in EAS ✅

### Submission Command

Once the build completes, I will run:

```bash
eas submit --platform ios --profile production --latest --non-interactive
```

### What This Does
1. Downloads Build 74 from EAS servers
2. Uploads `.ipa` file to App Store Connect
3. Submits to TestFlight for processing
4. Returns submission status

### Expected Output
```
✔ Submitting to App Store Connect
✔ Uploaded to App Store Connect
✔ Processing build on Apple servers
✔ Build available in TestFlight
```

### Timeline
- **Upload**: 1-2 minutes
- **Apple Processing**: 3-7 minutes
- **Total**: ~5-10 minutes

---

## Step 3: Apple Processing

### What Happens on Apple's Side
1. **Binary Validation** - Apple checks the `.ipa` file integrity
2. **Code Signing** - Verifies certificates and provisioning profiles
3. **Entitlements Check** - Validates notification permissions
4. **Export Compliance** - Confirms encryption declaration
5. **TestFlight Ready** - Build appears in TestFlight

### Where to Monitor
**App Store Connect:**
https://appstoreconnect.apple.com/apps/6738871048/testflight/ios

You'll see:
- Build 74 (1.1.1) with status "Processing"
- Then status changes to "Ready to Test"

---

## Step 4: Install via TestFlight on iPhone

### Prerequisites
- iPhone with iOS 15.1+ ✅
- TestFlight app installed on iPhone
- Apple ID signed into TestFlight

### Installation Steps

#### 4.1: Open TestFlight App
1. Tap the **TestFlight** app icon on your iPhone
2. Sign in with your Apple ID (if not already signed in)

#### 4.2: Find ReadingDaily Scripture App
1. You'll see "ReadingDaily Scripture App" in your app list
2. Look for **Build 74 (1.1.1)** - should say "New build available"

#### 4.3: Install Build 74
1. Tap **"Install"** next to Build 74
2. Wait for download (~150-200 MB)
3. Wait for installation (~30 seconds)
4. TestFlight shows "Build 74 installed" ✅

#### 4.4: Open the App
1. Tap **"OPEN"** in TestFlight
   - OR find app icon on home screen
2. App launches with Build 74

---

## Step 5: Verify Build Information

### Quick Verification
Before testing notifications, verify you're on the correct build:

1. Open the app
2. Go to **Settings** tab
3. Scroll to bottom - you should see:
   - **Version:** 1.1.1
   - **Build:** 74

If you see Build 74, you're ready to test! ✅

---

## Step 6: Test Push Notifications

Now follow the **NOTIFICATION_TESTING_GUIDE.md** starting at **"Testing Phase 2: Physical Device - Background Notifications"**

### Quick Test Checklist

#### Test 1: Enable Notifications & Send Test
1. Open app → Settings → Learning Preferences
2. Enable **"Daily Reminders"** toggle
3. Grant notification permission when prompted
4. Tap **"Test Notification"**
5. **Expected:** Notification appears within 1-3 seconds ✅

#### Test 2: Background Notification
1. Set **"Reminder Time"** to **2 minutes from now**
2. Press **Home button** (app goes to background)
3. Wait 2 minutes
4. **Expected:** Notification appears as banner ✅

#### Test 3: App Closed Notification
1. Open app → Settings → Set reminder to **2 minutes from now**
2. **Force close app** (swipe up, swipe app away)
3. Wait 2 minutes
4. **Expected:** Notification still appears ✅

#### Test 4: Lock Screen Notification
1. Open app → Settings → Set reminder to **1 minute from now**
2. **Lock your iPhone** (press power button)
3. Wait 1 minute
4. **Expected:** Notification appears on lock screen ✅

---

## Expected Test Results

### Success Criteria ✅
- [ ] Build 74 appears in TestFlight
- [ ] App installs successfully on iPhone
- [ ] Build number shows "74" in Settings
- [ ] Daily Reminders toggle works
- [ ] iOS permission dialog appears
- [ ] Test notification sends immediately
- [ ] Scheduled notification appears when app is backgrounded
- [ ] Notification appears when app is fully closed
- [ ] Notification appears on lock screen
- [ ] Notification respects local timezone

### If Any Test Fails ❌
1. Note which test failed
2. Check console logs (if running Metro)
3. Verify notification permissions: Settings → ReadingDaily Scripture App → Notifications
4. Try sending test notification again
5. Report issue for debugging

---

## Troubleshooting

### Issue: TestFlight says "No builds available"
**Solution:**
- Wait 5-10 minutes for Apple processing
- Refresh TestFlight app (pull down to refresh)
- Check App Store Connect for build status

### Issue: "Install" button is grayed out
**Solution:**
- Check device compatibility (iOS 15.1+)
- Ensure enough storage (~200 MB free)
- Sign out and back into TestFlight

### Issue: Test notification doesn't appear
**Solution:**
- Check iOS Settings → Notifications → ReadingDaily Scripture App
- Ensure "Allow Notifications" is ON
- Turn off Do Not Disturb mode
- Try test notification again

### Issue: Scheduled notification doesn't fire
**Solution:**
- Verify time is in the future (not past)
- Check Daily Reminders toggle is ON
- Check notification permissions are granted
- Try setting time to 1 minute from now as test

---

## Commands Reference

### Check Build Status
```bash
eas build:list --platform ios --limit 1
```

### Submit to TestFlight
```bash
eas submit --platform ios --profile production --latest --non-interactive
```

### View Submission Status
```bash
eas submit:list --platform ios --limit 1
```

### Check Build Logs
```bash
eas build:view fdf55e4d-8de6-4013-b07b-2c953a61e1de
```

---

## Timeline Summary

| Step | Action | Duration |
|------|--------|----------|
| 1 | Build 74 compiles on EAS | 8-12 min ⏳ |
| 2 | Submit to TestFlight | 1-2 min |
| 3 | Apple processes build | 3-7 min |
| 4 | Install via TestFlight | 1-2 min |
| 5 | Test notifications | 10-15 min |
| **Total** | **Build → Testing** | **~25-40 min** |

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Update current-status.md with test results
2. Consider submitting Build 74 to App Store Review
3. Plan for production release

### If Tests Fail ❌
1. Document which tests failed
2. Check console logs for errors
3. Debug and fix issues
4. Create Build 75 with fixes
5. Repeat TestFlight process

---

## Build 74 Details

**Commit:** c2fb808 (feat: Add push notifications for daily reading reminders)
**Branch:** feature/dark-mode
**EAS Build URL:** https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds/fdf55e4d-8de6-4013-b07b-2c953a61e1de

**Files Changed in Build 74:**
- app.json (buildNumber: 73 → 74)
- src/services/notifications/DailyReminderScheduler.ts (NEW)
- src/stores/useSettingsStore.ts (auto-scheduling integration)
- src/screens/settings/SettingsScreen.tsx (notification UI)
- NOTIFICATION_TESTING_GUIDE.md (NEW)
- README.md (updated features)
- current-status.md (updated status)

---

**Status:** Waiting for Build 74 to complete ⏳

**Last Updated:** 2026-01-12
