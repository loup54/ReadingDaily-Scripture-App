/**
 * useNetworkStatus Hook
 * Track network connectivity and speed
 *
 * Features:
 * - Detect network connectivity
 * - Detect network type (wifi, cellular, etc)
 * - Detect network speed (slow, normal, fast)
 * - Real-time status updates
 * - Mock implementation for development
 *
 * @example
 * const { isConnected, isSlowNetwork, networkType } = useNetworkStatus();
 *
 * if (!isConnected) {
 *   return <OfflineMessage />;
 * }
 *
 * if (isSlowNetwork) {
 *   // Skip preloading on slow networks
 * }
 */

import { useEffect, useState } from 'react';

export type NetworkType = 'wifi' | 'cellular' | 'none' | 'unknown';

export type NetworkSpeed = 'slow' | 'normal' | 'fast';

interface UseNetworkStatusResult {
  isConnected: boolean;
  networkType: NetworkType;
  isSlowNetwork: boolean;
  speed: NetworkSpeed;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [isConnected, setIsConnected] = useState(true);
  const [networkType, setNetworkType] = useState<NetworkType>('wifi');
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [speed, setSpeed] = useState<NetworkSpeed>('normal');

  useEffect(() => {
    /**
     * In real app, use NetInfo or similar:
     * import NetInfo from '@react-native-community/netinfo';
     *
     * const subscription = NetInfo.addEventListener(state => {
     *   setIsConnected(state.isConnected ?? true);
     *   setNetworkType(state.type ?? 'unknown');
     *   setIsSlowNetwork(state.type === 'cellular' && state.details?.cellularGeneration === '3g');
     * });
     *
     * return () => subscription();
     */

    // Mock implementation for development
    const handleOnline = () => {
      setIsConnected(true);
      setNetworkType('wifi');
      setIsSlowNetwork(false);
      setSpeed('normal');
    };

    const handleOffline = () => {
      setIsConnected(false);
      setNetworkType('none');
      setIsSlowNetwork(true);
      setSpeed('slow');
    };

    // Listen to network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return {
    isConnected,
    networkType,
    isSlowNetwork,
    speed,
  };
}

/**
 * Hook to detect if network is slow
 * Useful for skipping preloading on slow connections
 */
export function useIsSlowNetwork(): boolean {
  const { isSlowNetwork } = useNetworkStatus();
  return isSlowNetwork;
}

/**
 * Hook to detect if device is online
 */
export function useIsOnline(): boolean {
  const { isConnected } = useNetworkStatus();
  return isConnected;
}

/**
 * Hook to detect network type
 */
export function useNetworkType(): NetworkType {
  const { networkType } = useNetworkStatus();
  return networkType;
}

export type { UseNetworkStatusResult };
