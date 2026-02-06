# Build 69 Testing Plan
**Version:** 1.1.1
**Build Number:** 69
**Release Date:** December 28, 2025
**Testing Period:** 3-5 days
**Platform:** iOS (TestFlight)

---

## Executive Summary

Build 69 includes critical bug fixes and UI/UX improvements:
- **Critical Fix:** Notifications tab lockup issue (Build 68 regression)
- **4 UI/UX Improvements:** Loading screen, dark mode, text corrections

**Testing Focus:**
1. Verify notifications tab is stable
2. Confirm UI/UX enhancements work as designed
3. Ensure no regressions in existing features
4. Test dark mode compatibility
5. Verify offline features still work

---

## Test Environment Requirements

### Device Requirements
- **iOS Version:** 15.1 or later (deployment target)
- **Recommended:** iOS 16.0+ for best experience
- **Device Types to Test:**
  - iPhone (various screen sizes)
  - iPad (if applicable)

### Account Setup
- **Test Account:** Use test account credentials (if provided)
- **Or:** Use personal account for beta testing
- **Permissions:** Allow notifications when prompted
- **Network:** Test on both WiFi and cellular

### Pre-Test Setup
1. Install TestFlight app from App Store
2. Accept beta invitation email
3. Install Build 69 from TestFlight
4. Allow all permissions when prompted
5. Enable/disable Dark Mode in iOS Settings for testing

---

## Test Cases by Feature

### 1. CRITICAL: Notifications Tab Stability Test

**Priority:** P0 (Blocking - Must Pass)
**Issue Fixed:** Notifications tab no longer crashes/locks up

#### Test Case 1.1: Basic Navigation
**Steps:**
1. Open app
2. Navigate to Notifications tab (bell icon)
3. Wait 5 seconds on the tab
4. Navigate to another tab
5. Return to Notifications tab
6. Repeat 3-5 times

**Expected Result:**
- ✅ Tab loads without delay
- ✅ No spinning wheel or freeze
- ✅ Can navigate away and back freely
- ✅ No crashes or unresponsiveness

**Bug Severity if Failed:** P0 - Blocking

---

#### Test Case 1.2: Empty State Display
**Steps:**
1. Navigate to Notifications tab
2. If no notifications exist, observe empty state
3. Read the tip messages

**Expected Result:**
- ✅ Empty state shows book icon and message
- ✅ Tips display correctly:
  - "✓ Allow notifications in iOS Settings if prompted"
  - "✓ Turn on Daily Reminders in Settings to receive readings"
  - "✓ Notifications appear here when readings are available"
- ✅ No reference to non-existent "Settings → Notifications" menu

**Bug Severity if Failed:** P2 - Medium (UI/UX issue)

**Screenshot Required:** Yes (if tips are incorrect)

---

#### Test Case 1.3: Notification Interaction
**Steps:**
1. Enable Daily Reminders in Settings
2. Wait for notification to arrive (or trigger manually if possible)
3. Tap notification to open app
4. Navigate to Notifications tab
5. Tap a notification in the list
6. Mark notification as read
7. Delete a notification

**Expected Result:**
- ✅ Notifications appear in the tab
- ✅ Tapping opens relevant content
- ✅ Mark as read works
- ✅ Delete works
- ✅ No crashes or freezes

**Bug Severity if Failed:** P0 - Blocking

---

### 2. Loading Screen Enhancement Test

**Priority:** P1 (High - Core UX Improvement)
**Issue Fixed:** Enhanced loading screen with rotating scripture quotes

#### Test Case 2.1: Initial App Launch
**Steps:**
1. Force quit the app (swipe up in app switcher)
2. Relaunch the app from home screen
3. Observe the loading screen for at least 5 seconds
4. Note the quote that appears
5. Watch for quote changes (should rotate every 4 seconds)

