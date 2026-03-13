# Apple App Store Submission Status
**Last Updated:** March 9, 2026
**Current Live Version:** 1.1.16 (Build 128)

---

## SUBMISSION HISTORY

| Version | Build | Submitted | Approved | Status | Notes |
|---------|-------|-----------|----------|--------|-------|
| 1.1.5 | ~100 | Feb 2, 2026 | ❌ Rejected | Rejected | Guideline 2.1.0 - subscription button not responding |
| 1.1.6 | 117 | Feb 20, 2026 | Feb 24, 2026 | ✅ Superseded | Subscriptions only, no lifetime |
| 1.1.7 | 118 | Feb 25, 2026 | Feb 27, 2026 | ✅ Superseded | Lifetime re-enabled |
| 1.1.8 | 120 | Mar 4, 2026 | Mar 5, 2026 | ✅ Superseded | Fixed offline banner + Android tabs |
| 1.1.13 | 125 | Mar 7, 2026 | — | ⛔ Developer Rejected | Superseded by 1.1.16 IAP fix |
| 1.1.14 | 126 | Mar 7, 2026 | — | ⛔ Developer Rejected | Superseded by 1.1.16 IAP fix |
| 1.1.16 | 128 | Mar 8, 2026 | Mar 8, 2026 | ✅ **LIVE** | iOS subscription getAvailablePurchases fix |

---

## v1.1.16 — CURRENT LIVE VERSION ✅

**Build:** 128
**Submitted:** March 8, 2026
**Approved:** March 8, 2026
**Submitted by:** Lou Page

**Bug Fixes:**
- `getAvailablePurchases()` pre-check was blindly finishing all pending transactions
  — including valid unacknowledged ones for the product being purchased
  — causing `requestPurchase()` to return `[]` → "purchase failed"
- Fix: if pending transaction found for SAME product → use it directly as success
- Fix: `finishTransaction()` now called after every successful purchase
- Fix: listener does NOT call `finishTransaction()` (race condition — fixed in v1.1.14)

**Files Changed:**
- `src/services/payment/AppleIAPService.ts`

---

## PRODUCT CONFIGURATION (App Store Connect)

| Product | ID | Type | Price | Status |
|---------|-----|------|-------|--------|
| Monthly | `com.readingdaily.basic.monthly.v2` | Auto-renewable | $2.99/mo | ✅ Active |
| Yearly | `com.readingdaily.basic.yearly.v2` | Auto-renewable | $19.99/yr | ✅ Active |
| Lifetime | `com.readingdaily.lifetime.access.v2` | Non-consumable | $49.99 | ✅ Active |

---

## TESTFLIGHT NOTES

- **Monthly/Yearly subscriptions:** Work in TestFlight sandbox ✅
- **Lifetime purchase:** May fail in TestFlight sandbox — expected (Apple sandbox limitation)
- **Lifetime in production:** Works correctly ✅
- **Do not block submissions** over TestFlight lifetime failure — it works in production

---

## KEY LESSONS LEARNED

1. **Version train lock:** Once submitted for review, version string is locked. Must increment.

2. **getAvailablePurchases() danger:** Don't blindly finish all pending transactions — check if they belong to the product being purchased and honour them as success.

3. **finishTransaction() placement:** Call ONLY in the `purchase()` method after success. Do NOT call in `purchaseUpdatedListener` — causes race condition.

4. **Non-Consumable IAP in TestFlight:** Returns empty array until product approved. Works in production.

5. **Review times:** Apple typically reviews in 1-4 hours to 1-2 days. March 8 was same-day.

6. **Submission checklist:**
   - Increment buildNumber in app.json
   - Run EAS build (non-interactive)
   - Download .ipa from EAS dashboard
   - Upload via Transporter app
   - Add build to TestFlight in App Store Connect
   - Create new version entry (version must match app.json)
   - Submit for Review

---

## APP STORE LINKS

- **App Store Connect:** https://appstoreconnect.apple.com/apps/6753561999
- **App Store (Public):** https://apps.apple.com/app/readingdaily-scripture/id6753561999
- **Bundle ID:** com.readingdaily.scripture
- **Apple Team:** Lou Page (A696BUAT9R)
- **Distribution Cert expires:** Oct 3, 2026
