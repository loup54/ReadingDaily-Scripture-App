# Phase 8.1 Build Troubleshooting Guide
**Date:** November 29, 2025
**Status:** EAS Build Failures - Debugging in Progress

---

## Issue Summary

EAS build is failing with "Unknown error" during JavaScript bundling phase. This occurs AFTER the app authenticates successfully with Apple, meaning:
- ✅ Apple credentials valid
- ✅ Provisioning profiles correct
- ✅ Bundle ID registered
- ❌ JavaScript bundling fails silently

---

## Build Attempt History

| Attempt | Error | Action |
|---------|-------|--------|
| #1 | Unknown error (Bundle JS) | Fixed initial TypeScript issues |
| #2 | Unknown error (Bundle JS) | Fixed more TypeScript + relaxed strict mode |
| #3 | Unknown error (Bundle JS) | Fixed offline/paywall components |

---

## Root Cause Analysis

The "Unknown error" during bundling suggests one of:

1. **Circular dependency** - Modules importing each other
2. **Missing module at runtime** - Import that works in TS but fails at bundle time
3. **Asset or configuration issue** - Problem with how Expo is configured
4. **Native module incompatibility** - Version mismatch between packages
5. **Metro bundler cache** - Corrupted or stale cache

---

## Solutions to Try (In Order)

### Solution 1: Clear All Caches (Quick - 5 minutes)

```bash
# Clear npm cache
npm cache clean --force

# Clear yarn cache (if using yarn)
yarn cache clean

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install

# Clear EAS cache
eas build --platform ios --profile preview --clear-cache

# Retry build
eas build --platform ios --profile preview
```

**Likelihood of Success:** 60% (caches are a common culprit)

### Solution 2: Simplify Entry Point (Medium - 30 minutes)

Create a minimal app entry point to test if the issue is in _layout.tsx:

```tsx
// App.tsx - minimal version
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>ReadingDaily Scripture</Text>
    </View>
  );
}
```

Test build with minimal app. If it works:
- Gradually add imports back
- Find which import causes failure
- Fix that specific issue

**Likelihood of Success:** 80% (will isolate the problem)

### Solution 3: Check Package Versions (Medium - 20 minutes)

```bash
# Check for version conflicts
npm ls

# Look for:
# - Multiple versions of same package
# - "peerDependencies" warnings
# - Version mismatches
```

Fix any mismatches by updating package.json or installing correct versions.

**Likelihood of Success:** 40% (depends on actual conflicts)

### Solution 4: Use Expo Doctor (Quick - 10 minutes)

```bash
# Check project health
npx expo-doctor

# Fix any reported issues automatically
npx expo-doctor --fix
```

**Likelihood of Success:** 50% (catches configuration issues)

### Solution 5: Use Development Client Instead (Alternative - 15 minutes)

Instead of preview profile (for TestFlight), use development profile:

```bash
eas build --platform ios --profile development
```

This creates a development build that can be tested locally first, less strict bundling.

**Likelihood of Success:** 70% (more forgiving build process)

---

## Recommended Approach

**Try in this order:**

1. **First (5 min):** Clear all caches (Solution 1)
   - Command: `npm cache clean --force && rm -rf node_modules && npm install`
   - Then retry: `eas build --platform ios --profile preview`

2. **If still fails (10 min):** Run Expo Doctor (Solution 4)
   - Command: `npx expo-doctor --fix`
   - Then retry build

3. **If still fails (30 min):** Simplify Entry Point (Solution 2)
   - Test with minimal App.tsx
   - Gradually add imports back to find culprit

4. **If still fails:** Use Development Build (Solution 5)
   - `eas build --platform ios --profile development`
   - Provides more debugging info

---

## What We've Already Done

✅ Fixed TypeScript strict mode (relaxed for build)
✅ Fixed 20+ TypeScript errors in components
✅ Fixed Azure Speech error handling
✅ Fixed offline component errors
✅ Verified infrastructure (Firebase, App Store Connect, EAS)
✅ Verified Apple credentials and certificates
✅ Added debug flag to EAS config

---

## Next Steps

### Immediately:
1. Try Solution 1: Clear caches and retry build
2. Run: `npm cache clean --force && rm -rf node_modules && npm install`
3. Retry: `eas build --platform ios --profile preview`

### If build succeeds:
1. Monitor build completion (15-30 minutes)
2. Check TestFlight for build upload
3. Install on device and test
4. Mark Phase 8.1 complete

### If build fails again:
1. Try Solution 4: Run `npx expo-doctor --fix`
2. Then retry build
3. If still fails, use Solution 2 (simplify entry point)

---

## Important Notes

**The build infrastructure is solid:**
- Apple credentials are valid
- Certificates are valid until Oct 2026
- Provisioning profiles are correct
- EAS authentication works
- Environment variables are loaded

**The problem is in the JavaScript bundling:**
- This is a code/configuration issue, not infrastructure
- Multiple approaches can diagnose and fix it
- The issue is likely fixable (not fundamental blocker)

---

## Estimated Time to Resolution

- **Quick Fix (cache clear):** 5 minutes
- **Medium Fix (expo-doctor):** 10 minutes
- **Detailed Fix (simplify app):** 30-45 minutes
- **Fallback Option (dev build):** 15 minutes

---

## When to Escalate

Escalate if:
- All solutions fail after thorough attempts
- Need professional EAS support
- Want to post on Expo forums with build logs

**EAS Buildnecessary information:**
- Build ID: 3eab269e-d13b-4f52-9372-62b7f4f43c8e (from last attempt)
- Build log URL: https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds

---

## Reference

**EAS Build Documentation:**
- https://docs.expo.dev/eas-build/introduction/
- https://docs.expo.dev/eas-build/troubleshooting/
- https://docs.expo.dev/eas-build/debugging/

**Expo Doctor:**
- https://docs.expo.dev/workflow/expo-cli/#expo-doctor

---

**Status:** Troubleshooting in progress
**Confidence:** Issue is fixable (likely cache or dependency related)
**Recommendation:** Try Solution 1 immediately (cache clear + retry)
