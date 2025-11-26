/**
 * SQLite Database Service
 * Phase 10A.1: Offline Support & Sync
 *
 * Manages local SQLite database for offline support.
 * Provides tables for:
 * - Practice sessions (local cache)
 * - Sync queue (pending updates)
 * - Readings cache (cached content)
 * - Sync metadata (sync tracking)
 */

import * as SQLite from 'expo-sqlite';
import { PracticeSession } from '@/types/practice.types';

export interface SyncQueueItem {
  id: string;
  operation_type: 'create' | 'update' | 'delete';
  entity_type: 'practice_session' | 'subscription' | 'profile' | 'favorite';
  entity_id: string;
  payload_json: string;
  created_at: number;
  retry_count: number;
  last_error: string | null;
}

export interface CachedReading {
  id: string;
  title: string;
  content: string;
  language: string;
  difficulty: number;
  word_count: number;
  cached_at: number;
  version: number;
}

export interface SyncMetadata {
  key: string;
  last_sync_timestamp: number | null;
  pending_count: number;
  last_error: string | null;
}

export class DatabaseService {
  private db: SQLite.Database | null = null;
  private isInitialized = false;

  /**
   * Initialize database and create tables
   */
  async initialize(): Promise<void> {
    try {
      console.log('[DatabaseService] Initializing SQLite database');

      // Open database
      this.db = await SQLite.openDatabaseAsync('readingdaily.db');
      console.log('[DatabaseService] Database opened');

      // Create tables
      await this.createTables();
      this.isInitialized = true;

      console.log('[DatabaseService] Database initialized successfully');
    } catch (error) {
      console.error('[DatabaseService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create all required tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Practice sessions table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS practice_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          reading_id TEXT NOT NULL,
          recording_uri TEXT,
          result_json TEXT,
          timestamp BIGINT NOT NULL,
          synced BOOLEAN DEFAULT 0,
          sync_error TEXT,
          created_at BIGINT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('[DatabaseService] practice_sessions table created');

      // Sync queue table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          operation_type TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          created_at BIGINT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT
        );
      `);

      console.log('[DatabaseService] sync_queue table created');

      // Readings cache table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS readings_cache (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          language TEXT DEFAULT 'en',
          difficulty INTEGER,
          word_count INTEGER,
          cached_at BIGINT NOT NULL,
          version INTEGER DEFAULT 1
        );
      `);

      console.log('[DatabaseService] readings_cache table created');

      // Sync metadata table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          last_sync_timestamp BIGINT,
          pending_count INTEGER DEFAULT 0,
          last_error TEXT
        );
      `);

      console.log('[DatabaseService] sync_metadata table created');

      // Create indexes for better performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id
        ON practice_sessions(user_id);

        CREATE INDEX IF NOT EXISTS idx_practice_sessions_synced
        ON practice_sessions(synced);

        CREATE INDEX IF NOT EXISTS idx_practice_sessions_timestamp
        ON practice_sessions(timestamp);

        CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_type
        ON sync_queue(entity_type);

        CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at
        ON sync_queue(created_at);

        CREATE INDEX IF NOT EXISTS idx_readings_cache_language
        ON readings_cache(language);
      `);

      console.log('[DatabaseService] Indexes created');
    } catch (error) {
      console.error('[DatabaseService] Table creation failed:', error);
      throw error;
    }
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * ==================== PRACTICE SESSIONS ====================
   */

  /**
   * Save practice session locally
   */
  async savePracticeSession(
    session: Partial<PracticeSession> & { id: string; user_id: string; reading_id: string }
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const resultJson = session.result ? JSON.stringify(session.result) : null;

      await this.db.runAsync(
        `INSERT INTO practice_sessions (id, user_id, reading_id, recording_uri, result_json, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          session.id,
          session.user_id,
          session.reading_id,
          session.recordingUri || null,
          resultJson,
          session.timestamp || Date.now(),
        ]
      );

      console.log('[DatabaseService] Practice session saved:', session.id);
    } catch (error) {
      console.error('[DatabaseService] Failed to save practice session:', error);
      throw error;
    }
  }

  /**
   * Get all unsynced practice sessions
   */
  async getUnsyncedSessions(): Promise<PracticeSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM practice_sessions WHERE synced = 0 ORDER BY timestamp DESC'
      );

      return rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        reading_id: row.reading_id,
        recordingUri: row.recording_uri,
        result: row.result_json ? JSON.parse(row.result_json) : null,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error('[DatabaseService] Failed to get unsynced sessions:', error);
      throw error;
    }
  }

  /**
   * Mark session as synced
   */
  async markSessionSynced(sessionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('UPDATE practice_sessions SET synced = 1, sync_error = NULL WHERE id = ?', [
        sessionId,
      ]);

      console.log('[DatabaseService] Session marked as synced:', sessionId);
    } catch (error) {
      console.error('[DatabaseService] Failed to mark session as synced:', error);
      throw error;
    }
  }

  /**
   * Mark session with sync error
   */
  async markSessionSyncError(sessionId: string, error: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('UPDATE practice_sessions SET sync_error = ? WHERE id = ?', [error, sessionId]);

      console.log('[DatabaseService] Session sync error recorded:', sessionId);
    } catch (error) {
      console.error('[DatabaseService] Failed to mark sync error:', error);
      throw error;
    }
  }

  /**
   * Get practice sessions for user
   */
  async getUserSessions(userId: string, limit = 50): Promise<PracticeSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM practice_sessions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit]
      );

      return rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        reading_id: row.reading_id,
        recordingUri: row.recording_uri,
        result: row.result_json ? JSON.parse(row.result_json) : null,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.error('[DatabaseService] Failed to get user sessions:', error);
      throw error;
    }
  }

  /**
   * ==================== SYNC QUEUE ====================
   */

  /**
   * Add item to sync queue
   */
  async queueAction(item: Omit<SyncQueueItem, 'created_at'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO sync_queue (id, operation_type, entity_type, entity_id, payload_json, created_at, retry_count)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.operation_type,
          item.entity_type,
          item.entity_id,
          item.payload_json,
          Date.now(),
          item.retry_count || 0,
        ]
      );

      // Update metadata
      await this.incrementPendingCount();

      console.log('[DatabaseService] Action queued:', item.id);
    } catch (error) {
      console.error('[DatabaseService] Failed to queue action:', error);
      throw error;
    }
  }

  /**
   * Get all queued actions
   */
  async getQueuedActions(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM sync_queue ORDER BY created_at ASC'
      );

      return rows;
    } catch (error) {
      console.error('[DatabaseService] Failed to get queued actions:', error);
      throw error;
    }
  }

  /**
   * Remove action from queue
   */
  async removeQueuedAction(actionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [actionId]);

      // Update metadata
      await this.decrementPendingCount();

      console.log('[DatabaseService] Action removed from queue:', actionId);
    } catch (error) {
      console.error('[DatabaseService] Failed to remove queued action:', error);
      throw error;
    }
  }

  /**
   * Update retry count for failed action
   */
  async incrementRetryCount(actionId: string, error: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
        [error, actionId]
      );

      console.log('[DatabaseService] Retry count incremented:', actionId);
    } catch (error) {
      console.error('[DatabaseService] Failed to increment retry count:', error);
      throw error;
    }
  }

  /**
   * ==================== READINGS CACHE ====================
   */

  /**
   * Cache readings
   */
  async cacheReadings(readings: CachedReading[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      for (const reading of readings) {
        await this.db.runAsync(
          `INSERT OR REPLACE INTO readings_cache (id, title, content, language, difficulty, word_count, cached_at, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reading.id,
            reading.title,
            reading.content,
            reading.language,
            reading.difficulty,
            reading.word_count,
            reading.cached_at,
            reading.version,
          ]
        );
      }

      console.log('[DatabaseService] Cached readings:', readings.length);
    } catch (error) {
      console.error('[DatabaseService] Failed to cache readings:', error);
      throw error;
    }
  }

  /**
   * Get cached reading
   */
  async getCachedReading(readingId: string): Promise<CachedReading | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const row = await this.db.getFirstAsync<any>(
        'SELECT * FROM readings_cache WHERE id = ?',
        [readingId]
      );

      return row || null;
    } catch (error) {
      console.error('[DatabaseService] Failed to get cached reading:', error);
      throw error;
    }
  }

  /**
   * Get all cached readings
   */
  async getCachedReadings(): Promise<CachedReading[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM readings_cache ORDER BY cached_at DESC'
      );

      return rows;
    } catch (error) {
      console.error('[DatabaseService] Failed to get cached readings:', error);
      throw error;
    }
  }

  /**
   * Clear expired readings cache (older than 7 days)
   */
  async clearExpiredReadings(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const result = await this.db.runAsync(
        'DELETE FROM readings_cache WHERE cached_at < ?',
        [sevenDaysAgo]
      );

      console.log('[DatabaseService] Expired readings cleared:', result.changes);
      return result.changes || 0;
    } catch (error) {
      console.error('[DatabaseService] Failed to clear expired readings:', error);
      throw error;
    }
  }

  /**
   * ==================== SYNC METADATA ====================
   */

  /**
   * Get sync metadata
   */
  async getSyncMetadata(key: string): Promise<SyncMetadata | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const row = await this.db.getFirstAsync<any>(
        'SELECT * FROM sync_metadata WHERE key = ?',
        [key]
      );

      return row || null;
    } catch (error) {
      console.error('[DatabaseService] Failed to get sync metadata:', error);
      throw error;
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSyncTime(timestamp: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const existing = await this.getSyncMetadata('last_sync');

      if (existing) {
        await this.db.runAsync(
          'UPDATE sync_metadata SET last_sync_timestamp = ? WHERE key = ?',
          [timestamp, 'last_sync']
        );
      } else {
        await this.db.runAsync(
          'INSERT INTO sync_metadata (key, last_sync_timestamp, pending_count) VALUES (?, ?, ?)',
          ['last_sync', timestamp, 0]
        );
      }

      console.log('[DatabaseService] Last sync time updated');
    } catch (error) {
      console.error('[DatabaseService] Failed to update last sync time:', error);
      throw error;
    }
  }

  /**
   * Get pending count
   */
  async getPendingCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const row = await this.db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM sync_queue'
      );

      return row?.count || 0;
    } catch (error) {
      console.error('[DatabaseService] Failed to get pending count:', error);
      throw error;
    }
  }

  /**
   * Increment pending count
   */
  private async incrementPendingCount(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const count = await this.getPendingCount();

      const existing = await this.getSyncMetadata('pending');
      if (existing) {
        await this.db.runAsync(
          'UPDATE sync_metadata SET pending_count = ? WHERE key = ?',
          [count, 'pending']
        );
      } else {
        await this.db.runAsync(
          'INSERT INTO sync_metadata (key, pending_count) VALUES (?, ?)',
          ['pending', count]
        );
      }
    } catch (error) {
      console.error('[DatabaseService] Failed to increment pending count:', error);
    }
  }

  /**
   * Decrement pending count
   */
  private async decrementPendingCount(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const count = Math.max(0, await this.getPendingCount());

      const existing = await this.getSyncMetadata('pending');
      if (existing) {
        await this.db.runAsync(
          'UPDATE sync_metadata SET pending_count = ? WHERE key = ?',
          [count - 1, 'pending']
        );
      }
    } catch (error) {
      console.error('[DatabaseService] Failed to decrement pending count:', error);
    }
  }

  /**
   * ==================== UTILITY ====================
   */

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    practice_sessions: number;
    queued_actions: number;
    cached_readings: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const sessions = await this.db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM practice_sessions'
      );
      const queued = await this.db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM sync_queue'
      );
      const readings = await this.db.getFirstAsync<any>(
        'SELECT COUNT(*) as count FROM readings_cache'
      );

      return {
        practice_sessions: sessions?.count || 0,
        queued_actions: queued?.count || 0,
        cached_readings: readings?.count || 0,
      };
    } catch (error) {
      console.error('[DatabaseService] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Clear all data (for testing)
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync(`
        DELETE FROM practice_sessions;
        DELETE FROM sync_queue;
        DELETE FROM readings_cache;
        DELETE FROM sync_metadata;
      `);

      console.log('[DatabaseService] All data cleared');
    } catch (error) {
      console.error('[DatabaseService] Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('[DatabaseService] Database closed');
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
