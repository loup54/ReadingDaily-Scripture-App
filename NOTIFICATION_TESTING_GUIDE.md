# Push Notification Testing Guide

**Last Updated:** 2026-01-12

This guide will walk you through testing the daily reading reminder notification system step-by-step.

---

## Overview

The app now has a complete push notification system for daily reading reminders:

- **Daily reminders** at user-specified times
- **Permission handling** for iOS and Android
- **Test notification** functionality
- **Automatic scheduling** via settings

---

## What Was Implemented

### Files Created/Modified
1. `src/services/notifications/DailyReminderScheduler.ts` - Notification scheduler service
2. `src/stores/useSettingsStore.ts` - Auto-scheduling integration
3. `src/screens/settings/SettingsScreen.tsx` - UI controls (lines 790-900)
4. `app.json` - expo-notifications plugin + permissions

### Default Settings
- **Reminder Time:** 08:00 (8 AM)
- **Enabled:** False (user must opt-in)
- **Sound:** Enabled
- **Message:** "Good day! Time for today's Scripture reading practice. Keep your streak alive!"

---

## Testing Phase 1: Simulator - UI Verification ✅

### Prerequisites
- Expo development server running
- iOS Simulator open (iOS 15.1+)

### Step-by-Step Instructions

#### Step 1: Start the App
```bash
# In your project directory
npx expo start
```

**Expected Result:**
- Metro bundler starts
- QR code appears in terminal
- Development server running on http://localhost:8081

#### Step 2: Open iOS Simulator
```bash
# Press 'i' in the Metro terminal to open iOS simulator
# OR manually: npx expo run:ios
```

**Expected Result:**
- iOS Simulator opens
- App loads on simulator device
- You see the landing screen or readings screen (if already logged in)

#### Step 3: Navigate to Settings
1. If not logged in: Sign in with test account
2. Tap the **Settings** tab at bottom navigation
3. Scroll down to **"Learning Preferences"** section

**Expected Result:**
- Settings screen loads
- You see "Daily Reminders" toggle switch
- Toggle is OFF by default

#### Step 4: Enable Daily Reminders
1. Tap the **"Daily Reminders"** toggle switch to turn it ON
2. iOS will show a permission dialog

**Expected Result:**
- Permission dialog appears: "ReadingDaily Scripture App Would Like to Send You Notifications"
- Options: "Don't Allow" / "Allow"

#### Step 5: Grant Permission
1. Tap **"Allow"** in the permission dialog
2. Watch for success alert

**Expected Result:**
- Alert appears: "Success - Daily reminders enabled. You'll receive a notification at your scheduled time."
- Two new UI elements appear below the toggle:
  - **"Reminder Time"** row showing "08:00"
  - **"Test Notification"** row

#### Step 6: Change Reminder Time
1. Tap **"Reminder Time"** row
2. iOS prompt appears: "Set Reminder Time"
3. Enter a time in HH:MM format (e.g., "09:30")
4. Tap **"Save"**

**Expected Result:**
- Validation occurs
- If valid: Success alert + time updates in UI
- If invalid: Error alert "Invalid time format. Use HH:MM (e.g., 08:00)"

**Try These Test Cases:**
- ✅ Valid: "09:30" → Should succeed
- ✅ Valid: "14:00" → Should succeed
- ❌ Invalid: "25:00" → Should fail (hour > 23)
- ❌ Invalid: "9:30" → Should fail (needs leading zero)
- ❌ Invalid: "9am" → Should fail (not 24-hour format)

#### Step 7: Send Test Notification
1. Tap **"Test Notification"** row
2. Alert appears: "Test Sent - A test notification should appear shortly!"
3. Wait 1-3 seconds

**Expected Result on Simulator:**
- Notification appears at top of screen (banner)
- OR appears in Notification Center if app is in foreground
- Notification shows:
  - Title: "📖 Test Notification"
  - Body: "This is a test notification. Your daily reminders will look like this!"

**How to check Notification Center:**
- Swipe down from top of screen
- Or if app is in foreground, pull down notification center manually

#### Step 8: Verify Settings Persistence
1. Close the app (swipe up from bottom, swipe app away)
2. Reopen the app
3. Go back to Settings > Learning Preferences

