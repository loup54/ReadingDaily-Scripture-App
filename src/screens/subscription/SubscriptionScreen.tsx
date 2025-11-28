import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button, IconButton } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useTrialStore } from '@stores/useTrialStore';
import { useAuthStore } from '@stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';

interface SubscriptionScreenProps {
  onBack?: () => void;
  onPurchaseComplete?: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  onBack,
  onPurchaseComplete,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    hasPurchased,
    isActive,
    hasExpired,
    remainingMinutes,
    lifetimePrice,
    purchaseLifetimeAccess,
    restorePurchase,
    startTrial,
  } = useTrialStore();
  const { user } = useAuthStore();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSendGift = () => {
    router.push('/(tabs)/subscription/send-gift');
  };

  const handleRedeemGift = () => {
    router.push('/(tabs)/subscription/redeem-gift');
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseLifetimeAccess();
      if (success) {
        Alert.alert(
          'Purchase Successful!',
          'You now have lifetime access to all features.',
          [
            {
              text: 'OK',
              onPress: onPurchaseComplete,
            },
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'Unable to complete your purchase. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchase();
      if (success) {
        Alert.alert(
          'Restore Successful!',
          'Your previous purchase has been restored.',
          [
            {
              text: 'OK',
              onPress: onPurchaseComplete,
            },
          ]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          "We couldn't find any previous purchases to restore."
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to restore purchases. Please try again later.'
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleStartTrial = async () => {
    try {
      await startTrial();
      Alert.alert(
        'Trial Started!',
        'Your 7-day free trial has begun. Enjoy full access!',
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to start trial. Please try again.');
    }
  };

  const getTrialStatus = () => {
    if (hasPurchased) {
      return {
        title: 'Lifetime Access',
        subtitle: 'You have unlimited access to all features',
        icon: 'checkmark-circle' as const,
        color: Colors.accent.green,
      };
    }

    if (isActive) {
      return {
        title: 'Trial Active',
        subtitle: `${remainingMinutes} minutes remaining`,
        icon: 'time' as const,
        color: Colors.primary.blue,
      };
    }

    if (hasExpired) {
      return {
        title: 'Trial Expired',
        subtitle: 'Purchase lifetime access to continue',
        icon: 'alert-circle' as const,
        color: Colors.status.error,
      };
    }

    return {
      title: 'Trial Available',
      subtitle: 'Start your 7-day free trial',
      icon: 'gift' as const,
      color: Colors.accent.green,
    };
  };

  const status = getTrialStatus();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={colors.primary.gradient} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <IconButton
              icon="chevron-back"
              onPress={onBack}
              variant="default"
              size="md"
              color={colors.text.white}
            />
          )}
          <Text style={[styles.headerTitle, { color: colors.text.white }]}>Subscription</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <View style={styles.statusCard}>
            <Ionicons name={status.icon} size={64} color={status.color} />
            <Text style={styles.statusTitle}>{status.title}</Text>
            <Text style={styles.statusSubtitle}>{status.subtitle}</Text>
          </View>

          {!hasPurchased && (
            <>
              {/* Lifetime Access Card */}
              <LinearGradient
                colors={[colors.primary + '15', colors.secondary + '15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pricingCardGradient}
              >
                <View style={[styles.pricingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.pricingHeader}>
                    <View style={styles.badgeContainer}>
                      <View style={[styles.bestValueBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>BEST VALUE</Text>
                      </View>
                    </View>
                    <Text style={[styles.pricingTitle, { color: colors.text }]}>Lifetime Access</Text>
                    <View style={styles.priceBadge}>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>${lifetimePrice}</Text>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>one-time payment</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.featuresList}>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Unlimited daily scripture readings
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Audio playback with adjustable speed
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Multiple translation options
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Practice mode (coming soon)
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Progress tracking
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        No subscription fees
                      </Text>
                    </View>
                  </View>

                  <Button
                    title={`Purchase for $${lifetimePrice}`}
                    variant="accent"
                    size="lg"
                    fullWidth
                    onPress={handlePurchase}
                    loading={purchasing}
                    style={styles.purchaseButton}
                  />
                </View>
              </LinearGradient>

              {/* Trial Section */}
              {!isActive && !hasExpired && (
                <View style={styles.trialCard}>
                  <Text style={styles.trialTitle}>Try Before You Buy</Text>
                  <Text style={styles.trialSubtitle}>
                    Start a 7-day free trial to explore all features
                  </Text>
                  <Button
                    title="Start Free Trial"
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={handleStartTrial}
                  />
                </View>
              )}

              {/* Restore Purchases */}
              <Button
                title="Restore Previous Purchase"
                variant="text"
                onPress={handleRestore}
                loading={restoring}
                textStyle={styles.restoreText}
              />
            </>
          )}

          {/* Account Info */}
          {user && (
            <View style={styles.accountCard}>
              <Text style={styles.accountLabel}>Account</Text>
              <Text style={styles.accountValue}>{user.email}</Text>
              {hasPurchased && (
                <Text style={styles.purchaseDate}>
                  Purchased on {new Date().toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Gifting Section */}
          <View style={styles.giftingSection}>
            <Text style={[styles.giftingTitle, { color: colors.text.primary }]}>
              Share the Gift
            </Text>
            <Text style={[styles.giftingSubtitle, { color: colors.text.secondary }]}>
              Send access to friends and family
            </Text>

            <Button
              title="Send a Gift"
              icon="gift"
              variant="secondary"
              size="md"
              fullWidth
              onPress={handleSendGift}
              style={styles.giftButton}
            />

            <Button
              title="Redeem a Gift Code"
              icon="checkmark-circle"
              variant="outline"
              size="md"
              fullWidth
              onPress={handleRedeemGift}
              style={styles.giftButton}
            />
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.white,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statusCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  statusTitle: {
    ...Typography.h1,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  statusSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  pricingCardGradient: {
    borderRadius: BorderRadius.xl,
    padding: 2,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  pricingCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  badgeContainer: {
    marginBottom: Spacing.md,
  },
  bestValueBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pricingTitle: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
  priceBadge: {
    alignItems: 'center',
  },
  priceAmount: {
    ...Typography.displayLarge,
    fontWeight: '700',
  },
  priceLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.lg,
  },
  featuresList: {
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  purchaseButton: {
    marginTop: Spacing.md,
  },
  trialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  trialTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  trialSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  restoreText: {
    color: Colors.text.white,
    fontSize: 14,
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  accountLabel: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  accountValue: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '500',
  },
  purchaseDate: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  giftingSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  giftingTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  giftingSubtitle: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  giftButton: {
    marginBottom: Spacing.md,
  },
});
