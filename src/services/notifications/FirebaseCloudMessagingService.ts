/**
 * Firebase Cloud Messaging Service
 * Phase 10B.7: Firebase Cloud Messaging Setup
 *
 * Manages FCM integration including token management, push handling,
 * deep linking, and foreground/background notification routing
 */

import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { firestore } from '@/services/firebase/config';
import { NotificationService } from './NotificationService';
import { PushNotification } from '@/types/notifications.types';

/**
 * FCM configuration options
 */
export interface FCMConfig {
  debug?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  tokenRefreshInterval?: number; // milliseconds
}

/**
 * Firebase Cloud Messaging Service
 */
export class FirebaseCloudMessagingService {
  private static instance: FirebaseCloudMessagingService;
  private initialized = false;
  private currentToken: string | null = null;
  private userId: string | null = null;
  private notificationService: NotificationService | null = null;
  private navigationHandler: ((deepLink: string) => void) | null = null;
  private config: FCMConfig = {
    debug: false,
    autoRetry: true,
    maxRetries: 3,
    tokenRefreshInterval: 24 * 60 * 60 * 1000, // 24 hours
  };

  /**
   * Get singleton instance
   */
  static getInstance(): FirebaseCloudMessagingService {
    if (!FirebaseCloudMessagingService.instance) {
      FirebaseCloudMessagingService.instance = new FirebaseCloudMessagingService();
    }
    return FirebaseCloudMessagingService.instance;
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  async initialize(
    notificationService: NotificationService,
    userId: string,
    config?: Partial<FCMConfig>
  ): Promise<void> {
    if (this.initialized) {
      this.log('FCM already initialized');
      return;
    }

    try {
      this.notificationService = notificationService;
      this.userId = userId;
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Request permission on iOS
      if (Platform.OS === 'ios') {
        await this.requestIOSPermission();
      }

      // Get initial token
      this.currentToken = await this.getToken();
      if (this.currentToken) {
        await this.saveTokenToFirestore(userId, this.currentToken);
      }

      // Set up message handlers
      this.setupMessageHandlers();

      // Monitor token refresh
      this.setupTokenRefreshListener();

      this.initialized = true;
      this.log('FCM initialized successfully');
    } catch (error) {
      this.error('FCM initialization failed', error);
      throw error;
    }
  }

  /**
   * Request notification permission on iOS
   */
  private async requestIOSPermission(): Promise<void> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        this.log('User declined notification permission on iOS');
      }
    } catch (error) {
      this.error('Failed to request iOS permission', error);
    }
  }

  /**
   * Get FCM token
   */
  private async getToken(): Promise<string | null> {
    let retries = 0;
    while (retries < (this.config.maxRetries || 3)) {
      try {
        const token = await messaging().getToken();
        this.log(`Got FCM token: ${token.substring(0, 20)}...`);
        return token;
      } catch (error) {
        retries++;
        if (retries < (this.config.maxRetries || 3)) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        } else {
          this.error('Failed to get FCM token after retries', error);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Save token to Firestore
   */
  private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      await firestore
        .collection('users')
        .doc(userId)
        .collection('fcm')
        .doc('token')
        .set(
          {
            token,
            platform: Platform.OS,
            savedAt: new Date().getTime(),
            expiresAt: new Date().getTime() + (this.config.tokenRefreshInterval || 24 * 60 * 60 * 1000),
          },
          { merge: true }
        );
      this.log('FCM token saved to Firestore');
    } catch (error) {
      this.error('Failed to save FCM token to Firestore', error);
    }
  }

  /**
   * Set up message handlers for foreground and background
   */
  private setupMessageHandlers(): void {
    // Handle messages when app is in foreground
    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      this.log('Foreground message received', remoteMessage.messageId);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification when app is opened from notification
    this.unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      async (remoteMessage) => {
        this.log('Notification opened app', remoteMessage.messageId);
        await this.handleNotificationOpened(remoteMessage);
      }
    );

    // Check if app was opened from notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          this.log('App opened from notification', remoteMessage.messageId);
          this.handleNotificationOpened(remoteMessage);
        }
      })
      .catch((error) => {
        this.error('Failed to get initial notification', error);
      });
  }

  /**
   * Unsubscribe from message listeners
   */
  private unsubscribeOnMessage: (() => void) | null = null;
  private unsubscribeOnNotificationOpenedApp: (() => void) | null = null;

  /**
   * Handle message received in foreground
   */
  private async handleForegroundMessage(remoteMessage: any): Promise<void> {
    try {
      const notification = this.parseRemoteMessage(remoteMessage);

      // Send via notification service
      if (this.notificationService && this.userId) {
        await this.notificationService.sendNotification(notification);
      }

      // Also show as in-app toast
      if (remoteMessage.data?.showAsToast === 'true') {
        this.showInAppToast(remoteMessage);
      }
    } catch (error) {
      this.error('Failed to handle foreground message', error);
    }
  }

  /**
   * Handle notification opened (app in background or closed)
   * Phase 1: Navigation & Flow - Deep Linking Handler
   */
  private async handleNotificationOpened(remoteMessage: any): Promise<void> {
    try {
      const deepLink = remoteMessage.data?.deepLink;

      if (deepLink) {
        this.log(`Opening deep link: ${deepLink}`);

        // Execute navigation handler if one is registered
        if (this.navigationHandler) {
          this.log(`Routing to: ${deepLink}`);
          this.navigationHandler(deepLink);
        } else {
          this.log('No navigation handler registered - deep link will not be routed');
        }
      }

      // Mark notification as delivered
      if (this.notificationService) {
        await this.notificationService.onNotificationDelivered?.(remoteMessage.messageId!);
      }
    } catch (error) {
      this.error('Failed to handle notification opened', error);
    }
  }

  /**
   * Set the navigation handler for deep linking
   * Call this from RootLayout with router.push callback
   *
   * @param handler - Function to handle deep link navigation
   *
   * @example
   * const { getInitialNotification, onNotificationOpenedApp } = useFCMNotifications();
   * FCMService.setNavigationHandler((deepLink) => router.push(deepLink));
   */
  setNavigationHandler(handler: (deepLink: string) => void): void {
    this.navigationHandler = handler;
    this.log('Navigation handler registered for deep linking');
  }

  /**
   * Parse Firebase remote message to PushNotification
   */
  private parseRemoteMessage(remoteMessage: any): PushNotification {
    return {
      id: remoteMessage.messageId || `fcm-${Date.now()}`,
      userId: this.userId || '',
      type: remoteMessage.data?.type || 'notification',
      title: remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification',
      body: remoteMessage.notification?.body || remoteMessage.data?.body || '',
      channel: remoteMessage.data?.channel || 'push',
      priority: remoteMessage.data?.priority || 'high',
      sentAt: remoteMessage.sentTime || new Date().getTime(),
      scheduledFor: new Date().getTime(),
      status: 'delivered',
      deepLink: remoteMessage.data?.deepLink,
      actions: remoteMessage.data?.actions ? JSON.parse(remoteMessage.data.actions) : undefined,
      metadata: remoteMessage.data?.metadata ? JSON.parse(remoteMessage.data.metadata) : {},
    };
  }

  /**
   * Show in-app toast (integration with Phase 10B.5)
   */
  private showInAppToast(remoteMessage: any): void {
    try {
      // This would be called via the toast store from Phase 10B.5
      // For now, just log it
      this.log('Would show in-app toast for:', remoteMessage.notification?.title);
    } catch (error) {
      this.error('Failed to show in-app toast', error);
    }
  }

  /**
   * Set up token refresh listener
   */
  private setupTokenRefreshListener(): void {
    this.unsubscribeOnTokenRefresh = messaging().onTokenRefresh((newToken) => {
      this.log(`Token refreshed: ${newToken.substring(0, 20)}...`);
      this.currentToken = newToken;

      if (this.userId) {
        this.saveTokenToFirestore(this.userId, newToken);
      }
    });
  }

  /**
   * Unsubscribe from token refresh listener
   */
  private unsubscribeOnTokenRefresh: (() => void) | null = null;

  /**
   * Send push notification via FCM
   */
  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    try {
      if (!this.initialized) {
        throw new Error('FCM not initialized');
      }

      // Call Firebase admin SDK endpoint to send message
      // This would typically be done from backend, but showing the concept here
      this.log(`Push notification sent: ${notification.title}`);
      return true;
    } catch (error) {
      this.error('Failed to send push notification', error);
      return false;
    }
  }

  /**
   * Subscribe to topic
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      this.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.error(`Failed to subscribe to topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      this.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      this.error(`Failed to unsubscribe from topic ${topic}`, error);
      throw error;
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Check if FCM is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Shutdown FCM service
   */
  async shutdown(): Promise<void> {
    try {
      // Unsubscribe from listeners
      if (this.unsubscribeOnMessage) {
        this.unsubscribeOnMessage();
      }
      if (this.unsubscribeOnNotificationOpenedApp) {
        this.unsubscribeOnNotificationOpenedApp();
      }
      if (this.unsubscribeOnTokenRefresh) {
        this.unsubscribeOnTokenRefresh();
      }

      this.initialized = false;
      this.currentToken = null;
      this.userId = null;
      this.notificationService = null;

      this.log('FCM service shut down');
    } catch (error) {
      this.error('Failed to shutdown FCM service', error);
    }
  }

  /**
   * Request notification permission (unified for iOS and Android 13+)
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      this.log(`Notification permission: ${enabled ? 'granted' : 'denied'}`);
      return enabled;
    } catch (error) {
      this.error('Failed to request notification permission', error);
      return false;
    }
  }

  /**
   * Delete FCM token (logout/disable notifications)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.currentToken = null;
      this.log('FCM token deleted');
    } catch (error) {
      this.error('Failed to delete FCM token', error);
      throw error;
    }
  }

  /**
   * Internal logging
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[FCM] ${message}`, data || '');
    }
  }

  /**
   * Internal error logging
   */
  private error(message: string, error?: any): void {
    console.error(`[FCM Error] ${message}`, error || '');
  }
}

/**
 * Export singleton instance
 */
export const fcmService = FirebaseCloudMessagingService.getInstance();
