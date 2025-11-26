/**
 * Subscription Badge Component
 *
 * Shows current subscription tier and remaining daily practice time in header
 * Displays:
 * - Tier badge (FREE or BASIC)
 * - Remaining daily minutes (for free tier)
 * - Unlimited indicator (for basic tier)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { SubscriptionTier } from '@/types/subscription.types';

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  remainingMinutes?: number;
  maxDailyMinutes?: number;
  variant?: 'compact' | 'detailed'; // compact: just badge, detailed: with remaining time
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  tier,
  remainingMinutes = 0,
  maxDailyMinutes = 10,
  variant = 'compact',
}) => {
  const isFree = tier === 'free';
  const isUnlimited = remainingMinutes === Infinity;

  // Format remaining time
  const formatRemainingTime = (minutes: number): string => {
    if (isUnlimited) {
      return 'Unlimited';
    }
    if (minutes <= 0) {
      return 'Limit reached';
    }
    if (minutes >= 1) {
      return `${Math.round(minutes)} min`;
    }
    const seconds = Math.round(minutes * 60);
    return `${seconds}s`;
  };

  const remainingText = formatRemainingTime(remainingMinutes);

  // Color based on remaining time
  const getTimeColor = (): string => {
    if (isUnlimited) return Colors.accent.green;
    if (remainingMinutes > 5) return Colors.accent.green;
    if (remainingMinutes > 2) return Colors.ui.warning;
    if (remainingMinutes > 0) return Colors.accent.red;
    return Colors.accent.red;
  };

  const timeColor = getTimeColor();

  if (variant === 'compact') {
    return (
      <View style={styles.badgeCompact}>
        <Ionicons
          name={isFree ? 'lock-closed' : 'star'}
          size={12}
          color={isFree ? Colors.text.secondary : Colors.accent.green}
          style={styles.badgeIcon}
        />
        <Text style={styles.badgeTextCompact}>
          {isFree ? 'FREE' : 'BASIC'}
        </Text>
      </View>
    );
  }

  // Detailed variant
  return (
    <View style={styles.containerDetailed}>
      {/* Tier Badge */}
      <View style={styles.tierBadge}>
        <Ionicons
          name={isFree ? 'lock-closed' : 'star'}
          size={14}
          color={isFree ? Colors.text.secondary : Colors.accent.green}
          style={styles.tierIcon}
        />
        <Text style={styles.tierText}>
          {isFree ? 'FREE' : 'BASIC'}
        </Text>
      </View>

      {/* Time indicator */}
      {isFree && (
        <View style={[styles.timeBadge, { borderColor: timeColor }]}>
          <Ionicons
            name={remainingMinutes <= 0 ? 'alert-circle' : 'time-outline'}
            size={13}
            color={timeColor}
            style={styles.timeIcon}
          />
          <Text style={[styles.timeText, { color: timeColor }]}>
            {remainingText}
          </Text>
        </View>
      )}

      {/* Unlimited badge */}
      {!isFree && (
        <View style={styles.unlimitedBadge}>
          <Ionicons
            name="infinite"
            size={13}
            color={Colors.accent.green}
            style={styles.timeIcon}
          />
          <Text style={styles.unlimitedText}>Unlimited</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  badgeIcon: {
    marginRight: 2,
  },
  badgeTextCompact: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 11,
  },
  containerDetailed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  tierIcon: {
    marginRight: 2,
  },
  tierText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 11,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent.green,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  unlimitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.green + '15',
    borderWidth: 1,
    borderColor: Colors.accent.green + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  timeIcon: {
    marginRight: 2,
  },
  timeText: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  unlimitedText: {
    ...Typography.caption,
    color: Colors.accent.green,
    fontWeight: '600',
    fontSize: 11,
  },
});
