import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTrialStore } from '@/stores/useTrialStore';

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { initializeTrial } = useTrialStore();

  const handleSignIn = async (email: string, password: string) => {
    try {
      await login({ email, password });
      await initializeTrial();
      router.replace('/(tabs)/readings');
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
      );
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleStartTrial = () => {
    router.push('/(auth)/sign-up');
  };

  const handleNeedHelp = () => {
    Alert.alert(
      'Need Help?',
      'Contact support at support@ourengltd.best for assistance with signing in.'
    );
  };

  const handleCommonIssues = () => {
    Alert.alert(
      'Common Issues',
      '• Forgot Password: Use the "Forgot Password?" link\n' +
        '• Account Not Found: Try creating a new account\n' +
        '• Email Not Verified: Check your email for verification link'
    );
  };

  return (
    <SignInScreen
      onSignIn={handleSignIn}
      onForgotPassword={handleForgotPassword}
      onStartTrial={handleStartTrial}
      onNeedHelp={handleNeedHelp}
      onCommonIssues={handleCommonIssues}
    />
  );
}
