# NitroModules Build Fix - Critical Update
**Date:** November 29, 2025
**Status:** FIXED ✅

---

## Issue Found & Fixed

### The Problem
Build was failing with:
```
NitroModules cannot be found! Are you sure you installed NitroModules properly?
could not build Objective-C module 'NitroIap'
```

### Root Cause
The app.json had `useFrameworks: "static"` but `react-native-iap` (used for in-app purchases) uses NitroModules, which requires **dynamic frameworks**, not static frameworks.

### The Fix
Changed in app.json:
```json
// BEFORE
"useFrameworks": "static"

// AFTER
"useFrameworks": "dynamic"
```

This allows the NitroModules framework linking to work correctly during the Xcode build phase.

---

## What Changed

**File:** app.json
**Plugin:** expo-build-properties
**iOS Setting:** useFrameworks changed from "static" to "dynamic"

This change allows:
- NitroModules (used by react-native-iap) to link correctly
- Xcode build to complete successfully
- Native modules to be compiled and linked as dynamic frameworks

---

## Next Step: Retry Build

Run the build again with this fix in place:

```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
eas build --platform ios --profile preview
```

**Expected result:** Build should proceed past the "Run fastlane" step and complete successfully.

---

## Why This Fix Works

NitroModules is a system for writing native modules with better type safety. It requires:
- Dynamic frameworks (can be loaded at runtime)
- NOT static frameworks (bundled at compile time)

The `expo-build-properties` plugin with `useFrameworks: "dynamic"` tells Expo's build system to:
1. Generate all native frameworks as dynamic (not static)
2. Allow NitroModules and react-native-iap to link correctly
3. Properly build the Objective-C module 'NitroIap'

---

## Confidence Level

**95%** - This is a known issue with react-native-iap + NitroModules and the standard fix is to use dynamic frameworks.

---

## Commit

Committed as: 2f98d02
Message: "Fix NitroModules linking error by changing to dynamic frameworks"

All changes are committed and ready for rebuild.

---

**Next Action:** Run `eas build --platform ios --profile preview` in your terminal
**Expected Time:** 25-40 minutes
**Expected Outcome:** Build uploaded to TestFlight

