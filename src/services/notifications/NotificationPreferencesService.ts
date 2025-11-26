/**
 * Notification Preferences Service
 *
 * Manages user notification preferences and device token registration
 * Handles opt-in/opt-out for renewal notifications
 */

import { auth } from '../../config/firebase';
import * as admin from 'firebase-admin';
import * as messaging from 'firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  renewalReminders: boolean; // 14, 3, and 0 days before expiry
  expiryWarnings: boolean; // Warnings when subscription is about to expire
  renewalSuccess: boolean; // Notification when renewal succeeds
  renewalFailed: boolean; // Alerts when renewal fails
  marketingEmails: boolean; // Promotional/marketing messages
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  renewalReminders: true,
  expiryWarnings: true,
  renewalSuccess: true,
  renewalFailed: true,
  marketingEmails: false,
};

class NotificationPreferencesServiceClass {
  private readonly PREFERENCES_KEY = 'notification_preferences';
  private readonly DEVICE_TOKEN_KEY = 'device_token';

  /**
   * Register device for push notifications
   */
  async registerDeviceToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('[NotificationPreferencesService] User not authenticated');
        return null;
      }

      // Get Firebase Cloud Messaging token
      let token: string | null = null;

      try {
        // Try to get existing token first
        token = await AsyncStorage.getItem(this.DEVICE_TOKEN_KEY);

        if (!token) {
          // Request new token from Firebase Messaging
          // Note: This requires Firebase Cloud Messaging setup
          // For Expo, use Expo.Notifications instead
          console.log('[NotificationPreferencesService] Would request FCM token via platform');
          // token = await messaging.getToken();
        }
      } catch (error) {
        console.warn('[NotificationPreferencesService] Error getting FCM token:', error);
      }

      if (!token) {
        console.warn('[NotificationPreferencesService] No device token available');
        return null;
      }

      // Save device token to Firestore
      try {
        const userRef = admin.firestore().collection('users').doc(user.uid);
        await userRef.update({
          deviceTokens: admin.firestore.FieldValue.arrayUnion(token),
          lastTokenRegistrationAt: admin.firestore.Timestamp.now(),
        });

        // Cache locally
        await AsyncStorage.setItem(this.DEVICE_TOKEN_KEY, token);

        console.log('[NotificationPreferencesService] Device token registered:', token.substring(0, 20) + '...');
        return token;
      } catch (error) {
        console.error('[NotificationPreferencesService] Error saving device token:', error);
        return null;
      }
    } catch (error) {
      console.error('[NotificationPreferencesService] Error registering device:', error);
      return null;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return DEFAULT_PREFERENCES;
      }

      // Try to get from Firestore first
      const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        const firestorePrefs = data?.notificationPreferences;

        if (firestorePrefs) {
          return { ...DEFAULT_PREFERENCES, ...firestorePrefs };
        }
      }

      // Fall back to local storage
      const localPrefs = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      if (localPrefs) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(localPrefs) };
      }

      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('[NotificationPreferencesService] Error getting preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn('[NotificationPreferencesService] User not authenticated');
        return false;
      }

      const currentPrefs = await this.getPreferences();
      const updatedPrefs = { ...currentPrefs, ...preferences };

      // Update in Firestore
      await admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          notificationPreferences: updatedPrefs,
          preferencesUpdatedAt: admin.firestore.Timestamp.now(),
        });

      // Update local cache
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updatedPrefs));

      console.log('[NotificationPreferencesService] Preferences updated:', updatedPrefs);
      return true;
    } catch (error) {
      console.error('[NotificationPreferencesService] Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Toggle a specific notification type
   */
  async toggleNotificationType(
    notificationType: keyof NotificationPreferences
  ): Promise<boolean> {
    try {
      const currentPrefs = await this.getPreferences();
      const newValue = !currentPrefs[notificationType];

      return await this.updatePreferences({
        [notificationType]: newValue,
      });
    } catch (error) {
      console.error('[NotificationPreferencesService] Error toggling notification:', error);
      return false;
    }
  }

  /**
   * Disable all notifications
   */
  async disableAllNotifications(): Promise<boolean> {
    try {
      const disabledPrefs: NotificationPreferences = {
        renewalReminders: false,
        expiryWarnings: false,
        renewalSuccess: false,
        renewalFailed: false,
        marketingEmails: false,
      };

      return await this.updatePreferences(disabledPrefs);
    } catch (error) {
      console.error('[NotificationPreferencesService] Error disabling notifications:', error);
      return false;
    }
  }

  /**
   * Enable all critical notifications (renewal/expiry)
   */
  async enableCriticalNotifications(): Promise<boolean> {
    try {
      return await this.updatePreferences({
        renewalReminders: true,
        expiryWarnings: true,
        renewalFailed: true,
        renewalSuccess: true,
      });
    } catch (error) {
      console.error('[NotificationPreferencesService] Error enabling critical notifications:', error);
      return false;
    }
  }

  /**
   * Unregister device token (when user logs out or deletes account)
   */
  async unregisterDeviceToken(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return false;
      }

      const token = await AsyncStorage.getItem(this.DEVICE_TOKEN_KEY);
      if (!token) {
        return true; // Already unregistered
      }

      // Remove from Firestore
      await admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          deviceTokens: admin.firestore.FieldValue.arrayRemove(token),
        });

      // Clear local cache
      await AsyncStorage.removeItem(this.DEVICE_TOKEN_KEY);

      console.log('[NotificationPreferencesService] Device token unregistered');
      return true;
    } catch (error) {
      console.error('[NotificationPreferencesService] Error unregistering device:', error);
      return false;
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(limit: number = 20): Promise<any[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return [];
      }

      const snapshot = await admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notificationHistory')
        .orderBy('sentAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[NotificationPreferencesService] Error fetching notification history:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return false;
      }

      await admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notificationHistory')
        .doc(notificationId)
        .update({
          readAt: admin.firestore.Timestamp.now(),
        });

      return true;
    } catch (error) {
      console.error('[NotificationPreferencesService] Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return 0;
      }

      const snapshot = await admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notificationHistory')
        .where('readAt', '==', null)
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('[NotificationPreferencesService] Error getting unread count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const notificationPreferencesService = new NotificationPreferencesServiceClass();
