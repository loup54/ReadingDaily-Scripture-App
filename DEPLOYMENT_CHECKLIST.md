# Deployment Checklist
**Last Updated:** March 7, 2026
**Current Release:** v1.1.13 (in review)
**Next Release:** v1.1.14 (iOS only, ready to build)

---

## v1.1.13 Release Status

### Code
- [x] GooglePlayIAPService.ts — react-native-iap v14 API rewrite
- [x] useTrialStore.ts — upgradeToBasic returns { success, error }
- [x] SubscriptionScreen.tsx — shows actual error message
- [x] app.json — version 1.1.13, buildNumber 125, versionCode 9
- [x] git committed

### Builds
- [x] Android AAB built via EAS (versionCode 9)
- [x] iOS IPA built via EAS (buildNumber 125)
- [x] Android uploaded to Play Console → Internal Testing → Production
- [x] iOS uploaded via Transporter → App Store Connect v1.1.13 entry

### Submissions
- [x] Android submitted for Google Play review
- [x] iOS submitted for Apple review
- [ ] Android approved and live
- [ ] iOS approved and live

---

## v1.1.14 Release Checklist (iOS only)

### Pre-Build
- [x] Code fix applied: AppleIAPService.ts listener race condition
- [ ] Bump app.json: version → 1.1.14, buildNumber → 126
- [ ] (Android versionCode → 10 if doing Android build too)
- [ ] git commit

### Build
- [ ] `eas build --platform ios --profile production --non-interactive`
- [ ] Confirm build success and download IPA

### Submit
- [ ] Upload IPA via Transporter
- [ ] Go to App Store Connect → create NEW version entry for 1.1.14
- [ ] Add buildNumber 126 to the 1.1.14 version entry
- [ ] Fill App Review Information (no new permissions needed)
- [ ] Submit for review

### Testing (TestFlight before submit)
- [ ] Install from TestFlight
- [ ] Test monthly subscription purchase → should succeed
- [ ] Test yearly subscription purchase → should succeed
- [ ] Test lifetime purchase → may fail in TestFlight sandbox (EXPECTED, don't block)
- [ ] Test Restore Purchases
- [ ] Confirm no "purchase failed" after payment sheet completes

---

## Post v1.1.14 Launch

### Email Campaign
- [ ] Confirm v1.1.14 is live on App Store
- [ ] Confirm Android subscriptions working (check ~March 8)
- [ ] Send Batch 01 to yourself as test
- [ ] Check test email on phone + desktop
- [ ] Send all 11 batches to 329 contacts (15-min waits between batches)
- [ ] Monitor ourenglish2019@gmail.com for responses
- [ ] Track downloads in App Store Connect & Play Console

### Android Subscription Check (~March 8)
- [ ] Test Android monthly subscription
- [ ] Test Android yearly subscription
- [ ] If still failing: diagnose further (propagation delay should have resolved)

---

## Environment Variables (EAS Production)

All configured in EAS dashboard for `loup1954/readingdaily-scripture-app`:

- EXPO_PUBLIC_FIREBASE_* (API key, project ID, auth domain, etc.)
- EXPO_PUBLIC_AZURE_SPEECH_KEY + REGION
- EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY
- EXPO_PUBLIC_AZURE_SPEECH_REGION=australiaeast
- EXPO_PUBLIC_TRIAL_DURATION_MINUTES (7 days = 10080)
- EXPO_PUBLIC_LIFETIME_PRICE=49.99
- EXPO_PUBLIC_APPLE_IAP_PRODUCT_ID
- EXPO_PUBLIC_GOOGLE_PLAY_PRODUCT_ID
- EXPO_PUBLIC_MOCK_PAYMENTS=false (production)
- EXPO_PUBLIC_SKIP_TRIAL=false (production)

---

## Rollback Reference

| Version | iOS Build | Android versionCode | Status | Notes |
|---------|-----------|-------------------|--------|-------|
| 1.1.8 | 120 | 4 | LIVE (current) | Last stable live version |
| 1.1.13 | 125 | 9 | In review | Subscription error display |
| 1.1.14 | 126 | 10 | Pending build | iOS subscription fix |

---

## Quick Commands

```bash
# Build iOS
eas build --platform ios --profile production --non-interactive

# Build Android
eas build --platform android --profile production --non-interactive

# Build both
eas build --platform all --profile production --non-interactive

# Check build status
eas build:list
```

---

## Store Links
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- EAS Dashboard: https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app
- iOS App Store: https://apps.apple.com/app/readingdaily-scripture/id6753561999
- Google Play: https://play.google.com/store/apps/details?id=com.readingdaily.scripture
