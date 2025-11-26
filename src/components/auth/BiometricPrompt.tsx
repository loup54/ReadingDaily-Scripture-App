/**
 * Biometric Authentication Prompt Component
 *
 * Displays "Welcome back" UI with user email and biometric authentication option
 * Shows loading state during authentication and handles errors gracefully
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Button } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface BiometricPromptProps {
  onAuthenticationSuccess: () => void;
  onAuthenticationFailed: () => void;
  onUsePassword: () => void;
  userEmail: string | null;
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  onAuthenticationSuccess,
  onAuthenticationFailed,
  onUsePassword,
  userEmail,
}) => {
  const {
    isAuthenticating,
    authenticationError,
    authenticationSuccess,
    authenticate,
    biometricTypes,
    reset,
  } = useBiometricAuth();

  // Animation for the card slide-up
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up and fade in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  // Handle successful authentication
  useEffect(() => {
    if (authenticationSuccess) {
      onAuthenticationSuccess();
      reset();
    }
  }, [authenticationSuccess]);

  // Handle authentication errors
  useEffect(() => {
    if (authenticationError && !isAuthenticating) {
      Alert.alert(
        'Authentication Failed',
        authenticationError || 'Please try again or use your password',
        [
          {
            text: 'Try Again',
            onPress: () => {
              reset();
            },
          },
          {
            text: 'Use Password',
            onPress: () => {
              reset();
              onUsePassword();
            },
          },
        ]
      );
    }
  }, [authenticationError, isAuthenticating]);

  const getBiometricLabel = (): string => {
    if (biometricTypes.includes('faceRecognition')) {
      return 'Face ID';
    }
    if (biometricTypes.includes('fingerprint')) {
      return 'Fingerprint';
    }
    if (biometricTypes.includes('iris')) {
      return 'Iris Recognition';
    }
    return 'Biometric';
  };

  const handleBiometricAuth = async () => {
    const success = await authenticate();
    if (!success && !authenticationError) {
      onAuthenticationFailed();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.card}>
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeIcon}>👋</Text>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
        </View>

        {/* Biometric Button */}
        {!isAuthenticating ? (
          <>
            <Button
              title={`Sign in with ${getBiometricLabel()}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleBiometricAuth}
              testID="biometric-auth-button"
              style={styles.biometricButton}
            />

            <View style={styles.divider} />

            {/* Password Fallback */}
            <Button
              title="Sign in with password instead"
              variant="text"
              size="md"
              onPress={onUsePassword}
              testID="use-password-button"
              textStyle={styles.passwordButtonText}
            />
          </>
        ) : (
          <>
            {/* Loading State */}
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={Colors.primary.purple}
                testID="biometric-loading"
              />
              <Text style={styles.loadingText}>Authenticating...</Text>
            </View>
          </>
        )}
      </View>

      {/* Fallback Note */}
      <Text style={styles.fallbackNote}>
        Can't use {getBiometricLabel().toLowerCase()}?{'\n'}
        Tap "Sign in with password instead" above
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    ...Shadows.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  welcomeTitle: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  userEmail: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  biometricButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginVertical: Spacing.lg,
  },
  passwordButtonText: {
    color: Colors.text.secondary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  fallbackNote: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    opacity: 0.7,
  },
});
