/**
 * Progress Tracking Types
 *
 * Defines all TypeScript interfaces for the progress tracking system
 * including streaks, badges, and reading history.
 *
 * Phase E: Progress Tracking
 * Created: November 8, 2025
 */

/**
 * Badge Definition
 *
 * Represents a badge that users can earn by meeting specific requirements
 */
export interface Badge {
  /** Unique identifier for the badge */
  id: string;

  /** Display name of the badge */
  name: string;

  /** Description of what the badge represents */
  description: string;

  /** Emoji icon for the badge */
  icon: string;

  /** Category of the badge for grouping/filtering */
  category: 'frequency' | 'streak' | 'consistency' | 'engagement';

  /** Requirement to unlock this badge */
  requirement: BadgeRequirement;
}

/**
 * Badge Requirement
 *
 * Defines the condition needed to unlock a badge
 */
export interface BadgeRequirement {
  /** Type of requirement */
  type: 'readings' | 'consecutive_days' | 'calendar_days' | 'feature_usage';

  /** Numeric value required (e.g., 10 readings, 7 days) */
  value: number;
}

/**
 * Badge Progress
 *
 * Tracks user's progress towards earning a specific badge
 */
export interface BadgeProgress {
  /** Reference to the badge */
  badgeId: string;

  /** Current progress value (e.g., 5 readings out of 10) */
  current: number;

  /** Required value to unlock the badge */
  required: number;

  /** Whether the badge has been earned */
  earned: boolean;

  /** Date when the badge was earned (if earned) */
  earnedDate?: Date;
}

/**
 * Streak Data
 *
 * Represents the user's reading streak information
 */
export interface StreakData {
  /** Number of consecutive days the user has read */
  currentStreak: number;

  /** User's longest streak to date */
  longestStreak: number;

  /** Date of the last reading */
  lastReadingDate: Date;

  /** Total number of readings completed */
  totalReadings: number;

  /** Total number of unique days with readings */
  totalDays: number;

  /** Date when the user joined/created account */
  joinedDate: Date;

  /** Timestamp of last update */
  lastUpdated: Date;
}

/**
 * Reading Record
 *
 * Represents a single day's reading activity
 */
export interface ReadingRecord {
  /** Date of the reading (YYYY-MM-DD format) */
  date: string;

  /** Type of reading completed */
  readingType: 'full' | 'quick';

  /** Timestamp when reading was recorded */
  timestamp: Date;

  /** Number of readings (Gospel + First Reading + Psalm = 3) */
  readingCount: number;

  /** Whether audio was used during reading */
  audioUsed: boolean;

  /** Whether pronunciation practice was used */
  pronunciationUsed: boolean;

  /** Duration of reading in seconds */
  duration: number;
}

/**
 * Progress Statistics
 *
 * Aggregate statistics about user's reading progress
 */
export interface ProgressStats {
  /** Total readings completed */
  totalReadings: number;

  /** Number of unique days with readings */
  uniqueDaysRead: number;

  /** Number of readings this month */
  currentMonthReadings: number;

  /** Consistency score (0-100) - percentage of days with readings */
  consistency: number;
}

/**
 * Progress Data
 *
 * Complete progress information for a user
 * This is the main data structure returned by ProgressService
 */
export interface ProgressData {
  /** User's streak information */
  streaks: StreakData;

  /** Array of badge progress */
  badges: BadgeProgress[];

  /** Reading records by date */
  readings: Record<string, ReadingRecord>;

  /** Aggregate statistics */
  stats: ProgressStats;
}

/**
 * Firestore Progress Collection Structure
 *
 * /users/{userId}/progress/streaks
 * Documents the user's streak information
 */
export interface FirestoreStreaksData {
  currentStreak: number;
  longestStreak: number;
  lastReadingDate: FirebaseTimestamp;
  totalReadings: number;
  totalDays: number;
  joinedDate: FirebaseTimestamp;
  lastUpdated: FirebaseTimestamp;
}

/**
 * Firestore Badge Collection Structure
 *
 * /users/{userId}/progress/badges
 * Documents the user's badge progress
 */
export interface FirestoreBadgeData {
  [badgeId: string]: {
    earned: boolean;
    earnedDate?: FirebaseTimestamp;
    progress: {
      current: number;
      required: number;
    };
  };
}

/**
 * Firestore Reading Record Structure
 *
 * /users/{userId}/progress/readings/{date}
 * Documents a single day's reading activity
 */
export interface FirestoreReadingData {
  date: string;
  readingType: 'full' | 'quick';
  timestamp: FirebaseTimestamp;
  readingCount: number;
  audioUsed: boolean;
  pronunciationUsed: boolean;
  duration: number;
}

/**
 * Firebase Timestamp
 * Represents a Firestore timestamp
 */
export type FirebaseTimestamp = any; // In practice, import from firebase/firestore

/**
 * Badge Category Type
 * Used for filtering badges by type
 */
export type BadgeCategory = 'frequency' | 'streak' | 'consistency' | 'engagement';

/**
 * Requirement Type
 * Defines what type of condition triggers badge awards
 */
export type RequirementType = 'readings' | 'consecutive_days' | 'calendar_days' | 'feature_usage';

/**
 * Reading Type
 * Categorizes the type of reading session
 */
export type ReadingType = 'full' | 'quick';

/**
 * Progress Error Type
 * Represents possible errors in progress operations
 */
export class ProgressError extends Error {
  constructor(
    public code: 'CALCULATION_ERROR' | 'FIRESTORE_ERROR' | 'INVALID_DATA' | 'NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'ProgressError';
  }
}
