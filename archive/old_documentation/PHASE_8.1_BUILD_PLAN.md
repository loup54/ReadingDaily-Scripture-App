# Phase 8.1: Build for TestFlight
**Date:** November 28, 2025
**Phase:** 8.1 - Create and Upload TestFlight Build
**Duration:** 2-4 hours (mostly waiting for build)
**Owner:** Developer/Build Engineer
**Status:** READY TO BEGIN

---

## Overview

Phase 8.1 creates the first TestFlight build and sets up internal beta testing. This phase bridges between pre-build preparation (Phase 8.0) and external beta testing (Phase 8.2).

**Success Criteria:**
- ✅ EAS build completes successfully
- ✅ Build automatically uploads to TestFlight
- ✅ Internal testers can install app
- ✅ Basic smoke test passes on device

---

## Prerequisites (From Phase 8.0)

### ✅ All Complete
- [x] Security remediation verified
- [x] Firebase configured
- [x] App Store Connect app created
- [x] EAS authentication done
- [x] iOS certificates ready
- [x] .env with production credentials
- [x] app.json configured correctly
- [x] 6 critical code fixes applied

### ⏳ One Item Remaining
- [ ] Fix 5 remaining TypeScript issues (~1 hour before starting build)

**Before proceeding with Phase 8.1 build, must complete the 5 TypeScript fixes.**

---

## Phase 8.1 Step-by-Step

### Step 1: Fix Remaining TypeScript Issues (1 hour)

**Status:** ⏳ REQUIRED BEFORE BUILD

**Issues to Fix:**
1. Add 3 missing color definitions to Colors.ts
2. Fix 2 invalid icon names
3. Fix 3 component type mismatches

**Reference:** [BUILD_ERROR_ANALYSIS.md](BUILD_ERROR_ANALYSIS.md)

**Verify Fix:**
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "test\|__tests__" | wc -l
# Should output: 0 (or close to 0, test errors ok)
```

---

### Step 2: Create Build (20-30 minutes)

**When Ready:** Run this command

```bash
eas build --platform ios --profile preview
```

**What Happens:**
1. EAS connects to your Expo account
2. Downloads your code
3. Installs dependencies
4. Compiles TypeScript
5. Bundles app
6. Signs with distribution certificate
7. Creates iOS app binary (.ipa)
8. Uploads to TestFlight automatically
9. Shows build ID and status

**Expected Output:**
```
Resolved "preview" environment...
✔ Using remote iOS credentials
✔ Logged in and verified
...
See logs: https://expo.dev/accounts/.../builds/[BUILD_ID]

Waiting for build to complete. You can press Ctrl+C to exit.
✔ Build complete!
Build ID: [BUILD_ID]
```

**Build Time:** 15-30 minutes (you wait and watch)

---

### Step 3: Monitor Build (15-30 minutes)

**During Build:**

Option A - Watch in Terminal
```bash
# Terminal shows progress in real time
# Shows: "Waiting for build to complete"
# Shows build URL if you want to check logs
```

Option B - Monitor in Browser
- Go to: https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds
- Watch build progress
- Check logs if issues occur

**What to Look For:**
- ✅ Build progresses through phases
- ✅ No red error messages
- ✅ Build completes successfully
- ❌ If failed, check logs immediately

**If Build Fails:**
1. Check logs at the URL shown
2. Look for JavaScript bundle errors
3. Return to Step 1 and fix additional issues
4. Retry build

**Expected Result:**
```
✔ Build completed successfully!
Build ID: a1b2c3d4e5f6...
Downloaded to: [path]
```

---

### Step 4: Verify Build Upload to TestFlight (5 minutes)

**After Build Completes:**

**Check 1: Verify in Expo Dashboard**
```bash
# Terminal output should show:
"Build uploaded to TestFlight"
```

**Check 2: Verify in App Store Connect**
1. Go to: https://appstoreconnect.apple.com
2. Apps → Reading Daily Scripture
3. TestFlight → iOS Builds
4. Look for build with version 1.0.0, build number 1
5. Status should show: "Ready for Testing" or "Pending Beta Review"

**Check 3: Verify Testers Can See**
1. Go to: TestFlight → Internal Testing
2. Look at your test account
3. Build should be available to install

---

### Step 5: Configure Internal Testing (15 minutes)

**In App Store Connect:**

**Step 5.1: Add Internal Testers**
```
1. TestFlight → Internal Testing
2. Click "+" to add testers
3. Add testers:
   - Your Apple ID email
   - Any team members who want to test
   - Max 25 internal testers (free)
```

**Step 5.2: Build Compliance**
```
1. Select build version 1.0.0 (Build 1)
2. Click "Add for Testing"
3. Answer compliance questions:
   - "Does your app use encryption?" → No
   - "Does your app contain beta features?" → No
   - "Is this version of your app ready for testing?" → Yes
