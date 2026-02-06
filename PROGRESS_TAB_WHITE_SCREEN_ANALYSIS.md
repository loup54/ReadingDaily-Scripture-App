# Progress Tab White Screen - Root Cause Analysis

**Issue:** Progress tab shows blank white screen for guest users
**Severity:** Medium (UX issue, not critical for Apple submission)
**Discovered:** January 24, 2026 during Build 86 testing
**Status:** Root cause identified, fix deferred to Build 87+

---

## Root Cause

### The Problem Chain

1. **Guest User Testing:** User testing Build 86 in guest mode (not signed in)
2. **No User ID:** Guest users don't have `user.id` in auth store
3. **Early Return Null:** Progress tab component returns `null` when no userId exists
4. **White Screen:** React Native renders nothing, resulting in blank white screen

### Code Location: `/app/(tabs)/progress.tsx:19-32`

```typescript
export default function ProgressTab() {
  const { user } = useAuthStore();

  // Get user ID from auth store
  const userId = user?.id;

  // If no user logged in, show empty state (shouldn't happen in normal flow)
  if (!userId) {
    return null;  // ❌ THIS CAUSES WHITE SCREEN
  }

  // Render progress dashboard with user ID
  return <ProgressDashboard userId={userId} />;
}
```

**Comment on line 25 is incorrect:** "shouldn't happen in normal flow"
- Guest mode IS a normal flow for this app
- App supports guest users with 7-day trial
- Progress tab should handle guests gracefully

---

## Why This Happens

### Design Assumption Mismatch

The Progress tab was designed with the assumption that users must be signed in to access it. However, the app's authentication model supports:

1. **Guest Mode** - Users can use app without signing in
2. **7-Day Trial** - Guests can access premium features
3. **Optional Sign-In** - Authentication only required for cross-device sync

**Result:** Progress tab is accessible to guests via bottom navigation, but component wasn't designed to handle this case.

---

## Expected vs Actual Behavior

### What Happens Now (Build 86) ❌
1. Guest user taps "Progress" tab
2. Component checks for `userId`
3. No userId found (guest user)
4. Returns `null`
5. **Blank white screen appears**

### What Should Happen ✅
1. Guest user taps "Progress" tab
2. Component checks for `userId`
3. No userId found (guest user)
4. Shows helpful empty state:
   - "Sign in to track your progress"
   - Brief explanation of progress features
   - "Sign In" button
   - "Start Reading" button as alternative
5. **User understands what to do next**

---

## Proper Empty State Handling

The `ProgressDashboard` component already has excellent empty state handling at lines 222-242:

```typescript
// No data state
if (!progressData) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <EmptyState
        icon="stats-chart-outline"
        title="No Progress Yet"
        message="Track your reading progress by completing scripture readings. Your stats will appear here as you read."
        tips={[
          '📖 Go to Daily Readings to start your first reading',
          '✓ Complete readings to earn progress streaks',
          '🏆 Track your consistency and reading time',
          '🎯 Set reading goals in Settings',
        ]}
        actionButton={{
          label: 'Start Your First Reading',
          onPress: () => router.push('/(tabs)/readings'),
        }}
      />
    </SafeAreaView>
  );
}
```

**Problem:** This never renders for guest users because the parent component returns `null` first.

---

## Solutions (3 Options)

### Option 1: Handle Guest in Tab Component (Quick Fix) ⭐

**File:** `/app/(tabs)/progress.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProgressDashboard } from '@/screens/progress/ProgressDashboard';
import { EmptyState } from '@/components/common';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function ProgressTab() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { colors } = useTheme();

  // Get user ID from auth store
  const userId = user?.id;

  // Guest user - show sign-in prompt
  if (!userId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <EmptyState
          icon="stats-chart-outline"
          title="Sign In to Track Progress"
          message="Create an account or sign in to track your reading streaks, earn badges, and view your reading calendar."
          tips={[
            '📊 Track your daily reading streaks',
            '🏆 Earn badges for milestones',
            '📅 View your reading history calendar',
            '🎯 Monitor your reading consistency',
          ]}
          actionButton={{
            label: 'Sign In or Create Account',
            onPress: () => router.push('/(tabs)/settings'),
          }}
          secondaryButton={{
            label: 'Start Reading as Guest',
            onPress: () => router.push('/(tabs)/readings'),
          }}
        />
      </SafeAreaView>
    );
  }

  // Signed-in user - show progress dashboard
  return <ProgressDashboard userId={userId} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

**Pros:**
- Quick to implement
- Clear messaging to users
- Uses existing EmptyState component
- Minimal code changes

**Cons:**
- Requires checking if EmptyState supports secondaryButton prop

---

### Option 2: Guest Progress (Local Storage Only)

Allow guests to see progress based on local reading history (no sync):

```typescript
export default function ProgressTab() {
  const { user } = useAuthStore();
  const userId = user?.id;

  // For guests, show progress from local storage only
  // This would require updating ProgressDashboard to support local-only mode
  return <ProgressDashboard userId={userId} guestMode={!userId} />;
}
```

**Changes needed:**
1. Update `ProgressDashboard` to accept `guestMode` prop
2. Create local progress tracking for guests
3. Show banner: "Sign in to sync your progress across devices"

**Pros:**
- Better UX - guests can see their progress
- Encourages sign-up by showing value
- Maintains progress if they later sign in

**Cons:**
- More complex implementation
- Requires local storage progress system
- Data migration needed when guest signs in

---

### Option 3: Hide Tab for Guests

Remove Progress tab from bottom navigation when not signed in:

**File:** `/app/(tabs)/_layout.tsx`

```typescript
// Conditionally render Progress tab based on auth state
const { user } = useAuthStore();

