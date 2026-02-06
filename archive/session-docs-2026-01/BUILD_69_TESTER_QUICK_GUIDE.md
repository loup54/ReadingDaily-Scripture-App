# Build 69 Quick Testing Guide
**For Beta Testers - 15 Minute Quick Test**

---

## What's New in Build 69?

✅ **Fixed:** Notifications tab no longer freezes
✅ **New:** Loading screen with rotating scripture quotes
✅ **Fixed:** Dark mode numbers now readable in Settings
✅ **Fixed:** Corrected help text in Notifications tab

---

## Quick Test (15 Minutes)

### 1. Install & Launch (2 min)
- [ ] Install Build 69 from TestFlight
- [ ] Launch app
- [ ] **Watch loading screen for 5+ seconds**
  - Should see rotating scripture quotes
  - Message: "Keep smiling! Loading good things for you..."

### 2. Test Notifications Tab (3 min)
- [ ] Navigate to Notifications tab (bell icon)
- [ ] **Does it freeze or show endless spinner?** → NO = PASS ✅
- [ ] Navigate away and back 3-5 times
- [ ] Read the tip messages (should NOT mention "Settings → Notifications")

### 3. Test Dark Mode (5 min)
- [ ] Enable Dark Mode: iOS Settings → Display & Brightness → Dark
- [ ] Open ReadingDaily app
- [ ] Go to Settings → Offline Settings
- [ ] **Are the numbers WHITE and readable?** → YES = PASS ✅
- [ ] Check "Cached Readings: X days" - should be white
- [ ] Disable Dark Mode and verify still readable

### 4. Quick Feature Check (5 min)
- [ ] Navigate to Readings tab - works? ✅
- [ ] Navigate to Profile tab - works? ✅
- [ ] Navigate to Settings tab - works? ✅
- [ ] Tap "Download Now" in Offline Settings - works? ✅

---

## What to Report

### 🚨 Report Immediately If:
- App crashes
- Notifications tab freezes
- Cannot use a major feature

### 📧 Report Via:
- Shake device → Send Feedback in TestFlight
- Or email: [Your email]

### Include in Report:
1. What you were doing
2. What went wrong
3. Screenshot if possible
4. Your device model & iOS version

---

## That's It!

If all checks passed ✅ - you're done!
If you found issues - please report them.

**Thank you for testing!** 🙏

---

## Optional: Full Testing (1-2 Hours)

If you have more time, see **BUILD_69_TESTING_PLAN.md** for detailed test cases.

**Focus areas for extended testing:**
- Offline functionality (download, clear cache)
- Notification interactions (if you receive any)
- App behavior on different networks (WiFi vs cellular)
- Background/foreground transitions
- Logout and login flow