**Expected Result:**
- "Daily Reminders" toggle is still ON
- "Reminder Time" still shows your saved time
- Settings persisted correctly via AsyncStorage

#### Step 9: Disable Reminders
1. Tap "Daily Reminders" toggle to turn it OFF
2. Wait for confirmation

**Expected Result:**
- Alert appears: "Daily reminders disabled"
- "Reminder Time" and "Test Notification" rows disappear
- Scheduled notifications are cancelled

---

### Simulator Testing Checklist

- [ ] App starts successfully
- [ ] Can navigate to Settings screen
- [ ] "Daily Reminders" toggle visible
- [ ] Can enable reminders
- [ ] Permission dialog appears
- [ ] Can grant notification permission
- [ ] Success alert shows after granting permission
- [ ] "Reminder Time" and "Test Notification" appear when enabled
- [ ] Can change reminder time
- [ ] Time validation works correctly
- [ ] Test notification sends successfully
- [ ] Test notification appears in Notification Center
- [ ] Settings persist after app restart
- [ ] Can disable reminders
- [ ] UI updates correctly when disabled

**If any items fail, note them and we'll debug.**

---

## Testing Phase 2: Physical Device - Background Notifications 📱

### Prerequisites
- iPhone with iOS 15.1+ (physical device)
- EAS Build OR Development Build
- Expo Go does NOT support notifications fully - need custom build

### Option A: Quick Test with Development Build

#### Step 1: Create Development Build (One-Time Setup)
```bash
# Install iOS device
eas build --profile development --platform ios

# Wait for build to complete (~10-15 minutes)
# Download IPA from EAS dashboard
# Install on device via Xcode or TestFlight
```

#### Step 2: Run Development Build
```bash
# Start Metro bundler
npx expo start --dev-client

# Scan QR code with device camera
# App opens in development mode
```

### Option B: Production Build (Full Testing)

#### Step 1: Create Production Build
```bash
# Build for TestFlight
eas build --profile production --platform ios

# Submit to TestFlight (optional)
eas submit --platform ios
```

### Testing Background Notifications

#### Test 1: App in Background
1. Open app on physical device
2. Enable Daily Reminders in Settings
3. Set reminder time to **2 minutes from now**
4. Press Home button (app goes to background)
5. Wait for notification time

**Expected Result:**
- Notification banner appears on lock screen
- Sound plays (if enabled)
- Badge number updates on app icon
- Tapping notification opens app

#### Test 2: App Completely Closed
1. Open app
2. Verify Daily Reminders are enabled
3. Set reminder time to **2 minutes from now**
4. Swipe up and **force close the app**
5. Wait for notification time

**Expected Result:**
- Notification still appears at scheduled time
- Even though app is not running
- Tapping notification launches the app

#### Test 3: Device Locked
1. Enable Daily Reminders
2. Set reminder time to **1 minute from now**
3. **Lock your device** (press power button)
4. Wait for notification

**Expected Result:**
- Notification appears on lock screen
- Device vibrates/makes sound
- Notification visible without unlocking
- Swipe to open app

#### Test 4: Do Not Disturb Mode
1. Enable Do Not Disturb on device
2. Set reminder time to **1 minute from now**
3. Wait

**Expected Result:**
- Notification appears silently in Notification Center
- No sound or vibration (respects DND)
- Still visible when you check Notification Center

---

## Testing Phase 3: Timezone Handling ⏰

### Why This Matters
Notifications should fire at the **correct local time** regardless of:
- Device timezone
- Daylight saving time changes
- User traveling to different timezones

### Test Cases

#### Test 1: Verify Local Time Scheduling
1. Enable Daily Reminders
2. Set time to **09:00**
3. Check device timezone: Settings > General > Date & Time
4. Note your current timezone (e.g., PST, EST, UTC+8)
5. Wait until 09:00 **local time**

**Expected Result:**
- Notification fires at 09:00 local time
- Not 09:00 UTC or other timezone

#### Test 2: Change Timezone (Simulator Only)
1. Enable Daily Reminders
2. Set time to **10:00**
3. Change simulator timezone:
   ```bash
   # Settings > General > Date & Time
   # Turn off "Set Automatically"
   # Select different timezone (e.g., Tokyo if you're in PST)
   ```
4. Wait for 10:00 in the NEW timezone

