# Google Play Store Deployment Plan
**Version:** 1.0
**Date:** February 25, 2026
**Status:** 📋 PLANNING PHASE
**Target Launch:** March 2026 (4-6 weeks)

---

## 🎯 Executive Summary

**Goal:** Launch ReadingDaily Scripture App on Google Play Store to expand market reach beyond iOS users.

**Current iOS Status:**
- ✅ v1.1.6 LIVE on App Store (Feb 24, 2026)
- ✅ v1.1.7 approved, releases Feb 26, 2026
- ✅ Subscriptions working ($2.99/month, $19.99/year)
- ✅ Lifetime purchase ($49.99) re-enabled in v1.1.7

**Android Readiness:**
- ✅ Android configuration already in `app.json`
- ✅ Google Play IAP service already implemented
- ✅ Android build profiles exist in `eas.json`
- ⚠️ No production Android builds yet
- ⚠️ No Google Play Console setup
- ⚠️ No Android-specific testing completed

**Estimated Timeline:** 4-6 weeks from start to Play Store launch

---

## ✅ What's Already Done

### Code & Configuration
1. **app.json** - Android fully configured
   - ✅ Package name: `com.readingdaily.scripture`
   - ✅ compileSdkVersion: 35
   - ✅ targetSdkVersion: 35
   - ✅ minSdkVersion: 24 (Android 7.0+)
   - ✅ Permissions: RECORD_AUDIO (for pronunciation practice)
   - ✅ Adaptive icon configured
   - ✅ Splash screen configured

2. **Google Play IAP Service** - Fully implemented
   - ✅ `src/services/payment/GooglePlayService.ts` (543 lines)
   - ✅ Product IDs defined:
     - com.readingdaily.lifetime.access
     - com.readingdaily.basic.monthly
     - com.readingdaily.basic.yearly
   - ✅ Purchase flow implemented
   - ✅ Restore purchases implemented
   - ✅ Subscription management implemented
   - ✅ Receipt validation ready

3. **EAS Build Configuration** - Partially done
   - ✅ Preview build profile (`preview` - APK)
   - ✅ Preview AAB profile (`preview-aab` - App Bundle)
   - ⚠️ No production Android profile yet

4. **Cross-Platform Support**
   - ✅ react-native-iap library used (supports both iOS & Android)
   - ✅ PaymentServiceFactory auto-detects platform
   - ✅ All features platform-agnostic

---

## ❌ What's Missing

### Google Play Console Setup
- [ ] Create Google Play Console account ($25 one-time fee)
- [ ] Complete developer profile
- [ ] Set up payment merchant account
- [ ] Configure tax information
- [ ] Set up pricing & distribution

### Product Configuration
- [ ] Create in-app products in Google Play Console:
  - Lifetime access (one-time purchase)
  - Monthly subscription
  - Yearly subscription
- [ ] Set pricing for all regions
- [ ] Configure subscription settings

### Build & Testing
- [ ] Create production Android build
- [ ] Internal testing with closed testers
- [ ] Fix any Android-specific bugs
- [ ] Performance testing on Android devices
- [ ] Test IAP purchases in Google Play sandbox

### Store Listing
- [ ] App title and description
- [ ] Screenshots (Android sizes: 1080x1920, 1440x2560, etc.)
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Content rating questionnaire
- [ ] Privacy policy link
- [ ] Target audience settings

### Legal & Compliance
- [ ] Data safety form completion
- [ ] Privacy policy review
- [ ] COPPA compliance (if applicable)
- [ ] GDPR compliance documentation
- [ ] App signing key generation

---

## 📅 Phased Rollout Plan

### Phase 1: Infrastructure Setup (Week 1)
**Goal:** Get Google Play Console and build infrastructure ready

**Tasks:**
1. **Google Play Console Setup** (Day 1-2)
   - [ ] Create Google Play Console account
   - [ ] Pay $25 registration fee
   - [ ] Complete developer profile
   - [ ] Verify phone and email
   - [ ] Accept developer agreement

