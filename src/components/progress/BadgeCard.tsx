/**
 * Badge Card Component
 *
 * Displays individual badge with progress indicator
 * Shows earned status, progress toward completion, and unlock conditions
 * Phase E: Progress Tracking (Task 2.2)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import type { Badge, BadgeProgress } from '@/types/progress.types';

export interface BadgeCardProps {
  /**
   * Badge definition with metadata
   */
  badge: Badge;

  /**
   * User's progress toward this badge
   */
  progress: BadgeProgress;

  /**
   * Whether user has earned this badge
   */
  earned: boolean;

  /**
   * Date the badge was earned (if earned)
   */
  earnedDate?: Date;

  /**
   * Optional callback when card is pressed
   */
  onPress?: () => void;

  /**
   * Optional style override
   */
  style?: ViewStyle;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  progress,
  earned,
  earnedDate,
  onPress,
  style,
}) => {
  const { colors } = useTheme();

  /**
   * Calculate progress percentage (0-100)
   */
  const progressPercentage = Math.min(
    100,
    Math.round((progress.current / progress.required) * 100)
  );

  /**
   * Get badge category color
   */
  const getCategoryColor = (): string => {
    switch (badge.category) {
      case 'frequency':
        return '#3B82F6'; // Blue
      case 'streak':
        return '#EF4444'; // Red
      case 'consistency':
        return '#10B981'; // Green
      case 'engagement':
        return '#F59E0B'; // Amber
      default:
        return '#8B5CF6'; // Purple
    }
  };

  /**
   * Format earned date for display
   */
  const formatEarnedDate = (): string => {
    if (!earnedDate) return '';
    return earnedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  /**
   * Format progress text based on requirement type
   */
  const getProgressLabel = (): string => {
    switch (badge.requirement.type) {
      case 'readings':
        return `${progress.current} of ${progress.required} readings`;
      case 'consecutive_days':
        return `${progress.current} of ${progress.required} days`;
      case 'calendar_days':
        return `${progress.current} of ${progress.required} days`;
      case 'feature_usage':
        return `${progress.current} of ${progress.required} times`;
      default:
        return `${progress.current} / ${progress.required}`;
    }
  };

  const categoryColor = getCategoryColor();
  const containerStyle = earned
    ? { backgroundColor: colors.background.card, borderColor: categoryColor }
    : { backgroundColor: colors.background.secondary, borderColor: colors.ui.border };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.container,
        containerStyle,
        Shadows.sm,
        style,
      ]}
    >
      {/* Top Row: Icon + Title + Lock/Checkmark */}
      <View style={styles.headerRow}>
        {/* Badge Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: earned
                ? categoryColor + '20'
                : colors.background.tertiary || colors.background.secondary,
            },
          ]}
        >
          <Text style={styles.badgeEmoji}>{badge.icon}</Text>
        </View>

        {/* Title and Description */}
        <View style={styles.titleSection}>
          <Text
            style={[
              styles.badgeName,
              {
                color: colors.text.primary,
                opacity: earned ? 1 : 0.7,
              },
            ]}
          >
            {badge.name}
          </Text>
          <Text
            style={[
              styles.badgeCategory,
              {
                color: categoryColor,
              },
            ]}
          >
            {badge.category.charAt(0).toUpperCase() + badge.category.slice(1)}
          </Text>
        </View>

        {/* Status Indicator */}
        {earned ? (
          <View
            style={[
              styles.earnedBadge,
              {
                backgroundColor: categoryColor + '20',
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={categoryColor}
            />
          </View>
        ) : (
          <View
            style={[
              styles.lockedBadge,
              {
                backgroundColor: colors.background.tertiary || colors.background.secondary,
              },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={24}
              color={colors.text.secondary}
            />
          </View>
        )}
      </View>

      {/* Earned Date (if applicable) */}
      {earned && earnedDate && (
        <Text
          style={[
            styles.earnedDate,
            {
              color: colors.text.secondary,
            },
          ]}
        >
          Earned {formatEarnedDate()}
        </Text>
      )}

      {/* Progress Bar Section */}
      {!earned && (
        <>
          {/* Progress Description */}
          <Text
            style={[
              styles.progressDescription,
              {
                color: colors.text.secondary,
              },
            ]}
          >
            {badge.description}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarBackground,
                {
                  backgroundColor: colors.background.tertiary || colors.background.secondary,
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: categoryColor,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressPercentage,
                {
                  color: colors.text.secondary,
                },
              ]}
            >
              {progressPercentage}%
            </Text>
          </View>

          {/* Progress Details */}
          <Text
            style={[
              styles.progressDetails,
              {
                color: colors.text.secondary,
              },
            ]}
          >
            {getProgressLabel()}
          </Text>
        </>
      )}

      {/* Earned Description */}
      {earned && (
        <Text
          style={[
            styles.earnedDescription,
            {
              color: colors.text.secondary,
            },
          ]}
        >
          {badge.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginVertical: Spacing.sm,
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  // Icon Container
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },

  badgeEmoji: {
    fontSize: 32,
  },

  // Title Section
  titleSection: {
    flex: 1,
  },

  badgeName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs / 2,
  },

  badgeCategory: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },

  // Status Indicators
  earnedBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockedBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Earned Date
  earnedDate: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
    marginLeft: 72, // Align with content below icon
  },

  // Progress Section (Unearned)
  progressDescription: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    marginLeft: 72, // Align with content
    lineHeight: 18,
  },

  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: 72, // Align with content
    marginBottom: Spacing.sm,
  },

  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  progressPercentage: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    minWidth: 32,
    textAlign: 'right',
  },

  // Progress Details
  progressDetails: {
    fontSize: FontSizes.xs,
    marginLeft: 72, // Align with content
    fontWeight: FontWeights.medium,
  },

  // Earned Description
  earnedDescription: {
    fontSize: FontSizes.sm,
    marginLeft: 72, // Align with content
    lineHeight: 18,
  },
});
