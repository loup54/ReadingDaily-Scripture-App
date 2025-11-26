/**
 * Toast Store
 * Phase 10B.5: In-App Toast Component
 *
 * Zustand store for managing toast notifications across the app
 * Handles toast queue, auto-dismiss, and lifecycle management
 */

import { create } from 'zustand';
import { Toast, ToastType, ToastPosition } from '@/components/notifications/ToastNotification';

/**
 * Toast store state interface
 */
interface ToastState {
  // State
  toasts: Toast[];

  // Actions
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;

  // Convenience methods
  showSuccess: (message: string, options?: Partial<Toast>) => string;
  showError: (message: string, options?: Partial<Toast>) => string;
  showWarning: (message: string, options?: Partial<Toast>) => string;
  showInfo: (message: string, options?: Partial<Toast>) => string;
  showNotification: (message: string, options?: Partial<Toast>) => string;
}

/**
 * Create Zustand store for toast notifications
 */
export const useToastStore = create<ToastState>((set) => ({
  // Initial state
  toasts: [],

  /**
   * Show a toast notification
   * Returns toast ID for later reference
   */
  showToast: (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;

    // Default duration is 3 seconds if not specified
    const duration = toast.duration !== undefined ? toast.duration : 3000;

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id,
          duration,
          position: toast.position || ToastPosition.TOP,
        },
      ],
    }));

    return id;
  },

  /**
   * Dismiss a single toast by ID
   */
  dismissToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  /**
   * Clear all toasts
   */
  clearAllToasts: () => {
    set({ toasts: [] });
  },

  /**
   * Update an existing toast
   */
  updateToast: (id: string, updates: Partial<Toast>) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  /**
   * Convenience method: Show success toast
   */
  showSuccess: (message: string, options?: Partial<Toast>) => {
    return useToastStore.getState().showToast({
      type: ToastType.SUCCESS,
      message,
      duration: 3000,
      ...options,
    });
  },

  /**
   * Convenience method: Show error toast
   */
  showError: (message: string, options?: Partial<Toast>) => {
    return useToastStore.getState().showToast({
      type: ToastType.ERROR,
      message,
      duration: 5000, // Longer duration for errors
      ...options,
    });
  },

  /**
   * Convenience method: Show warning toast
   */
  showWarning: (message: string, options?: Partial<Toast>) => {
    return useToastStore.getState().showToast({
      type: ToastType.WARNING,
      message,
      duration: 4000,
      ...options,
    });
  },

  /**
   * Convenience method: Show info toast
   */
  showInfo: (message: string, options?: Partial<Toast>) => {
    return useToastStore.getState().showToast({
      type: ToastType.INFO,
      message,
      duration: 3000,
      ...options,
    });
  },

  /**
   * Convenience method: Show notification toast
   */
  showNotification: (message: string, options?: Partial<Toast>) => {
    return useToastStore.getState().showToast({
      type: ToastType.NOTIFICATION,
      message,
      duration: 3000,
      ...options,
    });
  },
}));

/**
 * Custom hook: Get all toasts
 */
export function useToasts(): Toast[] {
  return useToastStore((state) => state.toasts);
}

/**
 * Custom hook: Get toasts for a specific position
 */
export function useToastsByPosition(position: ToastPosition): Toast[] {
  return useToastStore((state) =>
    state.toasts.filter((t) => t.position === position)
  );
}

/**
 * Custom hook: Dismiss toast
 */
export function useDismissToast() {
  return useToastStore((state) => state.dismissToast);
}

/**
 * Custom hook: Show toast (generic)
 */
export function useShowToast() {
  return useToastStore((state) => state.showToast);
}

/**
 * Custom hook: Show success toast
 */
export function useShowSuccessToast() {
  return useToastStore((state) => state.showSuccess);
}

/**
 * Custom hook: Show error toast
 */
export function useShowErrorToast() {
  return useToastStore((state) => state.showError);
}

/**
 * Custom hook: Show warning toast
 */
export function useShowWarningToast() {
  return useToastStore((state) => state.showWarning);
}

/**
 * Custom hook: Show info toast
 */
export function useShowInfoToast() {
  return useToastStore((state) => state.showInfo);
}

/**
 * Custom hook: Show notification toast
 */
export function useShowNotificationToast() {
  return useToastStore((state) => state.showNotification);
}

/**
 * Custom hook: Clear all toasts
 */
export function useClearAllToasts() {
  return useToastStore((state) => state.clearAllToasts);
}

/**
 * Custom hook: Update toast
 */
export function useUpdateToast() {
  return useToastStore((state) => state.updateToast);
}
