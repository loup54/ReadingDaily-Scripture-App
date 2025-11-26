/**
 * Badge Definitions
 *
 * Defines all available badges that users can earn
 * Organized by category: frequency, streak, consistency, engagement
 *
 * Phase E: Progress Tracking
 * Created: November 8, 2025
 */

import { Badge } from '@/src/types/progress.types';

/**
 * All available badges in the system
 *
 * Organized by category:
 * - frequency: Earned by completing a certain number of readings
 * - streak: Earned by maintaining consecutive days of reading
 * - consistency: Earned by maintaining reading consistency over time
 * - engagement: Earned by using specific features (audio, pronunciation, etc.)
 */
export const BADGES: Record<string, Badge> = {
  /**
   * FREQUENCY BADGES
   * Earned by completing a certain number of readings
   */

  /**
   * Bronze Reader Badge
   *
   * 🥉 Bronze Reader
   * "Complete your first reading"
   *
   * Requirements: 1 reading completed
   * Category: Frequency
   *
   * This is the entry-level badge awarded when a user completes their
   * very first reading. It serves as an achievement milestone and
   * encourages continued engagement.
   */
  BRONZE_READER: {
    id: 'bronze_reader',
    name: 'Bronze Reader',
    description: 'Complete your first reading',
    icon: '🥉',
    category: 'frequency',
    requirement: {
      type: 'readings',
      value: 1,
    },
  },

  /**
   * Silver Reader Badge
   *
   * 🥈 Silver Reader
   * "Complete 10 readings"
   *
   * Requirements: 10 readings completed
   * Category: Frequency
   *
   * Awarded after a user has completed 10 readings total.
   * Represents developing the reading habit.
   */
  SILVER_READER: {
    id: 'silver_reader',
    name: 'Silver Reader',
    description: 'Complete 10 readings',
    icon: '🥈',
    category: 'frequency',
    requirement: {
      type: 'readings',
      value: 10,
    },
  },

  /**
   * Gold Reader Badge
   *
   * 🏅 Gold Reader
   * "Complete 50 readings"
   *
   * Requirements: 50 readings completed
   * Category: Frequency
   *
   * Awarded after a user has completed 50 readings total.
   * Represents serious engagement and commitment.
   */
  GOLD_READER: {
    id: 'gold_reader',
    name: 'Gold Reader',
    description: 'Complete 50 readings',
    icon: '🏅',
    category: 'frequency',
    requirement: {
      type: 'readings',
      value: 50,
    },
  },

  /**
   * Platinum Reader Badge
   *
   * 💎 Platinum Reader
   * "Complete 100 readings"
   *
   * Requirements: 100 readings completed
   * Category: Frequency
   *
   * Awarded after a user has completed 100 readings total.
   * Represents exceptional dedication to daily scripture reading.
   * This is a major milestone achievement.
   */
  PLATINUM_READER: {
    id: 'platinum_reader',
    name: 'Platinum Reader',
    description: 'Complete 100 readings',
    icon: '💎',
    category: 'frequency',
    requirement: {
      type: 'readings',
      value: 100,
    },
  },

  /**
   * STREAK BADGES
   * Earned by maintaining consecutive days of reading
   */

  /**
   * Week Warrior Badge
   *
   * ⚔️ Week Warrior
   * "Achieve a 7-day reading streak"
   *
   * Requirements: 7 consecutive days of reading
   * Category: Streak
   *
   * Awarded when a user reads for 7 consecutive days.
   * Represents the ability to form and maintain a weekly habit.
   * A significant psychological milestone in habit formation.
   */
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day reading streak',
    icon: '⚔️',
    category: 'streak',
    requirement: {
      type: 'consecutive_days',
      value: 7,
    },
  },

  /**
   * Month Master Badge
   *
   * 👑 Month Master
   * "Achieve a 30-day reading streak"
   *
   * Requirements: 30 consecutive days of reading
   * Category: Streak
   *
   * Awarded when a user reads for 30 consecutive days.
   * Represents completing an entire month of consistent reading.
   * A major achievement in habit formation (studies show 21-30 days to form habit).
   */
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: 'Achieve a 30-day reading streak',
    icon: '👑',
    category: 'streak',
    requirement: {
      type: 'consecutive_days',
      value: 30,
    },
  },

  /**
   * Year Round Badge
   *
   * 🌟 Year Round
   * "Achieve a 365-day reading streak"
   *
   * Requirements: 365 consecutive days of reading
   * Category: Streak
   *
   * Awarded when a user reads for 365 consecutive days (1 full year).
   * This is the highest achievement possible in streak tracking.
   * Represents exceptional dedication to daily scripture reading.
   * An aspirational goal for deeply committed users.
   */
  YEAR_ROUND: {
    id: 'year_round',
    name: 'Year Round',
    description: 'Achieve a 365-day reading streak',
    icon: '🌟',
    category: 'streak',
    requirement: {
      type: 'consecutive_days',
      value: 365,
    },
  },

  /**
   * CONSISTENCY BADGES
   * Earned by maintaining reading consistency over time
   */

  /**
   * Comeback King Badge
   *
   * 🚀 Comeback King
   * "Return after 7-day break and build 7 new days"
   *
   * Requirements: Current streak of 7+ days after a 7+ day gap
   * Category: Consistency
   *
   * Awarded when a user takes a 7+ day break from reading but then
   * returns and builds a new 7-day streak.
   *
   * This badge recognizes resilience and the ability to restart habits.
   * It's designed to encourage users who have fallen off to re-engage
   * with the app and rebuild their reading practice.
   *
   * Implementation note:
   * This requires tracking:
   * 1. Previous streak (before the break)
   * 2. Gap length (7+ days with no reading)
   * 3. New streak (7+ consecutive days after resuming)
   *
   * Could be awarded when:
   * - currentStreak >= 7
   * - AND days since last reading was >= 7 (but now they've read for 7 consecutive days)
   */
  COMEBACK_KING: {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Return after 7-day break and build 7 new days',
    icon: '🚀',
    category: 'consistency',
    requirement: {
      type: 'consecutive_days',
      value: 7,
    },
  },

  /**
   * ENGAGEMENT BADGES (Future Enhancements)
   *
   * These badges are defined but not yet fully implemented.
   * They require additional feature tracking (audio usage, pronunciation practice, etc.)
   *
   * These could be implemented in Phase E+:
   *
   * AUDIO_EXPLORER: Use audio playback 5+ times
   * PRONUNCIATION_PRO: Practice pronunciation 10+ times
   * BOOKWORM: Add 5+ bookmarks
   * CONSISTENT_READER: Read at least 20 days in a month
   *
   * Currently, only reading-based badges are tracked.
   * Feature-usage badges would require:
   * - Enhanced ReadingRecord to track which features were used
   * - Aggregation logic in ProgressService for feature tracking
   * - UI updates to show progress on engagement badges
   */
};

