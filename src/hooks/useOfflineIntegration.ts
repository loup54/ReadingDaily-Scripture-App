/**
 * useOfflineIntegration Hook
 * Phase 10A.6: Integration Hook
 *
 * Connects OfflineService to useOfflineStore
 * - Syncs offline service status to store
 * - Handles service initialization
 * - Manages event subscriptions
 * - Provides convenience methods
 */

import { useEffect, useCallback, useRef } from 'react';
import { offlineService } from '@/services/offline/OfflineService';
import { useOfflineStore } from '@/stores/useOfflineStore';

/**
 * Hook to integrate OfflineService with offline store
 * Call once in root component (App.tsx)
 */
export function useOfflineIntegration() {
  const {
    setNetworkStatus,
    setSyncState,
    setFeatures,
    setServiceHealth,
  } = useOfflineStore();

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize service and setup subscription
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Initialize offline service
        if (!offlineService.isReady()) {
          await offlineService.initialize();
        }

        if (!mounted) return;

        // Get initial status
        const status = offlineService.getStatus();
        const health = await offlineService.checkHealth();

        // Update store with initial state
        setNetworkStatus(status.isOnline, 'wifi', status.connectionStatus);
        setSyncState(
          status.isSyncing,
          status.pendingCount,
          status.failedCount,
          status.lastSync
        );
        setFeatures(status.features);
        setServiceHealth(health.healthy, health.issues);

        // Subscribe to status changes
        unsubscribeRef.current = offlineService.onStatusChange((newStatus) => {
          setNetworkStatus(newStatus.isOnline, 'wifi', newStatus.connectionStatus);
          setSyncState(
            newStatus.isSyncing,
            newStatus.pendingCount,
            newStatus.failedCount,
            newStatus.lastSync
          );
          setFeatures(newStatus.features);
        });

        console.log('[useOfflineIntegration] Initialized');
      } catch (error) {
        console.error('[useOfflineIntegration] Initialization failed:', error);
      }
    };

    initialize();

    // Cleanup
    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setNetworkStatus, setSyncState, setFeatures, setServiceHealth]);

  // Provide convenience methods
  const triggerSync = useCallback(async () => {
    try {
      return await offlineService.triggerSync();
    } catch (error) {
      console.error('[useOfflineIntegration] Sync failed:', error);
      throw error;
    }
  }, []);

  const getStatus = useCallback(() => {
    return offlineService.getStatus();
  }, []);

  const canUseFeature = useCallback((feature: keyof any) => {
    return offlineService.canUseFeature(feature);
  }, []);

  return {
    triggerSync,
    getStatus,
    canUseFeature,
    isReady: offlineService.isReady(),
  };
}
