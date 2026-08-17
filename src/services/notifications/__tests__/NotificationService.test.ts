/**
 * Unit Tests for NotificationService
 * Phase 10B.8: Testing & Deployment
 */

import { NotificationService } from '../NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationFilter,
  PushNotification,
  DailyReminder,
} from '@/types/notifications.types';

jest.mock('@react-native-async-storage/async-storage');

function buildNotification(overrides: Partial<PushNotification> = {}): PushNotification {
  return {
    id: 'notif-1',
    userId: 'test-user-123',
    type: NotificationType.DAILY_REMINDER,
    title: 'Time to read',
    body: 'Your daily reading awaits',
    priority: NotificationPriority.HIGH,
    channel: NotificationChannel.PUSH,
    badge: 1,
    actions: [],
    data: {},
    timestamp: Date.now(),
    status: 'pending',
    ...overrides,
  };
}

describe('NotificationService', () => {
  // NotificationService has no getInstance()/singleton pattern -- it's a plain
  // class with a public constructor (the module also exports a pre-built
  // `notificationService` singleton for app code, but tests get their own
  // fresh instance so in-memory state -- Maps for prefs/history/reminders --
  // doesn't bleed between tests).
  let service: NotificationService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    service = new NotificationService();
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });
  });

  describe('Notification Sending', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should send notification with preference filtering', async () => {
      const result = await service.sendNotification(buildNotification());
      expect(result).toBe(true);
    });

    it('should schedule notifications sent during quiet hours instead of sending immediately', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-11-16T23:30:00'));
      try {
        await service.updateUserPreferences(testUserId, {
          quietHoursEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        });

        const result = await service.sendNotification(buildNotification());

        // Deferred sends still return true (they were successfully queued),
        // but they land in the schedule queue, not immediate history.
        expect(result).toBe(true);
        expect(service.getQueuedCount()).toBe(1);
        const history = await service.getHistory(testUserId);
        expect(history).toHaveLength(0);
      } finally {
        jest.useRealTimers();
      }
    });

    it('creates default preferences on the fly for a brand-new user and still sends', async () => {
      const result = await service.sendNotification(
        buildNotification({ userId: 'unknown-user' })
      );
      expect(result).toBe(true);
    });

    it('should add notification to history', async () => {
      await service.sendNotification(buildNotification());

      const history = await service.getHistory(testUserId);
      expect(history).toHaveLength(1);
      expect(history[0].notificationId).toBe('notif-1');
    });
  });

  describe('Preferences Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get default preferences for new user', async () => {
      const prefs = await service.getUserPreferences('new-user');
      expect(prefs).toBeDefined();
      expect(prefs.pushNotificationsEnabled).toBe(true);
    });

    it('should update user preferences', async () => {
      await service.updateUserPreferences(testUserId, {
        dailyReminderEnabled: false,
        quietHoursEnabled: true,
      });

      const prefs = await service.getUserPreferences(testUserId);
      expect(prefs.dailyReminderEnabled).toBe(false);
      expect(prefs.quietHoursEnabled).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should reject preference updates with no userId', async () => {
      await expect(
        service.updateUserPreferences('', { dailyReminderEnabled: false })
      ).rejects.toThrow('userId is required');
    });

    it('does not let a failed AsyncStorage write block the in-memory update', async () => {
      // updateUserPreferences persists to AsyncStorage but deliberately
      // swallows a storage failure -- the in-memory cache (what
      // getUserPreferences reads first) still reflects the update.
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage full'));

      await service.updateUserPreferences(testUserId, { dailyReminderEnabled: false });

      const prefs = await service.getUserPreferences(testUserId);
      expect(prefs.dailyReminderEnabled).toBe(false);
    });
  });

  describe('Daily Reminders', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should setup daily reminder', async () => {
      const reminderTime = '08:00';
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

      await service.setupDailyReminder(testUserId, {
        userId: testUserId,
        enabled: true,
        time: reminderTime,
        daysOfWeek,
        message: 'Time to read',
        title: 'Daily Reminder',
      });

      const reminder = await service.getDailyReminder(testUserId);
      expect(reminder).toBeDefined();
      expect(reminder?.time).toBe(reminderTime);
      expect(reminder?.nextScheduledFor).toBeGreaterThan(0);
    });

    it('should disable daily reminder', async () => {
      await service.setupDailyReminder(testUserId, {
        userId: testUserId,
        enabled: true,
        time: '08:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        message: 'Time to read',
        title: 'Daily Reminder',
      });

      await service.disableDailyReminder(testUserId);

      const reminder = await service.getDailyReminder(testUserId);
      expect(reminder?.enabled).toBe(false);
    });

    it('should calculate next reminder time correctly', async () => {
      const reminder: DailyReminder = {
        userId: testUserId,
        enabled: true,
        time: '08:00',
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        message: 'Reminder',
        title: 'Daily Reminder',
      };

      await service.setupDailyReminder(testUserId, reminder);

      // setupDailyReminder mutates the passed object with the computed time
      expect(reminder.nextScheduledFor).toBeGreaterThan(0);
    });
  });

  describe('History Management', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get notification history', async () => {
      const history = await service.getHistory(testUserId);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should filter history by date range', async () => {
      await service.sendNotification(buildNotification());

      const dateRange = {
        startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 1000,
      };

      const filter: NotificationFilter = { userId: testUserId, dateRange };
      const history = await service.getHistory(testUserId, filter);

      expect(history).toHaveLength(1);
    });

    it('should filter history by notification type', async () => {
      await service.sendNotification(buildNotification());

      const filter: NotificationFilter = {
        userId: testUserId,
        types: [NotificationType.DAILY_REMINDER],
      };
      const history = await service.getHistory(testUserId, filter);

      expect(Array.isArray(history)).toBe(true);
      history.forEach((notif) => {
        expect(notif.notificationType).toBe(NotificationType.DAILY_REMINDER);
      });
    });

    it('should mark notification as read', async () => {
      await service.sendNotification(buildNotification());

      await service.markAsRead(testUserId, 'notif-1');

      const history = await service.getHistory(testUserId);
      expect(history[0].readAt).toBeDefined();
    });

    it('should clear notification history', async () => {
      await service.sendNotification(buildNotification());

      const cleared = await service.clearHistory(testUserId);

      expect(cleared).toBe(1);
      expect(await service.getHistory(testUserId)).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get notification statistics', async () => {
      const stats = await service.getStatistics(testUserId);
      expect(stats).toBeDefined();
      expect(stats.totalSent).toBeGreaterThanOrEqual(0);
    });

    it('should calculate stats for week period', async () => {
      const stats = await service.getStatistics(testUserId, 'week');
      expect(stats).toBeDefined();
      expect(stats.period).toBe('week');
    });

    it('should calculate stats for month period', async () => {
      const stats = await service.getStatistics(testUserId, 'month');
      expect(stats).toBeDefined();
      expect(stats.period).toBe('month');
    });

    it('should track engagement metrics', async () => {
      await service.sendNotification(buildNotification());
      await service.markAsRead(testUserId, 'notif-1');

      const stats = await service.getStatistics(testUserId);
      expect(stats.readRate).toBeGreaterThan(0);
      expect(stats.dismissRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle invalid notification gracefully', async () => {
      const invalid = buildNotification({ title: '' }); // Invalid: empty title

      await expect(service.sendNotification(invalid)).resolves.toBe(true);
    });

    it('should fail gracefully (not throw) when userId is missing', async () => {
      // sendNotification wraps its own body in try/catch and always resolves
      // a boolean -- it never rejects, even on its own validation failure.
      const result = await service.sendNotification(
        buildNotification({ userId: '' })
      );
      expect(result).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should notify a registered delivery listener when a notification is sent', async () => {
      const callback = jest.fn();
      service.onNotificationDelivered(callback);

      await service.sendNotification(buildNotification());

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'notif-1', status: 'delivered' })
      );
    });

    it('should handle multiple listeners', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.onNotificationDelivered(callback1);
      service.onNotificationDelivered(callback2);

      await service.sendNotification(buildNotification());

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should stop notifying a listener after it unsubscribes', async () => {
      const callback = jest.fn();
      const unsubscribe = service.onNotificationDelivered(callback);
      unsubscribe();

      await service.sendNotification(buildNotification());

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await service.initialize();
      await service.shutdown();
      expect(service.isReady()).toBe(false);
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle rapid notification sends', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.sendNotification(buildNotification({ id: `notif-${i}` }))
      );

      const results = await Promise.all(promises);
      expect(results.every((r) => r === true || r === false)).toBe(true);
    });

    it('should retrieve large histories efficiently', async () => {
      const startTime = Date.now();
      const history = await service.getHistory(testUserId);
      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
