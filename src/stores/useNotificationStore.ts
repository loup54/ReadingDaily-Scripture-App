/**
 * Notification Store
 * Phase 10B.3: State Management
 *
 * Zustand store for notification state, history, and preferences
 *
 * Features:
 * - Real-time notification state
 * - History management
 * - User preferences
 * - Statistics
 * - Loading states
 * - Derived data (unread count, pending notifications)
 * - Integration with NotificationService
 */

import { create } from 'zustand';
import {
  PushNotification,
  NotificationPreferences,
  NotificationHistory,
  NotificationStats,
  DailyReminder,
  NotificationFilter,
} from '@/types/notifications.types';
import { notificationService } from '@/services/notifications/NotificationService';

/**
 * Unread notification summary
 */
export interface UnreadSummary {
  totalUnread: number;
  byType: {
    [key: string]: number;
  };
}

/**
 * Notification store state and actions
 */
export interface NotificationStoreState {
  // State
  recentNotifications: PushNotification[];
  notificationHistory: NotificationHistory[];
  preferences: NotificationPreferences | null;
  statistics: NotificationStats | null;
  dailyReminder: DailyReminder | null;
  isLoading: boolean;
  error: string | null;

  // Derived
  unreadCount: number;
  unreadSummary: UnreadSummary | null;
  pendingNotifications: PushNotification[];

  // Actions
  loadPreferences: (userId: string) => Promise<void>;
  updatePreferences: (userId: string, updates: Partial<NotificationPreferences>) => Promise<void>;
  loadHistory: (userId: string, filter?: NotificationFilter) => Promise<void>;
  markAsRead: (userId: string, notificationId: string) => Promise<void>;
  deleteNotification: (userId: string, notificationId: string) => Promise<void>;
  handleNotificationAction: (userId: string, notificationId: string, actionId: string) => Promise<void>;
  loadStatistics: (userId: string, period?: 'week' | 'month' | 'all') => Promise<void>;
  loadDailyReminder: (userId: string) => Promise<void>;
  setupDailyReminder: (userId: string, reminder: DailyReminder) => Promise<void>;
  disableDailyReminder: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => () => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Create notification store with Zustand
 */
export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  // Initial state
  recentNotifications: [],
  notificationHistory: [],
  preferences: null,
  statistics: null,
  dailyReminder: null,
  isLoading: false,
  error: null,

  // Derived
  unreadCount: 0,
  unreadSummary: null,
  pendingNotifications: [],

  /**
   * Load user preferences
   */
  loadPreferences: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const prefs = await notificationService.getUserPreferences(userId);

      set({
        preferences: prefs,
        isLoading: false,
      });

      console.log('[NotificationStore] Preferences loaded for', userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preferences';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error loading preferences:', error);
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (userId: string, updates: Partial<NotificationPreferences>) => {
    try {
      set({ isLoading: true, error: null });

      await notificationService.updateUserPreferences(userId, updates);

      // Reload preferences
      await get().loadPreferences(userId);

      console.log('[NotificationStore] Preferences updated');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error updating preferences:', error);
    }
  },

