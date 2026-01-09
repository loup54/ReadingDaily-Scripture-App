# Local Testing Guide - Build 70
## Step-by-Step Testing Instructions

**Date:** January 8, 2026
**Purpose:** Verify all Build 70 fixes work correctly before building production version

---

## PRE-TESTING CHECKLIST

Before starting, ensure:
- [ ] You have an iOS Simulator installed (via Xcode)
- [ ] OR you have a physical iPhone/iPad available
- [ ] Terminal is open in project directory

---

## STEP 1: START DEVELOPMENT SERVER

**Command:**
```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
npx expo start --clear
```

**What to expect:**
- Metro bundler will start
- You'll see a QR code and menu options
- Should take 10-30 seconds

**If errors occur:**
- Clear cache and restart: `npx expo start --clear`
- Check for port conflicts

---

## STEP 2: LAUNCH APP

**Choose ONE method:**

### Method A: iOS Simulator (Easiest)
- Press `i` in the terminal
- Simulator will launch automatically
- App will install and open

### Method B: Physical iPhone/iPad
- Open Camera app on device
- Scan the QR code in terminal
- Tap "Open in Expo Go"
- App will load

**What to expect:**
- App launches to landing/sign-in screen
- Takes 30-60 seconds first time
- Subsequent launches are faster

---

## STEP 3: TEST APP ICON

**Where to check:**
- iOS Home Screen (only visible in built app - SKIP for now)
- App splash screen when loading

**What to verify:**
- Icon should show Bible image (not green square)
- Note: Full icon only visible in production build
- For now, just verify app loads without icon errors

**Status:** ⚠️ Cannot fully test until production build

---

## STEP 4: TEST LANDING SCREEN MESSAGING

**Navigation:** App should open to landing screen

**What to verify:**
✅ Check for new text: "Create an account to sync your progress and settings across all your devices"
✅ Text should be visible and readable
✅ Should appear below main description

**Expected Result:**
- Landing screen shows account benefits messaging
- Text is italicized and slightly smaller

**Screenshot location:** `src/screens/auth/LandingScreen.tsx:57-61`

---

## STEP 5: TEST SIGN-UP SCREEN MESSAGING

**Navigation:**
1. From landing screen
2. Tap "Start 7-Day Free Trial" button
3. Should navigate to Sign-Up screen

**What to verify:**
✅ Subtitle should say: "Sync your progress, bookmarks, and settings across all your devices with cloud backup"
✅ Should NOT say: "Start your English learning journey..."

**Expected Result:**
- Sign-up screen shows cloud sync benefits
- Messaging is clear and professional

**Screenshot location:** `src/screens/auth/SignUpScreen.tsx:97-100`

---

## STEP 6: TEST DARK MODE - OFFLINE SETTINGS

**Navigation:**
1. From landing screen, tap "Already have an account? Sign In"
2. Sign in with test credentials (or create account)
3. Once signed in, go to Settings tab (bottom navigation)
4. Scroll down to "Offline Settings" section

**What to verify:**
✅ Toggle device to Dark Mode (Control Center → Brightness → Dark Mode)
✅ "Offline Settings" title text should be WHITE and readable
✅ Should NOT be invisible/unreadable

**Expected Result:**
- Title text adapts to dark mode
- All text in section is readable

**Screenshot location:** `src/components/offline/OfflineSettingsSection.tsx:205`

---

## STEP 7: TEST PRONUNCIATION PRACTICE

**Navigation:**
1. Sign in to app
2. Go to Readings tab
3. Open today's reading
4. Tap "Practice" button
5. Tap microphone icon to start recording

**What to verify:**
✅ Recording should START without errors
✅ You should see recording timer
✅ Tap stop button - recording should STOP
✅ Should NOT show "Analysis Failed" error
✅ Playback should work (optional - may not have Google Cloud API key)

**Expected Result:**
- Recording starts and stops cleanly
- No "getInfoAsync is deprecated" error
- File operations work correctly

**Note:** Transcription may fail if Google Cloud API key not configured, but recording itself should work.

**Screenshot location:**
- `src/services/speech/SpeechToTextService.ts:58-65`
- `src/services/speech/AudioRecordingService.ts:260-271`

---

## STEP 8: GENERAL APP NAVIGATION

**Test core flows:**
1. Navigate between tabs (Readings, Practice, Progress, Notifications, Settings)
2. Open and close readings
3. Toggle dark/light mode
4. Sign out and sign in

**What to verify:**
✅ No crashes
✅ No console errors (check terminal output)
✅ Smooth navigation
✅ No obvious UI bugs

---

## STEP 9: CONSOLE CHECK

**In terminal, look for:**
❌ **RED errors** - Critical issues
⚠️ **Yellow warnings** - May need attention
ℹ️ **Blue info** - Normal logs

**Common errors to ignore:**
- Network errors (if offline)
- API key warnings (if keys not configured)
- Development-only warnings

**Critical errors to report:**
- Crashes
- "undefined is not an object"
- "Cannot read property of null"
- File system errors

---

## TESTING CHECKLIST

Use this checklist while testing:

### Landing Screen
- [ ] App loads successfully
- [ ] New account benefits text visible
- [ ] "Sync your progress..." text present
- [ ] Sign-up button works

### Sign-Up Screen
- [ ] New subtitle visible: "Sync your progress, bookmarks..."
- [ ] Old text NOT present: "English learning journey..."
- [ ] Form fields work correctly

### Dark Mode
- [ ] Toggle dark mode in device settings
- [ ] Navigate to Settings → Offline Settings
- [ ] "Offline Settings" title is WHITE and readable
- [ ] All section text is readable

### Pronunciation Practice
- [ ] Navigate to Practice section
- [ ] Tap microphone to start recording
- [ ] Recording starts (timer appears)
- [ ] Tap stop button
- [ ] Recording stops without "Analysis Failed" error
- [ ] Can play back recording (optional)

### General Stability
- [ ] No crashes during navigation
- [ ] No major console errors
- [ ] App responsive and smooth
- [ ] Can sign in/out successfully

---

## WHAT TO DO WITH RESULTS

### If ALL Tests Pass ✅
**Next step:** Build production Build 70
```bash
eas build --platform ios --profile production
```

### If Tests FAIL ❌
**Report back with:**
1. Which test failed?
2. What error appeared?
3. Screenshot of error (if visible)
4. Console output from terminal

I'll help fix any issues found.

---

## QUICK REFERENCE COMMANDS

**Start dev server:**
```bash
npx expo start --clear
```

**Stop dev server:**
Press `Ctrl + C` in terminal

**Restart if frozen:**
```bash
# Stop server (Ctrl + C)
# Then restart:
npx expo start --clear
```

**Toggle dark mode on simulator:**
- Settings → Developer → Dark Appearance

**Toggle dark mode on device:**
- Control Center → Brightness → Toggle dark mode

---

## TIME ESTIMATE

- Setup and launch: 5 minutes
- Testing all steps: 20-30 minutes
- Total: 25-35 minutes

---

## NOTES

- You may see IAP-related errors - that's expected (need production build to test IAPs)
- Some API features may not work without keys configured - that's okay
- Focus on the 5 specific fixes we made
- Take screenshots of anything unusual

---

**Ready to start?** Run the first command above and follow the steps!
