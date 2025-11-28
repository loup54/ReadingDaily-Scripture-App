/**
 * Document Signing Service
 *
 * Manages digital signature capture, storage, verification, and compliance tracking
 * - Captures signature data (sketch or typed)
 * - Stores signatures with complete metadata
 * - Handles signature verification for audits
 * - Syncs to Firestore for compliance records
 * - Supports signature expiry and renewal
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { CapturedSignature } from '@/components/legal/SignatureModal';
import * as Crypto from 'expo-crypto';

/**
 * Represents a captured and stored document signature
 */
export interface DocumentSignature {
  id: string; // UUID
  documentId: string;
  userId: string;
  signatureType: 'sketch' | 'typed';
  signatureData: string; // Base64 (sketch) or text (typed)
  signedAt: number; // Timestamp in milliseconds
  expiresAt?: number; // Optional expiry timestamp
  metadata: {
    platform: 'ios' | 'android';
    appVersion: string;
    device: string;
    ipAddress?: string;
    location?: string;
  };
  verification: {
    verified: boolean;
    verifiedAt?: number;
    hash?: string; // SHA256 hash for integrity
  };
  syncStatus: 'pending' | 'synced' | 'failed';
}

/**
 * Signature verification result
 */
export interface SignatureVerification {
  isValid: boolean;
  signature: DocumentSignature | null;
  integrityOk: boolean;
  notExpired: boolean;
  reason?: string;
}

/**
 * Signature export for compliance reports
 */
export interface SignatureExport {
  userId: string;
  exportedAt: number;
  signatures: Array<{
    documentId: string;
    documentTitle: string;
    signedAt: number;
    expiresAt?: number;
    type: 'sketch' | 'typed';
    verified: boolean;
  }>;
}

class DocumentSigningService {
  private static readonly SIGNATURES_KEY = '@legal_signatures';
  private static readonly SIGNATURE_PREFIX = '@signature_';
  private static readonly PENDING_SIGNATURES_KEY = '@legal_pending_signatures';

