import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@components/common';
import { BiometricPrompt } from '@components/auth/BiometricPrompt';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { validateEmail, validatePassword } from '@utils/validation';
import { useTheme } from '@/hooks/useTheme';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface SignInScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
  onStartTrial: () => void;
  onNeedHelp: () => void;
  onCommonIssues: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignIn,
  onForgotPassword,
  onStartTrial,
  onNeedHelp,
  onCommonIssues,
}) => {
  const { colors } = useTheme();
  const { hasSavedCredentials, savedUserEmail, isAvailable: isBiometricAvailable } = useBiometricAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  // Show biometric prompt if available and credentials are saved
  useEffect(() => {
    if (isBiometricAvailable && hasSavedCredentials && savedUserEmail) {
      setShowBiometricPrompt(true);
    }
  }, [isBiometricAvailable, hasSavedCredentials, savedUserEmail]);

  const handleSignIn = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      return;
    }

    // Call sign in
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (error) {
      // Error handling done by parent
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSuccess = () => {
    // Biometric authentication succeeded - parent will handle the sign-in
    setShowBiometricPrompt(false);
  };

  const handleBiometricFailed = () => {
    // User wants to use password instead
    setShowBiometricPrompt(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={colors.primary.gradient} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.text.white }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.text.white }]}>Sign in to continue your learning</Text>

            {/* Show Biometric Prompt if Available */}
            {showBiometricPrompt && isBiometricAvailable && hasSavedCredentials ? (
              <BiometricPrompt
                userEmail={savedUserEmail}
                onAuthenticationSuccess={handleBiometricSuccess}
                onAuthenticationFailed={handleBiometricFailed}
                onUsePassword={() => {
                  setShowBiometricPrompt(false);
                }}
              />
            ) : (
              <>
                {/* Form Card */}
                <View style={[styles.formCard, { backgroundColor: colors.background.card }]}>
                  <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail-outline"
                    error={emailError}
                    testID="email-input"
                  />

                  <Input
                    placeholder="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                    }}
                    isPassword
                    icon="lock-closed-outline"
                    error={passwordError}
                    testID="password-input"
                  />

                  <Button
                    title="Sign In"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleSignIn}
                    loading={loading}
                    testID="sign-in-button"
                  />

                  <Button
                    title="Forgot Password?"
                    variant="text"
                    onPress={onForgotPassword}
                    testID="forgot-password-link"
                  />
                </View>

                {/* Alternative Actions */}
                <View style={styles.alternativeContainer}>
                  <Text style={[styles.alternativeText, { color: colors.text.white }]}>Don't have an account?</Text>
                  <Button
                    title="🎉 Start Free Trial"
                    variant="accent"
                    size="md"
                    fullWidth
                    onPress={onStartTrial}
                    style={styles.trialButton}
                    testID="start-trial-button"
                  />

                  <View style={styles.helpContainer}>
                    <Text style={styles.helpIcon}>✨</Text>
                    <Text style={[styles.helpText, { color: colors.text.white }]}>New to Sacred Scripture?</Text>
                    <Text style={[styles.helpSubtext, { color: colors.text.white }]}>
                      Get 7 days of free practice time
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Help Links */}
            <View style={styles.footerLinks}>
              <Button
                title="💡 Need Help Signing in?"
                variant="text"
                onPress={onNeedHelp}
                textStyle={[styles.footerLinkText, { color: colors.text.white }]}
                testID="need-help-link"
              />

              <Button
                title="⚡ Common Issues & Fixes"
                variant="text"
                onPress={onCommonIssues}
                textStyle={[styles.footerLinkText, { color: colors.text.white }]}
                testID="common-issues-link"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xl,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xl,
  },
  formCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  alternativeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  alternativeText: {
    ...Typography.body,
    color: Colors.text.white,
    marginBottom: Spacing.md,
  },
  trialButton: {
    marginBottom: Spacing.md,
  },
  helpContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  helpIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  helpText: {
    ...Typography.label,
    color: Colors.text.white,
    marginBottom: Spacing.xs,
  },
  helpSubtext: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.8,
  },
  footerLinks: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerLinkText: {
    color: Colors.text.white,
    fontSize: 13,
  },
});