/**
 * Get badge by ID
 *
 * @param badgeId - The badge ID
 * @returns Badge definition or undefined if not found
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES[badgeId as keyof typeof BADGES];
}

/**
 * Get all badges of a specific category
 *
 * @param category - The badge category
 * @returns Array of badges in that category
 */
export function getBadgesByCategory(
  category: 'frequency' | 'streak' | 'consistency' | 'engagement'
): Badge[] {
  return Object.values(BADGES).filter((badge) => badge.category === category);
}

/**
 * Get all badges sorted by difficulty
 *
 * Sorted by requirement value (easiest to hardest)
 *
 * @returns Array of badges sorted by difficulty
 */
export function getBadgesByDifficulty(): Badge[] {
  return Object.values(BADGES).sort((a, b) => a.requirement.value - b.requirement.value);
}

/**
 * Badge Progress Map
 *
 * Quick reference for badge organization
 */
export const BADGE_CATEGORIES = {
  FREQUENCY: [BADGES.BRONZE_READER, BADGES.SILVER_READER, BADGES.GOLD_READER, BADGES.PLATINUM_READER],
  STREAK: [BADGES.WEEK_WARRIOR, BADGES.MONTH_MASTER, BADGES.YEAR_ROUND],
  CONSISTENCY: [BADGES.COMEBACK_KING],
  ENGAGEMENT: [],
};

/**
 * Badge progression path for frequency badges
 *
 * Recommended order for users to pursue
 */
export const FREQUENCY_PROGRESSION = [
  { badge: BADGES.BRONZE_READER, milestone: '1st reading' },
  { badge: BADGES.SILVER_READER, milestone: '10 readings' },
  { badge: BADGES.GOLD_READER, milestone: '50 readings' },
  { badge: BADGES.PLATINUM_READER, milestone: '100 readings' },
];

/**
 * Badge progression path for streak badges
 *
 * Recommended order for users to pursue
 */
export const STREAK_PROGRESSION = [
  { badge: BADGES.WEEK_WARRIOR, milestone: '1 week' },
  { badge: BADGES.MONTH_MASTER, milestone: '1 month' },
  { badge: BADGES.YEAR_ROUND, milestone: '1 year' },
];

/**
 * Total number of badges available
 */
export const TOTAL_BADGES = Object.keys(BADGES).length; // 8 badges

/**
 * Export badge IDs as constants for type safety
 */
export const BADGE_IDS = {
  BRONZE_READER: 'bronze_reader',
  SILVER_READER: 'silver_reader',
  GOLD_READER: 'gold_reader',
  PLATINUM_READER: 'platinum_reader',
  WEEK_WARRIOR: 'week_warrior',
  MONTH_MASTER: 'month_master',
  YEAR_ROUND: 'year_round',
  COMEBACK_KING: 'comeback_king',
} as const;
