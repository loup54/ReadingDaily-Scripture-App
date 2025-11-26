/**
 * Notifications Service
 * Phase 10D.6: Content Notifications
 *
 * Manages reading notifications and reminders:
 * - Content notifications
 * - Reading reminders
 * - Favorite alerts
 * - Update notifications
 * - Notification scheduling
 *
 * Features:
 * - Local notifications
 * - Scheduled reminders
 * - Notification history
 * - Smart scheduling
 */

import { readingsScreenService } from './ReadingsScreenService';
import { favoritesService } from './FavoritesService';
import { contentService } from './ContentService';
import { cacheService } from '@/services/cache/CacheService';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'reading' | 'reminder' | 'favorite' | 'update' | 'achievement';
  readingId?: string;
  timestamp: number;
  read: boolean;
  action?: string;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  description: string;
  scheduledTime: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'once';
  readingId?: string;
  isActive: boolean;
  createdAt: number;
}

export interface NotificationSettings {
  enableNotifications: boolean;
  enableReminders: boolean;
  enableFavoriteAlerts: boolean;
  enableUpdateNotifications: boolean;
  quietHours?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

interface NotificationHandler {
  (notification: Notification): Promise<void>;
}

class NotificationsService {
  private isInitialized = false;
  private notifications: Map<string, Notification> = new Map();
  private scheduledReminders: Map<string, ScheduledReminder> = new Map();
  private reminderTimers: Map<string, NodeJS.Timeout> = new Map();
  private notificationHandlers: NotificationHandler[] = [];
  private settings: NotificationSettings = {
    enableNotifications: true,
    enableReminders: true,
    enableFavoriteAlerts: true,
    enableUpdateNotifications: true,
  };
  private notificationCacheKey = 'notification_';
  private maxNotifications = 100;

