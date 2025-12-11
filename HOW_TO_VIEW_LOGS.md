# How to View Metro Logs for Debugging

## Method 1: Running with Expo Go (Easiest)

1. **Start Metro bundler:**
   ```bash
   cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
   npm start
   ```

2. **Connect your iPhone:**
   - Make sure your iPhone and Mac are on the same WiFi network
   - Scan the QR code that appears in the terminal with your iPhone camera
   - This will open Expo Go app

3. **View logs:**
   - Logs appear directly in the terminal where you ran `npm start`
   - Look for `[SignIn]` prefixed messages showing authentication flow

## Method 2: Using Development Build (For TestFlight builds)

Since you're testing TestFlight builds, they won't connect to Metro. Instead:

1. **View device logs via Mac Console app:**
   ```bash
   # Open Console app
   open /System/Applications/Utilities/Console.app
   ```

2. **Connect your iPhone via USB**

3. **Filter logs:**
   - Select your iPhone in the left sidebar
   - In the search box, type: `ReadingDaily`
   - Or filter by: `SignIn` to see authentication logs

## Method 3: Using Xcode Console (Most detailed)

1. **Connect iPhone via USB**

2. **Open Xcode:**
   ```bash
   open -a Xcode
   ```

3. **View device logs:**
   - Menu: Window → Devices and Simulators
   - Select your iPhone
   - Click "Open Console" button at bottom
   - Filter by typing `SignIn` in search box

## Method 4: Remote JavaScript Debugging

1. **While app is running, shake your iPhone**
2. **Tap "Debug Remote JS"**
3. **Open browser console** - logs will appear in Chrome/Safari DevTools

## What to Look For

When you try to sign in, you should see logs like:

```
[SignIn] Starting sign-in for: test@readingdaily.dev
[Firebase Auth] Sign in error: ...
[SignIn] Sign-in failed: { error: ..., code: "auth/...", message: "..." }
```

The error code will tell us exactly what's wrong (e.g., `auth/wrong-password`, `auth/user-not-found`).
