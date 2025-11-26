/**
 * useModalStack Hook
 * Phase 2: Navigation & Flow - Modal Stack Management
 *
 * Provides React component access to the global modal stack.
 * Subscribes to stack changes and re-renders on updates.
 */

import { useEffect, useState, useCallback } from 'react';
import { modalManager, ModalConfig, ActiveModal, ModalPriority } from '@/services/ui/ModalManager';

export interface UseModalStackReturn {
  /**
   * Current modal stack
   */
  stack: ActiveModal[];

  /**
   * Currently active (top) modal
   */
  activeModal: ActiveModal | undefined;

  /**
   * Push new modal onto stack
   */
  push: (config: ModalConfig) => string;

  /**
   * Remove modal by ID
   */
  dismiss: (id: string) => void;

  /**
   * Replace top modal
   */
  replace: (config: ModalConfig) => string;

  /**
   * Clear all modals
   */
  clear: () => void;

  /**
   * Execute action on modal
   */
  executeAction: (id: string) => void;

  /**
   * Check if modal exists
   */
  hasModal: (id: string) => boolean;

  /**
   * Get stack size
   */
  stackSize: number;
}

/**
 * useModalStack - Hook for managing modal stack in components
 *
 * @example
 * const { activeModal, push, dismiss } = useModalStack();
 *
 * // Push a modal
 * push({
 *   id: 'trial-expired',
 *   priority: 'critical',
 *   data: { price: 29.99 },
 *   onDismiss: () => console.log('dismissed'),
 * });
 *
 * // Render active modal
 * {activeModal?.config.id === 'trial-expired' && (
 *   <TrialExpiredModal
 *     visible={true}
 *     onDismiss={() => dismiss('trial-expired')}
 *   />
 * )}
 */
export const useModalStack = (): UseModalStackReturn => {
  const [stack, setStack] = useState<ActiveModal[]>(modalManager.getStack());

  // Subscribe to stack changes
  useEffect(() => {
    const unsubscribe = modalManager.onStackChange((newStack) => {
      setStack([...newStack]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const push = useCallback((config: ModalConfig) => {
    return modalManager.push(config);
  }, []);

  const dismiss = useCallback((id: string) => {
    modalManager.pop(id);
  }, []);

  const replace = useCallback((config: ModalConfig) => {
    return modalManager.replace(config);
  }, []);

  const clear = useCallback(() => {
    modalManager.clear();
  }, []);

  const executeAction = useCallback((id: string) => {
    modalManager.executeAction(id);
  }, []);

  const hasModal = useCallback((id: string) => {
    return modalManager.has(id);
  }, []);

  return {
    stack,
    activeModal: stack[0],
    push,
    dismiss,
    replace,
    clear,
    executeAction,
    hasModal,
    stackSize: stack.length,
  };
};
