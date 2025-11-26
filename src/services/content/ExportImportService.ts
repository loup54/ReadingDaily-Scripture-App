/**
 * Export/Import Service
 * Phase 10D.7: Data Export & Import
 *
 * Handles data export and import operations:
 * - Export readings to multiple formats
 * - Import readings from various formats
 * - Backup and restore functionality
 * - Data migration and conversion
 * - Metadata preservation
 *
 * Features:
 * - JSON export/import
 * - CSV export support
 * - Full backup/restore
 * - Selective export options
 * - Data validation
 */

import { contentDatabaseService, ContentReading, ContentStats } from './ContentDatabaseService';
import { favoritesService, FavoritesCollection } from './FavoritesService';
import { contentService } from './ContentService';

export interface ExportData {
  version: string;
  exportDate: string;
  format: 'json' | 'csv';
  dataType: 'full' | 'readings' | 'favorites' | 'custom';
  readings: ContentReading[];
  favorites?: FavoritesCollection[];
  stats?: ContentStats;
  metadata: {
    totalReadings: number;
    totalFavorites: number;
    readingTypes: string[];
    languages: string[];
    dateRange: [string, string] | null;
  };
}

export interface ImportOptions {
  overwrite: boolean;
  validateData: boolean;
  skipDuplicates: boolean;
  importFavorites: boolean;
}

export interface BackupInfo {
  id: string;
  name: string;
  createdAt: number;
  size: number;
  readingCount: number;
  favoriteCount: number;
  dataHash: string;
}

interface BackupMetadata {
  id: string;
  name: string;
  createdAt: number;
  size: number;
  readingCount: number;
  favoriteCount: number;
  dataHash: string;
  backupData: ExportData;
}

class ExportImportService {
  private isInitialized = false;
  private backups: Map<string, BackupMetadata> = new Map();
  private maxBackups = 10;
  private version = '1.0';

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      if (!contentService.isReady()) {
        await contentService.initialize();
      }
      if (!favoritesService.isReady()) {
        await favoritesService.initialize();
      }