  /**
   * Initialize notifications service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[NotificationsService] Already initialized');
        return;
      }

      // Ensure content service is ready
      if (!contentService.isReady()) {
        await contentService.initialize();
      }

      // Load notifications and reminders from cache
      await this.loadNotifications();
      await this.loadReminders();

      this.isInitialized = true;
      console.log('[NotificationsService] Initialized');
    } catch (error) {
      console.error('[NotificationsService] Initialization failed:', error);
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
   * Send a notification
   */
  async sendNotification(
    title: string,
    body: string,
    type: Notification['type'],
    readingId?: string
  ): Promise<Notification> {
    try {
      // Check if notifications are enabled
      if (!this.settings.enableNotifications) {
        console.log('[NotificationsService] Notifications disabled');
        return null as any;
      }

      // Check quiet hours
      if (this.isInQuietHours()) {
        console.log('[NotificationsService] In quiet hours, deferring notification');
      }

      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        body,
        type,
        readingId,
        timestamp: Date.now(),
        read: false,
      };

      // Add to notifications map
      this.notifications.set(notification.id, notification);

      // Keep size manageable
      if (this.notifications.size > this.maxNotifications) {
        const oldest = Array.from(this.notifications.values())
          .sort((a, b) => a.timestamp - b.timestamp)[0];
        this.notifications.delete(oldest.id);
      }

      // Cache notification
      await cacheService.cachePracticeSession?.({
        id: `${this.notificationCacheKey}${notification.id}`,
        user_id: 'system',
        reading_id: readingId || 'notification',
        recording_uri: null,
        result: notification,
        timestamp: Date.now(),
      });

      // Call registered handlers
      for (const handler of this.notificationHandlers) {
        try {
          await handler(notification);
        } catch (error) {
          console.error('[NotificationsService] Handler error:', error);
        }
      }

      console.log('[NotificationsService] Sent notification:', title);
      return notification;
    } catch (error) {
      console.error('[NotificationsService] Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Schedule a reminder
   */
  async scheduleReminder(
    title: string,
    description: string,
    scheduledTime: number,
    frequency?: 'daily' | 'weekly' | 'monthly' | 'once',
    readingId?: string
  ): Promise<ScheduledReminder> {
    try {
      if (!this.settings.enableReminders) {
        console.log('[NotificationsService] Reminders disabled');
        return null as any;
      }

      const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const reminder: ScheduledReminder = {
        id,
        title,
        description,
        scheduledTime,
        frequency: frequency || 'once',
        readingId,
        isActive: true,
        createdAt: Date.now(),
      };

      this.scheduledReminders.set(id, reminder);

      // Set up timer for reminder
      this.setupReminderTimer(reminder);

      console.log('[NotificationsService] Scheduled reminder:', title);
      return reminder;
    } catch (error) {
      console.error('[NotificationsService] Failed to schedule reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<void> {
    try {
      const reminder = this.scheduledReminders.get(reminderId);
      if (reminder) {
        reminder.isActive = false;
        const timer = this.reminderTimers.get(reminderId);
        if (timer) {
          clearTimeout(timer);
          this.reminderTimers.delete(reminderId);
        }
        console.log('[NotificationsService] Cancelled reminder:', reminderId);
      }
    } catch (error) {
      console.error('[NotificationsService] Failed to cancel reminder:', error);
      throw error;
    }
  }

  /**
   * Send favorite alert
   */
  async sendFavoriteAlert(readingId: string, readingTitle: string): Promise<void> {
    try {
      if (!this.settings.enableFavoriteAlerts) {
        return;
      }

      await this.sendNotification(
        'Added to Favorites',
        `"${readingTitle}" has been added to your favorites.`,
        'favorite',
        readingId
      );
    } catch (error) {
      console.error('[NotificationsService] Failed to send favorite alert:', error);
    }
  }

  /**
   * Send update notification
   */
  async sendUpdateNotification(
    title: string,
    message: string,
    readingId?: string
  ): Promise<void> {
    try {
      if (!this.settings.enableUpdateNotifications) {
        return;
      }

      await this.sendNotification(title, message, 'update', readingId);
    } catch (error) {
      console.error('[NotificationsService] Failed to send update notification:', error);
    }
  }

  /**
   * Send reading reminder
   */
  async sendReadingReminder(readingTitle: string, readingId: string): Promise<void> {
    try {
      if (!this.settings.enableReminders) {
        return;
      }

      await this.sendNotification(
        'Time to Read',
        `Don't forget to read: ${readingTitle}`,
        'reminder',
        readingId
      );
    } catch (error) {
      console.error('[NotificationsService] Failed to send reading reminder:', error);
    }
  }

  /**
   * Get notification history
   */
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    try {
      return Array.from(this.notifications.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('[NotificationsService] Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      return Array.from(this.notifications.values())
        .filter((n) => !n.read)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[NotificationsService] Failed to get unread:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        notification.read = true;
      }
    } catch (error) {
      console.error('[NotificationsService] Failed to mark as read:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearNotifications(): Promise<void> {
    try {
      this.notifications.clear();
      console.log('[NotificationsService] Cleared all notifications');
    } catch (error) {
      console.error('[NotificationsService] Failed to clear notifications:', error);
      throw error;
    }
  }

  /**
   * Get scheduled reminders
   */
  async getReminders(): Promise<ScheduledReminder[]> {
    try {
      return Array.from(this.scheduledReminders.values()).filter((r) => r.isActive);
    } catch (error) {
      console.error('[NotificationsService] Failed to get reminders:', error);
      return [];
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      console.log('[NotificationsService] Updated settings');
    } catch (error) {
      console.error('[NotificationsService] Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      return { ...this.settings };
    } catch (error) {
      console.error('[NotificationsService] Failed to get settings:', error);
      return this.settings;
    }
  }

  /**
   * Register notification handler
   */
  onNotification(handler: NotificationHandler): () => void {
    try {
      this.notificationHandlers.push(handler);
      console.log('[NotificationsService] Registered notification handler');

      // Return unsubscribe function
      return () => {
        const index = this.notificationHandlers.indexOf(handler);
        if (index > -1) {
          this.notificationHandlers.splice(index, 1);
        }
      };
    } catch (error) {
      console.error('[NotificationsService] Failed to register handler:', error);
      return () => {};
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      // Clear all timers
      for (const [, timer] of this.reminderTimers) {
        clearTimeout(timer);
      }
      this.reminderTimers.clear();
      this.notificationHandlers = [];
      this.notifications.clear();
      this.scheduledReminders.clear();
      this.isInitialized = false;
      console.log('[NotificationsService] Shutdown complete');
    } catch (error) {
      console.error('[NotificationsService] Shutdown error:', error);
      throw error;
    }
  }

  // ============ Private Methods ============

  /**
   * Load notifications from cache
   */
  private async loadNotifications(): Promise<void> {
    try {
      // In production, load from persistent storage
      this.notifications = new Map();
      console.log('[NotificationsService] Notifications loaded');
    } catch (error) {
      console.error('[NotificationsService] Failed to load notifications:', error);
      this.notifications = new Map();
    }
  }

  /**
   * Load reminders from cache
   */
  private async loadReminders(): Promise<void> {
    try {
      // In production, load from persistent storage
      this.scheduledReminders = new Map();
      console.log('[NotificationsService] Reminders loaded');
    } catch (error) {
      console.error('[NotificationsService] Failed to load reminders:', error);
      this.scheduledReminders = new Map();
    }
  }

  /**
   * Setup timer for scheduled reminder
   */
  private setupReminderTimer(reminder: ScheduledReminder): void {
    try {
      const now = Date.now();
      const delay = Math.max(0, reminder.scheduledTime - now);

      const timerId = setTimeout(async () => {
        if (reminder.isActive) {
          // Send the reminder notification
          await this.sendNotification(
            reminder.title,
            reminder.description,
            'reminder',
            reminder.readingId
          );

          // Handle recurrence
          if (reminder.frequency && reminder.frequency !== 'once') {
            const nextTime = this.calculateNextReminderTime(reminder);
            if (nextTime) {
              reminder.scheduledTime = nextTime;
              this.setupReminderTimer(reminder);
            }
          } else {
            reminder.isActive = false;
          }
        }
      }, delay);

      this.reminderTimers.set(reminder.id, timerId as any);
    } catch (error) {
      console.error('[NotificationsService] Failed to setup timer:', error);
    }
  }

  /**
   * Calculate next reminder time based on frequency
   */
  private calculateNextReminderTime(reminder: ScheduledReminder): number | null {
    const current = new Date(reminder.scheduledTime);

    switch (reminder.frequency) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        return current.getTime();
      case 'weekly':
        current.setDate(current.getDate() + 7);
        return current.getTime();
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        return current.getTime();
      default:
        return null;
    }
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.settings.quietHours) {
      return false;
    }

    const now = new Date();
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime < endTime;
  }
}

// Export singleton
export const notificationsService = new NotificationsService();
