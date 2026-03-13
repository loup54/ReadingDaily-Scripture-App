# Changes Reference — ReadingDaily Scripture App

**Last Updated:** March 7, 2026
**Purpose:** Quick lookup of what changed, when, and why.

---

## v1.1.14 (iOS only — code ready, not yet built)

### `src/services/payment/AppleIAPService.ts`
**What:** Removed `finishTransaction()` call from `purchaseUpdatedListener`
**Why:** Race condition — listener was finishing transactions before `requestPurchase()`
promise resolved, causing `requestPurchase()` to return `[]` (empty array),
which the purchase flow treated as failure → "purchase failed" shown to user
**Lines:** 59-68
**Impact:** iOS monthly/yearly subscription purchases now succeed

---

## v1.1.13 (iOS Build 125, Android versionCode 9 — in review March 7, 2026)

### `src/services/payment/GooglePlayIAPService.ts`
**What:** Full rewrite for react-native-iap v14.7.6 (Nitro Modules)
**Why:** react-native-iap upgraded from v12 to v14 — entire API changed
**Key changes:**
- `getProducts()` → `fetchProducts({ skus, type: 'in-app' })`
- `getSubscriptions()` → `fetchProducts({ skus, type: 'subs' })`
- `requestSubscription({ sku })` → `requestPurchase({ request: { google: { skus, subscriptionOffers } }, type: 'subs' })`
- `acknowledgePurchaseAndroid({ token })` → `acknowledgePurchaseAndroid(token)` (string)
- Error codes: `'E_USER_CANCELLED'` → `'user-cancelled'` (kebab-case)
- Added offer token guard (required for Google Play Billing 5+)
- Offer token path: `sub.subscriptionOffers?.[0]?.offerTokenAndroid`

### `src/stores/useTrialStore.ts`
**What:** `upgradeToBasic()` now returns `{ success: boolean; error?: string }`
**Why:** Was returning boolean — UI couldn't display actual error message
**Lines:** 324-388

### `src/screens/subscription/SubscriptionScreen.tsx`
**What:** Shows actual error message from `upgradeToBasic` result
**Why:** Previously showed generic "Purchase failed" regardless of actual error

### `app.json`
**What:** version "1.1.13", buildNumber "125", versionCode 9
**Why:** New release

---

## v1.1.8 (iOS Build 120, Android versionCode 4 — LIVE)

### `src/components/offline/OfflineIndicator.tsx`
**What:** Changed `!isConnected` → `status === 'offline'`
**Why:** `NetworkStatusService` initializes with `isConnected: false, status: 'unknown'`
so `!isConnected` was always true on startup, showing false offline banner
**Line:** 62

### `app/(tabs)/_layout.tsx`
**What:** Added `useSafeAreaInsets()` for Android bottom navigation
**Why:** Android navigation icons were invisible (tab bar too short, icons hidden)
**Pattern:**
```typescript
const insets = useSafeAreaInsets();
paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 8) : 8
height = Platform.OS === 'android' ? 65 + Math.max(insets.bottom - 8, 0) : 65
```

---

## v1.1.x Subscription System (Nov 2025 - Jan 2026)

### `src/services/payment/AppleIAPService.ts` (initial build)
- StoreKit integration via react-native-iap
- Products: monthly.v2, yearly.v2, lifetime.access.v2
- 7-day trial support, receipt validation via Firebase Cloud Function

### `src/services/payment/GooglePlayIAPService.ts` (initial build)
- Google Play Billing integration
- Same product IDs as iOS (.v2 suffix)

### `src/stores/useTrialStore.ts` (initial build)
- Zustand persist store (AsyncStorage)
- Trial state, purchase state, subscription state
- Device fingerprinting for abuse prevention

### `src/screens/subscription/SubscriptionScreen.tsx`
- Subscription paywall UI
- Shows pricing, trial info, purchase buttons

---

## Dark Mode & UI Fixes (Nov 28, 2025)

### `src/screens/progress/ProgressDashboard.tsx`
- `colors.background.main` → `colors.background.primary`
- `colors.primary.main` → `colors.primary.blue`
- Fixed: stat numbers unreadable in dark mode

### `src/components/progress/ReadingCalendar.tsx`
- All stat text colors updated to theme colors
- Fixed: calendar dates invisible in dark mode

### `src/screens/NotificationCenterScreen.tsx`
- Complete redesign with theme colors
- Type-based color coding (blue/green/purple by notification type)

### `src/screens/subscription/SendGiftScreen.tsx`
- Complete redesign: gradient header, step indicator, colored tier cards
- Fixed 5 color property mismatches

### `src/services/practice/SentenceExtractionService.ts`
- `MIN_WORDS`: 15 → 5
- `MAX_WORDS`: 50 → 100
- Fixed: Gospel (6-13 words) and Psalm (1-8 words) sentences were all filtered out

### Multiple screens — Trial duration text
- All "10-minute trial" text changed to "7 days" / "7-day free trial"
- Files: SubscriptionScreen, SettingsScreen, AuthNavigator, TrialExpiredModal, SubscriptionSettingsSection

---

## Initial API & Auth Fixes (Nov 25, 2025)

### `package.json`
- `"main": "node_modules/expo/AppEntry.js"` → `"main": "expo-router/entry"`

### `src/stores/useAuthStore.ts`
- Non-blocking auth initialization
- Resolves promise immediately on first Firebase auth state change
- Token refresh and profile fetch moved to background

### `src/components/offline/OfflineIndicator.tsx`
- Icon: `'wifi-off'` → `'alert-circle-outline'` (ionicons library)

### `.env`
- Updated expired Firebase API key
- Updated expired Google Cloud API key

---

## Product IDs Reference

| Product | ID | Price |
|---------|-----|-------|
| Monthly subscription | `com.readingdaily.basic.monthly.v2` | $2.99/month |
| Yearly subscription | `com.readingdaily.basic.yearly.v2` | $19.99/year |
| Lifetime access | `com.readingdaily.lifetime.access.v2` | $49.99 one-time |

Note: `.v2` suffix because original products (without `.v2`) were deleted/recreated
in both App Store Connect and Google Play Console in January 2026.
