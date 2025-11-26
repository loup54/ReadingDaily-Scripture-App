/**
 * Auth Stack Layout
 * Phase 4: Navigation & Flow - Auth Stack Back Navigation
 *
 * Manages authentication flow (landing, sign-in, sign-up, forgot-password, audio-setup)
 * with proper back navigation support and animations.
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        /**
         * Phase 4: Gesture handling for back navigation
         * - iOS: Swipe from left edge to go back
         * - Android: Back gesture or system back button
         */
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {/* Landing screen - entry point */}
      <Stack.Screen name="landing" />

      {/* Sign In screen */}
      <Stack.Screen name="sign-in" />

      {/* Sign Up screen */}
      <Stack.Screen name="sign-up" />

      {/* Forgot Password screen */}
      <Stack.Screen name="forgot-password" />

      {/* Audio Setup screen - final step */}
      <Stack.Screen
        name="audio-setup"
        options={{
          gestureEnabled: false, // Don't allow back from final setup
        }}
      />
    </Stack>
  );
}
