/**
 * Daily Reminder Scheduler
 *
 * Manages scheduling of daily reading reminder notifications
 * using expo-notifications.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { logger } from '@/services/logging/LoggerService';
import { NotificationType } from '@/types/notifications.types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface DailyReminderConfig {
  enabled: boolean;
  time: string; // HH:MM format (e.g., "08:00")
  soundEnabled: boolean;
}

const NOTIFICATION_IDENTIFIER = 'daily-reading-reminder';

export class DailyReminderScheduler {
  private static instance: DailyReminderScheduler;
  private permissionsGranted: boolean = false;

  private constructor() {}

  static getInstance(): DailyReminderScheduler {
    if (!DailyReminderScheduler.instance) {
      DailyReminderScheduler.instance = new DailyReminderScheduler();
    }
    return DailyReminderScheduler.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      logger.info('[DailyReminderScheduler] Requesting notification permissions');

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionsGranted = finalStatus === 'granted';

      if (!this.permissionsGranted) {
        logger.warn('[DailyReminderScheduler] Notification permissions not granted');
        return false;
      }

      logger.info('[DailyReminderScheduler] ✅ Notification permissions granted');

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily Reading Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7C3AED',
          sound: 'default',
        });
        logger.info('[DailyReminderScheduler] Android notification channel configured');
      }

      return true;
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error requesting permissions:', error as Error);
      return false;
    }
  }

  /**
   * Check if permissions are granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      this.permissionsGranted = status === 'granted';
      return this.permissionsGranted;
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error checking permissions:', error as Error);
      return false;
    }
  }

  /**
   * Schedule daily reminder notification
   */
  async scheduleDailyReminder(config: DailyReminderConfig): Promise<boolean> {
    try {
      if (!config.enabled) {
        logger.info('[DailyReminderScheduler] Reminders disabled, cancelling any existing');
        await this.cancelDailyReminder();
        return true;
      }

      // Check permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        logger.warn('[DailyReminderScheduler] No permissions, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          logger.error('[DailyReminderScheduler] Permissions not granted, cannot schedule');
          return false;
        }
      }

      logger.info('[DailyReminderScheduler] Scheduling daily reminder for', config.time);

      // Parse time (HH:MM format)
      const [hours, minutes] = config.time.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        logger.error('[DailyReminderScheduler] Invalid time format:', config.time);
        return false;
      }

      // Cancel any existing reminder first
      await this.cancelDailyReminder();

      // Schedule new notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Daily Practice Time',
          body: 'Good day! Time for today\'s Scripture reading practice. Keep your streak alive!',
          sound: config.soundEnabled ? 'default' : undefined,
          data: {
            type: NotificationType.DAILY_REMINDER,
            screen: 'ReadingsScreen',
          },
          badge: 1,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      logger.info('[DailyReminderScheduler] ✅ Daily reminder scheduled:', {
        id: notificationId,
        time: config.time,
        sound: config.soundEnabled,
      });

      return true;
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error scheduling daily reminder:', error as Error);
      return false;
    }
  }

  /**
   * Cancel daily reminder notification
   */
  async cancelDailyReminder(): Promise<void> {
    try {
      logger.info('[DailyReminderScheduler] Cancelling daily reminder');

      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Find and cancel daily reminder notifications
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.type === NotificationType.DAILY_REMINDER) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          logger.debug('[DailyReminderScheduler] Cancelled notification:', notification.identifier);
        }
      }

      logger.info('[DailyReminderScheduler] ✅ Daily reminder cancelled');
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error cancelling daily reminder:', error as Error);
    }
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.filter(
        (notif) => notif.content.data?.type === NotificationType.DAILY_REMINDER
      );
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error getting scheduled notifications:', error as Error);
      return [];
    }
  }

  /**
   * Test notification (send immediately)
   */
  async sendTestNotification(): Promise<void> {
    try {
      logger.info('[DailyReminderScheduler] Sending test notification');

      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Notification permissions not granted');
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Test Notification',
          body: 'This is a test notification. Your daily reminders will look like this!',
          sound: 'default',
          data: {
            type: NotificationType.DAILY_REMINDER,
            test: true,
          },
        },
        trigger: null, // Send immediately
      });

      logger.info('[DailyReminderScheduler] ✅ Test notification sent');
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error sending test notification:', error as Error);
      throw error;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      logger.info('[DailyReminderScheduler] Clearing all notifications');
      await Notifications.dismissAllNotificationsAsync();
      logger.info('[DailyReminderScheduler] ✅ All notifications cleared');
    } catch (error) {
      logger.error('[DailyReminderScheduler] Error clearing notifications:', error as Error);
    }
  }

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const dailyReminderScheduler = DailyReminderScheduler.getInstance();
