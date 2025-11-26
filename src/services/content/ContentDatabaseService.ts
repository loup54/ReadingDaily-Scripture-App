/**
 * Content Database Service
 * Phase 10D.1: Content Management
 *
 * Manages content database operations:
 * - Reading catalog storage
 * - Search and filtering
 * - Favorites management
 * - Content discovery
 *
 * Features:
 * - SQLite-backed content storage
 * - Full-text search support
 * - Intelligent caching
 * - Filtering by difficulty, language, date
 * - Favorites tracking
 */

import * as SQLite from 'expo-sqlite';
import { databaseService } from '@/services/database/DatabaseService';

export interface ContentReading {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'gospel' | 'first-reading' | 'psalm' | 'second-reading' | 'responsorial';
  reference: string;
  difficulty: number; // 1-5
  language: string;
  wordCount: number;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SearchFilters {
  query?: string;
  difficulty?: [number, number];
  language?: string;
  type?: string;
  isFavoriteOnly?: boolean;
  dateRange?: [string, string];
  limit?: number;
  offset?: number;
}

export interface ContentStats {
  totalReadings: number;
  totalFavorites: number;
  availableLanguages: string[];
  dateRange: [string, string] | null;
  averageDifficulty: number;
}

class ContentDatabaseService {
  private db: SQLite.Database | null = null;
  private isInitialized = false;

  /**
   * Initialize content database
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[ContentDatabaseService] Already initialized');
        return;
      }

      // Open database (same as DatabaseService)
      this.db = await SQLite.openDatabaseAsync('readings.db');

      // Create tables
      await this.createTables();

      this.isInitialized = true;
      console.log('[ContentDatabaseService] Initialized');
    } catch (error) {
      console.error('[ContentDatabaseService] Initialization failed:', error);
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
   * Create content tables
   */
  private async createTables(): Promise<void> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      // Readings table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS readings (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          type TEXT,
          reference TEXT,
          difficulty INTEGER DEFAULT 3,
          language TEXT DEFAULT 'en',
          word_count INTEGER DEFAULT 0,
          is_favorite BOOLEAN DEFAULT 0,
          created_at BIGINT,
          updated_at BIGINT
        );

