import React from 'react';
import { useRouter } from 'expo-router';
import { AudioTranslationSetupScreen } from '@/screens/onboarding/AudioTranslationSetupScreen';

export default function AudioSetupPage() {
  const router = useRouter();

  const handleContinue = () => {
    console.log('[AudioSetup] Navigating to main app');
    router.replace('/(tabs)/readings');
  };

  const handleSkip = () => {
    console.log('[AudioSetup] Skipping setup and navigating to main app');
    router.replace('/(tabs)/readings');
  };

  return (
    <AudioTranslationSetupScreen
      onContinue={handleContinue}
      onSkip={handleSkip}
    />
  );
}
