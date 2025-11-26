/**
 * Cache Types
 * Phase 10A: Offline Support & Sync
 *
 * Type definitions for caching and offline support
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // in bytes
  oldestEntry: number | null; // timestamp
  newestEntry: number | null; // timestamp
}

export interface OfflineFeatures {
  canPractice: boolean;
  canViewReadings: boolean;
  canViewResults: boolean;
  canSeeStats: boolean;
  canUpgrade: boolean;
  canSyncNow: boolean;
}

export type ConnectionStatus = 'online' | 'offline' | 'slow';

export interface SyncError {
  id: string;
  actionId: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
  lastError?: string;
}

export interface CacheConfig {
  maxSize: number; // max cache size in bytes
  ttl: number; // time to live in milliseconds
  autoCleanup: boolean;
  cleanupInterval: number; // milliseconds
}

export interface SyncQueueEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  progress: SyncProgress;
  error?: string;
}

export interface DatabaseStats {
  practice_sessions: number;
  queued_actions: number;
  cached_readings: number;
}

export interface ReadingFilterOptions {
  difficulty?: [number, number]; // min, max
  language?: string;
  categories?: string[];
  minWords?: number;
  maxWords?: number;
}
