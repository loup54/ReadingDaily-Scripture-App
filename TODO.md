# ReadingDaily Scripture App — Todo List

## Pending

### App Store / Play Store
- [x] Android target API level 36 (Android 16) — bumped `android/gradle.properties` + `app.config.js` 2026-07-22, verified release build succeeds. Google Play deadline Aug 31 2026.
- [ ] Submit new Android build/version with API36 to Play Console before Aug 31 2026 deadline
- [x] iOS v1.1.31 (build 161) — approved & released 2026-04-06
- [x] iOS v1.1.32 — approved & live on App Store 2026-04-16
- [x] Android versionCode 28 (v1.1.29) — was live, not v1.1.31 as previously thought
- [x] Android versionCode 29 (v1.1.31) — approved & live on Google Play 2026-04-16
- [x] Android layout fix (Galaxy S26) — shipped v1.1.31, verification removed
- [x] Google Play self-declaration deadline (May 27, 2026) — passed, no action taken

### Monetisation (new model — 2026-06-02)
- [x] Replace subscription model with free app + one-time archive IAP
- [x] Reuse existing approved product `com.readingdaily.lifetime.access.v2` on both stores
- [x] Remove trial gate from readings screen (`useTrialStore` no longer blocks)
- [x] Remove TrialTimer UI from DailyReadingsScreen
- [x] Archive tab: paywall (dark hero + white card), date list (sectioned by week, mini calendar cells)
- [x] iOS IAP price set to $2.99 USD in App Store Connect
- [x] Android IAP price: $2.99 USD set in Play Console (purchase option `lifetime-access`)
- [x] Android IAP price fixed 2026-06-30 — new purchase option at $1.99 USD created in Play Console for `com.readingdaily.lifetime.access.v2`, old option deactivated.
- [x] Confirm Archive tab appears on Android after OTA — OTA pushed 2026-06-02, Archive tab restored

### Pricing
- [x] Asian market pricing updated 2026-04-06 — India, Malaysia, Philippines, Sri Lanka, Thailand, Vietnam
- Superseded — see `PRICING_GROWTH_PLAN.md` for the current $4.99 price test now running.

### Sentry Crash Reporting
- [x] Organisation slug confirmed: `ourenglishbest` — fixed in app.config.js (2026-03-26)

### App Store
### v1.1.32 — Reading Screen UI (all JS-only, OTA deployable)
- [x] Remove "Practice Pronunciation" button from reading screen — deployed 2026-04-13
- [x] Move Settings gear out of reading header → accessible via Profile tab only — deployed 2026-04-13
- [x] Combine date + liturgical label onto one line: "Mon, Apr 13 · Week 2 of Easter" — deployed 2026-04-13
- [x] Tighten header vertical padding — deployed 2026-04-13
- [x] Reduce horizontal text padding (~20px → ~12px each side) for wider reading column — deployed 2026-04-13
- NOTE: cleaner reading layout also lays groundwork for a future home screen widget
- [ ] FUTURE: Home screen widget — see notes below

### Widget (v1.1.33 or later — requires native build, not OTA)
- Home screen widget showing today's scripture snippet + liturgical season
- Small size: date + "Week 1 of Easter" label + app icon + liturgical colour accent
- Medium size: date + liturgical label + 2–3 lines of today's first reading + "Open" button
- Large size: more reading text + "Listen" button jumping directly to audio
- Liturgical colour theming carries through (Easter gold, Advent purple etc.)
- One-tap opens app directly to today's reading — reduces daily friction significantly
- Requires native code: iOS = WidgetKit (Swift), Android = AppWidget (Kotlin)
- Shared data layer needed: widget reads today's reading from same Firestore source
- Cannot be OTA deployed — needs full store build on both platforms
- Reading screen UI simplification (v1.1.32) directly informs widget layout decisions

