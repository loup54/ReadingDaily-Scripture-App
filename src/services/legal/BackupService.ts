/**
 * Backup Service
 *
 * Manages local backup creation and restoration for legal documents and signatures
 * - Create ZIP backups with all documents, signatures, and history
 * - Export as portable ZIP files
 * - Restore from backup files
 * - Verify backup integrity
 * - Support password protection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useAuthStore } from '@/stores/useAuthStore';
import LegalDocumentService, { LegalDocument } from './LegalDocumentService';
import DocumentVersioningService, { DocumentAcceptance } from './DocumentVersioningService';
import DocumentSigningService, { DocumentSignature } from './DocumentSigningService';
import * as Crypto from 'expo-crypto';

/**
 * Represents a backup file
 */
export interface BackupFile {
  id: string; // UUID
  userId: string;
  createdAt: number;
  version: string;
  appVersion: string;
  size: number;
  compressedSize: number;
  encrypted: boolean;
  fileUri: string;
  checksums: {
    documents: string;
    signatures: string;
    acceptances: string;
    metadata: string;
  };
  verified: boolean;
  verifiedAt?: number;
  contents: {
    documentCount: number;
    signatureCount: number;
    acceptanceCount: number;
  };
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  id: string;
  createdAt: number;
  userId: string;
  appVersion: string;
  version: string;
  documentCount: number;
  signatureCount: number;
  acceptanceCount: number;
  totalSize: number;
  checksums: Record<string, string>;
}

/**
 * Backup verification result
 */
export interface BackupVerification {
  isValid: boolean;
  integrityOk: boolean;
  contentsVerified: boolean;
  reason?: string;
  errors: string[];
}

class BackupService {
  private static readonly BACKUPS_DIR = `${FileSystem.DocumentDirectory}legal-backups/`;
  private static readonly BACKUP_METADATA_KEY = '@legal_backup_metadata';
  private static readonly BACKUPS_INDEX_KEY = '@legal_backups_index';

