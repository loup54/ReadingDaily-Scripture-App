import React from 'react';
import { useRouter } from 'expo-router';
import { LandingScreen } from '@/screens/auth/LandingScreen';
import { useTrialStore } from '@/stores/useTrialStore';

export default function LandingPage() {
  const router = useRouter();
  const { initializeTrial } = useTrialStore();

  const handleStartTrial = async () => {
    await initializeTrial();
    router.push('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleDemo = async () => {
    // Initialize trial and navigate to app
    await initializeTrial();
    router.replace('/(tabs)/readings');
  };

  return (
    <LandingScreen
      onStartTrial={handleStartTrial}
      onSignIn={handleSignIn}
      onDemo={handleDemo}
    />
  );
}
