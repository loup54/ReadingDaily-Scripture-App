/**
 * useScreenTransition Hook
 * Phase 4: Navigation & Flow - Screen Transition Management
 *
 * Provides utilities for controlling screen transitions and animations.
 * Use this hook to customize navigation animations.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  AnimationDurations,
  ScreenTransitions,
  TransitionType,
} from '@/constants/animations';

export interface TransitionOptions {
  /**
   * Transition type: 'push', 'pop', 'fade', 'none'
   */
  type: TransitionType;

  /**
   * Custom duration (overrides default)
   */
  duration?: number;

  /**
   * Animation enabled
   */
  animated?: boolean;

  /**
   * Replace instead of push (no back button)
   */
  replace?: boolean;
}

export interface UseScreenTransitionReturn {
  /**
   * Navigate with standard push animation
   */
  pushScreen: (path: string, params?: Record<string, any>) => void;

  /**
   * Navigate with custom transition
   */
  navigateWithTransition: (
    path: string,
    options: Partial<TransitionOptions>,
    params?: Record<string, any>
  ) => void;

  /**
   * Navigate with fade animation
   */
  fadeNavigate: (path: string, params?: Record<string, any>) => void;

  /**
   * Replace current screen (no back)
   */
  replaceScreen: (path: string, params?: Record<string, any>) => void;

  /**
   * Navigate with no animation (instant)
   */
  instantNavigate: (path: string, params?: Record<string, any>) => void;

  /**
   * Go back with animation
   */
  goBack: () => void;

  /**
   * Go back without animation
   */
  goBackInstant: () => void;

  /**
   * Get transition config for a type
   */
  getTransition: (type: TransitionType) => any;
}

/**
 * useScreenTransition - Hook for screen navigation with animations
 *
 * @example
 * const { pushScreen, fadeNavigate, replaceScreen } = useScreenTransition();
 *
 * // Standard push animation
 * pushScreen('/(tabs)/readings');
 *
 * // Fade animation
 * fadeNavigate('/(tabs)/settings');
 *
 * // Replace current screen
 * replaceScreen('/(auth)/landing');
 */
export const useScreenTransition = (): UseScreenTransitionReturn => {
  const router = useRouter();

  /**
   * Standard push navigation with slide animation
   */
  const pushScreen = useCallback(
    (path: string, params?: Record<string, any>) => {
      console.log(`[ScreenTransition] 📍 Pushing screen: ${path}`);

      if (params) {
        router.push({
          pathname: path,
          params,
        });
      } else {
        router.push(path);
      }
    },
    [router]
  );

  /**
   * Navigate with custom transition options
   */
  const navigateWithTransition = useCallback(
    (
      path: string,
      options: Partial<TransitionOptions>,
      params?: Record<string, any>
    ) => {
      const {
        type = 'PUSH',
        animated = true,
        replace = false,
      } = options;

      console.log(
        `[ScreenTransition] 📍 Navigating with ${type} transition: ${path}`
      );

      if (!animated) {
        console.log(`[ScreenTransition] ⚡ Animation disabled`);
      }

      if (replace) {
        router.replace({
          pathname: path,
          params,
        });
      } else {
        if (params) {
          router.push({
            pathname: path,
            params,
          });
        } else {
          router.push(path);
        }
      }
    },
    [router]
  );

  /**
   * Navigate with fade animation
   */
  const fadeNavigate = useCallback(
    (path: string, params?: Record<string, any>) => {
      console.log(`[ScreenTransition] 🎨 Fade navigating to: ${path}`);

      navigateWithTransition(path, { type: 'FADE' }, params);
    },
    [navigateWithTransition]
  );

  /**
   * Replace current screen without back button
   */
  const replaceScreen = useCallback(
    (path: string, params?: Record<string, any>) => {
      console.log(`[ScreenTransition] 🔄 Replacing screen: ${path}`);

      router.replace({
        pathname: path,
        params,
      });
    },
    [router]
  );

  /**
   * Navigate instantly without animation
   */
  const instantNavigate = useCallback(
    (path: string, params?: Record<string, any>) => {
      console.log(`[ScreenTransition] ⚡ Instant navigation: ${path}`);

      navigateWithTransition(path, { type: 'NONE', animated: false }, params);
    },
    [navigateWithTransition]
  );

  /**
   * Go back with animation
   */
  const goBack = useCallback(() => {
    console.log('[ScreenTransition] 🔙 Going back with animation');
    router.back();
  }, [router]);

  /**
   * Go back without animation
   */
  const goBackInstant = useCallback(() => {
    console.log('[ScreenTransition] ⚡ Going back instantly');
    router.back();
  }, [router]);

  /**
   * Get transition configuration by type
   */
  const getTransition = useCallback((type: TransitionType) => {
    return ScreenTransitions[type];
  }, []);

  return {
    pushScreen,
    navigateWithTransition,
    fadeNavigate,
    replaceScreen,
    instantNavigate,
    goBack,
    goBackInstant,
    getTransition,
  };
};
