/**
 * Cloud Backup Service
 *
 * Manages cloud backup to Firestore with encryption and versioning
 * - Upload backups to Firestore
 * - Download backups from cloud
 * - Backup versioning and history
 * - Automatic monthly backups
 * - Cleanup old backups (12-month retention)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import BackupService, { BackupFile, BackupVerification } from './BackupService';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

/**
 * Cloud backup representation
 */
export interface CloudBackup extends BackupFile {
  cloudId: string; // Firestore doc ID
  storageUrl: string; // Cloud Storage URL
  uploadedAt: number;
  lastDownloadedAt?: number;
  downloadCount: number;
}

/**
 * Backup version info
 */
export interface BackupVersion {
  id: string;
  cloudId: string;
  createdAt: number;
  uploadedAt: number;
  size: number;
  verified: boolean;
  platform: string;
  appVersion: string;
}

/**
 * Backup schedule status
 */
export interface BackupScheduleStatus {
  enabled: boolean;
  frequency: 'monthly' | 'weekly' | 'daily';
  lastRun?: number;
  nextRun?: number;
  isOnline: boolean;
}

class CloudBackupService {
  private static readonly CLOUD_BACKUPS_COLLECTION = 'backups';
  private static readonly BACKUP_SCHEDULE_KEY = '@legal_backup_schedule';
  private static readonly UPLOAD_RETRY_LIMIT = 3;
  private static readonly RETENTION_MONTHS = 12;

