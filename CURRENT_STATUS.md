# ReadingDaily Scripture App — Current Status
**Last updated:** 2026-03-16
**Version:** 1.1.29 (versionCode 24 / iOS buildNumber 141)

---

## What Is This App

Expo / React Native app for iOS and Android. Users listen to and read the Catholic daily liturgical readings (USCCB). Features:
- Daily readings scraped from USCCB and stored in Firestore
- Google Cloud TTS audio playback
- Word-level audio highlighting (synchronized text highlight)
- Tap-to-translate words (Google Translate API)
- Pronunciation practice (Azure Speech)
- Offline caching, dark mode, trial/subscription model

---

## Current State (March 2026)

### ✅ Completed This Cycle

| Area | What Was Done |
|------|--------------|
| **Security** | Removed 17 hardcoded credentials from `eas.json`. All secrets now in EAS production environment variables. Repo is clean. |
| **Android build** | Switched from EAS cloud builds to local Gradle builds on Mac Mini. `android/` folder committed. |
| **Audio highlighting crashes** | 6 root causes fixed (see below). Android tested and working. |
| **Audio player UI** | Fixed audio player buried under bottom tab bar (`useBottomTabBarHeight` padding). |
| **Gospel scraping bug** | Fixed "Verse Before Gospel" showing instead of actual gospel text. Fixed in scraper, validator, and Cloud Function. Deployed to Firebase. |
| **Firebase deployed** | Python Cloud Function `python-scraper` updated and redeployed. |

### ⏳ Pending

| Item | Status | Notes |
|------|--------|-------|
| **Android production AAB** | Blocked | Need Play Store keystore configured in `build.gradle`. See Build Guide below. |
| **iOS highlighting crashes** | Not started | Needs local ios/ prebuild + TestFlight for testing. Plan below. |
| **iOS production build** | Not started | Requires Xcode signing setup on Mac Mini. |

---

## Audio Highlighting — 6 Bugs Fixed

| # | Bug | Fix |
|---|-----|-----|
| 1 | `HighlightedTextDisplay` always rendered a `ScrollView`, crashing when nested inside `ScriptureTextWithHighlighting`'s own `ScrollView` | Added `scrollable?: boolean` prop (defaults `false`) — renders plain `View` when not standalone |
| 2 | Audio highlighting singleton not stopped on tab change | Added `audioHighlightingService.stopHighlighting()` alongside `audioPlaybackService.pause()` in `DailyReadingsScreen` tab-change effect |
| 3 | `useWordHighlighting` cleanup only fired on unmount — old service never stopped when `readingId` changed | Merged init/cleanup into a single `useEffect([readingId, readingType])` with `cancelled` flag |
| 4 | Options object passed to `useWordHighlighting` recreated on every render, causing infinite re-init loop | Wrapped with `useMemo` in `HighlightedReadingPlayer` |
| 5 | ProgressBar seek used web-only `event.nativeEvent.target.offsetWidth` — crash on native | Replaced with `onLayout` + `useRef<number>(0)` to measure bar width natively |
| 6 | `startHighlighting()` re-entered concurrently (multiple rapid tab switches) | Added `activeReadingId` + `isStarting` re-entry guards to `AudioHighlightingService` |

---

## Architecture

```
src/
  screens/readings/DailyReadingsScreen.tsx   # Main reading view
  components/
    audio/
      HighlightedReadingPlayer.tsx           # Highlighting player
      HighlightedTextDisplay.tsx             # Word-by-word text (scrollable prop)
      EnhancedAudioPlayer.tsx                # Standard audio player
    reading/
      ScriptureText.tsx                      # Plain reading display
      ScriptureTextWithHighlighting.tsx      # Highlighting wrapper
  hooks/
    useWordHighlighting.ts                   # Hook: manages highlighting lifecycle
  services/
    audio/
      AudioHighlightingService.ts            # Singleton: timing data + state
      AudioPlaybackService.ts                # Expo AV playback
      CompositeTimingDataProvider.ts         # Fetches timing JSON from Firestore/CDN
    readings/
      ReadingService.ts                      # Firestore reading fetcher
  stores/
    useSettingsStore.ts                      # Audio, translation, display prefs
    useTrialStore.ts                         # Trial/subscription state
    useReadingStore.ts                       # Current reading state

python-functions/
  main.py                                    # Cloud Function entry point
  scrapers/
    usccb_scraper.py                         # BeautifulSoup USCCB scraper
    validator.py                             # Reading validation + checksums

android/                                     # Prebuild output (committed)
  app/build.gradle                           # Signing config here
  app/debug.keystore                         # Debug signing only
```

