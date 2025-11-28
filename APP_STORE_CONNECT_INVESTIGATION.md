# App Store Connect Configuration Investigation
**Date:** November 28, 2025
**Purpose:** Determine current App Store Connect setup status
**Status:** Complete Investigation & Setup Guide

---

## Current State Assessment

### ✅ Prerequisites Ready
- **iOS Bundle ID:** `com.readingdaily.scripture` ✅ (configured in app.json)
- **App Version:** `1.0.0` ✅ (correct for first release)
- **Build Number:** `1` ✅ (set in app.json)
- **App Name:** "ReadingDaily Scripture App" ✅ (defined)
- **Category:** Books ✅ (appropriate)

### ❓ App Store Connect Status: UNKNOWN
- **Need to verify:** Has an app been created in App Store Connect yet?
- **If yes:** What's the current state (draft, metadata complete, etc.)?
- **If no:** Need to create it this week before Phase 8.1

---

## What App Store Connect Does

**App Store Connect** is Apple's platform for:
1. Creating and registering your app with Apple
2. Managing app metadata (screenshots, description, keywords)
3. Managing TestFlight beta testing
4. Submitting builds for App Store review
5. Managing pricing and availability
6. Monitoring reviews and ratings post-launch
7. Managing app certificates and provisioning profiles

**Required before TestFlight:** App must be created in App Store Connect (even if metadata is incomplete)

---

## Prerequisites Check

### ✅ What You Need (Do you have these?)

**1. Apple Developer Account**
- Cost: $99/year
- Status: NEED TO VERIFY
- Check: Go to https://developer.apple.com/account
- Sign in with your Apple ID

**2. Apple ID**
- Status: REQUIRED (use personal Apple ID)
- Can be: iCloud account, work email, or any Apple ID
- Two-factor auth: MUST BE ENABLED for App Store Connect

**3. TestFlight Access**
- Cost: FREE (included with Apple Developer)
- Status: Automatic with developer account

**4. App Store Connect Access**
- Cost: FREE (included with Apple Developer)
- Status: Automatic with developer account

---

## App Store Connect Setup Process

### Phase 1: Verify Developer Account Status (15 minutes)

**Step 1.1: Check Developer Account**
```
1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID
3. Look for "Certificates, Identifiers & Profiles" section
4. If you see this → You have an active developer account ✅
5. If not → Need to enroll (costs $99/year)
```

**Step 1.2: Enable Two-Factor Authentication (if not done)**
```
1. Go to https://appleid.apple.com
2. Security section
3. Enable two-factor authentication
4. This is REQUIRED for App Store Connect
```

### Phase 2: Create App in App Store Connect (30 minutes)

**Step 2.1: Create the App**
```
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" (top left)
3. Click "+" button to add new app
4. Select "New App"
```

**Step 2.2: Fill in App Information**
```
Platform: iOS
App Name: "Reading Daily Scripture"
Primary Language: English
Bundle ID: com.readingdaily.scripture
SKU: RDS-001 (unique identifier)
User Type: Full Access
```

**Step 2.3: Complete App Details**
```
Category: Books
Content Rights: "You are the owner/developer"
Age Rating: Required (simple questionnaire)
```

**Step 2.4: Set Pricing & Availability**
```
Free or Paid: Free
Regions: All regions available
Release Type: Manual Release (you approve when to release)
First Release Date: Leave blank (set when ready)
```

**Step 2.5: Initial Setup Complete**
- App now exists in App Store Connect ✅
- Shows as "Draft" or "Prepare for Submission"
- Ready for TestFlight builds

### Phase 3: Connect App ID (5 minutes)

**Step 3.1: Create App ID in Developer**
```
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to create new identifier
3. App IDs → App
4. Explicit App ID
5. Bundle ID: com.readingdaily.scripture
6. Capabilities: Keep defaults
7. Register
```

**Step 3.2: Verify Connection**
```
- App Store Connect automatically links to App ID
- You should see "App ID: com.readingdaily.scripture" in settings
```

---

## Critical Information Required

**Before you can proceed, I need to know:**

### Question 1: Do you have an Apple Developer Account?
- [ ] Yes, I have an active account (active on developer.apple.com)
- [ ] No, I haven't created one yet
- [ ] Unsure

### Question 2: Has an app been created in App Store Connect?
- [ ] Yes, I've already created "Reading Daily Scripture" app
- [ ] No, it hasn't been created yet
- [ ] Unsure

### Question 3: If app exists, what's the current status?
- [ ] In draft
- [ ] Metadata partially filled
- [ ] Ready for TestFlight
- [ ] Not sure

### Question 4: Do you have two-factor authentication enabled on Apple ID?
- [ ] Yes
- [ ] No
- [ ] Not sure

---

## Recommended Setup Path

### If You DON'T Have Developer Account Yet:

**Timeline: 1 hour total**

```
1. Enroll in Apple Developer Program ($99/year)
   - Time: 15 minutes
   - Go to: https://developer.apple.com/enroll/
   - Wait: Usually approved in 24 hours

2. While waiting for approval:
   - Set up two-factor authentication
   - Create Apple ID if needed
   - Review App Store Connect

3. Once approved (24-48 hours):
   - Create App ID
   - Create App in App Store Connect
   - Ready for TestFlight
```

### If You HAVE Developer Account But NO App Yet:

**Timeline: 30 minutes**

```
1. Create App ID (5 minutes)
2. Create App in App Store Connect (20 minutes)
3. Done - Ready for TestFlight
```

### If App Already Exists:

