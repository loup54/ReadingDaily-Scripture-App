/**
 * Send Gift Screen
 * Allows users to purchase and send gift subscriptions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton } from '@components/common';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@stores/useAuthStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { SUBSCRIPTION_TIERS } from '@constants/subscriptions';

interface SendGiftScreenProps {
  onBack?: () => void;
  onGiftSent?: (giftCode: string) => void;
}

type SubscriptionTier = 'basic' | 'premium' | 'lifetime';

export const SendGiftScreen: React.FC<SendGiftScreenProps> = ({
  onBack,
  onGiftSent,
}) => {
  const { colors } = useTheme();
  const { user } = useAuthStore();

  // Form state
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('basic');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'confirm'>('select');

  const selectedTierData = SUBSCRIPTION_TIERS[selectedTier];

  const handleSelectTier = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setStep('details');
  };

  const handleValidateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!handleValidateEmail()) return;
    setStep('confirm');
  };

  const handleSendGift = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to send a gift');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const sendGift = httpsCallable(functions, 'sendGift');

      const result = await sendGift({
        subscriptionTier: selectedTier,
        recipientEmail,
        expiresInDays: 365,
        message: personalMessage,
      });

      const data = result.data as any;

      if (data.success) {
        Alert.alert(
          'Gift Sent Successfully!',
          `A gift code has been sent to ${recipientEmail}. They can redeem it to activate their subscription.`,
          [
            {
              text: 'Done',
              onPress: () => {
                setRecipientEmail('');
                setPersonalMessage('');
                setStep('select');
                onGiftSent?.(data.giftCode);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to send gift');
      }
    } catch (error: any) {
      console.error('Gift sending error:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while sending the gift'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="chevron-back" onPress={onBack} />
          <Text style={[styles.title, { color: colors.text }]}>Send a Gift</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {['Select', 'Details', 'Confirm'].map((stepName, idx) => (
            <View key={stepName} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      step === ['select', 'details', 'confirm'][idx]
                        ? colors.primary
                        : colors.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color:
                        step === ['select', 'details', 'confirm'][idx]
                          ? Colors.white
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {idx + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color:
                      step === ['select', 'details', 'confirm'][idx]
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                {stepName}
              </Text>
            </View>
          ))}
        </View>

        {/* Content based on step */}
        {step === 'select' && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Subscription Tier
            </Text>

            {Object.entries(SUBSCRIPTION_TIERS).map(([tier, tierData]) => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      selectedTier === tier ? colors.primary : colors.border,
                    borderWidth: selectedTier === tier ? 2 : 1,
                  },
                ]}
                onPress={() => handleSelectTier(tier as SubscriptionTier)}
              >
                <View style={styles.tierHeader}>
                  <Text style={[styles.tierName, { color: colors.text }]}>
                    {tierData.name}
                  </Text>
                  {tierData.badge && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.badgeText}>{tierData.badge}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.tierPrice, { color: colors.primary }]}>
                  ${tierData.price}
                  {tierData.duration && <Text>{tierData.duration === 1 ? '/month' : '/year'}</Text>}
                </Text>

                <Text
                  style={[
                    styles.tierDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {tierData.description}
                </Text>

                <View style={styles.features}>
                  {tierData.features.map((feature, idx) => (
                    <View key={idx} style={styles.feature}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primary}
                        style={styles.featureIcon}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 'details' && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Gift Details
            </Text>

            {/* Selected Tier Summary */}
            <View
              style={[
                styles.summary,
                {
                  backgroundColor: colors.card,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Selected Tier
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {selectedTierData.name}
                </Text>
              </View>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Price
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  ${selectedTierData.price}
                </Text>
              </View>
            </View>

            {/* Recipient Email */}
            <View style={styles.formSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Recipient Email
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="mail"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="recipient@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Personal Message */}
            <View style={styles.formSection}>
              <Text style={[styles.label, { color: colors.text }]}>
                Personal Message (Optional)
              </Text>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                placeholder="Add a personal message..."
                placeholderTextColor={colors.textTertiary}
                value={personalMessage}
                onChangeText={setPersonalMessage}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            {/* Navigation */}
            <View style={styles.buttonRow}>
              <Button
                title="Back"
                onPress={() => setStep('select')}
                variant="secondary"
                style={styles.halfButton}
              />
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.halfButton}
              />
            </View>
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Confirm Gift
            </Text>

            {/* Confirmation Summary */}
            <View
              style={[
                styles.confirmCard,
                {
                  backgroundColor: colors.card,
                },
              ]}
            >
              <View style={styles.confirmItem}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                  Tier
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {selectedTierData.name}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.confirmItem}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                  Recipient
                </Text>
                <Text style={[styles.confirmValue, { color: colors.text }]}>
                  {recipientEmail}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.confirmItem}>
                <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                  Total Price
                </Text>
                <Text style={[styles.confirmValue, { color: colors.primary }]}>
                  ${selectedTierData.price}
                </Text>
              </View>

              {personalMessage && (
                <>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <View style={styles.confirmItem}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>
                      Message
                    </Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {personalMessage}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Info */}
            <View
              style={[
                styles.infoBox,
                { backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                A gift code and invitation will be sent to the recipient via email
              </Text>
            </View>

            {/* Navigation */}
            <View style={styles.buttonRow}>
              <Button
                title="Back"
                onPress={() => setStep('details')}
                variant="secondary"
                style={styles.halfButton}
              />
              <Button
                title={loading ? 'Sending...' : 'Send Gift'}
                onPress={handleSendGift}
                disabled={loading}
                style={styles.halfButton}
              />
            </View>
          </View>
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Processing your gift...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumber: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  stepLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.lg,
  },
  tierCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tierName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  tierPrice: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  tierDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  features: {
    gap: Spacing.sm,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: Spacing.sm,
  },
  featureText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    borderLeftWidth: 4,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  label: {
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
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    padding: 0,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  confirmCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  confirmItem: {
    paddingVertical: Spacing.md,
  },
  confirmLabel: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  confirmValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  divider: {
    height: 1,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    marginLeft: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  halfButton: {
    flex: 1,
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
    marginTop: Spacing.md,
  },
});
