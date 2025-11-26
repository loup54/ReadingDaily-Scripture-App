/**
 * Debug Helper: Create Test Notifications
 *
 * This file helps populate the notification center with test data for QA testing.
 *
 * Usage:
 * ```
 * import { createTestNotifications } from '@/debug/createTestNotifications';
 * await createTestNotifications(userId);
 * ```
 */

import { PushNotification, NotificationType, NotificationPriority, NotificationChannel, NotificationActionType } from '@/types/notifications.types';

/**
 * Create 3 test notifications for QA testing
 */
export async function createTestNotifications(userId: string): Promise<PushNotification[]> {
  const now = Date.now();

  const testNotifications: PushNotification[] = [
    // Test Notification 1: Achievement
    {
      id: `test-achievement-${now}`,
      userId,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: '🏆 Achievement Unlocked',
      body: 'Great job reading scripture today! You earned the "Daily Reader" achievement!',
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.PUSH,
      badge: 1,
      actions: [
        {
          id: 'view_achievement',
          label: 'View',
          type: NotificationActionType.NAVIGATE,
          target: 'ProfileScreen',
        },
      ],
      data: {
        achievementName: 'Daily Reader',
        points: '50',
      },
      timestamp: now - 5000,
      sentAt: now - 5000,
      deliveredAt: now - 5000,
      status: 'delivered',
    },

    // Test Notification 2: Daily Reminder
    {
      id: `test-reminder-${now}`,
      userId,
      type: NotificationType.DAILY_REMINDER,
      title: '📖 Daily Practice Time',
      body: 'Good morning! Time for today\'s Scripture reading practice. Keep your 3-day streak alive!',
      priority: NotificationPriority.NORMAL,
      channel: NotificationChannel.PUSH,
      badge: 2,
      actions: [
        {
          id: 'start_practice',
          label: 'Start',
          type: NotificationActionType.NAVIGATE,
          target: 'PronunciationPracticeScreen',
        },
      ],
      data: {
        streakDays: '3',
        timeOfDay: 'morning',
      },
      timestamp: now - 2000,
      sentAt: now - 2000,
      deliveredAt: now - 2000,
      status: 'delivered',
    },

    // Test Notification 3: Streak Milestone
    {
      id: `test-streak-${now}`,
      userId,
      type: NotificationType.STREAK_MILESTONE,
      title: '🔥 Streak Milestone!',
      body: 'Amazing! You\'re on a 7-day streak! Your dedication is inspiring!',
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.PUSH,
      badge: 3,
      actions: [
        {
          id: 'view_profile',
          label: 'View Profile',
          type: NotificationActionType.NAVIGATE,
          target: 'ProfileScreen',
        },
      ],
      data: {
        streakDays: '7',
      },
      timestamp: now,
      sentAt: now,
      deliveredAt: now,
      status: 'delivered',
    },
  ];

  console.log('[createTestNotifications] Created', testNotifications.length, 'test notifications');

  return testNotifications;
}

/**
 * Test notification data for manual verification
 */
export const TEST_NOTIFICATION_TITLES = [
  '🏆 Achievement Unlocked',
  '📖 Daily Practice Time',
  '🔥 Streak Milestone!',
];

export const TEST_NOTIFICATION_BODIES = [
  'Great job reading scripture today! You earned the "Daily Reader" achievement!',
  'Good morning! Time for today\'s Scripture reading practice. Keep your 3-day streak alive!',
  'Amazing! You\'re on a 7-day streak! Your dedication is inspiring!',
];
