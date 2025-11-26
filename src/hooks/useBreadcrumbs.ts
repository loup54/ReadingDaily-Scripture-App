/**
 * useBreadcrumbs Hook
 * Phase 3: Navigation & Flow - Breadcrumb Management
 *
 * Provides React components access to breadcrumb/history tracking.
 * Subscribes to history changes and re-renders on updates.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  routeHistoryService,
  RouteSegment,
} from '@/services/navigation/RouteHistoryService';
import { useRouter } from 'expo-router';

export interface UseBreadcrumbsReturn {
  /**
   * Breadcrumb segments (all routes except current)
   */
  breadcrumbs: RouteSegment[];

  /**
   * Current route
   */
  current: RouteSegment | undefined;

  /**
   * Full history including current
   */
  history: RouteSegment[];

  /**
   * Add new route to history
   */
  push: (segment: Omit<RouteSegment, 'timestamp'>) => void;

  /**
   * Remove last route from history
   */
  pop: () => void;

  /**
   * Replace current route
   */
  replace: (segment: Omit<RouteSegment, 'timestamp'>) => void;

  /**
   * Navigate to breadcrumb (go back to specific point)
   */
  navigateTo: (index: number) => void;

  /**
   * Clear all history
   */
  clear: () => void;

  /**
   * Generate breadcrumb text (e.g., "Home / Settings / Profile")
   */
  generateText: (separator?: string) => string;

  /**
   * Check if breadcrumbs exist
   */
  hasBreadcrumbs: boolean;
}

/**
 * useBreadcrumbs - Hook for managing breadcrumb navigation
 *
 * @example
 * const { breadcrumbs, push, navigateTo } = useBreadcrumbs();
 *
 * // On screen load
 * useEffect(() => {
 *   push({ name: 'readings', label: 'Daily Readings' });
 * }, []);
 *
 * // Render breadcrumbs
 * {breadcrumbs.map((crumb, i) => (
 *   <TouchableOpacity
 *     key={i}
 *     onPress={() => navigateTo(i)}
 *   >
 *     <Text>{crumb.label}</Text>
 *   </TouchableOpacity>
 * ))}
 */
export const useBreadcrumbs = (): UseBreadcrumbsReturn => {
  const router = useRouter();
  const [history, setHistory] = useState<RouteSegment[]>(
    routeHistoryService.getHistory()
  );

  // Subscribe to history changes
  useEffect(() => {
    const unsubscribe = routeHistoryService.onHistoryChange((newHistory) => {
      setHistory([...newHistory]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const push = useCallback((segment: Omit<RouteSegment, 'timestamp'>) => {
    routeHistoryService.push(segment);
  }, []);

  const pop = useCallback(() => {
    routeHistoryService.pop();
  }, []);

  const replace = useCallback((segment: Omit<RouteSegment, 'timestamp'>) => {
    routeHistoryService.replace(segment);
  }, []);

  const navigateTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= history.length - 1) {
        console.warn(`[useBreadcrumbs] Invalid breadcrumb index: ${index}`);
        return;
      }

      const target = history[index];
      console.log(`[useBreadcrumbs] 📍 Navigating to: ${target.name}`);

      // Navigate to the target route
      router.push(target.name);

      // Pop history until we reach the target
      while (routeHistoryService.getHistory().length > index + 1) {
        routeHistoryService.pop();
      }
    },
    [history, router]
  );

  const clear = useCallback(() => {
    routeHistoryService.clear();
  }, []);

  const generateText = useCallback((separator: string = ' / '): string => {
    return routeHistoryService.generateBreadcrumbText(separator);
  }, []);

  const breadcrumbs = history.slice(0, -1);
  const current = history[history.length - 1];

  return {
    breadcrumbs,
    current,
    history,
    push,
    pop,
    replace,
    navigateTo,
    clear,
    generateText,
    hasBreadcrumbs: breadcrumbs.length > 0,
  };
};