**Expected Result:**
- ✅ Loading screen appears immediately after Expo splash
- ✅ Purple gradient background visible
- ✅ Pulsing book icon animation plays
- ✅ Message displays: "Keep smiling! Loading good things for you..."
- ✅ Scripture quote visible with book icon
- ✅ Quote fades out and new quote fades in after ~4 seconds
- ✅ At least one quote rotation visible during 5-second minimum display
- ✅ Quotes are from Psalms, Proverbs, or Book of Wisdom

**Bug Severity if Failed:** P1 - High (missing feature)

**Screenshot Required:** Yes (capture loading screen)

**Example Quotes to Look For:**
- "In your light, we see light - Psalm 36:9"
- "The beginning of wisdom is the fear of the Lord - Proverbs 9:10"
- "Your word is a lamp to my feet, a light for my path - Psalm 119:105"

---

#### Test Case 2.2: Loading Screen Duration
**Steps:**
1. Force quit the app
2. Relaunch the app
3. Start a timer when loading screen appears
4. Stop timer when main app content loads

**Expected Result:**
- ✅ Loading screen visible for at least 5 seconds
- ✅ Enough time to see quote rotation (4-second intervals)
- ✅ Smooth transition to main app

**Bug Severity if Failed:** P2 - Medium (UX degradation)

---

#### Test Case 2.3: Loading Screen After Logout
**Steps:**
1. Navigate to Settings
2. Scroll down and tap "Log Out"
3. Log back in with credentials
4. Observe loading/initialization screen

**Expected Result:**
- ✅ Same enhanced loading screen appears
- ✅ Rotating quotes visible
- ✅ Message: "Keep smiling! Loading good things for you..."
- ✅ Smooth initialization

**Bug Severity if Failed:** P2 - Medium

---

### 3. Dark Mode Number Colors Test

**Priority:** P1 (High - Accessibility)
**Issue Fixed:** Numbers in Offline Settings are now readable in dark mode

#### Test Case 3.1: Light Mode Baseline
**Steps:**
1. Disable Dark Mode in iOS Settings (Settings → Display & Brightness → Light)
2. Open ReadingDaily app
3. Navigate to Settings → Offline Settings
4. Observe number colors:
   - "Cached Readings: X days"
   - Storage usage numbers

**Expected Result:**
- ✅ Numbers are visible and readable
- ✅ Good contrast against light background
- ✅ Description text is secondary gray color

**Bug Severity if Failed:** P2 - Medium

**Screenshot Required:** Yes (for baseline comparison)

---

#### Test Case 3.2: Dark Mode Number Visibility
**Steps:**
1. Enable Dark Mode in iOS Settings (Settings → Display & Brightness → Dark)
2. Open ReadingDaily app (or let it refresh automatically)
3. Navigate to Settings → Offline Settings
4. Observe number colors:
   - "Cached Readings: X days"
   - Storage usage numbers (MB used/total)