        CREATE INDEX IF NOT EXISTS idx_date ON readings(date);
        CREATE INDEX IF NOT EXISTS idx_type ON readings(type);
        CREATE INDEX IF NOT EXISTS idx_difficulty ON readings(difficulty);
        CREATE INDEX IF NOT EXISTS idx_language ON readings(language);
        CREATE INDEX IF NOT EXISTS idx_favorite ON readings(is_favorite);
      `);

      // Favorites table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS favorites (
          id TEXT PRIMARY KEY,
          reading_id TEXT NOT NULL UNIQUE,
          user_id TEXT,
          created_at BIGINT,
          FOREIGN KEY (reading_id) REFERENCES readings(id)
        );

        CREATE INDEX IF NOT EXISTS idx_reading_id ON favorites(reading_id);
        CREATE INDEX IF NOT EXISTS idx_user_id ON favorites(user_id);
      `);

      // Search history table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS search_history (
          id TEXT PRIMARY KEY,
          query TEXT NOT NULL,
          created_at BIGINT,
          results_count INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_created_at ON search_history(created_at);
      `);

      console.log('[ContentDatabaseService] Tables created');
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * Add reading to database
   */
  async addReading(reading: ContentReading): Promise<void> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      await this.db.runAsync(
        `INSERT OR REPLACE INTO readings
        (id, date, title, content, type, reference, difficulty, language, word_count, is_favorite, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.date,
          reading.title,
          reading.content,
          reading.type,
          reading.reference,
          reading.difficulty,
          reading.language,
          reading.wordCount,
          reading.isFavorite ? 1 : 0,
          reading.createdAt,
          reading.updatedAt,
        ]
      );

      console.log('[ContentDatabaseService] Added reading:', reading.id);
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to add reading:', error);
      throw error;
    }
  }

  /**
   * Batch add readings
   */
  async addReadings(readings: ContentReading[]): Promise<void> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      for (const reading of readings) {
        await this.addReading(reading);
      }

      console.log('[ContentDatabaseService] Added', readings.length, 'readings');
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to add readings:', error);
      throw error;
    }
  }

  /**
   * Search readings with filters
   */
  async searchReadings(filters: SearchFilters): Promise<ContentReading[]> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      let query = 'SELECT * FROM readings WHERE 1=1';
      const params: any[] = [];

      // Full-text search
      if (filters.query) {
        query += ' AND (title LIKE ? OR content LIKE ?)';
        const searchTerm = `%${filters.query}%`;
        params.push(searchTerm, searchTerm);
      }

      // Difficulty filter
      if (filters.difficulty) {
        const [min, max] = filters.difficulty;
        query += ' AND difficulty BETWEEN ? AND ?';
        params.push(min, max);
      }

      // Language filter
      if (filters.language) {
        query += ' AND language = ?';
        params.push(filters.language);
      }

      // Type filter
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      // Favorites only
      if (filters.isFavoriteOnly) {
        query += ' AND is_favorite = 1';
      }

      // Date range
      if (filters.dateRange) {
        const [from, to] = filters.dateRange;
        query += ' AND date BETWEEN ? AND ?';
        params.push(from, to);
      }

      // Order and limit
      query += ' ORDER BY date DESC';
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const results = await this.db.getAllAsync(query, params);

      return (results || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        title: row.title,
        content: row.content,
        type: row.type,
        reference: row.reference,
        difficulty: row.difficulty,
        language: row.language,
        wordCount: row.word_count,
        isFavorite: row.is_favorite === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('[ContentDatabaseService] Search failed:', error);
      return [];
    }
  }

  /**
   * Get reading by ID
   */
  async getReading(id: string): Promise<ContentReading | null> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      const result = await this.db.getFirstAsync(
        'SELECT * FROM readings WHERE id = ?',
        [id]
      );

      if (!result) return null;

      return {
        id: result.id,
        date: result.date,
        title: result.title,
        content: result.content,
        type: result.type,
        reference: result.reference,
        difficulty: result.difficulty,
        language: result.language,
        wordCount: result.word_count,
        isFavorite: result.is_favorite === 1,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to get reading:', error);
      return null;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(readingId: string, isFavorite: boolean): Promise<void> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      // Update reading
      await this.db.runAsync(
        'UPDATE readings SET is_favorite = ? WHERE id = ?',
        [isFavorite ? 1 : 0, readingId]
      );

      // Add/remove from favorites table
      if (isFavorite) {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO favorites (id, reading_id, created_at) VALUES (?, ?, ?)',
          [`fav_${readingId}`, readingId, Date.now()]
        );
      } else {
        await this.db.runAsync(
          'DELETE FROM favorites WHERE reading_id = ?',
          [readingId]
        );
      }

      console.log('[ContentDatabaseService] Toggled favorite:', readingId);
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to toggle favorite:', error);
      throw error;
    }
  }

  /**
   * Get favorites
   */
  async getFavorites(limit?: number): Promise<ContentReading[]> {
    try {
      return await this.searchReadings({ isFavoriteOnly: true, limit });
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to get favorites:', error);
      return [];
    }
  }

  /**
   * Get readings by date
   */
  async getReadingsByDate(date: string): Promise<ContentReading[]> {
    try {
      return await this.searchReadings({ dateRange: [date, date] });
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to get readings by date:', error);
      return [];
    }
  }

  /**
   * Get content statistics
   */
  async getStats(): Promise<ContentStats> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      const countResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorites FROM readings'
      );

      const languagesResult = await this.db.getAllAsync(
        'SELECT DISTINCT language FROM readings ORDER BY language'
      );

      const dateResult = await this.db.getFirstAsync(
        'SELECT MIN(date) as min_date, MAX(date) as max_date FROM readings'
      );

      const difficultyResult = await this.db.getFirstAsync(
        'SELECT AVG(difficulty) as avg_difficulty FROM readings'
      );

      return {
        totalReadings: countResult?.total || 0,
        totalFavorites: countResult?.favorites || 0,
        availableLanguages: (languagesResult || []).map((r: any) => r.language),
        dateRange:
          dateResult?.min_date && dateResult?.max_date
            ? [dateResult.min_date, dateResult.max_date]
            : null,
        averageDifficulty: Math.round((difficultyResult?.avg_difficulty || 3) * 10) / 10,
      };
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to get stats:', error);
      return {
        totalReadings: 0,
        totalFavorites: 0,
        availableLanguages: [],
        dateRange: null,
        averageDifficulty: 0,
      };
    }
  }

  /**
   * Clear all readings
   */
  async clearAll(): Promise<void> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      await this.db.runAsync('DELETE FROM readings');
      await this.db.runAsync('DELETE FROM favorites');
      await this.db.runAsync('DELETE FROM search_history');

      console.log('[ContentDatabaseService] Cleared all content');
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to clear:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        this.isInitialized = false;
        console.log('[ContentDatabaseService] Closed');
      }
    } catch (error) {
      console.error('[ContentDatabaseService] Failed to close:', error);
      throw error;
    }
  }
}

// Export singleton
export const contentDatabaseService = new ContentDatabaseService();
