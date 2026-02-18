import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';

interface TrialExpiredModalProps {
  visible: boolean;
  onPurchase: () => void;
  onDismiss?: () => void;
  lifetimePrice?: number; // Deprecated, kept for backwards compatibility
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  visible,
  onPurchase,
  onDismiss,
  lifetimePrice, // Ignored - using subscription model now
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={colors.primary.gradient}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name="time-outline"
                  size={80}
                  color={colors.text.white}
                />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text.white }]}>Your Trial Has Ended</Text>
              <Text style={[styles.subtitle, { color: colors.text.white }]}>
                Continue your spiritual journey with{'\n'}
                lifetime access to all features
              </Text>

              {/* Features */}
              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="infinite"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Unlimited Access
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="volume-high-outline"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Audio Narration
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="book-outline"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    ESL Learning
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="cloud-download-outline"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Offline Mode
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="trophy-outline"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Track Progress
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    One-Time Payment
                  </Text>
                </View>
              </View>

              {/* Subscription Tiers */}
              <View style={styles.subscriptionTiers}>
                {/* Basic Tier */}
                <View style={styles.tierCard}>
                  <Text style={[styles.tierTitle, { color: colors.text.white }]}>Basic</Text>
                  <View style={styles.tierPriceRow}>
                    <Text style={[styles.tierPrice, { color: colors.text.white }]}>$2.99</Text>
                    <Text style={[styles.tierPeriod, { color: colors.text.white }]}>/month</Text>
                  </View>
                  <Text style={[styles.tierDescription, { color: colors.text.white }]}>
                    Access to daily Scripture readings and devotionals
                  </Text>
                  <View style={styles.tierFeatures}>
                    <Text style={[styles.tierFeature, { color: colors.text.white }]}>✓ Daily Scripture readings</Text>
                    <Text style={[styles.tierFeature, { color: colors.text.white }]}>✓ Audio narration</Text>
                    <Text style={[styles.tierFeature, { color: colors.text.white }]}>✓ Offline access</Text>
                  </View>
                </View>

                {/* Premium Tier */}
                <View style={[styles.tierCard, styles.premiumTier]}>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAR</Text>
                  </View>
                  <Text style={[styles.tierTitle, { color: colors.text.white }]}>Premium</Text>
                  <View style={styles.tierPriceRow}>
                    <Text style={[styles.tierPrice, { color: colors.text.white }]}>$19.99</Text>
                    <Text style={[styles.tierPeriod, { color: colors.text.white }]}>/year</Text>
                  </View>
                  <Text style={[styles.tierDescription, { color: colors.text.white }]}>
                    Full access to all premium features
                  </Text>
                  <View style={styles.tierFeatures}>
                    <Text style={[styles.tierFeature, { color: colors.text.white }]}>✓ All Basic features</Text>
                    <Text style={[styles.tierFeature, { color: colors.text.white }]}>✓ Sync across devices</Text>
                    <Text style={[styles.tierFeature, { color: colors.text.white }]}>✓ Priority support</Text>
                  </View>
                </View>
              </View>

              {/* CTA Buttons */}
              <Button
                title="Start with Premium"
                variant="accent"
                size="lg"
                fullWidth
                onPress={onPurchase}
                style={styles.purchaseButton}
              />
              <TouchableOpacity
                onPress={onPurchase}
                style={styles.basicButton}
              >
                <Text style={[styles.basicButtonText, { color: colors.text.white }]}>
                  Choose Basic instead
                </Text>
              </TouchableOpacity>

              {/* Dismiss */}
              {onDismiss && (
                <TouchableOpacity
                  onPress={onDismiss}
                  style={styles.dismissButton}
                >
                  <Text style={[styles.dismissText, { color: colors.text.white }]}>Already purchased? Restore</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  gradient: {
    width: '100%',
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  features: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text.white,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  subscriptionTiers: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tierCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  premiumTier: {
    borderColor: Colors.accent.green,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  popularBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.accent.green,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  popularBadgeText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: 10,
  },
  tierTitle: {
    ...Typography.h3,
    color: Colors.text.white,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  tierPrice: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    fontWeight: '700',
  },
  tierPeriod: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.8,
    marginLeft: Spacing.xs,
  },
  tierDescription: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.9,
    marginBottom: Spacing.md,
  },
  tierFeatures: {
    gap: Spacing.xs,
  },
  tierFeature: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.9,
  },
  purchaseButton: {
    marginBottom: Spacing.sm,
  },
  basicButton: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  basicButtonText: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  dismissButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dismissText: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.8,
  },
});
