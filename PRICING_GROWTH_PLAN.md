# Pricing & Growth Plan

Sequenced so pricing levers are isolated and measured before growth changes confound the funnel. One lever per phase, explicit read criteria, explicit rollback thresholds — not calendar rituals.

## Current state (as of writing)
- Single one-time IAP `com.readingdaily.lifetime.access.v2` gates only the Archive tab (30-day history). Core reading/audio/practice/translation stays free.
- Platform price mismatch: iOS $2.99 (App Store Connect), Android $1.99 (Play Console, set 2026-06-30). Same product, same entitlement, two prices.
- No subscription tier, no ads, no referral/gift flow wired to current IAP.

## Phase 1 — Price lever alone

**Status: CLOSED 2026-09-02, reverted to $2.99.** Both platforms confirmed at $4.99 USD from 2026-07-08. 8-week cap hit today (2026-09-02) with volume too thin to trust (single-digit daily purchases, N-floor of ~100 events not reached) — applied the plan's own fallback rule ("stop waiting, accept the lower-confidence read, decide anyway") rather than force a precise read out of a UI that only supports day-by-day browsing, not a real aggregate. Given the thin data, took the conservative default and reverted rather than risk holding a bad price on unclear signal.

**Reverted, both platforms, 2026-09-02:**
- iOS: App Store Connect → In-App Purchases → `com.readingdaily.lifetime.access.v2` → base price set back to $2.99 USD via All Prices and Currencies picker.
- Android: reactivated the existing (previously deactivated) `lifetime-access-usd-2-99` purchase option in Play Console, deactivated the $4.99 `lifetime-access` option via its row's ⋯ menu (not visible via the row's arrow link — hidden there).

**Separately found during this check, unresolved:** a live "ReadingDaily Premium" subscription group exists in App Store Connect (Monthly Premium Subscription ×2 duplicate entries, Yearly Premium Subscription ×2 duplicate entries, Premium Annual) with 1 active paid subscriber ($1-2 MRR). This contradicts this doc's own "no subscription tier" line above and `TODO.md`'s record of the subscription code being deliberately deleted as dead — meaning a real subscriber may be paying for a tier the app no longer gates anything behind. Not fixed yet — needs a decision on whether to deactivate the dead products from sale and/or reach out to the existing subscriber. Apple's own Settings-based cancellation still works regardless (confirmed in code), so no one is trapped, but this is real money for nothing on the customer's end.

**Not proceeding to Phase 2 yet** — the thin-data problem that closed Phase 1 (very low absolute volume) means a rename/copy test would face the same N-floor problem. Worth reconsidering after checking whether overall install/traffic volume can be grown first, rather than running the same underpowered test again.

0. **Precondition (verify before shipping):** confirm $4.99 applies to new purchases only — existing $2.99/$1.99 owners keep their entitlement, no re-charge. Verified against code: `PurchaseService.restore()` / `usePurchaseStore` key entitlement off `productId` alone, never price paid. Standard one-time-IAP behavior. Not a risk, but gated as a precondition, not an assumption.
1. **[USER ACTION — no store API access]** Set both platforms to $4.99 directly in App Store Connect + Play Console (no intermediate parity-only step — nothing to measure by holding at $2.99-both first).
2. **Owner: Lou.** Pulls App Store Connect / Play Console analytics weekly for the duration of the hold, or the read criteria below degrade into a calendar ritual instead of a data gate.
3. **Read criteria:** 2 consecutive stable weekly windows (kills Sunday/weekday seasonality) **and** ~100 purchase events, whichever takes longer — **capped at 8 weeks**. If the N-floor isn't hit by week 8, stop waiting, accept the lower-confidence read, decide anyway.
4. **Decision bands:**
   - Flat or up → proceed to Phase 2.
   - 0 to -30% conversion → proceed only if revenue-per-install (rate × $4.99) is net positive vs. $2.99 baseline; otherwise revert.
   - Worse than -30% → revert to $2.99, do not proceed.

## Phase 2 — Value-prop lever alone (rename/copy only, no feature changes)

5. Rename → "ReadingDaily Plus," rewrite paywall pitch. Price and feature set held identical to Phase 1's Archive unlock — **no bundled features added.**
   - Checked before drafting this: the originally-planned additions (offline downloads, extra TTS voice choice) are already free and ungated today (`ReadingDownloadService`/`DownloadManagerScreen`/`OfflineSettingsSection`, and `SettingsScreen`'s voice picker — no `hasArchiveAccess` check on either). Bundling them into Plus would mean revoking functionality from existing free users, not sweetening a new purchase — rejected: no clean grandfathering path exists (entitlement is a single purchase-bool, can't distinguish "always had it free" from "new install"), and it reverses a deliberate prior product decision (core stays free, only Archive is gated).
   - Consequence: this is now a pure positioning test — a rename either moves the rate or it doesn't. No retention-side effect to disentangle from conversion, so **no usage instrumentation needed** (confirmed the analytics pipeline is live — `AnalyticsService` initialized in `app/index.tsx` — but there's nothing new to instrument against once the feature-bundle idea was dropped).
6. Same read criteria/cap as Phase 1 (2 stable weekly windows + N-floor, 8-week cap).
7. **Decision — single threshold** (price unchanged, so no revenue-tradeoff band needed, unlike Phase 1):
   - Flat or up (vs. Phase 1 baseline) → proceed to Phase 3.
   - Drop >10% relative, holding across both weekly windows → revert copy/name to Phase 1 state.
   - Drop ≤10% → noise, proceed, re-baseline for Phase 3.
8. **Secondary signal, free (no code, no gating on it):** refund rate among Plus purchasers vs. Phase 1 baseline, pulled from the same store financial reports as the conversion numbers. Sanity check only, not a decision input.

## Phase 3 — Supporter subscription, staggered

9. **[USER ACTION — no store API access]** Create the $19.99/yr "Supporter" subscription product in App Store Connect + Play Console after Phase 2 settles — soft perks only (early access, badge), nothing currently-free gets gated. Launched as its own event so new users aren't parsing two novel purchase options simultaneously.
10. Standard 2-3 week / N-floor window measures cannibalization (one-time-purchase conversion drop) — but this window structurally undervalues the subscription since renewal revenue hasn't materialized yet. Treat this as a **first-order estimate only**, not a final verdict.
11. **Kill switch on the first-order read:** if one-time conversions drop >20% with zero offsetting subscription revenue even at face-value week-1-3 totals, pull the tier immediately.
12. If the first-order read is ambiguous-but-not-alarming, let it ride and **revisit at the 6- and 12-month renewal marks** before making a permanent call — that's when actual subscription LTV is knowable.

## Phase 4 — Native build bundle

13. Widget (iOS WidgetKit + Android AppWidget) + ASO relaunch (ESL-angle keywords, description, subtitle, screenshots — already drafted in `TODO.md`) shipped together in one native submission. Held until Phases 1-3 clear with no open rollback — this phase shifts engagement and acquisition mix simultaneously, which would confound any pricing read still in flight.

## Phase 5 — Client-only growth loops

14. Shareable verse card (one-tap image share of today's reading).
15. Repurpose existing `gifting.ts` + send-gift/redeem-gift screens onto the current IAP ("gift a friend Plus") — infra already built for the dead subscription model.
16. Ship Hutchinson quote notifications (Phase 3 of that feature) — second soft daily touchpoint.

## Phase 6 — Parish/school bulk licensing

17. Flat annual license + parish code unlocking Plus community-wide, distributed via the existing outreach flyer system. Last — highest effort, wants the organic funnel already healthy first.
