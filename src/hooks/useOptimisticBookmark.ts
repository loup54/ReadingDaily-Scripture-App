/**
 * useOptimisticBookmark Hook
 * Optimistic bookmark toggle with automatic rollback on error
 *
 * Features:
 * - Instant UI feedback (0ms vs 200ms)
 * - Automatic rollback on error
 * - Loading state for API call
 * - Error handling and display
 * - Caching integration
 *
 * @example
 * const { isBookmarked, toggle, error } = useOptimisticBookmark('gen_1_1');
 *
 * return (
 *   <>
 *     <Button onPress={toggle}>
 *       {isBookmarked ? '♥️ Bookmarked' : '♡ Bookmark'}
 *     </Button>
 *     {error && <Text style={{ color: 'red' }}>{error}</Text>}
 *   </>
 * );
 */

import { useState, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';
import { optimisticUpdate } from '@/utils/optimisticUtils';

interface UseOptimisticBookmarkOptions {
  initialState?: boolean;
  onSuccess?: (isBookmarked: boolean) => void;
  onError?: (error: Error, wasBookmarked: boolean) => void;
}

interface UseOptimisticBookmarkResult {
  isBookmarked: boolean;
  toggle: () => Promise<void>;
  error: Error | null;
  isLoading: boolean;
  retry: () => Promise<void>;
}

/**
 * Mock API service (replace with actual API)
 * In real app, import from your API service
 */
const bookmarkAPI = {
  toggle: async (scriptureId: string): Promise<{ isBookmarked: boolean }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate occasional failures (10% failure rate for demo)
    if (Math.random() < 0.1) {
      throw new Error('Failed to update bookmark');
    }

    // In real app, call actual API
    // return await api.bookmarks.toggle(scriptureId);
    return { isBookmarked: true };
  },

  add: async (scriptureId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    if (Math.random() < 0.1) {
      throw new Error('Failed to add bookmark');
    }
    // return await api.bookmarks.add(scriptureId);
  },

  remove: async (scriptureId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    if (Math.random() < 0.1) {
      throw new Error('Failed to remove bookmark');
    }
    // return await api.bookmarks.remove(scriptureId);
  },

  getAll: async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    // return await api.bookmarks.getAll();
    return [];
  },
};

export function useOptimisticBookmark(
  scriptureId: string,
  options: UseOptimisticBookmarkOptions = {}
): UseOptimisticBookmarkResult {
  const {
    initialState = false,
    onSuccess,
    onError,
  } = options;

  // State
  const [isBookmarked, setIsBookmarked] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const previousStateRef = useRef(isBookmarked);

  /**
   * Toggle bookmark with optimistic update
   */
  const toggle = useCallback(async () => {
    setError(null);

    await optimisticUpdate(
      setIsBookmarked,
      () => isBookmarked,
      // Optimistic update: toggle immediately
      (state) => !state,
      // API call
      async () => {
        setIsLoading(true);
        try {
          const newState = !isBookmarked;

          // Call appropriate API
          if (newState) {
            await bookmarkAPI.add(scriptureId);
          } else {
            await bookmarkAPI.remove(scriptureId);
          }

          // Update cache
          const cacheKey = cacheKeys.bookmarkStatus(scriptureId);
          cacheService.set(cacheKey, newState, CACHE_TTL.BOOKMARKS);

          // Also update bookmarks list cache
          const bookmarksKey = cacheKeys.bookmarks();
          const cachedBookmarks = cacheService.get<string[]>(bookmarksKey) || [];

          if (newState && !cachedBookmarks.includes(scriptureId)) {
            cachedBookmarks.push(scriptureId);
          } else if (!newState) {
            const idx = cachedBookmarks.indexOf(scriptureId);
            if (idx > -1) {
              cachedBookmarks.splice(idx, 1);
            }
          }

          cacheService.set(bookmarksKey, cachedBookmarks, CACHE_TTL.BOOKMARKS);

          return newState;
        } finally {
          setIsLoading(false);
        }
      },
      {
        onSuccess: (newState) => {
          previousStateRef.current = newState;
          onSuccess?.(newState);
        },
        onError: (err, original) => {
          setError(err);
          onError?.(err, original);
        },
        retries: 2,
        timeout: 5000,
      }
    );
  }, [scriptureId, isBookmarked, onSuccess, onError]);

  /**
   * Retry failed toggle
   */
  const retry = useCallback(async () => {
    if (error) {
      await toggle();
    }
  }, [error, toggle]);

  return {
    isBookmarked,
    toggle,
    error,
    isLoading,
    retry,
  };
}

export type { UseOptimisticBookmarkOptions, UseOptimisticBookmarkResult };

/**
 * Batch bookmark operations
 * Toggle multiple bookmarks in optimistic manner
 */
export async function useOptimisticBookmarks(
  scriptureIds: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const id of scriptureIds) {
    try {
      const result = await bookmarkAPI.add(id);
      results.set(id, true);
    } catch (err) {
      results.set(id, false);
    }
  }

  return results;
}
