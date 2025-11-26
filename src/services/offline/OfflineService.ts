/**
 * Offline Service
 * Phase 10A.4: Offline Support & Sync
 *
 * Coordinates offline functionality:
 * - Offline feature availability detection
 * - Connection state monitoring
 * - Sync triggering and monitoring
 * - Pending data count tracking
 * - Service health and readiness checks
 *
 * Features:
 * - Determines which features work offline
 * - Monitors network connectivity
 * - Triggers sync operations
 * - Tracks pending items count
 * - Manages offline store state
 */

import { databaseService } from '@/services/database/DatabaseService';
import { cacheService } from '@/services/cache/CacheService';
import { syncService } from '@/services/sync/SyncService';
import { NetworkStatusService } from '@/services/network/NetworkStatusService';
import {
  OfflineFeatures,
  ConnectionStatus,
  SyncProgress,
} from '@/types/cache.types';

interface OfflineStatus {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
  isPending: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  features: OfflineFeatures;
  lastSync: number | null;
  nextRetry: number | null;
}

type StatusChangeListener = (status: OfflineStatus) => void;

export class OfflineService {
  private isInitialized = false;
  private statusListeners: Set<StatusChangeListener> = new Set();
  private networkUnsubscribe: (() => void) | null = null;
  private syncUnsubscribe: (() => void) | null = null;
  private currentStatus: OfflineStatus = {
    isOnline: false,
    connectionStatus: 'offline',
    isPending: false,
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    features: {
      canPractice: true,
      canViewReadings: true,
      canViewResults: true,
      canSeeStats: true,
      canUpgrade: false,
      canSyncNow: true,
    },
    lastSync: null,
    nextRetry: null,
  };

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.warn('[OfflineService] Already initialized');
        return;
      }

      // Ensure all dependent services are ready
      if (!databaseService.isReady?.()) {
        await databaseService.initialize();
      }

      if (!cacheService.isReady?.()) {
        await cacheService.initialize();
      }

      if (!syncService.isReady?.()) {
        await syncService.initialize();
      }

      // Initialize network monitoring
      await NetworkStatusService.initialize();

      // Subscribe to network changes
      this.networkUnsubscribe = NetworkStatusService.onNetworkChange(
        this.onNetworkChange.bind(this)
      );

      // Subscribe to sync events
      this.syncUnsubscribe = syncService.onSyncEvent(
        this.onSyncEvent.bind(this)
      );

      // Initial status update
      await this.updateStatus();

      this.isInitialized = true;
      console.log('[OfflineService] Initialized');
    } catch (error) {
      console.error('[OfflineService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current offline status
   */
  getStatus(): OfflineStatus {
    return { ...this.currentStatus };
  }

  /**
   * Get offline features availability
   */
  getOfflineFeatures(): OfflineFeatures {
    return { ...this.currentStatus.features };
  }

  /**
   * Check if specific feature is available offline
   */
  canUseFeature(feature: keyof OfflineFeatures): boolean {
    return this.currentStatus.features[feature];
  }

  /**
   * Get connection status (online/offline/slow)
   */
  getConnectionStatus(): ConnectionStatus {
    return this.currentStatus.connectionStatus;
  }

  /**
   * Check if device is currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Get count of pending items waiting to sync
   */
  getPendingCount(): number {
    return this.currentStatus.pendingCount;
  }

  /**
   * Get count of failed items
   */
  getFailedCount(): number {
    return this.currentStatus.failedCount;
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncing(): boolean {
    return this.currentStatus.isSyncing;
  }

  /**
   * Check if there are pending items
   */
  hasPendingItems(): boolean {
    return this.currentStatus.isPending;
  }

  /**
   * Trigger immediate sync
   */
  async triggerSync(): Promise<SyncProgress> {
    try {
      console.log('[OfflineService] Sync triggered');
      const result = await syncService.syncNow();
      await this.updateStatus();
      return result;
    } catch (error) {
      console.error('[OfflineService] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Wait for sync to complete
   */
  async waitForSync(timeoutMs: number = 60000): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.currentStatus.isSyncing) {
        resolve(true);
        return;
      }

      const unsubscribe = this.onStatusChange((status) => {
        if (!status.isSyncing) {
          unsubscribe();
          timeout && clearTimeout(timeout);
          resolve(true);
        }
      });

      const timeout = setTimeout(() => {
        unsubscribe();
        console.warn('[OfflineService] Sync timeout');
        resolve(false);
      }, timeoutMs);
    });
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: StatusChangeListener): () => void {
    this.statusListeners.add(listener);
    console.log('[OfflineService] Added status change listener');

    return () => {
      this.statusListeners.delete(listener);
      console.log('[OfflineService] Removed status change listener');
    };
  }

  /**
   * Get sync progress
   */
  getSyncProgress(): SyncProgress {
    return syncService.getSyncStatus();
  }

  /**
   * Get detailed offline status information
   */
  async getDetailedStatus(): Promise<{
    status: OfflineStatus;
    syncProgress: SyncProgress;
    cacheStats: any;
  }> {
    try {
      const status = this.getStatus();
      const syncProgress = syncService.getSyncStatus();
      const cacheStats = await cacheService.getCacheStats?.();

      return {
        status,
        syncProgress,
        cacheStats,
      };
    } catch (error) {
      console.error('[OfflineService] Failed to get detailed status:', error);
      throw error;
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check database
      if (!databaseService.isReady?.()) {
        issues.push('DatabaseService not ready');
      }

      // Check cache
      if (!cacheService.isReady?.()) {
        issues.push('CacheService not ready');
      }

      // Check sync
      if (!syncService.isReady?.()) {
        issues.push('SyncService not ready');
      }

      // Check for too many pending items
      if (this.currentStatus.pendingCount > 100) {
        issues.push('Too many pending items');
      }

      // Check for too many failed items
      if (this.currentStatus.failedCount > 10) {
        issues.push('Too many failed items');
      }

      return {
        healthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('[OfflineService] Health check failed:', error);
      return {
        healthy: false,
        issues: [String(error)],
      };
    }
  }

  /**
   * Shutdown offline service
   */
  async shutdown(): Promise<void> {
    try {
      if (this.networkUnsubscribe) {
        this.networkUnsubscribe();
        this.networkUnsubscribe = null;
      }

      if (this.syncUnsubscribe) {
        this.syncUnsubscribe();
        this.syncUnsubscribe = null;
      }

      this.statusListeners.clear();
      this.isInitialized = false;

      console.log('[OfflineService] Shutdown complete');
    } catch (error) {
      console.error('[OfflineService] Shutdown error:', error);
      throw error;
    }
  }

  // ============ Private Methods ============

  /**
   * Update current status and notify listeners
   */
  private async updateStatus(): Promise<void> {
    try {
      // Get network status
      const isOnline = NetworkStatusService.isOnline();
      const connectionStatus = this.getConnectionStatusValue();

      // Get pending/sync status
      const syncProgress = syncService.getSyncStatus();
      const pendingCount = await databaseService.getPendingCount?.() || 0;
      const failedSyncs = syncService.getFailedSyncs?.() || [];

      // Get sync metadata
      const metadata = await databaseService.getSyncMetadata?.();

      // Determine offline features
      const features = this.determineOfflineFeatures(isOnline, pendingCount);

      // Update status
      const newStatus: OfflineStatus = {
        isOnline,
        connectionStatus,
        isPending: pendingCount > 0,
        isSyncing: syncProgress.inProgress,
        pendingCount,
        failedCount: failedSyncs.length,
        features,
        lastSync: metadata?.last_sync_timestamp || null,
        nextRetry: this.calculateNextRetry(),
      };

      // Check if changed
      if (this.statusChanged(newStatus)) {
        this.currentStatus = newStatus;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[OfflineService] Error updating status:', error);
    }
  }

  /**
   * Determine which features are available offline
   */
  private determineOfflineFeatures(
    isOnline: boolean,
    pendingCount: number
  ): OfflineFeatures {
    return {
      canPractice: true, // Always available offline
      canViewReadings: true, // With cached readings
      canViewResults: true, // From local database
      canSeeStats: true, // Offline stats available
      canUpgrade: isOnline, // Requires network for payment
      canSyncNow: true, // Can queue sync anytime
    };
  }

  /**
   * Get connection status value
   */
  private getConnectionStatusValue(): ConnectionStatus {
    if (!NetworkStatusService.isOnline()) {
      return 'offline';
    }

    const isReachable = NetworkStatusService.isInternetReachable();
    if (isReachable === false) {
      return 'slow';
    }

    return 'online';
  }

  /**
   * Calculate next retry time
   */
  private calculateNextRetry(): number | null {
    const failedSyncs = syncService.getFailedSyncs?.() || [];
    if (failedSyncs.length === 0) {
      return null;
    }

    // Exponential backoff based on highest retry count
    const maxRetryCount = Math.max(
      ...failedSyncs.map((e) => e.retryCount),
      0
    );
    const backoffMs = Math.min(
      1000 * Math.pow(2, maxRetryCount),
      30000
    );

    return Date.now() + backoffMs;
  }

  /**
   * Check if status has changed
   */
  private statusChanged(newStatus: OfflineStatus): boolean {
    return (
      newStatus.isOnline !== this.currentStatus.isOnline ||
      newStatus.isSyncing !== this.currentStatus.isSyncing ||
      newStatus.pendingCount !== this.currentStatus.pendingCount ||
      newStatus.failedCount !== this.currentStatus.failedCount ||
      newStatus.connectionStatus !== this.currentStatus.connectionStatus
    );
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('[OfflineService] Listener error:', error);
      }
    });
  }

  /**
   * Handle network change
   */
  private async onNetworkChange(state: any): Promise<void> {
    console.log('[OfflineService] Network changed:', state.status);
    await this.updateStatus();
  }

  /**
   * Handle sync event
   */
  private async onSyncEvent(event: any): Promise<void> {
    console.log('[OfflineService] Sync event:', event.type);
    await this.updateStatus();
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