  /**
   * Capture and store a signature
   *
   * @param documentId - ID of document being signed
   * @param signature - Captured signature data
   * @param appVersion - Current app version
   * @param platform - iOS or Android
   * @returns Stored signature record
   */
  static async captureSignature(
    documentId: string,
    signature: CapturedSignature,
    appVersion: string,
    platform: 'ios' | 'android'
  ): Promise<DocumentSignature | null> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[DocumentSigningService] No user ID available for signature');
        return null;
      }

      // Generate signature ID and hash
      const signatureId = await this.generateId();
      const hash = await this.generateHash(signature.data);

      // Determine expiry (1 year from now)
      const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;

      const documentSignature: DocumentSignature = {
        id: signatureId,
        documentId,
        userId,
        signatureType: signature.type,
        signatureData: signature.data,
        signedAt: signature.timestamp,
        expiresAt,
        metadata: {
          platform: signature.device as 'ios' | 'android',
          appVersion,
          device: platform,
          ipAddress: undefined, // Will be populated by backend
          location: undefined, // Will be populated if available
        },
        verification: {
          verified: false,
          hash,
        },
        syncStatus: 'pending',
      };

      // Store locally
      const signatureKey = `${this.SIGNATURE_PREFIX}${signatureId}`;
      await AsyncStorage.setItem(signatureKey, JSON.stringify(documentSignature));

      // Add to index
      await this.addToSignatureIndex(documentId, userId, signatureId);

      // Mark for sync
      await this.markForSync(signatureId, documentId, userId);

      console.log(
        `[DocumentSigningService] Signature captured: ${documentId} by ${userId}`
      );

      return documentSignature;
    } catch (error) {
      console.error('[DocumentSigningService] Failed to capture signature:', error);
      return null;
    }
  }

  /**
   * Get signature for a specific document and user
   */
  static async getSignature(
    documentId: string,
    userId: string
  ): Promise<DocumentSignature | null> {
    try {
      const signatures = await this.getUserSignatures(userId);
      const signature = signatures.find((s) => s.documentId === documentId);
      return signature || null;
    } catch (error) {
      console.error('[DocumentSigningService] Failed to get signature:', error);
      return null;
    }
  }

  /**
   * Verify signature integrity and validity
   */
  static async verifySignature(
    documentId: string,
    userId: string
  ): Promise<SignatureVerification> {
    try {
      const signature = await this.getSignature(documentId, userId);

      if (!signature) {
        return {
          isValid: false,
          signature: null,
          integrityOk: false,
          notExpired: false,
          reason: 'Signature not found',
        };
      }

      // Check expiry
      const notExpired = !signature.expiresAt || signature.expiresAt > Date.now();
      if (!notExpired) {
        return {
          isValid: false,
          signature,
          integrityOk: true,
          notExpired: false,
          reason: 'Signature has expired',
        };
      }

      // Verify hash integrity
      const recalculatedHash = await this.generateHash(signature.signatureData);
      const integrityOk = signature.verification.hash === recalculatedHash;

      if (!integrityOk) {
        return {
          isValid: false,
          signature,
          integrityOk: false,
          notExpired: true,
          reason: 'Signature integrity check failed',
        };
      }

      return {
        isValid: true,
        signature,
        integrityOk: true,
        notExpired: true,
      };
    } catch (error) {
      console.error('[DocumentSigningService] Verification failed:', error);
      return {
        isValid: false,
        signature: null,
        integrityOk: false,
        notExpired: false,
        reason: 'Verification error',
      };
    }
  }

  /**
   * Check if signature is still valid (not expired)
   */
  static isSignatureValid(signature: DocumentSignature): boolean {
    if (!signature) return false;
    if (signature.expiresAt && signature.expiresAt < Date.now()) {
      return false;
    }
    return true;
  }

  /**
   * Get all signatures for a user
   */
  static async getUserSignatures(userId: string): Promise<DocumentSignature[]> {
    try {
      const signaturesJson = await AsyncStorage.getItem(
        `${this.SIGNATURES_KEY}_${userId}`
      );
      if (!signaturesJson) {
        return [];
      }

      const signatureIds: string[] = JSON.parse(signaturesJson);
      const signatures: DocumentSignature[] = [];

      for (const signatureId of signatureIds) {
        const signatureKey = `${this.SIGNATURE_PREFIX}${signatureId}`;
        const signatureJson = await AsyncStorage.getItem(signatureKey);
        if (signatureJson) {
          const signature: DocumentSignature = JSON.parse(signatureJson);
          // Only include non-expired signatures
          if (this.isSignatureValid(signature)) {
            signatures.push(signature);
          }
        }
      }

      return signatures;
    } catch (error) {
      console.error('[DocumentSigningService] Failed to get user signatures:', error);
      return [];
    }
  }

  /**
   * Check if user has signed a specific document
   */
  static async hasSigned(documentId: string, userId: string): Promise<boolean> {
    try {
      const signature = await this.getSignature(documentId, userId);
      return signature !== null && this.isSignatureValid(signature);
    } catch (error) {
      console.error('[DocumentSigningService] Failed to check signature:', error);
      return false;
    }
  }

  /**
   * Export signatures for compliance report
   */
  static async exportSignatures(userId: string): Promise<SignatureExport> {
    try {
      const signatures = await this.getUserSignatures(userId);

      return {
        userId,
        exportedAt: Date.now(),
        signatures: signatures.map((s) => ({
          documentId: s.documentId,
          documentTitle: s.documentId.replace(/-/g, ' ').toUpperCase(),
          signedAt: s.signedAt,
          expiresAt: s.expiresAt,
          type: s.signatureType,
          verified: s.verification.verified,
        })),
      };
    } catch (error) {
      console.error('[DocumentSigningService] Failed to export signatures:', error);
      return {
        userId,
        exportedAt: Date.now(),
        signatures: [],
      };
    }
  }

  /**
   * Clear all signatures for a user (account deletion)
   */
  static async clearSignatures(userId: string): Promise<boolean> {
    try {
      const signatures = await this.getUserSignatures(userId);

      for (const signature of signatures) {
        const signatureKey = `${this.SIGNATURE_PREFIX}${signature.id}`;
        await AsyncStorage.removeItem(signatureKey);
      }

      await AsyncStorage.removeItem(`${this.SIGNATURES_KEY}_${userId}`);
      await AsyncStorage.removeItem(`${this.PENDING_SIGNATURES_KEY}_${userId}`);

      console.log(`[DocumentSigningService] Cleared signatures for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[DocumentSigningService] Failed to clear signatures:', error);
      return false;
    }
  }

  /**
   * Get pending signatures (not yet synced to Firestore)
   */
  static async getPendingSignatures(userId: string): Promise<DocumentSignature[]> {
    try {
      const signatures = await this.getUserSignatures(userId);
      return signatures.filter((s) => s.syncStatus === 'pending');
    } catch (error) {
      console.error('[DocumentSigningService] Failed to get pending signatures:', error);
      return [];
    }
  }

  /**
   * Mark signature as synced
   */
  static async markAsSynced(signatureId: string): Promise<boolean> {
    try {
      const signatureKey = `${this.SIGNATURE_PREFIX}${signatureId}`;
      const signatureJson = await AsyncStorage.getItem(signatureKey);

      if (!signatureJson) {
        return false;
      }

      const signature: DocumentSignature = JSON.parse(signatureJson);
      signature.syncStatus = 'synced';
      signature.verification.verified = true;
      signature.verification.verifiedAt = Date.now();

      await AsyncStorage.setItem(signatureKey, JSON.stringify(signature));
      return true;
    } catch (error) {
      console.error('[DocumentSigningService] Failed to mark as synced:', error);
      return false;
    }
  }

  /**
   * Private helper: Generate unique ID
   */
  private static async generateId(): Promise<string> {
    const random = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now().toString(36);
    return `sig_${timestamp}_${random}`;
  }

  /**
   * Private helper: Generate SHA256 hash
   */
  private static async generateHash(data: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
      );
      return hash;
    } catch (error) {
      console.warn('[DocumentSigningService] Hash generation failed, using fallback:', error);
      // Fallback if Crypto unavailable
      return `hash_${data.length}_${Date.now()}`;
    }
  }

  /**
   * Private helper: Add to signature index
   */
  private static async addToSignatureIndex(
    documentId: string,
    userId: string,
    signatureId: string
  ): Promise<void> {
    try {
      const indexKey = `${this.SIGNATURES_KEY}_${userId}`;
      const indexJson = await AsyncStorage.getItem(indexKey);
      const signatureIds: string[] = indexJson ? JSON.parse(indexJson) : [];

      if (!signatureIds.includes(signatureId)) {
        signatureIds.push(signatureId);
        await AsyncStorage.setItem(indexKey, JSON.stringify(signatureIds));
      }
    } catch (error) {
      console.error('[DocumentSigningService] Failed to add to index:', error);
    }
  }

  /**
   * Private helper: Mark for sync
   */
  private static async markForSync(
    signatureId: string,
    documentId: string,
    userId: string
  ): Promise<void> {
    try {
      const pendingKey = `${this.PENDING_SIGNATURES_KEY}_${userId}`;
      const pendingJson = await AsyncStorage.getItem(pendingKey);
      const pending: string[] = pendingJson ? JSON.parse(pendingJson) : [];

      if (!pending.includes(signatureId)) {
        pending.push(signatureId);
        await AsyncStorage.setItem(pendingKey, JSON.stringify(pending));
      }
    } catch (error) {
      console.error('[DocumentSigningService] Failed to mark for sync:', error);
    }
  }
}

export default DocumentSigningService;
