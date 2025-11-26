import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuthStore();

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        error instanceof Error ? error.message : 'Failed to send reset email. Please try again.'
      );
    }
  };

  const handleBackToSignIn = () => {
    router.back();
  };

  return (
    <ForgotPasswordScreen
      onResetPassword={handleResetPassword}
      onBackToSignIn={handleBackToSignIn}
    />
  );
}
