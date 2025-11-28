import React from 'react';
import { Alert, Linking } from 'react-native';
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
    const email = 'ourenglish2019@gmail.com';
    const subject = 'Help with Sign Up';
    const body = 'I need help creating an account for the Reading Daily Scripture App.%0A%0AError or Issue:%0A';
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailto).catch(() => {
      Alert.alert(
        'Contact Support',
        `For help creating an account, please email us at:\n${email}\n\nSubject: Help with Sign Up`,
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
