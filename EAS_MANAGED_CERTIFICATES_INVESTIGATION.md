# EAS Managed Certificates Investigation
**Date:** November 28, 2025
**Purpose:** Complete investigation of EAS-managed iOS certificates setup
**Status:** Complete - Ready for Implementation

---

## Current State Assessment

### ✅ What's Already Set Up

**1. EAS CLI Installation**
- Status: ✅ INSTALLED
- Version: 16.27.0 (latest available)
- Location: `/Users/louispage/.nvm/versions/node/v20.19.2/bin/eas`
- Upgrade available: 16.28.0 (optional, not critical)

**2. eas.json Configuration**
- Status: ✅ COMPLETE and CORRECT
- Build profiles configured:
  - `development`: Internal testing
  - `preview`: TestFlight builds (Release build configuration)
  - `production`: App Store builds (Release, "store" distribution)
- Submit configuration present:
  - Apple ID: `louispage@icloud.com`
  - ASC App ID: `6753561999`
  - Apple Team ID: `A696BUAT9R`

**3. Expo Account Authentication**
- Status: ⏳ NOT LOGGED IN
- Need to: Run `eas login` to authenticate
- Time required: 2 minutes
- This is REQUIRED before building

**4. app.json Configuration**
- Bundle ID: ✅ `com.readingdaily.scripture`
- Version: ✅ `1.0.0`
- Build Number: ✅ `1`
- All settings correct for TestFlight

---

## How EAS-Managed Certificates Work

### The Process (Automated by EAS)

**When you run:** `eas build --platform ios --profile preview`

EAS automatically:
1. Checks if you have a distribution certificate
2. If not → Creates one automatically in your Apple Developer account
3. Creates a provisioning profile for `com.readingdaily.scripture`
4. Stores certificates securely in Expo's system
5. Uses them to sign your app binary
6. You never see the certificate (EAS manages it)

**Advantages:**
- ✅ No manual certificate creation needed
- ✅ No private key files to manage
- ✅ Certificates stored securely by Expo
- ✅ Automatic renewal before expiration
- ✅ Team members can all build without sharing keys

**Disadvantages:**
- ⚠️ Requires EAS account (free, but you need one)
- ⚠️ Tied to Expo's infrastructure

---

## What You Need to Do (3 Simple Steps)

### Step 1: Log Into Expo Account (2 minutes)

**Command:**
```bash
eas login
```

**What happens:**
1. Terminal prompts for email
2. Enter your Expo account email
3. Terminal prompts for password
4. Enter your Expo account password
5. Shows confirmation: "Logged in as [email]"

**If you don't have an Expo account:**
```
1. Go to https://expo.dev
2. Click "Sign Up"
3. Create free account (email + password)
4. Return and run: eas login
```

**Cost:** FREE (Expo free tier includes EAS builds)

---

### Step 2: Configure EAS Credentials (2 minutes)

**Command:**
```bash
eas credentials
```

**What happens:**
1. Terminal shows menu: "Select platform"
2. Choose: `iOS`
3. Terminal shows: "Configure credentials?"
4. Choose: `Create or update credentials`
5. Terminal shows options:
   - "Distribution Certificate" → Choose this
   - "Set up new certificate" → Choose this
6. EAS automatically:
   - Creates distribution certificate in Apple Developer
   - Stores it securely
   - Configures provisioning profile
   - Setup complete!

**Time:** ~2 minutes (EAS does all the work)

**What you need:**
- [ ] Apple ID email (louispage@icloud.com)
- [ ] Apple ID password
- [ ] Two-factor auth code (from your phone when prompted)

**What gets created:**
- 1 Distribution Certificate (valid 3 years)
- 1 Provisioning Profile (valid 1 year)
- Stored in Expo's secure system

---

### Step 3: Verify Setup (1 minute)

**Command:**
```bash
eas credentials --platform ios
```

**What you should see:**
```
iOS Credentials
===============
Distribution Certificate: ✅ Configured
Provisioning Profile: ✅ Configured
Bundle ID: com.readingdaily.scripture
Status: Ready for building
```

---

## Complete Step-by-Step Walkthrough

**Step 1: Open Terminal**
```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
```

**Step 2: Log In to Expo**
```bash
eas login
```

```
Output should be:
? Expo username or email: louispage@icloud.com
? Password: [type your password]
✅ Logged in as louispage
```

**Step 3: Configure Credentials**
```bash
eas credentials
```

```
Output should show menu:
? Select platform: iOS
? Configure credentials? Yes
? What do you want to do? Create or update credentials
? Certificate type: Distribution Certificate
? Create new Distribution Certificate? Yes
[EAS creates certificate and provisioning profile]
✅ Setup complete!
```

**Step 4: Verify Setup**
```bash
eas credentials --platform ios
```

```
Expected output:
Distribution Certificate: ✅ Valid (expires: [date])
Provisioning Profile: ✅ Valid (expires: [date])
Bundle ID: com.readingdaily.scripture
Status: Ready for TestFlight builds
```

---

## What Happens Next in Phase 8.1

### When You're Ready to Build:

**Command:**
```bash
eas build --platform ios --profile preview
```

**What EAS does:**
1. Downloads your code
2. Installs dependencies
3. Compiles TypeScript
4. Bundles app
5. **Uses stored distribution certificate** ← (automatically, no more action needed)
6. Signs app binary
7. Creates iOS app (.ipa file)
8. Uploads to TestFlight
9. Shows download link and status

**You don't interact with certificates again.** EAS handles everything automatically.

---

## eas.json Review

**Your current eas.json is well-configured:**

### ✅ Correct Configurations:

