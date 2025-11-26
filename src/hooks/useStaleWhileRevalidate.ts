/**
 * useStaleWhileRevalidate Hook
 * Best-of-both-worlds caching strategy
 *
 * Shows cached content immediately (stale)
 * Fetches fresh data in background (revalidate)
 * Updates UI when fresh data arrives
 * Provides update notifications
 *
 * Benefits:
 * - Instant content display (0ms)
 * - Always fetching fresh data
 * - Never blocks UI
 * - Works excellently on slow networks
 * - Best perceived performance
 *
 * @example
 * const { data, isStale, refresh } = useStaleWhileRevalidate(
 *   'scripture_gen_1',
 *   () => api.fetchScripture('gen', '1'),
 *   { ttl: 24 * 60 * 60 * 1000 }
 * );
 *
 * return (
 *   <>
 *     {data && <Text>{data.text}</Text>}
 *     {isStale && <Badge>Updated</Badge>}
 *   </>
 * );
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { storageService } from '@/services/storageService';

interface UseStaleWhileRevalidateOptions {
  ttl?: number;
  persistent?: boolean;
  showUpdatePrompt?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onStaleDetected?: () => void;
}

interface UseStaleWhileRevalidateResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
  isFetching: boolean;
  refresh: () => Promise<void>;
  dataVersion: number;
}

export function useStaleWhileRevalidate<T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseStaleWhileRevalidateOptions = {}
): UseStaleWhileRevalidateResult<T> {
  const {
    ttl = 60 * 60 * 1000, // 1 hour default
    persistent = true,
    showUpdatePrompt = true,
    onSuccess,
    onError,
    onStaleDetected,
  } = options;

  // State
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // Refs
  const mountedRef = useRef(true);
  const cachedDataRef = useRef<T | null>(null);
  const isRevalidatingRef = useRef(false);

  /**
   * Fetch and cache data
   */
  const fetchAndCache = useCallback(
    async (skipCache = false): Promise<T | null> => {
      try {
        const freshData = await fetchFn();

        if (!mountedRef.current) return null;

        // Check if data changed from cached version
        const dataChanged =
          !cachedDataRef.current ||
          JSON.stringify(cachedDataRef.current) !== JSON.stringify(freshData);

        // Update cache
        cacheService.set(key, freshData, ttl, { persistent });
        if (persistent) {
          await storageService.set(key, freshData, { ttl });
        }

        cachedDataRef.current = freshData;
        setData(freshData);
        setError(null);
        setDataVersion(v => v + 1);

        onSuccess?.(freshData);

        return freshData;
      } catch (err) {
        if (mountedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          onError?.(error);
        }
        return null;
      }
    },
    [key, fetchFn, ttl, persistent, onSuccess, onError]
  );

  /**
   * Main SWR logic: return cached, fetch in background
   */
  const loadWithSWR = useCallback(async () => {
    // Try memory cache first
    let cachedData = cacheService.get<T>(key);

    // If no memory cache, try persistent storage
    if (cachedData === null && persistent) {
      cachedData = await storageService.get<T>(key);
    }

    if (cachedData !== null) {
      // Return cached immediately
      if (mountedRef.current) {
        cachedDataRef.current = cachedData;
        setData(cachedData);
        setLoading(false);
        setError(null);
        setIsStale(true); // Mark as potentially stale
      }

      // Now fetch fresh data in background
      if (!isRevalidatingRef.current) {
        isRevalidatingRef.current = true;
        setIsFetching(true);

        try {
          const freshData = await fetchFn();

          if (!mountedRef.current) return;

          // Check if data actually changed
          const dataChanged = JSON.stringify(cachedData) !== JSON.stringify(freshData);

          if (dataChanged) {
            // Update with fresh data
            cachedDataRef.current = freshData;
            setData(freshData);
            setDataVersion(v => v + 1);

            // Update cache
            cacheService.set(key, freshData, ttl, { persistent });
            if (persistent) {
              await storageService.set(key, freshData, { ttl });
            }

            // Show update notification if enabled
            if (showUpdatePrompt && mountedRef.current) {
              onStaleDetected?.();
            }

            onSuccess?.(freshData);
          }

          // Mark as no longer stale
          if (mountedRef.current) {
            setIsStale(false);
          }
        } catch (err) {
          // Revalidation failed, keep cached data
          if (mountedRef.current) {
            console.warn('Revalidation failed, keeping cached data:', err);
          }
        } finally {
          if (mountedRef.current) {
            setIsFetching(false);
          }
          isRevalidatingRef.current = false;
        }
      }

      return;
    }

    // No cache, fetch from network
    setLoading(true);

    try {
      const freshData = await fetchFn();

      if (mountedRef.current) {
        cachedDataRef.current = freshData;
        setData(freshData);
        setError(null);
        setIsStale(false);
        setLoading(false);

        // Cache the data
        cacheService.set(key, freshData, ttl, { persistent });
        if (persistent) {
          await storageService.set(key, freshData, { ttl });
        }

        onSuccess?.(freshData);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        onError?.(error);
      }
    }
  }, [key, fetchFn, ttl, persistent, showUpdatePrompt, onSuccess, onError, onStaleDetected]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchAndCache(true); // Force fetch
    setLoading(false);
  }, [fetchAndCache]);

  /**
   * Load on mount
   */
  useEffect(() => {
    loadWithSWR();

    return () => {
      mountedRef.current = false;
    };
  }, [key, loadWithSWR]);

  return {
    data,
    loading,
    error,
    isStale,
    isFetching,
    refresh,
    dataVersion,
  };
}

export type { UseStaleWhileRevalidateOptions, UseStaleWhileRevalidateResult };

/**
 * Scripture-specific SWR hook
 * Pre-configured for scripture content
 */
export function useScriptureWithSWR(
  bookId: string,
  chapterId: string,
  verseId?: string
): UseStaleWhileRevalidateResult<any> {
  const key = `scripture_${bookId}_${chapterId}${verseId ? `_${verseId}` : ''}`;

  return useStaleWhileRevalidate(
    key,
    async () => {
      // Mock API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        bookId,
        chapterId,
        verseId,
        text: 'Scripture text here...',
        translation: 'KJV',
      };
    },
    {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      persistent: true,
      showUpdatePrompt: true,
    }
  );
}

/**
 * Bookmarks-specific SWR hook
 * Pre-configured for bookmarks list
 */
export function useBookmarksWithSWR(): UseStaleWhileRevalidateResult<string[]> {
  return useStaleWhileRevalidate(
    'bookmarks_list',
    async () => {
      // Mock API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 200));
      return [];
    },
    {
      ttl: 1 * 60 * 60 * 1000, // 1 hour
      persistent: true,
      showUpdatePrompt: false, // Don't show updates for bookmarks
    }
  );
}

/**
 * Daily scripture-specific SWR hook
 * Pre-configured for daily scripture
 */
export function useDailyScriptureWithSWR(): UseStaleWhileRevalidateResult<any> {
  const today = new Date().toDateString();

  return useStaleWhileRevalidate(
    `daily_${today}`,
    async () => {
      // Mock API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 250));
      return {
        bookId: 'psalms',
        chapterId: '23',
        text: 'The LORD is my shepherd...',
        date: today,
      };
    },
    {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      persistent: true,
      showUpdatePrompt: true,
    }
  );
}
