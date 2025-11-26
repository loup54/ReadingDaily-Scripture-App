/**
 * Offline Notification Service
 * Manages user notifications for offline events
 * Provides toast notifications for offline state changes and operations
 * Non-blocking, auto-dismissing, theme-aware toasts
 */

import { Alert } from 'react-native';
import { ToastService } from '@/services/notifications/ToastService';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void | Promise<void>;
  };
}

/**
 * Notification callbacks (kept for backward compatibility)
 */
type NotificationCallback = (notification: Notification) => void;
const notificationListeners = new Set<NotificationCallback>();

/**
 * Service for managing offline notifications
 */
export class OfflineNotificationService {
  /**
   * Subscribe to notifications (for backward compatibility)
   */
  static subscribe(callback: NotificationCallback): () => void {
    notificationListeners.add(callback);

    return () => {
      notificationListeners.delete(callback);
    };
  }

  /**
   * Show offline message notification
   */
  static showOfflineMessage(message: string, action?: { label: string; onPress: () => void }): void {
    ToastService.showOfflineMessage(message);

    // Emit for backward compatibility
    const notification: Notification = {
      id: `offline_${Date.now()}`,
      type: 'warning',
      title: 'Offline',
      message,
      duration: 5000,
      action,
    };
    this.emit(notification);
  }

  /**
   * Show sync started notification
   */
  static showSyncStarted(): void {
    ToastService.showInfo('🔄 Syncing', 'Syncing your changes...');

    // Emit for backward compatibility
    const notification: Notification = {
      id: `sync_start_${Date.now()}`,
      type: 'info',
      title: 'Syncing',
      message: 'Syncing your changes...',
    };
    this.emit(notification);
  }

  /**
   * Show sync completion notification
   */
  static showSyncComplete(succeeded: number, failed: number): void {
    ToastService.showSyncSuccess(succeeded, failed);

    // Emit for backward compatibility
    let title = 'Sync Complete';
    let message = `${succeeded} item${succeeded !== 1 ? 's' : ''} synced`;
    let type: NotificationType = 'success';

    if (failed > 0) {
      title = 'Sync Completed with Errors';
      message = `${succeeded} synced, ${failed} failed`;
      type = 'warning';
    }

    const notification: Notification = {
      id: `sync_complete_${Date.now()}`,
      type,
      title,
      message,
      duration: 5000,
    };
    this.emit(notification);
  }

  /**
   * Show sync failed notification
   */
  static showSyncFailed(error: string): void {
    ToastService.showSyncFailed(error, true, () => {
      console.log('[OfflineNotificationService] Retry sync requested');
    });

    // Emit for backward compatibility
    const notification: Notification = {
      id: `sync_failed_${Date.now()}`,
      type: 'error',
      title: 'Sync Failed',
      message: `${error}. Will retry automatically.`,
      duration: 5000,
      action: {
        label: 'Retry',
        onPress: () => {
          console.log('[OfflineNotificationService] Retry sync requested');
        },
      },
    };
    this.emit(notification);
  }

  /**
   * Show storage warning notification
   */
  static showStorageWarning(percentUsed: number): void {
    let message = `Storage ${percentUsed.toFixed(1)}% full`;
    let type: NotificationType = 'warning';

    if (percentUsed >= 95) {
      type = 'error';
      message = `Storage ${percentUsed.toFixed(1)}% full. Clear cache in settings.`;
      ToastService.showError('⚠️ Storage Critical', message);
    } else {
      ToastService.showStorageWarning(percentUsed);
    }

    // Emit for backward compatibility
    const notification: Notification = {
      id: `storage_warning_${Date.now()}`,
      type,
      title: 'Storage Full',
      message,
      duration: 5000,
      action: {
        label: 'Settings',
        onPress: () => {
          console.log('[OfflineNotificationService] Settings requested');
        },
      },
    };
    this.emit(notification);
  }

  /**
   * Show download started notification
   */
  static showDownloadStarted(readingCount: number, audioCount: number): void {
    ToastService.showDownloadStarted(`${readingCount} readings and ${audioCount} audio files`);

    // Emit for backward compatibility
    const notification: Notification = {
      id: `download_started_${Date.now()}`,
      type: 'info',
      title: 'Offline Download',
      message: `Downloading ${readingCount} readings and ${audioCount} audio files...`,
    };
    this.emit(notification);
  }

  /**
   * Show download completion notification
   */
  static showDownloadComplete(readingCount: number, audioCount: number): void {
    ToastService.showDownloadComplete(readingCount + audioCount);

    // Emit for backward compatibility
    const notification: Notification = {
      id: `download_complete_${Date.now()}`,
      type: 'success',
      title: 'Download Complete',
      message: `${readingCount} readings and ${audioCount} audio files are now available offline.`,
      duration: 5000,
    };
    this.emit(notification);
  }

  /**
   * Show download failed notification
   */
  static showDownloadFailed(error: string): void {
    ToastService.showDownloadFailed(error, true, () => {
      console.log('[OfflineNotificationService] Retry download requested');
    });

    // Emit for backward compatibility
    const notification: Notification = {
      id: `download_failed_${Date.now()}`,
      type: 'error',
      title: 'Download Failed',
      message: `${error}. You can try again later.`,
      duration: 5000,
      action: {
        label: 'Retry',
        onPress: () => {
          console.log('[OfflineNotificationService] Retry download requested');
        },
      },
    };
    this.emit(notification);
  }

  /**
   * Show generic offline notification
   */
  static showNotification(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: { label: string; onPress: () => void };
    }
  ): void {
    // Show toast
    switch (type) {
      case 'success':
        ToastService.showSuccess(title, message, options?.duration);
        break;
      case 'error':
        ToastService.showError(title, message, options?.duration);
        break;
      case 'warning':
        ToastService.showWarning(title, message, options?.duration);
        break;
      case 'info':
      default:
        ToastService.showInfo(title, message, options?.duration);
        break;
    }

    // Emit for backward compatibility
    const notification: Notification = {
      id: `notification_${Date.now()}_${Math.random()}`,
      type,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
    };
    this.emit(notification);
  }

  /**
   * Show alert dialog (for critical errors that need acknowledgment)
   * Uses native Alert for important user actions
   */
  static showAlert(
    title: string,
    message: string,
    buttons?: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[]
  ): void {
    console.log('[OfflineNotificationService] Showing alert:', { title, message });
    const alertButtons = buttons || [{ text: 'OK' }];
    Alert.alert(title, message, alertButtons as any);
  }

  /**
   * Private: Emit notification to all listeners (for backward compatibility)
   */
  private static emit(notification: Notification): void {
    console.log('[OfflineNotificationService] Emitting notification:', {
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });

    notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (error) {
        console.error('[OfflineNotificationService] Listener error:', error);
      }
    });
  }
}
