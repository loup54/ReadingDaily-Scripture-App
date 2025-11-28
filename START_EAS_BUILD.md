# START EAS BUILD - Quick Guide
**Ready to build?** This is the fastest way to get started.

---

## TL;DR - 30 Second Version

```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
eas build --platform ios --profile preview
# Answer: yes, pagelou@icloud.com, Lou Page, Yes
# Wait 20-30 minutes
# ✅ Done! Build uploaded to TestFlight
```

---

## What You Need

✅ Terminal open
✅ Apple Developer account (pagelou@icloud.com) - ready
✅ Expo account authenticated - ready
✅ ~30 minutes time

---

## Step-by-Step

### 1. Open Terminal
```bash
cd /Users/louispage/ReadingDaily-Scripture-App/ReadingDaily-Scripture-App
```

### 2. Start Build
```bash
eas build --platform ios --profile preview
```

### 3. When Prompted
```
Do you want to log in to your Apple account? › yes
Apple ID: pagelou@icloud.com (already filled)
Team: Lou Page (A696BUAT9R)
Reuse provisioning profile? › Yes
```

### 4. Wait
Build runs for 15-30 minutes. You can:
- Watch terminal for progress
- Visit dashboard: https://expo.dev/accounts/loup1954/projects/readingdaily-scripture-app/builds
- Grab coffee ☕

### 5. Look For Success Message
```
✔ Build completed successfully!
Build ID: a1b2c3d4e5f6...
```

---

## What Happens After

✅ Build automatically uploaded to TestFlight
✅ Visible in App Store Connect under TestFlight
✅ Ready for device testing
✅ Phase 8.1 nearly complete

---

## If Something Goes Wrong

**Build fails with error?**
→ Check: PHASE_8.1_EAS_BUILD_GUIDE.md (Troubleshooting section)

**Apple auth fails?**
→ Check: It should be pre-authenticated

**Build takes too long?**
→ Normal - EAS builds can take 15-30 min, be patient

**Build succeeds but doesn't appear in TestFlight?**
→ Wait 5-10 minutes, refresh App Store Connect

---

## Next: Device Testing (30 min)

After build completes:

1. Open App Store Connect
2. TestFlight → Internal Testing
3. Install app on your iPhone via TestFlight
4. Test basic features
5. Verify no crashes

---

## Need Help?

Comprehensive guides available:

- **Full Guide:** PHASE_8.1_EAS_BUILD_GUIDE.md (detailed steps)
- **Troubleshooting:** PHASE_8.1_EAS_BUILD_GUIDE.md → Troubleshooting
- **Status Report:** PHASE_8.1_STATUS_REPORT.md (detailed checklist)
- **Executive Summary:** PHASE_8.1_COMPLETE_SUMMARY.md (overview)

---

## That's It!

Ready? Run:
```bash
eas build --platform ios --profile preview
```

Good luck! 🚀

