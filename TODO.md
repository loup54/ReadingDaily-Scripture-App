# ReadingDaily Scripture App — Todo List

## Pending

### Sentry Crash Reporting
- [ ] After next build, log into sentry.io and confirm organisation slug and project slug
      match `readingdaily` / `react-native` in app.config.js — update if different
- [ ] Verify first crash report appears in Sentry dashboard after a test build

### Android
- [ ] Confirm Android layout fix (Galaxy S26) on real device — device in India
- [ ] Build and distribute Android APK with layout fix:
      `eas build --platform android --profile preview`

### Security (quarterly review due 2026-06-20)
- [ ] Firestore rules — review for any new collections added since March 2026
- [ ] API key rotation — Google Cloud, Azure Speech keys in EAS dashboard env vars
- [ ] MobSF scan — run against latest Android APK
- [ ] Firebase Console — check Firestore for unusual read/write spikes
- [ ] Dependencies — `npm audit` in project root

### App Store
- [ ] Cut app preview video to 30 seconds for App Store listing (currently 42 sec)
