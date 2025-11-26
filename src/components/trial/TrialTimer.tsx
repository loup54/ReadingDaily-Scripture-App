/**
 * Trial Timer Component
 *
 * Displays remaining trial time with visual countdown
 * Phase 12: Trial UI Components
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTrialStore } from '@/stores/useTrialStore';
import { useTheme } from '@/hooks/useTheme';

export interface TrialTimerProps {
  onUpgradePress?: () => void;
  compact?: boolean;
}

export const TrialTimer: React.FC<TrialTimerProps> = ({
  onUpgradePress,
  compact = false,
}) => {
  const { colors } = useTheme();
  const {
    isActive,
    hasExpired,
    hasPurchased,
    getRemainingTime,
    getFormattedTimeRemaining,
  } = useTrialStore();

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(100);

  useEffect(() => {
    if (!isActive || hasPurchased || hasExpired) {
      return;
    }

    const updateTimer = () => {
      const remaining = getRemainingTime();
      const formatted = getFormattedTimeRemaining();
      setTimeRemaining(formatted);

      // Calculate percentage (10 minutes = 600 seconds)
      const totalTrialSeconds = 10 * 60;
      const percentRemaining = Math.max(0, (remaining / totalTrialSeconds) * 100);
      setPercentage(percentRemaining);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, hasPurchased, hasExpired, getRemainingTime, getFormattedTimeRemaining]);

  // Don't show if purchased or trial not active
  if (hasPurchased || !isActive) {
    return null;
  }

  // Determine urgency color
  const getUrgencyColor = () => {
    if (percentage > 50) return Colors.ui.success;
    if (percentage > 20) return Colors.ui.warning;
    return Colors.ui.error;
  };

  const urgencyColor = getUrgencyColor();

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { backgroundColor: colors.background.secondary }]}
        onPress={onUpgradePress}
        activeOpacity={0.8}
      >
        <Ionicons name="time-outline" size={16} color={urgencyColor} />
        <Text style={[styles.compactText, { color: urgencyColor }]}>
          {timeRemaining} left
        </Text>
        <Ionicons name="chevron-forward" size={16} color={urgencyColor} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.card, borderColor: colors.ui.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
          <Text style={[styles.headerText, { color: colors.text.primary }]}>Trial Time Remaining</Text>
        </View>
        {hasExpired && (
          <View style={[styles.expiredBadge, { backgroundColor: colors.ui.error + '20' }]}>
            <Text style={[styles.expiredText, { color: colors.ui.error }]}>EXPIRED</Text>
          </View>
        )}
      </View>

      {/* Timer Display */}
      <View style={styles.timerSection}>
        <Text style={[styles.timeText, { color: urgencyColor }]}>
          {timeRemaining}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.background.secondary }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: urgencyColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Message */}
        <Text style={[styles.messageText, { color: colors.text.secondary }]}>
          {hasExpired
            ? 'Your trial has ended. Upgrade to continue.'
            : percentage > 50
            ? 'Enjoying the app? Unlock lifetime access for just $5!'
            : percentage > 20
            ? 'Trial ending soon. Upgrade now to keep your progress.'
            : 'Trial ending very soon! Upgrade to avoid losing access.'}
        </Text>
      </View>

      {/* Upgrade Button */}
      {onUpgradePress && (
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={onUpgradePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colors.primary.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeGradient}
          >
            <Ionicons name="lock-open-outline" size={20} color={colors.text.white} />
            <Text style={[styles.upgradeButtonText, { color: colors.text.white }]}>
              {hasExpired ? 'Upgrade Now' : 'Unlock Lifetime Access'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.text.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  compactText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  expiredBadge: {
    backgroundColor: Colors.ui.error + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 4,
  },
  expiredText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ui.error,
  },
  timerSection: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  messageText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  upgradeButton: {
    marginTop: Spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  upgradeButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.white,
  },
});
