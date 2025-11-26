/**
 * Firebase Cloud Messaging Hook
 * Phase 10B.7: Firebase Cloud Messaging Setup
 *
 * Hook for managing FCM initialization, token management, and push handling
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { FirebaseCloudMessagingService } from '@/services/notifications/FirebaseCloudMessagingService';
import { FCMTokenManager } from '@/services/notifications/FCMTokenManager';
import { NotificationService } from '@/services/notifications/NotificationService';
import { useShowNotificationToast } from '@/stores/useToastStore';

/**
 * Options for FCM hook
 */
export interface UseFCMOptions {
  enabled?: boolean;
  debug?: boolean;
  autoRetry?: boolean;
  showInAppToasts?: boolean;
}

/**
 * Hook for managing Firebase Cloud Messaging
 */
export function useFCMNotifications(
  userId: string | null | undefined,
  options: UseFCMOptions = {}
) {
  const {
    enabled = true,
    debug = false,
    autoRetry = true,
    showInAppToasts = true,
  } = options;

  const fcmService = useRef(FirebaseCloudMessagingService.getInstance());
  const tokenManager = useRef(FCMTokenManager.getInstance());
  const notificationService = useRef<NotificationService | null>(null);
  const appStateSubscription = useRef<any>(null);
  const showNotificationToast = useShowNotificationToast();

  /**
   * Initialize FCM
   */
  const initializeFCM = useCallback(async () => {
    if (!enabled || !userId) {
      console.log('[useFCMNotifications] FCM initialization skipped (disabled or no userId)');
      return;
    }

    try {
      // Initialize notification service if not already done
      if (!notificationService.current) {
        notificationService.current = new NotificationService();
        await notificationService.current.initialize();
      }

      // Initialize FCM
      await fcmService.current.initialize(notificationService.current, userId, {
        debug,
        autoRetry,
      });

      // Request permission
      const granted = await fcmService.current.requestPermission();
      if (!granted) {
        console.warn('[useFCMNotifications] Notification permission not granted');
      }

      console.log('[useFCMNotifications] FCM initialized successfully');
    } catch (error) {
      console.error('[useFCMNotifications] Failed to initialize FCM:', error);
      if (showInAppToasts) {
        showNotificationToast('Failed to initialize notifications');
      }
    }
  }, [enabled, userId, debug, autoRetry, showInAppToasts, showNotificationToast]);

  /**
   * Cleanup FCM on unmount or userId change
   */
  const cleanupFCM = useCallback(async () => {
    try {
      await fcmService.current.shutdown();
      console.log('[useFCMNotifications] FCM cleaned up');
    } catch (error) {
      console.error('[useFCMNotifications] Failed to cleanup FCM:', error);
    }
  }, []);

  /**
   * Handle app state changes (pause/resume)
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to foreground
        console.log('[useFCMNotifications] App resumed, checking token');

        // Check if token needs refresh
        if (userId && tokenManager.current.isTokenExpired(userId)) {
          console.log('[useFCMNotifications] Token expired, reinitializing');
          await cleanupFCM();
          await initializeFCM();
        }
      } else {
        // App has gone to background
        console.log('[useFCMNotifications] App paused');
      }
    },
    [userId, initializeFCM, cleanupFCM]
  );

  /**
   * Effect: Initialize FCM on mount
   */
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    initializeFCM();

    // Subscribe to app state changes
    appStateSubscription.current = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      cleanupFCM();
      appStateSubscription.current?.remove();
    };
  }, [enabled, userId, initializeFCM, cleanupFCM, handleAppStateChange]);

  /**
   * Get current FCM token
   */
  const getToken = useCallback((): string | null => {
    return fcmService.current.getCurrentToken();
  }, []);

  /**
   * Subscribe to a topic
   */
  const subscribeTopic = useCallback(
    async (topic: string): Promise<void> => {
      try {
        await fcmService.current.subscribeToTopic(topic);
        if (showInAppToasts) {
          showNotificationToast(`Subscribed to ${topic}`);
        }
      } catch (error) {
        console.error('[useFCMNotifications] Failed to subscribe to topic:', error);
        if (showInAppToasts) {
          showNotificationToast(`Failed to subscribe to ${topic}`);
        }
      }
    },
    [showInAppToasts, showNotificationToast]
  );

  /**
   * Unsubscribe from a topic
   */
  const unsubscribeTopic = useCallback(
    async (topic: string): Promise<void> => {
      try {
        await fcmService.current.unsubscribeFromTopic(topic);
        if (showInAppToasts) {
          showNotificationToast(`Unsubscribed from ${topic}`);
        }
      } catch (error) {
        console.error('[useFCMNotifications] Failed to unsubscribe from topic:', error);
        if (showInAppToasts) {
          showNotificationToast(`Failed to unsubscribe from ${topic}`);
        }
      }
    },
    [showInAppToasts, showNotificationToast]
  );

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      return await fcmService.current.requestPermission();
    } catch (error) {
      console.error('[useFCMNotifications] Failed to request permission:', error);
      return false;
    }
  }, []);

  /**
   * Delete FCM token (logout/disable)
   */
  const deleteToken = useCallback(async (): Promise<void> => {
    try {
      await fcmService.current.deleteToken();
      await tokenManager.current.clearToken();
      console.log('[useFCMNotifications] FCM token deleted');
    } catch (error) {
      console.error('[useFCMNotifications] Failed to delete token:', error);
      if (showInAppToasts) {
        showNotificationToast('Failed to disable notifications');
      }
    }
  }, [showInAppToasts, showNotificationToast]);

  /**
   * Check if FCM is initialized
   */
  const isInitialized = useCallback((): boolean => {
    return fcmService.current.isInitialized();
  }, []);

  /**
   * Get token from manager
   */
  const getStoredToken = useCallback(async (): Promise<string | null> => {
    return await tokenManager.current.getToken(userId || undefined);
  }, [userId]);

  /**
   * Get token info for debugging
   */
  const getTokenInfo = useCallback(async (): Promise<string> => {
    return await tokenManager.current.getTokenInfo();
  }, []);

  return {
    // Status
    isInitialized: isInitialized(),
    getToken,
    getStoredToken,

    // Actions
    subscribeTopic,
    unsubscribeTopic,
    requestPermission,
    deleteToken,

    // Debug
    getTokenInfo,
  };
}

