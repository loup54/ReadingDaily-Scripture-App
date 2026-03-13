# Session Summaries - ReadingDaily Scripture App

**File Purpose:** Running log of major sessions. Most recent first.

---

## March 7, 2026 — v1.1.13 Submission + iOS Subscription Fix

**Submitted:** iOS v1.1.13 (Build 125) + Android v1.1.13 (versionCode 9) to both stores.

**Key work:**
- App Store Connect: Created new version entry 1.1.13, added Build 125, submitted
- Diagnosed iOS subscription "purchase failed" bug: listener race condition in
  `AppleIAPService.initialize()` calling `finishTransaction()` before `requestPurchase()`
  resolved, causing empty array `[]` return
- Fix applied to `AppleIAPService.ts`: removed `finishTransaction` from listener
- Decision: Wait for v1.1.13 approval → build v1.1.14 → send email campaign

**Next:** Build v1.1.14 iOS after v1.1.13 approved. Hold email campaign until then.

---

## March 5-6, 2026 — Android IAP v14 Rewrite + v1.1.13 Build

**Context:** Android subscriptions showing black screen (blank payment sheet) in v1.1.12.

**Root cause:** react-native-iap upgraded from v12 to v14 (Nitro Modules). Entire API changed:
- `getProducts()` → `fetchProducts({ skus, type })`
- `getSubscriptions()` → `fetchProducts({ skus, type: 'subs' })`
- `requestSubscription()` removed → `requestPurchase({ type: 'subs' })`
- `acknowledgePurchaseAndroid({ token })` → `acknowledgePurchaseAndroid(token)` (string)
- Error codes changed to kebab-case

**Also fixed:**
- `upgradeToBasic()` in `useTrialStore.ts` now returns `{ success, error }` not boolean
- `SubscriptionScreen.tsx` displays actual error message
- Subscription products needed offer tokens for Google Play Billing 5+
- Android subscription black screen: separately diagnosed as Google Play propagation
  delay (new products created March 5, needs 24-72 hrs). Not a code bug.

**Built:** v1.1.13 for both platforms.

---

## March 2, 2026 — Email Campaign Preparation

**Work done:**
- Added 24 new contacts from Untitled.csv → total now 329 contacts
- Regenerated batch files (Batch-01 through Batch-11)
- Created bilingual email template (English + Vietnamese): `ReadingDaily-Email-Template-BILINGUAL-v1.txt`
- Updated `Gmail-Batch-Sending-Instructions.md` with bilingual subject line
- Campaign on hold until app subscription issues resolved

---

## February 2026 — v1.1.7 / v1.1.8 — First Stable Launch

**Work done:**
- Fixed false offline indicator: `status === 'offline'` not `!isConnected`
  (`NetworkStatusService` starts with `status: 'unknown'`, not `isConnected: false`)
- Fixed Android bottom navigation icons invisible: added `useSafeAreaInsets()`
  with `Platform.OS === 'android'` padding calculation
- Apple rejected v1.1.7 ("train closed") — bumped to v1.1.8
- Both iOS and Android went LIVE on stores with v1.1.8

---

## November-January 2025-2026 — Subscription System (Phase 7)

**Work done:**
- Added three subscription tiers: Monthly ($2.99), Yearly ($19.99), Lifetime ($49.99)
- Created IAP products in App Store Connect and Google Play Console (.v2 suffix)
- Built `AppleIAPService.ts` and `GooglePlayIAPService.ts`
- 7-day free trial implemented before paywall
- `useTrialStore.ts` manages all purchase/subscription state with Zustand persist
- Trial timer, device fingerprinting for abuse prevention
- Gift subscription system (Send a Gift / Redeem Gift Code) — partially complete
  (Firebase auth token persistence issue, deferred)

---

## November 28, 2025 — Legal, UI, Dark Mode (Phase 6-7 completion)

**Work done:**
- 6 legal documents finalized (Privacy Policy, ToS, Accessibility, Copyright, Consumer Rights, FAQ)
- Signature writing fixed in SignatureModal
- First-time onboarding legal acceptance flow added
- Dark mode visibility fixed: Progress Dashboard, Calendar, Notifications, Send Gift screen
- Arrow navigation fixed in pronunciation practice (sentence word limits relaxed)
- Translation label now shows actual selected language name
- Trial duration text standardized to "7 days" across all screens
- Support email centralized to ourenglish2019@gmail.com (54+ locations updated)

---

## November 25, 2025 — API Keys, Auth, Router Fix

**Work done:**
- Fixed Expo Router entry point (`expo-router/entry`)
- Non-blocking auth initialization (resolves immediately, background token refresh)
- Firebase + Google Cloud API keys updated/recreated
- Translation API key validation added
- Offline indicator icon fixed (`wifi-off` → `alert-circle-outline`)

---
