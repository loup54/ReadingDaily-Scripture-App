/**
 * useOptimisticRating Hook
 * Optimistic rating update with automatic rollback on error
 *
 * Features:
 * - Rating updates instantly (0ms vs 300ms)
 * - 1-5 star rating system
 * - Automatic rollback on error
 * - Loading state for API call
 * - Error handling with retry
 * - Caching integration
 *
 * @example
 * const { rating, setRating, error } = useOptimisticRating('gen_1_1');
 *
 * return (
 *   <>
 *     <StarRating value={rating} onChange={setRating} />
 *     {error && <Text style={{ color: 'red' }}>{error}</Text>}
 *   </>
 * );
 */

import { useState, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';
import { optimisticUpdate, OptimisticDebug } from '@/utils/optimisticUtils';

export type RatingValue = 0 | 1 | 2 | 3 | 4 | 5;

interface UseOptimisticRatingOptions {
  initialRating?: RatingValue;
  onSuccess?: (rating: RatingValue) => void;
  onError?: (error: Error, previousRating: RatingValue) => void;
}

interface UseOptimisticRatingResult {
  rating: RatingValue;
  setRating: (rating: RatingValue) => Promise<void>;
  error: Error | null;
  isLoading: boolean;
  retry: () => Promise<void>;
}

/**
 * Mock API service (replace with actual API)
 */
const ratingsAPI = {
  set: async (scriptureId: string, rating: RatingValue): Promise<RatingValue> => {
    await new Promise(resolve => setTimeout(resolve, 250));

    if (Math.random() < 0.1) {
      throw new Error('Failed to save rating');
    }

    return rating;
  },

  get: async (scriptureId: string): Promise<RatingValue | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return null;
  },

  clear: async (scriptureId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (Math.random() < 0.1) {
      throw new Error('Failed to clear rating');
    }
  },
};

export function useOptimisticRating(
  scriptureId: string,
  options: UseOptimisticRatingOptions = {}
): UseOptimisticRatingResult {
  const {
    initialRating = 0,
    onSuccess,
    onError,
  } = options;

  // Validate initial rating
  if (initialRating < 0 || initialRating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }

  // State
  const [rating, setRatingState] = useState<RatingValue>(initialRating);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const previousRatingRef = useRef<RatingValue>(initialRating);

  /**
   * Validate rating value
   */
  const isValidRating = (value: any): value is RatingValue => {
    return Number.isInteger(value) && value >= 0 && value <= 5;
  };

  /**
   * Set rating with optimistic update
   */
  const setRating = useCallback(
    async (newRating: RatingValue) => {
      setError(null);

      // Validate
      if (!isValidRating(newRating)) {
        const err = new Error('Rating must be between 0 and 5');
        setError(err);
        return;
      }

      // If clearing rating (0)
      const isClearingRating = newRating === 0;

      await optimisticUpdate(
        setRatingState,
        () => rating,
        // Optimistic update: set immediately
        () => newRating,
        // API call
        async () => {
          setIsLoading(true);
          try {
            if (isClearingRating) {
              await ratingsAPI.clear(scriptureId);
            } else {
              await ratingsAPI.set(scriptureId, newRating);
            }

            OptimisticDebug.logOptimisticUpdate(
              'setRating',
              rating,
              newRating
            );

            // Update cache
            const cacheKey = cacheKeys.ratings(scriptureId);
            cacheService.set(cacheKey, newRating, CACHE_TTL.RATINGS);

            return newRating;
          } finally {
            setIsLoading(false);
          }
        },
        {
          onSuccess: (newValue) => {
            previousRatingRef.current = newValue;
            onSuccess?.(newValue);
          },
          onError: (err, original) => {
            OptimisticDebug.logOptimisticError('setRating', err);
            setError(err);
            onError?.(err, original);
          },
          retries: 2,
          timeout: 5000,
        }
      );
    },
    [rating, scriptureId, onSuccess, onError]
  );

  /**
   * Retry failed rating update
   */
  const retry = useCallback(async () => {
    if (error) {
      // Retry the last rating update
      await setRating(rating);
    }
  }, [error, rating, setRating]);

  return {
    rating,
    setRating,
    error,
    isLoading,
    retry,
  };
}

/**
 * Quick rating component helpers
 */
export const RatingHelpers = {
  /**
   * Get star display (⭐)
   */
  getStarDisplay: (rating: RatingValue): string => {
    if (rating === 0) return '☆☆☆☆☆';
    if (rating === 1) return '⭐☆☆☆☆';
    if (rating === 2) return '⭐⭐☆☆☆';
    if (rating === 3) return '⭐⭐⭐☆☆';
    if (rating === 4) return '⭐⭐⭐⭐☆';
    if (rating === 5) return '⭐⭐⭐⭐⭐';
    return '☆☆☆☆☆';
  },

  /**
   * Get rating description
   */
  getDescription: (rating: RatingValue): string => {
    switch (rating) {
      case 0:
        return 'Not rated';
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very good';
      case 5:
        return 'Excellent';
      default:
        return '';
    }
  },

  /**
   * Get color for rating
   */
  getColor: (rating: RatingValue): string => {
    switch (rating) {
      case 0:
        return '#999999'; // Gray
      case 1:
        return '#FF6B6B'; // Red
      case 2:
        return '#FFA500'; // Orange
      case 3:
        return '#FFD700'; // Yellow
      case 4:
        return '#90EE90'; // Light green
      case 5:
        return '#32CD32'; // Lime green
      default:
        return '#999999';
    }
  },

  /**
   * Validate rating is in range
   */
  isValidRating: (value: any): boolean => {
    return Number.isInteger(value) && value >= 0 && value <= 5;
  },
};

export type { UseOptimisticRatingOptions, UseOptimisticRatingResult };
