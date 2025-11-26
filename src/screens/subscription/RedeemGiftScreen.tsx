/**
 * Redeem Gift Screen
 * Allows users to redeem gift subscription codes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton } from '@components/common';
import { Colors, Typography, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@stores/useAuthStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  formatGiftCode,
  isValidGiftCodeFormat,
  GiftRedemptionErrors,
} from '@/services/gifting/giftClientUtils';

interface RedeemGiftScreenProps {
  onBack?: () => void;
  onRedeemSuccess?: () => void;
}

export const RedeemGiftScreen: React.FC<RedeemGiftScreenProps> = ({
  onBack,
  onRedeemSuccess,
}) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  // State management
  const [giftCode, setGiftCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [giftDetails, setGiftDetails] = useState<any>(null);

  // Handle code input with auto-formatting
  const handleCodeInput = (input: string) => {
    const upperInput = input.toUpperCase();
    setDisplayCode(upperInput);

    // Auto-format as user types
    const formatted = formatGiftCode(upperInput);
    if (formatted) {
      setGiftCode(formatted);
      setValidated(isValidGiftCodeFormat(formatted));
    } else {
      setGiftCode('');
      setValidated(false);
    }
  };

  // Validate code format on blur
  const handleCodeBlur = () => {
    if (displayCode && !isValidGiftCodeFormat(displayCode)) {
      setValidationMessage('Invalid code format. Use: GIFT-XXXXXXXX-XXXX');
    } else {
      setValidationMessage('');
    }
  };

  // Redeem the gift code
  const handleRedeem = async () => {
    if (!giftCode || !validated) {
      Alert.alert('Invalid Code', GiftRedemptionErrors.INVALID_FORMAT);
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', GiftRedemptionErrors.AUTHENTICATION_REQUIRED);
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const redeemGiftCode = httpsCallable(functions, 'redeemGiftCode');

      const result = await redeemGiftCode({
        giftCode: giftCode,
      });

      const data = result.data as any;

      if (data.success) {
        Alert.alert(
          'Success!',
          data.message,
          [
            {
              text: 'OK',
              onPress: () => {
                setGiftCode('');
                setDisplayCode('');
                setValidated(false);
                setGiftDetails(null);
                onRedeemSuccess?.();
              },
            },
          ]
        );
      } else {
        const errorMessage = data.message || 'Failed to redeem gift code';
        const errorKey = Object.keys(GiftRedemptionErrors).find(
          (key) =>
            GiftRedemptionErrors[key as keyof typeof GiftRedemptionErrors] ===
            errorMessage
        );

        Alert.alert(
          'Redemption Failed',
          errorKey
            ? GiftRedemptionErrors[errorKey as keyof typeof GiftRedemptionErrors]
            : errorMessage
        );
      }
    } catch (error: any) {
      console.error('Redemption error:', error);

      let errorMessage = GiftRedemptionErrors.UNKNOWN_ERROR;

      if (error.code === 'functions/not-found') {
        errorMessage = 'Gift redemption service is temporarily unavailable.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'You do not have permission to redeem gift codes.';
      } else if (error.code === 'functions/unauthenticated') {
        errorMessage = GiftRedemptionErrors.AUTHENTICATION_REQUIRED;
      } else if (error.code === 'functions/unavailable') {
        errorMessage = 'Service is temporarily unavailable. Please try again later.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setGiftCode('');
    setDisplayCode('');
    setValidated(false);
    setValidationMessage('');
    setGiftDetails(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.header}>
          <IconButton icon="chevron-back" onPress={onBack} />
          <Text style={[styles.title, { color: colors.text }]}>Redeem Gift</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* Gift Icon with Gradient Background */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name="gift" size={48} color={Colors.white} />
            </LinearGradient>
          </View>

          {/* Main Title and Description */}
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Unlock Your Gift
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Enter your gift code to unlock premium features and benefits
          </Text>

          {/* Code Input Section with Gradient Border */}
          <LinearGradient
            colors={[colors.primary + '15', colors.secondary + '15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.inputSectionGradient, { borderColor: colors.border }]}
          >
            <View style={[styles.inputSection, { backgroundColor: colors.card }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Gift Code</Text>

              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Ionicons
                  name="card"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderBottomColor: validated ? colors.success : colors.primary,
                    },
                  ]}
                  placeholder="GIFT-XXXXXXXX-XXXX"
                  placeholderTextColor={colors.textTertiary}
                  value={displayCode}
                  onChangeText={handleCodeInput}
                  onBlur={handleCodeBlur}
                  autoCapitalize="characters"
                  editable={!loading}
                  maxLength={20}
                />
                {displayCode && (
                  <IconButton
                    icon={validated ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={validated ? colors.success : colors.error}
                    onPress={handleClear}
                  />
                )}
              </View>

              {validationMessage && (
                <Text style={[styles.validationMessage, { color: colors.error }]}>
                  {validationMessage}
                </Text>
              )}

              {validated && (
                <Text style={[styles.validationMessage, { color: colors.success }]}>
                  ✓ Code format is valid
                </Text>
              )}
            </View>
          </LinearGradient>

          {/* Instructions with Colored Background */}
          <LinearGradient
            colors={[colors.primary + '10', colors.secondary + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.instructionGradient}
          >
            <View style={[styles.instructionsBox, { backgroundColor: 'transparent' }]}>
              <Ionicons
                name="information-circle"
                size={24}
                color={colors.primary}
                style={styles.instructionIcon}
              />
              <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                Gift codes are case-insensitive and valid for 1 year from purchase
              </Text>
            </View>
          </LinearGradient>

          {/* Redeem Button */}
          <Button
            title={loading ? 'Redeeming...' : 'Redeem Gift'}
            onPress={handleRedeem}
            disabled={!validated || loading}
            style={styles.redeemButton}
          />

          {/* Help Section with Cards */}
          <View style={styles.helpSection}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              Need assistance?
            </Text>

            <View style={styles.helpItems}>
              <HelpItem
                icon="mail"
                title="Check your email"
                description="Gift codes are sent via email"
                colors={colors}
              />
              <HelpItem
                icon="search"
                title="Verify code details"
                description="Make sure the code isn't expired or already redeemed"
                colors={colors}
              />
              <HelpItem
                icon="help-circle"
                title="Contact support"
                description="Email us at help@readingdaily.app"
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[styles.loadingText, { color: colors.text, marginTop: Spacing.md }]}
            >
              Redeeming your gift...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Help item component
 */
interface HelpItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
}

const HelpItem: React.FC<HelpItemProps> = ({ icon, title, description, colors }) => (
  <View style={[styles.helpItemContainer, { backgroundColor: colors.card }]}>
    <Ionicons name={icon} size={20} color={colors.primary} style={styles.helpIcon} />
    <View style={styles.helpContent}>
      <Text style={[styles.helpItemTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.helpItemDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  mainTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  inputSectionGradient: {
    borderRadius: BorderRadius.lg,
    padding: 1,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  inputSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    letterSpacing: 2,
    padding: 0,
  },
  validationMessage: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  instructionGradient: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  instructionsBox: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  instructionIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  instructionsText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  redeemButton: {
    marginBottom: Spacing.xl,
  },
  helpSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  helpTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  helpItems: {
    gap: Spacing.md,
  },
  helpItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  helpIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  helpContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  helpItemDescription: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  loadingText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
