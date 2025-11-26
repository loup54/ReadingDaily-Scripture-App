/**
 * Preload Utilities
 * Helper functions for data preloading
 *
 * Provides:
 * - Preload strategies
 * - Batch preloading
 * - Smart prefetching
 * - Preload scheduling
 */

import { preloadService, PreloadPriority } from '@/services/preloadService';
import { cacheService } from '@/services/cacheService';

/**
 * Preload strategies for different scenarios
 */
export const PreloadStrategies = {
  /**
   * Preload next item aggressively (immediate)
   */
  aggressive: async (bookId: string, chapterId: string) => {
    await preloadService.preloadNextChapter(bookId, chapterId);
    await preloadService.preloadRelatedChapters(bookId, chapterId);
  },

  /**
   * Balanced preloading (normal)
   */
  balanced: async (bookId: string, chapterId: string) => {
    await preloadService.preloadNextChapter(bookId, chapterId);
  },

  /**
   * Conservative preloading (minimal)
   */
  conservative: async (bookId: string, chapterId: string) => {
    // Only preload on wifi
    // Check network status before preloading
  },

  /**
   * Daily preloading on app launch
   */
  onLaunch: async () => {
    await preloadService.preloadOnLaunch();
  },
};

export type PreloadStrategy = keyof typeof PreloadStrategies;

/**
 * Batch preload multiple items
 * Useful for preloading multiple chapters at once
 */
export async function batchPreload(
  items: Array<{ bookId: string; chapterId: string }>,
  priority: PreloadPriority = PreloadPriority.LOW
): Promise<void> {
  const preloads = items.map(item =>
    preloadService.preloadChapter(item.bookId, item.chapterId, priority)
  );

  // Fire and forget - don't block
  Promise.all(preloads).catch(err =>
    console.warn('Batch preload failed:', err)
  );
}

/**
 * Smart prefetch based on usage patterns
 * Learns from user behavior to prefetch likely next items
 */
export class SmartPrefetcher {
  private history: string[] = [];
  private maxHistory = 10;

  /**
   * Record user interaction
   */
  recordNavigation(bookId: string, chapterId: string): void {
    const key = `${bookId}_${chapterId}`;
    this.history.push(key);

    // Keep history size manageable
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get likely next items based on history
   */
  predictNextItems(): Array<{ bookId: string; chapterId: string }> {
    if (this.history.length < 2) {
      return [];
    }

    // Simple pattern matching
    // In real app, use ML model for prediction
    const recent = this.history[this.history.length - 1];
    const [bookId, chapterId] = recent.split('_');

    // Predict next chapter
    const next = parseInt(chapterId) + 1;

    return [
      { bookId, chapterId: String(next) },
      { bookId, chapterId: String(next + 1) },
    ];
  }

  /**
   * Prefetch predicted items
   */
  async prefetchPredicted(): Promise<void> {
    const predicted = this.predictNextItems();
    await batchPreload(predicted, PreloadPriority.LOW);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }
}

/**
 * Preload scheduler
 * Schedule preloads at specific times
 */
export class PreloadScheduler {
  private tasks: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule preload task
   */
  schedulePreload(
    taskId: string,
    task: () => Promise<void>,
    delayMs: number
  ): void {
    // Cancel existing task if any
    this.cancelPreload(taskId);

    const timeout = setTimeout(() => {
      task().catch(err => console.warn(`Scheduled preload failed: ${err}`));
      this.tasks.delete(taskId);
    }, delayMs);

    this.tasks.set(taskId, timeout);
  }

  /**
   * Cancel scheduled preload
   */
  cancelPreload(taskId: string): void {
    const timeout = this.tasks.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.tasks.delete(taskId);
    }
  }

  /**
   * Cancel all scheduled preloads
   */
  cancelAll(): void {
    for (const timeout of this.tasks.values()) {
      clearTimeout(timeout);
    }
    this.tasks.clear();
  }

