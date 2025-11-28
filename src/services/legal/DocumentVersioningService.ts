/**
 * Document Versioning Service
 *
 * Manages document version control and user acceptance tracking
 * - Maintains version history (in Firestore when online)
 * - Tracks user acceptance of documents
 * - Provides audit trail for compliance
 * - Handles T&C acceptance workflow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import LegalDocumentService, { LegalDocument } from './LegalDocumentService';
import documentIndex from '@/assets/legal-documents/index.json';

export interface DocumentAcceptance {
  documentId: string;
  userId: string;
  version: string;
  acceptedAt: number;
  platform: 'ios' | 'android';
  appVersion: string;
  ipAddress?: string;
  signatureId?: string; // Link to signature record
  requiresSignature?: boolean;
  signedAt?: number;
}

export interface DocumentVersion {
  documentId: string;
  version: string;
  title: string;
  releaseDate: string;
  effectiveDate: string;
  changes?: string;
  hash?: string; // For integrity checking
}

export interface UserAcceptanceStatus {
  userId: string;
  documentId: string;
  accepted: boolean;
  version?: string;
  acceptedAt?: number;
  requiresReacceptance: boolean;
}

class DocumentVersioningService {
  private static readonly ACCEPTANCE_PREFIX = '@legal_acceptance_';
  private static readonly ACCEPTANCE_HISTORY_KEY = '@legal_acceptance_history';
  private static readonly PENDING_ACCEPTANCES_KEY = '@legal_pending_acceptances';

  /**
   * Record user acceptance of a document
   */
  static async recordAcceptance(
    documentId: string,
    appVersion: string,
    platform: 'ios' | 'android'
  ): Promise<boolean> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[DocumentVersioningService] No user ID available for acceptance');
        return false;
      }

      const doc = await LegalDocumentService.getDocument(documentId);
      if (!doc) {
        console.warn(`[DocumentVersioningService] Document not found: ${documentId}`);
        return false;
      }

      const acceptance: DocumentAcceptance = {
        documentId,
        userId,
        version: doc.version,
        acceptedAt: Date.now(),
        platform,
        appVersion,
      };

      // Store locally
      const acceptanceKey = `${this.ACCEPTANCE_PREFIX}${documentId}`;
      await AsyncStorage.setItem(acceptanceKey, JSON.stringify(acceptance));

      // Add to history
      await this.addToHistory(acceptance);

      // Mark as sync-needed (will sync to Firestore when online)
      await this.markForSync(documentId, userId);

      console.log(
        `[DocumentVersioningService] Recorded acceptance: ${documentId} v${doc.version}`
      );

      return true;
    } catch (error) {
      console.error('[DocumentVersioningService] Failed to record acceptance:', error);
      return false;
    }
  }

  /**
   * Check if user has accepted a document
   */
  static async hasAccepted(documentId: string): Promise<boolean> {
    try {
      const acceptance = await this.getAcceptance(documentId);
      return acceptance !== null;
    } catch (error) {
      console.error('[DocumentVersioningService] Error checking acceptance:', error);
      return false;
    }
  }

  /**
   * Get user's acceptance record for a document
   */
  static async getAcceptance(documentId: string): Promise<DocumentAcceptance | null> {
    try {
      const acceptanceKey = `${this.ACCEPTANCE_PREFIX}${documentId}`;
      const acceptance = await AsyncStorage.getItem(acceptanceKey);

      return acceptance ? (JSON.parse(acceptance) as DocumentAcceptance) : null;
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting acceptance:', error);
      return null;
    }
  }

  /**
   * Check if document needs reacceptance (version changed)
   */
  static async needsReacceptance(documentId: string): Promise<boolean> {
    try {
      const doc = await LegalDocumentService.getDocument(documentId);
      if (!doc) return false;

      const acceptance = await this.getAcceptance(documentId);
      if (!acceptance) {
        // Never accepted
        return doc.requiresAcceptance;
      }

      // Check if version changed
      return acceptance.version !== doc.version;
    } catch (error) {
      console.error('[DocumentVersioningService] Error checking reacceptance:', error);
      return false;
    }
  }

  /**
   * Get acceptance status for a document
   */
  static async getAcceptanceStatus(documentId: string): Promise<UserAcceptanceStatus> {
    try {
      const userId = useAuthStore.getState().user?.id;
      const doc = await LegalDocumentService.getDocument(documentId);
      const acceptance = await this.getAcceptance(documentId);
      const needsReaccept = await this.needsReacceptance(documentId);

      return {
        userId: userId || 'guest',
        documentId,
        accepted: acceptance !== null && !needsReaccept,
        version: acceptance?.version,
        acceptedAt: acceptance?.acceptedAt,
        requiresReacceptance: needsReaccept,
      };
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting status:', error);
      return {
        userId: 'guest',
        documentId,
        accepted: false,
        requiresReacceptance: true,
      };
    }
  }

  /**
   * Get acceptance status for all required documents
   */
  static async getAllAcceptanceStatus(): Promise<UserAcceptanceStatus[]> {
    try {
      const requiredDocs = documentIndex.requiredAcceptances.map(req => req.documentId);
      const statuses = await Promise.all(
        requiredDocs.map(docId => this.getAcceptanceStatus(docId))
      );

      return statuses;
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting all statuses:', error);
      return [];
    }
  }

  /**
   * Check if all required documents are accepted
   */
  static async allRequiredAccepted(): Promise<boolean> {
    try {
      const statuses = await this.getAllAcceptanceStatus();
      return statuses.every(status => status.accepted);
    } catch (error) {
      console.error('[DocumentVersioningService] Error checking all accepted:', error);
      return false;
    }
  }

  /**
   * Get documents that need acceptance
   */
  static async getPendingAcceptances(): Promise<LegalDocument[]> {
    try {
      const statuses = await this.getAllAcceptanceStatus();
      const pending = statuses.filter(status => !status.accepted);

      const documents = await Promise.all(
        pending.map(status => LegalDocumentService.getDocument(status.documentId))
      );

      return documents.filter((doc): doc is LegalDocument => doc !== null);
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting pending:', error);
      return [];
    }
  }

  /**
   * Get acceptance history
   */
  static async getAcceptanceHistory(): Promise<DocumentAcceptance[]> {
    try {
      const history = await AsyncStorage.getItem(this.ACCEPTANCE_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting history:', error);
      return [];
    }
  }

  /**
   * Add acceptance to history
   */
  private static async addToHistory(acceptance: DocumentAcceptance): Promise<void> {
    try {
      const history = await this.getAcceptanceHistory();
      history.push(acceptance);

      // Keep only last 100 entries per document for storage efficiency
      const docHistory = history.filter(h => h.documentId === acceptance.documentId);
      if (docHistory.length > 100) {
        const otherHistory = history.filter(h => h.documentId !== acceptance.documentId);
        const trimmedDocHistory = docHistory.slice(-100);
        const newHistory = [...otherHistory, ...trimmedDocHistory];
        await AsyncStorage.setItem(this.ACCEPTANCE_HISTORY_KEY, JSON.stringify(newHistory));
      } else {
        await AsyncStorage.setItem(this.ACCEPTANCE_HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('[DocumentVersioningService] Error adding to history:', error);
    }
  }

  /**
   * Mark document acceptance for sync to Firestore
   */
  private static async markForSync(documentId: string, userId: string): Promise<void> {
    try {
      const pending = await AsyncStorage.getItem(this.PENDING_ACCEPTANCES_KEY);
      const pendingList: Array<{ documentId: string; userId: string; timestamp: number }> =
        pending ? JSON.parse(pending) : [];

      // Don't add duplicate
      const exists = pendingList.some(p => p.documentId === documentId && p.userId === userId);
      if (!exists) {
        pendingList.push({
          documentId,
          userId,
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem(this.PENDING_ACCEPTANCES_KEY, JSON.stringify(pendingList));
      }
    } catch (error) {
      console.error('[DocumentVersioningService] Error marking for sync:', error);
    }
  }

  /**
   * Get pending syncs to Firestore
   */
  static async getPendingSyncs(): Promise<
    Array<{ documentId: string; userId: string; timestamp: number }>
  > {
    try {
      const pending = await AsyncStorage.getItem(this.PENDING_ACCEPTANCES_KEY);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting pending syncs:', error);
      return [];
    }
  }

  /**
   * Clear pending syncs after successful upload
   */
  static async clearPendingSyncs(documentId: string): Promise<void> {
    try {
      const pending = await this.getPendingSyncs();
      const updated = pending.filter(p => p.documentId !== documentId);
      await AsyncStorage.setItem(this.PENDING_ACCEPTANCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[DocumentVersioningService] Error clearing pending syncs:', error);
    }
  }

  /**
   * Get version history for a document
   */
  static getVersionHistory(documentId: string): DocumentVersion[] {
    try {
      // In a full implementation, this would come from Firestore
      // For now, return the current version
      const doc = documentIndex.documents.find(d => d.id === documentId);
      if (!doc) return [];

      return [
        {
          documentId,
          version: doc.version,
          title: doc.title,
          releaseDate: doc.lastUpdated,
          effectiveDate: doc.effectiveDate,
        },
      ];
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting version history:', error);
      return [];
    }
  }

  /**
   * Compare two document versions
   */
  static compareVersions(documentId: string, version1: string, version2: string): string[] {
    try {
      // In a full implementation, this would show diffs
      // For now, return placeholder
      return [`Version ${version1} and ${version2} comparison not yet implemented`];
    } catch (error) {
      console.error('[DocumentVersioningService] Error comparing versions:', error);
      return [];
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(): Promise<{
    userId: string;
    generatedAt: string;
    requiredDocuments: UserAcceptanceStatus[];
    acceptanceHistory: DocumentAcceptance[];
    allAccepted: boolean;
  }> {
    try {
      const userId = useAuthStore.getState().user?.id || 'unknown';
      const statuses = await this.getAllAcceptanceStatus();
      const history = await this.getAcceptanceHistory();

      return {
        userId,
        generatedAt: new Date().toISOString(),
        requiredDocuments: statuses,
        acceptanceHistory: history,
        allAccepted: statuses.every(s => s.accepted),
      };
    } catch (error) {
      console.error('[DocumentVersioningService] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Export acceptance records as JSON
   */
  static async exportAcceptanceRecords(): Promise<string> {
    try {
      const report = await this.generateComplianceReport();
      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error('[DocumentVersioningService] Error exporting records:', error);
      throw error;
    }
  }

  /**
   * Clear all acceptance records (for account deletion)
   */
  static async clearAllAcceptances(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const acceptanceKeys = keys.filter(k => k.startsWith(this.ACCEPTANCE_PREFIX));

      await AsyncStorage.multiRemove([
        ...acceptanceKeys,
        this.ACCEPTANCE_HISTORY_KEY,
        this.PENDING_ACCEPTANCES_KEY,
      ]);

      console.log('[DocumentVersioningService] Cleared all acceptances');
      return true;
    } catch (error) {
      console.error('[DocumentVersioningService] Error clearing acceptances:', error);
      return false;
    }
  }

  /**
   * Get document with acceptance info
   */
  static async getDocumentWithAcceptance(
    documentId: string
  ): Promise<{
    document: LegalDocument | null;
    status: UserAcceptanceStatus;
  }> {
    try {
      const document = await LegalDocumentService.getDocument(documentId);
      const status = await this.getAcceptanceStatus(documentId);

      return { document, status };
    } catch (error) {
      console.error('[DocumentVersioningService] Error getting document with acceptance:', error);
      return {
        document: null,
        status: {
          userId: 'guest',
          documentId,
          accepted: false,
          requiresReacceptance: true,
        },
      };
    }
  }

  /**
   * Link a signature to an acceptance record
   */
  static async linkSignatureToAcceptance(
    documentId: string,
    signatureId: string
  ): Promise<boolean> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[DocumentVersioningService] No user ID for signature link');
        return false;
      }

      const acceptanceKey = `${this.ACCEPTANCE_PREFIX}${documentId}`;
      const acceptanceJson = await AsyncStorage.getItem(acceptanceKey);

      if (!acceptanceJson) {
        console.warn(
          '[DocumentVersioningService] Acceptance record not found for linking'
        );
        return false;
      }

      const acceptance: DocumentAcceptance = JSON.parse(acceptanceJson);
      acceptance.signatureId = signatureId;
      acceptance.signedAt = Date.now();

      await AsyncStorage.setItem(acceptanceKey, JSON.stringify(acceptance));

      console.log(
        `[DocumentVersioningService] Linked signature ${signatureId} to ${documentId}`
      );

      return true;
    } catch (error) {
      console.error('[DocumentVersioningService] Failed to link signature:', error);
      return false;
    }
  }

  /**
   * Check if document requires signature
   */
  static requiresSignature(documentId: string): boolean {
    const doc = documentIndex.documents.find((d) => d.id === documentId);
    return doc?.requiresSignature || false;
  }

  /**
   * Get all documents requiring signatures
   */
  static async getDocumentsRequiringSignature(): Promise<string[]> {
    return documentIndex.documents
      .filter((d) => d.requiresSignature)
      .map((d) => d.id);
  }

  /**
   * Get pending signatures (accepted but not signed)
   */
  static async getPendingSignatures(userId: string): Promise<Array<{
    documentId: string;
    title: string;
  }>> {
    try {
      const requiredDocs = await this.getDocumentsRequiringSignature();
      const pending = [];

      for (const docId of requiredDocs) {
        const acceptanceKey = `${this.ACCEPTANCE_PREFIX}${docId}`;
        const acceptanceJson = await AsyncStorage.getItem(acceptanceKey);

        if (acceptanceJson) {
          const acceptance: DocumentAcceptance = JSON.parse(acceptanceJson);
          if (acceptance.userId === userId && !acceptance.signatureId) {
            const doc = documentIndex.documents.find((d) => d.id === docId);
            pending.push({
              documentId: docId,
              title: doc?.title || docId,
            });
          }
        }
      }

      return pending;
    } catch (error) {
      console.error('[DocumentVersioningService] Failed to get pending signatures:', error);
      return [];
    }
  }

  /**
   * Check if document has valid signature
   */
  static async hasValidSignature(documentId: string): Promise<boolean> {
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return false;

      const acceptanceKey = `${this.ACCEPTANCE_PREFIX}${documentId}`;
      const acceptanceJson = await AsyncStorage.getItem(acceptanceKey);

      if (!acceptanceJson) return false;

      const acceptance: DocumentAcceptance = JSON.parse(acceptanceJson);
      return acceptance.userId === userId && acceptance.signatureId !== undefined;
    } catch (error) {
      console.error('[DocumentVersioningService] Failed to check signature validity:', error);
      return false;
    }
  }
}

export default DocumentVersioningService;