  /**
   * Load notification history
   */
  loadHistory: async (userId: string, filter?: NotificationFilter) => {
    try {
      set({ isLoading: true, error: null });

      const history = await notificationService.getHistory(userId, filter);

      // Compute derived data
      const unreadCount = history.filter((h) => !h.readAt).length;
      const unreadSummary = computeUnreadSummary(history);

      set({
        notificationHistory: history,
        unreadCount,
        unreadSummary,
        isLoading: false,
      });

      console.log('[NotificationStore] History loaded:', history.length, 'items');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error loading history:', error);
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (userId: string, notificationId: string) => {
    try {
      await notificationService.markAsRead(userId, notificationId);

      // Update local history
      const history = get().notificationHistory;
      const updated = history.map((h) =>
        h.notificationId === notificationId ? { ...h, readAt: Date.now() } : h
      );

      const unreadCount = updated.filter((h) => !h.readAt).length;
      const unreadSummary = computeUnreadSummary(updated);

      set({
        notificationHistory: updated,
        unreadCount,
        unreadSummary,
      });

      console.log('[NotificationStore] Marked as read:', notificationId);
    } catch (error) {
      console.error('[NotificationStore] Error marking as read:', error);
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (userId: string, notificationId: string) => {
    try {
      await notificationService.deleteNotification(userId, notificationId);

      // Update local history
      const history = get().notificationHistory;
      const updated = history.filter((h) => h.notificationId !== notificationId);

      const unreadCount = updated.filter((h) => !h.readAt).length;
      const unreadSummary = computeUnreadSummary(updated);

      set({
        notificationHistory: updated,
        unreadCount,
        unreadSummary,
      });

      console.log('[NotificationStore] Notification deleted:', notificationId);
    } catch (error) {
      console.error('[NotificationStore] Error deleting notification:', error);
    }
  },

  /**
   * Handle notification action
   */
  handleNotificationAction: async (userId: string, notificationId: string, actionId: string) => {
    try {
      await notificationService.handleNotificationAction(userId, notificationId, actionId);

      // Update history with action
      const history = get().notificationHistory;
      const updated = history.map((h) =>
        h.notificationId === notificationId
          ? {
              ...h,
              actionTaken: { actionId, actionType: 'custom', timestamp: Date.now() },
            }
          : h
      );

      set({ notificationHistory: updated });

      console.log('[NotificationStore] Action handled:', actionId);
    } catch (error) {
      console.error('[NotificationStore] Error handling action:', error);
    }
  },

  /**
   * Load statistics
   */
  loadStatistics: async (userId: string, period: 'week' | 'month' | 'all' = 'week') => {
    try {
      set({ isLoading: true, error: null });

      const stats = await notificationService.getStatistics(userId, period);

      set({
        statistics: stats,
        isLoading: false,
      });

      console.log('[NotificationStore] Statistics loaded for', period);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load statistics';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error loading statistics:', error);
    }
  },

  /**
   * Load daily reminder
   */
  loadDailyReminder: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const reminder = await notificationService.getDailyReminder(userId);

      set({
        dailyReminder: reminder,
        isLoading: false,
      });

      console.log('[NotificationStore] Daily reminder loaded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reminder';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error loading reminder:', error);
    }
  },

  /**
   * Setup daily reminder
   */
  setupDailyReminder: async (userId: string, reminder: DailyReminder) => {
    try {
      set({ isLoading: true, error: null });

      await notificationService.setupDailyReminder(userId, reminder);

      set({
        dailyReminder: reminder,
        isLoading: false,
      });

      console.log('[NotificationStore] Daily reminder setup');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to setup reminder';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error setting up reminder:', error);
    }
  },

  /**
   * Disable daily reminder
   */
  disableDailyReminder: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      await notificationService.disableDailyReminder(userId);

      const reminder = get().dailyReminder;
      if (reminder) {
        reminder.enabled = false;
      }

      set({
        dailyReminder: reminder,
        isLoading: false,
      });

      console.log('[NotificationStore] Daily reminder disabled');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable reminder';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[NotificationStore] Error disabling reminder:', error);
    }
  },

  /**
   * Subscribe to notification delivery events
   */
  subscribeToNotifications: (userId: string) => {
    const unsubscribe = notificationService.onNotificationDelivered((notification) => {
      console.log('[NotificationStore] Notification delivered:', notification.id);

      // Add to recent notifications
      const recent = get().recentNotifications;
      const updated = [notification, ...recent].slice(0, 50); // Keep last 50

      set({ recentNotifications: updated });

      // Reload history to get latest
      get().loadHistory(userId);
    });

    return unsubscribe;
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      recentNotifications: [],
      notificationHistory: [],
      preferences: null,
      statistics: null,
      dailyReminder: null,
      isLoading: false,
      error: null,
      unreadCount: 0,
      unreadSummary: null,
      pendingNotifications: [],
    });
    console.log('[NotificationStore] Reset to initial state');
  },
}));

