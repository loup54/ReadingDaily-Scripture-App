/**
 * Onboarding Route
 *
 * First-time user experience introducing key app features.
 * Shown after authentication but before entering the main app.
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingCarouselScreen } from '@/screens/onboarding/OnboardingCarouselScreen';

export default function OnboardingRoute() {
  const router = useRouter();

  const handleComplete = () => {
    console.log('[Onboarding] User completed onboarding - redirecting to main app');
    router.replace('/(tabs)/readings');
  };

  return <OnboardingCarouselScreen onComplete={handleComplete} />;
}
