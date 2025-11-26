/**
 * usePreload Hook
 * React hook for managing data preloading
 *
 * Features:
 * - Automatic preloading of next chapter
 * - Automatic preloading of daily scripture
 * - Manual preload triggering
 * - Preload status tracking
 * - Network-aware preloading
 *
 * @example
 * // Auto-preload next chapter when reading
 * usePreload('genesis', '1');
 *
 * // Manual preload with callback
 * const { preload, status } = usePreload();
 * const handlePress = async () => {
 *   await preload('genesis', '2');
 * };
 */

import { useEffect, useCallback, useState } from 'react';
import { preloadService, PreloadStatus } from '@/services/preloadService';
import { useNetworkStatus } from './useNetworkStatus';

interface UsePreloadOptions {
  autoPreload?: boolean;
  preloadRelated?: boolean;
}

interface UsePreloadResult {
  preload: (bookId: string, chapterId: string) => Promise<void>;
  preloadDaily: () => Promise<void>;
  preloadPronunciations: (words: string[]) => Promise<void>;
  isPreloading: boolean;
  preloadStats: {
    total: number;
    completed: number;
    failed: number;
  };
}

export function usePreload(
  bookId?: string,
  chapterId?: string,
  options: UsePreloadOptions = {}
): UsePreloadResult {
  const { autoPreload = true, preloadRelated = true } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
  });

  const { isConnected, isSlowNetwork } = useNetworkStatus();

  /**
   * Preload chapter
   */
  const preload = useCallback(
    async (bId: string, cId: string) => {
      if (!isConnected || isSlowNetwork) {
        return;
      }

      setIsPreloading(true);
      try {
        await preloadService.preloadChapter(bId, cId);
        updateStats();
      } finally {
        setIsPreloading(false);
      }
    },
    [isConnected, isSlowNetwork]
  );

  /**
   * Preload daily scripture
   */
  const preloadDaily = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    setIsPreloading(true);
    try {
      await preloadService.preloadDailyScripture();
      updateStats();
    } finally {
      setIsPreloading(false);
    }
  }, [isConnected]);

  /**
   * Preload pronunciations
   */
  const preloadPronunciations = useCallback(
    async (words: string[]) => {
      if (!isConnected || isSlowNetwork || words.length === 0) {
        return;
      }

      setIsPreloading(true);
      try {
        await preloadService.preloadPronunciations(words);
        updateStats();
      } finally {
        setIsPreloading(false);
      }
    },
    [isConnected, isSlowNetwork]
  );

  /**
   * Update statistics
   */
  const updateStats = useCallback(() => {
    const newStats = preloadService.getStats();
    setStats({
      total: newStats.total,
      completed: newStats.completed,
      failed: newStats.failed,
    });
  }, []);

  /**
   * Auto-preload next chapter when bookId/chapterId changes
   */
  useEffect(() => {
    if (!autoPreload || !bookId || !chapterId || !isConnected) {
      return;
    }

    // Preload next chapter
    preloadService.preloadNextChapter(bookId, chapterId).catch(err =>
      console.warn('Auto-preload failed:', err)
    );

    // Preload related chapters if enabled
    if (preloadRelated) {
      preloadService.preloadRelatedChapters(bookId, chapterId).catch(err =>
        console.warn('Related preload failed:', err)
      );
    }

    updateStats();
  }, [bookId, chapterId, autoPreload, preloadRelated, isConnected, updateStats]);

  return {
    preload,
    preloadDaily,
    preloadPronunciations,
    isPreloading,
    preloadStats: stats,
  };
}

export type { UsePreloadOptions, UsePreloadResult };

/**
 * Hook for app launch preloading
 * Preloads critical data on app startup
 */
export function useAppLaunchPreload(): {
  isPreloading: boolean;
  error: Error | null;
} {
  const [isPreloading, setIsPreloading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    if (!isConnected) {
      setIsPreloading(false);
      return;
    }

    let isMounted = true;

    const preloadOnLaunch = async () => {
      try {
        await preloadService.preloadOnLaunch();

        if (isMounted) {
          setIsPreloading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsPreloading(false);
        }
      }
    };

    preloadOnLaunch();

    return () => {
      isMounted = false;
    };
  }, [isConnected]);

  return {
    isPreloading,
    error,
  };
}

export type UseAppLaunchPreloadResult = ReturnType<typeof useAppLaunchPreload>;
