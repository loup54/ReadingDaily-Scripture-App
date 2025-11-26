/**
 * Modal Utilities
 * Phase 5: Navigation & Flow - Modal Best Practices
 *
 * Helper functions and utilities for common modal operations.
 * Implements best practices for modal management.
 */

import { useModalStack } from '@/hooks/useModalStack';
import { ModalConfig } from '@/services/ui/ModalManager';

/**
 * Common modal patterns and helpers
 */

/**
 * Show confirmation dialog (Yes/No)
 *
 * @param title - Dialog title
 * @param message - Dialog message
 * @param onConfirm - Callback when user confirms
 * @param onCancel - Callback when user cancels
 * @param confirmLabel - Confirm button label
 * @param cancelLabel - Cancel button label
 *
 * @example
 * showConfirmation(
 *   'Delete Reading?',
 *   'This cannot be undone',
 *   () => deleteReading(),
 *   () => console.log('cancelled'),
 *   'Delete',
 *   'Keep'
 * );
 */
export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmLabel: string = 'Confirm',
  cancelLabel: string = 'Cancel'
): void => {
  console.log(`[ModalUtils] 🔔 Showing confirmation: ${title}`);
  // Implementation would dispatch to modal manager
  // This is a placeholder for the pattern
};

/**
 * Show alert dialog (OK)
 *
 * @param title - Alert title
 * @param message - Alert message
 * @param onDismiss - Callback when dismissed
 * @param buttonLabel - Button label
 *
 * @example
 * showAlert(
 *   'Success',
 *   'Your changes have been saved',
 *   () => { },
 *   'OK'
 * );
 */
export const showAlert = (
  title: string,
  message: string,
  onDismiss?: () => void,
  buttonLabel: string = 'OK'
): void => {
  console.log(`[ModalUtils] 🔔 Showing alert: ${title}`);
  // Implementation would dispatch to modal manager
};

/**
 * Show error dialog with retry option
 *
 * @param error - Error message
 * @param onRetry - Callback for retry action
 * @param onDismiss - Callback for dismiss
 *
 * @example
 * showError(
 *   'Failed to load readings',
 *   () => reloadReadings(),
 *   () => { }
 * );
 */
export const showError = (
  error: string,
  onRetry?: () => void,
  onDismiss?: () => void
): void => {
  console.log(`[ModalUtils] ⚠️  Showing error: ${error}`);
  // Implementation would dispatch to modal manager
};

/**
 * Show loading modal
 *
 * @param message - Loading message
 * @returns Modal ID for dismissal
 *
 * @example
 * const loadingId = showLoading('Saving...');
 * // ... do something
 * dismissModal(loadingId);
 */
export const showLoading = (message: string = 'Loading...'): string => {
  console.log(`[ModalUtils] ⏳ Showing loading: ${message}`);
  // Implementation would return modal ID
  return 'loading-modal';
};

/**
 * Dismiss modal by ID
 *
 * @param id - Modal ID
 */
export const dismissModal = (id: string): void => {
  console.log(`[ModalUtils] ✖️  Dismissing modal: ${id}`);
  // Implementation would dispatch to modal manager
};

/**
 * Show success message (auto-dismiss)
 *
 * @param message - Success message
 * @param duration - Duration before auto-dismiss (ms)
 *
 * @example
 * showSuccess('Reading saved!', 2000);
 */
export const showSuccess = (message: string, duration: number = 2000): void => {
  console.log(`[ModalUtils] ✅ Showing success: ${message}`);
  // Implementation would dispatch to modal manager with autoDismiss
};

/**
 * Show warning modal
 *
 * @param title - Warning title
 * @param message - Warning message
 * @param onAcknowledge - Callback when acknowledged
 *
 * @example
 * showWarning(
 *   'Trial Ending Soon',
 *   'Your trial expires in 3 days',
 *   () => navigateToUpgrade()
 * );
 */
export const showWarning = (
  title: string,
  message: string,
  onAcknowledge?: () => void
): void => {
  console.log(`[ModalUtils] ⚠️  Showing warning: ${title}`);
  // Implementation would dispatch to modal manager
};

/**
 * Dismiss all modals
 *
 * @example
 * dismissAllModals();
 */
export const dismissAllModals = (): void => {
  console.log('[ModalUtils] 🗑️  Dismissing all modals');
  // Implementation would dispatch to modal manager
};

/**
 * Check if specific modal is showing
 *
 * @param id - Modal ID
 * @returns True if modal is visible
 *
 * @example
 * if (isModalShowing('trial-expired')) {
 *   console.log('Trial modal is visible');
 * }
 */
export const isModalShowing = (id: string): boolean => {
  console.log(`[ModalUtils] 🔍 Checking if modal visible: ${id}`);
  // Implementation would check with modal manager
  return false;
};

