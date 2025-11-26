/**
 * Subscription Types
 *
 * Defines subscription tiers and features for the freemium model:
 * - FREE: 10 min/day practice, basic feedback only
 * - BASIC: Unlimited practice, full AI feedback ($2.99/month)
 */

export type SubscriptionTier = 'free' | 'basic';

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'cancelled' | 'expired';

/**
 * Feature set available for each subscription tier
 */
export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  maxDailyMinutes: number; // 10 for free, unlimited (Infinity) for basic
  fullFeedback: boolean; // false for free, true for basic
  wordLevelAnalysis: boolean; // false for free, true for basic
  phonemeBreakdown: boolean; // false for free, true for basic
  prosodyAnalysis: boolean; // false for free, true for basic
  audioComparison: boolean; // false for free, true for basic
  canAccessAllTabs: boolean; // false for free (overview only), true for basic
}

/**
 * Subscription information stored in state
 */
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate?: number; // Timestamp when subscription started
  endDate?: number; // Timestamp when subscription ends (for auto-renew)
  autoRenewEnabled: boolean;
  lastBillingDate?: number;
  nextBillingDate?: number;
  provider?: 'apple' | 'google' | 'stripe' | 'mock'; // Payment provider
  subscriptionId?: string; // Subscription ID from provider
  productId?: string; // Product ID (e.g., 'basic_monthly_subscription')
  transactionId?: string; // Transaction ID from purchase
}

/**
 * Daily usage tracking
 */
export interface DailyUsage {
  date: string; // ISO string, e.g., '2025-11-15'
  practiceMinutesUsed: number; // How many minutes used today
  sessionsCount: number; // Number of practice sessions
  lastResetDate: number; // Timestamp of last reset (midnight)
}

/**
 * Feature set for each tier - constant mapping
 */
export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    tier: 'free',
    maxDailyMinutes: 10,
    fullFeedback: false,
    wordLevelAnalysis: false,
    phonemeBreakdown: false,
    prosodyAnalysis: false,
    audioComparison: false,
    canAccessAllTabs: false,
  },
  basic: {
    tier: 'basic',
    maxDailyMinutes: Infinity,
    fullFeedback: true,
    wordLevelAnalysis: true,
    phonemeBreakdown: true,
    prosodyAnalysis: true,
    audioComparison: true,
    canAccessAllTabs: true,
  },
};

/**
 * Product ID constants
 */
export const SUBSCRIPTION_PRODUCTS = {
  BASIC_MONTHLY: 'basic_monthly_subscription',
  BASIC_YEARLY: 'basic_yearly_subscription', // Future
} as const;

/**
 * Pricing constants
 */
export const SUBSCRIPTION_PRICING = {
  BASIC_MONTHLY_USD: 2.99,
  BASIC_YEARLY_USD: 27.99, // 2 months free vs monthly
} as const;

/**
 * Get features for a given tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): SubscriptionFeatures {
  return TIER_FEATURES[tier];
}

/**
 * Check if tier has a specific feature
 */
export function tierHasFeature(
  tier: SubscriptionTier,
  feature: keyof Omit<SubscriptionFeatures, 'tier'>
): boolean {
  const features = TIER_FEATURES[tier];
  return features[feature as keyof SubscriptionFeatures] as boolean;
}

/**
 * ============================================================================
 * PHASE 10C: USER PROFILES & ACHIEVEMENTS
 * User profile data, achievements, statistics, and progress tracking
 * ============================================================================
 */

/**
 * User language preference type
 */
export type LanguagePreference = 'en' | 'es' | 'fr';

/**
 * Difficulty level (1-5 scale)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Achievement rarity level
 */
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Achievement category
 */
export type AchievementCategory = 'milestone' | 'challenge' | 'streak' | 'perfection';

/**
 * Engagement trend direction
 */
export type EngagementTrend = 'up' | 'down' | 'flat';

/**
 * Time range for statistics
 */
export type StatisticsTimeRange = 'week' | 'month' | 'all';

/**
 * User profile - complete user information and preferences
 */
