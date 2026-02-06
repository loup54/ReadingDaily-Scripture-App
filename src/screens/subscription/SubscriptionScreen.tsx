import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
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

// iPad detection
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

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
  const { user, isGuest } = useAuthStore();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSendGift = () => {
    router.push('/(tabs)/subscription/send-gift');
  };

  const handleRedeemGift = () => {
    router.push('/(tabs)/subscription/redeem-gift');
  };

  const handlePurchase = async () => {
    // Apple Guideline 5.1.1 Compliance: Allow guest users to purchase IAP
    // Registration is OPTIONAL for syncing across devices
    setPurchasing(true);
    try {
      const success = await purchaseLifetimeAccess();
      if (success) {
        // Purchase successful - offer optional sign-in for device sync
        if (isGuest || !user) {
          Alert.alert(
            'Purchase Successful!',
            'You now have lifetime access to all features on this device.\n\nWould you like to create an account to sync your purchase across devices?',
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: onPurchaseComplete,
              },
              {
                text: 'Create Account',
                onPress: () => {
                  router.push('/(auth)/sign-up');
                },
              },
            ]
          );
        } else {
          // Already authenticated - just show success
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
        }
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
    // Check if user is guest or not authenticated before restoring
    if (isGuest || !user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to restore your previous purchases.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/(auth)/sign-in'),
          },
        ]
      );
      return;
    }

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

  const handleBasicPurchase = async () => {
    // Apple Guideline 5.1.1 Compliance: Allow guest users to purchase subscription
    // Registration is OPTIONAL for syncing across devices
    setPurchasing(true);
    try {
      // Purchase Monthly subscription (com.readingdaily.basic.monthly.v2)
      const { upgradeToBasic } = useTrialStore.getState();
      const success = await upgradeToBasic('com.readingdaily.basic.monthly.v2');

      if (success) {
        // Purchase successful - offer optional sign-in for device sync
        if (isGuest || !user) {
          Alert.alert(
            'Subscription Activated!',
            'You now have access to all features on this device.\n\nWould you like to create an account to sync your subscription across devices?',
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: onPurchaseComplete,
              },
              {
                text: 'Create Account',
                onPress: () => {
                  router.push('/(auth)/sign-up');
                },
              },
            ]
          );
        } else {
          // Already authenticated - just show success
          Alert.alert(
            'Subscription Activated!',
            'You now have access to all features.',
            [
              {
                text: 'OK',
                onPress: onPurchaseComplete,
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePremiumPurchase = async () => {
    // Apple Guideline 5.1.1 Compliance: Allow guest users to purchase subscription
    // Registration is OPTIONAL for syncing across devices
    setPurchasing(true);
    try {
      // Purchase Yearly subscription (com.readingdaily.basic.yearly.v2)
      const { upgradeToBasic } = useTrialStore.getState();
      const success = await upgradeToBasic('com.readingdaily.basic.yearly.v2');

      if (success) {
        // Purchase successful - offer optional sign-in for device sync
        if (isGuest || !user) {
          Alert.alert(
            'Subscription Activated!',
            'You now have access to all features on this device.\n\nWould you like to create an account to sync your subscription across devices?',
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: onPurchaseComplete,
              },
              {
                text: 'Create Account',
                onPress: () => {
                  router.push('/(auth)/sign-up');
                },
              },
            ]
          );
        } else {
          // Already authenticated - just show success
          Alert.alert(
            'Subscription Activated!',
            'You now have access to all features.',
            [
              {
                text: 'OK',
                onPress: onPurchaseComplete,
              },
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleStartTrial = async () => {
    // Apple Guideline 5.1.1 Compliance: Allow guest users to start trial
    // Registration is OPTIONAL for syncing across devices
    try {
      await startTrial();

      // Trial started successfully - offer optional sign-in for device sync
      if (isGuest || !user) {
        Alert.alert(
          'Trial Started!',
          'Your 7-day free trial has begun on this device.\n\nWould you like to create an account to sync your trial across devices?',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: onBack,
            },
            {
              text: 'Create Account',
              onPress: () => {
                router.push('/(auth)/sign-up');
              },
            },
          ]
        );
      } else {
        // Already authenticated - just show success
        Alert.alert(
          'Trial Started!',
          'Your 7-day free trial has begun. Enjoy full access!',
          [{ text: 'OK', onPress: onBack }]
        );
      }
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
              {/* Subscription Tiers - Basic */}
              <LinearGradient
                colors={[colors.primary + '10', colors.secondary + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pricingCardGradient}
              >
                <View style={[styles.pricingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.pricingHeader}>
                    <Text style={[styles.pricingTitle, { color: colors.text }]}>Basic</Text>
                    <View style={styles.priceBadge}>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>$2.99</Text>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>/month</Text>
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
                        Daily Scripture readings
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Audio narration
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Offline access
                      </Text>
                    </View>
                  </View>

                  <Button
                    title="Subscribe to Basic"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={handleBasicPurchase}
                    loading={purchasing}
                    style={styles.purchaseButton}
                  />
                </View>
              </LinearGradient>

              {/* Subscription Tiers - Premium (Popular) */}
              <LinearGradient
                colors={[colors.primary + '15', colors.secondary + '15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pricingCardGradient}
              >
                <View style={[styles.pricingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.pricingHeader}>
                    <View style={styles.badgeContainer}>
                      <View style={[styles.bestValueBadge, { backgroundColor: colors.accent.green + '30' }]}>
                        <Text style={[styles.badgeText, { color: colors.accent.green }]}>Popular</Text>
                      </View>
                    </View>
                    <Text style={[styles.pricingTitle, { color: colors.text }]}>Premium</Text>
                    <View style={styles.priceBadge}>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>$19.99</Text>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>/year</Text>
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
                        All Basic features
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Sync across devices
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Ad-free experience
                      </Text>
                    </View>
                  </View>

                  <Button
                    title="Subscribe to Premium"
                    variant="accent"
                    size="lg"
                    fullWidth
                    onPress={handlePremiumPurchase}
                    loading={purchasing}
                    style={styles.purchaseButton}
                  />
                </View>
              </LinearGradient>

              {/* Subscription Tiers - Lifetime (Best Value) */}
              <LinearGradient
                colors={[colors.accent.green + '15', colors.accent.blue + '15']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pricingCardGradient}
              >
                <View style={[styles.pricingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.pricingHeader}>
                    <View style={styles.badgeContainer}>
                      <View style={[styles.bestValueBadge, { backgroundColor: colors.accent.green + '30' }]}>
                        <Text style={[styles.badgeText, { color: colors.accent.green }]}>Best Value</Text>
                      </View>
                    </View>
                    <Text style={[styles.pricingTitle, { color: colors.text }]}>Lifetime</Text>
                    <View style={styles.priceBadge}>
                      <Text style={[styles.priceAmount, { color: colors.primary }]}>$49.99</Text>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>one-time</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.featuresList}>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? 24 : 20}
                        color={colors.accent.green}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        All Premium features
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? 24 : 20}
                        color={colors.accent.green}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Lifetime updates
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? 24 : 20}
                        color={colors.accent.green}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Priority support
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? 24 : 20}
                        color={colors.accent.green}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Exclusive content
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? 24 : 20}
                        color={colors.accent.green}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        Never expires
                      </Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={isTablet ? 24 : 20}
                        color={colors.accent.green}
                      />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        One-time payment
                      </Text>
                    </View>
                  </View>

                  <Button
                    title="Get Lifetime Access"
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
    padding: isTablet ? Spacing.xl * 2 : Spacing.lg,
    maxWidth: isTablet ? 600 : undefined,
    alignSelf: isTablet ? 'center' : undefined,
    width: isTablet ? '100%' : undefined,
  },
  statusCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: isTablet ? Spacing.xl * 1.5 : Spacing.xl,
    alignItems: 'center',
    marginBottom: isTablet ? Spacing.xl : Spacing.lg,
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
    padding: isTablet ? Spacing.xl * 1.5 : Spacing.lg,
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
    marginBottom: isTablet ? Spacing.lg : Spacing.md,
  },
  featureText: {
    ...Typography.body,
    fontSize: isTablet ? 18 : Typography.body.fontSize,
    marginLeft: isTablet ? Spacing.md : Spacing.sm,
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
