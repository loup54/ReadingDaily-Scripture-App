/**
 * Notification Types & Schema
 * Phase 10B.1: Push Notifications System
 *
 * Comprehensive type definitions for push notifications:
 * - Notification types and priorities
 * - User notification preferences
 * - Notification scheduling
 * - Notification history/tracking
 */

/**
 * Notification type enum
 */
export enum NotificationType {
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  DAILY_REMINDER = 'daily_reminder',
  STREAK_MILESTONE = 'streak_milestone',
  NEW_READING = 'new_reading',
  CHALLENGE_INVITE = 'challenge_invite',
  PRACTICE_REMINDER = 'practice_reminder',
  PERFORMANCE_INSIGHT = 'performance_insight',
  MOTIVATIONAL = 'motivational',
  SYSTEM = 'system',
  ACCOUNT_ALERT = 'account_alert',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Notification delivery channel
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  IN_APP = 'in_app',
  MULTI = 'multi', // Multiple channels
}

/**
 * Notification action type
 */
export enum NotificationActionType {
  NAVIGATE = 'navigate',
  OPEN_MODAL = 'open_modal',
  DISMISS = 'dismiss',
  SNOOZE = 'snooze',
  CUSTOM = 'custom',
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;

  // General settings
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;

  // Notification type preferences
  achievementNotifications: boolean;
  dailyReminderEnabled: boolean;
  reminderTime: string; // HH:MM format
  streakMilestoneNotifications: boolean;
  newReadingNotifications: boolean;
  challengeNotifications: boolean;
  practiceReminderNotifications: boolean;
  performanceInsights: boolean;
  motivationalMessages: boolean;

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format

  // Frequency settings
  notificationFrequency: 'realtime' | 'daily_digest' | 'weekly_digest';

  // Privacy
  trackingEnabled: boolean;
  analyticsEnabled: boolean;

  // Timestamps
  updatedAt: number;
  createdAt: number;
}

/**
 * Notification action
 */
export interface NotificationAction {
  id: string;
  label: string;
  type: NotificationActionType;
  target?: string; // Screen name, modal name, custom action
  icon?: string; // Icon/emoji
}

/**
 * Push notification payload
 */
export interface PushNotification {
  id: string;
  userId: string;

  // Content
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string; // Thumbnail/icon
  subtitle?: string;

  // Metadata
  priority: NotificationPriority;
  channel: NotificationChannel;
  badge: number; // Badge count

  // Actions
  actions: NotificationAction[];
  defaultAction?: NotificationAction;

  // Data
  data: {
    [key: string]: string | number | boolean;
  };

  // Delivery
  timestamp: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  expiresAt?: number; // Auto-dismiss time

  // Status
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;

  // Scheduling
  scheduledFor?: number; // Scheduled delivery timestamp
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    times: string[]; // HH:MM format
    daysOfWeek?: number[]; // 0-6
    endDate?: number;
  };
}

/**
 * In-app notification display format
 */
export interface InAppNotification {
  id: string;
  userId: string;

  // Display
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  displayStyle: 'banner' | 'toast' | 'modal' | 'dialog';

  // Timing
  showAt: number;
  dismissAt?: number;
  duration?: number; // Auto-dismiss after ms (0 = permanent)
  dismissible: boolean;

  // Interaction
  actions: NotificationAction[];
  onDismiss?: () => void;
  onAction?: (actionId: string) => void;

  // Styling
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  animationStyle?: 'fade' | 'slide' | 'bounce';
}

/**
 * Notification history entry
 */
export interface NotificationHistory {
  id: string;
  userId: string;

  // Reference to original notification
  notificationId: string;
  notificationType: NotificationType;

  // Content
  title: string;
  body: string;

  // Events
  sentAt: number;
  deliveredAt?: number;
  readAt?: number;
  actionTaken?: {
    actionId: string;
    actionType: NotificationActionType;
    timestamp: number;
  };
  dismissed: boolean;
  dismissedAt?: number;

  // Channel
  channel: NotificationChannel;

  // Engagement metrics
  timeToInteraction?: number; // ms from delivery to interaction
}

/**
 * Daily reminder configuration
 */
export interface DailyReminder {
  userId: string;
  enabled: boolean;
  time: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, Sunday = 0
  message: string;
  title: string;
  lastSentAt?: number;
  nextScheduledFor?: number;
}

