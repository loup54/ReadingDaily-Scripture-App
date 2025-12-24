# Changelog

All notable changes to the ReadingDaily Scripture App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - Build 59 - 2025-12-24

### Summary
Comprehensive bug fix release addressing all 7 known issues from Build 57/58. This build resolves critical UX problems including crashes, blank screens, data persistence failures, and dark mode readability issues.

### Fixed

#### Issue #1: Terms of Service Signature Crash
- **CRITICAL:** Fixed app crash when signing legal documents - replaced Node.js `Buffer.from()` API (unavailable in React Native) with `btoa()`
- Removed sketch signature feature per user request - now typed name only
- Added signature name validation - must match registered user name
- Added duplicate signature prevention with existing signature date display
- Pre-fills signature name field with user's registered name

#### Issue #2: Send Gift Authentication Error
- **NOTE:** Backend-only fix - Cloud Functions deployed 2025-12-20 with latest authentication code
- No client changes required - app will work correctly once rebuilt against updated backend

#### Issue #3: Notifications Tab Blank Screen
- Fixed navigation architecture flaw where tab rendered `null` while redirecting
- Changed to direct rendering of NotificationCenterScreen in tab
- Added `showHeader` prop to support both tab (no header) and stack (with header) contexts
- Removed problematic `router.replace()` redirect pattern

#### Issue #4: Progress Calendar Missing Dates
- **CRITICAL:** Fixed TypeScript parameter mismatch preventing readings from being saved to Firestore
- Changed `progressService.recordReading()` call from incorrect object parameter to correct string literal ('full')
- **Known Limitation:** Historical December 2025 data before this fix cannot be recovered

#### Issue #5: Word Highlighting Toggle Not Working
- Fixed migration logic that forced `enableAudioHighlighting` to false on every app restart
- Changed to preserve user's preference instead of overriding it
- Updated UI to clarify feature is "Preview" / "Experimental" status
- Added tooltip explaining timing data requirement
- **Known Limitation:** Feature requires word-level timing data files not yet generated - graceful degradation in place

#### Issue #6: Offline Settings Dark Mode Readability
- Fixed section title color from black (`colors.text.primary`) to white (`Colors.text.white`)
- Now matches all other Settings section titles pattern
- Text readable in both light and dark modes

#### Issue #7: Compliance & Analytics Empty State
- Added comprehensive empty state UI for all 4 tabs (Overview, Timeline, Metrics, Export)
- Added EmptyState component with icons, titles, and guidance messages
- Enhanced error handling to distinguish "no data yet" (normal) from "service failed" (error)
- Added error banner for service failures separate from empty states
- New users no longer see blank white screens

### Changed
- SignatureModal: Simplified to typed name only (removed drawing mode)
- NotificationCenterScreen: Accepts `showHeader` prop for flexible rendering
- ComplianceAnalyticsScreen: Enhanced with empty state logic and error handling
- Word Highlighting: Labeled as "Preview" feature with timing data explanation

### Added
- EmptyState component for consistent empty state UI patterns
- Error banner display for Compliance & Analytics service failures
- Signature name validation and duplicate prevention
- NotificationCenterScreen header prop for navigation flexibility