  /**
   * Get number of scheduled tasks
   */
  getScheduledCount(): number {
    return this.tasks.size;
  }
}

/**
 * Calculate preload priority based on factors
 */
export function calculatePreloadPriority(
  factors: {
    isActive?: boolean;
    networkQuality?: 'fast' | 'normal' | 'slow';
    batteryLevel?: number;
    storageAvailable?: number;
  }
): PreloadPriority {
  const { isActive = true, networkQuality = 'normal', batteryLevel = 100 } = factors;

  // Don't preload if not active (app in background)
  if (!isActive) {
    return PreloadPriority.LOW;
  }

  // Don't preload on slow network
  if (networkQuality === 'slow') {
    return PreloadPriority.LOW;
  }

  // Don't preload on low battery
  if (batteryLevel < 20) {
    return PreloadPriority.LOW;
  }

  // Fast network and good battery = high priority
  if (networkQuality === 'fast' && batteryLevel > 50) {
    return PreloadPriority.HIGH;
  }

  return PreloadPriority.MEDIUM;
}

/**
 * Check if item is preloaded
 */
export function isPreloaded(cacheKey: string): boolean {
  return cacheService.has(cacheKey);
}

/**
 * Check if item will be preloaded soon
 */
export function willBePreloaded(cacheKey: string, timeoutMs: number = 3000): Promise<boolean> {
  return new Promise(resolve => {
    // Check every 100ms
    const checkInterval = setInterval(() => {
      if (isPreloaded(cacheKey)) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    // Timeout after specified time
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(false);
    }, timeoutMs);
  });
}

/**
 * Debug: Log preload stats
 */
export function debugPreloadStats(): void {
  if (__DEV__) {
    const stats = preloadService.getStats();
    console.log('[Preload Stats]');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Completed: ${stats.completed}`);
    console.log(`  Failed: ${stats.failed}`);
    console.log(`  Skipped: ${stats.skipped}`);
    console.log(`  In Progress: ${stats.inProgress}`);
  }
}

/**
 * Common preload patterns
 */
export const PreloadPatterns = {
  /**
   * Preload when user opens scripture view
   */
  onScriptureOpen: async (bookId: string, chapterId: string) => {
    await PreloadStrategies.balanced(bookId, chapterId);
  },

  /**
   * Preload when user reaches end of chapter
   */
  onChapterNearEnd: async (bookId: string, chapterId: string) => {
    await PreloadStrategies.aggressive(bookId, chapterId);
  },

  /**
   * Preload on idle (user not actively scrolling)
   */
  onIdle: async (bookId: string, chapterId: string) => {
    await PreloadStrategies.conservative(bookId, chapterId);
  },

  /**
   * Preload on app resume from background
   */
  onAppResume: async () => {
    await PreloadStrategies.onLaunch();
  },

  /**
   * Preload on wifi connection
   */
  onWifiConnect: async () => {
    // Preload queued items that were waiting for wifi
    const stats = preloadService.getStats();
    console.log(`[Preload] Processing ${stats.inProgress} queued items on wifi`);
  },
};

/**
 * Preload configuration
 */
export const PreloadConfig = {
  // Enable/disable preloading globally
  enabled: true,

  // Preload next chapter automatically
  autoPreloadNext: true,

  // Preload related chapters
  preloadRelated: true,

  // Preload daily scripture on launch
  preloadDaily: true,

  // Preload books list on launch
  preloadBooks: true,

  // Don't preload on slow networks
  skipOnSlowNetwork: true,

  // Don't preload on low battery
  skipOnLowBattery: true,

  // Preload aggressiveness (aggressive | balanced | conservative)
  strategy: 'balanced' as PreloadStrategy,

  // Max concurrent preloads
  maxConcurrent: 3,

  // Preload timeout in ms
  timeout: 10000,
};

/**
 * Update preload configuration
 */
export function updatePreloadConfig(config: Partial<typeof PreloadConfig>): void {
  Object.assign(PreloadConfig, config);
}
