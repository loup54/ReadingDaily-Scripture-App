import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTrialStore } from '@/stores/useTrialStore';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuthStore();
  const { initializeTrial } = useTrialStore();

  const handleSignUp = async (fullName: string, email: string, password: string) => {
    try {
      await signUp({ fullName, email, password, acceptTerms: true });
      await initializeTrial();
      console.log('[SignUp] Account created, navigating to audio setup');
      router.replace('/(auth)/audio-setup');
    } catch (error) {
      Alert.alert(
        'Sign Up Failed',
        error instanceof Error ? error.message : 'Failed to create account. Please try again.'
      );
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleNeedHelp = () => {
    Alert.alert(
      'Need Help?',
      'Contact support at support@ourengltd.best for assistance with creating an account.'
    );
  };

  const handleCommonIssues = () => {
    Alert.alert(
      'Common Issues',
      '• Email Already Used: Try signing in instead\n' +
        '• Weak Password: Use at least 8 characters with letters and numbers\n' +
        '• Invalid Email: Check your email format'
    );
  };

  return (
    <SignUpScreen
      onSignUp={handleSignUp}
      onSignIn={handleSignIn}
      onNeedHelp={handleNeedHelp}
      onCommonIssues={handleCommonIssues}
    />
  );
}
