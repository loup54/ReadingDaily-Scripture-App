/**
 * Subscription Renewal Notification Service
 *
 * Manages push notifications for subscription renewals:
 * - Sends reminders before subscription expiry
 * - Notifies of successful renewals
 * - Alerts to failed renewal attempts
 * - Provides renewal status updates
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface RenewalNotificationRequest {
  userId: string;
  notificationType: 'renewal_reminder' | 'renewal_success' | 'renewal_failed' | 'expiry_warning';
  subscriptionId: string;
  expiryDate?: number; // Unix timestamp
  daysUntilExpiry?: number;
  reason?: string;
  idToken: string;
}

interface NotificationScheduleConfig {
  daysBeforeExpiry: number; // How many days before expiry to send notification
  notificationType: 'renewal_reminder' | 'renewal_success' | 'renewal_failed' | 'expiry_warning';
  enabled: boolean;
}

class SubscriptionRenewalServiceClass {
  private readonly NOTIFICATION_SCHEDULES: NotificationScheduleConfig[] = [
    { daysBeforeExpiry: 14, notificationType: 'renewal_reminder', enabled: true },
    { daysBeforeExpiry: 3, notificationType: 'expiry_warning', enabled: true },
    { daysBeforeExpiry: 0, notificationType: 'renewal_reminder', enabled: true }, // Day of expiry
  ];

  /**
   * Send renewal notification to user
   */
  async sendRenewalNotification(
    userId: string,
    notification: RenewalNotificationRequest
  ): Promise<{ success: boolean; message: string; notificationId?: string }> {
    try {
      // Get user's device tokens for push notifications
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return { success: false, message: 'User not found' };
      }

      const userData = userDoc.data();
      const deviceTokens = userData?.deviceTokens || [];

      if (deviceTokens.length === 0) {
        console.log('[SubscriptionRenewalService] No device tokens for user:', userId);
        // Still record the notification attempt
        await this.recordNotificationAttempt(userId, notification);
        return { success: false, message: 'No device tokens registered' };
      }

      // Build notification message based on type
      const notificationPayload = this.buildNotificationPayload(notification);

      // Send push notification
      const notificationId = await this.sendPushNotification(
        deviceTokens,
        notificationPayload,
        notification.notificationType
      );

      // Record notification in Firestore
      await this.recordNotificationAttempt(userId, notification, notificationId);

      // Update user's notification preferences
      await this.updateNotificationRecord(userId, notification, true);

      console.log(
        `[SubscriptionRenewalService] Sent ${notification.notificationType} notification to user: ${userId}`
      );

      return {
        success: true,
        message: `${notification.notificationType} notification sent`,
        notificationId,
      };
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error sending notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Schedule notifications for a subscription based on expiry date
   */
  async scheduleRenewalNotifications(
    userId: string,
    subscriptionId: string,
    expiryDate: number // Unix timestamp
  ): Promise<void> {
    try {
      const now = Date.now();
      const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

      console.log(
        `[SubscriptionRenewalService] Scheduling notifications for user: ${userId}, expiry in ${daysUntilExpiry} days`
      );

      // Schedule notifications based on configured schedule
      for (const schedule of this.NOTIFICATION_SCHEDULES) {
        if (!schedule.enabled) continue;

        // Check if we should send this notification now
        if (daysUntilExpiry <= schedule.daysBeforeExpiry) {
          const notification: RenewalNotificationRequest = {
            userId,
            notificationType: schedule.notificationType,
            subscriptionId,
            expiryDate,
            daysUntilExpiry,
            idToken: '', // Not needed for backend scheduling
          };

          await this.sendRenewalNotification(userId, notification);
        } else {
          // Schedule for future delivery using Cloud Scheduler
          await this.scheduleNotificationForLater(
            userId,
            subscriptionId,
            expiryDate,
            schedule
          );
        }
      }
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error scheduling notifications:', error);
    }
  }

  /**
   * Check and send notifications for expiring subscriptions (run via Cloud Scheduler)
   */
  async checkAndNotifyExpiringSubscriptions(): Promise<{
    processed: number;
    notificationsSent: number;
  }> {
    try {
      let processed = 0;
      let notificationsSent = 0;

      // Get all users with active subscriptions
      const usersSnapshot = await admin
        .firestore()
        .collection('users')
        .where('subscriptionStatus', '==', 'active')
        .get();

      console.log(
        `[SubscriptionRenewalService] Checking ${usersSnapshot.size} active subscriptions for expiry`
      );

      const now = Date.now();

      // Check each user's subscription
      for (const userDoc of usersSnapshot.docs) {
        processed++;
        const userData = userDoc.data();
        const expiryDate = userData.subscriptionExpiryDate?.toMillis();

        if (!expiryDate) continue;

        const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

        // Determine which notifications to send
        for (const schedule of this.NOTIFICATION_SCHEDULES) {
          if (!schedule.enabled) continue;

          // Send notification if expiry matches schedule (with 12-hour buffer)
          const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
          const scheduledHours = schedule.daysBeforeExpiry * 24;

          if (
            hoursUntilExpiry <= scheduledHours &&
            hoursUntilExpiry > scheduledHours - 12
          ) {
            // Check if we already sent this notification
            const alreadySent = await this.hasNotificationBeenSent(
              userDoc.id,
              schedule.notificationType,
              expiryDate
            );

            if (!alreadySent) {
              const notification: RenewalNotificationRequest = {
                userId: userDoc.id,
                notificationType: schedule.notificationType,
                subscriptionId: userData.subscriptionId,
                expiryDate,
                daysUntilExpiry,
                idToken: '',
              };

              await this.sendRenewalNotification(userDoc.id, notification);
              notificationsSent++;
            }
          }
        }
      }

      console.log(
        `[SubscriptionRenewalService] Processed ${processed} subscriptions, sent ${notificationsSent} notifications`
      );

      return { processed, notificationsSent };
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error in notification check:', error);
      return { processed: 0, notificationsSent: 0 };
    }
  }

  /**
   * Build notification payload based on notification type
   */
  private buildNotificationPayload(notification: RenewalNotificationRequest): {
    title: string;
    body: string;
    data: Record<string, string>;
  } {
    const daysLeft = notification.daysUntilExpiry || 0;

    switch (notification.notificationType) {
      case 'renewal_reminder':
        return {
          title: 'Your subscription is about to renew',
          body:
            daysLeft > 0
              ? `Your Reading Daily subscription renews in ${daysLeft} day(s)`
              : 'Your subscription renews today',
          data: {
            type: 'renewal_reminder',
            subscriptionId: notification.subscriptionId,
            expiryDate: notification.expiryDate?.toString() || '',
          },
        };

      case 'expiry_warning':
        return {
          title: 'Your subscription expires soon',
          body:
            daysLeft > 0
              ? `Only ${daysLeft} day(s) left before renewal`
              : 'Your subscription expires today! Renew now to keep your premium features.',
          data: {
            type: 'expiry_warning',
            subscriptionId: notification.subscriptionId,
            action: 'OPEN_SUBSCRIPTION_SETTINGS',
          },
        };

      case 'renewal_success':
        return {
          title: 'Subscription renewed successfully',
          body: 'Your Reading Daily subscription has been renewed. Enjoy uninterrupted access!',
          data: {
            type: 'renewal_success',
            subscriptionId: notification.subscriptionId,
          },
        };

      case 'renewal_failed':
        return {
          title: 'Subscription renewal failed',
          body:
            notification.reason ||
            'We were unable to renew your subscription. Please update your payment method.',
          data: {
            type: 'renewal_failed',
            subscriptionId: notification.subscriptionId,
            action: 'OPEN_SUBSCRIPTION_SETTINGS',
          },
        };

      default:
        return {
          title: 'Subscription update',
          body: 'Update about your Reading Daily subscription',
          data: { type: 'subscription_update' },
        };
    }
  }

  /**
   * Send push notification to devices
   */
  private async sendPushNotification(
    deviceTokens: string[],
    payload: { title: string; body: string; data: Record<string, string> },
    notificationType: string
  ): Promise<string> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          ...payload.data,
          timestamp: Date.now().toString(),
        },
        android: {
          priority: 'high',
          notification: {
            title: payload.title,
            body: payload.body,
            icon: 'ic_notification',
            color: '#FF6B35',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: payload.title,
                body: payload.body,
              },
              badge: 1,
              sound: 'default',
              'content-available': 1,
            },
          },
        },
      };

      // Send to multiple devices
      const sendPromises = deviceTokens.map((token) =>
        admin.messaging().send({ ...message, token }).catch((error) => {
          console.warn(`[SubscriptionRenewalService] Failed to send to token ${token}:`, error);
          return null;
        })
      );

      const results = await Promise.all(sendPromises);
      const successCount = results.filter((r) => r !== null).length;

      console.log(
        `[SubscriptionRenewalService] Sent ${successCount}/${deviceTokens.length} notifications (${notificationType})`
      );

      // Return first successful message ID
      return results[0] || `notification_${Date.now()}`;
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error sending push notifications:', error);
      throw error;
    }
  }

  /**
   * Record notification attempt in Firestore
   */
  private async recordNotificationAttempt(
    userId: string,
    notification: RenewalNotificationRequest,
    notificationId?: string
  ): Promise<void> {
    try {
      await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('notificationHistory')
        .add({
          type: notification.notificationType,
          subscriptionId: notification.subscriptionId,
          expiryDate: notification.expiryDate
            ? new Date(notification.expiryDate)
            : null,
          daysUntilExpiry: notification.daysUntilExpiry,
          notificationId,
          sentAt: admin.firestore.Timestamp.now(),
          delivered: !!notificationId,
        });
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error recording notification:', error);
    }
  }

  /**
   * Update user's notification record
   */
  private async updateNotificationRecord(
    userId: string,
    notification: RenewalNotificationRequest,
    success: boolean
  ): Promise<void> {
    try {
      if (notification.notificationType === 'renewal_success') {
        // Update last renewal notification sent
        await admin.firestore().collection('users').doc(userId).update({
          lastRenewalNotificationSentAt: admin.firestore.Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error updating notification record:', error);
    }
  }

  /**
   * Schedule notification for later delivery via Cloud Scheduler
   */
  private async scheduleNotificationForLater(
    userId: string,
    subscriptionId: string,
    expiryDate: number,
    schedule: NotificationScheduleConfig
  ): Promise<void> {
    try {
      const scheduledTime = new Date(expiryDate - schedule.daysBeforeExpiry * 24 * 60 * 60 * 1000);

      // Store scheduled notification task (Cloud Scheduler would trigger this)
      await admin
        .firestore()
        .collection('scheduledNotifications')
        .add({
          userId,
          subscriptionId,
          notificationType: schedule.notificationType,
          scheduledFor: scheduledTime,
          expiryDate: new Date(expiryDate),
          createdAt: admin.firestore.Timestamp.now(),
          sent: false,
        });

      console.log(
        `[SubscriptionRenewalService] Scheduled ${schedule.notificationType} for ${userId} at ${scheduledTime.toISOString()}`
      );
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error scheduling notification:', error);
    }
  }

  /**
   * Check if notification was already sent
   */
  private async hasNotificationBeenSent(
    userId: string,
    notificationType: string,
    expiryDate: number
  ): Promise<boolean> {
    try {
      const query = await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('notificationHistory')
        .where('type', '==', notificationType)
        .where('expiryDate', '==', new Date(expiryDate))
        .limit(1)
        .get();

      return !query.empty;
    } catch (error) {
      console.error('[SubscriptionRenewalService] Error checking notification history:', error);
      return false;
    }
  }
}

// Export singleton instance
export const subscriptionRenewalService = new SubscriptionRenewalServiceClass();

/**
 * Cloud Function: sendRenewalNotification
 * Called by client to trigger renewal notifications
 */
export const sendRenewalNotification = functions.https.onCall<
  RenewalNotificationRequest,
  { success: boolean; message: string; notificationId?: string }
>(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    if (data.userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot send notifications for other users');
    }

    const result = await subscriptionRenewalService.sendRenewalNotification(userId, data);
    return result;
  } catch (error) {
    console.error('[sendRenewalNotification] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});

/**
 * Cloud Scheduler Task: checkExpiringSubscriptions
 * Run daily to check and notify expiring subscriptions
 * Triggered via Cloud Scheduler (e.g., "0 9 * * *" = 9 AM daily)
 */
export const checkExpiringSubscriptions = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('[checkExpiringSubscriptions] Starting scheduled task');
      const result = await subscriptionRenewalService.checkAndNotifyExpiringSubscriptions();

      console.log('[checkExpiringSubscriptions] Task completed:', result);
      return result;
    } catch (error) {
      console.error('[checkExpiringSubscriptions] Error:', error);
      throw error;
    }
  });