**Timeline: 5 minutes**

```
1. Verify Bundle ID matches: com.readingdaily.scripture
2. Verify App Name: "Reading Daily Scripture"
3. Confirm status in App Store Connect
4. Ready for TestFlight
```

---

## Detailed Step-by-Step Setup (For First-Time)

### Step 1: Enable Two-Factor Authentication (5 minutes)

**On your Apple ID:**
```
1. Go to https://appleid.apple.com
2. Sign in
3. Security section (left sidebar)
4. Two-Factor Authentication
5. Click "Turn On Two-Factor Authentication"
6. Follow prompts (uses your phone)
7. Save recovery codes in safe place
```

**Why:** Required by Apple for App Store Connect access

---

### Step 2: Create App ID in Developer (10 minutes)

**Create Identifier:**
```
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click blue "+" button (top left)
3. Choose "App IDs"
4. Click "Continue"
5. Choose "App"
6. Click "Continue"

Choose Type:
- Select "Explicit App ID" (NOT Wildcard)

Enter Details:
- Description: "Reading Daily Scripture"
- Bundle ID: "com.readingdaily.scripture"

Capabilities:
- Keep all defaults (checkmarks as they are)
- Notable: Push Notifications (for future)
- Notable: In-App Purchase (for subscriptions)

Register:
- Click "Register" button
- App ID now created
```

---

### Step 3: Create App in App Store Connect (20 minutes)

**Create New App:**
```
1. Go to https://appstoreconnect.apple.com
2. Click "Apps" (top left)
3. Click "+" button
4. Select "New App"

Enter Information:
- Platforms: Select "iOS"
- Name: "Reading Daily Scripture"
- Primary Language: "English"
- Bundle ID: Select "com.readingdaily.scripture" (from dropdown)
- SKU: "RDS-001"
- User Type: Select your type

Content Rights:
- "You are the content rights owner"

Submit:
- Click "Create"
- App is now created!
```

**After Creation:**
- App appears in "My Apps"
- Status shows as "Prepare for Submission"
- Can now add TestFlight builds

---

### Step 4: Complete Required Information (Minimal, for now)

**In App Store Connect:**
```
1. Apps → Reading Daily Scripture
2. Go to "App Information"

Required (fill in now):
- Category: Books
- Content Rights Owner: [select appropriate]
- Age Rating: Complete questionnaire (2 minutes)

Skip for later (Phase 8.3):
- App Preview
- Screenshots
- Description
- Keywords
- Support URL
- Privacy Policy
```

---

## Testing Your Setup

### Verify App Store Connect is Ready:

```
Checklist:
☑ Logged into appstoreconnect.apple.com successfully
☑ See "Reading Daily Scripture" in "My Apps"
☑ Bundle ID shows: com.readingdaily.scripture
☑ Status shows: "Prepare for Submission" or "Ready for upload"
☑ Can see "TestFlight" section in sidebar
```

If all checked → **Ready for Phase 8.1 (TestFlight build)**

---

## Common Issues & Fixes

### Issue 1: "Bundle ID not available"
**Cause:** Bundle ID already registered to another account
**Fix:** Use different Bundle ID (e.g., `com.readingdaily.scripture.dev`)
**Prevention:** Bundle IDs are global across all apps

### Issue 2: "App Store Connect says app needs certificate"
**Cause:** Haven't created signing certificate yet
**Fix:** Use EAS to handle this (see Phase 8.0.3)
**Note:** Don't worry about this yet - done in next step

### Issue 3: "Can't access App Store Connect"
**Cause:** Missing two-factor authentication
**Fix:** Enable two-factor auth on Apple ID
**Time:** 5 minutes

### Issue 4: "Developer account not approved yet"
**Cause:** Just enrolled, waiting for Apple's approval
**Fix:** Wait 24-48 hours
**Check:** https://developer.apple.com/account

---

## Timeline Impact on Phase 8

### If No Developer Account Yet:
- Wait 24-48 hours for approval
- Then: 30 minutes to create app
- Impact: 1-2 day delay on Phase 8.0

### If Have Developer Account:
- 30 minutes to create app
- No delay on Phase 8.0

### If App Already Exists:
- 5 minutes to verify
- No delay, ready immediately

---

## Next Phase (After App Created)

Once App Store Connect app is created:

**Phase 8.0.3:** iOS Distribution Certificate & Provisioning
- Create or import signing certificate
- Create provisioning profile
- Give EAS access to certificates

**Phase 8.1:** Build for TestFlight
- Submit build via EAS
- Build automatically uploads to TestFlight
- Internal testing begins

---

## Cost Breakdown

| Item | Cost | Required? | When? |
|------|------|-----------|-------|
| Apple Developer Account | $99/year | Yes | Before app creation |
| App Store Connect | Free | Yes | Included with developer account |
| TestFlight | Free | Yes | Included with developer account |
| Distribution Certificate | Free | Yes | Before first build |

**Total upfront cost:** $99/year (one-time annual renewal)

---

## Decision Required: Your Current Status

**Please tell me:**

1. Do you have an Apple Developer Account? (Active on developer.apple.com)
2. Has an "Reading Daily Scripture" app been created in App Store Connect?
3. Do you have two-factor authentication enabled on your Apple ID?

**Once I know your status, I can provide:**
- Exact next steps (5 min, 30 min, or 1 hour based on your situation)
- Step-by-step walkthrough if needed
- Verification checklist before Phase 8.1

---

**STATUS:** Investigation Complete - Awaiting Your Status Update

