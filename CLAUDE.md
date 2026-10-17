# ReadingDaily Scripture App — Claude Context

## Development rules (agreed 2026-03-26)

### Minimise store builds
OTA updates are live from v1.1.31. All JS/UI changes ship via `eas update --channel production --message "..."` — no store build required. A new store build is only needed for native module changes or Expo SDK upgrades. **Always ask "is this native?" before triggering a build.** If the answer is no, use OTA.

### Protect stable code
Before touching any existing feature:
1. **Feature flags first** — new work goes behind a boolean in a config file (e.g. `ENABLE_LITURGICAL_THEMES = false`). Build and test with flag on, ship with flag off, enable via OTA once confident. A broken feature cannot break the reading.
2. **New code in new files** — new services, themes, and components go in new files. Existing files (colors.ts, ThemeContext.tsx, screen files) are wired in minimally, not rewritten.
3. **Preserve existing theme** — before changing colors.ts, snapshot current values as `classicTheme` export. One-line rollback if needed.
4. **Run tests before and after each phase** — existing test suite must pass before starting and after completing each change.
5. **Flag shipped OFF in a store build = disclose it to App Review (Apple Guideline 2.5.19, hidden/dormant/undocumented features, clarified 2026-10).** Before submitting any iOS build that contains a flag set to `false`, add one line per flag to App Store Connect → App Review Information → Notes (flag name, what it does, that it's enabled later via OTA). Flags shipped `true` need nothing. Android has no equivalent rule.

### Visual refresh phases (Project Vespers)
All phases are pure JS — ship via OTA, no store builds needed.
1. **Liturgical colour themes** — seasonal palette + intensification toward liturgical highpoints
2. **Tab bar simplification** — collapse 5 tabs to 3 (Readings · Practice · Profile)
3. **Grace feature** — remove broken-streak UI, return = seasonal colour + reading waiting
4. **Completion state ("Offered")** — post-audio quiet hold, "Stay with a verse?" prompt
- Each phase independently shippable and flag-gated
- Colours intensify as season approaches its highpoint (lerp keyed to days_remaining/season_length)
- Ordinary Time is intentionally flat — meaningful contrast to the peaks

---

## What this app is
Catholic daily Mass readings with audio playback, word-level highlighting, pronunciation practice, and translation. Primary audience: non-native English speakers wanting to engage with scripture.

**Firebase project:** `readingdaily-scripture-fe502`
**Bundle ID:** `com.readingdaily.scripture`
**Expo account:** `loup1954`
**App Store ID:** `6753561999`

---

## Stack
- **Audio:** Azure TTS (production) · Google TTS (word timing via SSML marks)
- **Crash reporting:** Sentry (`ourenglishbest` / `react-native`)

---

## Key files
`firestore.indexes.json` is the source of truth for composite indexes.

---

## Distribution & build process

### Current versions
- **iOS:** v1.1.34 build 163 (home-screen widget) — LIVE 2026-08-16, see TODO.md "App Store / Play Store" for the version-string saga behind this release
- **Android:** v1.1.34 versionCode 32 (R8 on, expo-audio removed, runtime 1.1.34) — LIVE 2026-10-03. Android OTAs now target runtime 1.1.34 (the 1.1.33 override is gone); users still on versionCode 31 no longer get OTAs
- **OTA updates active** from v1.1.31 onwards (channel: `production`) — check TODO.md for the latest OTA-shipped fixes, this file isn't kept current turn-by-turn

### Releasing
Build, version-bump, and store-submission steps (including the `--no-wait` submit, version-string-before-build, and Play service-account gotchas) live in the `eas-release` skill. OTA: `eas update --channel production --message "..."`.

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

---

## Security
All endpoints have:
- Rate limiting (Firestore-backed, 1-hour windows)
- Admin token protection for admin HTTP endpoints (`ADMIN_SECRET` in `.env` files, gitignored)
- Product ID whitelisting on receipt validators
- Firebase ID token verification on user-facing endpoints

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