### Next version — Metadata (must be done with next store build, cannot edit while version is live)
- [ ] Fix keyword typo: `lectionbary` → `lectionary` — greyed out while live, fix with next store build
- [ ] Replace keywords with ESL-bridging set (98 chars): `ESL,pronunciation,Catholic,Mass,liturgy,listening,language,Bible,devotion,catechism,fluency,prayer`
- [ ] Add Tagalog keywords for Philippines market: `katoliko, dasal, misa, ebanghelyo, filipinos`
- [ ] Update subtitle from "Practice Reading Scripture" → "English Practice with Scripture" (makes ESL angle explicit)
- [ ] Update Description with full rewrite (liturgical seasons, Grace, Lectio Divina framing, ESL angle)
- [ ] Update What's New: describe Project Vespers features — liturgical colours, 3-tab layout, Grace, Offered state
- [ ] New screenshots showing: Easter gold header + "Week 1 of Easter" label, 3-tab bar, Offered overlay (✦ OFFERED), Profile hub screen — 4 shots ready, upload to 6.1" slot

### Project Vespers — COMPLETE (all via OTA, no store builds)
- [x] Phase 1: Liturgical colour themes — deployed 2026-04-06
- [x] Phase 2: Tab bar simplified 5→3 (Readings · Practice · Profile) — deployed 2026-04-06
- [x] Phase 3: Grace — no streak anxiety, welcoming return state — deployed 2026-04-06
- [x] Phase 4: Offered — post-audio quiet hold, "Stay with a verse?" — deployed 2026-04-06

### Security (quarterly review due 2026-06-24)
- [x] Firestore rules — reviewed 2026-07-01: lasallian_reactions write rule tightened to field validation only
- [x] API key rotation — Google Cloud + Azure Speech rotated 2026-07-01, OTA pushed to both apps. **CORRECTION 2026-07-09:** that OTA re-bundled the *stale local `.env` key* (env.ts reads `process.env` before `Constants.expoConfig.extra`, and `EXPO_PUBLIC_*` inlining at `eas update` time uses whatever's in the local `.env` at build time, not the EAS-hosted env var) — translate/TTS broke live in production for ~a week until caught and re-shipped 2026-07-09.
- [ ] **Standing rule going forward:** before running `eas update` after any API key rotation, diff local `.env` against `eas env:list --environment production` first — update `.env` to match if it's drifted. `.env` is gitignored, so this has to be checked manually on whichever machine runs the update; it won't surface as a diff.
- [ ] MobSF scan — defer to pre-v2.0 release
- [x] Firebase Console — Firestore checked 2026-07-01: 3.5K reads/190 writes/30 deletes over 30 days, 0 denies, 0 errors. Clean.
- [x] Dependencies — `npm audit fix` run 2026-07-01 on both apps. Remaining: 15 moderate (LaSallian), 2 high + 20 moderate (ReadingDaily) — all transitive, no fix without breaking changes.
- [x] Removed live UI entry point into the dead subscription model (2026-07-09) — Settings → "Manage Subscription" still routed to the old Basic Monthly/Yearly purchase screen, threw "Purchase Failed" for any user who tapped it. Pulled the Settings row + `onManageSubscription` prop chain + orphaned `getSubscriptionDetail()` from `SettingsScreen.tsx`/`app/(tabs)/settings.tsx`. Legacy `SubscriptionScreen`/Cloud Functions left in place, unchanged.
- [x] **Found the "Purchase Failed" was lying (2026-07-09):** `com.readingdaily.basic.monthly.v2` was still Approved-for-sale in App Store Connect (group "ReadingDaily Premium" — hence "Monthly Premium" on the receipt, not a separate SKU). App showed purchase failure; Apple actually charged and confirmed the subscription. Verified zero real subscribers via App Store Connect subscriber count — only the one test purchase, no customer cleanup needed. Removed Basic Monthly/Yearly from sale in App Store Connect. Made `app/(tabs)/subscription/index.tsx` inert (shows "No longer available", no purchase code renders) as a second layer against stale deep links.
- [x] **Third entry point found — the app's actual front door (2026-07-09):** `src/screens/auth/LandingScreen.tsx` (shown to every logged-out user) had "Start 7-Day Free Trial" + "Subscribe: $1.99/month" buttons. The $1.99 was a hardcoded fallback string with no real product behind it (real fetch target was the now-removed `com.readingdaily.basic.monthly.v2`); both buttons called the same `initializeTrial()` → sign-up handler, no purchase call fires — so no billing risk, but it lied about the business model to 100% of new users. Rewrote to a single honest "Get Started" CTA + "Free to use" copy. `onDemo` prop and `demoButton` style were already dead pre-existing (unrelated, left alone).
