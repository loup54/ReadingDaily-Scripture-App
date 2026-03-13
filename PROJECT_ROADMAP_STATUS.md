# ReadingDaily Scripture App - Project Roadmap & Status

**Last Updated:** March 9, 2026
**Current App Version:** iOS 1.1.16 (Build 128) | Android 1.1.15 (versionCode 10)
**Status:** ✅ Both platforms LIVE | 📧 Email campaign ready to send

---

## WHERE WE'VE BEEN

### Early Development (2024 - Early 2025)
- Built core app: daily scripture readings, audio TTS, word translation
- Pronunciation assessment via Azure Speech Services
- Firebase backend (Firestore, Auth, Cloud Functions)
- Legal documents, compliance, digital signatures (Phases 1-7)
- Dark mode, UI polish, notification centre
- Gift subscription system (Send a Gift / Redeem Gift Code — deferred)

### First Store Submissions (Late 2025)
- iOS App Store submitted and approved
- Android Google Play submitted and approved
- Both platforms launched with v1.0.x

### Subscription System Added (Jan–Feb 2026)
- Added subscription tiers (Monthly $2.99, Yearly $19.99, Lifetime $49.99)
- IAP products created in App Store Connect and Google Play Console
- `.v2` suffix used after recreating products due to configuration issues
- Implemented `AppleIAPService.ts` and `GooglePlayIAPService.ts`
- 7-day free trial before paywall

### v1.1.x Bug Fix Series (Feb–Mar 2026)

#### v1.1.8 — Both platforms LIVE March 5, 2026
- Fixed false offline indicator (`status === 'offline'` not `!isConnected`)
- Fixed Android bottom navigation hidden on gesture navigation devices

#### v1.1.9 through v1.1.12 — Internal builds
- Upgraded react-native-iap to v14.7.6 (Nitro Modules — completely different API)
- Iterative IAP fixes; not all shipped to stores

#### v1.1.13 — Submitted March 7, 2026 (superseded)
- Full rewrite of `GooglePlayIAPService.ts` for rn-iap v14
  - `fetchProducts()` replaces `getProducts()`/`getSubscriptions()`
  - `requestPurchase()` with `type:'subs'` for subscriptions
  - `acknowledgePurchaseAndroid(token)` takes string directly
  - Error codes now kebab-case: `'user-cancelled'`, `'unknown'`, etc.
- Android lifetime confirmed working; subscriptions had black screen
  (Google Play propagation delay for new products — resolved ~March 8)

#### v1.1.14 — iOS only (superseded)
- Fixed `purchaseUpdatedListener` race condition in `AppleIAPService.ts`
- Listener was calling `finishTransaction()` — caused `requestPurchase()` to return `[]`
- Superseded by v1.1.16 which added a deeper fix

#### v1.1.15 — Android LIVE March 8, 2026
- Fixed subscription screen black background on Android
- Root cause: `colors.primary` is object not string → `"[object Object]10"` invalid color
- Fixed all 3 pricing card `LinearGradient` components with valid `rgba()` values
- Added `backgroundColor` fallback to main gradient

#### v1.1.16 — iOS LIVE March 8, 2026
- Fixed iOS subscription "purchase failed" after Apple payment sheet completes
- Root cause: `getAvailablePurchases()` found pending transaction for SAME product
  → blindly finished/discarded it → `requestPurchase()` returned `[]` → "failed"
- Fix: check if pending transaction matches product being purchased → use as success
- Fix: `finishTransaction()` added after every successful purchase

---

## WHERE WE ARE (March 9, 2026)

### App Store Status
| Platform | Version | Build | Status | Live |
|----------|---------|-------|--------|------|
| iOS | 1.1.16 | 128 | ✅ LIVE | March 8, 2026 |
| Android | 1.1.15 | versionCode 10 | ✅ LIVE | March 8, 2026 |

### What Works
- All three purchase types on both platforms ✅
- 7-day free trial ✅
- All core features: audio, pronunciation, translation, progress, reminders ✅
- Settings, dark mode, legal documents ✅

### Deferred
- Send a Gift — Firebase auth token persistence issue
- Redeem Gift Code — dependent on Send a Gift

### Marketing
- Email campaign: 329 contacts, bilingual templates (EN + VI), flyers (EN + VI), ready to send
- Vietnam Zalo/Facebook outreach: templates and contact lists ready
- Philippines Facebook Messenger outreach: templates and institution list ready

---

## WHERE WE'RE GOING

### Immediate — Email Campaign
Send to 329 contacts in 11 batches via Gmail BCC.
See `Email/Gmail-Batch-Sending-Instructions.md`.

### Next Development Priority — Send a Gift (v1.2.x)
- Firebase auth token persistence issue needs diagnosis
- Options: client-side token refresh, server-side update, or Firestore security rules approach
- Redeem Gift Code depends on this

### Future Roadmap

#### UX Improvements
- Purchase confirmation screen (success animation after purchase)
- Improved IAP error messages (map error codes to user-friendly text)
- Deep link to subscription management from Settings

#### Technical
- Server-side receipt validation (Firebase Cloud Function → Apple/Google APIs)
- Remove `auth.currentUser` checks — use Zustand consistently
- Consolidate IAP error handling into shared utility

#### Growth
- App Store rating prompts
- Consider Mailchimp for email campaigns (open rate tracking)
- Additional UI language support

---

## KEY TECHNICAL NOTES

### react-native-iap v14.7.6 (Nitro Modules)
- `fetchProducts({ skus, type: 'in-app' | 'subs' })` — not `getProducts()`
- `requestPurchase({ request: { google/apple: {...} }, type: 'subs'|'in-app' })`
- `acknowledgePurchaseAndroid(token: string)` — string directly, not `{token}`
- iOS: `finishTransaction()` in `purchase()` method ONLY — not in listener
- Error codes: `'user-cancelled'`, `'unknown'`, `'already-owned'`, `'item-unavailable'`

### Offline Detection
- Always check `status === 'offline'` — NEVER check `!isConnected`

### Android Bottom Navigation
- Always use `useSafeAreaInsets()` — never hardcode heights

### Version Rules
- Apple version in review = LOCKED, must increment string
- Always increment BOTH iOS buildNumber AND Android versionCode

---

## STORE LINKS
- iOS: https://apps.apple.com/app/readingdaily-scripture/id6753561999
- Android: https://play.google.com/store/apps/details?id=com.readingdaily.scripture
- EAS Project: loup1954/readingdaily-scripture-app
- Firebase Project: readingdaily-scripture-fe502
- Support: ourenglish2019@gmail.com | ourenglish.best
