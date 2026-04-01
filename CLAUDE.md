# ReadingDaily Scripture App — Claude Context

## What this app is
Catholic daily Mass readings with audio playback, word-level highlighting, pronunciation practice, and translation. Primary audience: non-native English speakers wanting to engage with scripture.

**Firebase project:** `readingdaily-scripture-fe502`
**Bundle ID:** `com.readingdaily.scripture`
**Expo account:** `loup1954`
**App Store ID:** `6753561999`

---

## Stack
- **Frontend:** Expo (bare workflow) · React Native · TypeScript
- **Backend:** Firebase/Firestore · Python Cloud Functions (scraping, TTS) · Node.js Cloud Functions (IAP, gifting)
- **Audio:** Azure TTS (production) · Google TTS (word timing via SSML marks)
- **Crash reporting:** Sentry (`ourenglishbest` / `react-native`)
- **Payments:** Apple IAP + Google Play Billing

---

## Key files

### Frontend
| File | Purpose |
|------|---------|
| `app/_layout.tsx` | App root — Sentry init, ErrorBoundary |
| `src/screens/readings/DailyReadingsScreen.tsx` | Main reading screen |
| `src/services/readings/ReadingService.ts` | Fetches readings from Firestore — freshness check applies to TODAY only (not future dates) |
| `src/components/reading/ScriptureTextWithHighlighting.tsx` | Word-level highlighting |
| `src/components/audio/EnhancedAudioPlayer.tsx` | Audio player + highlighting |
| `src/services/audio/AudioHighlightingService.ts` | Singleton, drives highlighting via charOffset timing |
| `src/services/audio/AudioPlaybackService.ts` | Expo AV wrapper, 100ms polling |
| `src/services/logging/LoggerService.ts` | Centralised logger — hooks into Sentry |
| `src/utils/validation.ts` | Input validation and sanitization |
| `src/components/common/ErrorBoundary.tsx` | Catches crashes, reports to Sentry |

### Backend
| File | Purpose |
|------|---------|
| `python-functions/main.py` | daily_scrape, generate_timings, manual_scrape, validate_google_receipt |
| `python-functions/scrapers/usccb_scraper.py` | USCCB scraper — explicitly excludes "Verse Before the Gospel" to avoid gospel extraction bug |
| `functions/src/apple.ts` | Apple receipt validation |
| `functions/src/google.ts` | Google Play purchase validation |
| `functions/src/gifting.ts` | Gift subscription logic |
| `functions/src/highlighting.ts` | synthesizeReading HTTP endpoint |
| `functions/src/scheduledTasks.ts` | Daily synthesis scheduler |
| `functions/src/rateLimit.ts` | Firestore-backed rate limiting (all endpoints) |

### Config
| File | Purpose |
|------|---------|
| `app.config.js` | Expo config — version, plugins, EAS project ID |
| `ios/ReadingDailyScriptureApp/Info.plist` | Native iOS version — **must be updated manually alongside app.config.js** |
| `eas.json` | EAS build profiles — `appVersionSource: remote` |
| `functions/firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | All composite indexes (source of truth) |
| `TODO.md` | Open task list |

---

## Distribution & build process

### Current versions
- **iOS:** v1.1.31 build 161 — in Apple review as of 2026-03-26
- **Android:** versionCode 26 — in Google Play review as of 2026-03-26
- **OTA updates active** from v1.1.31 onwards (channel: `production`)

### For a JS-only fix (instant, no review)
```bash
cd ~/ReadingDaily-Scripture-App
eas update --channel production --message "description of fix"
```

### For a native change (requires full build + store submission)

**iOS — critical: bare workflow requires updating TWO places for version:**
1. `app.config.js` → bump `version` and `runtimeVersion` (must match)
2. `ios/ReadingDailyScriptureApp/Info.plist` → bump `CFBundleShortVersionString`
3. `eas build:version:set --platform ios --profile production` — interactive, type new build number
4. `eas build --platform ios --profile production`
5. `eas submit --platform ios --profile production --latest`
6. App Store Connect → create new version → attach build → Submit for Review

**Android:**
1. `eas build:version:set --platform android --profile production` — interactive, type new versionCode
2. `eas build --platform android --profile production`
3. `eas submit --platform android --profile production --latest`
   - Google Play service account key: `/Users/loumimihome/Downloads/readingdaily-scripture-fe502-c00b76e77b1c.json`

### Deploy Python Cloud Functions
```bash
cd ~/ReadingDaily-Scripture-App/python-functions
firebase deploy --only functions:python-scraper:FUNCTION_NAME
```

### Deploy Node.js Cloud Functions
```bash
cd ~/ReadingDaily-Scripture-App
firebase deploy --only functions:FUNCTION_NAME
```

---

## Known quirks and past bugs

### Gospel scraper (fixed 2026-03-26)
USCCB page has "Verse Before the Gospel" immediately before the Gospel. Has broken 3 times.
Fix: `usccb_scraper.py` explicitly marks Verse Before the Gospel content-body as excluded before searching for gospel. If it breaks again:
```bash
# Re-scrape a date
curl -X POST https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/manual_scrape \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "YYYY-MM-DD"}'

# Force-regenerate timings
curl -X POST https://us-central1-readingdaily-scripture-fe502.cloudfunctions.net/generate_timings \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "YYYY-MM-DD", "force": true}'
```
Admin secret is in `python-functions/.env` (gitignored).

### Reading staleness check (fixed 2026-03-26)
`ReadingService.ts` had a 24h freshness check on ALL dates — caused future readings to show "Not Available" because they were scraped >24h before being read. Fix: freshness check now applies to today's reading only.

### Android layout (fixed 2026-03-17)
Galaxy S26 (API 35) clipped bottom buttons. Fix: `DailyReadingsScreen` uses `flex: 1` on API 31+, explicit height calculation only on API ≤ 30 (old Samsung workaround).

### EAS build numbers
`eas build:version:set` requires interactive input — cannot be run non-interactively. Always run it in a real terminal session before building.

Apple closes the version train once a build is approved — cannot submit new builds to an old version number (ITMS-90186). Always create a new version in App Store Connect for each submission.

---

## Security
All endpoints have:
- Rate limiting (Firestore-backed, 1-hour windows)
- Admin token protection for admin HTTP endpoints (`ADMIN_SECRET` in `.env` files, gitignored)
- Product ID whitelisting on receipt validators
- Firebase ID token verification on user-facing endpoints

Quarterly security review due: **2026-06-24**

---

## Firestore data structure
```
readings/{YYYY-MM-DD}
  ├── gospel: { text, reference, title }
  ├── firstReading: { text, reference, title }
  ├── secondReading: { text, reference, title } (Sundays only)
  ├── psalm: { text, reference, response, title }
  ├── liturgicalDate: { season, feastDay, color, ... }
  └── metadata: { scrapedAt, source, checksum }

readings/{date}/timings/{readingType}
  └── { words: [...], status: "ready" }
```

---

## Planning documents
- `New App Interface Exploration.md` — interface redesign ideas, liturgical colour palette, Lectio Divina depth ladder, seasonal chant (codename: **Project Vespers**)
- `TODO.md` — current open tasks