/**
 * Notification template
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  bodyTemplate: string; // Can have {{placeholders}}
  priority: NotificationPriority;
  channel: NotificationChannel;
  imageUrl?: string;
  actions: NotificationAction[];
  data: {
    [key: string]: string;
  };
}

/**
 * Notification filter for history queries
 */
export interface NotificationFilter {
  userId: string;
  types?: NotificationType[];
  channels?: NotificationChannel[];
  status?: ('pending' | 'sent' | 'delivered' | 'read' | 'failed')[];
  dateRange?: {
    startDate: number;
    endDate: number;
  };
  unreadOnly?: boolean;
}

/**
 * Notification statistics
 */
export interface NotificationStats {
  userId: string;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalDismissed: number;
  totalFailed: number;

  // By type
  byType: {
    [key in NotificationType]?: {
      sent: number;
      read: number;
      dismissed: number;
    };
  };

  // Engagement metrics
  averageTimeToRead: number; // ms
  readRate: number; // percentage
  dismissRate: number; // percentage
  actionRate: number; // percentage

  // Time period
  period: 'week' | 'month' | 'all';
  startDate: number;
  endDate: number;
}

/**
 * Create default notification preferences
 */
export function createDefaultNotificationPreferences(
  userId: string
): NotificationPreferences {
  const now = Date.now();

  return {
    userId,
    pushNotificationsEnabled: true,
    emailNotificationsEnabled: false,
    inAppNotificationsEnabled: true,
    achievementNotifications: true,
    dailyReminderEnabled: true,
    reminderTime: '08:00',
    streakMilestoneNotifications: true,
    newReadingNotifications: true,
    challengeNotifications: true,
    practiceReminderNotifications: true,
    performanceInsights: true,
    motivationalMessages: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    notificationFrequency: 'realtime',
    trackingEnabled: true,
    analyticsEnabled: true,
    updatedAt: now,
    createdAt: now,
  };
}

