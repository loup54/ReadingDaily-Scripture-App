import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Input } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { validateEmail } from '@utils/validation';
import { useTheme } from '@/hooks/useTheme';

interface ForgotPasswordScreenProps {
  onResetPassword: (email: string) => Promise<void>;
  onBackToSignIn: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onResetPassword,
  onBackToSignIn,
}) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    // Reset errors
    setEmailError('');

    // Validate
    const emailValidation = validateEmail(email);

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    // Call reset password
    setLoading(true);
    try {
      await onResetPassword(email);
      setSuccess(true);
    } catch (error) {
      // Error handling done by parent
    } finally {
      setLoading(false);
    }
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
            {!success ? (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerIcon}>🔐</Text>
                  <Text style={[styles.title, { color: colors.text.white }]}>Forgot Password?</Text>
                  <Text style={[styles.subtitle, { color: colors.text.white }]}>
                    No worries! Enter your email and we'll send you{'\n'}
                    instructions to reset your password.
                  </Text>
                </View>

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

                  <Button
                    title="Send Reset Link"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onPress={handleResetPassword}
                    loading={loading}
                    testID="reset-button"
                  />

                  <View style={styles.divider} />

                  <Button
                    title="← Back to Sign In"
                    variant="text"
                    onPress={onBackToSignIn}
                    testID="back-to-sign-in-link"
                  />
                </View>

                {/* Help Section */}
                <View style={styles.helpSection}>
                  <View style={styles.helpCard}>
                    <Text style={styles.helpIcon}>💡</Text>
                    <Text style={[styles.helpTitle, { color: colors.text.white }]}>Having trouble?</Text>
                    <Text style={[styles.helpText, { color: colors.text.white }]}>
                      Make sure you're using the email address{'\n'}
                      you signed up with.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Success State */}
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✅</Text>
                  <Text style={[styles.successTitle, { color: colors.text.white }]}>Check Your Email!</Text>
                  <Text style={[styles.successText, { color: colors.text.white }]}>
                    We've sent password reset instructions to:
                  </Text>
                  <Text style={[styles.successEmail, { color: colors.text.white }]}>{email}</Text>

                  <View style={styles.successCard}>
                    <Text style={[styles.successCardTitle, { color: colors.text.white }]}>What's next?</Text>
                    <Text style={[styles.successCardText, { color: colors.text.white }]}>
                      1. Check your inbox (and spam folder){'\n'}
                      2. Click the reset link in the email{'\n'}
                      3. Create a new password{'\n'}
                      4. Sign in with your new password
                    </Text>
                  </View>

                  <Button
                    title="Back to Sign In"
                    variant="accent"
                    size="lg"
                    fullWidth
                    onPress={onBackToSignIn}
                    testID="back-button"
                    style={styles.successButton}
                  />

                  <Button
                    title="Didn't receive the email? Resend"
                    variant="text"
                    onPress={handleResetPassword}
                    textStyle={[styles.resendText, { color: colors.text.white }]}
                    testID="resend-link"
                  />
                </View>
              </>
            )}
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  headerIcon: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginVertical: Spacing.md,
  },
  helpSection: {
    marginTop: Spacing.lg,
  },
  helpCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  helpTitle: {
    ...Typography.h3,
    color: Colors.text.white,
    marginBottom: Spacing.xs,
  },
  helpText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  successIcon: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  successTitle: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  successEmail: {
    ...Typography.h3,
    color: Colors.text.white,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  successCardTitle: {
    ...Typography.h3,
    color: Colors.text.white,
    marginBottom: Spacing.sm,
  },
  successCardText: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.9,
    lineHeight: 24,
  },
  successButton: {
    marginBottom: Spacing.md,
  },
  resendText: {
    color: Colors.text.white,
    fontSize: 13,
  },
});