/**
 * Authentication Navigator
 * Handles navigation between auth screens and main app
 * Recognizes returning customers and provides quick sign-in options
 */

import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import {
  LandingScreen,
  SignInScreen,
  SignUpScreen,
  ForgotPasswordScreen,
} from '@/screens/auth';
import { ProgressDashboard } from '@/screens/progress/ProgressDashboard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

type AuthScreen = 'landing' | 'signIn' | 'signUp' | 'forgotPassword';

export const AuthNavigator: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('landing');
  const { login, signUp, resetPassword } = useAuthStore();
  const authState = useAuthStore((state) => state.state);
  const user = useAuthStore((state) => state.user);
  const { hasSavedCredentials, savedUserEmail } = useBiometricAuth();

  // Recognize returning customers - show sign in screen if returning user
  useEffect(() => {
    if (hasSavedCredentials && savedUserEmail) {
      console.log('[AuthNavigator] Returning customer detected:', savedUserEmail);
      setCurrentScreen('signIn');
    }
  }, [hasSavedCredentials, savedUserEmail]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // Navigation to main app handled by app-level navigator
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials and try again');
    }
  };

  const handleSignUp = async (fullName: string, email: string, password: string) => {
    try {
      await signUp({ fullName, email, password, acceptTerms: true });
      // Navigation to main app handled by app-level navigator
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Please try again');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email',
        [{ text: 'OK', onPress: () => setCurrentScreen('signIn') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    }
  };

  const handleDemo = () => {
    Alert.alert(
      'Demo Mode',
      '10 minutes of free practice time!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Demo', onPress: () => console.log('Demo started') },
      ]
    );
  };

  const handleNeedHelp = () => {
    Alert.alert(
      'Need Help?',
      'Common issues:\n\n• Make sure you\'re using the correct email\n• Check your password (case-sensitive)\n• Try resetting your password\n• Contact support if issues persist'
    );
  };

  const handleCommonIssues = () => {
    Alert.alert(
      'Common Issues & Fixes',
      '1. Forgot Password\n   → Use the "Forgot Password" link\n\n2. Account Locked\n   → Wait 15 minutes or contact support\n\n3. Email Not Verified\n   → Check your inbox for verification email\n\n4. App Not Loading\n   → Try force closing and reopening the app'
    );
  };

  // If user is authenticated, show main app
  if (authState === 'authenticated' && user) {
    return <ProgressDashboard userId={user.id} />;
  }

  // Render current auth screen
  switch (currentScreen) {
    case 'landing':
      return (
        <LandingScreen
          onStartTrial={() => setCurrentScreen('signUp')}
          onSignIn={() => setCurrentScreen('signIn')}
          onDemo={handleDemo}
        />
      );

    case 'signIn':
      return (
        <SignInScreen
          onSignIn={handleSignIn}
          onForgotPassword={() => setCurrentScreen('forgotPassword')}
          onStartTrial={() => setCurrentScreen('signUp')}
          onNeedHelp={handleNeedHelp}
          onCommonIssues={handleCommonIssues}
        />
      );

    case 'signUp':
      return (
        <SignUpScreen
          onSignUp={handleSignUp}
          onSignIn={() => setCurrentScreen('signIn')}
          onNeedHelp={handleNeedHelp}
          onCommonIssues={handleCommonIssues}
        />
      );

    case 'forgotPassword':
      return (
        <ForgotPasswordScreen
          onResetPassword={handleResetPassword}
          onBackToSignIn={() => setCurrentScreen('signIn')}
        />
      );

    default:
      return (
        <LandingScreen
          onStartTrial={() => setCurrentScreen('signUp')}
          onSignIn={() => setCurrentScreen('signIn')}
          onDemo={handleDemo}
        />
      );
  }
};