/**
 * Compute unread summary from history
 */
function computeUnreadSummary(history: NotificationHistory[]): UnreadSummary {
  const unread = history.filter((h) => !h.readAt);
  const byType: { [key: string]: number } = {};

  unread.forEach((h) => {
    const type = h.notificationType;
    byType[type] = (byType[type] || 0) + 1;
  });

  return {
    totalUnread: unread.length,
    byType,
  };
}

/**
 * Selectors for common use cases
 */

export const selectPreferences = (state: NotificationStoreState) => state.preferences;

export const selectNotificationHistory = (state: NotificationStoreState) =>
  state.notificationHistory;

export const selectUnreadSummary = (state: NotificationStoreState) => state.unreadSummary;

export const selectStatistics = (state: NotificationStoreState) => state.statistics;

export const selectDailyReminder = (state: NotificationStoreState) => state.dailyReminder;

export const selectLoading = (state: NotificationStoreState) => state.isLoading;

export const selectRecentNotifications = (state: NotificationStoreState) =>
  state.recentNotifications.slice(0, 10); // Last 10

/**
 * Custom hooks for components
 */

/**
 * Hook to load all notification data
 */
export const useLoadNotificationData = () => {
  const loadPreferences = useNotificationStore((state) => state.loadPreferences);
  const loadHistory = useNotificationStore((state) => state.loadHistory);
  const loadStatistics = useNotificationStore((state) => state.loadStatistics);
  const loadDailyReminder = useNotificationStore((state) => state.loadDailyReminder);
  const subscribeToNotifications = useNotificationStore((state) => state.subscribeToNotifications);

  return async (userId: string) => {
    try {
      // Load in parallel
      await Promise.all([
        loadPreferences(userId),
        loadHistory(userId),
        loadStatistics(userId),
        loadDailyReminder(userId),
      ]);

      // Subscribe to delivery events
      subscribeToNotifications(userId);

      console.log('[useLoadNotificationData] All notification data loaded');
    } catch (error) {
      console.error('[useLoadNotificationData] Error loading notification data:', error);
      throw error;
    }
  };
};

/**
 * Hook to update preferences
 */
export const useUpdateNotificationPreferences = () => {
  return useNotificationStore((state) => state.updatePreferences);
};

/**
 * Hook to mark notifications as read
 */
export const useMarkNotificationAsRead = () => {
  return useNotificationStore((state) => state.markAsRead);
};

/**
 * Hook to delete a notification
 */
export const useDeleteNotification = () => {
  return useNotificationStore((state) => state.deleteNotification);
};

/**
 * Hook to get notification history
 */
export const useNotificationHistory = () => {
  return useNotificationStore((state) => state.notificationHistory);
};

/**
 * Hook to get unread count
 */
export const useUnreadNotificationCount = () => {
  return useNotificationStore((state) => state.unreadCount);
};

/**
 * Hook to get unread summary
 */
export const useUnreadNotificationSummary = () => {
  return useNotificationStore((state) => state.unreadSummary);
};

/**
 * Hook to get preferences
 */
export const useNotificationPreferences = () => {
  return useNotificationStore((state) => state.preferences);
};

/**
 * Hook to get statistics
 */
export const useNotificationStatistics = () => {
  return useNotificationStore((state) => state.statistics);
};

/**
 * Hook to get daily reminder
 */
export const useDailyReminder = () => {
  return useNotificationStore((state) => state.dailyReminder);
};

/**
 * Hook to get recent notifications
 */
export const useRecentNotifications = () => {
  return useNotificationStore((state) => state.recentNotifications.slice(0, 10));
};

/**
 * Hook to check loading state
 */
export const useNotificationLoading = () => {
  return useNotificationStore((state) => state.isLoading);
};

/**
 * Hook to check error state
 */
export const useNotificationError = () => {
  return useNotificationStore((state) => state.error);
};
