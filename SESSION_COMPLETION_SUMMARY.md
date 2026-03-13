# Session Completion Summary - v1.1.13 Submission & Subscription Fix

**Date:** March 7, 2026
**Status:** v1.1.13 submitted to both stores; v1.1.14 fix ready to build

---

## Overview

This session completed the v1.1.13 submission to both Apple App Store and Google Play,
and diagnosed + fixed the iOS subscription "purchase failed" bug for v1.1.14.

---

## What Was Done

### 1. Android v1.1.13 Submitted (prior session)
- Built with EAS: versionCode 9, version 1.1.13
- AAB artifact: https://expo.dev/artifacts/eas/tzNC1N9cgc54xq1tq8KQBk.aab
- Uploaded to Play Console, promoted through Internal Testing to Production
- Status: In Play review

### 2. iOS v1.1.13 Submitted
- Built with EAS: buildNumber 125, version 1.1.13
- Uploaded via Transporter to App Store Connect
- Created NEW version entry "1.1.13" in App Store Connect
  (Build 125 is v1.1.13, cannot be added to the existing v1.1.8 version entry)
- Added build, completed App Review Information, submitted
- Status: In Apple review

### 3. iOS Subscription Bug Diagnosed & Fixed (for v1.1.14)

**Bug:** Monthly/yearly subscription purchase shows "purchase failed" even after
the Apple payment sheet appears and the user confirms.

**Root Cause:** Race condition in `AppleIAPService.ts`.
- `purchaseUpdatedListener` (set up in `initialize()`) called `finishTransaction()`
  on every purchase as it arrived
- `requestPurchase()` also fires at the same time
- When the listener finished the transaction FIRST, `requestPurchase()` resolved
  with `[]` (empty array) — no purchase data
- Code treated empty array as failure → "Subscription request returned empty result"

**Fix Applied:** Removed `finishTransaction()` from the listener.
The listener now only logs. The `purchase()` method handles all transaction finishing.

**File:** `src/services/payment/AppleIAPService.ts` (lines 59-68)

---

## v1.1.13 Key Changes (prior sessions)

### GooglePlayIAPService.ts — Full rewrite for react-native-iap v14
| Old API (v12/v13) | New API (v14 Nitro Modules) |
|---|---|
| `getProducts(skus)` | `fetchProducts({ skus, type: 'in-app' })` |
| `getSubscriptions(skus)` | `fetchProducts({ skus, type: 'subs' })` |
| `requestSubscription({ sku })` | `requestPurchase({ request: { google: { skus, subscriptionOffers } }, type: 'subs' })` |
| `acknowledgePurchaseAndroid({ token })` | `acknowledgePurchaseAndroid(token)` — string only |
| Error codes: `'E_USER_CANCELLED'` | Error codes: `'user-cancelled'` (kebab-case) |

### useTrialStore.ts
- `upgradeToBasic()` now returns `{ success: boolean; error?: string }` (was boolean)
- Enables UI to display actual error message when purchase fails

### SubscriptionScreen.tsx
- Shows the actual error message from the purchase service
- Previously just showed generic "Purchase failed"

---

## Current Version Numbers

| Field | Value |
|-------|-------|
| version | 1.1.13 |
| iOS buildNumber | 125 |
| Android versionCode | 9 |

**Next version will be:** 1.1.14 (iOS buildNumber 126, Android versionCode 10)

---

## Known Issues as of v1.1.13

1. **iOS subscriptions fail** — fixed in code, needs v1.1.14 build
2. **Android subscription black screen** — Google Play propagation delay (~March 8)
3. **Send a Gift** — Firebase auth token persistence issue (deferred)
4. **Redeem Gift Code** — depends on Send a Gift

---

## What Comes Next

1. Wait for v1.1.13 Apple review (~24-48 hrs from March 7)
2. Once approved: bump to v1.1.14, build iOS only
3. Submit v1.1.14 for Apple review
4. Once v1.1.14 is live: send email campaign to 329 contacts
5. Check Android subscriptions ~March 8 to confirm propagation delay resolved

---

## Files Changed in v1.1.13

- `src/services/payment/GooglePlayIAPService.ts` — full rewrite for v14 API
- `src/stores/useTrialStore.ts` — `upgradeToBasic` return type
- `src/screens/subscription/SubscriptionScreen.tsx` — error message display
- `app.json` — version 1.1.13, buildNumber 125, versionCode 9

## Files Changed in v1.1.14 (ready, not yet built)

- `src/services/payment/AppleIAPService.ts` — removed `finishTransaction` from listener

---

**Session Date:** March 7, 2026
**Next Action:** Wait for v1.1.13 approval, then build v1.1.14
