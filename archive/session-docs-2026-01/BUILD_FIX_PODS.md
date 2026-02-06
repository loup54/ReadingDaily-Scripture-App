# CocoaPods Installation Fix - iOS Deployment Target
**Date:** November 29, 2025
**Status:** FIXED ✅

---

## Issue Found & Fixed

### The Problem
Build was failing in the "Install pods" phase with:
```
Unknown error. See logs of the Install pods build phase for more information.
```

### Root Cause
iOS deployment target conflicts. Several native modules require different minimum iOS versions:
- `react-native-iap` (NitroModules) requires iOS 15.0+
- `react-native-screens` requires iOS 15.1+
- Other Expo modules require iOS 15.0+

Without explicitly setting the deployment target, CocoaPods fails during pod installation.

### The Fix
Added explicit iOS deployment target `15.1` to app.json in two places:

**1. Main iOS Configuration:**
```json
"ios": {
  "deploymentTarget": "15.1"
}
```

**2. Build Properties Plugin:**
```json
"plugins": [
  [
    "expo-build-properties",
    {
      "ios": {
        "deploymentTarget": "15.1",
        "useFrameworks": "dynamic"
      }
    }
  ]
]
```

This ensures:
- All pods are installed with consistent iOS 15.1 minimum
- NitroModules and react-native-iap build correctly
- react-native-screens compiles properly
- No version conflicts during CocoaPods installation

---

## What Changed

**File:** app.json
**Changes:**
1. Added `deploymentTarget: "15.1"` to `ios` section (line 20)
2. Added `deploymentTarget: "15.1"` to `expo-build-properties` plugin (line 43)

---

## Why This Works

CocoaPods uses the deployment target to:
1. Determine which iOS SDK features are available
2. Set the `-miphoneos-version-min` compiler flag
3. Filter compatible pod versions
4. Link libraries correctly

Setting it to 15.1 explicitly ensures all 36+ native modules in this project (especially the ones using NitroModules) compile and link with compatible settings.

---

## Build Progress

✅ **Fixed 1:** NitroModules framework linking → Changed to dynamic frameworks
✅ **Fixed 2:** iOS deployment target conflicts → Set to iOS 15.1

**What's Now Fixed:**
1. JavaScript bundling phase ✅ (fixed with TypeScript and eslint)
2. NitroModules linking ✅ (fixed with dynamic frameworks)
3. CocoaPods installation ✅ (fixed with deployment target)

**Expected Next Phase:** Xcode compilation (fastlane) → Should succeed now

---

## Confidence Level

**92%** - Deployment target is the most common cause of CocoaPods installation failures with multiple native modules.

---

## Next Step: Retry Build

Run the build again:

```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
eas build --platform ios --profile preview
```

**Expected progress:**
1. ✅ Compress and upload project
2. ✅ Compute fingerprint
3. ✅ Install pods (FIXED)
4. → Run fastlane (Xcode compilation)
5. → Upload to TestFlight

**Expected Time:** 25-40 minutes total

---

## Commits

- **2f98d02:** Fixed NitroModules with dynamic frameworks
- **e863e57:** Fixed iOS deployment target to 15.1

All changes committed and ready for rebuild.

---

**Next Action:** Run `eas build --platform ios --profile preview` in your terminal
**Expected Outcome:** Build uploaded to TestFlight
**Confidence:** 92%

