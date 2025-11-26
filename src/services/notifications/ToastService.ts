/**
 * Toast Service
 * Centralized toast notification management with theme support
 * Handles all offline event notifications with auto-dismiss and actions
 */

import React from 'react';
import Toast, { ToastShowParams, ToastConfig as ToastConfigType } from 'react-native-toast-message';
import { Colors } from '@/constants';
import { CustomToast } from '@/components/notifications/CustomToast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastConfig {
  type: ToastType;
  text1: string;
  text2?: string;
  duration?: number;
  position?: 'top' | 'bottom';
  actions?: ToastAction[];
  isDarkMode?: boolean;
}

/**
 * Toast Service for displaying notifications with theme support
 */
export class ToastService {
  private static readonly DEFAULT_DURATION = 4000; // 4 seconds
  private static readonly LONG_DURATION = 6000; // 6 seconds

  /**
   * Get theme-aware colors for toast
   */
  private static getThemeColors(isDarkMode: boolean) {
    return {
      success: {
        bg: isDarkMode ? '#1F3A1F' : '#E8F5E9',
        text: isDarkMode ? '#A5D6A7' : '#2E7D32',
        border: isDarkMode ? '#4CAF50' : '#81C784',
      },
      error: {
        bg: isDarkMode ? '#3A1F1F' : '#FFEBEE',
        text: isDarkMode ? '#EF9A9A' : '#C62828',
        border: isDarkMode ? '#F44336' : '#EF5350',
      },
      info: {
        bg: isDarkMode ? '#1F2A3A' : '#E3F2FD',
        text: isDarkMode ? '#90CAF9' : '#1565C0',
        border: isDarkMode ? '#2196F3' : '#64B5F6',
      },
      warning: {
        bg: isDarkMode ? '#3A2A1F' : '#FFF3E0',
        text: isDarkMode ? '#FFB74D' : '#E65100',
        border: isDarkMode ? '#FF9800' : '#FFB74D',
      },
    };
  }

  /**
   * Show success toast
   */
  static showSuccess(text1: string, text2?: string, duration?: number) {
    this.show({
      type: 'success',
      text1,
      text2,
      duration: duration || this.DEFAULT_DURATION,
    });
  }

  /**
   * Show error toast
   */
  static showError(text1: string, text2?: string, duration?: number) {
    this.show({
      type: 'error',
      text1,
      text2,
      duration: duration || this.LONG_DURATION,
    });
  }

  /**
   * Show info toast
   */
  static showInfo(text1: string, text2?: string, duration?: number) {
    this.show({
      type: 'info',
      text1,
      text2,
      duration: duration || this.DEFAULT_DURATION,
    });
  }

  /**
   * Show warning toast
   */
  static showWarning(text1: string, text2?: string, duration?: number) {
    this.show({
      type: 'warning',
      text1,
      text2,
      duration: duration || this.LONG_DURATION,
    });
  }

  /**
   * Show sync success toast with operation counts
   */
  static showSyncSuccess(succeeded: number, failed: number) {
    let text1 = '✅ Sync Complete';
    let text2 = `${succeeded} operation(s) synced`;

    if (failed > 0) {
      text2 += ` (${failed} failed)`;
    }

    this.show({
      type: 'success',
      text1,
      text2,
      duration: this.DEFAULT_DURATION,
    });
  }

  /**
   * Show sync failed toast with error details and retry action
   */
  static showSyncFailed(errorSummary: string, showRetry: boolean = false, onRetry?: () => void) {
    const actions: ToastAction[] = [];

    if (showRetry && onRetry) {
      actions.push({
        label: '🔄 Retry',
        onPress: () => {
          console.log('[ToastService] Retry action triggered');
          onRetry();
        },
      });
    }

    this.show({
      type: 'error',
      text1: 'Sync Failed',
      text2: errorSummary,
      duration: this.LONG_DURATION,
      actions,
    });
  }

  /**
   * Show offline message
   */
  static showOfflineMessage(text1: string, text2?: string) {
    this.show({
      type: 'info',
      text1: `📴 ${text1}`,
      text2,
      duration: this.DEFAULT_DURATION,
    });
  }

  /**
   * Show download started toast
   */
  static showDownloadStarted(itemName: string) {
    this.show({
      type: 'info',
      text1: '📥 Download Started',
      text2: `Downloading ${itemName}...`,
      duration: this.DEFAULT_DURATION,
    });
  }

  /**
   * Show download complete toast
   */
  static showDownloadComplete(itemCount: number) {
    this.show({
      type: 'success',
      text1: '✅ Download Complete',
      text2: `${itemCount} item(s) cached for offline`,
      duration: this.DEFAULT_DURATION,
    });
  }

  /**
   * Show download failed toast with retry action
   */
  static showDownloadFailed(error: string, showRetry: boolean = false, onRetry?: () => void) {
    const actions: ToastAction[] = [];

    if (showRetry && onRetry) {
      actions.push({
        label: '🔄 Retry',
        onPress: () => {
          console.log('[ToastService] Download retry action triggered');
          onRetry();
        },
      });
    }

    this.show({
      type: 'error',
      text1: 'Download Failed',
      text2: error,
      duration: this.LONG_DURATION,
      actions,
    });
  }

  /**
   * Show storage warning toast
   */
  static showStorageWarning(percentageUsed: number) {
    this.show({
      type: 'warning',
      text1: '⚠️ Storage Warning',
      text2: `${percentageUsed}% of offline storage used`,
      duration: this.LONG_DURATION,
    });
  }

  /**
   * Show custom toast with optional actions
   */
  private static show(config: ToastConfig) {
    const isDarkMode = config.isDarkMode || false;
    const colors = this.getThemeColors(isDarkMode);
    const typeColors = colors[config.type];

    const params: ToastShowParams = {
      type: config.type,
      position: config.position || 'top',
      text1: config.text1,
      text2: config.text2,
      duration: config.duration || this.DEFAULT_DURATION,
      autoHide: true,
      topOffset: 60,
      bottomOffset: 40,
      style: {
        backgroundColor: typeColors.bg,
        borderLeftWidth: 4,
        borderLeftColor: typeColors.border,
      },
      text1Style: {
        fontSize: 16,
        fontWeight: '600',
        color: typeColors.text,
      },
      text2Style: {
        fontSize: 14,
        color: typeColors.text,
        opacity: 0.8,
      },
    };

    // Add action buttons if provided
    if (config.actions && config.actions.length > 0) {
      params.onPress = config.actions[0].onPress;
      // For multiple actions, we'd need a custom component
      // For now, we support the primary action via onPress
    }

    Toast.show(params);
  }

  /**
   * Hide all toasts
   */
  static hideAll() {
    Toast.hideAll();
  }
}

/**
 * Toast configuration for use with Toast.Config()
 * Configure this in your root layout to enable custom toast rendering
 */
export const toastConfig = {
  success: (props: any) => React.createElement(CustomToast, { ...props, type: 'success' }),
  error: (props: any) => React.createElement(CustomToast, { ...props, type: 'error' }),
  info: (props: any) => React.createElement(CustomToast, { ...props, type: 'info' }),
  warning: (props: any) => React.createElement(CustomToast, { ...props, type: 'warning' }),
};