---

## Build Guide

### Android — Local APK (for sideload / testing)
```bash
cd /Users/loumimihome/ReadingDaily-Scripture-App/android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Install via adb
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Android — Local AAB (for Play Store) — REQUIRES KEYSTORE SETUP FIRST

**Step 1:** Get the keystore
```bash
# Option A: Download EAS upload keystore (interactive)
eas credentials --platform android
# Select: production → Keystore → Download
# Save to: android/app/release.keystore

# Option B: Check Google Play Console → Release → Setup → App signing
# If Google manages the app signing key, you can also create a NEW upload key
# and register it in Play Console → App signing → Upload key
```

**Step 2:** Configure signing in `android/app/build.gradle`
```groovy
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("KEYSTORE_PASS") ?: "your-store-password"
        keyAlias "your-key-alias"
        keyPassword System.getenv("KEY_PASS") ?: "your-key-password"
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...rest stays same
    }
}
```

**Step 3:** Build
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Step 4:** Upload to Play Console manually at play.google.com/console

---

### iOS — NOT YET SET UP (see iOS Plan below)

---

## iOS Highlighting Crash — Plan

### Problem
Word-level audio highlighting crashes iOS. Likely causes differ from Android:
- iOS memory pressure on large texts
- `setInterval`-based position tracking firing after component unmount
- Possible issue with how Hermes handles the `clearInterval` in cleanup
- UIKit scroll view conflicts with highlighting state updates

### Plan

**Phase 1 — Set up iOS local build**
```bash
npx expo prebuild --platform ios --clean
# Opens Xcode project at ios/ReadingDailyScripture.xcworkspace
```
Need: Xcode signing certificate + provisioning profile for `com.readingdaily.scripture`

**Phase 2 — TestFlight or EAS Internal Distribution for testing**
- Option A: EAS internal build (free tier) — device UDID registered, no full App Store review
- Option B: Local Xcode archive → TestFlight upload via Xcode Organizer
- Cannot sideload .ipa on iOS (unlike Android APK) without jailbreak

**Phase 3 — Isolate the crash**
Enable highlighting on iOS and collect crash logs from:
- Xcode Organizer → Crashes
- `console.log` with `[AudioHighlighting]` prefix
- Metro bundler console output

**Phase 4 — Likely fixes to apply**
1. Add `InteractionManager.runAfterInteractions` guard around `setInterval` start
2. Ensure `clearInterval` fires synchronously in cleanup (not deferred)
3. Add `Platform.OS === 'ios'` guard to reduce update frequency (200ms vs 100ms)
4. Check if `HighlightedTextDisplay` `scrollable={true}` needs additional iOS-specific handling

**Phase 5 — Test cycle**
Submit TestFlight build → test on real device → verify crash gone → iterate

---

## Environment & Credentials

All secrets stored in **EAS production environment variables** (not in code or eas.json).

| Key | Purpose |
|-----|---------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firestore reads |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `readingdaily-scripture-fe502` |
| `EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY` | TTS + Translation |
| `EXPO_PUBLIC_AZURE_SPEECH_KEY` | Pronunciation assessment |
| `EXPO_PUBLIC_AZURE_SPEECH_REGION` | `australiaeast` |
| `EXPO_PUBLIC_REVENUE_CAT_KEY` | Subscriptions |
| `EXPO_PUBLIC_REVENUE_CAT_IOS_KEY` | iOS subscriptions |

Local `.env` file is `.gitignore`d. Ask team lead for values.

---

## Firebase / Cloud Functions

**Project:** `readingdaily-scripture-fe502`
**Codebase:** `python-scraper` (Python 3.12, runs on Cloud Run)
**Schedule:** Scrapes USCCB daily at midnight UTC
**Deploy:**
```bash
cd /Users/loumimihome/ReadingDaily-Scripture-App/python-functions
source venv/bin/activate
firebase deploy --only functions:python-scraper
```

---

## Git Remote

```
https://github.com/loup54/ReadingDaily-Scripture-App
```
Auth via GitHub CLI (`gh auth login`). Push: `git push origin main`.
