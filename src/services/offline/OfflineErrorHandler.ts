/**
 * Offline Error Handler Service
 * Provides user-friendly error messages for offline scenarios
 * Centralizes error handling logic for offline operations
 */

import { NetworkStatusService } from '@/services/network/NetworkStatusService';

export interface OfflineErrorResponse {
  type: 'offline' | 'online_error' | 'not_cached' | 'unknown';
  message: string;
  suggestion: string;
  actionLabel?: string;
  actionCallback?: () => void | Promise<void>;
}

/**
 * Service for handling offline-related errors with user-friendly messages
 */
export class OfflineErrorHandler {
  /**
   * Handle reading fetch errors
   */
  static handleReadingFetchError(error: any, date: string): OfflineErrorResponse {
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      return {
        type: 'offline',
        message: `Reading for ${date} is not available offline`,
        suggestion: 'Download readings for offline access or connect to the internet',
        actionLabel: 'Download Readings',
      };
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return {
        type: 'not_cached',
        message: `No reading found for ${date}`,
        suggestion: 'This reading may not be available yet. Try checking again tomorrow.',
      };
    }

    return {
      type: 'online_error',
      message: 'Failed to load reading',
      suggestion: `${error instanceof Error ? error.message : 'Unknown error'}. Try again or contact support.`,
      actionLabel: 'Retry',
    };
  }

  /**
   * Handle audio generation errors
   */
  static handleAudioGenerationError(error: any): OfflineErrorResponse {
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      return {
        type: 'offline',
        message: 'Audio not cached for offline playback',
        suggestion:
          'Audio must be generated when you have an internet connection. Enable offline downloads in settings.',
        actionLabel: 'Settings',
      };
    }

    if (
      error instanceof Error &&
      error.message.includes('quota')
    ) {
      return {
        type: 'online_error',
        message: 'Audio generation quota exceeded',
        suggestion:
          'Too many audio files generated today. Try again tomorrow or upgrade your account.',
      };
    }

    return {
      type: 'online_error',
      message: 'Failed to generate audio',
      suggestion: `${error instanceof Error ? error.message : 'Unknown error'}. Try again later.`,
      actionLabel: 'Retry',
    };
  }

  /**
   * Handle translation errors
   */
  static handleTranslationError(word: string, error: any): OfflineErrorResponse {
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      return {
        type: 'offline',
        message: `"${word}" is not cached for offline translation`,
        suggestion:
          'This word needs to be translated online first. Connect to the internet or download language packs in settings.',
        actionLabel: 'Settings',
      };
    }

    if (
      error instanceof Error &&
      error.message.includes('API')
    ) {
      return {
        type: 'online_error',
        message: 'Translation service unavailable',
        suggestion: 'The translation service is temporarily unavailable. Try again later.',
        actionLabel: 'Retry',
      };
    }

    return {
      type: 'online_error',
      message: `Failed to translate "${word}"`,
      suggestion: `${error instanceof Error ? error.message : 'Unknown error'}.`,
      actionLabel: 'Retry',
    };
  }

  /**
   * Handle storage errors
   */
  static handleStorageError(error: any): OfflineErrorResponse {
    if (error instanceof Error && error.message.includes('quota')) {
      return {
        type: 'online_error',
        message: 'Storage quota exceeded',
        suggestion:
          'Your offline storage is full. Clear some cache in settings to make room for new downloads.',
        actionLabel: 'Settings',
      };
    }

    if (error instanceof Error && error.message.includes('permission')) {
      return {
        type: 'online_error',
        message: 'Storage permission denied',
        suggestion: 'The app needs permission to store offline data. Check your settings.',
      };
    }

    return {
      type: 'online_error',
      message: 'Storage error occurred',
      suggestion: `${error instanceof Error ? error.message : 'Unknown error'}.`,
    };
  }

  /**
   * Handle download errors
   */
  static handleDownloadError(error: any): OfflineErrorResponse {
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      return {
        type: 'offline',
        message: 'Cannot download offline data',
        suggestion: 'Connect to the internet to download readings, audio, and translations for offline use.',
      };
    }

    if (error instanceof Error && error.message.includes('storage')) {
      return {
        type: 'online_error',
        message: 'Insufficient storage space',
        suggestion:
          'Your device storage is too low. Free up space and try again.',
        actionLabel: 'Settings',
      };
    }

    return {
      type: 'online_error',
      message: 'Download failed',
      suggestion: `${error instanceof Error ? error.message : 'Unknown error'}. Check your internet and try again.`,
      actionLabel: 'Retry',
    };
  }

  /**
   * Handle sync errors
   */
  static handleSyncError(error: any): OfflineErrorResponse {
    const networkState = NetworkStatusService.getCurrentState();
    const isOnline = networkState.status === 'online';

    if (!isOnline) {
      return {
        type: 'offline',
        message: 'Cannot sync changes offline',
        suggestion: 'Your changes will be synced automatically when you connect to the internet.',
      };
    }

    if (error instanceof Error && error.message.includes('conflict')) {
      return {
        type: 'online_error',
        message: 'Sync conflict detected',
        suggestion:
          'Your changes conflict with the server. Your local changes have been saved and will be synced.',
      };
    }

    return {
      type: 'online_error',
      message: 'Sync failed',
      suggestion: `${error instanceof Error ? error.message : 'Unknown error'}. Will retry automatically.`,
      actionLabel: 'Retry Now',
    };
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Format error for logging
   */
  static logError(context: string, error: any, offlineErrorResponse: OfflineErrorResponse): void {
    console.error(`[OfflineErrorHandler] ${context}:`, {
      type: offlineErrorResponse.type,
      message: offlineErrorResponse.message,
      originalError: error instanceof Error ? error.message : error,
    });
  }
}
