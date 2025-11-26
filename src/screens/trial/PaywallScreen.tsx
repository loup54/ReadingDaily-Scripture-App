/**
 * Paywall Screen
 *
 * Full-screen paywall shown when trial expires
 * Blocks access to app until user purchases
 *
 * Phase 12: Trial UI Components
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { ENV } from '@/config/env';
import { useTrialStore } from '@/stores/useTrialStore';
import { useTheme } from '@/hooks/useTheme';

export interface PaywallScreenProps {
  onPurchaseComplete?: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onPurchaseComplete,
}) => {
  const { colors } = useTheme();
  const { purchaseLifetimeAccess, restorePurchase } = useTrialStore();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const success = await purchaseLifetimeAccess();
      if (success) {
        Alert.alert(
          'Purchase Successful! 🎉',
          'You now have lifetime access to all features. Thank you for your support!',
          [
            {
              text: 'Continue',
              onPress: onPurchaseComplete,
            },
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'Unable to complete purchase. Please try again or contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An error occurred during purchase. Please try again.',
        [{ text: 'OK' }]
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
          'Restore Successful! ✅',
          'Your purchase has been restored. Welcome back!',
          [
            {
              text: 'Continue',
              onPress: onPurchaseComplete,
            },
          ]
        );
      } else {
        Alert.alert(
          'No Purchase Found',
          'We could not find a previous purchase for this account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An error occurred while restoring. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoring(false);
    }
  };

  const benefits = [
    {
      icon: 'infinite-outline' as const,
      title: 'Unlimited Access',
      description: 'Daily scripture readings forever',
    },
    {
      icon: 'volume-high-outline' as const,
      title: 'Audio Narration',
      description: 'Natural AI voices in multiple languages',
    },
    {
      icon: 'book-outline' as const,
      title: 'ESL Learning',
      description: 'Vocabulary and pronunciation tools',
    },
    {
      icon: 'cloud-download-outline' as const,
      title: 'Offline Mode',
      description: 'Download for use without internet',
    },
    {
      icon: 'trophy-outline' as const,
      title: 'Track Progress',
      description: 'Streaks, badges, and achievements',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'One-Time Payment',
      description: 'No subscriptions or recurring fees',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.primary.gradient}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.text.white + '20' }]}>
              <Ionicons name="lock-closed" size={64} color={colors.text.white} />
            </View>
            <Text style={[styles.title, { color: colors.text.white }]}>Your Trial Has Ended</Text>
            <Text style={[styles.subtitle, { color: colors.text.white }]}>
              Continue your spiritual journey with lifetime access to all features
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={[styles.benefitItem, { backgroundColor: colors.background.card }]}>
                <View style={[styles.benefitIconContainer, { backgroundColor: colors.primary.purple + '15' }]}>
                  <Ionicons name={benefit.icon} size={28} color={colors.primary.purple} />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, { color: colors.text.primary }]}>{benefit.title}</Text>
                  <Text style={[styles.benefitDescription, { color: colors.text.secondary }]}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price Card */}
          <View style={[styles.priceCard, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.priceLabel, { color: colors.text.secondary }]}>Lifetime Access</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceAmount, { color: colors.primary.purple }]}>${ENV.LIFETIME_PRICE}</Text>
              <View style={[styles.priceBadge, { backgroundColor: colors.ui.success + '20' }]}>
                <Text style={[styles.priceBadgeText, { color: colors.ui.success }]}>One-time</Text>
              </View>
            </View>
            <Text style={[styles.priceSubtext, { color: colors.text.tertiary }]}>
              No subscriptions. Pay once, own forever.
            </Text>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: colors.background.card }]}
            onPress={handlePurchase}
            disabled={purchasing || restoring}
            activeOpacity={0.9}
          >
            <View style={styles.purchaseButtonContent}>
              {purchasing ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary.purple} />
                  <Text style={[styles.purchaseButtonText, { color: colors.primary.purple }]}>
                    Processing purchase...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="lock-open-outline"
                    size={24}
                    color={colors.primary.purple}
                  />
                  <Text style={[styles.purchaseButtonText, { color: colors.primary.purple }]}>
                    Unlock Lifetime Access
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Restore Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing || restoring}
            activeOpacity={0.7}
          >
            {restoring ? (
              <>
                <ActivityIndicator size="small" color={colors.text.white} />
                <Text style={[styles.restoreButtonText, { color: colors.text.white }]}>
                  Restoring purchase...
                </Text>
              </>
            ) : (
              <Text style={[styles.restoreButtonText, { color: colors.text.white }]}>
                Already purchased? Restore
              </Text>
            )}
          </TouchableOpacity>

          {/* Testimonials */}
          <View style={styles.testimonialsContainer}>
            <Text style={[styles.testimonialsTitle, { color: colors.text.white }]}>Loved by Thousands</Text>
            <View style={[styles.testimonialItem, { backgroundColor: colors.text.white + '15' }]}>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons key={i} name="star" size={16} color="#FFD700" />
                ))}
              </View>
              <Text style={[styles.testimonialText, { color: colors.text.white }]}>
                "Perfect for improving my English while staying connected to my faith. The
                audio feature is amazing!"
              </Text>
              <Text style={[styles.testimonialAuthor, { color: colors.text.white }]}>- Maria, ESL Student</Text>
            </View>
          </View>

          {/* Fine Print */}
          <Text style={[styles.finePrint, { color: colors.text.white }]}>
            By purchasing, you agree to our Terms of Service and Privacy Policy.
            Purchase is final and non-refundable. Questions? Contact support@readingdaily.com
          </Text>
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
  scrollContent: {
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.text.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.text.white + 'CC',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginBottom: Spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  benefitIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.purple + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  priceCard: {
    backgroundColor: Colors.text.white,
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  priceLabel: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  priceAmount: {
    fontSize: 72,
    fontWeight: FontWeights.bold,
    color: Colors.primary.purple,
  },
  priceBadge: {
    backgroundColor: Colors.ui.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  priceBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.ui.success,
  },
  priceSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  purchaseButton: {
    backgroundColor: Colors.text.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  purchaseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  purchaseButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary.purple,
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  restoreButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.text.white,
    fontWeight: FontWeights.semibold,
  },
  testimonialsContainer: {
    marginBottom: Spacing.xl,
  },
  testimonialsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  testimonialItem: {
    backgroundColor: Colors.text.white + '15',
    borderRadius: 12,
    padding: Spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  testimonialText: {
    fontSize: FontSizes.md,
    color: Colors.text.white,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  testimonialAuthor: {
    fontSize: FontSizes.sm,
    color: Colors.text.white + 'CC',
    fontStyle: 'italic',
  },
  finePrint: {
    fontSize: FontSizes.xs,
    color: Colors.text.white + '99',
    textAlign: 'center',
    lineHeight: 16,
  },
});
