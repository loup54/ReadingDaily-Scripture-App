# Apple Rejection Fix - Complete Action Plan

**Created:** 2026-01-13
**Target:** Fix both rejection issues and resubmit to App Store

---

## 🎯 Two Issues to Fix

### Issue 1: In-App Purchases Not Submitted (Guideline 2.1)
**Status:** 30% complete
**Time Estimate:** 2-3 hours remaining

### Issue 2: Forced Sign-In (Guideline 5.1.1)
**Status:** 0% complete
**Time Estimate:** 4-6 hours

**Total Time:** 6-9 hours

---

## ✅ Completed Steps

- [x] Created Monthly subscription (`com.readingdaily.basic.monthly`)
- [x] Created Yearly subscription (`com.readingdaily.basic.yearly`)
- [x] Verified Lifetime purchase exists (`com.readingdaily.lifetime.access`)
- [x] Set pricing for all products
- [x] All products marked "Ready to Submit"
- [x] Deleted duplicate subscription (Level 3)

---

## 📋 Phase 1: Complete IAP Setup (2-3 hours)

### Step 1: Add IAP Screenshots
**Why:** Apple requires screenshots showing the purchase flow for reviewer testing

**What to screenshot:**
1. Subscription selection screen (showing all 3 tiers)
2. Purchase confirmation dialog
3. Purchase success state

