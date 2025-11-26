/**
 * Sync Queue Service
 * Manages offline operations that need to sync when online
 * Queues changes made offline and syncs them when connectivity is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseSyncService, SyncError } from '@/services/offline/FirebaseSyncService';

export type SyncOperationType = 'sync_settings' | 'sync_progress' | 'record_reading';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  timestamp: number;
  data: any;
  retryCount: number;
  lastError?: string;
  lastRetryTime?: number;
  nextRetryTime?: number;
}

export interface SyncResult {
  succeeded: number;
  failed: number;
  pending: number;
  errors: string[];
}

/**
 * Service for managing offline sync queue
 */
export class SyncQueueService {
  private static readonly QUEUE_PREFIX = '@sync_queue_';
  private static readonly QUEUE_INDEX_KEY = '@sync_queue_index';
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRY_DELAY = 60000; // 60 seconds

  /**
   * Add operation to sync queue
   */
  static async addToQueue(operation: Omit<SyncOperation, 'id' | 'retryCount'>): Promise<string> {
    try {
      const id = `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const fullOperation: SyncOperation = {
        ...operation,
        id,
        retryCount: 0,
      };

      // Store operation
      await AsyncStorage.setItem(
        `${this.QUEUE_PREFIX}${id}`,
        JSON.stringify(fullOperation)
      );

      // Update index
      await this.addToIndex(id, operation.type);

      console.log(`[SyncQueueService] Added operation to queue: ${id}`);

      return id;
    } catch (error) {
      console.error('[SyncQueueService] Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Get all queued operations
   */
  static async getQueuedOperations(): Promise<SyncOperation[]> {
    try {
      const indexJson = await AsyncStorage.getItem(this.QUEUE_INDEX_KEY);
      if (!indexJson) {
        return [];
      }

      const index = JSON.parse(indexJson) as Record<string, string>;
      const operations: SyncOperation[] = [];

      for (const [id] of Object.entries(index)) {
        const opJson = await AsyncStorage.getItem(`${this.QUEUE_PREFIX}${id}`);
        if (opJson) {
          operations.push(JSON.parse(opJson));
        }
      }

      return operations.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('[SyncQueueService] Error getting queued operations:', error);
      return [];
    }
  }

  /**
   * Get queue size
   */
  static async getQueueSize(): Promise<number> {
    try {
      const operations = await this.getQueuedOperations();
      return operations.length;
    } catch (error) {
      console.error('[SyncQueueService] Error getting queue size:', error);
      return 0;
    }
  }

  /**
   * Calculate exponential backoff delay for retry
   */
  private static calculateBackoffDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s (capped at MAX_RETRY_DELAY)
    const delay = this.BASE_RETRY_DELAY * Math.pow(2, Math.min(retryCount - 1, 3));
    return Math.min(delay, this.MAX_RETRY_DELAY);
  }

  /**
   * Check if operation is ready to retry based on backoff delay
   */
  private static isReadyToRetry(operation: SyncOperation): boolean {
    if (operation.retryCount === 0) {
      return true; // First attempt, ready to go
    }

    if (!operation.nextRetryTime) {
      return true; // Legacy operation without retry time tracking
    }

    const now = Date.now();
    return now >= operation.nextRetryTime;
  }

  /**
   * Process queue and sync all pending operations
   */
  static async processQueue(): Promise<SyncResult> {
    try {
      console.log('[SyncQueueService] Processing sync queue...');

      const operations = await this.getQueuedOperations();

      if (operations.length === 0) {
        console.log('[SyncQueueService] Queue is empty');
        return { succeeded: 0, failed: 0, pending: 0, errors: [] };
      }

      const result: SyncResult = {
        succeeded: 0,
        failed: 0,
        pending: operations.length,
        errors: [],
      };

      // Separate operations by retry readiness
      const readyOperations = operations.filter(op => this.isReadyToRetry(op));
      const waitingOperations = operations.filter(op => !this.isReadyToRetry(op));

      if (waitingOperations.length > 0) {
        console.log(
          `[SyncQueueService] ${waitingOperations.length} operation(s) waiting for retry backoff delay`
        );
      }

      for (const operation of readyOperations) {
        try {
          const success = await this.executeOperation(operation);

          if (success) {
            await this.removeFromQueue(operation.id);
            result.succeeded++;
            result.pending--;
            console.log(`[SyncQueueService] ✅ Synced: ${operation.id}`);
          } else {
            result.failed++;
            console.warn(`[SyncQueueService] ❌ Failed: ${operation.id}`);

            // Check retry count
            if (operation.retryCount >= this.MAX_RETRIES) {
              await this.removeFromQueue(operation.id);
              result.errors.push(`${operation.id}: Max retries exceeded`);
              console.error(`[SyncQueueService] Removing operation after ${this.MAX_RETRIES} retries: ${operation.id}`);
            } else {
              // Increment retry count with backoff delay
              await this.incrementRetryCountWithBackoff(operation.id);
              console.warn(`[SyncQueueService] Queued for retry (attempt ${operation.retryCount + 1}): ${operation.id}`);
            }
          }
        } catch (error) {
          result.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`${operation.id}: ${errorMsg}`);
          console.error(`[SyncQueueService] Exception syncing ${operation.id}:`, error);
        }
      }

      console.log('[SyncQueueService] Queue processing complete:', result);
      return result;
    } catch (error) {
      console.error('[SyncQueueService] Error processing queue:', error);
      return { succeeded: 0, failed: 0, pending: 0, errors: ['Queue processing failed'] };
    }
  }

  /**
   * Retry specific operation
   */
  static async retryOperation(operationId: string): Promise<boolean> {
    try {
      const operation = await this.getOperation(operationId);
      if (!operation) {
        console.warn(`[SyncQueueService] Operation not found: ${operationId}`);
        return false;
      }

      // Check if operation is ready to retry (respects backoff delay)
      if (!this.isReadyToRetry(operation)) {
        const waitTime = Math.round(((operation.nextRetryTime || 0) - Date.now()) / 1000);
        console.warn(
          `[SyncQueueService] Operation ${operationId} not ready for retry yet. Waiting ${waitTime}s...`
        );
        return false;
      }

      const success = await this.executeOperation(operation);

      if (success) {
        await this.removeFromQueue(operationId);
        console.log(`[SyncQueueService] ✅ Retried successfully: ${operationId}`);
        return true;
      } else {
        await this.incrementRetryCountWithBackoff(operationId);
        console.warn(`[SyncQueueService] Retry failed: ${operationId}`);
        return false;
      }
    } catch (error) {
      console.error(`[SyncQueueService] Error retrying operation:`, error);
      return false;
    }
  }

  /**
   * Clear entire queue (use with caution)
   */
  static async clearQueue(): Promise<void> {
    try {
      const operations = await this.getQueuedOperations();

      for (const operation of operations) {
        await this.removeFromQueue(operation.id);
      }

      console.log('[SyncQueueService] Queue cleared');
    } catch (error) {
      console.error('[SyncQueueService] Error clearing queue:', error);
    }
  }

  /**
   * Remove specific operation from queue
   */
  static async removeFromQueue(operationId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.QUEUE_PREFIX}${operationId}`);
      await this.removeFromIndex(operationId);
      console.log(`[SyncQueueService] Removed from queue: ${operationId}`);
    } catch (error) {
      console.error('[SyncQueueService] Error removing from queue:', error);
    }
  }

  /**
   * Private: Execute a single operation
   */
  private static async executeOperation(operation: SyncOperation): Promise<boolean> {
    try {
      console.log(`[SyncQueueService] Executing operation: ${operation.type} (${operation.id})`);

      switch (operation.type) {
        case 'sync_settings':
          return await this.syncSettings(operation);
        case 'sync_progress':
          return await this.syncProgress(operation);
        case 'record_reading':
          return await this.recordReading(operation);
        default:
          console.warn(`[SyncQueueService] Unknown operation type: ${operation.type}`);
          return false;
      }
    } catch (error) {
      console.error(
        '[SyncQueueService] Error executing operation:',
        error instanceof Error ? error.message : error
      );
      return false;
    }
  }

  /**
   * Sync settings to Firestore (real implementation)
   */
  private static async syncSettings(operation: SyncOperation): Promise<boolean> {
    try {
      console.log('[SyncQueueService] Syncing settings to Firestore:', operation.data);

      const result = await FirebaseSyncService.syncSettingsToFirestore(operation.data);

      if (!result.success && result.error) {
        const error = result.error;

        // If auth error, operation cannot be retried - return false to remove from queue
        if (error.type === 'auth') {
          console.error('[SyncQueueService] 🔐 Auth error in syncSettings - removing from queue');
          return false;
        }

        // For retriable errors, return false to keep in queue for retry
        if (error.retriable) {
          console.warn(
            `[SyncQueueService] 🔄 Retriable ${error.type} error in syncSettings - will retry: ${error.message}`
          );
          return false;
        }

        // For non-retriable data errors, skip this operation
        if (error.type === 'data') {
          console.error('[SyncQueueService] ❌ Data error in syncSettings - skipping:', error.message);
          return false; // Remove from queue
        }
      }

      return result.success;
    } catch (error) {
      console.error('[SyncQueueService] ⚠️ Settings sync exception:', error);
      return false; // Retry on unexpected errors
    }
  }

  /**
   * Sync progress to Firestore (real implementation)
   */
  private static async syncProgress(operation: SyncOperation): Promise<boolean> {
    try {
      console.log('[SyncQueueService] Syncing progress to Firestore:', operation.data);

      const result = await FirebaseSyncService.syncProgressToFirestore(operation.data);

      if (!result.success && result.error) {
        const error = result.error;

        // If auth error, operation cannot be retried - return false to remove from queue
        if (error.type === 'auth') {
          console.error('[SyncQueueService] 🔐 Auth error in syncProgress - removing from queue');
          return false;
        }

        // For retriable errors, return false to keep in queue for retry
        if (error.retriable) {
          console.warn(
            `[SyncQueueService] 🔄 Retriable ${error.type} error in syncProgress - will retry: ${error.message}`
          );
          return false;
        }

        // For non-retriable data errors, skip this operation
        if (error.type === 'data') {
          console.error('[SyncQueueService] ❌ Data error in syncProgress - skipping:', error.message);
          return false; // Remove from queue
        }
      }

      return result.success;
    } catch (error) {
      console.error('[SyncQueueService] ⚠️ Progress sync exception:', error);
      return false; // Retry on unexpected errors
    }
  }

  /**
   * Record reading completion via Cloud Function (real implementation)
   */
  private static async recordReading(operation: SyncOperation): Promise<boolean> {
    try {
      console.log('[SyncQueueService] Recording reading via Cloud Function:', operation.data);

      const result = await FirebaseSyncService.recordReadingToCloud(operation.data);

      if (!result.success && result.error) {
        const error = result.error;

        // If auth error, operation cannot be retried - return false to remove from queue
        if (error.type === 'auth') {
          console.error('[SyncQueueService] 🔐 Auth error in recordReading - removing from queue');
          return false;
        }

        // For retriable errors, return false to keep in queue for retry
        if (error.retriable) {
          console.warn(
            `[SyncQueueService] 🔄 Retriable ${error.type} error in recordReading - will retry: ${error.message}`
          );
          return false;
        }

        // For non-retriable data errors, skip this operation
        if (error.type === 'data') {
          console.error('[SyncQueueService] ❌ Data error in recordReading - skipping:', error.message);
          return false; // Remove from queue
        }
      }

      return result.success;
    } catch (error) {
      console.error('[SyncQueueService] ⚠️ Record reading exception:', error);
      return false; // Retry on unexpected errors
    }
  }

  /**
   * Private: Get specific operation
   */
  private static async getOperation(operationId: string): Promise<SyncOperation | null> {
    try {
      const opJson = await AsyncStorage.getItem(`${this.QUEUE_PREFIX}${operationId}`);
      return opJson ? JSON.parse(opJson) : null;
    } catch (error) {
      console.error('[SyncQueueService] Error getting operation:', error);
      return null;
    }
  }

  /**
   * Private: Increment retry count with exponential backoff delay
   */
  private static async incrementRetryCountWithBackoff(operationId: string): Promise<void> {
    try {
      const operation = await this.getOperation(operationId);
      if (operation) {
        operation.retryCount++;
        operation.lastRetryTime = Date.now();
        operation.nextRetryTime = Date.now() + this.calculateBackoffDelay(operation.retryCount);
        operation.lastError = new Date().toISOString();

        const backoffSeconds = Math.round(this.calculateBackoffDelay(operation.retryCount) / 1000);
        console.log(
          `[SyncQueueService] Scheduled retry for ${operationId} in ${backoffSeconds}s (attempt ${operation.retryCount}/${this.MAX_RETRIES})`
        );

        await AsyncStorage.setItem(
          `${this.QUEUE_PREFIX}${operationId}`,
          JSON.stringify(operation)
        );
      }
    } catch (error) {
      console.error('[SyncQueueService] Error incrementing retry count:', error);
    }
  }

  /**
   * Private: Add operation ID to index
   */
  private static async addToIndex(operationId: string, type: SyncOperationType): Promise<void> {
    try {
      const indexJson = await AsyncStorage.getItem(this.QUEUE_INDEX_KEY);
      const index = indexJson ? JSON.parse(indexJson) : {};

      index[operationId] = type;

      await AsyncStorage.setItem(this.QUEUE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('[SyncQueueService] Error adding to index:', error);
    }
  }

  /**
   * Private: Remove operation ID from index
   */
  private static async removeFromIndex(operationId: string): Promise<void> {
    try {
      const indexJson = await AsyncStorage.getItem(this.QUEUE_INDEX_KEY);
      if (indexJson) {
        const index = JSON.parse(indexJson);
        delete index[operationId];
        await AsyncStorage.setItem(this.QUEUE_INDEX_KEY, JSON.stringify(index));
      }
    } catch (error) {
      console.error('[SyncQueueService] Error removing from index:', error);
    }
  }
}
