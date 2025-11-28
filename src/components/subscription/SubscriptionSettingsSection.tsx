/**
 * Subscription Settings Section
 *
 * Shows current subscription status and management options in Settings screen:
 * - Current plan (FREE or BASIC)
 * - Auto-renew status
 * - Next billing date
 * - Action buttons (Upgrade, Change Payment, Cancel)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { SubscriptionTier } from '@/types/subscription.types';

interface SubscriptionSettingsSectionProps {
  tier: SubscriptionTier;
  status?: 'free' | 'trial' | 'active' | 'cancelled' | 'expired';
  autoRenewEnabled?: boolean;
  nextBillingDate?: number; // Timestamp
  onUpgradePress?: () => void;
  onChangePaymentPress?: () => void;
  onCancelSubscriptionPress?: () => void;
}

export const SubscriptionSettingsSection: React.FC<SubscriptionSettingsSectionProps> = ({
  tier,
  status = 'free',
  autoRenewEnabled = false,
  nextBillingDate,
  onUpgradePress,
  onChangePaymentPress,
  onCancelSubscriptionPress,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isFree = tier === 'free';
  const isActive = status === 'active';

  // Format next billing date
  const formatBillingDate = (timestamp?: number): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Subscription?',
      'You\'ll lose access to unlimited practice. Your current data will be preserved.',
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await onCancelSubscriptionPress?.();
            } finally {
              setIsProcessing(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={[styles.container, Shadows.sm]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name={isFree ? 'lock-closed' : 'star'}
          size={24}
          color={isFree ? Colors.text.secondary : Colors.accent.green}
          style={styles.headerIcon}
        />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {isFree ? 'Free Plan' : 'Basic Subscription'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isFree
              ? '7-day trial with full access'
              : 'Unlimited daily practice + full AI feedback'}
          </Text>
        </View>
      </View>

      {/* Plan Details */}
      {!isFree && isActive && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.accent.green}
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabelText}>Current Status</Text>
            </View>
            <Text style={[styles.detailValue, styles.detailValueActive]}>
              Active
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons
                name={autoRenewEnabled ? 'reload-circle' : 'close-circle'}
                size={16}
                color={
                  autoRenewEnabled ? Colors.accent.green : Colors.text.secondary
                }
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabelText}>Auto-Renew</Text>
            </View>
            <Text
              style={[
                styles.detailValue,
                autoRenewEnabled && styles.detailValueActive,
              ]}
            >
              {autoRenewEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          {autoRenewEnabled && nextBillingDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons
                  name="calendar"
                  size={16}
                  color={Colors.text.secondary}
                  style={styles.detailIcon}
                />
                <Text style={styles.detailLabelText}>Next Billing</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatBillingDate(nextBillingDate)}
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Monthly Price</Text>
            <Text style={styles.priceValue}>
              $2.99
              <Text style={styles.pricePeriod}>/month</Text>
            </Text>
          </View>
        </View>
      )}

      {/* Upgrade Card (for free tier) */}
      {isFree && (
        <View style={styles.upgradeCard}>
          <View style={styles.upgradeCardContent}>
            <Ionicons
              name="star"
              size={20}
              color={Colors.accent.green}
              style={styles.upgradeIcon}
            />
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Upgrade to Basic</Text>
              <Text style={styles.upgradeSubtitle}>
                Get unlimited practice for $2.99/month
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.text.secondary}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {isFree && onUpgradePress && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={onUpgradePress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="card"
              size={16}
              color={Colors.text.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonPrimaryText}>Upgrade Now</Text>
          </TouchableOpacity>
        )}

        {!isFree && isActive && (
          <>
            {onChangePaymentPress && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onChangePaymentPress}
                disabled={isProcessing}
              >
                <Ionicons
                  name="wallet"
                  size={16}
                  color={Colors.primary.blue}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonSecondaryText}>
                  Change Payment Method
                </Text>
              </TouchableOpacity>
            )}

            {onCancelSubscriptionPress && (
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleCancelPress}
                disabled={isProcessing}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={Colors.accent.red}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonDangerText}>
                  Cancel Subscription
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Ionicons
          name="information-circle"
          size={14}
          color={Colors.text.tertiary}
          style={styles.infoIcon}
        />
        <Text style={styles.infoText}>
          {isFree
            ? '30-day free trial available. Cancel anytime, no commitment.'
            : 'Your subscription auto-renews monthly. You can cancel anytime.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerIcon: {
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  detailsContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  detailIcon: {
    width: 16,
  },
  detailLabelText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 13,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
    fontSize: 13,
  },
  detailValueActive: {
    color: Colors.accent.green,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 13,
  },
  priceValue: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  pricePeriod: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '400',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.green + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.green,
  },
  upgradeCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  upgradeIcon: {
    marginRight: Spacing.sm,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    ...Typography.h3,
    color: Colors.accent.green,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  upgradeSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
  buttonPrimary: {
    backgroundColor: Colors.accent.green,
  },
  buttonPrimaryText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: Colors.primary.blue + '15',
    borderWidth: 1,
    borderColor: Colors.primary.blue + '30',
  },
  buttonSecondaryText: {
    ...Typography.body,
    color: Colors.primary.blue,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDanger: {
    backgroundColor: Colors.accent.red + '15',
    borderWidth: 1,
    borderColor: Colors.accent.red + '30',
  },
  buttonDangerText: {
    ...Typography.body,
    color: Colors.accent.red,
    fontWeight: '600',
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoIcon: {
    marginTop: 2,
    minWidth: 14,
  },
  infoText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