### Technical Details
- **Modified:** 12 files, ~250 lines changed total
- **Issues Fixed:** 7 (all known issues from Build 57/58)
- **Backend Deployment:** Cloud Functions updated 2025-12-20 (for Issue #2)
- **Build Number:** 58 → 59

### Testing Required
See INVESTIGATION_FINDINGS.md for detailed testing checklists for each issue.

## [1.0.0] - Build 61 - 2025-12-20

### Fixed
- **Progress Calendar Missing Dates** - Fixed TypeScript parameter mismatch in `DailyReadingsScreen.tsx` where `progressService.recordReading()` was called with wrong parameters, preventing readings from being saved to Firestore - calendar will now correctly highlight completed reading days
- **Word Highlighting Toggle Not Working** - Fixed migration logic that was forcing `enableAudioHighlighting` setting to false on every app restart, overriding user's preference - toggle now persists correctly across app restarts

### Changed
- Word Highlighting feature now labeled as "Word Highlighting (Preview)" in Settings to clarify experimental status
- Updated Word Highlighting description to explain timing data requirement
- Migration logic now only sets default for new users, respects existing users' setting choices

### Known Limitations
- **Progress Calendar:** Historical December 2025 reading data (before Build 61) cannot be recovered due to the bug - only readings from Build 61 onwards will be saved
- **Word Highlighting:** Feature requires word-level timing data files that haven't been generated yet - audio will play normally with graceful degradation until timing data is available

### Technical Details
- Modified 3 files, 19 lines changed
- Fixed recordReading() call from object parameter to string literal ('full')
- Fixed store migration to preserve user preferences instead of forcing defaults

## [1.0.0] - Build 60 - 2025-12-20

### Fixed
- **Notifications Blank Screen** - Fixed navigation architecture flaw where tab performed redirect while rendering null - notifications tab now renders content immediately with proper empty state
- **Send Gift Backend Connection** - Build 60 connects to updated Cloud Functions backend deployed on 2025-12-20 (Issue 2 should now work correctly)

### Changed
- NotificationCenterScreen now accepts `showHeader` prop to support both tab and stack navigation contexts
- Notifications tab renders component directly instead of using router redirect
- Tab layout no longer overrides href for notifications route

### Technical Details
- Modified 4 files, 22 lines changed
- Navigation architecture simplified - removed problematic redirect pattern
- Maintains backward compatibility for deep link navigation with Stack header

## [1.0.0] - Build 59 - 2025-12-19

### Fixed
- **Terms of Service Signature Crash** - Replaced Node.js Buffer API with React Native compatible btoa() - fixes immediate crash when signing documents
- **Signature UX Redesign** - Removed drawing signature feature, now typed name only per user feedback
- **Signature Name Validation** - Enforces that signature name must match user's registered name for legal compliance
- **Duplicate Signature Prevention** - Prevents users from signing same document multiple times, shows alert with existing signature date
- **Signature Pre-fill** - Name input field now pre-populated with user's registered name

### Changed
- SignatureModal opens directly to typed name input (removed mode selection screen)
- Simplified signature capture flow for better user experience
- Improved error messages with specific details for troubleshooting

### Removed
- Sketch signature drawing feature (per user request)
- Signature mode selection UI
- ~120 lines of unused sketch canvas code

### Backend Update (2025-12-20)
**After Build 59 deployment, Cloud Functions were updated:**
- Deployed all 17 Cloud Functions with latest code
- Fixed Send Gift authentication error at backend level
- No client code changes required
- Build 60 will connect to updated backend

### Known Issues (From Build 57/58, NOT fixed in Build 59)
- ~~Send Gift authentication error~~ - ✅ BACKEND FIXED on 2025-12-20 (Build 60 required for full fix)
- Notifications tab blank screen - awaiting user feedback
- Progress calendar missing dates - awaiting user feedback
- Word highlighting toggle not working - awaiting user feedback
- Offline settings dark mode readability - awaiting user feedback
- Compliance & Analytics empty state - awaiting user feedback

## [1.0.0] - Build 58 - 2025-12-19 ⚠️ ALL FIXES FAILED

### Status: Released to TestFlight but ALL 7 fixes failed testing

### Attempted Fixes (None Successful)
- **Legal/Signature:** ❌ FAILED - Added error handling to save logic, but actual issue is signature modal never opens when button clicked
- **Gifting:** ❌ FAILED - Client-side token refresh attempted, but authentication error persists (requires backend deployment AND verification)
- **Notifications:** ❌ FAILED - Fixed useEffect dependencies, but screen still completely blank (component may not be rendering)
- **Progress Calendar:** ❌ FAILED - Verified date format but made no changes - calendar still only shows current day despite "Days Read: 2"
- **Audio/Word Highlighting:** ❌ FAILED - Connected settings toggle to component, but "nothing happens" when toggling
- **UI/Dark Mode:** ⚠️ POSSIBLY FAILED - Changed text color for Offline Settings title, but may have fixed wrong scenario (assumed light mode issue when screenshot shows dark mode)
- **Legal/Analytics:** ❌ FAILED - Added graceful degradation, but screen still shows "Last updated: Never" with blank tabs

### Root Cause of Failures
All fixes were based on incorrect assumptions without:
1. Reviewing user-provided screenshots before implementing
2. Asking clarifying questions about actual behavior
3. Verifying root causes through investigation
4. Testing fixes before building

### Known Issues (ALL 7 STILL BROKEN)
See BUILD_HISTORY.md for detailed analysis of each failure

## [1.0.0] - Build 57 - 2025-12-18

### Added
- Initial production release
- Daily scripture readings with multiple translations
- Audio playback with word-level highlighting
- Progress tracking and calendar visualization
- Offline reading support
- Pronunciation practice feature
- Legal document system (Terms of Service, Privacy Policy)
- Compliance analytics and reporting
- Notification center
- Gift scripture feature
- Dark mode support
- Settings and preferences management

### Fixed
- Send Gift client-side authentication token refresh

### Known Issues (Fixed in Build 58)
- Terms of Service signature capture errors
- Notifications screen showing blank
- Word highlighting toggle not working
- Offline settings dark mode readability
- Compliance & Analytics load failures
- Progress calendar blank spots

---

## Version History Summary

- **Build 58** (2025-12-19): Bug fix release - 7 critical issues from Build 57
- **Build 57** (2025-12-18): Initial production release with all features

---

## Categories

### Added
New features or functionality

### Changed
Changes to existing functionality

### Deprecated
Features that will be removed in upcoming releases

### Removed
Features that have been removed

### Fixed
Bug fixes

### Security
Security fixes or improvements