/**
 * Get count of modals in stack
 *
 * @returns Number of modals
 */
export const getModalCount = (): number => {
  console.log('[ModalUtils] 📊 Getting modal count');
  // Implementation would get from modal manager
  return 0;
};

/**
 * Modal configuration presets for common patterns
 */
export const ModalPresets = {
  /**
   * Critical modal (trial expired, payment required)
   */
  CRITICAL: {
    priority: 'critical' as const,
    dismissible: false,
  },

  /**
   * Warning modal (trial ending, daily limit)
   */
  WARNING: {
    priority: 'warning' as const,
    dismissible: true,
  },

  /**
   * Info modal (feature tutorial, tooltip)
   */
  INFO: {
    priority: 'info' as const,
    dismissible: true,
  },

  /**
   * Auto-dismiss info (success, confirmation)
   */
  AUTO_DISMISS_INFO: {
    priority: 'info' as const,
    dismissible: true,
    autoDismissAfter: 2000,
  },

  /**
   * Auto-dismiss warning
   */
  AUTO_DISMISS_WARNING: {
    priority: 'warning' as const,
    dismissible: true,
    autoDismissAfter: 3000,
  },
} as const;

/**
 * Create a modal configuration with preset and custom data
 *
 * @param preset - Preset to use
 * @param config - Modal config overrides
 * @returns Complete modal config
 *
 * @example
 * const config = createModalConfig('CRITICAL', {
 *   id: 'payment-required',
 *   data: { price: 29.99 },
 *   onAction: () => handlePayment(),
 * });
 * push(config);
 */
export const createModalConfig = (
  preset: keyof typeof ModalPresets,
  config: Partial<ModalConfig>
): ModalConfig => {
  const presetConfig = ModalPresets[preset];
  const id = config.id || `modal-${Date.now()}`;

  return {
    id,
    priority: (presetConfig as any).priority,
    dismissible: (presetConfig as any).dismissible,
    autoDismissAfter: (presetConfig as any).autoDismissAfter,
    ...config,
  } as ModalConfig;
};

/**
 * Modal dismissal strategies
 */
export const ModalDismissalStrategies = {
  /**
   * User taps outside modal
   */
  BACKDROP: 'backdrop',

  /**
   * User taps close button
   */
  CLOSE_BUTTON: 'close_button',

  /**
   * User taps back button
   */
  BACK_BUTTON: 'back_button',

  /**
   * Auto-dismiss timer
   */
  AUTO_DISMISS: 'auto_dismiss',

  /**
   * Programmatic dismissal
   */
  PROGRAMMATIC: 'programmatic',

  /**
   * User action (confirm, subscribe, etc)
   */
  USER_ACTION: 'user_action',
} as const;

/**
 * Modal lifecycle events
 */
export const ModalLifecycleEvents = {
  /**
   * Modal added to stack
   */
  PUSHED: 'pushed',

  /**
   * Modal removed from stack
   */
  POPPED: 'popped',

  /**
   * Modal became active (top of stack)
   */
  ACTIVATED: 'activated',

  /**
   * Modal no longer active
   */
  DEACTIVATED: 'deactivated',

  /**
   * User interacted with modal
   */
  INTERACTED: 'interacted',
} as const;

/**
 * Best practice: Ensure critical modals are never auto-dismissed
 *
 * @param config - Modal config to validate
 * @returns True if config follows best practices
 */
export const validateModalConfig = (config: ModalConfig): boolean => {
  // Critical modals should not auto-dismiss
  if (config.priority === 'critical' && config.autoDismissAfter) {
    console.warn(
      `[ModalUtils] ⚠️  Critical modal should not auto-dismiss: ${config.id}`
    );
    return false;
  }

  // All modals should have an ID
  if (!config.id) {
    console.warn('[ModalUtils] ⚠️  Modal missing ID');
    return false;
  }

  // Critical modals should not be dismissible
  if (config.priority === 'critical' && config.dismissible !== false) {
    console.warn(
      `[ModalUtils] ⚠️  Critical modal should not be dismissible: ${config.id}`
    );
    return false;
  }

  return true;
};

/**
 * Log modal analytics
 *
 * @param event - Event type
 * @param modalId - Modal ID
 * @param metadata - Additional data
 *
 * @example
 * logModalAnalytics('OPENED', 'trial-expired', { price: 29.99 });
 */
export const logModalAnalytics = (
  event: string,
  modalId: string,
  metadata?: Record<string, any>
): void => {
  console.log(`[ModalUtils] 📊 Analytics: ${event} - ${modalId}`, metadata);
  // Implementation would send to analytics service
};