/**
 * Default notification templates
 */
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'achievement_unlocked',
    type: NotificationType.ACHIEVEMENT_UNLOCKED,
    title: '🏆 Achievement Unlocked!',
    bodyTemplate: 'You just earned "{{achievementName}}" achievement! +{{points}} points',
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'view_achievement',
        label: 'View',
        type: NotificationActionType.NAVIGATE,
        target: 'ProfileScreen',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {
      screen: 'ProfileScreen',
      section: 'achievements',
    },
  },

  {
    id: 'daily_reminder',
    type: NotificationType.DAILY_REMINDER,
    title: '📖 Daily Practice Time',
    bodyTemplate:
      'Good {{timeOfDay}}! Time for today\'s Scripture reading practice. Keep your {{streakDays}}-day streak alive!',
    priority: NotificationPriority.NORMAL,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'start_practice',
        label: 'Start',
        type: NotificationActionType.NAVIGATE,
        target: 'PronunciationPracticeScreen',
      },
      {
        id: 'snooze',
        label: 'Later',
        type: NotificationActionType.SNOOZE,
      },
    ],
    data: {
      screen: 'PronunciationPracticeScreen',
    },
  },

  {
    id: 'streak_milestone',
    type: NotificationType.STREAK_MILESTONE,
    title: '🔥 Streak Milestone!',
    bodyTemplate: 'Amazing! You\'re on a {{streakDays}}-day streak! Keep it going!',
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'view_profile',
        label: 'View Profile',
        type: NotificationActionType.NAVIGATE,
        target: 'ProfileScreen',
      },
      {
        id: 'dismiss',
        label: 'Thanks',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {
      screen: 'ProfileScreen',
    },
  },

  {
    id: 'new_reading',
    type: NotificationType.NEW_READING,
    title: '📚 New Reading Available',
    bodyTemplate: 'A new Scripture reading is ready: {{readingTitle}}',
    priority: NotificationPriority.NORMAL,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'view_reading',
        label: 'View',
        type: NotificationActionType.NAVIGATE,
        target: 'ReadingScreen',
      },
      {
        id: 'dismiss',
        label: 'Later',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {
      screen: 'ReadingScreen',
    },
  },

  {
    id: 'performance_insight',
    type: NotificationType.PERFORMANCE_INSIGHT,
    title: '📊 Your Performance',
    bodyTemplate:
      'Your average accuracy improved by {{improvement}}% this week. Great progress!',
    priority: NotificationPriority.NORMAL,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'view_stats',
        label: 'View Stats',
        type: NotificationActionType.NAVIGATE,
        target: 'ProfileScreen',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {
      screen: 'ProfileScreen',
      section: 'statistics',
    },
  },

  {
    id: 'motivational_message',
    type: NotificationType.MOTIVATIONAL,
    title: '💪 Keep Going!',
    bodyTemplate:
      '{{message}} Your dedication to Scripture reading is inspiring!',
    priority: NotificationPriority.LOW,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'dismiss',
        label: 'Thanks',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {},
  },

  {
    id: 'system_maintenance',
    type: NotificationType.SYSTEM,
    title: '⚙️ System Notice',
    bodyTemplate: '{{message}} We appreciate your patience.',
    priority: NotificationPriority.NORMAL,
    channel: NotificationChannel.PUSH,
    actions: [
      {
        id: 'dismiss',
        label: 'OK',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {},
  },

  {
    id: 'account_security_alert',
    type: NotificationType.ACCOUNT_ALERT,
    title: '🔒 Account Alert',
    bodyTemplate: 'Your account just logged in from a new device: {{deviceName}}',
    priority: NotificationPriority.CRITICAL,
    channel: NotificationChannel.MULTI,
    actions: [
      {
        id: 'view_security',
        label: 'Review',
        type: NotificationActionType.NAVIGATE,
        target: 'SettingsScreen',
      },
      {
        id: 'dismiss',
        label: 'OK',
        type: NotificationActionType.DISMISS,
      },
    ],
    data: {
      screen: 'SettingsScreen',
      section: 'account_security',
    },
  },
];

/**
 * Helper function to create a push notification
 */
export function createPushNotification(
  userId: string,
  type: NotificationType,
  template: NotificationTemplate,
  variables?: { [key: string]: string | number }
): PushNotification {
  // Replace template variables
  let body = template.bodyTemplate;
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
  }

  return {
    id: `notif-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    title: template.title,
    body,
    priority: template.priority,
    channel: template.channel,
    badge: 1,
    actions: template.actions,
    data: {
      ...template.data,
      ...variables,
    },
    timestamp: Date.now(),
    status: 'pending',
  };
}

/**
 * Helper function to check if notification should be sent based on preferences
 */
export function shouldSendNotification(
  type: NotificationType,
  preferences: NotificationPreferences,
  channel: NotificationChannel = NotificationChannel.PUSH
): boolean {
  // Check if channel is enabled
  if (channel === NotificationChannel.PUSH && !preferences.pushNotificationsEnabled) {
    return false;
  }
  if (channel === NotificationChannel.EMAIL && !preferences.emailNotificationsEnabled) {
    return false;
  }
  if (channel === NotificationChannel.IN_APP && !preferences.inAppNotificationsEnabled) {
    return false;
  }

  // Check if notification type is enabled
  switch (type) {
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return preferences.achievementNotifications;
    case NotificationType.DAILY_REMINDER:
      return preferences.dailyReminderEnabled;
    case NotificationType.STREAK_MILESTONE:
      return preferences.streakMilestoneNotifications;
    case NotificationType.NEW_READING:
      return preferences.newReadingNotifications;
    case NotificationType.CHALLENGE_INVITE:
      return preferences.challengeNotifications;
    case NotificationType.PRACTICE_REMINDER:
      return preferences.practiceReminderNotifications;
    case NotificationType.PERFORMANCE_INSIGHT:
      return preferences.performanceInsights;
    case NotificationType.MOTIVATIONAL:
      return preferences.motivationalMessages;
    case NotificationType.SYSTEM:
      return true; // System notifications always shown
    case NotificationType.ACCOUNT_ALERT:
      return true; // Account alerts always shown
    default:
      return true;
  }
}

/**
 * Helper function to check if notification is within quiet hours
 */
export function isInQuietHours(
  preferences: NotificationPreferences,
  timestamp: number = Date.now()
): boolean {
  if (!preferences.quietHoursEnabled) {
    return false;
  }

  const date = new Date(timestamp);
  const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;

  const startTime = preferences.quietHoursStart;
  const endTime = preferences.quietHoursEnd;

  // Handle case where quiet hours span midnight
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Helper function to format notification for display
 */
export function formatNotificationForDisplay(notification: PushNotification): string {
  return `${notification.title}\n${notification.body}`;
}
