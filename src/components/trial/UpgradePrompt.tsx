/**
 * Upgrade Prompt Modal
 *
 * Modal prompting users to upgrade to lifetime access
 * Shows during trial or after expiry
 *
 * Phase 12: Trial UI Components
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { ENV } from '@/config/env';

export interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onRestore?: () => void;
  isTrialExpired?: boolean;
  timeRemaining?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onPurchase,
  onRestore,
  isTrialExpired = false,
  timeRemaining,
}) => {
  const features = [
    {
      icon: 'infinite-outline' as const,
      title: 'Lifetime Access',
      description: 'Unlock all features forever with a one-time payment',
    },
    {
      icon: 'volume-high-outline' as const,
      title: 'Audio Narration',
      description: 'Listen to daily readings with natural AI voices',
    },
    {
      icon: 'language-outline' as const,
      title: 'ESL Learning Tools',
      description: 'Tap-to-translate and pronunciation practice',
    },
    {
      icon: 'cloud-download-outline' as const,
      title: 'Offline Access',
      description: 'Download readings and audio for offline use',
    },
    {
      icon: 'trophy-outline' as const,
      title: 'Progress Tracking',
      description: 'Track streaks, earn badges, and monitor growth',
    },
    {
      icon: 'shield-checkmark-outline' as const,
      title: 'No Subscriptions',
      description: 'Pay once, own forever. No recurring charges.',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* Icon and Title */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={Colors.primary.gradient}
                style={styles.iconGradient}
              >
                <Ionicons name="lock-open-outline" size={48} color={Colors.text.white} />
              </LinearGradient>
            </View>

            <Text style={styles.title}>
              {isTrialExpired ? 'Trial Ended' : 'Unlock Lifetime Access'}
            </Text>

            {timeRemaining && !isTrialExpired && (
              <View style={styles.timeRemainingBadge}>
                <Ionicons name="time-outline" size={16} color={Colors.ui.warning} />
                <Text style={styles.timeRemainingText}>
                  {timeRemaining} remaining in trial
                </Text>
              </View>
            )}

            <Text style={styles.subtitle}>
              {isTrialExpired
                ? 'Continue your spiritual journey with lifetime access'
                : 'Get lifetime access to all features for just $5'}
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIconContainer}>
                    <Ionicons
                      name={feature.icon}
                      size={24}
                      color={Colors.primary.purple}
                    />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.ui.success} />
                </View>
              ))}
            </View>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>One-time payment</Text>
              <Text style={styles.priceAmount}>${ENV.LIFETIME_PRICE}</Text>
              <Text style={styles.priceSubtext}>No subscriptions. No hidden fees.</Text>
            </View>

            {/* Purchase Button */}
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={onPurchase}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={Colors.primary.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.purchaseGradient}
              >
                <Ionicons name="lock-open-outline" size={24} color={Colors.text.white} />
                <Text style={styles.purchaseButtonText}>
                  Unlock Lifetime Access
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Restore Purchase */}
            {onRestore && (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={onRestore}
                activeOpacity={0.7}
              >
                <Text style={styles.restoreButtonText}>
                  Already purchased? Restore
                </Text>
              </TouchableOpacity>
            )}

            {/* Fine Print */}
            <Text style={styles.finePrint}>
              By purchasing, you agree to our Terms of Service and Privacy Policy.
              Purchase is final and non-refundable.
            </Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  timeRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.ui.warning + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  timeRemainingText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.ui.warning,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.purple + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  priceAmount: {
    fontSize: 64,
    fontWeight: FontWeights.bold,
    color: Colors.primary.purple,
    marginBottom: Spacing.xs,
  },
  priceSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  purchaseButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  purchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  purchaseButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text.white,
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  restoreButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.purple,
    fontWeight: FontWeights.semibold,
  },
  finePrint: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