2. **App Signing Setup** (Day 2-3)
   - [ ] Generate upload key for app signing
   - [ ] Configure Google Play App Signing
   - [ ] Store keys securely (DO NOT lose these!)
   - [ ] Document key storage location

3. **EAS Configuration** (Day 3-4)
   - [ ] Add production Android profile to `eas.json`
   - [ ] Configure environment variables for Android
   - [ ] Set up credentials with EAS
   - [ ] Test build configuration

4. **First Production Build** (Day 4-5)
   - [ ] Run: `eas build --platform android --profile production`
   - [ ] Verify build succeeds
   - [ ] Download AAB file
   - [ ] Test on Android device/emulator

**Deliverables:**
- ✅ Google Play Console account active
- ✅ App signing configured
- ✅ Production Android build (.aab file)

---

### Phase 2: In-App Purchase Setup (Week 2)
**Goal:** Configure subscriptions and IAP products in Google Play Console

**Tasks:**
1. **Create App in Console** (Day 1)
   - [ ] Create new app in Google Play Console
   - [ ] Upload first build (internal testing track)
   - [ ] Complete basic app information
   - [ ] Link Firebase project (for analytics)

2. **IAP Product Creation** (Day 2-3)
   - [ ] Create lifetime product:
     - ID: `com.readingdaily.lifetime.access`
     - Type: Managed product (one-time purchase)
     - Price: $49.99 USD
   - [ ] Create monthly subscription:
     - ID: `com.readingdaily.basic.monthly`
     - Type: Auto-renewing subscription
     - Base plan: $2.99/month
     - Free trial: 7 days
   - [ ] Create yearly subscription:
     - ID: `com.readingdaily.basic.yearly`
     - Type: Auto-renewing subscription
     - Base plan: $19.99/year
     - Free trial: 7 days

3. **Subscription Configuration** (Day 3-4)
   - [ ] Set up subscription groups
   - [ ] Configure grace periods
   - [ ] Set up account hold
   - [ ] Configure prorations
   - [ ] Test purchase flow in sandbox

4. **Testing IAP** (Day 4-5)
   - [ ] Add test users (license testing)
   - [ ] Test each product purchase
   - [ ] Verify restore purchases works
   - [ ] Test subscription cancellation
   - [ ] Test subscription renewal

**Deliverables:**
- ✅ All 3 IAP products created and activated
- ✅ Subscription settings configured
- ✅ IAP tested in sandbox environment

---

### Phase 3: Store Listing & Assets (Week 3)
**Goal:** Create compelling store listing with all required assets

**Tasks:**
1. **Screenshots** (Day 1-2)
   - [ ] Capture Android screenshots (use Android emulator or device):
     - Daily reading screen
     - Audio/pronunciation practice
     - Progress/streak screen
     - Subscription screen
     - Settings screen
   - [ ] Resize for required formats:
     - Phone: 1080x1920 (minimum 2 screenshots)
     - 7-inch tablet: 1536x2048 (if supporting tablets)
     - 10-inch tablet: 2048x2732 (if supporting tablets)
   - [ ] Add text overlays highlighting features
   - [ ] Upload to Google Play Console

2. **Feature Graphic** (Day 2)
   - [ ] Create 1024x500 feature graphic
   - [ ] Use app branding (purple gradient)
   - [ ] Include app name and tagline
   - [ ] Show key features visually
   - [ ] Upload to console

3. **App Description** (Day 2-3)
   - [ ] Write short description (80 characters):
     - "Daily scripture readings with AI pronunciation practice & audio"
   - [ ] Write full description (4000 characters max):
     - App overview
     - Key features (bullet points)
     - Subscription details
     - 7-day free trial mention
     - Technical requirements
   - [ ] Localize for key markets (optional):
     - Spanish
     - Portuguese
     - French

