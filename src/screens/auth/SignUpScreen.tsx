import React, { useState } from 'react';
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
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { validateEmail, validatePassword, validateFullName } from '@utils/validation';
import { useTheme } from '@/hooks/useTheme';

interface SignUpScreenProps {
  onSignUp: (fullName: string, email: string, password: string) => Promise<void>;
  onSignIn: () => void;
  onNeedHelp: () => void;
  onCommonIssues: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUp,
  onSignIn,
  onNeedHelp,
  onCommonIssues,
}) => {
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Reset errors
    setFullNameError('');
    setEmailError('');
    setPasswordError('');

    // Validate
    const nameValidation = validateFullName(fullName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    let hasError = false;

    if (!nameValidation.isValid) {
      setFullNameError(nameValidation.error || '');
      hasError = true;
    }

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      hasError = true;
    }

    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      hasError = true;
    }

    if (hasError) return;

    // Call sign up
    setLoading(true);
    try {
      await onSignUp(fullName, email, password);
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>🎉</Text>
              <Text style={[styles.title, { color: colors.text.white }]}>Create Your</Text>
              <Text style={[styles.title, { color: colors.text.white }]}>Account</Text>
              <Text style={[styles.subtitle, { color: colors.text.white }]}>
                Start your English learning journey with 10 free{'\n'}
                minutes of practice time
              </Text>
            </View>

            {/* Form Card */}
            <View style={[styles.formCard, { backgroundColor: colors.background.card }]}>
              <Input
                placeholder="Full Name"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setFullNameError('');
                }}
                autoCapitalize="words"
                icon="person-outline"
                error={fullNameError}
                testID="full-name-input"
              />

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
                title="Start Free Trial"
                variant="accent"
                size="lg"
                fullWidth
                onPress={handleSignUp}
                loading={loading}
                testID="sign-up-button"
                style={styles.submitButton}
              />

              <Text style={styles.createAccountText}>Create Account</Text>

              <View style={styles.divider} />

              <Button
                title="Already have an account? Sign in"
                variant="text"
                onPress={onSignIn}
                testID="sign-in-link"
              />
            </View>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <Button
                title="💡 Need Help Signing in?"
                variant="text"
                onPress={onNeedHelp}
                textStyle={styles.helpLinkText}
                testID="need-help-link"
              />

              <Button
                title="⚡ Common Issues & Fixes"
                variant="text"
                onPress={onCommonIssues}
                textStyle={styles.helpLinkText}
                testID="common-issues-link"
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.footerBadge}>
                <Text style={styles.footerBadgeText}>✨ Free Trial Included!</Text>
              </View>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginBottom: Spacing.xs,
  },
  createAccountText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.ui.divider,
    marginVertical: Spacing.md,
  },
  helpSection: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  helpLinkText: {
    color: Colors.text.white,
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerBadge: {
    backgroundColor: Colors.accent.green,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  footerBadgeText: {
    ...Typography.label,
    color: Colors.text.white,
    fontWeight: '600',
  },
});