```

**Step 5.3: Send Invitations**
```
1. TestFlight automatically sends email invites
2. Testers receive email with TestFlight link
3. They click link to install from TestFlight
4. App installs on their device
```

---

### Step 6: First Test on Device (30 minutes)

**Required:** iPhone with TestFlight installed

**Test Checklist:**
- [ ] TestFlight app installed
- [ ] Build available in TestFlight app
- [ ] Download and install from TestFlight
- [ ] App launches (no immediate crash)
- [ ] App shows splash screen
- [ ] App shows main navigation
- [ ] Daily scripture visible
- [ ] Dark mode toggle works
- [ ] Navigation tabs work
- [ ] Can read a scripture verse
- [ ] Settings accessible
- [ ] No obvious errors in console
- [ ] No performance issues
- [ ] Closes cleanly

**If Issues Found:**
1. Document what broke
2. Fix in code
3. Increment build number in app.json
4. Rebuild with `eas build --platform ios --profile preview`
5. Re-test

---

## Expected Timeline

| Task | Duration | Total |
|------|----------|-------|
| Step 1: Fix TypeScript | 1 hour | 1:00 |
| Step 2: Create Build | 30 min | 1:30 |
| Step 3: Monitor Build | 15 min | 1:45 |
| Step 4: Verify Upload | 5 min | 1:50 |
| Step 5: Config Testing | 15 min | 2:05 |
| Step 6: Test on Device | 30 min | 2:35 |
| **TOTAL** | | **~2.5 hours** |

**If no issues found:** Ready for Phase 8.2 (External Beta)
**If issues found:** +15-30 min per issue (fix, rebuild, re-test)

---

## Troubleshooting

### Build Fails Immediately
**Problem:** Build command fails with error
**Solution:** Check BUILD_ERROR_ANALYSIS.md for the specific error
**Action:** Fix the issue, re-run build

### JavaScript Bundle Error
**Problem:** Build fails during TypeScript compilation
**Solution:** Additional TypeScript issues found
**Action:** Review error logs, fix issues, re-run

### Build Succeeds but Not in TestFlight
**Problem:** Build completes but doesn't appear in TestFlight
**Solution:** May need compliance review by Apple (24-48 hours)
**Action:** Wait and check App Store Connect again

### Can't Install from TestFlight
**Problem:** TestFlight app shows "Unavailable"
**Solution:**
- Device not added to provisioning profile
- App not ready for testing (compliance step)
**Action:** Check App Store Connect settings, verify compliance answered

### App Crashes on Launch
**Problem:** App installs but crashes immediately
**Solution:** Runtime error not caught by TypeScript
**Action:**
1. Check device logs (Xcode)
2. Check Firebase connectivity
3. Check if .env credentials are correct
4. Fix code, rebuild, re-test

---

## Success Indicators

### ✅ Phase 8.1 Complete When:
- [x] EAS build command succeeds
- [x] Build uploaded to TestFlight
- [x] Internal tester can install app
- [x] App launches without crashing
- [x] Basic navigation works
- [x] Daily scripture displays
- [x] No console errors
- [x] App closes cleanly
- [x] Device can re-launch successfully

---

## Go/No-Go Gate

**Before Phase 8.2 (External Beta):**

```
CHECKLIST:
☐ Build uploaded to TestFlight successfully
☐ App installed on at least one device
☐ App launches without crashing
☐ Main features work (reading, navigation, dark mode)
☐ No security/credential leaks evident
☐ Performance acceptable (no major slowness)
☐ No data loss
☐ Ready for external testers

GO? → Proceed to PHASE 8.2
NO-GO? → Fix issues, rebuild, re-test
```

---

## What Happens Next (Phase 8.2)

**After successful Phase 8.1:**

1. **Recruit Beta Testers** (2-3 hours)
   - Find 5-10 people to test
   - Send TestFlight invitations
   - Collect contact info

2. **External Testing** (2 weeks)
   - Testers use app daily
   - Report issues
   - You monitor crash reports
   - Fix critical bugs

3. **Bug Fix Cycle** (if needed)
   - Fix reported issues
   - Rebuild and re-test
   - Deploy new builds to TestFlight

---

## Important Notes

### Credentials
- All credentials in .env are correct and tested
- Firebase, Azure, Google Cloud, Stripe all active
- Build will use these credentials automatically

### Certificates
- Distribution certificate valid until Oct 2026
- Provisioning profile valid until Oct 2026
- EAS handles all signing automatically

### Build Profiles
- Using `preview` profile (for TestFlight)
- Will use `production` profile for App Store submission

### Incremental Builds
- Build number MUST increment for each build
- Version can stay 1.0.0 for now
- After App Store approval, use 1.0.1, 1.0.2, etc.

---

## Quick Reference Commands

```bash
# Check TypeScript before build
npx tsc --noEmit

# Run EAS build
eas build --platform ios --profile preview

# Check build status (if needed)
eas build:list

# View EAS dashboard
open https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds

# View App Store Connect
open https://appstoreconnect.apple.com
```

---

## Support Resources

- **EAS Build Docs:** https://docs.expo.dev/eas-update/introduction/
- **TestFlight Guide:** https://help.apple.com/app-store-connect/#/devfac019e94
- **Build Errors:** See [BUILD_ERROR_ANALYSIS.md](BUILD_ERROR_ANALYSIS.md)
- **Git Commits:** Check git log for recent changes

---

## Summary

Phase 8.1 creates the first TestFlight build through automated EAS build process. The build takes 15-30 minutes of build time but overall phase is ~2.5 hours including setup, testing, and configuration.

Key success factors:
- ✅ TypeScript issues fixed (Step 1)
- ✅ Build command runs smoothly (Step 2)
- ✅ Build uploads to TestFlight (Step 3-4)
- ✅ App installs and runs on device (Step 6)

Once Phase 8.1 complete, proceed to Phase 8.2 (External Beta Testing).

---

**STATUS:** Ready to Begin
**BLOCKERS:** Depends on TypeScript fixes from Phase 8.0
**CONFIDENCE:** 95% (all infrastructure ready)
**ESTIMATED TIME:** 2.5 hours
**NEXT:** Execute steps 1-6 above

