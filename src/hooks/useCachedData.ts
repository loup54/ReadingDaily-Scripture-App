/**
 * useCachedData Hook
 * React hook for fetching data with caching
 *
 * Features:
 * - Automatic caching with TTL
 * - Loading states
 * - Error handling
 * - Manual refresh
 * - Configurable cache strategy
 *
 * @example
 * // Basic usage
 * const { data, loading, error, refresh } = useCachedData(
 *   'scripture_123',
 *   () => fetchScripture(id)
 * );
 *
 * // With options
 * const { data } = useCachedData(
 *   'scripture_123',
 *   () => fetchScripture(id),
 *   {
 *     ttl: 24 * 60 * 60 * 1000,
 *     strategy: 'cache_first'
 *   }
 * );
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { storageService } from '@/services/storageService';
import { CACHE_STRATEGIES, CacheStrategy } from '@/utils/cacheUtils';

interface UseCachedDataOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  persistent?: boolean;
  initialData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  shouldRefetch?: (data: any) => boolean;
}

interface UseCachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isStale: boolean;
  isFetching: boolean;
  revalidate: () => Promise<void>;
}

export function useCachedData<T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> {
  const {
    ttl = 60 * 60 * 1000, // 1 hour default
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    persistent = true,
    initialData = null,
    onSuccess,
    onError,
    shouldRefetch,
  } = options;

  // State
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Refs
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetch from cache or network based on strategy
   */
  const fetchData = useCallback(async (force = false) => {
    if (!mountedRef.current) return;

    try {
      // Check if we should skip fetch
      if (data && shouldRefetch && !shouldRefetch(data) && !force) {
        return;
      }

      switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
          await fetchCacheFirst();
          break;
        case CACHE_STRATEGIES.NETWORK_FIRST:
          await fetchNetworkFirst();
          break;
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
          await fetchStaleWhileRevalidate();
          break;
        case CACHE_STRATEGIES.NETWORK_ONLY:
          await fetchNetworkOnly();
          break;
        case CACHE_STRATEGIES.CACHE_ONLY:
          await fetchCacheOnly();
          break;
        default:
          await fetchNetworkFirst();
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    }
  }, [data, strategy, shouldRefetch, onSuccess, onError]);

  /**
   * Cache First Strategy
   * Return cached, fetch fresh silently
   */
  const fetchCacheFirst = useCallback(async () => {
    // Try cache first
    let cachedData = cacheService.get<T>(key);

    if (cachedData !== null) {
      if (mountedRef.current) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        setIsStale(false);
      }

      // Fetch in background
      setIsFetching(true);
      try {
        const freshData = await fetchFn();

        if (mountedRef.current && freshData !== cachedData) {
          setData(freshData);
          setIsStale(true); // Mark as updated
          onSuccess?.(freshData);

          // Update cache
          cacheService.set(key, freshData, ttl, { persistent });
          if (persistent) {
            await storageService.set(key, freshData, { ttl });
          }
        }
      } catch (err) {
        // Fetch failed, keep cached data
        console.warn('Background fetch failed, using cached data:', err);
      } finally {
        if (mountedRef.current) {
          setIsFetching(false);
        }
      }

      return;
    }

    // No cache, fetch from network
    await fetchNetworkOnly();
  }, [key, fetchFn, ttl, persistent, onSuccess]);

  /**
   * Network First Strategy
   * Fetch fresh, fallback to cache
   */
  const fetchNetworkFirst = useCallback(async () => {
    setLoading(true);
    setIsFetching(true);

    try {
      const freshData = await fetchFn();

      if (mountedRef.current) {
        setData(freshData);
        setError(null);
        setIsStale(false);
        onSuccess?.(freshData);

        // Cache the result
        cacheService.set(key, freshData, ttl, { persistent });
        if (persistent) {
          await storageService.set(key, freshData, { ttl });
        }
      }
    } catch (err) {
      // Fetch failed, try cache
      const cachedData = cacheService.get<T>(key);

      if (cachedData !== null && mountedRef.current) {
        setData(cachedData);
        setIsStale(true);
        setError(null);
      } else if (persistent) {
        const persistedData = await storageService.get<T>(key);
        if (persistedData !== null && mountedRef.current) {
          setData(persistedData);
          setIsStale(true);
          setError(null);
        }
      } else if (mountedRef.current) {
        throw err;
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [key, fetchFn, ttl, persistent, onSuccess, onError]);

  /**
   * Stale While Revalidate Strategy
   * Return cached immediately, fetch in background
   */
  const fetchStaleWhileRevalidate = useCallback(async () => {
    // Try memory cache first
    let cachedData = cacheService.get<T>(key);

    // If no memory cache, try persistent storage
    if (cachedData === null && persistent) {
      cachedData = await storageService.get<T>(key);
    }

    if (cachedData !== null) {
      // Return cached immediately
      if (mountedRef.current) {
        setData(cachedData);
        setLoading(false);
        setError(null);
        setIsStale(true); // Mark as potentially stale
      }

      // Fetch fresh in background
      setIsFetching(true);
      try {
        const freshData = await fetchFn();

        if (mountedRef.current) {
          // Only update if different
          if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
            setData(freshData);
            onSuccess?.(freshData);
          }

          // Update cache
          cacheService.set(key, freshData, ttl, { persistent });
          if (persistent) {
            await storageService.set(key, freshData, { ttl });
          }
        }
      } catch (err) {
        // Revalidation failed, keep cached data
        console.warn('Revalidation failed, keeping cached data:', err);
      } finally {
        if (mountedRef.current) {
          setIsFetching(false);
          setIsStale(false); // No longer stale after fetch attempt
        }
      }

      return;
    }

    // No cache, fetch from network
    await fetchNetworkOnly();
  }, [key, fetchFn, ttl, persistent, onSuccess]);

  /**
   * Network Only Strategy
   * Always fetch fresh
   */
  const fetchNetworkOnly = useCallback(async () => {
    setLoading(true);
    setIsFetching(true);

    try {
      const freshData = await fetchFn();

      if (mountedRef.current) {
        setData(freshData);
        setError(null);
        setIsStale(false);
        onSuccess?.(freshData);

        // Update cache
        cacheService.set(key, freshData, ttl, { persistent });
        if (persistent) {
          await storageService.set(key, freshData, { ttl });
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [key, fetchFn, ttl, persistent, onSuccess, onError]);

  /**
   * Cache Only Strategy
   * Return cached, never fetch
   */
  const fetchCacheOnly = useCallback(async () => {
    setLoading(true);

    let cachedData = cacheService.get<T>(key);

    if (cachedData === null && persistent) {
      cachedData = await storageService.get<T>(key);
    }

    if (cachedData !== null && mountedRef.current) {
      setData(cachedData);
      setError(null);
      setLoading(false);
    } else if (mountedRef.current) {
      setError(new Error('No cached data available'));
      setLoading(false);
    }
  }, [key, persistent]);

  /**
   * Manually refresh data
   */
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  /**
   * Revalidate data (refresh in background)
   */
  const revalidate = useCallback(async () => {
    setIsFetching(true);

    try {
      const freshData = await fetchFn();

      if (mountedRef.current) {
        setData(freshData);
        setError(null);
        onSuccess?.(freshData);

        cacheService.set(key, freshData, ttl, { persistent });
        if (persistent) {
          await storageService.set(key, freshData, { ttl });
        }
      }
    } catch (err) {
      console.warn('Revalidation failed:', err);
    } finally {
      if (mountedRef.current) {
        setIsFetching(false);
      }
    }
  }, [key, fetchFn, ttl, persistent, onSuccess]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [key, fetchData]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    isStale,
    isFetching,
    revalidate,
  };
}

export type { UseCachedDataOptions, UseCachedDataResult };
