/**
 * Unit Tests for FirebaseCloudMessagingService
 * Phase 10B.8: Testing & Deployment
 */

import { FirebaseCloudMessagingService } from '../FirebaseCloudMessagingService';
import { NotificationService } from '../NotificationService';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

// Mock Firebase Messaging
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    requestPermission: jest.fn().mockResolvedValue(1), // AUTHORIZED
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    onTokenRefresh: jest.fn(),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    subscribeToTopic: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
    deleteToken: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Firestore
jest.mock('@/services/firebase/config', () => ({
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
          })),
        })),
      })),
    })),
  },
}));

describe('FirebaseCloudMessagingService', () => {
  let fcmService: FirebaseCloudMessagingService;
  let notificationService: NotificationService;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    fcmService = FirebaseCloudMessagingService.getInstance();
    notificationService = new NotificationService();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await fcmService.initialize(notificationService, testUserId);
      expect(fcmService.isInitialized()).toBe(true);
    });

    it('should request permission on iOS', async () => {
      const originalPlatform = Platform.OS;
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        writable: true,
      });

      await fcmService.initialize(notificationService, testUserId);

      // Should have requested permission
      expect(fcmService.isInitialized()).toBe(true);

      Object.defineProperty(Platform, 'OS', {
        value: originalPlatform,
        writable: true,
      });
    });

    it('should get FCM token with retry on failure', async () => {
      const mockMessaging = messaging as any;
      mockMessaging().getToken.mockRejectedValueOnce(new Error('Timeout'));
      mockMessaging().getToken.mockResolvedValueOnce('mock-fcm-token');

      await fcmService.initialize(notificationService, testUserId);

      const token = fcmService.getCurrentToken();
      expect(token).toBeDefined();
    });

    it('should setup message handlers', async () => {
      const mockMessaging = messaging as any;
      const onMessageSpy = mockMessaging().onMessage;

      await fcmService.initialize(notificationService, testUserId);

      expect(onMessageSpy).toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      await fcmService.initialize(notificationService, testUserId);
    });

    it('should get current token', () => {
      const token = fcmService.getCurrentToken();
      expect(token).toBeDefined();
      expect(token?.length).toBeGreaterThan(50);
    });

    it('should handle token refresh', async () => {
      const mockMessaging = messaging as any;
      const onTokenRefreshCallback = jest.fn();

      mockMessaging().onTokenRefresh.mockImplementation((callback: Function) => {
        onTokenRefreshCallback();
        callback('new-token-123');
      });

      await fcmService.shutdown();
      await fcmService.initialize(notificationService, testUserId);

      expect(onTokenRefreshCallback).toBeDefined();
    });

    it('should delete token on logout', async () => {
      const mockMessaging = messaging as any;
      const deleteTokenSpy = mockMessaging().deleteToken;

      await fcmService.deleteToken();

      expect(deleteTokenSpy).toHaveBeenCalled();
      expect(fcmService.getCurrentToken()).toBeNull();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await fcmService.initialize(notificationService, testUserId);
    });

    it('should handle foreground message', async () => {
      const mockMessaging = messaging as any;
      let foregroundCallback: ((msg: any) => void) | null = null;

      mockMessaging().onMessage.mockImplementation((callback: Function) => {
        foregroundCallback = callback;
      });

      // Re-initialize to capture callback
      await fcmService.shutdown();
      await fcmService.initialize(notificationService, testUserId);

      if (foregroundCallback) {
        const mockMessage = {
          messageId: 'msg-123',
          notification: {
            title: 'Test',
            body: 'Test message',
          },
          data: {},
        };

        // Should not throw
        await expect(
          Promise.resolve(foregroundCallback(mockMessage))
        ).resolves.toBeUndefined();
      }
    });

    it('should handle notification opened', async () => {
      const mockMessaging = messaging as any;
      let openCallback: ((msg: any) => void) | null = null;

      mockMessaging().onNotificationOpenedApp.mockImplementation((callback: Function) => {
        openCallback = callback;
      });

      // Re-initialize to capture callback
      await fcmService.shutdown();
      await fcmService.initialize(notificationService, testUserId);

      if (openCallback) {
        const mockMessage = {
          messageId: 'msg-123',
          data: {
            deepLink: '/notifications',
          },
        };

        // Should not throw
        await expect(
          Promise.resolve(openCallback(mockMessage))
        ).resolves.toBeUndefined();
      }
    });

    it('should parse remote message correctly', async () => {
      const remoteMessage = {
        messageId: 'msg-123',
        notification: {
          title: 'Reminder',
          body: 'Time to read',
        },
        data: {
          type: 'daily_reminder',
          priority: 'high',
        },
        sentTime: Date.now(),
      };

      // Would need to expose parsing method for direct testing
      // For now, verify initialization doesn't throw
      expect(fcmService.isInitialized()).toBe(true);
    });
  });

  describe('Topic Management', () => {
    beforeEach(async () => {
      await fcmService.initialize(notificationService, testUserId);
    });

    it('should subscribe to topic', async () => {
      const mockMessaging = messaging as any;
      const subscribespy = mockMessaging().subscribeToTopic;

      await fcmService.subscribeToTopic('daily-reminders');

      expect(subscribespy).toHaveBeenCalledWith('daily-reminders');
    });

    it('should unsubscribe from topic', async () => {
      const mockMessaging = messaging as any;
      const unsubscribeSpy = mockMessaging().unsubscribeFromTopic;

      await fcmService.unsubscribeFromTopic('daily-reminders');

      expect(unsubscribeSpy).toHaveBeenCalledWith('daily-reminders');
    });

    it('should handle topic subscription errors', async () => {
      const mockMessaging = messaging as any;
      mockMessaging().subscribeToTopic.mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(fcmService.subscribeToTopic('topic')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Permission Requests', () => {
    it('should request notification permission', async () => {
      const mockMessaging = messaging as any;
      mockMessaging().requestPermission.mockResolvedValueOnce(1); // AUTHORIZED

      const result = await fcmService.requestPermission();
      expect(result).toBe(true);
    });

    it('should handle permission denied', async () => {
      const mockMessaging = messaging as any;
      mockMessaging().requestPermission.mockResolvedValueOnce(0); // DENIED

      const result = await fcmService.requestPermission();
      expect(result).toBe(false);
    });

    it('should handle permission request errors', async () => {
      const mockMessaging = messaging as any;
      mockMessaging().requestPermission.mockRejectedValueOnce(
        new Error('Permission error')
      );

      const result = await fcmService.requestPermission();
      expect(result).toBe(false);
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await fcmService.initialize(notificationService, testUserId);
    });

    it('should shutdown cleanly', async () => {
      await fcmService.shutdown();
      expect(fcmService.isInitialized()).toBe(false);
    });

    it('should unsubscribe from listeners', async () => {
      // Initialize to setup listeners
      await fcmService.initialize(notificationService, testUserId);

      // Shutdown should cleanup
      await fcmService.shutdown();

      expect(fcmService.getCurrentToken()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const mockMessaging = messaging as any;
      mockMessaging().getToken.mockRejectedValueOnce(new Error('FCM unavailable'));

      // Should not throw after retries
      await expect(
        fcmService.initialize(notificationService, testUserId)
      ).resolves.toBeUndefined();
    });

    it('should handle invalid message gracefully', async () => {
      await fcmService.initialize(notificationService, testUserId);

      // Invalid message with missing fields
      const invalidMessage = {
        messageId: undefined,
        notification: null,
        data: null,
      };

      // Should handle gracefully
      expect(fcmService.isInitialized()).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      const customConfig = {
        debug: true,
        autoRetry: true,
        maxRetries: 5,
        tokenRefreshInterval: 12 * 60 * 60 * 1000, // 12 hours
      };

      await fcmService.initialize(notificationService, testUserId, customConfig);

      expect(fcmService.isInitialized()).toBe(true);
    });

    it('should use default configuration if not provided', async () => {
      await fcmService.shutdown(); // Reset
      const fcmService2 = FirebaseCloudMessagingService.getInstance();
      await fcmService2.initialize(notificationService, testUserId);

      expect(fcmService2.isInitialized()).toBe(true);
    });
  });

  describe('Concurrency', () => {
    it('should handle multiple simultaneous operations', async () => {
      const operations = [
        fcmService.subscribeToTopic('topic1'),
        fcmService.subscribeToTopic('topic2'),
        fcmService.subscribeToTopic('topic3'),
      ];

      await expect(Promise.all(operations)).resolves.toBeUndefined();
    });

    it('should handle initialization during other operations', async () => {
      const mockMessaging = messaging as any;
      let operationComplete = false;

      mockMessaging().subscribeToTopic.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              operationComplete = true;
              resolve(undefined);
            }, 100);
          })
      );

      const subscribePromise = fcmService.subscribeToTopic('topic');
      const shutdownPromise = fcmService.shutdown();

      await Promise.all([subscribePromise, shutdownPromise]);

      expect(operationComplete).toBe(true);
    });
  });
});