**Expected Result:**
- ✅ Numbers are WHITE (#FFFFFF) in dark mode
- ✅ High contrast against dark background (#1A1A1A)
- ✅ Easily readable without strain
- ✅ Description text is light gray (#A0A0A0)
- ✅ No dark gray numbers on dark background

**Bug Severity if Failed:** P1 - High (accessibility issue)

**Screenshot Required:** Yes (showing white numbers in dark mode)

---

#### Test Case 3.3: Dark Mode Toggle
**Steps:**
1. Open app in Light Mode
2. Navigate to Settings → Offline Settings
3. Toggle iOS Dark Mode on/off several times
4. Return to app and observe color changes

**Expected Result:**
- ✅ App responds to system dark mode changes
- ✅ Numbers switch from gray (light) to white (dark)
- ✅ Background switches appropriately
- ✅ No visual glitches during transition

**Bug Severity if Failed:** P2 - Medium

---

### 4. Offline Settings Full Functionality Test

**Priority:** P1 (High - Core Feature)
**Ensure:** No regressions in offline features

#### Test Case 4.1: Download Now Function
**Steps:**
1. Navigate to Settings → Offline Settings
2. Ensure WiFi is connected
3. Tap "Download Now" button
4. Observe progress indicators
5. Wait for download to complete

**Expected Result:**
- ✅ Button shows "Downloading..." with spinner
- ✅ Toast notification shows "Download started"
- ✅ Storage progress bar updates
- ✅ "Cached Readings" count increases
- ✅ Toast notification shows "Download complete"
- ✅ Button returns to "Download Now" state

**Bug Severity if Failed:** P0 - Blocking (core feature broken)

---

#### Test Case 4.2: Auto-Download Toggle
**Steps:**
1. Navigate to Settings → Offline Settings
2. Toggle "Auto-Download" ON
3. Verify toast notification appears
4. Toggle OFF
5. Verify toast notification appears

**Expected Result:**
- ✅ Switch toggles smoothly
- ✅ Toast shows "Auto-download enabled/disabled"
- ✅ Setting persists after app restart

**Bug Severity if Failed:** P1 - High

---

#### Test Case 4.3: WiFi-Only Toggle
**Steps:**
1. Navigate to Settings → Offline Settings
2. Toggle "WiFi Only" ON
3. Disconnect from WiFi (use cellular)
4. Tap "Download Now"
5. Observe behavior

**Expected Result:**
- ✅ Download should NOT start on cellular when WiFi-only is ON
- ✅ Warning message or toast appears
- ✅ Reconnect to WiFi and download works

**Bug Severity if Failed:** P1 - High (data usage issue)

---

#### Test Case 4.4: Cache Duration Picker
**Steps:**
1. Navigate to Settings → Offline Settings
2. Tap the "Cache Duration" picker
3. Change from default (7 days) to other values (3, 14, 30)
4. Verify toast notification appears
5. Restart app and verify setting persists

**Expected Result:**
- ✅ Picker shows options: 3, 7, 14, 30 days
- ✅ Selection updates immediately
- ✅ Toast shows "Cache will include X days of readings"
- ✅ Setting persists after restart

**Bug Severity if Failed:** P2 - Medium

---

#### Test Case 4.5: Clear All Offline Data
**Steps:**
1. Navigate to Settings → Offline Settings
2. Note current "Cached Readings" count and storage used
3. Tap "Clear All Offline Data" button
4. Confirm alert dialog
5. Observe changes

**Expected Result:**
- ✅ Confirmation alert appears with storage size
- ✅ Alert warns "This cannot be undone"
- ✅ After confirming:
  - Storage bar drops to near zero
  - "Cached Readings" count becomes 0
  - Toast shows "All offline data removed"
- ✅ Cancel button works

**Bug Severity if Failed:** P1 - High (data management issue)

---

### 5. Storage Progress Bar Test

**Priority:** P2 (Medium - Visual Indicator)

#### Test Case 5.1: Storage Display Accuracy
**Steps:**
1. Navigate to Settings → Offline Settings
2. Observe storage progress bar
3. Note "X MB / Y MB" text
4. Download more content
5. Observe bar updates

**Expected Result:**
- ✅ Progress bar shows accurate usage
- ✅ Bar fills proportionally (e.g., 25 MB / 50 MB = 50% filled)
- ✅ Numbers update after downloads
- ✅ Color changes based on usage:
  - Green: < 80% full
  - Orange/Yellow: 80-90% full
  - Red: > 90% full

**Bug Severity if Failed:** P2 - Medium

---

### 6. Regression Testing (Existing Features)

**Priority:** P1 (High - Ensure No Breakage)

#### Test Case 6.1: Readings Tab
**Steps:**
1. Navigate to Readings tab
2. Browse daily readings
3. Change date picker
4. Scroll through readings
5. Tap "Read Aloud" (if available)

**Expected Result:**
- ✅ Readings load correctly
- ✅ Date picker works
- ✅ Content scrolls smoothly
- ✅ Audio features work (if implemented)

**Bug Severity if Failed:** P0 - Blocking

---

#### Test Case 6.2: Profile Tab
**Steps:**
1. Navigate to Profile tab
2. View streak counter
3. Check achievements
4. View reading history

**Expected Result:**
- ✅ Profile data loads
- ✅ Streak shows accurately
- ✅ Achievements display
- ✅ No crashes

**Bug Severity if Failed:** P1 - High

---

#### Test Case 6.3: Settings General Functionality
**Steps:**
1. Navigate to Settings tab
2. Toggle "Daily Reminders"
3. Change notification time
4. Toggle other settings
5. Navigate away and back

**Expected Result:**
- ✅ All toggles work
- ✅ Settings persist
- ✅ No crashes
- ✅ UI updates correctly

**Bug Severity if Failed:** P1 - High

---

## Testing Checklist for Testers

### Quick Start Checklist (15 minutes)
- [ ] Install Build 69 from TestFlight
- [ ] Launch app and observe loading screen (5+ seconds)
- [ ] Navigate to Notifications tab - ensure no freeze
- [ ] Enable Dark Mode → Check Offline Settings numbers are white
- [ ] Disable Dark Mode → Check Offline Settings numbers are visible
- [ ] Return to Notifications tab - verify tips text is correct

### Full Testing Checklist (1-2 hours)
- [ ] **Notifications Tab**
  - [ ] Navigate to tab 5+ times without issues
  - [ ] Empty state shows correct tip messages
  - [ ] Interact with notifications (if available)
  - [ ] Mark as read/delete works

- [ ] **Loading Screen**
  - [ ] Force quit and relaunch app
  - [ ] Loading screen visible for 5+ seconds
  - [ ] Quote rotation observed (fades in/out)
  - [ ] Message: "Keep smiling! Loading good things for you..."
  - [ ] Book icon pulses

- [ ] **Dark Mode**
  - [ ] Test in Light Mode first (baseline)
  - [ ] Enable Dark Mode
  - [ ] Offline Settings numbers are WHITE
  - [ ] Toggle mode several times - no visual glitches

- [ ] **Offline Settings**
  - [ ] Download Now works
  - [ ] Auto-Download toggle works
  - [ ] WiFi-Only toggle works
  - [ ] Cache Duration picker works
  - [ ] Clear All Data works (with confirmation)
  - [ ] Storage progress bar accurate

- [ ] **Regression Tests**
  - [ ] Readings tab loads correctly
  - [ ] Profile tab works
  - [ ] Settings toggles work
  - [ ] App doesn't crash during normal use

---

## Bug Reporting Process

### How to Report Bugs

**Where to Report:**
- Email: [Your email address]
- Or: Use TestFlight feedback (shake device → Send Feedback)

**Required Information:**
1. **Bug Title:** Brief description (e.g., "Notifications tab freezes after 3 taps")
2. **Severity:** P0 (Blocking), P1 (High), P2 (Medium), P3 (Low)
3. **Test Case:** Which test case from this plan?
4. **Steps to Reproduce:**
   - Step 1
   - Step 2
   - Step 3
5. **Expected Result:** What should happen?
6. **Actual Result:** What actually happened?
7. **Screenshots/Videos:** If applicable
8. **Device Info:**
   - Device model (e.g., iPhone 14 Pro)
   - iOS version (e.g., iOS 17.2)
   - Build number (69)
9. **Reproducibility:** Always / Sometimes / Once

### Bug Severity Guide

**P0 - Blocking (Report Immediately):**
- App crashes
- Notifications tab freezes/locks up
- Cannot log in
- Core feature completely broken

**P1 - High (Report Within 24 Hours):**
- Feature doesn't work as designed
- Dark mode numbers unreadable
- Download feature fails
- Data loss

**P2 - Medium (Report During Testing Period):**
- UI glitches
- Minor visual issues
- Toast messages incorrect
- Non-critical feature issues

**P3 - Low (Nice to Have Fixed):**
- Typos
- Minor layout adjustments
- Feature suggestions

---

## Success Criteria

### Build 69 is Ready for Production if:
- ✅ **Zero P0 bugs** (no crashes, no lockups, no data loss)
- ✅ **< 2 P1 bugs** (minor issues acceptable if workarounds exist)
- ✅ **Notifications tab is stable** (no freezing or crashes)
- ✅ **Loading screen works** (quotes rotate, 5-second display)
- ✅ **Dark mode readable** (white numbers in Offline Settings)
- ✅ **No regressions** (existing features still work)

### If Success Criteria Met:
- **Action:** Approve for App Store submission
- **Timeline:** Submit within 2-3 days after testing complete

### If Success Criteria NOT Met:
- **Action:** Create Build 70 with fixes
- **Timeline:** New testing round after fixes deployed

---

## Testing Timeline

### Day 1 (Today - Build Available)
- Install Build 69 from TestFlight
- Complete Quick Start Checklist (15 minutes)
- Report any P0 bugs immediately

### Day 2-3 (Initial Testing)
- Complete Full Testing Checklist (1-2 hours)
- Test in both Light and Dark modes
- Report all P0 and P1 bugs

### Day 4-5 (Final Verification)
- Re-test any bug fixes
- Confirm no regressions
- Submit final feedback

### Day 6 (Decision)
- Review all test results
- Approve for App Store or create Build 70

---

## Tester Roles (If Applicable)

### Lead Tester (You or Appointed Person)
- Coordinates testing efforts
- Tracks bug reports
- Makes go/no-go decision
- Communicates with development team

### UI/UX Testers
- Focus on visual elements
- Test Dark Mode thoroughly
- Verify loading screen enhancements
- Check color contrast and readability

### Functional Testers
- Test all features end-to-end
- Verify offline functionality
- Test notification system
- Ensure no regressions

### Edge Case Testers
- Test with poor network
- Test with full storage
- Test rapid navigation
- Test background/foreground transitions

---

## Notes for Testers

### Tips for Effective Testing
1. **Test on Real Device:** Don't use simulator
2. **Test Both Modes:** Light and Dark mode
3. **Clear App Data:** Occasionally test fresh install behavior
4. **Document Everything:** Screenshots help tremendously
5. **Be Thorough:** Follow test cases step-by-step
6. **Think Like User:** Try unexpected actions

### What Makes a Good Bug Report?
- **Specific:** Not "app is slow" but "Notifications tab takes 5 seconds to load"
- **Reproducible:** Include exact steps
- **Visual:** Screenshot or screen recording
- **Contextual:** Device, iOS version, network status

### Questions?
Contact development team if:
- Test case is unclear
- You find something not covered in this plan
- You need test credentials
- You encounter P0 bugs

---

## Appendix: Build 69 Changes Reference

### What's New in Build 69

#### Critical Fix
- **Notifications Tab Lockup** (Build 68 regression)
  - Issue: Tab would freeze or show endless spinner
  - Fix: Refactored state management to prevent infinite loops
  - Impact: Tab now loads instantly and reliably

#### UI/UX Improvements
1. **Enhanced Loading Screen**
   - Added 10 rotating scripture quotes (Psalms, Proverbs, Wisdom)
   - Quote rotation every 4 seconds with fade animations
   - Minimum 5-second display duration
   - Message: "Keep smiling! Loading good things for you..."

2. **Fixed Notifications Empty State**
   - Corrected tip text to reference actual menu paths
   - Removed reference to non-existent "Settings → Notifications"
   - Updated to: "Turn on Daily Reminders in Settings"

3. **Dark Mode Number Colors**
   - Numbers in Offline Settings now white (#FFFFFF) in dark mode
   - Secondary text light gray (#A0A0A0) for readability
   - High contrast against dark background

4. **Initialization Screen**
   - Same enhancements as loading screen
   - Appears when logging in or restarting app

---

## Version History
- **v1.0** - December 28, 2025 - Initial testing plan for Build 69

---

**End of Testing Plan**

Ready to distribute to testers!