export interface UserProfile {
  // Identity
  userId: string; // Unique user ID from Firebase Auth
  email: string; // User email
  displayName: string; // User display name
  avatar?: string; // Avatar URL or base64 encoded image
  createdAt: number; // Timestamp when profile was created
  updatedAt: number; // Last profile update timestamp

  // Subscription info (cross-reference with SubscriptionInfo)
  currentTier: SubscriptionTier;
  subscriptionStartDate?: number; // Timestamp
  subscriptionEndDate?: number; // Timestamp
  totalSpent: number; // Total amount spent (USD cents)

  // Statistics aggregates
  totalSessions: number; // Total practice sessions
  totalMinutes: number; // Total practice minutes
  averageScore: number; // Average score across all sessions (0-100)
  bestScore: number; // Best single session score
  streakDays: number; // Current streak length (days)
  lastPracticeDate?: number; // Last practice session timestamp

  // Progress
  readingsCompleted: number; // Total readings completed
  readingsAttempted: number; // Total readings attempted
  uniqueReadingsCount: number; // Count of unique readings practiced

  // Engagement preferences
  preferences: {
    language: LanguagePreference;
    difficultyPreference: DifficultyLevel;
    dailyReminder: boolean;
    reminderTime: string; // Format: "HH:MM" e.g., "08:00"
    emailNotifications: boolean;
    pushNotifications: boolean;
  };

  // Achievements
  totalAchievementPoints: number; // Cumulative achievement points
  unlockedAchievementCount: number; // Number of unlocked achievements
}

/**
 * Achievement definition and user unlock status
 */
export interface Achievement {
  id: string; // Unique achievement ID
  name: string; // Display name e.g., "First Session"
  description: string; // Description e.g., "Complete your first practice session"
  icon: string; // Emoji or icon identifier
  category: AchievementCategory;

  // Unlock requirement
  requirement: {
    type: 'count' | 'score' | 'streak'; // Type of requirement
    value: number; // Value to unlock (e.g., 1 session, 100 score, 7 days)
  };

  // Metadata
  rarity: AchievementRarity; // Rarity level affects visual presentation
  points: number; // Points awarded for unlocking (gamification)
  unlockedAt?: number; // Timestamp when unlocked (undefined if locked)
  progress?: number; // Current progress toward unlock (0-value)

  // Display
  hiddenUntilUnlocked: boolean; // If true, name/desc hidden until earned
  displayOrder: number; // Sort order in achievement gallery
}

/**
 * User statistics - detailed performance metrics
 */
export interface Statistics {
  // Time-based data
  sessionsByDay: Array<{ date: string; count: number }>; // ISO date, session count
  scoresByDay: Array<{ date: string; average: number }>; // ISO date, avg score
  minutesByDay: Array<{ date: string; total: number }>; // ISO date, total minutes

  // Dimension scores (0-100)
  averageAccuracy: number; // Pronunciation accuracy
  averageFluency: number; // Speaking fluency
  averageCompleteness: number; // Reading completeness
  averageProsody: number; // Intonation and prosody

  // Trends
  scoreProgress: number; // % improvement over time
  engagementTrend: EngagementTrend; // Trend direction
  averageSessionDuration: number; // Minutes per session

  // Time period covered
  timeRange: StatisticsTimeRange;
  startDate: string; // ISO date
  endDate: string; // ISO date
}

/**
 * User achievements summary
 */
export interface AchievementStats {
  total: number; // Total achievements available
  unlocked: number; // Number unlocked by user
  points: number; // Total points earned
  lockedCount: number; // Number still locked
  progressPercentage: number; // % of achievements unlocked (0-100)
  nextAchievement?: {
    id: string;
    name: string;
    progress: number;
    requirement: number;
  };
}

/**
 * User profile update request (partial profile)
 */
export interface ProfileUpdate {
  displayName?: string;
  avatar?: string;
  preferences?: Partial<UserProfile['preferences']>;
  // Note: Subscription info updated separately
}

/**
 * Achievement unlock event
 */
