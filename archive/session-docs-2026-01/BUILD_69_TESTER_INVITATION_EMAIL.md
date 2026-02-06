# TestFlight Invitation Email Templates

## Template 1: Quick Test Request (Casual)

**Subject:** Test ReadingDaily Build 69 - Just 15 Minutes 🙏

Hi [Tester Name],

I've just released **Build 69** of the ReadingDaily Scripture App to TestFlight and would love your feedback!

**What's new:**
✅ Fixed notifications tab freezing issue
✅ Enhanced loading screen with rotating scripture quotes
✅ Improved dark mode readability
✅ Various UI/UX improvements

**Time needed:** Just 15 minutes for a quick test

**How to test:**
1. Check your email for TestFlight invitation
2. Tap "View in TestFlight" → Accept → Install
3. Follow the quick guide I've attached
4. Report any issues via TestFlight feedback

**Download the quick guide:**
[Attach: BUILD_69_TESTER_QUICK_GUIDE.md]

**Questions?** Just reply to this email.

Thanks for helping make ReadingDaily better! 🙏

[Your Name]

---

## Template 2: Detailed Test Request (Formal)

**Subject:** Beta Testing Request - ReadingDaily Scripture App Build 69

Dear [Tester Name],

You're invited to beta test **Build 69 (v1.1.1)** of the ReadingDaily Scripture App via TestFlight.

**Release Information:**
- **Build Number:** 69
- **Version:** 1.1.1
- **Release Date:** December 28, 2025
- **Testing Period:** December 28 - January 2 (5 days)
- **Platform:** iOS 15.1+

**What's Included in Build 69:**

**Critical Fix:**
- Resolved notifications tab lockup issue that affected Build 68

**UI/UX Improvements:**
1. Enhanced loading screen with 10 rotating scripture quotes
2. Fixed dark mode number colors in Offline Settings
3. Corrected notifications tab help text
4. Improved initialization screen messaging

**Testing Instructions:**

**Quick Test (15 minutes):**
- Follow the attached Quick Guide for basic verification
- Recommended for casual testers

**Full Test (1-2 hours):**
- Follow the attached Testing Plan for comprehensive testing
- Recommended if you have time to test thoroughly

**How to Get Started:**

1. **Install TestFlight** (if not already installed)
   - Download from App Store: https://apps.apple.com/app/testflight/id899247664

2. **Accept Invitation**
   - Check your email for TestFlight invitation
   - Tap "View in TestFlight" or "Start Testing"
   - Tap "Accept" then "Install"

3. **Test the App**
   - Follow one of the attached testing guides
   - Focus on the areas you're most comfortable with

4. **Report Issues**
   - In TestFlight: Shake device → "Send Feedback"
   - Or reply to this email with details
   - Include screenshots when possible

**What to Test (Priority):**
- ⚠️ **Critical:** Notifications tab stability (does it freeze?)
- 🎨 **High:** Loading screen (see rotating quotes?)
- 🌙 **High:** Dark mode readability (numbers white in Settings?)
- ✅ **Medium:** General functionality (everything still works?)

**Bug Reporting:**
- **P0 (Blocking):** App crashes, tab freezes, data loss → Report immediately
- **P1 (High):** Feature broken, readability issues → Report within 24 hours
- **P2 (Medium):** UI glitches, minor issues → Report during testing period

**Testing Documents Attached:**
1. `BUILD_69_TESTER_QUICK_GUIDE.md` - 15-minute quick test
2. `BUILD_69_TESTING_PLAN.md` - Comprehensive testing plan (optional)

**Questions or Issues?**
Please don't hesitate to reach out:
- Email: [Your email]
- Phone: [Your phone] (for urgent issues)

**Success Criteria:**
Build 69 will be approved for App Store release if:
- Zero app crashes (P0 bugs)
- Notifications tab is stable
- All new features work as designed
- No major regressions in existing features

**Thank you for your time and feedback!** Your testing helps ensure a great experience for all ReadingDaily users.

Blessings,
[Your Name]
ReadingDaily Development Team

---

## Template 3: Internal Team (Technical)

**Subject:** Build 69 Ready for Testing - Critical Fix + UI/UX Improvements

Team,

Build 69 is now available on TestFlight for testing.

**Build Info:**
- Build: 69
- Version: 1.1.1
- Branch: feature/dark-mode
- Commit: [latest commit hash]
- Deployed: December 28, 2025

**Changes:**

**P0 Fix:**
- Fixed notifications tab infinite loop (state management refactor in NotificationCenterScreen.tsx)

**Features:**
- Rotating wisdom quotes on loading screen (wisdomQuotes.ts, LoadingScreen.tsx)
- 5-second minimum display for initialization (app/index.tsx)
- Dark mode number color improvements (OfflineSettingsSection.tsx)
- Corrected Settings reference text (NotificationCenterScreen.tsx, EmptyState.tsx)

**Files Modified:** 8 files, ~150 lines changed
**Dependencies:** None added
**Breaking Changes:** None

