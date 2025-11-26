/**
 * Network Status Service
 * Detects online/offline status and provides connectivity information
 * Uses expo-network for real-time network detection
 */

import * as Network from 'expo-network';

export type NetworkStatus = 'online' | 'offline' | 'unknown';
export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'vpn' | 'other' | 'unknown' | 'none';

export interface NetworkState {
  status: NetworkStatus;
  isConnected: boolean;
  type: NetworkType;
  ipAddress: string | null;
  isInternetReachable: boolean | null;
}

type NetworkChangeListener = (state: NetworkState) => void;

/**
 * Service for monitoring network connectivity status
 * Provides methods to check current status and subscribe to changes
 */
export class NetworkStatusService {
  private static listeners: Set<NetworkChangeListener> = new Set();
  private static currentState: NetworkState = {
    status: 'unknown',
    isConnected: false,
    type: 'unknown',
    ipAddress: null,
    isInternetReachable: null,
  };
  private static unsubscribe: (() => void) | null = null;

  /**
   * Initialize network status listener
   * Call once on app startup to begin monitoring network changes
   */
  static async initialize(): Promise<void> {
    console.log('[NetworkStatusService] Initializing network status monitor');

    try {
      // Get initial state
      await this.updateNetworkState();

      // Subscribe to network changes
      const subscription = Network.addNetworkStateListener(async (state) => {
        console.log('[NetworkStatusService] Network state changed:', state);
        await this.updateNetworkState();
      });

      this.unsubscribe = () => subscription.unsubscribe();

      console.log('[NetworkStatusService] ✅ Network monitor initialized');
    } catch (error) {
      console.error('[NetworkStatusService] Failed to initialize:', error);
    }
  }

  /**
   * Update current network state and notify listeners
   */
  private static async updateNetworkState(): Promise<void> {
    try {
      const state = await Network.getNetworkStateAsync();
      const ipAddress = await this.getIPAddress();

      const networkState: NetworkState = {
        status: state.isConnected ? 'online' : 'offline',
        isConnected: state.isConnected ?? false,
        type: (state.type as NetworkType) ?? 'unknown',
        ipAddress,
        isInternetReachable: state.isInternetReachable,
      };

      this.currentState = networkState;

      // Notify all listeners
      this.listeners.forEach((listener) => {
        try {
          listener(networkState);
        } catch (error) {
          console.error('[NetworkStatusService] Listener error:', error);
        }
      });
    } catch (error) {
      console.error('[NetworkStatusService] Error updating network state:', error);
    }
  }

  /**
   * Get the device's current IP address
   */
  private static async getIPAddress(): Promise<string | null> {
    try {
      const ipAddress = await Network.getIpAddressAsync();
      return ipAddress ?? null;
    } catch (error) {
      console.warn('[NetworkStatusService] Could not get IP address:', error);
      return null;
    }
  }

  /**
   * Get current network state synchronously (last known state)
   */
  static getCurrentState(): NetworkState {
    return this.currentState;
  }

  /**
   * Check if device is currently online
   */
  static isOnline(): boolean {
    return this.currentState.isConnected;
  }

  /**
   * Check if internet is reachable (more reliable than isConnected)
   */
  static isInternetReachable(): boolean | null {
    return this.currentState.isInternetReachable;
  }

  /**
   * Get current network type (wifi, cellular, etc)
   */
  static getNetworkType(): NetworkType {
    return this.currentState.type;
  }

  /**
   * Subscribe to network status changes
   * Returns unsubscribe function
   */
  static onNetworkChange(listener: NetworkChangeListener): () => void {
    console.log('[NetworkStatusService] Adding network change listener');
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      console.log('[NetworkStatusService] Removing network change listener');
      this.listeners.delete(listener);
    };
  }

  /**
   * Cleanup - remove all listeners and unsubscribe from network updates
   */
  static destroy(): void {
    console.log('[NetworkStatusService] Destroying network status monitor');
    this.listeners.clear();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Get detailed network state information
   */
  static getNetworkInfo(): NetworkState {
    return {
      ...this.currentState,
    };
  }

  /**
   * Check if device has WiFi connection
   */
  static hasWiFi(): boolean {
    return this.currentState.type === 'wifi' && this.currentState.isConnected;
  }

  /**
   * Check if device has cellular connection
   */
  static hasCellular(): boolean {
    return this.currentState.type === 'cellular' && this.currentState.isConnected;
  }

  /**
   * Wait for network to come online (useful for sync operations)
   * Times out after 30 seconds
   */
  static async waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const unsubscribe = this.onNetworkChange((state) => {
        if (state.isConnected) {
          unsubscribe();
          timeout && clearTimeout(timeout);
          resolve(true);
        }
      });

      const timeout = setTimeout(() => {
        unsubscribe();
        console.warn('[NetworkStatusService] Timeout waiting for network');
        resolve(false);
      }, timeoutMs);
    });
  }
}
