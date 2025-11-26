/**
 * Storage Service
 * Persistent caching using React Native AsyncStorage
 *
 * Features:
 * - Persistent cache across app sessions
 * - Automatic cleanup of old entries
 * - Size management
 * - Error handling
 *
 * @example
 * // Basic usage
 * await storageService.set('key', data);
 * const data = await storageService.get('key');
 *
 * // With options
 * await storageService.set('key', data, { ttl: 24 * 60 * 60 * 1000 });
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
}

interface StorageOptions {
  ttl?: number; // time-to-live in milliseconds
  encrypt?: boolean; // encrypt sensitive data
}

interface StorageStats {
  total: number;
  size: number;
  entries: string[];
}

const STORAGE_PREFIX = '@cache_';
const STORAGE_INDEX_KEY = '@cache_index';
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50 MB

export class StorageService {
  private index: Set<string> = new Set();
  private initialized = false;

  /**
   * Initialize storage (load index)
   */
  async initialize(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(STORAGE_INDEX_KEY);
      if (indexData) {
        this.index = new Set(JSON.parse(indexData));
      }
      this.initialized = true;
    } catch (err) {
      console.warn('Failed to initialize storage:', err);
      this.initialized = true;
    }
  }

  /**
   * Set a storage entry
   */
  async set<T = any>(
    key: string,
    data: T,
    options: StorageOptions = {}
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const ttl = options.ttl ?? 24 * 60 * 60 * 1000; // 24 hours default

      const entry: StorageEntry<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };

      const storageKey = `${STORAGE_PREFIX}${key}`;
      const jsonData = JSON.stringify(entry);

      // Check size before storing
      const size = new Blob([jsonData]).size;
      const currentSize = await this.getSize();

      if (currentSize + size > MAX_STORAGE_SIZE) {
        await this.cleanup();
      }

      await AsyncStorage.setItem(storageKey, jsonData);

      // Update index
      this.index.add(key);
      await this.saveIndex();
    } catch (err) {
      console.error('Failed to set storage item:', err);
      throw err;
    }
  }

  /**
   * Get a storage entry
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const jsonData = await AsyncStorage.getItem(storageKey);

      if (!jsonData) {
        return null;
      }

      const entry: StorageEntry<T> = JSON.parse(jsonData);

      // Check if expired
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch (err) {
      console.error('Failed to get storage item:', err);
      return null;
    }
  }

  /**
   * Check if key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Remove a storage entry
   */
  async remove(key: string): Promise<void> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      await AsyncStorage.removeItem(storageKey);
      this.index.delete(key);
      await this.saveIndex();
    } catch (err) {
      console.error('Failed to remove storage item:', err);
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      const keys = Array.from(this.index).map(k => `${STORAGE_PREFIX}${k}`);
      keys.push(STORAGE_INDEX_KEY);
      await AsyncStorage.multiRemove(keys);
      this.index.clear();
    } catch (err) {
      console.error('Failed to clear storage:', err);
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    try {
      let totalSize = 0;
      const entries: string[] = [];

      for (const key of this.index) {
        const storageKey = `${STORAGE_PREFIX}${key}`;
        const data = await AsyncStorage.getItem(storageKey);

        if (data) {
          totalSize += new Blob([data]).size;
          entries.push(key);
        }
      }

      return {
        total: this.index.size,
        size: totalSize,
        entries,
      };
    } catch (err) {
      console.error('Failed to get storage stats:', err);
      return { total: 0, size: 0, entries: [] };
    }
  }

  /**
   * Get total storage size in bytes
   */
  async getSize(): Promise<number> {
    const stats = await this.getStats();
    return stats.size;
  }

  /**
   * Get remaining storage space
   */
  async getRemainingSpace(): Promise<number> {
    const used = await this.getSize();
    return MAX_STORAGE_SIZE - used;
  }

  /**
   * Cleanup old/expired entries
   */
  async cleanup(): Promise<number> {
    let cleanedCount = 0;

    try {
      for (const key of Array.from(this.index)) {
        const storageKey = `${STORAGE_PREFIX}${key}`;
        const jsonData = await AsyncStorage.getItem(storageKey);

        if (!jsonData) {
          this.index.delete(key);
          cleanedCount++;
          continue;
        }

        try {
          const entry: StorageEntry = JSON.parse(jsonData);
          const age = Date.now() - entry.timestamp;

          // Remove if expired
          if (age > entry.ttl) {
            await AsyncStorage.removeItem(storageKey);
            this.index.delete(key);
            cleanedCount++;
          }
        } catch {
          // Remove corrupted entries
          await AsyncStorage.removeItem(storageKey);
          this.index.delete(key);
          cleanedCount++;
        }
      }

      await this.saveIndex();
    } catch (err) {
      console.error('Failed to cleanup storage:', err);
    }

    return cleanedCount;
  }

  /**
   * Get TTL remaining in milliseconds
   */
  async getTTL(key: string): Promise<number | null> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const jsonData = await AsyncStorage.getItem(storageKey);

      if (!jsonData) {
        return null;
      }

      const entry: StorageEntry = JSON.parse(jsonData);
      const age = Date.now() - entry.timestamp;
      const remaining = entry.ttl - age;

      return remaining > 0 ? remaining : null;
    } catch {
      return null;
    }
  }

  /**
   * Estimate available storage percentage
   */
  async getAvailablePercentage(): Promise<number> {
    const remaining = await this.getRemainingSpace();
    return (remaining / MAX_STORAGE_SIZE) * 100;
  }

  // Private methods

  /**
   * Save index to storage
   */
  private async saveIndex(): Promise<void> {
    try {
      const indexData = JSON.stringify(Array.from(this.index));
      await AsyncStorage.setItem(STORAGE_INDEX_KEY, indexData);
    } catch (err) {
      console.error('Failed to save index:', err);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

export type { StorageEntry, StorageOptions, StorageStats };
