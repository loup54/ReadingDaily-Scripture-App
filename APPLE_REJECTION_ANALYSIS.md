# Apple App Store Rejection - Version 1.0

**Date Rejected:** January 8, 2026
**Review Date:** January 7, 2026
**Submission ID:** 077e1fb3-5b89-4823-b559-60e86d74f9d5
**Review Device:** iPad Air (5th generation)

---

## Issue 1: Guideline 2.1 - Performance - App Completeness 🔴

### Problem
Apple cannot complete the review because **in-app purchase products have not been submitted for review**.

### Specific Issue
> "The app includes references to subscriptions but the associated in-app purchase products have not been submitted for review."

### What Apple Needs
1. ✅ **Submit in-app purchases** in App Store Connect
2. ✅ **Upload a new binary** after IAP setup
3. ✅ **Provide App Review screenshot** showing the IAP purchase flow

### Root Cause
- App has subscription UI and references to IAP products
- But no IAP products were created/submitted in App Store Connect
- Apple reviewers cannot test the subscription flow

### Action Items
- [ ] Create IAP subscription products in App Store Connect
  - Product ID from `.env`: `EXPO_PUBLIC_APPLE_IAP_PRODUCT_ID`
  - Set up pricing, descriptions, and metadata
  - Submit IAP products for review
- [ ] Take screenshots showing subscription purchase flow
- [ ] Upload screenshots to App Store Connect
- [ ] Build and submit new binary (after IAP setup complete)

---

## Issue 2: Guideline 5.1.1 - Legal - Data Collection and Storage 🔴

### Problem
**App requires user registration (with personal information) before allowing access to content that is not account-specific.**

### Specific Issue
> "Apps cannot require user registration prior to allowing access to app content and features that are not associated specifically to the user."

### What Apple's Policy Says
- ❌ **Cannot require** sign-in to access general app content
- ✅ **Can require** sign-in for account-specific features (e.g., syncing purchases across devices)
- ✅ **Must be optional** - User should be able to use the app without registering
- ✅ **Can encourage** sign-in by explaining benefits (access from multiple devices)

### Current App Behavior
**Problem:** App currently requires Firebase Authentication sign-in on launch before showing any content.

**What needs to change:**
1. Allow users to browse/read daily scripture WITHOUT signing in
2. Make sign-in **optional** and show benefits ("Sign in to sync your progress and subscriptions across devices")
3. Only require sign-in when user wants to:
   - Purchase a subscription
   - Access subscription features (pronunciation practice, audio)
   - Sync progress across devices
   - Track streaks/badges

### Note from Apple
> "Although App Review Guideline 3.1.2 requires an app to make subscription content available to all the supported devices owned by a single user, **it is not appropriate to force user registration to meet this requirement**; such user registration must be optional."

### Action Items
- [ ] **Redesign authentication flow** to make sign-in optional
- [ ] Allow anonymous/guest access to:
  - Daily readings (First Reading, Psalm, Gospel, Second Reading)
  - Basic reading features
  - Calendar view
- [ ] Require sign-in only for:
  - Purchasing subscriptions
  - Audio playback (subscription feature)
  - Pronunciation practice (subscription feature)
  - Progress tracking/streaks/badges
  - Settings sync across devices
- [ ] Add "Sign In" button with benefits explanation
  - "Sign in to unlock pronunciation practice, audio features, and sync your progress across devices"
- [ ] Show sign-in prompt when user taps subscription features
- [ ] Update onboarding to not require sign-in

---

## Resources from Apple

### In-App Purchases
- [How to offer in-app purchases](https://developer.apple.com/app-store/in-app-purchase/)
- [In-app purchase metadata](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/create-in-app-purchases) (requires App Review screenshot)

### Account Registration
- [Guideline 5.1.1(v) - Account Sign-In](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [Tips for doing more for users with less data](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [App Review Guideline 3.1.2](https://developer.apple.com/app-store/review/guidelines/#subscriptions) - Subscription content across devices

---

## Fix Priority

### Critical Path (Must fix before resubmission)
1. ✅ **Create & submit IAP products in App Store Connect**
2. ✅ **Implement optional sign-in / guest mode**
3. ✅ **Update onboarding to not require sign-in**
4. ✅ **Add sign-in prompts only when needed**
5. ✅ **Take IAP purchase flow screenshots**
6. ✅ **Build and submit new version**

### Timeline Estimate
- IAP setup: 1-2 hours
- Optional sign-in implementation: 4-6 hours
- Testing: 2 hours
- Build & submit: 1 hour
- **Total: 8-11 hours of work**

---

## Technical Implementation Notes

### Optional Sign-In Architecture

**Current Flow:**
```
App Launch → Landing Screen → Requires Sign-In → Home Screen
```

**New Flow:**
```
App Launch → Optional Onboarding → Home Screen (Guest Mode)
                                  ↓
                        Sign in prompt when accessing:
                        - Subscription purchase
                        - Audio playback
                        - Pronunciation practice
                        - Progress tracking
```

### Files to Modify
1. `app/index.tsx` - Remove forced authentication check
2. `src/screens/auth/LandingScreen.tsx` - Make sign-in optional
3. `src/screens/reading/DailyReadingScreen.tsx` - Add sign-in prompt for premium features
4. `src/components/pronunciation/PracticeSentenceDisplay.tsx` - Check auth before starting
5. `src/components/reading/AudioPlayer.tsx` - Check auth before playing audio
6. `src/stores/useAuthStore.ts` - Add guest mode support
7. `src/screens/subscription/SubscriptionScreen.tsx` - Require auth before purchase

### Guest Mode Features (No Sign-In Required)
- ✅ View daily readings (all four readings)
- ✅ Navigate calendar
- ✅ Read text
- ✅ Change language
- ✅ View settings (limited)
- ❌ Audio playback (show sign-in prompt)
- ❌ Pronunciation practice (show sign-in prompt)
- ❌ Progress tracking (show sign-in prompt)
- ❌ Purchase subscription (show sign-in prompt)

---

## Next Steps

1. **Immediate:** Set up IAP products in App Store Connect
2. **Development:** Implement optional sign-in / guest mode
3. **Testing:** Test guest mode + subscription flow on TestFlight
4. **Submission:** Build new version and resubmit with IAP metadata

---

**Status:** Action required - Implementation pending
**Last Updated:** 2026-01-13