// Only show Progress tab for signed-in users
<Tabs.Screen
  name="progress"
  options={{
    title: 'Progress',
    tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart" color={color} />,
    href: user ? undefined : null, // Hide from navigation if not signed in
  }}
/>
```

**Pros:**
- Clean - only show what's relevant
- No confusing empty states

**Cons:**
- Navigation changes based on auth state
- Users might not discover progress features
- More complex tab layout logic

---

## Recommendation

**Implement Option 1 (Quick Fix)** for Build 87:

1. **Timeline:** 15 minutes to implement and test
2. **Risk:** Low - simple conditional rendering
3. **Impact:** Significant UX improvement
4. **Blocks submission:** No - not critical for Apple

**Why Option 1:**
- Fastest to implement
- Proper user communication
- Maintains consistent navigation
- Encourages sign-in/sign-up
- Works with existing components

---

## Implementation Plan (Build 87+)

### Step 1: Verify EmptyState Component Props

Check if `EmptyState` component supports `secondaryButton` prop:
```bash
grep -n "secondaryButton" src/components/common/EmptyState.tsx
```

If not supported, either:
- Add `secondaryButton` prop to EmptyState
- Or use two separate TouchableOpacity buttons in custom JSX

### Step 2: Update Progress Tab

Replace lines 19-32 in `/app/(tabs)/progress.tsx` with Option 1 code above.

### Step 3: Test Guest Experience

1. Launch app in guest mode (don't sign in)
2. Tap Progress tab
3. Verify empty state appears with:
   - Icon
   - Title: "Sign In to Track Progress"
   - Message explaining features
   - Two buttons (Sign In + Start Reading)
4. Test both buttons navigate correctly

### Step 4: Test Signed-In Experience

1. Sign in with test account
2. Tap Progress tab
3. Verify ProgressDashboard renders normally
4. Should see streaks, badges, calendar

---

## Impact Assessment

### User Experience Impact
- **Guest Users:** Medium improvement (white screen → helpful message)
- **Signed-In Users:** No change (already works)
- **Overall:** Positive UX enhancement

### Apple Submission Impact
- **Blocking:** No - not required for approval
- **Guideline Compliance:** N/A - cosmetic issue
- **Can Submit Build 86:** Yes, with this known issue

### Development Impact
- **Build 87:** Easy fix (15 minutes)
- **Testing:** 10 minutes
- **Risk:** Very low

---

## Testing Checklist (Post-Fix)

**Guest User Tests:**
- [ ] Launch app without signing in
- [ ] Navigate to Progress tab
- [ ] Verify empty state appears (not white screen)
- [ ] Verify "Sign In" button navigates to Settings
- [ ] Verify "Start Reading" button navigates to Readings
- [ ] Check spacing/alignment looks good
- [ ] Verify icon displays correctly

**Signed-In User Tests:**
- [ ] Sign in with test account
- [ ] Navigate to Progress tab
- [ ] Verify dashboard loads with data
- [ ] Verify streaks display
- [ ] Verify badges section visible
- [ ] Verify calendar shows reading history
- [ ] Pull to refresh works

**Edge Cases:**
- [ ] Sign out while on Progress tab (should show empty state)
- [ ] Sign in while on Progress tab (should load dashboard)

---

## Documentation Updates Needed

After implementing fix in Build 87:

1. **Update BUILD_87_DOCUMENTATION.md:**
   - List this fix in "Changes from Build 86"
   - Mark as UX improvement

2. **Update testing guide:**
   - Remove "Progress tab white screen" from known issues
   - Add test case for guest Progress tab experience

3. **Update BUILD_86_COMPLETE_STATUS.md:**
   - Mark issue as "Fixed in Build 87"

---

## Related Files

**Files to Modify (Build 87):**
- `/app/(tabs)/progress.tsx` - Add guest handling

**Files to Review:**
- `/src/components/common/EmptyState.tsx` - Check secondaryButton support
- `/app/(tabs)/_layout.tsx` - Verify tab navigation config
- `/src/stores/useAuthStore.ts` - Understand user state management

**Files Not Needed:**
- `/src/screens/progress/ProgressDashboard.tsx` - Already handles empty states well

---

## Conclusion

**Root Cause:** Early return `null` for guest users in Progress tab component.

**Impact:** Medium UX issue, not blocking Apple submission.

**Fix:** Add proper empty state for guest users with clear call-to-action.

**Timeline:** Can be addressed in Build 87 after Build 86 submission to Apple.

**Priority:** Medium - should fix soon but doesn't block current submission.

---

**Analysis Version:** 1.0
**Created:** January 24, 2026
**Status:** Identified, Fix Planned for Build 87
