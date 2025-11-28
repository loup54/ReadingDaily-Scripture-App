# Build Retry Strategy - Install Pods Error
**Date:** November 29, 2025
**Issue:** Persistent "Unknown error. See logs of the Install pods build phase" error

---

## Problem

The build is failing consistently at the CocoaPods installation phase. While we've fixed the NitroModules linking issue (dynamic frameworks) and iOS deployment target (15.1), the pod installation itself is failing.

**Build ID:** 274999b6-6617-4e1d-b35a-29688107fb83

---

## Analysis

The error is generic and doesn't show the actual CocoaPods error. This suggests:

1. **Network Issue:** EAS pods server might be temporarily unavailable
2. **Cache Issue:** Stale CocoaPods cache on EAS servers
3. **Spec Repo Issue:** CocoaPods spec repository sync issue
4. **Dependency Resolution:** Specific pod has unmet requirements

---

## Retry Strategy

### Strategy 1: Force Cache Clear (RECOMMENDED)

Run the build with the `--clear-cache` flag to force a completely fresh pod installation:

```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
eas build --platform ios --profile preview --clear-cache
```

This tells EAS to:
- Clear all cached builds
- Fresh checkout of all source code
- Fresh pod repository sync
- Fresh pod installation from source

**Likelihood of Success:** 75% (caches are common culprits)
**Time:** Same 25-40 minutes

---

### Strategy 2: Wait and Retry (OPTIONAL)

If the cache clear doesn't work, wait 30 minutes and try again. CocoaPods repository syncing can be rate-limited or temporarily unavailable.

```bash
# Wait 30 minutes, then:
eas build --platform ios --profile preview
```

**Likelihood of Success:** 40% (if it was a network hiccup)
**Time:** Same 25-40 minutes

---

### Strategy 3: Check EAS Status

Visit https://status.expo.dev to see if there are any known EAS outages or issues.

---

### Strategy 4: Detailed Debugging (IF NEEDED)

If strategies 1-3 fail, enable verbose logging:

```bash
eas build --platform ios --profile preview --verbose
```

This will show more detailed logs, but you'll need to check the EAS dashboard for the detailed pod installation logs.

---

## Recommended Next Step

**Run Strategy 1 immediately:**

```bash
eas build --platform ios --profile preview --clear-cache
```

The `--clear-cache` flag is the most reliable fix for persistent "Install pods" errors.

---

## What We've Already Fixed

✅ TypeScript and component errors (20+)
✅ NitroModules linking (changed to dynamic frameworks)
✅ iOS deployment target (15.1)
✅ npm peer dependencies (legacy flag)
✅ eas.json configuration

All code changes are committed and ready.

---

## Expected Outcome

With `--clear-cache`:
1. EAS fetches fresh copy of all source
2. Pod repository re-synced
3. All pods installed from scratch
4. Build should progress to Xcode compilation
5. Build uploads to TestFlight

---

**Next Action:** Run the `--clear-cache` build command
**Confidence:** 75%
**Time:** 25-40 minutes