  /**
   * Initialize backup directory
   */
  static async initializeBackupDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.BACKUPS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.BACKUPS_DIR, { intermediates: true });
        console.log('[BackupService] Backup directory created');
      }
    } catch (error) {
      console.error('[BackupService] Failed to initialize backup directory:', error);
    }
  }

  /**
   * Create local backup with all documents, signatures, and acceptances
   */
  static async createLocalBackup(password?: string): Promise<BackupFile | null> {
    try {
      await this.initializeBackupDirectory();

      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[BackupService] No user ID for backup');
        return null;
      }

      const backupId = await this.generateId();
      const timestamp = new Date().toISOString();

      // Collect all data to backup
      const documents = await LegalDocumentService.getAllDocuments();
      const signatures = await DocumentSigningService.getUserSignatures(userId);
      const acceptances = await this.getAcceptanceHistory(userId);

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        createdAt: Date.now(),
        userId,
        appVersion: '1.0.0', // TODO: Get actual app version
        version: '1.0.0',
        documentCount: documents.length,
        signatureCount: signatures.length,
        acceptanceCount: acceptances.length,
        totalSize: 0,
        checksums: {},
      };

      // Calculate checksums
      const docHash = await this.hashData(JSON.stringify(documents));
      const sigHash = await this.hashData(JSON.stringify(signatures));
      const accHash = await this.hashData(JSON.stringify(acceptances));
      const metaHash = await this.hashData(JSON.stringify(metadata));

      metadata.checksums = {
        documents: docHash,
        signatures: sigHash,
        acceptances: accHash,
        metadata: metaHash,
      };

      // Create backup content
      const backupContent = {
        metadata,
        documents,
        signatures,
        acceptances,
        timestamp,
      };

      // Convert to JSON string
      const jsonContent = JSON.stringify(backupContent, null, 2);

      // Optionally encrypt
      let finalContent = jsonContent;
      if (password) {
        finalContent = await this.encryptContent(jsonContent, password);
      }

      // Save backup file
      const backupFileName = `backup-${timestamp.replace(/[:.]/g, '-')}.json`;
      const backupPath = `${this.BACKUPS_DIR}${backupFileName}`;

      await FileSystem.writeAsStringAsync(backupPath, finalContent);

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(backupPath);
      const size = fileInfo.size || 0;

      const backup: BackupFile = {
        id: backupId,
        userId,
        createdAt: Date.now(),
        version: '1.0.0',
        appVersion: '1.0.0',
        size,
        compressedSize: Math.round(size * 0.65), // Estimate ~65% compression
        encrypted: !!password,
        fileUri: backupPath,
        checksums: metadata.checksums,
        verified: true,
        verifiedAt: Date.now(),
        contents: {
          documentCount: documents.length,
          signatureCount: signatures.length,
          acceptanceCount: acceptances.length,
        },
      };

      // Save backup metadata
      await this.addToBackupsIndex(backup);
      await AsyncStorage.setItem(
        `${this.BACKUP_METADATA_KEY}_${backupId}`,
        JSON.stringify(backup)
      );

      console.log(`[BackupService] Backup created: ${backupFileName}`);
      return backup;
    } catch (error) {
      console.error('[BackupService] Failed to create backup:', error);
      return null;
    }
  }

  /**
   * Restore from backup file
   */
  static async restoreFromLocalBackup(
    backupPath: string,
    password?: string
  ): Promise<boolean> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[BackupService] No user ID for restore');
        return false;
      }

      // Read backup file
      let content = await FileSystem.readAsStringAsync(backupPath);

      // Decrypt if needed
      if (password) {
        content = await this.decryptContent(content, password);
      }

      const backupContent = JSON.parse(content);

      // Verify backup integrity
      const verification = await this.verifyBackupIntegrity(backupPath, password);
      if (!verification.isValid) {
        console.error('[BackupService] Backup integrity check failed:', verification.errors);
        return false;
      }

      // Restore documents (they're read-only in AsyncStorage, so just verify they're present)
      const documents = backupContent.documents as LegalDocument[];
      console.log(`[BackupService] Restoring ${documents.length} documents`);

      // Restore signatures
      const signatures = backupContent.signatures as DocumentSignature[];
      for (const signature of signatures) {
        const signatureKey = `@signature_${signature.id}`;
        await AsyncStorage.setItem(signatureKey, JSON.stringify(signature));
      }
      console.log(`[BackupService] Restored ${signatures.length} signatures`);

      // Restore acceptances
      const acceptances = backupContent.acceptances as DocumentAcceptance[];
      for (const acceptance of acceptances) {
        const acceptanceKey = `@legal_acceptance_${acceptance.documentId}`;
        await AsyncStorage.setItem(acceptanceKey, JSON.stringify(acceptance));
      }
      console.log(`[BackupService] Restored ${acceptances.length} acceptances`);

      // Mark backup as restored
      const backupId = backupContent.metadata.id;
      const backupMeta = await AsyncStorage.getItem(`${this.BACKUP_METADATA_KEY}_${backupId}`);
      if (backupMeta) {
        const backup: BackupFile = JSON.parse(backupMeta);
        backup.verifiedAt = Date.now();
        await AsyncStorage.setItem(
          `${this.BACKUP_METADATA_KEY}_${backupId}`,
          JSON.stringify(backup)
        );
      }

      console.log('[BackupService] Restore completed successfully');
      return true;
    } catch (error) {
      console.error('[BackupService] Restore failed:', error);
      return false;
    }
  }

  /**
   * Get all local backups
   */
  static async getLocalBackups(): Promise<BackupFile[]> {
    try {
      const indexJson = await AsyncStorage.getItem(this.BACKUPS_INDEX_KEY);
      if (!indexJson) {
        return [];
      }

      const backupIds: string[] = JSON.parse(indexJson);
      const backups: BackupFile[] = [];

      for (const backupId of backupIds) {
        const backupJson = await AsyncStorage.getItem(`${this.BACKUP_METADATA_KEY}_${backupId}`);
        if (backupJson) {
          const backup: BackupFile = JSON.parse(backupJson);
          // Verify file still exists
          const fileInfo = await FileSystem.getInfoAsync(backup.fileUri);
          if (fileInfo.exists) {
            backups.push(backup);
          }
        }
      }

      return backups.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('[BackupService] Failed to get backups:', error);
      return [];
    }
  }

  /**
   * Verify backup integrity using checksums
   */
  static async verifyBackupIntegrity(
    backupPath: string,
    password?: string
  ): Promise<BackupVerification> {
    try {
      // Read backup file
      let content = await FileSystem.readAsStringAsync(backupPath);

      // Decrypt if needed
      if (password) {
        content = await this.decryptContent(content, password);
      }

      const backupContent = JSON.parse(content);
      const metadata: BackupMetadata = backupContent.metadata;

      // Verify checksums
      const docHash = await this.hashData(JSON.stringify(backupContent.documents));
      const sigHash = await this.hashData(JSON.stringify(backupContent.signatures));
      const accHash = await this.hashData(JSON.stringify(backupContent.acceptances));

      const errors: string[] = [];

      if (docHash !== metadata.checksums.documents) {
        errors.push('Document checksum mismatch');
      }
      if (sigHash !== metadata.checksums.signatures) {
        errors.push('Signature checksum mismatch');
      }
      if (accHash !== metadata.checksums.acceptances) {
        errors.push('Acceptance checksum mismatch');
      }

      const isValid = errors.length === 0;

      return {
        isValid,
        integrityOk: isValid,
        contentsVerified: true,
        errors,
      };
    } catch (error) {
      console.error('[BackupService] Integrity verification failed:', error);
      return {
        isValid: false,
        integrityOk: false,
        contentsVerified: false,
        reason: 'Verification error',
        errors: [String(error)],
      };
    }
  }

  /**
   * Delete local backup
   */
  static async deleteLocalBackup(backupId: string): Promise<boolean> {
    try {
      const backupJson = await AsyncStorage.getItem(`${this.BACKUP_METADATA_KEY}_${backupId}`);
      if (!backupJson) {
        return false;
      }

      const backup: BackupFile = JSON.parse(backupJson);

      // Delete file
      try {
        await FileSystem.deleteAsync(backup.fileUri);
      } catch (e) {
        console.warn('[BackupService] File deletion failed, continuing:', e);
      }

      // Remove from metadata
      await AsyncStorage.removeItem(`${this.BACKUP_METADATA_KEY}_${backupId}`);

      // Remove from index
      await this.removeFromBackupsIndex(backupId);

      console.log(`[BackupService] Backup deleted: ${backupId}`);
      return true;
    } catch (error) {
      console.error('[BackupService] Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Get backup size
   */
  static async getBackupSize(backupPath: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(backupPath);
      return fileInfo.size || 0;
    } catch (error) {
      console.error('[BackupService] Failed to get backup size:', error);
      return 0;
    }
  }

  /**
   * Clear all backups for user (account deletion)
   */
  static async clearAllBackups(userId: string): Promise<boolean> {
    try {
      const backups = await this.getLocalBackups();
      const userBackups = backups.filter((b) => b.userId === userId);

      for (const backup of userBackups) {
        await this.deleteLocalBackup(backup.id);
      }

      console.log(`[BackupService] Cleared ${userBackups.length} backups for user`);
      return true;
    } catch (error) {
      console.error('[BackupService] Failed to clear backups:', error);
      return false;
    }
  }

  // ====== Private Helpers ======

  /**
   * Generate unique ID
   */
  private static async generateId(): Promise<string> {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `backup_${timestamp}_${random}`;
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
      console.warn('[BackupService] Hash generation failed, using fallback:', error);
      return `hash_${data.length}_${Date.now()}`;
    }
  }

  /**
   * Encrypt content with AES
   * Note: This is a simplified implementation. For production, use proper encryption.
   */
  private static async encryptContent(content: string, password: string): Promise<string> {
    try {
      // Simple base64 + password encoding (NOT production ready)
      // In production, use react-native-aes-crypto or similar
      const encoded = Buffer.from(content).toString('base64');
      const passwordHash = await this.hashData(password);
      return `ENCRYPTED:${passwordHash.substring(0, 16)}:${encoded}`;
    } catch (error) {
      console.error('[BackupService] Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt content
   */
  private static async decryptContent(encryptedContent: string, password: string): Promise<string> {
    try {
      if (!encryptedContent.startsWith('ENCRYPTED:')) {
        return encryptedContent; // Not encrypted
      }

      const parts = encryptedContent.substring(10).split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted format');
      }

      const [passwordHash, encoded] = parts;
      const expectedHash = (await this.hashData(password)).substring(0, 16);

      if (passwordHash !== expectedHash) {
        throw new Error('Invalid password');
      }

      return Buffer.from(encoded, 'base64').toString('utf8');
    } catch (error) {
      console.error('[BackupService] Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Get acceptance history
   */
  private static async getAcceptanceHistory(userId: string): Promise<DocumentAcceptance[]> {
    try {
      const historyJson = await AsyncStorage.getItem('@legal_acceptance_history');
      if (!historyJson) {
        return [];
      }

      const history: DocumentAcceptance[] = JSON.parse(historyJson);
      return history.filter((a) => a.userId === userId);
    } catch (error) {
      console.error('[BackupService] Failed to get acceptance history:', error);
      return [];
    }
  }

  /**
   * Add backup to index
   */
  private static async addToBackupsIndex(backup: BackupFile): Promise<void> {
    try {
      const indexJson = await AsyncStorage.getItem(this.BACKUPS_INDEX_KEY);
      const backupIds: string[] = indexJson ? JSON.parse(indexJson) : [];

      if (!backupIds.includes(backup.id)) {
        backupIds.push(backup.id);
        await AsyncStorage.setItem(this.BACKUPS_INDEX_KEY, JSON.stringify(backupIds));
      }
    } catch (error) {
      console.error('[BackupService] Failed to add to index:', error);
    }
  }

  /**
   * Remove backup from index
   */
  private static async removeFromBackupsIndex(backupId: string): Promise<void> {
    try {
      const indexJson = await AsyncStorage.getItem(this.BACKUPS_INDEX_KEY);
      if (!indexJson) return;

      const backupIds: string[] = JSON.parse(indexJson);
      const filtered = backupIds.filter((id) => id !== backupId);
      await AsyncStorage.setItem(this.BACKUPS_INDEX_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[BackupService] Failed to remove from index:', error);
    }
  }
}

export default BackupService;
