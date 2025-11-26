/**
 * Optimistic Update Utilities
 * Helper functions for implementing optimistic updates
 *
 * Provides:
 * - Rollback utilities
 * - Conflict resolution
 * - Error handling
 * - State management helpers
 */

/**
 * Action result with success/failure info
 */
export interface OptimisticResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  rolled?: boolean; // Whether state was rolled back
}

/**
 * Optimistic state transaction
 */
export interface OptimisticTransaction<T = any> {
  original: T;
  optimistic: T;
  timestamp: number;
  rollback: () => void;
  confirm: (newData?: T) => void;
}

/**
 * Generate unique temporary ID for optimistic items
 * Used to identify items before server assigns real ID
 */
export function generateTempId(prefix: string = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if ID is temporary (optimistic)
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_');
}

/**
 * Create optimistic item with temp ID
 * Used for items created optimistically (notes, highlights)
 */
export function createOptimisticItem<T extends { id: string }>(
  baseItem: Omit<T, 'id'>,
  prefix: string = 'item'
): T {
  return {
    ...baseItem,
    id: generateTempId(prefix),
  } as T;
}

/**
 * Replace temp ID with real ID
 * Called when server confirms item creation
 */
export function replaceTempId<T extends { id: string }>(
  items: T[],
  tempId: string,
  realId: string,
  data?: Partial<T>
): T[] {
  return items.map(item =>
    item.id === tempId
      ? { ...item, id: realId, ...data }
      : item
  );
}

/**
 * Remove item by ID
 */
export function removeById<T extends { id: string }>(
  items: T[],
  id: string
): T[] {
  return items.filter(item => item.id !== id);
}

/**
 * Update item by ID
 */
export function updateById<T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return items.map(item =>
    item.id === id ? { ...item, ...updates } : item
  );
}

/**
 * Find item by ID
 */
export function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

/**
 * Retry failed action with exponential backoff
 * Useful for retrying optimistic updates that failed
 */
export async function retryWithBackoff<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await action();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Timeout promise
 * Useful for ensuring operations complete in time
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Debounce function calls
 * Useful for debouncing optimistic updates (e.g., draft saves)
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Batch updates
 * Combine multiple optimistic updates into single transaction
 */
export function batchUpdates<T>(updates: Array<() => void>): void {
  updates.forEach(update => update());
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Network errors, timeouts are retryable
  const retryableMessages = [
    'Network',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    '5xx',
    '429', // Rate limit
  ];

  return retryableMessages.some(msg => error.message.includes(msg));
}

/**
 * Handle conflict between optimistic and server data
 * Returns merged data
 */
export function resolveConflict<T extends { timestamp?: number }>(
  optimistic: T,
  serverData: T
): T {
  // If both have timestamps, prefer newer
  if (optimistic.timestamp && serverData.timestamp) {
    return optimistic.timestamp > serverData.timestamp
      ? optimistic
      : serverData;
  }

  // Default: prefer server data (authoritative)
  return serverData;
}

/**
 * Optimistic state helper
 * Manages optimistic state with automatic rollback
 */
export class OptimisticState<T> {
  private original: T;
  private optimistic: T;
  private isRolledBack = false;

  constructor(state: T) {
    this.original = structuredClone(state);
    this.optimistic = structuredClone(state);
  }

  /**
   * Get current optimistic state
   */
  getOptimistic(): T {
    return this.optimistic;
  }

  /**
   * Get original state
   */
  getOriginal(): T {
    return this.original;
  }

  /**
   * Update optimistic state
   */
  update(updates: Partial<T> | ((state: T) => T)): void {
    if (typeof updates === 'function') {
      this.optimistic = updates(this.optimistic);
    } else {
      this.optimistic = { ...this.optimistic, ...updates };
    }
  }

  /**
   * Confirm changes (make permanent)
   */
  confirm(newData?: T): void {
    if (newData) {
      this.original = structuredClone(newData);
      this.optimistic = structuredClone(newData);
    } else {
      this.original = structuredClone(this.optimistic);
    }
  }

  /**
   * Rollback to original state
   */
  rollback(): void {
    this.optimistic = structuredClone(this.original);
    this.isRolledBack = true;
  }

  /**
   * Check if state was rolled back
   */
  wasRolledBack(): boolean {
    return this.isRolledBack;
  }

  /**
   * Check if state changed
   */
  hasChanged(): boolean {
    return JSON.stringify(this.original) !== JSON.stringify(this.optimistic);
  }
}

/**
 * Optimistic update pattern helper
 * Standard pattern for optimistic updates
 */
export async function optimisticUpdate<T>(
  setState: (state: T) => void,
  getState: () => T,
  optimisticFn: (state: T) => T,
  apiCall: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error, original: T) => void;
    retries?: number;
    timeout?: number;
  } = {}
): Promise<OptimisticResult<T>> {
  const {
    onSuccess,
    onError,
    retries = 3,
    timeout = 5000,
  } = options;

  const originalState = getState();

  try {
    // 1. Apply optimistic update
    const optimisticState = optimisticFn(originalState);
    setState(optimisticState);

    // 2. Call API with retry
    const apiFn = async () => {
      const result = await apiCall();
      return result;
    };

    const result = await (retries > 0
      ? retryWithBackoff(apiFn, retries, 500)
      : withTimeout(apiCall(), timeout));

    // 3. Confirm update
    setState(result);
    onSuccess?.(result);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // 4. Rollback on error
    const err = error instanceof Error ? error : new Error(String(error));

    setState(originalState);
    onError?.(err, originalState);

    return {
      success: false,
      error: err,
      rolled: true,
    };
  }
}

/**
 * Validation helpers for optimistic updates
 */
export const OptimisticValidation = {
  isValidBookmarkToggle: (state: boolean): boolean => {
    return typeof state === 'boolean';
  },

  isValidNote: (note: { id: string; text: string; timestamp: number }): boolean => {
    return note.id && note.text && note.text.length > 0 && note.timestamp > 0;
  },

  isValidHighlight: (highlight: { id: string; text: string; color: string }): boolean => {
    return highlight.id && highlight.text && highlight.color;
  },

  isValidRating: (rating: number): boolean => {
    return rating >= 0 && rating <= 5;
  },
};

/**
 * Debug utilities
 */
export const OptimisticDebug = {
  logOptimisticUpdate(action: string, before: any, after: any): void {
    if (__DEV__) {
      console.log(`[Optimistic] ${action}`);
      console.log('  Before:', before);
      console.log('  After:', after);
    }
  },

  logOptimisticError(action: string, error: Error): void {
    if (__DEV__) {
      console.warn(`[Optimistic Error] ${action}:`, error.message);
    }
  },

  logOptimisticRollback(action: string, original: any): void {
    if (__DEV__) {
      console.warn(`[Optimistic Rollback] ${action}`);
      console.log('  Restored:', original);
    }
  },
};