**How to get screenshots:**
- Run app on iOS Simulator
- Navigate to subscription screen
- Take screenshot of subscription tiers
- Tap purchase button (don't complete)
- Screenshot the confirmation dialog

**Where to upload:**
- App Store Connect → Your App → In-App Purchases
- Click each subscription → Review Information → Add Screenshot

---

### Step 2: Link IAPs to App Version
**Why:** Apple needs to know which products to test with which app version

**How:**
1. Go to App Store Connect → Your App → App Review
2. Click on the rejected submission
3. Scroll to "In-App Purchases and Subscriptions"
4. Click "+ Add In-App Purchase"
5. Select all 3 products:
   - Monthly Premium Subscription
   - Yearly Premium Subscription
   - Lifetime Premium Access

---

## 📋 Phase 2: Implement Guest Mode (4-6 hours)

### Current Problem
App requires sign-in immediately on launch. Apple policy requires:
- Users can access general content WITHOUT signing in
- Sign-in only required for account-specific features

### Solution: Guest Mode Architecture

**What users CAN do without signing in:**
- ✅ View daily readings (all 4 readings)
- ✅ Browse calendar
- ✅ Read text
- ✅ Change language
- ✅ View limited settings

**What REQUIRES sign-in:**
- ❌ Audio playback (subscription feature)
- ❌ Pronunciation practice (subscription feature)
- ❌ Purchase subscriptions
- ❌ Progress tracking/streaks
- ❌ Settings sync

---

### Implementation Steps

#### Step 1: Update Auth Store (1 hour)
**File:** `src/stores/useAuthStore.ts`

**Add:**
```typescript
interface AuthState {
  user: User | null;
  isGuest: boolean; // NEW
  // ... existing fields
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isGuest: false, // NEW

  // NEW: Set guest mode
  setGuestMode: () => set({ isGuest: true, user: null }),

  // Update signIn to clear guest mode
  signIn: async (email, password) => {
    // ... existing code
    set({ isGuest: false }); // Clear guest mode on sign-in
  },
}));
```

---

#### Step 2: Update App Entry Point (30 min)
**File:** `app/index.tsx`

**Change from:**
```typescript
// BEFORE - Forces sign-in
if (!user) {
  return <Redirect href="/auth/landing" />;
}
```

**To:**
```typescript
// AFTER - Allow guest mode
const { onboardingCompleted } = useSettingsStore();

// Show onboarding if not completed
if (!onboardingCompleted) {
  return <Redirect href="/onboarding" />;
}

// Go straight to home (works for both signed-in and guest)
return <Redirect href="/(tabs)/home" />;
```

---

#### Step 3: Update Landing Screen (30 min)
**File:** `src/screens/auth/LandingScreen.tsx`

**Add:**
- "Continue as Guest" button
- "Sign in to unlock premium features" message

**Changes:**
```typescript
// Add guest mode button
<TouchableOpacity
  onPress={() => {
    useAuthStore.getState().setGuestMode();
    router.replace('/(tabs)/home');
  }}
  style={styles.guestButton}
>
  <Text>Continue as Guest</Text>
  <Text style={styles.guestSubtext}>
    Sign in later to access audio, pronunciation, and sync
  </Text>
</TouchableOpacity>
```

---

#### Step 4: Add Sign-In Prompts (2 hours)
**Files to modify:**

**1. Audio Player** (`src/components/reading/AudioPlayer.tsx`)
```typescript
const handlePlay = () => {
  const { user, isGuest } = useAuthStore.getState();

  if (isGuest || !user) {
    Alert.alert(
      'Premium Feature',
      'Sign in to access audio playback and other premium features',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign In',
          onPress: () => router.push('/auth/landing')
        }
      ]
    );
    return;
  }

  // ... existing play code
};
```

**2. Pronunciation Practice** (`src/components/pronunciation/PracticeSentenceDisplay.tsx`)
```typescript
const handleStartPractice = () => {
  const { user, isGuest } = useAuthStore.getState();

  if (isGuest || !user) {
    Alert.alert(
      'Premium Feature',
      'Sign in to access pronunciation practice',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/landing') }
      ]
    );
    return;
  }

  // ... existing practice code
};
```

**3. Subscription Screen** (`src/screens/subscription/SubscriptionScreen.tsx`)
```typescript
const handlePurchase = (productId: string) => {
  const { user, isGuest } = useAuthStore.getState();

  if (isGuest || !user) {
    Alert.alert(
      'Sign In Required',
      'Please sign in to purchase a subscription',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/landing') }
      ]
    );
    return;
  }

  // ... existing purchase code
};
```

**4. Progress Screen** (`src/screens/ProgressScreen.tsx`)
```typescript
// Show sign-in prompt instead of progress for guests
const { user, isGuest } = useAuthStore();

if (isGuest || !user) {
  return (
    <View style={styles.guestPrompt}>
      <Text>Sign in to track your reading progress and earn badges</Text>
      <Button title="Sign In" onPress={() => router.push('/auth/landing')} />
    </View>
  );
}

// ... existing progress display
```

---

#### Step 5: Update Onboarding (30 min)
**File:** `app/onboarding.tsx`

**Change:**
- Remove requirement to sign in at end of onboarding
- Add "Continue as Guest" option
- Show "Sign in later to unlock premium features"

---

#### Step 6: Update Settings (30 min)
**File:** `src/screens/settings/SettingsScreen.tsx`

**For guest users, show:**
- Limited settings (language, notifications)
- Prominent "Sign In" button at top
- Gray out subscription-related settings
- Hide account-specific settings (email, profile)

---

### Testing Checklist

**Guest Mode Tests:**
- [ ] App launches without requiring sign-in
- [ ] Can view all 4 daily readings
- [ ] Can browse calendar
- [ ] Can change language
- [ ] Audio button shows sign-in prompt
- [ ] Pronunciation button shows sign-in prompt
- [ ] Subscription button shows sign-in prompt
- [ ] Progress screen shows sign-in prompt
- [ ] Can sign in from any prompt
- [ ] After sign-in, all features work

**Sign-In Tests:**
- [ ] Can create new account
- [ ] Can sign in with existing account
- [ ] After sign-in, premium features unlock
- [ ] Sign out returns to guest mode option

---

## 📋 Phase 3: Build & Submit (1 hour)

### Step 1: Increment Version
```bash
# Update version in app.json
"version": "1.0.1",
"ios": {
  "buildNumber": "76"
}

# Update Info.plist
CFBundleVersion: 76
```

---

### Step 2: Build for TestFlight
```bash
eas build --platform ios --profile production
```

---

### Step 3: Submit to App Store Connect
```bash
eas submit --platform ios --profile production --latest
```

---

### Step 4: Link IAPs in App Review
1. Go to rejected submission
2. Add all 3 IAP products
3. Upload IAP screenshots
4. Add review notes explaining guest mode

---

### Step 5: Write Resolution Message to Apple

**In App Review → Reply to Apple:**

```
Hello,

Thank you for the detailed feedback. We have addressed both issues:

**Issue 1: In-App Purchases (Guideline 2.1.0)**
- Created and submitted 3 in-app purchase products:
  * Monthly Premium Subscription (com.readingdaily.basic.monthly)
  * Yearly Premium Subscription (com.readingdaily.basic.yearly)
  * Lifetime Access (com.readingdaily.lifetime.access)
- All products are now linked to this app version
- Screenshots of the purchase flow are attached

**Issue 2: Account Sign-In (Guideline 5.1.1)**
- Implemented guest mode - users can now access daily Scripture readings without signing in
- Sign-in is now optional and only required for account-specific features:
  * Audio playback (premium feature)
  * Pronunciation practice (premium feature)
  * Subscription purchases
  * Progress tracking across devices
- Users are presented with a "Continue as Guest" option on launch
- When tapping premium features, users see a clear explanation and option to sign in

All changes have been tested and are ready for review.

Thank you,
[Your Name]
```

---

## 🎯 Success Criteria

**Before resubmitting, verify:**
- [ ] All 3 IAP products linked to app version
- [ ] IAP screenshots uploaded
- [ ] App launches without requiring sign-in
- [ ] Daily readings accessible to guests
- [ ] Premium features prompt for sign-in
- [ ] Sign-in flow works correctly
- [ ] All TestFlight testers can test (use guest mode for testing)
- [ ] Build uploaded to App Store Connect
- [ ] Resolution message sent to Apple

---

## ⏱️ Timeline

**Phase 1 (IAP Screenshots):** 1 hour
**Phase 2 (Guest Mode Implementation):** 4-6 hours
**Phase 3 (Build & Submit):** 1 hour

**Total:** 6-8 hours of focused work

---

## 📝 Notes

- Guest mode is the critical fix - Apple will reject again without it
- IAP screenshots can be simple - just show the purchase flow
- Test thoroughly before resubmitting - you don't want another rejection
- Keep TestFlight testers updated on progress

---

**Next Step:** Start with guest mode implementation (Phase 2) since it's the bigger task. IAP screenshots can be done after guest mode is working.

---

**Status:** Ready to implement
**Last Updated:** 2026-01-13