export interface AchievementUnlockedEvent {
  userId: string;
  achievementId: string;
  achievementName: string;
  timestamp: number;
  pointsAwarded: number;
}

/**
 * Default achievement definitions (seed data)
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // Milestone achievements
  {
    id: 'first_session',
    name: 'First Step',
    description: 'Complete your first practice session',
    icon: '🎯',
    category: 'milestone',
    requirement: { type: 'count', value: 1 },
    rarity: 'common',
    points: 10,
    hiddenUntilUnlocked: false,
    displayOrder: 1,
  },
  {
    id: 'ten_sessions',
    name: 'Getting Started',
    description: 'Complete 10 practice sessions',
    icon: '📚',
    category: 'milestone',
    requirement: { type: 'count', value: 10 },
    rarity: 'common',
    points: 25,
    hiddenUntilUnlocked: false,
    displayOrder: 2,
  },
  {
    id: 'fifty_sessions',
    name: 'Dedicated Learner',
    description: 'Complete 50 practice sessions',
    icon: '🔥',
    category: 'milestone',
    requirement: { type: 'count', value: 50 },
    rarity: 'rare',
    points: 50,
    hiddenUntilUnlocked: false,
    displayOrder: 3,
  },
  {
    id: 'hundred_sessions',
    name: 'Master Practitioner',
    description: 'Complete 100 practice sessions',
    icon: '👑',
    category: 'milestone',
    requirement: { type: 'count', value: 100 },
    rarity: 'epic',
    points: 100,
    hiddenUntilUnlocked: true,
    displayOrder: 4,
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Practice 3 days in a row',
    icon: '⭐',
    category: 'streak',
    requirement: { type: 'streak', value: 3 },
    rarity: 'common',
    points: 15,
    hiddenUntilUnlocked: false,
    displayOrder: 5,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Practice 7 days in a row',
    icon: '🌟',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    rarity: 'rare',
    points: 40,
    hiddenUntilUnlocked: false,
    displayOrder: 6,
  },
  {
    id: 'streak_30',
    name: 'Month Master',
    description: 'Practice 30 days in a row',
    icon: '🎖️',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    rarity: 'epic',
    points: 75,
    hiddenUntilUnlocked: true,
    displayOrder: 7,
  },

  // Perfection achievements
  {
    id: 'perfect_score_once',
    name: 'Flawless First',
    description: 'Achieve a perfect score (100) once',
    icon: '💯',
    category: 'perfection',
    requirement: { type: 'score', value: 100 },
    rarity: 'rare',
    points: 50,
    hiddenUntilUnlocked: false,
    displayOrder: 8,
  },
  {
    id: 'perfect_score_five',
    name: 'Perfect Performer',
    description: 'Achieve a perfect score 5 times',
    icon: '✨',
    category: 'perfection',
    requirement: { type: 'count', value: 5 },
    rarity: 'epic',
    points: 75,
    hiddenUntilUnlocked: true,
    displayOrder: 9,
  },

  // Challenge achievements
  {
    id: 'challenge_difficulty_5',
    name: 'Challenge Master',
    description: 'Complete 10 readings at difficulty level 5',
    icon: '🏆',
    category: 'challenge',
    requirement: { type: 'count', value: 10 },
    rarity: 'legendary',
    points: 100,
    hiddenUntilUnlocked: true,
    displayOrder: 10,
  },
];

/**
 * Create default user profile
 */
export function createDefaultUserProfile(userId: string, email: string): UserProfile {
  return {
    userId,
    email,
    displayName: email.split('@')[0],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentTier: 'free',
    totalSpent: 0,
    totalSessions: 0,
    totalMinutes: 0,
    averageScore: 0,
    bestScore: 0,
    streakDays: 0,
    readingsCompleted: 0,
    readingsAttempted: 0,
    uniqueReadingsCount: 0,
    preferences: {
      language: 'en',
      difficultyPreference: 3,
      dailyReminder: true,
      reminderTime: '08:00',
      emailNotifications: true,
      pushNotifications: true,
    },
    totalAchievementPoints: 0,
    unlockedAchievementCount: 0,
  };
}
