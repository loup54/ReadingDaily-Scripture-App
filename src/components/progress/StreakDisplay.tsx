/**
 * Streak Display Component
 *
 * Displays the user's current reading streak with visual indicators
 * Features animated fire emoji and color-coded streak levels
 * Phase E: Progress Tracking (Task 2.1)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

export interface StreakDisplayProps {
  /**
   * Current reading streak (number of consecutive days)
   */
  currentStreak: number;

  /**
   * All-time longest streak (for comparison)
   */
  longestStreak: number;

  /**
   * Date of the last reading
   */
  lastReadingDate: Date;

  /**
   * Optional style override
   */
  style?: ViewStyle;

  /**
   * Callback when streak is pressed
   */
  onPress?: () => void;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  longestStreak,
  lastReadingDate,
  style,
  onPress,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /**
   * Animate fire emoji with gentle scale pulse
   * Creates breathing effect
   */
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [scaleAnim]);

  /**
   * Determine streak color based on length
   * - 1-6 days: Orange (starting out)
   * - 7-29 days: Red (building momentum)
   * - 30+ days: Purple (impressive streak)
   */
  const getStreakColor = (): string => {
    if (currentStreak >= 30) return '#A855F7'; // Purple
    if (currentStreak >= 7) return '#DC2626'; // Red
    return '#EA580C'; // Orange
  };

  /**
   * Format last reading date for display
   */
  const formatLastReadingDate = (): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday =
      lastReadingDate.toDateString() === today.toDateString();
    const isYesterday =
      lastReadingDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    // Otherwise show date
    return lastReadingDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Calculate days until streak resets
   * Streak resets after 2 days of no reading
   */
  const getDaysUntilReset = (): number | null => {
    const today = new Date();
    const lastReading = new Date(lastReadingDate);
    const daysSinceReading = Math.floor(
      (today.getTime() - lastReading.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceReading === 0) {
      // Read today, streak is safe (1 day to go)
      return 1;
    } else if (daysSinceReading === 1) {
      // Didn't read today but read yesterday, 1 day left
      return 1;
    } else {
      // Streak already reset
      return null;
    }
  };

  const streakColor = getStreakColor();
  const lastReadingDateStr = formatLastReadingDate();
  const daysUntilReset = getDaysUntilReset();

  return (
    <LinearGradient
      colors={[
        colors.background.card,
        colors.background.secondary || colors.background.card,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, Shadows.lg, style]}
    >
      {/* Fire Emoji Animation */}
      <Animated.View
        style={[
          styles.fireEmojiContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.fireEmoji}>🔥</Text>
      </Animated.View>

      {/* Streak Number */}
      <Text
        style={[
          styles.streakNumber,
          {
            color: streakColor,
          },
        ]}
      >
        {currentStreak}
      </Text>

      {/* "DAYS" Label */}
      <Text
        style={[
          styles.daysLabel,
          {
            color: colors.text.secondary,
          },
        ]}
      >
        {currentStreak === 1 ? 'DAY' : 'DAYS'}
      </Text>

      {/* Status Divider */}
      <View
        style={[
          styles.divider,
          {
            backgroundColor: colors.ui.border,
          },
        ]}
      />

      {/* Stats Section */}
      <View style={styles.statsSection}>
        {/* Last Reading */}
        <View style={styles.statItem}>
          <Text
            style={styles.statLabel}
          >
            Last Reading
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.text.primary,
              },
            ]}
          >
            {lastReadingDateStr}
          </Text>
        </View>

        {/* Days Until Reset (if applicable) */}
        {daysUntilReset !== null && (
          <>
            <View
              style={[
                styles.dividerVertical,
                {
                  backgroundColor: colors.ui.border,
                },
              ]}
            />
            <View style={styles.statItem}>
              <Text
                style={styles.statLabel}
              >
                Before Reset
              </Text>
              <Text
                style={[
                  styles.streakWarning,
                  {
                    color: daysUntilReset === 1 ? '#DC2626' : '#F59E0B',
                  },
                ]}
              >
                {daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Longest Streak */}
      {longestStreak > 0 && (
        <>
          <View
            style={[
              styles.divider,
              {
                backgroundColor: colors.ui.border,
              },
            ]}
          />
          <View style={styles.longestStreakSection}>
            <Text
              style={styles.longestStreakLabel}
            >
              Longest Streak
            </Text>
            <Text
              style={[
                styles.longestStreakValue,
                {
                  color: longestStreak > currentStreak ? '#A855F7' : streakColor,
                },
              ]}
            >
              {longestStreak} days
            </Text>
          </View>
        </>
      )}

      {/* Optional Streak Level Badge */}
      {currentStreak > 0 && (
        <View
          style={[
            styles.levelBadge,
            {
              backgroundColor: streakColor + '15',
            },
          ]}
        >
          <Text
            style={[
              styles.levelBadgeText,
              {
                color: streakColor,
              },
            ]}
          >
            {currentStreak >= 30
              ? '🌟 Legendary Streak'
              : currentStreak >= 7
              ? '🔥 On Fire'
              : '⚡ Getting Started'}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },

  // Fire Emoji Animation
  fireEmojiContainer: {
    marginBottom: Spacing.sm,
  },
  fireEmoji: {
    fontSize: 72,
  },

  // Streak Number Display
  streakNumber: {
    fontSize: 56,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },

  // Days Label
  daysLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },

  // Divider
  divider: {
    width: '100%',
    height: 1,
    marginVertical: Spacing.md,
  },

  // Stats Section
  statsSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },

  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },

  statValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },

  streakWarning: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },

  dividerVertical: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.sm,
  },

  // Longest Streak Section
  longestStreakSection: {
    alignItems: 'center',
    width: '100%',
  },

  longestStreakLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },

  longestStreakValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },

  // Level Badge
  levelBadge: {
    width: '100%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },

  levelBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
  },
});
