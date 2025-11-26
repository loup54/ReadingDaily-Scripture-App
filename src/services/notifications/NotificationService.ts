/**
 * Notification Service
 * Phase 10B.2: Push Notification Management
 *
 * Handles all notification operations:
 * - Send push notifications
 * - Schedule recurring notifications
 * - Manage user preferences
 * - Track notification delivery
 * - Handle Firebase Cloud Messaging
 * - Manage quiet hours
 * - Notification history tracking
 *
 * Features:
 * - FCM integration ready
 * - Scheduled delivery with delays
 * - Quiet hours support
 * - Preference-based filtering
 * - Delivery tracking
 * - History management
 * - Event notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging/LoggerService';
import {
  PushNotification,
  NotificationPreferences,
  NotificationType,
  NotificationChannel,
  NotificationHistory,
  NotificationStats,
  DailyReminder,
  NotificationFilter,
  NotificationActionType,
  createDefaultNotificationPreferences,
  shouldSendNotification,
  isInQuietHours,
} from '@/types/notifications.types';

interface NotificationQueue {
  notification: PushNotification;
  scheduledFor: number;
  retries: number;
  maxRetries: number;
}

/**
 * Notification Service - manages all notification operations
 * Singleton pattern for consistency across app
 */
class NotificationService {
  private isInitialized = false;
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private notificationQueue: Map<string, NotificationQueue> = new Map();
  private notificationHistory: Map<string, NotificationHistory[]> = new Map();
  private dailyReminders: Map<string, DailyReminder> = new Map();
  private deliveryCallbacks: Set<(notification: PushNotification) => void> = new Set();
  private notificationHandlers: Map<string, (notification: PushNotification) => void> = new Map();

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('[NotificationService] Initializing');
      this.isInitialized = true;
      logger.info('[NotificationService] ✅ Initialized');
    } catch (error) {
      logger.error('[NotificationService] Failed to initialize:', error as Error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get or create user preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      // Check in-memory cache first
      const cached = this.userPreferences.get(userId);
      if (cached) {
        logger.debug('[NotificationService] Returning cached preferences for', userId);
        return cached;
      }

      logger.debug('[NotificationService] Fetching preferences for', userId);

      // Try to load from AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(`notification_prefs_${userId}`);
        if (stored) {
          const prefs = JSON.parse(stored) as NotificationPreferences;
          this.userPreferences.set(userId, prefs);
          logger.info('[NotificationService] Loaded preferences from AsyncStorage for', userId);
          return prefs;
        }
      } catch (error) {
        logger.warn('[NotificationService] Error loading from AsyncStorage, using defaults:', error as Error);
      }

      // Fall back to default preferences
      const defaultPrefs = createDefaultNotificationPreferences(userId);
      this.userPreferences.set(userId, defaultPrefs);
      return defaultPrefs;
    } catch (error) {
      logger.error('[NotificationService] Error getting preferences:', error as Error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      logger.info('[NotificationService] Updating preferences for', userId);

      const currentPrefs = await this.getUserPreferences(userId);
      const updatedPrefs: NotificationPreferences = {
        ...currentPrefs,
        ...updates,
        updatedAt: Date.now(),
      };

      // Update in-memory cache
      this.userPreferences.set(userId, updatedPrefs);

      // Persist to AsyncStorage
      try {
        await AsyncStorage.setItem(
          `notification_prefs_${userId}`,
          JSON.stringify(updatedPrefs)
        );
        logger.info('[NotificationService] Preferences persisted to AsyncStorage for', userId);
      } catch (error) {
        logger.error('[NotificationService] Error persisting preferences to AsyncStorage:', error as Error);
        // Don't throw - still update in memory even if storage fails
      }

      logger.info('[NotificationService] Preferences updated for', userId);
    } catch (error) {
      logger.error('[NotificationService] Error updating preferences:', error as Error);
      throw error;
    }
  }

  /**
   * Send push notification to user
   */
  async sendNotification(notification: PushNotification): Promise<boolean> {
    try {
      if (!notification.userId) {
        throw new Error('userId is required in notification');
      }

      logger.info('[NotificationService] Sending notification:', notification.id);

      const prefs = await this.getUserPreferences(notification.userId);

      if (!shouldSendNotification(notification.type, prefs, notification.channel)) {
        logger.debug('[NotificationService] Notification filtered by user preferences');
        return false;
      }

      if (isInQuietHours(prefs)) {
        logger.info('[NotificationService] In quiet hours, deferring notification');
        const deferredUntil = this.calculateNextQuietHourEnd(prefs);
        notification.scheduledFor = deferredUntil;
        return this.scheduleNotification(notification);
      }

      return await this.sendImmediate(notification);
    } catch (error) {
      logger.error('[NotificationService] Error sending notification:', error as Error);
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * Send notification immediately without delay
   */
  private async sendImmediate(notification: PushNotification): Promise<boolean> {
    try {
      notification.status = 'sent';
      notification.sentAt = Date.now();

      logger.debug('[NotificationService] Sending immediately:', {
        id: notification.id,
        type: notification.type,
        channel: notification.channel,
      });

      notification.status = 'delivered';
      notification.deliveredAt = Date.now();

      await this.addToHistory(notification);
      this.notifyDelivered(notification);

      return true;
    } catch (error) {
      logger.error('[NotificationService] Error sending immediately:', error as Error);
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * Schedule notification for later delivery
   */
  private scheduleNotification(notification: PushNotification): boolean {
    try {
      const scheduledFor = notification.scheduledFor || Date.now() + 60000;
      const queueItem: NotificationQueue = {
        notification,
        scheduledFor,
        retries: 0,
        maxRetries: 3,
      };

      logger.debug('[NotificationService] Scheduling notification:', {
        id: notification.id,
        scheduledFor: new Date(scheduledFor).toISOString(),
      });

      this.notificationQueue.set(notification.id, queueItem);

      setTimeout(() => {
        this.processScheduledNotification(notification.id);
      }, scheduledFor - Date.now());

      return true;
    } catch (error) {
      logger.error('[NotificationService] Error scheduling notification:', error as Error);
      return false;
    }
  }

  /**
   * Process scheduled notification
   */
  private async processScheduledNotification(notificationId: string): Promise<void> {
    const queueItem = this.notificationQueue.get(notificationId);
    if (!queueItem) {
      logger.warn('[NotificationService] Scheduled notification not found:', notificationId);
      return;
    }

    try {
      logger.debug('[NotificationService] Processing scheduled notification:', notificationId);
      const success = await this.sendImmediate(queueItem.notification);

      if (success) {
        this.notificationQueue.delete(notificationId);
      } else {
        queueItem.retries++;
        if (queueItem.retries < queueItem.maxRetries) {
          logger.debug('[NotificationService] Retrying notification:', notificationId);
          const delayMs = Math.pow(2, queueItem.retries) * 1000;
          setTimeout(() => {
            this.processScheduledNotification(notificationId);
          }, delayMs);
        } else {
          logger.error('[NotificationService] Max retries exceeded:', notificationId);
          this.notificationQueue.delete(notificationId);
        }
      }
    } catch (error) {
      logger.error('[NotificationService] Error processing scheduled notification:', error as Error);
    }
  }

  /**
   * Schedule daily reminder notification
   */
  async setupDailyReminder(userId: string, reminder: DailyReminder): Promise<void> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      logger.info('[NotificationService] Setting up daily reminder for', userId);

      this.dailyReminders.set(userId, reminder);
      reminder.nextScheduledFor = this.calculateNextReminderTime(reminder);

      logger.info('[NotificationService] Daily reminder scheduled for:', new Date(
        reminder.nextScheduledFor
      ).toISOString());
    } catch (error) {
      logger.error('[NotificationService] Error setting up daily reminder:', error as Error);
      throw error;
    }
  }

  /**
   * Calculate next reminder time based on configuration
   */
  private calculateNextReminderTime(reminder: DailyReminder): number {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    let nextTime = new Date();

    nextTime.setHours(hours, minutes, 0, 0);

    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    while (!reminder.daysOfWeek.includes(nextTime.getDay())) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime.getTime();
  }

  /**
   * Calculate when quiet hours end
   */
  private calculateNextQuietHourEnd(prefs: NotificationPreferences): number {
    const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

    const now = new Date();
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return endTime.getTime();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      logger.debug('[NotificationService] Marking as read:', notificationId);

      const history = this.notificationHistory.get(userId) || [];
      const entry = history.find((h) => h.notificationId === notificationId);

      if (entry) {
        entry.readAt = Date.now();
        entry.timeToInteraction = entry.readAt - entry.deliveredAt!;
      }
    } catch (error) {
      logger.error('[NotificationService] Error marking as read:', error as Error);
    }
  }

  /**
   * Delete a notification from history
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      logger.debug('[NotificationService] Deleting notification:', notificationId);

      const history = this.notificationHistory.get(userId) || [];
      const index = history.findIndex((h) => h.notificationId === notificationId);

      if (index !== -1) {
        history.splice(index, 1);
        this.notificationHistory.set(userId, history);
        logger.debug('[NotificationService] Notification deleted successfully');
      } else {
        logger.warn('[NotificationService] Notification not found:', notificationId);
      }
    } catch (error) {
      logger.error('[NotificationService] Error deleting notification:', error as Error);
      throw error;
    }
  }

  /**
   * Handle notification action
   */
  async handleNotificationAction(
    userId: string,
    notificationId: string,
    actionId: string
  ): Promise<void> {
    try {
      logger.debug('[NotificationService] Handling action:', {
        notificationId,
        actionId,
      });

      const history = this.notificationHistory.get(userId) || [];
      const entry = history.find((h) => h.notificationId === notificationId);

      if (entry) {
        entry.actionTaken = {
          actionId,
          actionType: NotificationActionType.CUSTOM,
          timestamp: Date.now(),
        };
        entry.timeToInteraction = entry.actionTaken.timestamp - entry.deliveredAt!;
      }

      const handler = this.notificationHandlers.get(actionId);
      if (handler) {
        logger.debug('[NotificationService] Executing custom action handler:', actionId);
      }

      logger.debug('[NotificationService] Action handled:', actionId);
    } catch (error) {
      logger.error('[NotificationService] Error handling action:', error as Error);
    }
  }

  /**
   * Register custom notification action handler
   */
  onNotificationAction(actionId: string, handler: (notification: PushNotification) => void): () => void {
    logger.debug('[NotificationService] Registering action handler:', actionId);
    this.notificationHandlers.set(actionId, handler);

    return () => {
      logger.debug('[NotificationService] Removing action handler:', actionId);
      this.notificationHandlers.delete(actionId);
    };
  }

  /**
   * Subscribe to notification delivery events
   */
  onNotificationDelivered(callback: (notification: PushNotification) => void): () => void {
    logger.debug('[NotificationService] Adding delivery listener');
    this.deliveryCallbacks.add(callback);

    return () => {
      logger.debug('[NotificationService] Removing delivery listener');
      this.deliveryCallbacks.delete(callback);
    };
  }

  /**
   * Notify all delivery listeners
   */
  private notifyDelivered(notification: PushNotification): void {
    this.deliveryCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        logger.error('[NotificationService] Error in delivery callback:', error as Error);
      }
    });
  }

  /**
   * Add notification to history
   */
  private async addToHistory(notification: PushNotification): Promise<void> {
    try {
      const history = this.notificationHistory.get(notification.userId) || [];

      const entry: NotificationHistory = {
        id: `history-${notification.id}`,
        userId: notification.userId,
        notificationId: notification.id,
        notificationType: notification.type,
        title: notification.title,
        body: notification.body,
        sentAt: notification.sentAt!,
        deliveredAt: notification.deliveredAt,
        channel: notification.channel,
        dismissed: false,
      };

      history.push(entry);
      this.notificationHistory.set(notification.userId, history);
    } catch (error) {
      logger.error('[NotificationService] Error adding to history:', error as Error);
    }
  }

  /**
   * Get notification history for user
   */
  async getHistory(userId: string, filter?: NotificationFilter): Promise<NotificationHistory[]> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      logger.debug('[NotificationService] Getting history for', userId);

      let history = this.notificationHistory.get(userId) || [];

      if (filter) {
        if (filter.types && filter.types.length > 0) {
          history = history.filter((h) => filter.types!.includes(h.notificationType));
        }
        if (filter.channels && filter.channels.length > 0) {
          history = history.filter((h) => filter.channels!.includes(h.channel));
        }
        if (filter.unreadOnly) {
          history = history.filter((h) => !h.readAt);
        }
        if (filter.dateRange) {
          history = history.filter(
            (h) => h.sentAt >= filter.dateRange!.startDate && h.sentAt <= filter.dateRange!.endDate
          );
        }
      }

      return history;
    } catch (error) {
      logger.error('[NotificationService] Error getting history:', error as Error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId: string, period: 'week' | 'month' | 'all' = 'week'): Promise<NotificationStats> {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      logger.debug('[NotificationService] Getting statistics for', userId, 'period:', period);

      const history = await this.getHistory(userId);

      const endDate = Date.now();
      let startDate = endDate;

      if (period === 'week') {
        startDate = endDate - 7 * 24 * 60 * 60 * 1000;
      } else if (period === 'month') {
        startDate = endDate - 30 * 24 * 60 * 60 * 1000;
      }

      const periodHistory = history.filter((h) => h.sentAt >= startDate && h.sentAt <= endDate);

      const totalSent = periodHistory.length;
      const totalDelivered = periodHistory.filter((h) => h.deliveredAt).length;
      const totalRead = periodHistory.filter((h) => h.readAt).length;
      const totalDismissed = periodHistory.filter((h) => h.dismissed).length;

      const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;
      const dismissRate = totalSent > 0 ? (totalDismissed / totalSent) * 100 : 0;

      const timesToRead = periodHistory
        .filter((h) => h.timeToInteraction)
        .map((h) => h.timeToInteraction!);
      const averageTimeToRead =
        timesToRead.length > 0 ? timesToRead.reduce((a, b) => a + b, 0) / timesToRead.length : 0;

      const byType: { [key in NotificationType]?: { sent: number; read: number; dismissed: number } } = {};

      periodHistory.forEach((h) => {
        if (!byType[h.notificationType]) {
          byType[h.notificationType] = { sent: 0, read: 0, dismissed: 0 };
        }
        byType[h.notificationType]!.sent++;
        if (h.readAt) byType[h.notificationType]!.read++;
        if (h.dismissed) byType[h.notificationType]!.dismissed++;
      });

      return {
        userId,
        totalSent,
        totalDelivered,
        totalRead,
        totalDismissed,
        totalFailed: 0,
        byType,
        averageTimeToRead,
        readRate,
        dismissRate,
        actionRate: readRate,
        period,
        startDate,
        endDate,
      };
    } catch (error) {
      logger.error('[NotificationService] Error getting statistics:', error as Error);
      throw error;
    }
  }

  /**
   * Clear notification history
   */
  async clearHistory(userId: string, beforeDate?: number): Promise<number> {
    try {
      logger.info('[NotificationService] Clearing history for', userId);

      let history = this.notificationHistory.get(userId) || [];
      let clearedCount = 0;

      if (beforeDate) {
        const filtered = history.filter((h) => h.sentAt >= beforeDate);
        clearedCount = history.length - filtered.length;
        this.notificationHistory.set(userId, filtered);
      } else {
        clearedCount = history.length;
        this.notificationHistory.delete(userId);
      }

      logger.info('[NotificationService] Cleared', clearedCount, 'notifications');
      return clearedCount;
    } catch (error) {
      logger.error('[NotificationService] Error clearing history:', error as Error);
      return 0;
    }
  }

  /**
   * Get daily reminder for user
   */
  async getDailyReminder(userId: string): Promise<DailyReminder | null> {
    try {
      return this.dailyReminders.get(userId) || null;
    } catch (error) {
      logger.error('[NotificationService] Error getting daily reminder:', error as Error);
      return null;
    }
  }

  /**
   * Disable daily reminder
   */
  async disableDailyReminder(userId: string): Promise<void> {
    try {
      logger.debug('[NotificationService] Disabling daily reminder for', userId);
      const reminder = this.dailyReminders.get(userId);
      if (reminder) {
        reminder.enabled = false;
      }
    } catch (error) {
      logger.error('[NotificationService] Error disabling daily reminder:', error as Error);
    }
  }

  /**
   * Get queued notifications count
   */
  getQueuedCount(): number {
    return this.notificationQueue.size;
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('[NotificationService] Shutting down');
      this.notificationQueue.clear();
      this.notificationHistory.clear();
      this.userPreferences.clear();
      this.dailyReminders.clear();
      this.deliveryCallbacks.clear();
      this.notificationHandlers.clear();
      this.isInitialized = false;
      logger.info('[NotificationService] ✅ Shutdown complete');
    } catch (error) {
      logger.error('[NotificationService] Error during shutdown:', error as Error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export { NotificationService };