4. **Content Rating** (Day 3)
   - [ ] Complete IARC questionnaire
   - [ ] Expected rating: Everyone (E) or 3+
   - [ ] No violent/mature content
   - [ ] Submit for review

5. **Data Safety Form** (Day 4)
   - [ ] Complete data collection disclosure:
     - User authentication data
     - App activity (reading progress)
     - In-app purchases
   - [ ] Specify data sharing practices
   - [ ] Link to privacy policy
   - [ ] Submit form

6. **Store Details** (Day 5)
   - [ ] App category: Education
   - [ ] Contact email: ourenglish2019@gmail.com
   - [ ] Privacy policy URL: (create if needed)
   - [ ] Target audience: Ages 13+
   - [ ] Target countries: Worldwide (or specific)

**Deliverables:**
- ✅ Complete store listing with all assets
- ✅ Content rating approved
- ✅ Data safety form completed
- ✅ Ready for review submission

---

### Phase 4: Testing & Bug Fixes (Week 4)
**Goal:** Internal testing to catch Android-specific issues

**Tasks:**
1. **Internal Testing Track** (Day 1)
   - [ ] Create internal testing track
   - [ ] Add internal testers (email list)
   - [ ] Upload production build
   - [ ] Distribute to testers

2. **Device Testing** (Day 1-3)
   - [ ] Test on multiple Android versions:
     - Android 7.0 (minSdk)
     - Android 10
     - Android 12
     - Android 14/15 (latest)
   - [ ] Test on different screen sizes:
     - Small phone (5")
     - Large phone (6.5")
     - Tablet (if supported)
   - [ ] Test on different manufacturers:
     - Samsung
     - Google Pixel
     - OnePlus
     - Xiaomi

3. **Feature Testing** (Day 2-4)
   - [ ] Audio playback (TTS narration)
   - [ ] Speech recognition (pronunciation practice)
   - [ ] Subscription purchase flow
   - [ ] Lifetime purchase flow
   - [ ] Restore purchases
   - [ ] Push notifications
   - [ ] Dark mode
   - [ ] Offline functionality
   - [ ] Performance (load times, battery usage)

4. **Bug Fixes** (Day 3-5)
   - [ ] Document all bugs found
   - [ ] Prioritize critical vs. nice-to-have
   - [ ] Fix critical bugs
   - [ ] Rebuild and retest
   - [ ] Repeat until stable

**Deliverables:**
- ✅ Internal testing completed
- ✅ All critical bugs fixed
- ✅ App stable on major Android versions
- ✅ Performance acceptable

---

### Phase 5: Closed Beta Testing (Week 5) - Optional
**Goal:** Get external user feedback before public launch

**Tasks:**
1. **Closed Testing Track** (Day 1)
   - [ ] Create closed testing track
   - [ ] Add beta testers (50-100 users)
   - [ ] Upload latest build
   - [ ] Send invitation emails

2. **Feedback Collection** (Day 2-7)
   - [ ] Monitor crash reports
   - [ ] Read user feedback/reviews
   - [ ] Track feature usage (Firebase Analytics)
   - [ ] Identify pain points

3. **Iterate Based on Feedback** (Day 5-7)
   - [ ] Fix reported bugs
   - [ ] Improve confusing UX
   - [ ] Polish rough edges
   - [ ] Rebuild if necessary

**Deliverables:**
- ✅ Beta testing complete
- ✅ User feedback incorporated
- ✅ App polished and ready

---

### Phase 6: Production Release (Week 6)
**Goal:** Launch on Google Play Store to the public

**Tasks:**
1. **Final Review** (Day 1)
   - [ ] All features working
   - [ ] All IAP products tested
   - [ ] All bugs fixed
   - [ ] Performance acceptable
   - [ ] Screenshots and listing perfect

2. **Submit for Review** (Day 1-2)
   - [ ] Move build to production track
   - [ ] Set release type:
     - Managed release (recommended): You control when it goes live
     - Immediate release: Goes live after approval
   - [ ] Set rollout percentage (optional):
     - Start with 5-10% of users
     - Monitor for issues
     - Increase to 100% gradually
   - [ ] Submit for review

3. **Google Review** (Day 2-5)
   - [ ] Wait for Google's review (typically 3-5 days)
   - [ ] Respond to any review notes
   - [ ] Fix issues if rejected
   - [ ] Resubmit if needed

4. **Launch!** (Day 5-7)
   - [ ] Approved! 🎉
   - [ ] Release to 100% of users (or start rollout)
   - [ ] App goes live on Google Play
   - [ ] Monitor initial user feedback

5. **Post-Launch Monitoring** (Day 7+)
   - [ ] Monitor crash rate (<0.1% target)
   - [ ] Track installs and uninstalls
   - [ ] Monitor reviews (respond promptly)
   - [ ] Track IAP conversion rates
   - [ ] Fix any critical issues immediately

**Deliverables:**
- ✅ App LIVE on Google Play Store
- ✅ Monitoring active
- ✅ Support ready for user inquiries

---

## 💰 Costs & Budget

### One-Time Costs
- **Google Play Console registration:** $25 (one-time, lifetime)
- **App signing certificate:** $0 (Google manages for free)
- **EAS Build credits:** Included in current plan (or $29/month for unlimited)

### Ongoing Costs
- **Google Play service fee:** 15% commission on subscriptions (after first $1M/year)
- **Payment processing:** ~3% (included in Google's fee)
- **Hosting (Firebase):** Current costs (already paying for iOS)

### Total Estimated Cost to Launch
- **Initial:** $25-$54 (depending on EAS plan)
- **Monthly:** $0 additional (using existing infrastructure)

---

## 🔧 Technical Requirements

### Development Environment
- [ ] Android Studio installed (for emulator testing)
- [ ] Android SDK tools updated
- [ ] Java JDK 11+ installed
- [ ] EAS CLI up to date

### Build Configuration Changes

**Add to `eas.json`:**
```json
{
  "build": {
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "ios": {
        // existing iOS config
      },
      "env": {
        // existing env vars
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      },
      "ios": {
        // existing iOS config
      }
    }
  }
}
```

### Environment Variables to Add
```
EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY=<from Play Console>
```

### App Signing
- **Upload key:** Generated by EAS Build
- **App signing key:** Managed by Google Play (automatic)

---

## 📋 Pre-Launch Checklist

### Google Play Console
- [ ] Account created and verified
- [ ] Developer profile complete
- [ ] Merchant account linked
- [ ] Tax information submitted
- [ ] App created in console

### App Configuration
- [ ] Package name correct: `com.readingdaily.scripture`
- [ ] Version code incremented (start at 1 for Android)
- [ ] Version name matches (1.1.7)
- [ ] All permissions declared in manifest
- [ ] App signing configured

### Store Listing
- [ ] App title (max 50 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] Screenshots (minimum 2, recommended 8)
- [ ] Feature graphic (1024x500)
- [ ] High-res icon (512x512)
- [ ] Content rating obtained
- [ ] Privacy policy URL

### In-App Products
- [ ] Lifetime product created ($49.99)
- [ ] Monthly subscription created ($2.99)
- [ ] Yearly subscription created ($19.99)
- [ ] All products activated
- [ ] Pricing set for all countries
- [ ] Trial period configured (7 days)

### Testing
- [ ] Internal testing completed
- [ ] Beta testing completed (optional)
- [ ] All IAP flows tested
- [ ] Crash-free rate > 99.9%
- [ ] Performance benchmarks met

### Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] Data safety form completed
- [ ] Content rating approved
- [ ] Age restrictions set (13+)

---

## 🎯 Success Metrics

### Launch Goals (First 30 Days)
- **Installs:** 100+ downloads
- **Crash-free rate:** > 99.9%
- **Rating:** 4.0+ stars
- **IAP conversion:** Match iOS rates (~5-10%)
- **Trial start rate:** > 50% of new users

### Long-Term Goals (3-6 Months)
- **10,000+ installs**
- **4.5+ star rating**
- **IAP revenue:** Match or exceed iOS
- **Platform split:** 40% Android, 60% iOS (typical)

---

## ⚠️ Risks & Mitigation

### Risk 1: Google Review Rejection
**Mitigation:**
- Follow all Google Play policies carefully
- Complete data safety form accurately
- Ensure privacy policy is comprehensive
- Test all features thoroughly before submission

### Risk 2: Android-Specific Bugs
**Mitigation:**
- Test on multiple Android versions and devices
- Use internal testing track extensively
- Monitor crash reports closely
- Have rollback plan ready

### Risk 3: IAP Issues on Android
**Mitigation:**
- Test IAP thoroughly in sandbox
- Use react-native-iap (proven cross-platform library)
- Have test accounts ready
- Document troubleshooting steps

### Risk 4: Low Android Adoption
**Mitigation:**
- Market Android version alongside iOS
- Offer same features and pricing
- Ensure performance matches iOS version
- Collect user feedback and iterate

---

## 📞 Support & Resources

### Google Play Console
- **URL:** https://play.google.com/console
- **Help Center:** https://support.google.com/googleplay/android-developer
- **Developer Policy:** https://play.google.com/about/developer-content-policy/

### EAS Build for Android
- **Docs:** https://docs.expo.dev/build/setup/
- **Android Config:** https://docs.expo.dev/build-reference/android-builds/

### React Native IAP (Google Play)
- **Docs:** https://react-native-iap.dooboolab.com/
- **Android Setup:** https://react-native-iap.dooboolab.com/docs/get-started/android

---

## 🚀 Quick Start Commands

### Build Android Production
```bash
# First time: Configure credentials
eas build:configure

# Build production AAB
eas build --platform android --profile production

# Submit to Google Play (after first manual upload)
eas submit --platform android --profile production
```

### Test Android Locally
```bash
# Build APK for local testing
eas build --platform android --profile preview

# Install on connected device
adb install path/to/app.apk
```

---

## 📝 Next Steps

### Immediate Actions (This Week)
1. **Decision:** Confirm go/no-go for Android launch
2. **Budget:** Approve $25 Google Play registration fee
3. **Timeline:** Confirm 4-6 week timeline acceptable
4. **Priority:** Decide if this is priority after iOS v1.1.7 launch

### Week 1 Actions (After Decision)
1. Register Google Play Console account
2. Add production Android profile to `eas.json`
3. Create first production Android build
4. Test build on Android device

### Communication
- **Project updates:** Weekly status reports
- **Blockers:** Communicate immediately
- **Launch date:** Coordinate with marketing team

---

## 📊 Comparison: iOS vs Android

| Aspect | iOS (App Store) | Android (Play Store) |
|--------|-----------------|----------------------|
| **Registration Fee** | $99/year | $25 one-time |
| **Review Time** | 1-3 days (faster) | 3-7 days (slower) |
| **Approval Rate** | Stricter (~20% rejection) | More lenient (~5% rejection) |
| **Market Share** | ~30% US, ~15% global | ~70% US, ~85% global |
| **IAP Commission** | 15-30% | 15-30% (same) |
| **Beta Testing** | TestFlight (excellent) | Internal/Closed tracks (good) |
| **IAP Implementation** | StoreKit (Apple) | Google Play Billing |
| **Build Complexity** | Simpler | More complex (multiple devices) |
| **Revenue** | Higher per user | Lower per user, but more users |

---

**Status:** 📋 Planning Complete - Ready to Execute
**Created:** February 25, 2026
**Author:** Claude Code
**Next Review:** After iOS v1.1.7 launch (Feb 26, 2026)

---

*This plan provides a comprehensive roadmap for launching ReadingDaily Scripture on Google Play Store. Estimated timeline: 4-6 weeks from start to launch.*
