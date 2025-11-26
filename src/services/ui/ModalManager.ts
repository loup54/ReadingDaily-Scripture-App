/**
 * Modal Manager Service
 * Phase 2: Navigation & Flow - Centralized Modal Management
 *
 * Manages a global stack of modals with priority system.
 * Prevents modal stacking conflicts by queuing modals.
 * Singleton pattern for app-wide access.
 */

export type ModalPriority = 'critical' | 'warning' | 'info';

export interface ModalConfig {
  /**
   * Unique identifier for the modal
   */
  id: string;

  /**
   * Priority level (higher = shows first)
   * - critical: Trial expired, payment required (top priority)
   * - warning: Trial ending soon, daily limit reached
   * - info: Feature tutorials, tooltips (lowest priority)
   */
  priority: ModalPriority;

  /**
   * Data payload for the modal component
   */
  data?: Record<string, any>;

  /**
   * Callback when modal is dismissed
   */
  onDismiss?: () => void;

  /**
   * Callback when modal action is executed
   */
  onAction?: () => void;

  /**
   * Auto-dismiss after N milliseconds (optional)
   */
  autoDismissAfter?: number;

  /**
   * Whether modal can be dismissed by user
   */
  dismissible?: boolean;
}

export interface ActiveModal {
  config: ModalConfig;
  dismissTimer?: ReturnType<typeof setTimeout>;
}

export type ModalStackListener = (stack: ActiveModal[]) => void;

/**
 * Modal Manager - Centralized modal stack management
 *
 * Usage:
 * const manager = ModalManager.getInstance();
 * manager.push({ id: 'modal-1', priority: 'critical', ... });
 * manager.onStackChange((stack) => {
 *   // Render active modal from stack[0]
 * });
 */
export class ModalManager {
  private static instance: ModalManager;
  private stack: ActiveModal[] = [];
  private listeners: Set<ModalStackListener> = new Set();
  private priorityOrder: Record<ModalPriority, number> = {
    critical: 3,
    warning: 2,
    info: 1,
  };

  /**
   * Get singleton instance
   */
  static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  /**
   * Push a modal onto the stack
   * Higher priority modals are sorted to the top
   *
   * @param config Modal configuration
   * @returns Modal ID
   */
  push(config: ModalConfig): string {
    console.log(`[ModalManager] 📱 Pushing modal: ${config.id} (priority: ${config.priority})`);

    // Create active modal
    const activeModal: ActiveModal = { config };

    // Set up auto-dismiss if configured
    if (config.autoDismissAfter && config.autoDismissAfter > 0) {
      activeModal.dismissTimer = setTimeout(() => {
        this.pop(config.id);
      }, config.autoDismissAfter);
    }

    // Add to stack
    this.stack.push(activeModal);

    // Sort by priority (highest first)
    this.sortByPriority();

    // Notify listeners
    this.notifyListeners();

    return config.id;
  }

  /**
   * Pop a modal from the stack by ID
   *
   * @param id Modal ID to remove
   */
  pop(id: string): void {
    console.log(`[ModalManager] 📱 Popping modal: ${id}`);

    const index = this.stack.findIndex((m) => m.config.id === id);
    if (index !== -1) {
      const activeModal = this.stack[index];

      // Clear auto-dismiss timer if exists
      if (activeModal.dismissTimer) {
        clearTimeout(activeModal.dismissTimer);
      }

      // Call onDismiss callback
      if (activeModal.config.onDismiss) {
        activeModal.config.onDismiss();
      }

      // Remove from stack
      this.stack.splice(index, 1);

      // Notify listeners
      this.notifyListeners();
    }
  }

  /**
   * Replace topmost modal with new one
   *
   * @param config New modal configuration
   */
  replace(config: ModalConfig): string {
    console.log(
      `[ModalManager] 🔄 Replacing modal: ${this.stack[0]?.config.id || 'none'} -> ${config.id}`
    );

    if (this.stack.length > 0) {
      const topModal = this.stack[0];
      if (topModal.dismissTimer) {
        clearTimeout(topModal.dismissTimer);
      }
      this.stack.shift();
    }

    return this.push(config);
  }

  /**
   * Clear all modals from stack
   */
  clear(): void {
    console.log(`[ModalManager] 🗑️  Clearing all ${this.stack.length} modals`);

    this.stack.forEach((modal) => {
      if (modal.dismissTimer) {
        clearTimeout(modal.dismissTimer);
      }
    });

    this.stack = [];
    this.notifyListeners();
  }

  /**
   * Get the current modal stack
   *
   * @returns Copy of modal stack
   */
  getStack(): ActiveModal[] {
    return [...this.stack];
  }

  /**
   * Get the active (top) modal
   *
   * @returns Top modal or undefined if stack empty
   */
  getActive(): ActiveModal | undefined {
    return this.stack[0];
  }

  /**
   * Check if a modal is in the stack
   *
   * @param id Modal ID
   * @returns True if modal exists in stack
   */
  has(id: string): boolean {
    return this.stack.some((m) => m.config.id === id);
  }

  /**
   * Get stack size
   */
  size(): number {
    return this.stack.length;
  }

  /**
   * Subscribe to stack changes
   *
   * @param listener Callback function
   * @returns Unsubscribe function
   */
  onStackChange(listener: ModalStackListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Execute action on active modal
   *
   * @param id Modal ID
   */
  executeAction(id: string): void {
    const modal = this.stack.find((m) => m.config.id === id);
    if (modal?.config.onAction) {
      console.log(`[ModalManager] ⚡ Executing action for modal: ${id}`);
      modal.config.onAction();
    }
  }

  /**
   * Private: Sort stack by priority (highest first)
   */
  private sortByPriority(): void {
    this.stack.sort((a, b) => {
      const priorityA = this.priorityOrder[a.config.priority];
      const priorityB = this.priorityOrder[b.config.priority];
      return priorityB - priorityA;
    });
  }

  /**
   * Private: Notify all listeners of stack change
   */
  private notifyListeners(): void {
    console.log(
      `[ModalManager] 📢 Notifying ${this.listeners.size} listener(s) of stack change. Stack size: ${this.stack.length}`
    );

    this.listeners.forEach((listener) => {
      try {
        listener([...this.stack]);
      } catch (error) {
        console.error('[ModalManager] Error in listener:', error);
      }
    });
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    console.log('[ModalManager] 🔄 Resetting manager');
    this.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const modalManager = ModalManager.getInstance();
