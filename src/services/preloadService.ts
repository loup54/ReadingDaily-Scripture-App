/**
 * Preload Service
 * Intelligent data preloading for faster navigation
 *
 * Features:
 * - Preload next chapter while reading current
 * - Preload daily scripture on app launch
 * - Preload pronunciation data before playback
 * - Network-aware preloading (skip on slow networks)
 * - Background preloading without blocking UI
 * - Smart cache invalidation
 *
 * @example
 * // Preload next chapter while user reads current
 * preloadService.preloadNextChapter('genesis', '1');
 *
 * // Preload daily scripture on app startup
 * await preloadService.preloadDailyScripture();
 */

import { cacheService } from './cacheService';
import { storageService } from './storageService';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';

/**
 * Preload priority levels
 */
export enum PreloadPriority {
  HIGH = 'high',      // Preload immediately
  MEDIUM = 'medium',  // Preload when ready
  LOW = 'low',        // Preload in background
}

/**
 * Preload status
 */
export enum PreloadStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

interface PreloadItem {
  key: string;
  priority: PreloadPriority;
  status: PreloadStatus;
  timestamp?: number;
  error?: Error;
}

interface PreloadStats {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  inProgress: number;
}

/**
 * Mock API service (replace with actual API)
 */
const preloadAPI = {
  fetchChapter: async (bookId: string, chapterId: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      bookId,
      chapterId,
      verses: [],
      title: `${bookId} ${chapterId}`,
    };
  },

  fetchDailyScripture: async (): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      bookId: 'psalms',
      chapterId: '23',
      verseId: '1',
      text: 'The LORD is my shepherd...',
    };
  },

  fetchPronunciation: async (word: string): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      word,
      audio_url: `https://api.example.com/audio/${word}.mp3`,
      pronunciation: 'pronunciation guide',
    };
  },

  fetchBookList: async (): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },

  fetchChapterList: async (bookId: string): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },
};

export class PreloadService {
  private queue: Map<string, PreloadItem> = new Map();
  private isProcessing = false;
  private networkConnected = true;
  private networkSlow = false;

  /**
   * Initialize preload service
   */
  async initialize(): Promise<void> {
    // In real app, set up network listener
    // NetInfo.addEventListener(state => {
    //   this.networkConnected = state.isConnected ?? true;
    //   this.networkSlow = state.type === 'cellular';
    // });
  }

  /**
   * Preload next chapter (while user reads current)
   */
  async preloadNextChapter(bookId: string, chapterId: string): Promise<void> {
    const nextChapterId = this.getNextChapter(chapterId);
    if (!nextChapterId) return;

    await this.preloadChapter(bookId, nextChapterId, PreloadPriority.MEDIUM);
  }

  /**
   * Preload related chapters (chapters user likely to read next)
   */
  async preloadRelatedChapters(bookId: string, chapterId: string): Promise<void> {
    const related = this.getRelatedChapters(bookId, chapterId);

    const preloads = related.map(id =>
      this.preloadChapter(bookId, id, PreloadPriority.LOW)
    );

    // Fire and forget - don't block on these
    Promise.all(preloads).catch(err =>
      console.warn('Preload related chapters failed:', err)
    );
  }

  /**
   * Preload specific chapter
   */
  async preloadChapter(
    bookId: string,
    chapterId: string,
    priority: PreloadPriority = PreloadPriority.MEDIUM
  ): Promise<void> {
    const key = cacheKeys.chapters(bookId);

    // Check if already cached
    if (cacheService.has(key)) {
      return; // Already cached
    }

    const queueKey = `chapter_${bookId}_${chapterId}`;

    // Add to queue
    this.queue.set(queueKey, {
      key,
      priority,
      status: PreloadStatus.PENDING,
    });

    // Process queue
    this.processQueue();
  }

  /**
   * Preload daily scripture on app launch
   */
  async preloadDailyScripture(): Promise<void> {
    try {
      const today = new Date().toDateString();
      const cacheKey = cacheKeys.dailyScripture(today);

      // Check if already loaded today
      if (cacheService.has(cacheKey)) {
        return;
      }

      // Skip if slow network
      if (this.networkSlow) {
        return;
      }

      // Fetch daily scripture
      const daily = await preloadAPI.fetchDailyScripture();

      // Cache it
      cacheService.set(cacheKey, daily, CACHE_TTL.DAILY_SCRIPTURE);
      await storageService.set(cacheKey, daily, {
        ttl: CACHE_TTL.DAILY_SCRIPTURE,
      });
    } catch (err) {
      // Silent fail - not critical
      console.warn('Failed to preload daily scripture:', err);
    }
  }

  /**
   * Preload pronunciation data for words
   */
  async preloadPronunciations(words: string[]): Promise<void> {
    // Skip if slow network
    if (this.networkSlow) {
      return;
    }

    const preloads = words.map(word =>
      this.preloadPronunciation(word).catch(err =>
        console.warn(`Failed to preload pronunciation for ${word}:`, err)
      )
    );

    // Fire and forget
    Promise.all(preloads).catch(() => {});
  }

