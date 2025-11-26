/**
 * Custom Hook: useNotificationManagement
 *
 * Provides notification management functionality for components
 * Handles preferences, device registration, and notification history
 */

import { useState, useCallback, useEffect } from 'react';
import {
  notificationPreferencesService,
  NotificationPreferences,
} from '@/services/notifications/NotificationPreferencesService';

export interface UseNotificationManagementState {
  // State
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  unreadCount: number;
  deviceTokenRegistered: boolean;
  error: string | null;

  // Methods
  registerDevice: () => Promise<boolean>;
  unregisterDevice: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<boolean>;
  toggleNotificationType: (type: keyof NotificationPreferences) => Promise<boolean>;
  disableAllNotifications: () => Promise<boolean>;
  enableCriticalNotifications: () => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
  getNotificationHistory: (limit?: number) => Promise<any[]>;
  markNotificationAsRead: (id: string) => Promise<boolean>;
  refreshUnreadCount: () => Promise<void>;
}

export function useNotificationManagement(): UseNotificationManagementState {
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deviceTokenRegistered, setDeviceTokenRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize notification management on mount
   */
  useEffect(() => {
    const initialize = async () => {
      await refreshPreferences();
      await refreshUnreadCount();
    };

    initialize();
  }, []);

  /**
   * Register device for push notifications
   */
  const registerDevice = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await notificationPreferencesService.registerDeviceToken();

      if (token) {
        setDeviceTokenRegistered(true);
        console.log('[useNotificationManagement] Device registered successfully');
        return true;
      } else {
        throw new Error('Failed to register device token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useNotificationManagement] Device registration error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Unregister device
   */
  const unregisterDevice = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await notificationPreferencesService.unregisterDeviceToken();

      if (success) {
        setDeviceTokenRegistered(false);
        console.log('[useNotificationManagement] Device unregistered successfully');
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useNotificationManagement] Device unregistration error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const success = await notificationPreferencesService.updatePreferences(prefs);

        if (success) {
          await refreshPreferences();
          return true;
        }

        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useNotificationManagement] Error updating preferences:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Toggle a specific notification type
   */
  const toggleNotificationType = useCallback(
    async (type: keyof NotificationPreferences): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const success = await notificationPreferencesService.toggleNotificationType(type);

        if (success) {
          await refreshPreferences();
          return true;
        }

        return false;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useNotificationManagement] Error toggling notification:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Disable all notifications
   */
  const disableAllNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await notificationPreferencesService.disableAllNotifications();

      if (success) {
        await refreshPreferences();
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useNotificationManagement] Error disabling all notifications:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Enable critical notifications
   */
  const enableCriticalNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await notificationPreferencesService.enableCriticalNotifications();

      if (success) {
        await refreshPreferences();
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[useNotificationManagement] Error enabling critical notifications:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh preferences from service
   */
  const refreshPreferences = useCallback(async (): Promise<void> => {
    try {
      const prefs = await notificationPreferencesService.getPreferences();
      setPreferences(prefs);
      console.log('[useNotificationManagement] Preferences refreshed:', prefs);
    } catch (err) {
      console.error('[useNotificationManagement] Error refreshing preferences:', err);
    }
  }, []);

  /**
   * Get notification history
   */
  const getNotificationHistory = useCallback(async (limit: number = 20): Promise<any[]> => {
    try {
      return await notificationPreferencesService.getNotificationHistory(limit);
    } catch (err) {
      console.error('[useNotificationManagement] Error getting notification history:', err);
      return [];
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await notificationPreferencesService.markNotificationAsRead(id);

      if (success) {
        await refreshUnreadCount();
      }

      return success;
    } catch (err) {
      console.error('[useNotificationManagement] Error marking notification as read:', err);
      return false;
    }
  }, []);

  /**
   * Refresh unread notification count
   */
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const count = await notificationPreferencesService.getUnreadNotificationCount();
      setUnreadCount(count);
      console.log('[useNotificationManagement] Unread count:', count);
    } catch (err) {
      console.error('[useNotificationManagement] Error getting unread count:', err);
    }
  }, []);

  return {
    isLoading,
    preferences,
    unreadCount,
    deviceTokenRegistered,
    error,
    registerDevice,
    unregisterDevice,
    updatePreferences,
    toggleNotificationType,
    disableAllNotifications,
    enableCriticalNotifications,
    refreshPreferences,
    getNotificationHistory,
    markNotificationAsRead,
    refreshUnreadCount,
  };
}