**Expected Result:**
- Notification should reschedule for 10:00 in new timezone
- ⚠️ May require app restart to pick up timezone change

#### Test 3: Next-Day Scheduling
1. Set reminder time to **08:00**
2. Current time is **22:00** (10 PM)
3. Enable reminders

**Expected Result:**
- Notification schedules for **tomorrow at 08:00**
- Not "in the past" today
- Check logs: Should show "next scheduled for [tomorrow's date]"

---

## Debugging & Troubleshooting

### Check Scheduled Notifications
Add this temporary debug code to Settings screen:

```typescript
// Add debug button to see scheduled notifications
<TouchableOpacity
  onPress={async () => {
    const { dailyReminderScheduler } = await import(
      '@/services/notifications/DailyReminderScheduler'
    );
    const scheduled = await dailyReminderScheduler.getScheduledNotifications();
    Alert.alert(
      'Scheduled Notifications',
      JSON.stringify(scheduled, null, 2)
    );
  }}
>
  <Text>Debug: View Scheduled</Text>
</TouchableOpacity>
```

### View Console Logs
```bash
# In Metro bundler, watch for these logs:
# [DailyReminderScheduler] Scheduling daily reminder for 09:00
# [DailyReminderScheduler] ✅ Daily reminder scheduled: {...}
# [DailyReminderScheduler] Requesting notification permissions
# [DailyReminderScheduler] ✅ Notification permissions granted
```

### Common Issues

#### Issue: "Permission denied" alert
**Solution:**
- Go to iOS Settings > ReadingDaily Scripture App > Notifications
- Toggle "Allow Notifications" ON
- Restart app

#### Issue: Notifications not appearing
**Checklist:**
1. Is "Daily Reminders" toggle ON?
2. Are permissions granted? (Check iOS Settings)
3. Is the time in the future? (Not in the past)
4. Is Do Not Disturb OFF?
5. Try sending Test Notification - does it work?

#### Issue: Time validation fails
**Solution:**
- Use 24-hour format: HH:MM
- Always use leading zeros: "08:00" not "8:00"
- Hours: 00-23, Minutes: 00-59

---

## Verification Checklist

### Simulator Testing ✅
- [ ] UI elements appear/disappear correctly
- [ ] Permission dialog shows
- [ ] Test notification works
- [ ] Settings persist
- [ ] Time validation works
- [ ] Enable/disable flow works

### Device Testing (Background) ✅
- [ ] Notification appears when app in background
- [ ] Notification appears when app fully closed
- [ ] Notification appears on lock screen
- [ ] Sound/vibration works
- [ ] Tapping notification opens app
- [ ] Badge number updates

### Timezone Testing ✅
- [ ] Notification fires at correct local time
- [ ] Next-day scheduling works (if set time is past)
- [ ] Handles timezone changes gracefully

---

## Success Criteria

Your push notifications are working correctly if:

1. ✅ Users can enable/disable reminders via Settings UI
2. ✅ Permission dialog appears on first enable
3. ✅ Test notification sends immediately and appears
4. ✅ Scheduled notifications fire at the correct time
5. ✅ Notifications appear even when app is closed
6. ✅ Notifications respect local timezone
7. ✅ Settings persist across app restarts

---

## Next Steps After Testing

Once all tests pass:

1. **Remove test/debug code** (if any was added)
2. **Document any issues found** for future fixes
3. **Consider enhancements:**
   - Native date/time picker (better UX than Alert.prompt)
   - Notification action buttons ("Start Reading")
   - Notification history
   - Multiple reminder times per day
4. **Production deployment:**
   - Build production version
   - Submit to App Store
   - Monitor crash reports and user feedback

---

## Need Help?

If you encounter issues during testing:

1. Check console logs in Metro bundler
2. Check iOS Settings > Notifications for app permissions
3. Verify `app.json` has expo-notifications plugin
4. Ensure `expo-notifications` package is installed (~0.32.15)
5. Try restarting Metro bundler and rebuilding app

**Common Commands:**
```bash
# Restart Metro
npx expo start --clear

# Rebuild iOS
npx expo run:ios

# Check notification permissions in code
import * as Notifications from 'expo-notifications';
const { status } = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);
```

---

**Status:** Ready for testing ✅