  /**
   * Preload single pronunciation
   */
  async preloadPronunciation(word: string): Promise<void> {
    const cacheKey = cacheKeys.pronunciation(word);

    // Check if already cached
    if (cacheService.has(cacheKey)) {
      return;
    }

    try {
      const data = await preloadAPI.fetchPronunciation(word);
      cacheService.set(cacheKey, data, CACHE_TTL.AUDIO_METADATA);
    } catch (err) {
      // Silent fail
      console.warn(`Failed to preload pronunciation for ${word}:`, err);
    }
  }

  /**
   * Preload book list on app startup
   */
  async preloadBooks(): Promise<void> {
    const cacheKey = cacheKeys.books();

    // Check if cached
    if (cacheService.has(cacheKey)) {
      return;
    }

    try {
      const books = await preloadAPI.fetchBookList();
      cacheService.set(cacheKey, books, CACHE_TTL.BOOK_LIST);
      await storageService.set(cacheKey, books, {
        ttl: CACHE_TTL.BOOK_LIST,
      });
    } catch (err) {
      console.warn('Failed to preload books:', err);
    }
  }

  /**
   * Preload chapter list for a book
   */
  async preloadChapters(bookId: string): Promise<void> {
    const cacheKey = cacheKeys.chapters(bookId);

    // Check if cached
    if (cacheService.has(cacheKey)) {
      return;
    }

    try {
      const chapters = await preloadAPI.fetchChapterList(bookId);
      cacheService.set(cacheKey, chapters, CACHE_TTL.CHAPTER_LIST);
      await storageService.set(cacheKey, chapters, {
        ttl: CACHE_TTL.CHAPTER_LIST,
      });
    } catch (err) {
      console.warn(`Failed to preload chapters for ${bookId}:`, err);
    }
  }

  /**
   * Preload on app launch (critical data)
   */
  async preloadOnLaunch(): Promise<void> {
    // Preload in parallel
    await Promise.all([
      this.preloadBooks(),
      this.preloadDailyScripture(),
    ]).catch(err => console.warn('Preload on launch failed:', err));
  }

  /**
   * Get preload statistics
   */
  getStats(): PreloadStats {
    const statuses = Array.from(this.queue.values()).map(item => item.status);

    return {
      total: this.queue.size,
      completed: statuses.filter(s => s === PreloadStatus.SUCCESS).length,
      failed: statuses.filter(s => s === PreloadStatus.ERROR).length,
      skipped: statuses.filter(s => s === PreloadStatus.SKIPPED).length,
      inProgress: statuses.filter(s => s === PreloadStatus.IN_PROGRESS).length,
    };
  }

  /**
   * Clear preload queue
   */
  clearQueue(): void {
    this.queue.clear();
  }

  /**
   * Check if preloading is in progress
   */
  isLoadingInProgress(): boolean {
    return this.isProcessing || this.getStats().inProgress > 0;
  }

  /**
   * Set network conditions for preloading decisions
   */
  setNetworkConditions(connected: boolean, slow: boolean): void {
    this.networkConnected = connected;
    this.networkSlow = slow;
  }

  // Private methods

  /**
   * Process preload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !this.networkConnected) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process by priority
      const highPriority = Array.from(this.queue.values())
        .filter(item => item.priority === PreloadPriority.HIGH && item.status === PreloadStatus.PENDING);

      for (const item of highPriority) {
        await this.processItem(item);
      }

      // Process medium priority
      const mediumPriority = Array.from(this.queue.values())
        .filter(item => item.priority === PreloadPriority.MEDIUM && item.status === PreloadStatus.PENDING);

      for (const item of mediumPriority) {
        await this.processItem(item);
      }

      // Process low priority
      const lowPriority = Array.from(this.queue.values())
        .filter(item => item.priority === PreloadPriority.LOW && item.status === PreloadStatus.PENDING);

      for (const item of lowPriority) {
        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single preload item
   */
  private async processItem(item: PreloadItem): Promise<void> {
    // Skip if no network
    if (!this.networkConnected) {
      item.status = PreloadStatus.SKIPPED;
      return;
    }

    item.status = PreloadStatus.IN_PROGRESS;
    item.timestamp = Date.now();

    try {
      // Simulate fetch - in real app, parse cache key and fetch
      // For now just mark as success
      item.status = PreloadStatus.SUCCESS;
    } catch (err) {
      item.status = PreloadStatus.ERROR;
      item.error = err instanceof Error ? err : new Error(String(err));
    }
  }

  /**
   * Get next chapter ID
   */
  private getNextChapter(chapterId: string): string | null {
    // In real app, parse chapter structure
    const num = parseInt(chapterId);
    if (isNaN(num)) return null;
    return String(num + 1);
  }

  /**
   * Get related chapters for smart preloading
   */
  private getRelatedChapters(bookId: string, chapterId: string): string[] {
    const next = this.getNextChapter(chapterId);
    if (!next) return [];

    // Preload next 2 chapters
    const nextNum = parseInt(next);
    return [String(nextNum + 1), String(nextNum + 2)];
  }
}

// Export singleton instance
export const preloadService = new PreloadService();

export type { PreloadItem, PreloadStats };
