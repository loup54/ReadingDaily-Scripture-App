# ReadingDaily Scripture App - Current Status Summary
**Last Updated:** March 9, 2026
**Status:** ✅ iOS 1.1.16 LIVE | ✅ Android 1.1.15 LIVE | 📧 Email campaign READY TO SEND

---

## LIVE VERSIONS (March 9, 2026)

| Platform | Version | Build | Status | Live Date |
|----------|---------|-------|--------|-----------|
| **iOS** | 1.1.16 | 128 | ✅ LIVE | March 8, 2026 |
| **Android** | 1.1.15 | versionCode 10 | ✅ LIVE | March 8, 2026 |

All subscription flows confirmed working on both platforms.

---

## VERSION HISTORY (v1.1.x Series)

| Version | iOS Build | Android versionCode | Key Fix | Status |
|---------|-----------|---------------------|---------|--------|
| 1.1.8 | 120 | 4 | Offline banner + Android bottom nav | ✅ Superseded |
| 1.1.13 | 125 | 9 | Android IAP full rewrite (rn-iap v14) | ✅ Superseded |
| 1.1.14 | 126 | — | iOS listener race condition fix | ✅ Superseded |
| 1.1.15 | — | 10 | Android black screen (LinearGradient invalid colors) | ✅ LIVE |
| 1.1.16 | 128 | — | iOS getAvailablePurchases discarding valid transactions | ✅ LIVE |

---

## WHAT WORKS (Both Platforms)

- ✅ 7-day free trial
- ✅ Monthly subscription ($2.99) — iOS & Android
- ✅ Yearly subscription ($19.99) — iOS & Android
- ✅ Lifetime purchase ($49.99) — iOS & Android
- ✅ Audio narration, pronunciation assessment, daily reminders
- ✅ Progress tracking, streaks, achievements
- ✅ Settings, dark mode, legal documents
- ✅ Offline detection banner

---

## KNOWN DEFERRED ISSUES

| Issue | Priority | Notes |
|-------|----------|-------|
| Send a Gift | P1 | Firebase auth token persistence issue |
| Redeem Gift Code | P2 | Dependent on Send a Gift |

---

## PRODUCT IDs (All Active)

| Product | ID | Price | Type |
|---------|-----|-------|------|
| Monthly | `com.readingdaily.basic.monthly.v2` | $2.99/mo | Subscription |
| Yearly | `com.readingdaily.basic.yearly.v2` | $19.99/yr | Subscription |
| Lifetime | `com.readingdaily.lifetime.access.v2` | $49.99 | One-time |

---

## EMAIL CAMPAIGN — READY TO SEND

- **329 contacts** in 11 batch files (`Email/Batch-01` through `Batch-11`)
- **Templates:** `Email/ENGLISH/ReadingDaily-Email-Template-ENGLISH-v2.txt`
              `Email/VIETNAMESE/ReadingDaily-Email-Template-VIETNAMESE-v2.txt`
- **Flyers:** `Flyer/ReadingDaily-Flyer-v1.html` (English A5)
             `Flyer/ReadingDaily-Flyer-VIETNAMESE-v1.html` (Vietnamese A5)
- **Instructions:** `Email/Gmail-Batch-Sending-Instructions.md`
- **Subject (EN):** Read Daily Scripture in English - FREE App (7-Day Trial)
- **Subject (VI):** Luyện Đọc Kinh Thánh Bằng Tiếng Anh - Ứng Dụng MIỄN PHÍ (7 Ngày Dùng Thử)

---

## OUTREACH CAMPAIGNS — READY TO EXECUTE

| Campaign | Location | Platform | Files | Status |
|----------|----------|----------|-------|--------|
| Email | Vietnam (ourENGLISH community) | Gmail BCC | `Email/` | ✅ Ready |
| Zalo/Facebook | Vietnam (Catholic/Christian orgs) | Zalo + Facebook Messenger | `Zalo-Facebook Outreach/` | ✅ Ready |
| Facebook Messenger | Philippines (Catholic/Evangelical institutions) | Facebook Messenger | `Phillipines/Facebook-Messenger-Outreach/` | ✅ Ready |

---

## KEY FILES

| File | Purpose |
|------|---------|
| `app.json` | Version numbers (current: 1.1.16 iOS / 1.1.15 Android) |
| `src/services/payment/AppleIAPService.ts` | iOS IAP — getAvailablePurchases fix |
| `src/services/payment/GooglePlayIAPService.ts` | Android IAP — rn-iap v14 API |
| `src/screens/subscription/SubscriptionScreen.tsx` | Subscription UI (LinearGradient fix) |
| `src/components/offline/OfflineIndicator.tsx` | Offline banner (`status === 'offline'`) |
| `app/(tabs)/_layout.tsx` | Tab bar safe area (Android) |
| `src/stores/useTrialStore.ts` | Purchase state — returns `{ success, error }` |

---

## BUILD & DEPLOY PROCESS

```
1. Edit code
2. Update app.json: version, buildNumber (iOS), versionCode (Android)
3. git commit
4. eas build --platform android --profile production --non-interactive
5. eas build --platform ios --profile production --non-interactive
6. Android: Upload .aab → Play Console Internal Testing → test → Promote to Production
7. iOS: Upload .ipa via Transporter → App Store Connect → new version entry → add build → Submit
```

**Version rules:**
- Apple version in review = version string LOCKED, must increment
- Always increment BOTH iOS buildNumber AND Android versionCode
- "Invalid Pre-Release Train" = version locked, increment and rebuild

---

## STORE LINKS

- **iOS App Store:** https://apps.apple.com/app/readingdaily-scripture/id6753561999
- **App Store Connect:** https://appstoreconnect.apple.com/apps/6753561999
- **Google Play:** https://play.google.com/store/apps/details?id=com.readingdaily.scripture
- **EAS Builds:** https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds
- **Support:** ourenglish2019@gmail.com | ourenglish.best