**Build Profiles:**
```json
"preview": {
  "distribution": "internal",  // ← For TestFlight
  "ios": {
    "simulator": false,         // ← Real device
    "buildConfiguration": "Release"  // ← Optimized
  }
}

"production": {
  "distribution": "store",     // ← For App Store
  "ios": {
    "simulator": false,
    "buildConfiguration": "Release"
  }
}
```

**Submit Configuration:**
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "louispage@icloud.com",
      "ascAppId": "6753561999",      // Your app ID in App Store Connect
      "appleTeamId": "A696BUAT9R"    // Your Apple team ID
    }
  }
}
```

All correct! ✅

---

## One Issue to Fix in eas.json

**⚠️ Problem:** Placeholder credentials in production env

**Current:**
```json
"production": {
  "env": {
    "EXPO_PUBLIC_FIREBASE_API_KEY": "YOUR_FIREBASE_API_KEY",
    "EXPO_PUBLIC_AZURE_SPEECH_KEY": "YOUR_AZURE_SPEECH_KEY",
    "EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY": "YOUR_GOOGLE_CLOUD_API_KEY",
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "YOUR_STRIPE_PUBLISHABLE_KEY"
  }
}
```

**Should be:**
```json
"production": {
  "env": {
    "EXPO_PUBLIC_FIREBASE_API_KEY": "AIzaSyDJIfZfHCif6ohNG_J-_NkaNPY2A-Ek2fc",
    "EXPO_PUBLIC_AZURE_SPEECH_KEY": "61NcyOPg9Emcz460KWi2BZ0gvLNjIXSo7vu8Wyaf6LourXHU2beiJQQJ99BKACL93NaXJ3w3AAAYACOG0CL7",
    "EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY": "AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo",
    "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_live_51EYVdfIxdJQzlwA5tOK9fQuJiNMlbUZZSiDXxzqeEFD4J6aHt3MomT6NKFli3ZL7tLsa2fWyd3C8sHH6nFInqYXM00JbJJdWhp"
  }
}
```

**Why:** eas.json can store production env vars (they're public keys, not secrets). But it MUST have correct values for production builds.

**Impact:** If you build with `--profile production` now, it would fail because of placeholder values.

**Fix:** Update the 4 placeholder values with actual API keys from .env

---

## Security Note

**⚠️ Important:** eas.json will be committed to git (unlike .env)

**Safe to commit because:**
- EXPO_PUBLIC_* variables are public (safe to expose)
- These are frontend credentials (API keys, not secrets)
- Same values shipped with app binary
- No private keys or secrets in eas.json

**Not safe to commit:**
- Private Firebase service account keys
- Secret API keys (if you had them)
- OAuth tokens

**Your values are safe to commit.** ✅

---

## Complete Pre-Build Checklist

### Before Running First Build:

```
AUTHENTICATION:
☐ Expo account created (free)
☐ Ran: eas login
☐ Logged in successfully

CONFIGURATION:
☐ app.json has correct version (1.0.0)
☐ app.json has correct bundle ID (com.readingdaily.scripture)
☐ eas.json exists and is configured
☐ eas.json has preview and production profiles
☐ eas.json has correct Apple ID (louispage@icloud.com)

CREDENTIALS:
☐ Ran: eas credentials
☐ Created distribution certificate
☐ Created provisioning profile
☐ Verified with: eas credentials --platform ios

ENVIRONMENT:
☐ .env file has all 4 new API keys
☐ Production env vars in eas.json have actual values (not "YOUR_*")
☐ All required vars validated

APP STATUS:
☐ app compiles without errors: npx tsc --noEmit
☐ app runs locally: npm start
☐ git status is clean: git status
```

---

## Timeline for EAS Setup

| Task | Time | Status |
|------|------|--------|
| Create Expo account | 5 min | If needed |
| Run `eas login` | 2 min | ⏳ TODO |
| Run `eas credentials` | 2 min | ⏳ TODO |
| Fix eas.json placeholder values | 5 min | ⏳ TODO |
| Verify setup | 1 min | ⏳ TODO |
| **Total** | **~12 minutes** | Ready for Phase 8.1 |

---

## What Happens After Setup

### You're now ready for Phase 8.1:

**When you want to build:**
```bash
# Build for TestFlight
eas build --platform ios --profile preview

# EAS automatically:
# 1. Uses stored distribution certificate
# 2. Creates and signs app
# 3. Uploads to TestFlight
# 4. Gives you download link
# 5. Takes ~15-30 minutes
```

**You never interact with certificates directly.** They're stored in Expo's secure system and used automatically.

---

## Common Questions

**Q: What if I already have a distribution certificate?**
A: EAS will use it. If you want to create a new one: `eas credentials --platform ios` → "Set up new certificate"

**Q: Can I access the certificate files?**
A: No (by design). EAS keeps them secure. You just build and they're used automatically.

**Q: What if EAS certificate expires?**
A: EAS auto-renews before expiration. You don't do anything.

**Q: Can multiple team members use the same certificate?**
A: Yes! That's the point of EAS-managed certificates. Everyone logs in with their own Expo account, but certificate is shared.

**Q: What if I lose access to Expo?**
A: You can regenerate certificates. Use: `eas credentials --platform ios`

---

## Decision: Ready to Proceed?

### You have two options:

**Option A: Do EAS Setup Now (Recommended)**
- Takes ~12 minutes
- Must be done before Phase 8.1 build
- Commands: `eas login` → `eas credentials` → verify
- Then immediately ready to build

**Option B: Do EAS Setup Later**
- Can be done whenever
- But MUST be done before first build
- Delay Phase 8.1 by 12 minutes

**Recommendation:** Do it now while we're reviewing Phase 8 planning. Gets it done and one less thing to worry about.

---

**STATUS:** Investigation Complete - Ready for Implementation

**Next Step:** Run `eas login` and `eas credentials` (takes 12 minutes total)