      await this.loadBackups();
      this.isInitialized = true;
    } catch (error) {
      console.error('[ExportImportService] Initialization failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async exportToJSON(dataType: 'full' | 'readings' | 'favorites' = 'full'): Promise<string> {
    try {
      const readings = await contentDatabaseService.searchReadings({});
      const stats = await contentDatabaseService.getStats();
      const favorites = await favoritesService.getCollections();

      const metadata = {
        totalReadings: readings.length,
        totalFavorites: stats.totalFavorites,
        readingTypes: readings.length > 0 ? Array.from(new Set(readings.map((r) => r.type))) : [],
        languages: stats.availableLanguages,
        dateRange: stats.dateRange,
      };

      const exportData: ExportData = {
        version: this.version,
        exportDate: new Date().toISOString(),
        format: 'json',
        dataType,
        readings: dataType === 'favorites' ? [] : readings,
        favorites: dataType === 'readings' ? undefined : favorites,
        stats: dataType === 'full' ? stats : undefined,
        metadata,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[ExportImportService] Failed to export JSON:', error);
      throw error;
    }
  }

  async exportToCSV(dataType: 'readings' | 'favorites' = 'readings'): Promise<string> {
    try {
      let csvContent = '';

      if (dataType === 'readings') {
        const readings = await contentDatabaseService.searchReadings({});
        csvContent = this.convertReadingsToCSV(readings);
      } else {
        const favorites = await favoritesService.getAllFavorites();
        csvContent = this.convertReadingsToCSV(favorites);
      }

      return csvContent;
    } catch (error) {
      console.error('[ExportImportService] Failed to export CSV:', error);
      throw error;
    }
  }

  async importFromJSON(jsonData: string, options: Partial<ImportOptions> = {}): Promise<number> {
    try {
      const opts: ImportOptions = {
        overwrite: false,
        validateData: true,
        skipDuplicates: true,
        importFavorites: true,
        ...options,
      };

      const data: ExportData = JSON.parse(jsonData);

      if (opts.validateData && !this.validateExportData(data)) {
        throw new Error('Invalid export data format');
      }

      if (opts.overwrite) {
        await contentDatabaseService.clearAll();
      }

      let importedCount = 0;

      for (const reading of data.readings) {
        try {
          if (opts.skipDuplicates) {
            const existing = await contentDatabaseService.getReading(reading.id);
            if (existing) {
              continue;
            }
          }
          await contentDatabaseService.addReading(reading);
          importedCount++;
        } catch (error) {
          console.warn('[ExportImportService] Failed to import reading:', reading.id);
        }
      }

      if (opts.importFavorites && data.favorites) {
        for (const collection of data.favorites) {
          try {
            for (const readingId of collection.readingIds) {
              await favoritesService.addFavorite(readingId);
            }
          } catch (error) {
            console.warn('[ExportImportService] Failed to import collection:', collection.id);
          }
        }
      }

      return importedCount;
    } catch (error) {
      console.error('[ExportImportService] Failed to import JSON:', error);
      throw error;
    }
  }

  async createBackup(name: string): Promise<BackupInfo> {
    try {
      const jsonData = await this.exportToJSON('full');
      const dataHash = this.generateHash(jsonData);
      const size = new Blob([jsonData]).size;
      const exportData = JSON.parse(jsonData) as ExportData;

      const backupInfo: BackupInfo = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        createdAt: Date.now(),
        size,
        readingCount: exportData.metadata.totalReadings,
        favoriteCount: exportData.metadata.totalFavorites,
        dataHash,
      };

      const backupMetadata: BackupMetadata = {
        ...backupInfo,
        backupData: exportData,
      };

      this.backups.set(backupInfo.id, backupMetadata);

      if (this.backups.size > this.maxBackups) {
        const oldest = Array.from(this.backups.values()).sort((a, b) => a.createdAt - b.createdAt)[0];
        this.backups.delete(oldest.id);
      }

      return backupInfo;
    } catch (error) {
      console.error('[ExportImportService] Failed to create backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string, options: Partial<ImportOptions> = {}): Promise<number> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      const jsonData = JSON.stringify(backup.backupData);
      const imported = await this.importFromJSON(jsonData, {
        overwrite: true,
        validateData: true,
        skipDuplicates: false,
        importFavorites: true,
        ...options,
      });

      return imported;
    } catch (error) {
      console.error('[ExportImportService] Failed to restore backup:', error);
      throw error;
    }
  }

  async getBackups(): Promise<BackupInfo[]> {
    try {
      return Array.from(this.backups.values())
        .map((b) => ({
          id: b.id,
          name: b.name,
          createdAt: b.createdAt,
          size: b.size,
          readingCount: b.readingCount,
          favoriteCount: b.favoriteCount,
          dataHash: b.dataHash,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('[ExportImportService] Failed to get backups:', error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      this.backups.delete(backupId);
    } catch (error) {
      console.error('[ExportImportService] Failed to delete backup:', error);
      throw error;
    }
  }

  async exportSelectedReadings(readingIds: string[]): Promise<string> {
    try {
      const readings: ContentReading[] = [];
      for (const id of readingIds) {
        const reading = await contentDatabaseService.getReading(id);
        if (reading) {
          readings.push(reading);
        }
      }

      const exportData: ExportData = {
        version: this.version,
        exportDate: new Date().toISOString(),
        format: 'json',
        dataType: 'custom',
        readings,
        metadata: {
          totalReadings: readings.length,
          totalFavorites: 0,
          readingTypes: Array.from(new Set(readings.map((r) => r.type))),
          languages: Array.from(new Set(readings.map((r) => r.language))),
          dateRange: readings.length > 0
            ? [
              readings.map((r) => r.date).sort()[0],
              readings.map((r) => r.date).sort().pop()!,
            ]
            : null,
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('[ExportImportService] Failed to export selected:', error);
      throw error;
    }
  }

  async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    try {
      const backup = this.backups.get(backupId);
      if (!backup) return null;

      return {
        id: backup.id,
        name: backup.name,
        createdAt: backup.createdAt,
        size: backup.size,
        readingCount: backup.readingCount,
        favoriteCount: backup.favoriteCount,
        dataHash: backup.dataHash,
      };
    } catch (error) {
      console.error('[ExportImportService] Failed to get backup info:', error);
      return null;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.backups.clear();
      this.isInitialized = false;
    } catch (error) {
      console.error('[ExportImportService] Shutdown error:', error);
      throw error;
    }
  }

  private convertReadingsToCSV(readings: ContentReading[]): string {
    try {
      const headers = ['ID', 'Date', 'Title', 'Type', 'Reference', 'Difficulty', 'Language', 'Word Count', 'Is Favorite'];
      const rows = readings.map((r) => [
        r.id,
        r.date,
        `"${r.title}"`,
        r.type,
        r.reference,
        r.difficulty,
        r.language,
        r.wordCount,
        r.isFavorite ? 'Yes' : 'No',
      ]);

      const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
      return csvLines.join('\n');
    } catch (error) {
      console.error('[ExportImportService] Failed to convert to CSV:', error);
      return '';
    }
  }

  private validateExportData(data: any): boolean {
    try {
      if (!data.version || !data.exportDate || !data.format) {
        return false;
      }
      if (!Array.isArray(data.readings)) {
        return false;
      }
      if (!data.metadata || typeof data.metadata !== 'object') {
        return false;
      }
      return true;
    } catch (error) {
      console.error('[ExportImportService] Validation error:', error);
      return false;
    }
  }

  private generateHash(data: string): string {
    try {
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      console.error('[ExportImportService] Hash generation error:', error);
      return 'error';
    }
  }

  private async loadBackups(): Promise<void> {
    try {
      this.backups = new Map();
    } catch (error) {
      console.error('[ExportImportService] Failed to load backups:', error);
      this.backups = new Map();
    }
  }
}

export const exportImportService = new ExportImportService();
