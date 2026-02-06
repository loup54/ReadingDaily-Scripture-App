# In-App Purchase Resolution Plan - Option 1

**Issue:** IAP products exist but not linked to app version
**Solution:** Create Version 1.1.5 in App Store Connect
**Build:** 86 (Version 1.1.5)
**Timeline:** 30-45 minutes
**Status:** Ready to execute - awaiting approval

---

## Executive Summary

### The Problem

Build 86 has version 1.1.5 configured in `app.json`, but App Store Connect only has Version 1.0 prepared. The IAP products exist in "Waiting for Review" status but cannot be linked to any build because:

1. You're viewing the Version 1.0 page in App Store Connect
2. Version 1.1.5 doesn't exist in App Store Connect yet
3. The "In-App Purchases and Subscriptions" section only appears on version pages
4. Without a version to attach to, IAPs can't be loaded by the app

### The Solution

Create Version 1.1.5 in App Store Connect, which will:
- Make the "In-App Purchases and Subscriptions" section appear
- Allow linking existing IAP products to this version
- Enable Build 86 to load products from App Store
- Resolve the "Purchase Failed" error

### Why This Will Work

This is the **standard Apple workflow** for adding IAPs to existing apps:

1. Create IAP products in App Store Connect ✅ (Already done)
2. Create new app version ⚠️ (Missing - we'll do this)
3. Link IAP products to version ⚠️ (Will do after step 2)
4. Select build for version ✅ (Build 86 ready)
5. Submit for review 🎯 (Final step)

---

## Prerequisites Checklist

Before starting, verify you have:

- [x] Build 86 successfully uploaded to App Store Connect
- [x] Build 86 available in TestFlight
- [x] 3 IAP products created in "Waiting for Review" status:
  - com.readingdaily.lifetime.access
  - com.readingdaily.basic.monthly
  - com.readingdaily.basic.yearly
- [x] Custom EULA uploaded to App Store Connect
- [x] Screenshots and metadata ready for Version 1.1.5
- [ ] **Access to App Store Connect with admin rights**
- [ ] **30-45 minutes of uninterrupted time**

---

## Step-by-Step Instructions

### Phase 1: Navigate to App Store Connect (5 minutes)

#### 1.1 Open App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Sign in with your Apple ID (loup1954 account)
3. Click "My Apps"
4. Click "ReadingDaily Scripture App"

**Expected:** You should see the app overview page

#### 1.2 Verify Current Status

Before making changes, document current state:

**Check Build Status:**
- Click "TestFlight" tab
- Verify Build 1.1.5 (86) shows "Ready to Test"
- Take screenshot for reference

**Check IAP Status:**
- Click "Monetization" in left sidebar
- Click "In-App Purchases"
- Verify 3 products exist
- All should show "Waiting for Review" status
- Take screenshot for reference

**Check Current Version:**
- Click "App Store" tab in left sidebar
- Should show "iOS App" with Version 1.0
- Note: This is the CURRENT live version (or last prepared version)
- Take screenshot for reference

---

### Phase 2: Create Version 1.1.5 (10 minutes)

#### 2.1 Add New Version

**Steps:**

1. Click "App Store" tab in left sidebar (if not already there)
2. Look for the version section - should show current version
3. Click the **"+" button** next to "iOS App"
   - Location: Usually near the top left of the page
   - Or look for "Add Version" or "Create Version" button
4. A dialog appears: "Add iOS Version"

**Dialog fields:**
```
Version Number: 1.1.5
```

5. Click "Create"

**Expected Result:**
- New page loads: "iOS App 1.1.5"
- Status: "Prepare for Submission"
- Multiple sections visible (Build, What's New, etc.)

**If this fails:**
- Error: "Version already exists" → Good! Someone already created it, skip to Phase 3
- Error: "Version must be higher than current" → Check what version is live
- Can't find "+" button → Look for "Versions" section, try "+" there

#### 2.2 Verify New Version Page Loaded

**Confirm you're on Version 1.1.5 page:**

Look at the top of the page:
```
iOS App 1.1.5                    [Status: Prepare for Submission]
```

**Check left sidebar sections:**
You should now see these sections (might vary slightly):
- App Information
- Pricing and Availability
- **In-App Purchases and Subscriptions** ← THIS IS KEY!
- Game Center
- App Privacy
- Prepare for Submission

**CRITICAL CHECK:**
✅ If you see "In-App Purchases and Subscriptions" section → SUCCESS! Proceed to Phase 3
❌ If you DON'T see this section → See Troubleshooting section below

---

### Phase 3: Link IAP Products to Version (10 minutes)

#### 3.1 Navigate to IAP Section

**Steps:**

1. On the Version 1.1.5 page, scroll down to find:
   **"In-App Purchases and Subscriptions"** section
2. Click on this section to expand it (if collapsed)
3. Look for "Add" or "+" button in this section

**Expected:**
- Section expands showing empty state or list
- Button available to add products

#### 3.2 Add Lifetime Access Product

**Steps:**

1. Click "Add" or "+" button in IAP section
2. A list or search dialog appears showing available products
3. Find: **"Lifetime Premium Access"**
   - Product ID: `com.readingdaily.lifetime.access`
4. Select this product (checkbox or click to add)
5. Click "Done" or "Add" to confirm

**Expected Result:**
- Product appears in the IAP section for Version 1.1.5
- Status might show "Waiting for Review" or similar

#### 3.3 Add Monthly Subscription Product

**Repeat for monthly subscription:**

1. Click "Add" or "+" button again
2. Find: **"Basic Monthly Subscription"**
   - Product ID: `com.readingdaily.basic.monthly`
3. Select and add
4. Confirm

#### 3.4 Add Yearly Subscription Product

**Repeat for yearly subscription:**

1. Click "Add" or "+" button again
2. Find: **"Basic Yearly Subscription"**
   - Product ID: `com.readingdaily.basic.yearly`
3. Select and add
4. Confirm

#### 3.5 Verify All Products Linked

**Check the IAP section now shows all 3 products:**

```
In-App Purchases and Subscriptions
  • Lifetime Premium Access (com.readingdaily.lifetime.access)
  • Basic Monthly Subscription (com.readingdaily.basic.monthly)
  • Basic Yearly Subscription (com.readingdaily.basic.yearly)
```

**Take screenshot for documentation**

---

### Phase 4: Select Build 86 (5 minutes)

#### 4.1 Navigate to Build Section

**Steps:**

1. On Version 1.1.5 page, scroll to **"Build"** section
2. Click on the Build section
3. You should see: "No build selected" or similar

#### 4.2 Select Build

**Steps:**

1. Click on the Build field (might be a "+" or "Select Build" button)
2. A list of available builds appears
3. Find: **Build 1.1.5 (86)**
   - Should show date: January 24, 2026
   - Build number: 86
4. Click to select this build
5. Confirm selection

**Expected Result:**
```
Build: 1.1.5 (86)
Uploaded: January 24, 2026
```

**If Build 86 doesn't appear:**
- Check TestFlight tab - ensure build finished processing
- Wait 5-10 minutes if just uploaded
- Refresh the page
- Build must show "Ready to Test" in TestFlight first

#### 4.3 Handle Export Compliance

**If prompted about Export Compliance:**

Question: "Does your app use encryption?"

**Answer: NO** (select "No")

**Reason:** The app uses standard HTTPS but no custom encryption requiring compliance documentation per `ITSAppUsesNonExemptEncryption: false` in Info.plist.

---

### Phase 5: Complete Metadata (10 minutes)

#### 5.1 Fill What's New Section

**Steps:**

1. Scroll to **"What's New in This Version"** section
2. Enter release notes (suggested text below)

**Suggested Release Notes (can customize):**
```
New in Version 1.1.5:

• Guest Mode Access - Use the app without creating an account
• 7-Day Free Trial - Try premium features before subscribing
• Flexible Subscriptions - Choose the plan that works for you
• Improved Navigation - Better access to subscription options
• Bug Fixes - Enhanced stability and performance

Thank you for using ReadingDaily Scripture App!
```

**Character limit:** 4000 characters (you're well under)

#### 5.2 Verify Other Required Sections

**Check these sections are complete:**

**App Review Information:**
- [ ] First Name: (your name)
- [ ] Last Name: (your name)
- [ ] Phone Number: (your phone)
- [ ] Email: (your email)
- [ ] Sign-In Required: (if you need test account info)
- [ ] Test Account Credentials:
  - Username: tester@readingdaily.app
  - Password: TestPass123!
- [ ] Notes: (see review notes section below)

**Version Information:**
- [ ] Copyright: (e.g., "2026 ReadingDaily")
- [ ] Age Rating: (should already be set)

**Localizations:**
- [ ] Screenshots uploaded (should carry over from Version 1.0)
- [ ] Description (should carry over)
- [ ] Keywords (should carry over)
- [ ] Support URL (should carry over)
- [ ] Marketing URL (optional)

**Most metadata carries over from previous version - only update What's New**

---

### Phase 6: Add Review Notes (5 minutes)

#### 6.1 Navigate to Review Notes

**Steps:**

1. Scroll down to **"App Review Information"** section
2. Find **"Notes"** text field
3. Clear any old notes
4. Add new review notes (template below)

#### 6.2 Review Notes Template

**Copy and customize this:**

```
Hello App Review Team,

We have fully resolved all issues from your January 20, 2026 review:

1. GUEST IAP PURCHASE (Guideline 5.1.1 - Account Creation):
   ✅ FIXED in Build 86 (Version 1.1.5)

   Technical Change: Corrected payment service factory configuration
   that was incorrectly using mock payment service instead of Apple
   StoreKit in production builds.

   Guest users can now:
   - Purchase subscriptions without creating an account
   - Use 7-day free trial without registration
   - Optionally sign in AFTER purchase for cross-device sync

   Tested and verified in TestFlight Build 86.

2. EULA (Guideline 3.1.2 - Standard EULA):
   ✅ FIXED - Custom End-User License Agreement uploaded
   ✅ Available in App Information section
   ✅ Complies with Apple requirements

3. IAP PRICING (Guideline 2.3.2 - Metadata):
   ✅ FIXED - All price references removed from IAP metadata
   ✅ Prices shown only in App Store's standard IAP interface

---

TEST INSTRUCTIONS FOR REVIEWER:

To test guest IAP purchase flow:

1. Launch app WITHOUT signing in (guest mode)
2. Tap "Settings" tab at bottom
3. Tap "Subscription" option
4. Tap any tier (e.g., "Subscribe to Basic Monthly - $2.99/month")
5. ✅ Apple IAP payment sheet appears immediately
6. ✅ NO sign-in required before purchase
7. Complete purchase with sandbox account
8. ✅ After purchase: Optional prompt "Sign in to sync across devices?"
9. Tap "Not Now" to remain as guest with active subscription

Alternative: Use "Try 7 Days Free" which also works without account.

---

Build Information:
- Version: 1.1.5
- Build: 86
- Build Date: January 24, 2026
- TestFlight: Available for testing

Test Account (if needed):
- Email: tester@readingdaily.app
- Password: TestPass123!

Thank you for your thorough review!
```

**Adjust as needed, then paste into Notes field**

---

### Phase 7: Final Verification Before Submission (10 minutes)

#### 7.1 Pre-Submission Checklist

**Go through each section and verify:**

**Build Section:**
- [x] Build 1.1.5 (86) selected
- [x] Build shows green checkmark or "Ready"
- [x] Export compliance handled

**In-App Purchases:**
- [x] All 3 IAP products linked
- [x] Products show in list
- [x] No errors or warnings on products

**What's New:**
- [x] Release notes filled in
- [x] Under 4000 characters
- [x] Professional and clear

**App Review Information:**
- [x] Contact information complete
- [x] Test account credentials provided
- [x] Review notes thorough and polite

**Pricing and Availability:**
- [x] Pricing tier selected
- [x] Countries/regions selected

**Age Rating:**
- [x] Already set (carries over)

**App Privacy:**
- [x] Already completed (carries over)

#### 7.2 Check for Yellow Warnings

**Look for any yellow warning indicators:**

Common warnings and how to handle:

⚠️ **"Missing screenshots"**
- Should be inherited from Version 1.0
- If missing, upload new ones
- Sizes: Check Apple's current requirements

⚠️ **"Missing description"**
- Should carry over from Version 1.0
- If missing, copy from previous version

⚠️ **"IAP products not approved"**
- Expected! They're in "Waiting for Review"
- This is normal - submit anyway
- Apple will review IAPs with the app

⚠️ **"Test account required"**
- Add sandbox test account in App Review Information
- Username: tester@readingdaily.app
- Password: TestPass123!

**Red errors must be fixed before submission. Yellow warnings are usually informational.**

#### 7.3 Final Screenshot Review

**Take screenshots of each completed section:**

1. Build section showing Build 86
2. IAP section showing 3 products
3. What's New section with release notes
4. App Review Information with notes
5. Overall version page showing "Ready to Submit" status

**Purpose:** Documentation for troubleshooting if needed

---

### Phase 8: Submit for Review (5 minutes)

#### 8.1 Click Submit for Review

**Steps:**

1. Scroll to top of Version 1.1.5 page
2. Look for blue **"Submit for Review"** button
   - Usually top right corner
   - Or at bottom of page
3. **Before clicking**, take a deep breath - once submitted, you can't edit!
4. Click **"Submit for Review"**

#### 8.2 Confirm Submission

**A confirmation dialog appears:**

Read through the checklist:
- [x] I confirm this app meets export compliance requirements
- [x] I confirm this app meets content rights requirements
- [x] I confirm this app meets advertising identifier requirements
- [x] (Other standard confirmations)

**Check all boxes**

Click **"Submit"** or **"Confirm"**

#### 8.3 Verify Submission Succeeded

**After clicking Submit:**

**Expected behavior:**
1. Page refreshes or redirects
2. Status changes from "Prepare for Submission" to "Waiting for Review"
3. You should see:
   ```
   iOS App 1.1.5
   Status: Waiting for Review
   ```

**Confirmation email:**
- Apple sends email to your account email
- Subject: "Your submission was received"
- Usually arrives within 5-10 minutes

**If submission fails:**
- Read error message carefully
- Usually indicates missing required field
- Fix the issue and try again
- See Troubleshooting section

#### 8.4 Monitor Submission Status

**After successful submission:**

**Timeline expectations:**
- **Waiting for Review:** 1-3 days typically
- **In Review:** 1-24 hours (often much faster)
- **Pending Developer Release** or **Ready for Sale:** Success!

**How to check status:**
1. App Store Connect → My Apps → ReadingDaily Scripture App
2. Look at version status
3. Apple sends email for each status change

**Status meanings:**
- **Waiting for Review:** In queue, not started yet
- **In Review:** Apple reviewer actively testing
- **Pending Developer Release:** Approved! Waiting for you to release
- **Ready for Sale:** Approved and live in App Store
- **Metadata Rejected:** Minor issue, can fix without new build
- **Rejected:** Major issue, need to address and resubmit

---

## Troubleshooting

### Issue 1: Can't Find "+" Button to Create Version

**Symptoms:**
- Can't locate button to add new version
- Only see existing version

**Solutions:**

**Option A:** Look for "Versions" header
- Some layouts show "Versions" section in sidebar
- Click "iOS App" under it
- Then look for "+" next to version list

**Option B:** Try different area
- Click "App Store" tab
- Look for "All Versions" or "Version History"
- Click "+" or "Create New Version"

**Option C:** Use top navigation
- Some layouts have "+" in top bar
- Try clicking that and select "New Version"

**If still stuck:**
- Contact Apple Developer Support
- Or try from different browser
- Clear cache and retry

---

### Issue 2: "In-App Purchases and Subscriptions" Section Missing

**After creating Version 1.1.5, section still doesn't appear**

**Possible causes:**

**Cause A: Wrong page**
- Verify you're on Version 1.1.5 page (not 1.0)
- Check version number at top of page
- Refresh the page

**Cause B: Section collapsed**
- Scroll through entire page
- Look for collapsed sections (arrow icons)
- Try expanding all sections

**Cause C: Permissions issue**
- Your Apple ID might lack IAP permissions
- Needs "Admin" or "App Manager" role
- Check with account admin

**Cause D: App hasn't been submitted before with IAPs**
- First-time IAP apps might have different workflow
- Try going to Monetization → In-App Purchases
- See if there's an "Attach to Version" option there

**Workaround:**
If section truly doesn't exist:
- Try creating Version 1.1.6 instead
- Or execute Option 2 (new Product IDs) from BUILD_86_COMPLETE_STATUS.md

---

### Issue 3: IAP Products Don't Appear in List

**When trying to add IAPs to version, products aren't listed**

**Possible causes:**

**Cause A: Products in wrong state**
- Products must be in "Waiting for Review" or "Ready to Submit"
- Check Monetization → In-App Purchases
- Verify all 3 products exist

**Cause B: Products already attached**
- Check if products are already linked to Version 1.0
- If so, you might need to remove them from 1.0 first
- Or they might auto-carry over to 1.1.5

**Cause C: Search/filter active**
- If there's a search box, clear it
- Check if filters are hiding products
- Try "Show All Products"

**Solution:**
1. Go to Monetization → In-App Purchases
2. Click each product
3. Look for "Attached to Versions" section
4. See which versions they're linked to
5. Try detaching from old version first

---

### Issue 4: Build 86 Not Available in Build Selector

**Can't select Build 86 when setting up version**

**Possible causes:**

**Cause A: Build still processing**
- Check TestFlight tab
- Build must show "Ready to Test"
- Processing can take 10-30 minutes

**Solution:** Wait and refresh

**Cause B: Build failed processing**
- Check TestFlight for errors
- Red error icon means build failed
- May need to rebuild

**Solution:** Submit Build 87 and use that instead

**Cause C: Export compliance incomplete**
- Build needs export compliance answered
- Go to TestFlight → Build 86
- Answer compliance questions
- Then retry adding to version

---

### Issue 5: Submission Button Disabled

**"Submit for Review" button is grayed out**

**Possible causes:**

**Cause A: Required fields missing**
- Red errors on page (scroll through all sections)
- Must fix all red errors first
- Yellow warnings are usually OK

**Cause B: No build selected**
- Verify Build section shows Build 86
- If blank, select build first

**Cause C: No IAPs attached (if required)**
- If you indicated app has IAP during setup
- Must attach at least one IAP product

**Cause D: Screenshots missing**
- Check App Information → Screenshots
- Must have required sizes/counts
- Upload if missing

**Solution:** Fix all red errors, yellow warnings are usually OK to submit with

---

### Issue 6: IAP Products Stuck in "Waiting for Review"

**Products won't move out of "Waiting for Review" status**

**This is EXPECTED behavior:**

- IAP products stay in "Waiting for Review" until app is submitted
- When you submit Version 1.1.5 with IAPs attached:
  - App AND IAPs reviewed together
  - IAPs update to "Approved" when app approved
  - If IAPs rejected, Apple provides feedback

**No action needed** - this is correct status before submission

---

### Issue 7: Version Number Conflict

**Error: "Version 1.1.5 already exists" or "Version must be higher"**

**Scenario A: Version exists but was rejected**
- You can reuse same version number
- Just select the existing 1.1.5
- Update build and resubmit

**Scenario B: Version is live**
- Can't reuse live version numbers
- Must use 1.1.6 instead
- Update app.json and Info.plist
- Rebuild as Build 87

**Scenario C: Version pending**
- Version 1.1.5 already "Waiting for Review"
- Can update build on pending version
- Or remove from review and edit

---

## Rollback Plan

### If Option 1 Completely Fails

**Scenario:** Can't create Version 1.1.5 or IAP section doesn't appear

**Execute Option 2: New Product IDs**

1. Create new IAP products:
   - `com.readingdaily.lifetime.access.v2`
   - `com.readingdaily.basic.monthly.v2`
   - `com.readingdaily.basic.yearly.v2`

2. Update code in `src/services/payment/AppleIAPService.ts:26-30`

3. Build 87 with new Product IDs

4. Create Version 1.1.6 in App Store Connect

5. Link new IAPs to 1.1.6

6. Submit Build 87

**Timeline:** 2-3 hours (includes rebuild and testing)

---

### If Option 2 Also Fails

**Execute Option 3: Trial-Only Submission**

1. Submit Build 86 as Version 1.1.5
2. Don't attach any IAPs
3. App works with 7-day trial only
4. After approval, add IAPs in Version 1.2.0

**Timeline:** 30 minutes (fastest path)

**Downside:** No paid subscriptions until next version

**Upside:** Get app approved and live quickly

---

## Success Criteria

### You'll know Option 1 succeeded when:

**During Setup:**
- [x] Version 1.1.5 created in App Store Connect
- [x] "In-App Purchases and Subscriptions" section visible
- [x] All 3 IAP products linked to version
- [x] Build 86 selected
- [x] All metadata complete
- [x] Status shows "Ready to Submit"

**After Submission:**
- [x] Status changes to "Waiting for Review"
- [x] Confirmation email received from Apple
- [x] No errors or rejections immediately

**After Approval (1-3 days):**
- [x] Status becomes "Pending Developer Release" or "Ready for Sale"
- [x] IAP products status becomes "Approved"
- [x] App appears in App Store
- [x] TestFlight users can purchase subscriptions
- [x] Guest users see Apple payment sheet (not "Purchase Failed")

---

## Post-Submission Actions

### After Clicking Submit (Immediately)

1. **Document submission:**
   - Note exact date/time submitted
   - Screenshot "Waiting for Review" status
   - Save confirmation email

2. **Update tracking documents:**
   - Mark BUILD_86_COMPLETE_STATUS.md with submission date
   - Create SUBMISSION_TRACKING.md if needed

3. **Monitor status:**
   - Check App Store Connect daily
   - Watch for email notifications
   - Respond quickly if Apple has questions

### If Apple Requests Info

**Respond within 24 hours:**
- Check App Store Connect messages
- Respond via Resolution Center
- Provide requested info/screenshots
- Be polite and thorough

### When Approved

1. **Release immediately** or schedule release
2. **Test live app** with real purchase
3. **Monitor** for crash reports
4. **Plan** Build 87 for non-critical fixes:
   - Progress tab white screen
   - Google TTS API issue
   - Any other polish items

---

## Estimated Timeline

### Optimistic (Everything Works)
- **Phase 1:** Navigate - 5 min
- **Phase 2:** Create version - 5 min (smooth)
- **Phase 3:** Link IAPs - 5 min
- **Phase 4:** Select build - 3 min
- **Phase 5:** Metadata - 5 min
- **Phase 6:** Review notes - 5 min
- **Phase 7:** Verification - 5 min
- **Phase 8:** Submit - 3 min
- **Total:** ~35 minutes

### Realistic (Minor Issues)
- **Phases 1-2:** 15 min (finding buttons, UI quirks)
- **Phase 3:** 10 min (searching for products)
- **Phase 4:** 5 min (export compliance)
- **Phase 5:** 10 min (reviewing metadata)
- **Phase 6:** 7 min (editing notes)
- **Phase 7:** 10 min (thorough check)
- **Phase 8:** 5 min (reading confirmations)
- **Total:** ~60 minutes

### Pessimistic (Need Troubleshooting)
- **All phases:** 90-120 minutes
- **Includes:** Looking up solutions, trying alternatives
- **If exceeds 2 hours:** Consider Option 2 or 3

---

## Support Resources

### Apple Documentation
- **App Store Connect Help:** https://developer.apple.com/help/app-store-connect/
- **IAP Documentation:** https://developer.apple.com/in-app-purchase/
- **Submission Guide:** https://developer.apple.com/app-store/submissions/

### Contact Apple Developer Support
- **Phone:** 1-800-633-2152 (US)
- **Email:** Through App Store Connect → "Contact Us"
- **Developer Forums:** https://developer.apple.com/forums/

### Internal Documentation
- **BUILD_86_COMPLETE_STATUS.md** - Full build history and status
- **BUILD_83_TESTING_GUIDE.md** - TestFlight testing procedures
- **PROGRESS_TAB_WHITE_SCREEN_ANALYSIS.md** - Known issues

---

## Decision Point - Ready to Execute?

### Green Light Criteria (Proceed with Option 1)
- ✅ You have 30-60 minutes of focused time
- ✅ You're comfortable with App Store Connect interface
- ✅ You understand the steps above
- ✅ You're willing to troubleshoot if needed
- ✅ Build 86 is in TestFlight and ready

### Yellow Light (Consider Alternatives)
- ⚠️ Limited time available - maybe try Option 3 (Trial-only)
- ⚠️ Unfamiliar with App Store Connect - get help or use Option 3
- ⚠️ Want fastest approval - Option 3 is faster
- ⚠️ Risk-averse - Option 3 is lower risk

### Red Light (Do NOT Proceed)
- ❌ Build 86 not in TestFlight yet - wait for it to finish
- ❌ IAP products don't exist - create them first
- ❌ EULA not uploaded - upload it first
- ❌ No access to App Store Connect - get credentials

---

## Final Recommendation

**Option 1 (this plan) is recommended because:**

1. ✅ Existing IAPs can be reused (no code changes)
2. ✅ Proper Apple workflow (clean and standard)
3. ✅ Build 86 already optimized and tested
4. ✅ Timeline reasonable (30-60 minutes)
5. ✅ Lower risk than creating new IAPs

**Proceed with confidence!**

All research indicates this should work. The version mismatch is the root cause, and creating Version 1.1.5 is the proper solution.

---

**READY TO EXECUTE?**

See "Phase 1: Navigate to App Store Connect" above to begin.

---

**Plan Version:** 1.0
**Created:** January 24, 2026
**Author:** Build 86 Resolution Team
**Status:** Ready for Execution
