import React from 'react';
import { Alert, Linking } from 'react-native';
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
      console.log('[SignIn] Starting sign-in for:', email);
      await login({ email, password });
      console.log('[SignIn] Login successful, initializing trial...');
      await initializeTrial();
      console.log('[SignIn] Trial initialized, navigating to readings...');
      router.replace('/(tabs)/readings');
    } catch (error: any) {
      console.error('[SignIn] Sign-in failed:', {
        error,
        code: error?.code,
        message: error?.message,
        fullError: JSON.stringify(error, null, 2)
      });

      // Show detailed error message
      let errorMessage = 'Invalid credentials. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      }
      if (error?.code) {
        errorMessage += `\n\nError code: ${error.code}`;
      }

      Alert.alert('Sign In Failed', errorMessage);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleStartTrial = () => {
    router.push('/(auth)/sign-up');
  };

  const handleNeedHelp = () => {
    const email = 'ourenglish2019@gmail.com';
    const subject = 'Help with Sign In';
    const body = 'I need help signing into the Reading Daily Scripture App.%0A%0AError or Issue:%0A';
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto).catch(() => {
      Alert.alert(
        'Contact Support',
        `For help signing in, please email us at:\n${email}\n\nSubject: Help with Sign In`,
        [
          {
            text: 'Copy Email',
            onPress: () => {
              // Copy email to clipboard (you may need to use a library for this)
              Alert.alert('Email Copied', `Support email copied: ${email}`);
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    });
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
