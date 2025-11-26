/**
 * useOptimisticHighlight Hook
 * Optimistic highlight creation/deletion with automatic rollback
 *
 * Features:
 * - Highlights appear instantly on text
 * - Multiple highlight colors supported
 * - Automatic rollback on error
 * - Loading state for API call
 * - Error handling and retry
 * - Caching integration
 *
 * @example
 * const { highlights, addHighlight, removeHighlight } = useOptimisticHighlight('gen_1_1');
 *
 * return (
 *   <>
 *     <Text onLongPress={(range) => addHighlight(range, 'yellow')}>
 *       Long press to highlight
 *     </Text>
 *     {highlights.map(h => <HighlightIndicator key={h.id} {...h} />)}
 *   </>
 * );
 */

import { useState, useCallback } from 'react';
import { cacheService } from '@/services/cacheService';
import { cacheKeys, CACHE_TTL } from '@/utils/cacheUtils';
import {
  createOptimisticItem,
  replaceTempId,
  removeById,
  OptimisticDebug,
} from '@/utils/optimisticUtils';

export type HighlightColor = 'yellow' | 'pink' | 'green' | 'blue' | 'purple';

export interface Highlight {
  id: string;
  text: string;
  color: HighlightColor;
  startIndex: number;
  endIndex: number;
  timestamp: number;
  synced?: boolean;
}

interface UseOptimisticHighlightOptions {
  initialHighlights?: Highlight[];
  onSuccess?: (highlights: Highlight[]) => void;
  onError?: (error: Error, highlights: Highlight[]) => void;
}

interface UseOptimisticHighlightResult {
  highlights: Highlight[];
  addHighlight: (
    text: string,
    color: HighlightColor,
    startIndex: number,
    endIndex: number
  ) => Promise<void>;
  removeHighlight: (highlightId: string) => Promise<void>;
  updateHighlight: (highlightId: string, color: HighlightColor) => Promise<void>;
  error: Error | null;
  isLoading: boolean;
}

/**
 * Mock API service (replace with actual API)
 */
const highlightsAPI = {
  create: async (
    scriptureId: string,
    text: string,
    color: HighlightColor,
    startIndex: number,
    endIndex: number
  ): Promise<Highlight> => {
    await new Promise(resolve => setTimeout(resolve, 250));

    if (Math.random() < 0.1) {
      throw new Error('Failed to create highlight');
    }

    return {
      id: `hl_${Date.now()}`,
      text,
      color,
      startIndex,
      endIndex,
      timestamp: Date.now(),
    };
  },

  delete: async (highlightId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (Math.random() < 0.1) {
      throw new Error('Failed to delete highlight');
    }
  },

  update: async (
    highlightId: string,
    color: HighlightColor
  ): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (Math.random() < 0.1) {
      throw new Error('Failed to update highlight');
    }
  },

  getAll: async (scriptureId: string): Promise<Highlight[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  },
};

export function useOptimisticHighlight(
  scriptureId: string,
  options: UseOptimisticHighlightOptions = {}
): UseOptimisticHighlightResult {
  const {
    initialHighlights = [],
    onSuccess,
    onError,
  } = options;

  // State
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Add highlight with optimistic update
   */
  const addHighlight = useCallback(
    async (
      text: string,
      color: HighlightColor,
      startIndex: number,
      endIndex: number
    ) => {
      setError(null);

      const previousHighlights = highlights;

      try {
        // 1. Create optimistic highlight
        const optimisticHighlight = createOptimisticItem<Highlight>(
          {
            text: text.trim(),
            color,
            startIndex,
            endIndex,
            timestamp: Date.now(),
            synced: false,
          },
          'hl'
        );

        OptimisticDebug.logOptimisticUpdate('addHighlight', previousHighlights, [
          ...previousHighlights,
          optimisticHighlight,
        ]);

        // 2. Add to list optimistically
        setHighlights([...previousHighlights, optimisticHighlight]);

        // 3. Call API
        setIsLoading(true);
        const realHighlight = await highlightsAPI.create(
          scriptureId,
          text,
          color,
          startIndex,
          endIndex
        );

        // 4. Replace temp ID with real ID
        const updatedHighlights = replaceTempId(
          highlights,
          optimisticHighlight.id,
          realHighlight.id,
          { synced: true }
        );

        setHighlights(updatedHighlights);

        // 5. Update cache
        const cacheKey = cacheKeys.highlights(scriptureId);
        cacheService.set(cacheKey, updatedHighlights, CACHE_TTL.HIGHLIGHTS);

        onSuccess?.(updatedHighlights);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        OptimisticDebug.logOptimisticError('addHighlight', error);

        // Rollback
        setHighlights(previousHighlights);
        setError(error);
        onError?.(error, previousHighlights);
      } finally {
        setIsLoading(false);
      }
    },
    [highlights, scriptureId, onSuccess, onError]
  );

  /**
   * Remove highlight with optimistic update
   */
  const removeHighlight = useCallback(
    async (highlightId: string) => {
      setError(null);

      const previousHighlights = highlights;

      try {
        // 1. Remove optimistically
        const updatedHighlights = removeById(highlights, highlightId);

        OptimisticDebug.logOptimisticUpdate('removeHighlight', previousHighlights, updatedHighlights);

        setHighlights(updatedHighlights);

        // 2. Call API
        setIsLoading(true);
        await highlightsAPI.delete(highlightId);

        // 3. Update cache
        const cacheKey = cacheKeys.highlights(scriptureId);
        cacheService.set(cacheKey, updatedHighlights, CACHE_TTL.HIGHLIGHTS);

        onSuccess?.(updatedHighlights);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        OptimisticDebug.logOptimisticError('removeHighlight', error);

        // Rollback
        setHighlights(previousHighlights);
        setError(error);
        onError?.(error, previousHighlights);
      } finally {
        setIsLoading(false);
      }
    },
    [highlights, scriptureId, onSuccess, onError]
  );

  /**
   * Update highlight color
   */
  const updateHighlight = useCallback(
    async (highlightId: string, color: HighlightColor) => {
      setError(null);

      const previousHighlights = highlights;

      try {
        // 1. Update optimistically
        const updatedHighlights = highlights.map(h =>
          h.id === highlightId ? { ...h, color } : h
        );

        OptimisticDebug.logOptimisticUpdate('updateHighlight', previousHighlights, updatedHighlights);

        setHighlights(updatedHighlights);

        // 2. Call API
        setIsLoading(true);
        await highlightsAPI.update(highlightId, color);

        // 3. Update cache
        const cacheKey = cacheKeys.highlights(scriptureId);
        cacheService.set(cacheKey, updatedHighlights, CACHE_TTL.HIGHLIGHTS);

        onSuccess?.(updatedHighlights);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        OptimisticDebug.logOptimisticError('updateHighlight', error);

        // Rollback
        setHighlights(previousHighlights);
        setError(error);
        onError?.(error, previousHighlights);
      } finally {
        setIsLoading(false);
      }
    },
    [highlights, scriptureId, onSuccess, onError]
  );

  return {
    highlights,
    addHighlight,
    removeHighlight,
    updateHighlight,
    error,
    isLoading,
  };
}

export type { UseOptimisticHighlightOptions, UseOptimisticHighlightResult };