**Testing Focus:**
1. Notifications tab stability (regression test)
2. Quote rotation on loading screen (new feature)
3. Dark mode color contrast (accessibility)
4. No regressions in offline features

**Test Environments:**
- iOS 15.1+ (deployment target)
- Recommended: iOS 16.0+ on physical device
- Test both Light and Dark modes

**Acceptance Criteria:**
- [ ] Zero P0 bugs
- [ ] Notifications tab stable (no freezing)
- [ ] Loading screen quotes visible and rotating
- [ ] Dark mode numbers readable (white on dark)
- [ ] All offline features functional

**Timeline:**
- Testing: Dec 28 - Jan 2 (5 days)
- Go/No-Go Decision: Jan 3
- App Store Submission: Jan 4 (if approved)

**Documents:**
- Testing Plan: `BUILD_69_TESTING_PLAN.md`
- Session Report: `SESSION_REPORT_UI_UX_FIXES_2025-12-28.md`
- Changelog: See `CHANGELOG.md` Build 69 section

**TestFlight Link:**
Check email for invitation or access via:
https://appstoreconnect.apple.com/apps/6753561999/testflight/ios

**Report Bugs Via:**
- JIRA: [Project link] (if applicable)
- GitHub Issues: [Repo link] (if applicable)
- Email: [Team email]
- TestFlight feedback

Let me know if you have questions or encounter blockers.

Thanks,
[Your Name]

---

## Template 4: Follow-Up Reminder

**Subject:** Reminder: Build 69 Testing - 2 Days Left

Hi [Tester Name],

Just a friendly reminder that we have **2 days left** to complete testing for Build 69 before our go/no-go decision on January 3rd.

**Current Status:**
- Testers who've completed: [X/Y]
- Bugs reported: [P0: X, P1: Y, P2: Z]
- Your status: [Not started / In progress / Completed]

**If you haven't started yet:**
- The quick test takes just 15 minutes
- Download the guide: [Attach BUILD_69_TESTER_QUICK_GUIDE.md]
- Focus on the critical areas (notifications tab, loading screen, dark mode)

**If you're in progress:**
- Please submit your feedback by [Date]
- Even partial testing is helpful!

**If you've completed:**
- Thank you! 🙏 Your feedback has been invaluable

**Questions?** Reply to this email.

Thanks again for your help!

[Your Name]

---

## Template 5: Thank You After Testing

**Subject:** Thank You for Testing Build 69!

Hi [Tester Name],

Thank you for taking the time to test **Build 69** of ReadingDaily Scripture App!

**Your Feedback:**
- [Summary of issues they reported]
- [Status of those issues - fixed/will fix/won't fix]

**Results:**
- Total testers: [X]
- Bugs found: [P0: X, P1: Y, P2: Z]
- Decision: [Approved for App Store / Building Build 70 with fixes]

**Next Steps:**
- [If approved] Build 69 will be submitted to App Store on [Date]
- [If not approved] Build 70 will be released for testing on [Date]
- You'll receive an update when the app is live in the App Store

**Your testing helped:**
- Ensure the notifications tab is stable
- Verify the loading screen enhancement works beautifully
- Confirm dark mode readability
- Catch [X specific bugs]

**Stay tuned for future builds!** I'll reach out when we have new features to test.

Blessings,
[Your Name]

P.S. If you haven't already, please leave a review on the App Store when the app goes live! It really helps.

---

## Quick Copy-Paste Snippets

### TestFlight Installation Instructions
```
1. Install TestFlight app from App Store (if not already installed)
2. Check your email for the invitation
3. Tap "View in TestFlight" in the email
4. Tap "Accept" then "Install"
5. Open the app and start testing!
```

### Bug Report Format
```
**Bug Title:** [Brief description]
**Severity:** P0 / P1 / P2 / P3
**Steps to Reproduce:**
1.
2.
3.

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Device:** [iPhone model, iOS version]
**Screenshot:** [Attach if available]
```

### What to Test - Quick List
```
✓ Notifications tab - does it freeze?
✓ Loading screen - see rotating quotes?
✓ Dark mode - numbers readable in Settings?
✓ Readings tab - loads correctly?
✓ Offline features - download/clear work?
```

---

## Notes on Sending Invitations

### Timing
- Send invitations as soon as build is available on TestFlight
- Apple usually processes builds within 5-10 minutes
- You'll get an email when build is ready for testing

### Who to Invite
- **Internal testers:** No limit, immediate access
- **External testers:** Up to 10,000, requires Apple review (24-48 hours)

### Follow-Up Schedule
- **Day 1:** Send invitation
- **Day 2:** Send reminder to those who haven't started
- **Day 4:** Send final reminder (2 days left)
- **Day 6:** Send thank you + results summary

### Best Practices
- Keep emails concise (testers are busy)
- Attach quick guide for easy access
- Set clear expectations (time needed, what to focus on)
- Thank testers for their time
- Follow up with results