  /**
   * Upload backup to Firestore
   */
  static async uploadBackup(backup: BackupFile, password?: string): Promise<CloudBackup | null> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[CloudBackupService] No user ID for upload');
        return null;
      }

      // Get Firestore instance
      const db = getFirestore();

      // Read backup file content
      let content = await FileSystem.readAsStringAsync(backup.fileUri);

      // Create cloud backup record
      const cloudBackupData = {
        userId,
        backupId: backup.id,
        createdAt: Timestamp.fromDate(new Date(backup.createdAt)),
        uploadedAt: Timestamp.now(),
        version: backup.version,
        appVersion: backup.appVersion,
        size: backup.size,
        compressedSize: backup.compressedSize,
        encrypted: backup.encrypted,
        checksums: backup.checksums,
        verified: backup.verified,
        verifiedAt: backup.verifiedAt ? Timestamp.fromDate(new Date(backup.verifiedAt)) : null,
        contents: backup.contents,
        downloadCount: 0,
        fileContent: content, // Store content in Firestore
        contentHash: await this.hashData(content),
      };

      // Upload to Firestore
      const backupsRef = collection(db, this.CLOUD_BACKUPS_COLLECTION, userId, 'versions');
      const docRef = await addDoc(backupsRef, cloudBackupData);

      const cloudBackup: CloudBackup = {
        ...backup,
        cloudId: docRef.id,
        storageUrl: `firestore://${userId}/backups/versions/${docRef.id}`,
        uploadedAt: Date.now(),
        downloadCount: 0,
      };

      // Save cloud backup metadata locally
      await this.saveCloudBackupMetadata(cloudBackup);

      console.log(`[CloudBackupService] Backup uploaded: ${docRef.id}`);
      return cloudBackup;
    } catch (error) {
      console.error('[CloudBackupService] Upload failed:', error);
      return null;
    }
  }

  /**
   * Get all cloud backups for user
   */
  static async getCloudBackups(userId: string): Promise<CloudBackup[]> {
    try {
      const db = getFirestore();
      const backupsRef = collection(db, this.CLOUD_BACKUPS_COLLECTION, userId, 'versions');
      const q = query(backupsRef, orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);

      const backups: CloudBackup[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const cloudBackup: CloudBackup = {
          id: data.backupId,
          userId,
          cloudId: doc.id,
          createdAt: data.createdAt.toMillis(),
          uploadedAt: data.uploadedAt.toMillis(),
          version: data.version,
          appVersion: data.appVersion,
          size: data.size,
          compressedSize: data.compressedSize,
          encrypted: data.encrypted,
          fileUri: `firestore://${userId}/backups/versions/${doc.id}`,
          storageUrl: `firestore://${userId}/backups/versions/${doc.id}`,
          checksums: data.checksums,
          verified: data.verified,
          verifiedAt: data.verifiedAt?.toMillis(),
          contents: data.contents,
          lastDownloadedAt: data.lastDownloadedAt?.toMillis(),
          downloadCount: data.downloadCount || 0,
        };
        backups.push(cloudBackup);
      });

      return backups;
    } catch (error) {
      console.error('[CloudBackupService] Failed to get cloud backups:', error);
      return [];
    }
  }

  /**
   * Download backup from cloud
   */
  static async downloadBackup(
    backupId: string,
    userId: string,
    password?: string
  ): Promise<BackupFile | null> {
    try {
      const db = getFirestore();
      const backupRef = doc(db, this.CLOUD_BACKUPS_COLLECTION, userId, 'versions', backupId);
      const snapshot = await getDoc(backupRef);

      if (!snapshot.exists()) {
        console.warn('[CloudBackupService] Backup not found:', backupId);
        return null;
      }

      const data = snapshot.data();
      const content = data.fileContent;

      // Save to local file
      const timestamp = new Date().toISOString();
      const fileName = `backup-cloud-${timestamp.replace(/[:.]/g, '-')}.json`;
      const localPath = `${FileSystem.DocumentDirectory}legal-backups/${fileName}`;

      await FileSystem.writeAsStringAsync(localPath, content);

      // Update download count
      await updateDoc(backupRef, {
        lastDownloadedAt: Timestamp.now(),
        downloadCount: (data.downloadCount || 0) + 1,
      });

      const backup: BackupFile = {
        id: data.backupId,
        userId,
        createdAt: data.createdAt.toMillis(),
        version: data.version,
        appVersion: data.appVersion,
        size: data.size,
        compressedSize: data.compressedSize,
        encrypted: data.encrypted,
        fileUri: localPath,
        checksums: data.checksums,
        verified: data.verified,
        verifiedAt: data.verifiedAt?.toMillis(),
        contents: data.contents,
      };

      console.log(`[CloudBackupService] Backup downloaded: ${backupId}`);
      return backup;
    } catch (error) {
      console.error('[CloudBackupService] Download failed:', error);
      return null;
    }
  }

  /**
   * Restore from cloud backup
   */
  static async restoreFromCloud(
    cloudBackupId: string,
    userId: string,
    password?: string
  ): Promise<boolean> {
    try {
      // Download backup
      const backup = await this.downloadBackup(cloudBackupId, userId, password);
      if (!backup) {
        console.error('[CloudBackupService] Failed to download backup for restore');
        return false;
      }

      // Restore using BackupService
      const success = await BackupService.restoreFromLocalBackup(backup.fileUri, password);

      if (success) {
        console.log('[CloudBackupService] Cloud restore completed successfully');
      }

      return success;
    } catch (error) {
      console.error('[CloudBackupService] Cloud restore failed:', error);
      return false;
    }
  }

  /**
   * Delete cloud backup
   */
  static async deleteCloudBackup(cloudBackupId: string, userId: string): Promise<boolean> {
    try {
      const db = getFirestore();
      const backupRef = doc(db, this.CLOUD_BACKUPS_COLLECTION, userId, 'versions', cloudBackupId);
      await deleteDoc(backupRef);

      console.log(`[CloudBackupService] Cloud backup deleted: ${cloudBackupId}`);
      return true;
    } catch (error) {
      console.error('[CloudBackupService] Delete failed:', error);
      return false;
    }
  }

  /**
   * Get backup version history
   */
  static async getBackupVersionHistory(userId: string): Promise<BackupVersion[]> {
    try {
      const cloudBackups = await this.getCloudBackups(userId);
      const localBackups = await BackupService.getLocalBackups();

      const versions: BackupVersion[] = [];

      // Add cloud versions
      for (const backup of cloudBackups) {
        versions.push({
          id: backup.id,
          cloudId: backup.cloudId,
          createdAt: backup.createdAt,
          uploadedAt: backup.uploadedAt,
          size: backup.size,
          verified: backup.verified,
          platform: backup.appVersion,
          appVersion: backup.appVersion,
        });
      }

      // Add local versions (not yet uploaded)
      for (const backup of localBackups) {
        if (backup.userId === userId && !versions.find((v) => v.id === backup.id)) {
          versions.push({
            id: backup.id,
            cloudId: '',
            createdAt: backup.createdAt,
            uploadedAt: 0,
            size: backup.size,
            verified: backup.verified,
            platform: 'local',
            appVersion: backup.appVersion,
          });
        }
      }

      return versions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('[CloudBackupService] Failed to get version history:', error);
      return [];
    }
  }

  /**
   * Auto-upload backup to cloud
   */
  static async autoUploadBackup(): Promise<CloudBackup | null> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[CloudBackupService] No user for auto-upload');
        return null;
      }

      // Get latest local backup
      const localBackups = await BackupService.getLocalBackups();
      if (localBackups.length === 0) {
        console.log('[CloudBackupService] No local backups to upload');
        return null;
      }

      const latestBackup = localBackups[0];

      // Check if already uploaded
      const cloudBackups = await this.getCloudBackups(userId);
      if (cloudBackups.some((b) => b.id === latestBackup.id)) {
        console.log('[CloudBackupService] Backup already uploaded');
        return null;
      }

      // Upload
      return await this.uploadBackup(latestBackup);
    } catch (error) {
      console.error('[CloudBackupService] Auto-upload failed:', error);
      return null;
    }
  }

  /**
   * Schedule monthly backup
   */
  static async scheduleMonthlyBackup(): Promise<void> {
    try {
      const schedule: BackupScheduleStatus = {
        enabled: true,
        frequency: 'monthly',
        lastRun: Date.now(),
        nextRun: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        isOnline: true,
      };

      await AsyncStorage.setItem(this.BACKUP_SCHEDULE_KEY, JSON.stringify(schedule));

      console.log('[CloudBackupService] Monthly backup scheduled');
    } catch (error) {
      console.error('[CloudBackupService] Schedule failed:', error);
    }
  }

  /**
   * Check and run scheduled backup if due
   */
  static async checkAndRunScheduledBackup(): Promise<void> {
    try {
      const scheduleJson = await AsyncStorage.getItem(this.BACKUP_SCHEDULE_KEY);
      if (!scheduleJson) {
        return; // Not scheduled
      }

      const schedule: BackupScheduleStatus = JSON.parse(scheduleJson);
      if (!schedule.enabled) {
        return; // Disabled
      }

      const now = Date.now();
      if (schedule.nextRun && now < schedule.nextRun) {
        return; // Not due yet
      }

      console.log('[CloudBackupService] Running scheduled backup...');

      // Create backup
      const backup = await BackupService.createLocalBackup();
      if (!backup) {
        console.warn('[CloudBackupService] Failed to create backup');
        return;
      }

      // Upload to cloud
      const cloudBackup = await this.uploadBackup(backup);
      if (!cloudBackup) {
        console.warn('[CloudBackupService] Failed to upload backup');
        return;
      }

      // Update schedule
      schedule.lastRun = Date.now();
      schedule.nextRun = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await AsyncStorage.setItem(this.BACKUP_SCHEDULE_KEY, JSON.stringify(schedule));

      console.log('[CloudBackupService] Scheduled backup completed');
    } catch (error) {
      console.error('[CloudBackupService] Scheduled backup failed:', error);
    }
  }

  /**
   * Cleanup old backups (keep last 12 months)
   */
  static async cleanupOldBackups(retentionMonths: number = this.RETENTION_MONTHS): Promise<void> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        return;
      }

      const cloudBackups = await this.getCloudBackups(userId);
      const cutoffTime = Date.now() - retentionMonths * 30 * 24 * 60 * 60 * 1000;

      let deletedCount = 0;
      for (const backup of cloudBackups) {
        if (backup.uploadedAt < cutoffTime) {
          const deleted = await this.deleteCloudBackup(backup.cloudId, userId);
          if (deleted) {
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`[CloudBackupService] Cleaned up ${deletedCount} old backups`);
      }
    } catch (error) {
      console.error('[CloudBackupService] Cleanup failed:', error);
    }
  }

  /**
   * Get schedule status
   */
  static async getScheduleStatus(): Promise<BackupScheduleStatus> {
    try {
      const scheduleJson = await AsyncStorage.getItem(this.BACKUP_SCHEDULE_KEY);
      if (!scheduleJson) {
        return {
          enabled: false,
          frequency: 'monthly',
          isOnline: true,
        };
      }

      return JSON.parse(scheduleJson);
    } catch (error) {
      console.error('[CloudBackupService] Failed to get schedule status:', error);
      return {
        enabled: false,
        frequency: 'monthly',
        isOnline: true,
      };
    }
  }

  // ====== Private Helpers ======

  /**
   * Save cloud backup metadata locally
   */
  private static async saveCloudBackupMetadata(backup: CloudBackup): Promise<void> {
    try {
      const key = `@legal_cloud_backup_${backup.cloudId}`;
      await AsyncStorage.setItem(key, JSON.stringify(backup));
    } catch (error) {
      console.error('[CloudBackupService] Failed to save metadata:', error);
    }
  }

  /**
   * Hash data using SHA-256
   */
  private static async hashData(data: string): Promise<string> {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
      );
    } catch (error) {
      console.warn('[CloudBackupService] Hash failed, using fallback:', error);
      return `hash_${data.length}_${Date.now()}`;
    }
  }
}

export default CloudBackupService;
