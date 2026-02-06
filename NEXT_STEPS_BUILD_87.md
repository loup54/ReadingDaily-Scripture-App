# Next Steps - Build 87 Required

**Date:** January 24, 2026
**Status:** Code updated, ready to build

---

## What We Accomplished Today

### ✅ Completed Tasks

1. **Created Version 1.1.5** in App Store Connect (updated from 1.0)
2. **Removed old IAPs** from review (they were blocking attachment)
3. **Created 3 new IAP products** with .v2 Product IDs:
   - Lifetime Premium Access: `com.readingdaily.lifetime.access.v2` - $49.99
   - Monthly Premium: `com.readingdaily.basic.monthly.v2` - $2.99/month
   - Yearly Premium: `com.readingdaily.basic.yearly.v2` - $19.99/year
4. **Updated app code** with new Product IDs (`src/services/payment/AppleIAPService.ts`)

### 📋 Current Status

- **Version 1.1.5:** Ready for Review in App Store Connect
- **Build 86:** Currently selected, but has OLD Product IDs (won't work)
- **IAP Products:** All 3 created, status "Ready to Submit"
- **Code:** Updated with .v2 Product IDs
- **Draft Submission:** Exists but waiting for correct build

---

## 🚨 Critical Issue Discovered

The App Store Connect interface did NOT provide a visible way to attach IAPs to Version 1.1.5. This could be because:

1. **Interface bug** - Sometimes ASC doesn't show the controls
2. **Workflow issue** - Maybe IAPs attach automatically when submitted together
3. **Missing step** - Something we haven't found yet

**However:** We had to recreate IAPs with .v2 Product IDs anyway, so Build 86 is now incompatible.

---

## Next Steps (When Ready to Continue)

### Step 1: Build 87

**Increment build numbers:**
- `app.json` → buildNumber: 87
- `ios/ReadingDailyScriptureApp/Info.plist` → CFBundleVersion: 87

**Build command:**
```bash
cd ~/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
eas build --platform ios --profile production
```

**Expected:** Build completes in 15-20 minutes

---

### Step 2: Update Version 1.1.5 with Build 87

**In App Store Connect:**
1. Go to Version 1.1.5 page
2. Build section → Select Build 87 (when available)
3. Save

---

### Step 3: Research IAP Attachment

**Before submitting, investigate:**

**Option A: Submit without explicit attachment**
- Some reports suggest IAPs in "Ready to Submit" status attach automatically
- The "In-App Purchases and Subscriptions" section showing "(Optional)" supports this
- Risk: Unknown if this works

**Option B: Contact Apple Developer Support**
- Ask why no Add/+ button appears in IAP section
- Request guidance on proper workflow
- Timeline: 1-2 days response

**Option C: Try API/Transporter method**
- Some developers use App Store Connect API
- Or the Transporter app for metadata
- More complex, but might reveal options

---

### Step 4: Submit (Method TBD)

**If submitting without explicit attachment:**
1. Click "Draft Submissions (1)"
2. Submit for Review
3. Hope IAPs attach automatically

**If we find the attachment method:**
1. Attach all 3 IAPs to Version 1.1.5
2. Verify they show in draft submission
3. Submit for Review

---

## File Changes Made

### Updated: `src/services/payment/AppleIAPService.ts`

**Lines 28-35:**
```typescript
// Product IDs from Apple App Store Connect
// Updated to .v2 after recreating IAPs in App Store Connect (January 24, 2026)
const PRODUCT_IDS = [
  'com.readingdaily.lifetime.access.v2',
  // Phase 7: Subscription products
  'com.readingdaily.basic.monthly.v2',
  'com.readingdaily.basic.yearly.v2',
];
```

**Before:**
```typescript
const PRODUCT_IDS = [
  'com.readingdaily.lifetime.access',
  'com.readingdaily.basic.monthly',
  'com.readingdaily.basic.yearly',
];
```

---

## Testing Required After Build 87

### TestFlight Testing Checklist

**Before submission to Apple:**
- [ ] Build 87 appears in TestFlight
- [ ] Install Build 87 on physical device
- [ ] Guest mode → Subscription screen → Tap "Subscribe"
- [ ] **CRITICAL:** Apple IAP payment sheet appears (not "Purchase Failed")
- [ ] Products load correctly with .v2 Product IDs
- [ ] Can complete test purchase in sandbox
- [ ] Trial system still works

**If IAP products DON'T load in Build 87:**
- Issue is with Apple's backend not recognizing .v2 products
- May need to wait 24-48 hours for ASC to sync
- Or products truly need to be attached to version first

---

## Alternative Approaches If Stuck

### Alternative 1: Trial-Only Submission

**If IAP attachment remains impossible:**
1. Remove Build 87 from Version 1.1.5
2. Keep Build 86 (works perfectly with trial)
3. Submit without IAPs
4. Add IAPs in Version 1.2.0 later

**Pros:** Fastest approval path
**Cons:** No paid subscriptions until v1.2.0

---

### Alternative 2: New App Submission Workflow

Some developers report that first-time IAP submission requires:
1. Create NEW app version (we did this - 1.1.5)
2. Create IAPs (we did this - .v2 products)
3. Go to IAP product detail pages
4. Look for "Add to Version" button on each product
5. Manually add each product to the version FROM the product page

**Worth investigating:** Check each IAP product page for "Attach to Version" option

---

## Questions to Investigate

1. **Does the "In-App Purchases and Subscriptions" section on version page need a specific state/status to show Add button?**
   - Try refreshing page
   - Try different browser
   - Try Safari vs Chrome

2. **Are IAPs supposed to be added FROM the product pages instead of version page?**
   - Check Lifetime Premium Access detail page
   - Check subscription detail pages
   - Look for "Versions" or "Attach to Version" option

3. **Does "Ready to Submit" on IAPs mean they'll auto-attach when version is submitted?**
   - Research ASC documentation
   - Check developer forums
   - Ask in Apple Developer Forums

---

## Resources

**Apple Documentation:**
- In-App Purchases: https://developer.apple.com/in-app-purchase/
- App Store Connect Guide: https://developer.apple.com/help/app-store-connect/

**Developer Forums:**
- https://developer.apple.com/forums/

**Support:**
- App Store Connect → Contact Us
- Phone: 1-800-633-2152 (US)

---

## Current App Store Connect Status

**Version 1.1.5:**
- Status: Ready for Review
- Build: 86 (WRONG - needs Build 87)
- IAP Section: Visible but no way to add products

**IAP Products:**
- Lifetime Premium Access (.v2): Ready to Submit
- Monthly Premium (.v2): Ready to Submit
- Yearly Premium (.v2): Ready to Submit

**Draft Submission:**
- Contains: Version 1.1.5 only
- Missing: IAP products (should have 4 items total)

---

## Session Summary

**Total Time:** ~3 hours
**Progress:** Significant - learned root cause, created products, updated code
**Blocker:** IAP attachment method unclear in ASC interface
**Ready for:** Build 87 creation

**Next session:** Build 87, test in TestFlight, research IAP attachment, submit

---

**Status:** Paused - Ready to build when user continues
**Last Updated:** January 24, 2026, 11:52 PM
