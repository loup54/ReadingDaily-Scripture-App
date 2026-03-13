# Future Work Queue
**Last Updated:** March 10, 2026
**Current Version:** iOS 1.1.16 (Build 128) | Android 1.1.15 (versionCode 10)
**Status:** ✅ Both platforms LIVE — monitoring week of Mar 10-17 before next release

---

## CURRENT PRIORITIES

### P0 — Email Campaign (Do Now)
**Status:** Ready to send
- 329 contacts in 11 Gmail BCC batches
- Templates: English + Vietnamese (separate files)
- Flyers: English + Vietnamese A5 (print to PDF, attach)
- Instructions: `Email/Gmail-Batch-Sending-Instructions.md`

### P0 — Monitor Both Platforms (Week of Mar 10-17)
- Watch for crash reports in App Store Connect / Play Console
- Confirm subscriptions working in production (both platforms now live with fixes)
- Check ourenglish2019@gmail.com for user questions
- App download price now FREE — monitor for any store propagation issues
- Android scroll fix pending release — bundle with other fixes before next build

---

## P1 — Fix Send a Gift Feature

**Problem:** Firebase Cloud Function auth token becomes invalid after app reinstall.
Users see "Please sign in again" even when logged in.

**Options:**
- **A) Client-side token refresh** (recommended) — refresh on app start before Cloud Function calls
  - Files: `src/config/firebase.ts`, `src/stores/useAuthStore.ts`
- **B) Server-side** — update Cloud Function to handle token refresh
  - Files: `functions/src/gifting/sendGift.ts`
- **C) Firestore rules** — eliminate Cloud Function dependency entirely

**Re-enable after fix:**
- `src/screens/subscription/SubscriptionScreen.tsx` — Send a Gift + Redeem buttons

---

## P2 — Re-enable Redeem Gift Code
Dependent on Send a Gift (P1) being fixed and tested.

---

## P3 — UX Improvements

### Purchase Confirmation Screen
After successful purchase: success animation, summary of what was purchased, CTA.
- Create: `src/screens/subscription/PurchaseConfirmationScreen.tsx`
- Update navigation in `SubscriptionScreen.tsx`

### Improved IAP Error Messages
Map error codes to user-friendly, actionable messages.
- `'user-cancelled'` → "Purchase cancelled"
- `'unknown'` → "Something went wrong. Check your payment method and try again."
- `'already-owned'` → "You already own this. Tap Restore Purchases to activate."
- `'item-unavailable'` → "This product is unavailable right now. Try again later."
- Files: `AppleIAPService.ts`, `GooglePlayIAPService.ts`, `SubscriptionScreen.tsx`

### Subscription Management Deep Link
Add "Manage Subscription" button in Settings → deep links to iOS Settings / Play Store.

---

## P3 — Technical Debt

### TD-1: Remove auth.currentUser checks
Replace all `auth.currentUser` with Zustand `useAuthStore()` for consistent reactivity.
Search: `grep -r "auth.currentUser" src/`

### TD-2: Consolidate IAP Error Handling
Create `src/utils/iap/displayIAPError.ts` — single shared error display utility.
Currently duplicated across screens.

### TD-3: Server-side Receipt Validation
Firebase Cloud Function → validate with Apple/Google API → store in Firestore.
Prevents IAP fraud; enables cross-device sync.
- Create: `functions/src/iap/validateReceipt.ts`

---

## P4 — Growth Features

### App Store Rating Prompts
Trigger `StoreReview.requestReview()` after milestone events (e.g., 7-day streak, first completed reading).

### Mailchimp Integration
Consider for future email campaigns — open rate tracking, automated follow-ups.

### Additional Language UI
App UI currently English-only. Vietnamese UI would serve primary user base better.

---

## P5 — Future / Backlog

- Family Sharing support (Apple)
- Subscription analytics dashboard (Firebase Analytics + Firestore aggregation)
- Automated IAP unit tests (mock StoreKit)
- Gift Card support (StoreKit handles automatically — just needs testing)

---

## COMPLETED (Reference)

| Item | Version | Date |
|------|---------|------|
| False offline banner fix | v1.1.8 | Mar 5 |
| Android bottom nav fix | v1.1.8 | Mar 5 |
| Android IAP full rewrite (rn-iap v14) | v1.1.13 | Mar 7 |
| iOS listener race condition fix | v1.1.14 | Mar 7 |
| Android LinearGradient black screen fix | v1.1.15 | Mar 8 |
| iOS getAvailablePurchases discard fix | v1.1.16 | Mar 8 |
| Email campaign templates (EN + VI) | — | Mar 9 |
| A5 flyers (EN + VI) | — | Mar 9 |
| Vietnam Zalo/Facebook outreach kit | — | Mar 9 |
| Philippines Messenger outreach kit | — | Mar 9 |
| App Store download price fixed (Free) | — | Mar 10 |
| Android A21s scroll fix (ScriptureText flex:1) | pending build | Mar 10 |