/**
 * Hook for requesting notification permission at app startup
 */
export function useRequestNotificationPermission() {
  const showNotificationToast = useShowNotificationToast();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const fcmService = FirebaseCloudMessagingService.getInstance();
      const granted = await fcmService.requestPermission();

      if (!granted) {
        showNotificationToast('Notification permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[useRequestNotificationPermission] Failed:', error);
      showNotificationToast('Failed to request notification permission');
      return false;
    }
  }, [showNotificationToast]);

  return { requestPermission };
}

/**
 * Hook for topic subscriptions
 */
export function useTopicSubscription(userId: string | null | undefined) {
  const fcmService = useRef(FirebaseCloudMessagingService.getInstance());

  const subscribe = useCallback(
    async (topic: string): Promise<void> => {
      if (!userId) {
        console.warn('[useTopicSubscription] No userId provided');
        return;
      }

      try {
        await fcmService.current.subscribeToTopic(topic);
        console.log(`[useTopicSubscription] Subscribed to ${topic}`);
      } catch (error) {
        console.error(`[useTopicSubscription] Failed to subscribe to ${topic}:`, error);
        throw error;
      }
    },
    [userId]
  );

  const unsubscribe = useCallback(
    async (topic: string): Promise<void> => {
      try {
        await fcmService.current.unsubscribeFromTopic(topic);
        console.log(`[useTopicSubscription] Unsubscribed from ${topic}`);
      } catch (error) {
        console.error(`[useTopicSubscription] Failed to unsubscribe from ${topic}:`, error);
        throw error;
      }
    },
    []
  );

  return { subscribe, unsubscribe };
}
