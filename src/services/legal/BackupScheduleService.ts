/**
 * Backup Schedule Service
 *
 * Manages automatic backup scheduling
 * - Enable/disable auto backups
 * - Schedule monthly backups
 * - Check if backup is due
 * - Trigger manual backups
 * - Track backup schedule status
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import BackupService from './BackupService';
import CloudBackupService, { BackupScheduleStatus } from './CloudBackupService';

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRunTime?: number;
  nextRunTime?: number;
  retryCount?: number;
  maxRetries?: number;
}

class BackupScheduleService {
  private static readonly SCHEDULE_CONFIG_KEY = '@legal_backup_schedule_config';
  private static readonly LAST_BACKUP_KEY = '@legal_last_backup_time';
  private static readonly AUTO_BACKUP_ENABLED_KEY = '@legal_auto_backup_enabled';

  /**
   * Enable/disable auto backups
   */
  static async setAutoBackupEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.AUTO_BACKUP_ENABLED_KEY, JSON.stringify(enabled));
      console.log(`[BackupScheduleService] Auto backup ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('[BackupScheduleService] Failed to set auto backup:', error);
    }
  }

  /**
   * Check if auto backups are enabled
   */
  static async isAutoBackupEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.AUTO_BACKUP_ENABLED_KEY);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('[BackupScheduleService] Failed to check auto backup:', error);
      return false;
    }
  }

  /**
   * Get schedule status
   */
  static async getScheduleStatus(): Promise<BackupScheduleStatus> {
    try {
      const configJson = await AsyncStorage.getItem(this.SCHEDULE_CONFIG_KEY);
      if (!configJson) {
        return {
          enabled: false,
          frequency: 'monthly',
          isOnline: true,
        };
      }

      const config: ScheduleConfig = JSON.parse(configJson);
      return {
        enabled: config.enabled,
        frequency: config.frequency,
        lastRun: config.lastRunTime,
        nextRun: config.nextRunTime,
        isOnline: true,
      };
    } catch (error) {
      console.error('[BackupScheduleService] Failed to get schedule status:', error);
      return {
        enabled: false,
        frequency: 'monthly',
        isOnline: true,
      };
    }
  }

  /**
   * Initialize monthly backup schedule
   */
  static async initializeMonthlySchedule(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(this.SCHEDULE_CONFIG_KEY);
      if (existing) {
        return; // Already configured
      }

      const config: ScheduleConfig = {
        enabled: true,
        frequency: 'monthly',
        lastRunTime: Date.now(),
        nextRunTime: this.calculateNextRunTime(Date.now(), 'monthly'),
        maxRetries: 3,
        retryCount: 0,
      };

      await AsyncStorage.setItem(this.SCHEDULE_CONFIG_KEY, JSON.stringify(config));
      await this.setAutoBackupEnabled(true);

      console.log('[BackupScheduleService] Monthly backup schedule initialized');
    } catch (error) {
      console.error('[BackupScheduleService] Failed to initialize schedule:', error);
    }
  }

  /**
   * Check and run scheduled backup if due
   */
  static async checkAndRunScheduledBackup(): Promise<boolean> {
    try {
      const enabled = await this.isAutoBackupEnabled();
      if (!enabled) {
        console.log('[BackupScheduleService] Auto backup is disabled');
        return false;
      }

      const configJson = await AsyncStorage.getItem(this.SCHEDULE_CONFIG_KEY);
      if (!configJson) {
        return false;
      }

      const config: ScheduleConfig = JSON.parse(configJson);
      if (!config.enabled) {
        return false;
      }

      const now = Date.now();
      if (config.nextRunTime && now < config.nextRunTime) {
        console.log('[BackupScheduleService] Backup not due yet');
        return false;
      }

      console.log('[BackupScheduleService] Running scheduled backup...');

      // Create local backup
      const backup = await BackupService.createLocalBackup();
      if (!backup) {
        console.warn('[BackupScheduleService] Failed to create backup');
        config.retryCount = (config.retryCount || 0) + 1;
        await AsyncStorage.setItem(this.SCHEDULE_CONFIG_KEY, JSON.stringify(config));
        return false;
      }

      // Try to upload to cloud
      const cloudBackup = await CloudBackupService.uploadBackup(backup);

      // Update schedule regardless of cloud upload success
      config.lastRunTime = Date.now();
      config.nextRunTime = this.calculateNextRunTime(Date.now(), config.frequency);
      config.retryCount = 0;
      await AsyncStorage.setItem(this.SCHEDULE_CONFIG_KEY, JSON.stringify(config));

      // Update last backup time
      await AsyncStorage.setItem(this.LAST_BACKUP_KEY, JSON.stringify(Date.now()));

      console.log('[BackupScheduleService] Scheduled backup completed');
      return true;
    } catch (error) {
      console.error('[BackupScheduleService] Scheduled backup failed:', error);
      return false;
    }
  }

  /**
   * Trigger manual backup now
   */
  static async triggerBackupNow(): Promise<boolean> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[BackupScheduleService] No user for manual backup');
        return false;
      }

      console.log('[BackupScheduleService] Manual backup triggered...');

      // Create local backup
      const backup = await BackupService.createLocalBackup();
      if (!backup) {
        console.error('[BackupScheduleService] Failed to create backup');
        return false;
      }

      // Try to upload to cloud (non-blocking)
      CloudBackupService.uploadBackup(backup)
        .then((cloudBackup) => {
          if (cloudBackup) {
            console.log('[BackupScheduleService] Backup uploaded to cloud');
          } else {
            console.warn('[BackupScheduleService] Cloud upload failed, backup saved locally');
          }
        })
        .catch((error) => {
          console.warn('[BackupScheduleService] Cloud upload error:', error);
        });

      // Update last backup time
      await AsyncStorage.setItem(this.LAST_BACKUP_KEY, JSON.stringify(Date.now()));

      console.log('[BackupScheduleService] Manual backup completed');
      return true;
    } catch (error) {
      console.error('[BackupScheduleService] Manual backup failed:', error);
      return false;
    }
  }

  /**
   * Get time of last backup
   */
  static async getLastBackupTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_BACKUP_KEY);
      if (!timestamp) {
        return null;
      }

      return new Date(JSON.parse(timestamp));
    } catch (error) {
      console.error('[BackupScheduleService] Failed to get last backup time:', error);
      return null;
    }
  }

  /**
   * Get next backup time
   */
  static async getNextBackupTime(): Promise<Date | null> {
    try {
      const configJson = await AsyncStorage.getItem(this.SCHEDULE_CONFIG_KEY);
      if (!configJson) {
        return null;
      }

      const config: ScheduleConfig = JSON.parse(configJson);
      if (!config.nextRunTime) {
        return null;
      }

      return new Date(config.nextRunTime);
    } catch (error) {
      console.error('[BackupScheduleService] Failed to get next backup time:', error);
      return null;
    }
  }

  /**
   * Disable schedule and clear config
   */
  static async clearSchedule(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SCHEDULE_CONFIG_KEY);
      await this.setAutoBackupEnabled(false);
      console.log('[BackupScheduleService] Schedule cleared');
    } catch (error) {
      console.error('[BackupScheduleService] Failed to clear schedule:', error);
    }
  }

  /**
   * Check if backup is overdue
   */
  static async isBackupOverdue(): Promise<boolean> {
    try {
      const nextTime = await this.getNextBackupTime();
      if (!nextTime) {
        return false;
      }

      return Date.now() > nextTime.getTime();
    } catch (error) {
      console.error('[BackupScheduleService] Failed to check overdue:', error);
      return false;
    }
  }

  /**
   * Get days until next backup
   */
  static async getDaysUntilNextBackup(): Promise<number> {
    try {
      const nextTime = await this.getNextBackupTime();
      if (!nextTime) {
        return -1; // Schedule not set
      }

      const daysMs = nextTime.getTime() - Date.now();
      const days = Math.ceil(daysMs / (24 * 60 * 60 * 1000));

      return Math.max(0, days);
    } catch (error) {
      console.error('[BackupScheduleService] Failed to get days:', error);
      return -1;
    }
  }

  /**
   * Retry failed backup
   */
  static async retryFailedBackup(): Promise<boolean> {
    try {
      const configJson = await AsyncStorage.getItem(this.SCHEDULE_CONFIG_KEY);
      if (!configJson) {
        return false;
      }

      const config: ScheduleConfig = JSON.parse(configJson);

      if (!config.maxRetries || config.retryCount! >= config.maxRetries) {
        console.warn('[BackupScheduleService] Max retries exceeded');
        return false;
      }

      console.log(
        `[BackupScheduleService] Retrying backup (${config.retryCount || 0}/${config.maxRetries})`
      );

      return await this.triggerBackupNow();
    } catch (error) {
      console.error('[BackupScheduleService] Retry failed:', error);
      return false;
    }
  }

  /**
   * Set custom frequency
   */
  static async setFrequency(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const configJson = await AsyncStorage.getItem(this.SCHEDULE_CONFIG_KEY);
      const config: ScheduleConfig = configJson
        ? JSON.parse(configJson)
        : {
            enabled: true,
            frequency: 'monthly',
            maxRetries: 3,
          };

      config.frequency = frequency;
      config.nextRunTime = this.calculateNextRunTime(Date.now(), frequency);

      await AsyncStorage.setItem(this.SCHEDULE_CONFIG_KEY, JSON.stringify(config));
      console.log(`[BackupScheduleService] Frequency set to: ${frequency}`);
    } catch (error) {
      console.error('[BackupScheduleService] Failed to set frequency:', error);
    }
  }

  // ====== Private Helpers ======

  /**
   * Calculate next run time based on frequency
   */
  private static calculateNextRunTime(
    fromTime: number,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): number {
    const dayInMs = 24 * 60 * 60 * 1000;

    switch (frequency) {
      case 'daily':
        return fromTime + dayInMs;
      case 'weekly':
        return fromTime + 7 * dayInMs;
      case 'monthly':
      default:
        return fromTime + 30 * dayInMs;
    }
  }
}

export default BackupScheduleService;
