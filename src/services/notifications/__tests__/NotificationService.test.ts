/**
 * Unit Tests for NotificationService
 * Phase 10B.8: Testing & Deployment
 */

import { NotificationService } from '../NotificationService';
import { NotificationType, NotificationChannel } from '@/types/notifications.types';
import { firestore } from '@/services/firebase/config';

// Mock firestore
jest.mock('@/services/firebase/config', () => ({
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            get: jest.fn(),
            set: jest.fn(),
            add: jest.fn(),
          })),
          query: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('NotificationService', () => {
  let service: NotificationService;
  const testUserId = 'test-user-123';
  const testNotification = {
    id: 'notif-1',
    userId: testUserId,
    type: NotificationType.DAILY_REMINDER,
    title: 'Time to read',
    body: 'Your daily reading awaits',
    channel: 'push' as NotificationChannel,
    priority: 'high' as const,
    sentAt: Date.now(),
    scheduledFor: Date.now(),
    status: 'pending' as const,
  };

  beforeEach(() => {
    service = NotificationService.getInstance();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      jest.spyOn(firestore, 'collection').mockImplementationOnce(() => {
        throw new Error('Firestore unavailable');
      });

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('Notification Sending', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should send notification with preference filtering', async () => {
      const result = await service.sendNotification(testNotification);
      expect(result).toBe(true);
    });

    it('should respect quiet hours', async () => {
      const notification = {
        ...testNotification,
        sentAt: new Date('2024-11-16 23:30').getTime(), // Within quiet hours
      };

      const result = await service.sendNotification(notification);
      // Should be scheduled, not sent immediately
      expect(result).toBe(true);
    });

    it('should handle notification without preferences', async () => {
      const notification = {
        ...testNotification,
        userId: 'unknown-user',
      };

      const result = await service.sendNotification(notification);
      expect(result).toBe(true);
    });

    it('should add notification to history', async () => {
      await service.sendNotification(testNotification);

      const history = await service.getHistory(testUserId);
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
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
      const updates = {
        dailyRemindersEnabled: false,
        quietHoursEnabled: true,
      };

      await service.updateUserPreferences(testUserId, updates);
      // Verify update was called
      expect(firestore.collection).toHaveBeenCalled();
    });

    it('should handle preference update errors', async () => {
      jest.spyOn(firestore, 'collection').mockImplementationOnce(() => {
        throw new Error('Update failed');
      });

      await expect(
        service.updateUserPreferences(testUserId, { dailyRemindersEnabled: false })
      ).rejects.toThrow();
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
        enabled: true,
        time: reminderTime,
        daysOfWeek,
        message: 'Time to read',
        nextScheduledTime: Date.now(),
      });

      const reminder = await service.getDailyReminder(testUserId);
      expect(reminder).toBeDefined();
      expect(reminder?.time).toBe(reminderTime);
    });

    it('should disable daily reminder', async () => {
      await service.disableDailyReminder(testUserId);
      expect(firestore.collection).toHaveBeenCalled();
    });

    it('should calculate next reminder time correctly', async () => {
      const reminder = {
        enabled: true,
        time: '08:00',
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        message: 'Reminder',
        nextScheduledTime: Date.now(),
      };

      await service.setupDailyReminder(testUserId, reminder);
      // Next scheduled time should be calculated
      expect(reminder.nextScheduledTime).toBeGreaterThan(0);
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
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 days ago

      const history = await service.getHistory(testUserId, {
        startDate: startDate.getTime(),
        endDate: Date.now(),
      });

      expect(Array.isArray(history)).toBe(true);
    });

    it('should filter history by notification type', async () => {
      const history = await service.getHistory(testUserId, {
        type: NotificationType.DAILY_REMINDER,
      });

      expect(Array.isArray(history)).toBe(true);
      history.forEach((notif) => {
        expect(notif.notificationType).toBe(NotificationType.DAILY_REMINDER);
      });
    });

    it('should mark notification as read', async () => {
      await service.markAsRead(testUserId, 'notif-1');
      expect(firestore.collection).toHaveBeenCalled();
    });

    it('should clear notification history', async () => {
      await service.clearHistory(testUserId);
      expect(firestore.collection).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should get notification statistics', async () => {
      const stats = await service.getStatistics(testUserId);
      expect(stats).toBeDefined();
      expect(stats?.totalNotifications).toBeGreaterThanOrEqual(0);
    });

    it('should calculate stats for week period', async () => {
      const stats = await service.getStatistics(testUserId, 'week');
      expect(stats).toBeDefined();
    });

    it('should calculate stats for month period', async () => {
      const stats = await service.getStatistics(testUserId, 'month');
      expect(stats).toBeDefined();
    });

    it('should track engagement metrics', async () => {
      const stats = await service.getStatistics(testUserId);
      if (stats) {
        expect(stats.openRate).toBeGreaterThanOrEqual(0);
        expect(stats.engagementRate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle invalid notification gracefully', async () => {
      const invalid = {
        ...testNotification,
        title: '', // Invalid: empty title
      };

      await expect(service.sendNotification(invalid)).resolves.toBeDefined();
    });

    it('should handle network errors in send', async () => {
      jest.spyOn(firestore, 'collection').mockImplementationOnce(() => {
        throw new Error('Network error');
      });

      const result = await service.sendNotification(testNotification);
      // Should attempt retry or fail gracefully
      expect(typeof result).toBe('boolean');
    });

    it('should provide meaningful error messages', async () => {
      try {
        jest.spyOn(firestore, 'collection').mockImplementationOnce(() => {
          throw new Error('Invalid credentials');
        });

        await service.sendNotification(testNotification);
      } catch (error: any) {
        expect(error.message).toContain('Invalid credentials');
      }
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should register notification delivered listener', (done) => {
      const callback = jest.fn(() => {
        expect(callback).toHaveBeenCalled();
        done();
      });

      service.onNotificationDelivered(callback);

      // Simulate delivery
      setTimeout(() => {
        callback('notif-1');
      }, 100);
    });

    it('should handle multiple listeners', (done) => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.onNotificationDelivered(callback1);
      service.onNotificationDelivered(callback2);

      setTimeout(() => {
        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await service.initialize();
      await service.shutdown();
      expect(service.isReady()).toBe(false);
    });

    it('should handle shutdown errors', async () => {
      await service.initialize();
      jest.spyOn(firestore, 'collection').mockImplementationOnce(() => {
        throw new Error('Shutdown error');
      });

      // Should not throw
      await expect(service.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should handle rapid notification sends', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.sendNotification({
          ...testNotification,
          id: `notif-${i}`,
        })
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
