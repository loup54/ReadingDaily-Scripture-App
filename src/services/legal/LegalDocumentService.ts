/**
 * Legal Document Service
 *
 * Manages loading, caching, and retrieving legal documents
 * - Loads documents from app bundle on first launch
 * - Caches documents in AsyncStorage
 * - Provides version checking and updates
 * - Supports document parsing and formatting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import documentIndex from '@/assets/legal-documents/index.json';

export interface LegalDocument {
  id: string;
  title: string;
  filename: string;
  version: string;
  lastUpdated: string;
  effectiveDate: string;
  description: string;
  content?: string;
  contentLength: number;
  sections: string[];
  category: string;
  requiresAcceptance: boolean;
  contactEmail: string;
}

export interface DocumentCache {
  documentId: string;
  version: string;
  content: string;
  cachedAt: number;
  expiresAt: number;
}

class LegalDocumentService {
  private static readonly CACHE_PREFIX = '@legal_documents_';
  private static readonly METADATA_KEY = '@legal_documents_metadata';
  private static readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  private static readonly STORAGE_QUOTA = 5 * 1024 * 1024; // 5 MB for legal docs

  /**
   * Initialize legal documents on first launch
   * Loads documents from bundle into AsyncStorage
   */
  static async initializeLegalDocuments(): Promise<void> {
    try {
      const metadata = await this.getMetadata();

      if (metadata?.initialized) {
        console.log('[LegalDocumentService] Documents already initialized');
        return;
      }

      console.log('[LegalDocumentService] Initializing legal documents...');

      // Load all documents from bundle
      for (const doc of documentIndex.documents) {
        await this.loadDocumentFromBundle(doc.id);
      }

      // Mark as initialized
      await AsyncStorage.setItem(
        this.METADATA_KEY,
        JSON.stringify({
          initialized: true,
          initializedAt: new Date().toISOString(),
          version: documentIndex.metadata.bundleVersion,
          totalDocuments: documentIndex.documents.length,
        })
      );

      console.log('[LegalDocumentService] Initialization complete');
    } catch (error) {
      console.error('[LegalDocumentService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load a single document from bundle
   */
  private static async loadDocumentFromBundle(documentId: string): Promise<void> {
    try {
      const docMetadata = documentIndex.documents.find(d => d.id === documentId);
      if (!docMetadata) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Import markdown file dynamically
      const content = await this.loadMarkdownFile(docMetadata.filename);

      // Cache the document
      const cache: DocumentCache = {
        documentId,
        version: docMetadata.version,
        content,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.CACHE_TTL,
      };

      const cacheKey = `${this.CACHE_PREFIX}${documentId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));

      console.log(`[LegalDocumentService] Loaded document: ${documentId}`);
    } catch (error) {
      console.error(`[LegalDocumentService] Failed to load document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Load markdown file content
   * In a real app, you'd import these files properly
   */
  private static async loadMarkdownFile(filename: string): Promise<string> {
    try {
      // Dynamic import of markdown files
      const files: Record<string, string> = {
        'privacy-policy.md': require('@/assets/legal-documents/privacy-policy.md'),
        'terms-of-service.md': require('@/assets/legal-documents/terms-of-service.md'),
        'accessibility.md': require('@/assets/legal-documents/accessibility.md'),
        'copyright.md': require('@/assets/legal-documents/copyright.md'),
        'consumer-rights.md': require('@/assets/legal-documents/consumer-rights.md'),
        'help-faq.md': require('@/assets/legal-documents/help-faq.md'),
      };

      const content = files[filename];
      if (!content) {
        throw new Error(`File not found: ${filename}`);
      }

      // If content is a string, return it; if it's default export, extract
      return typeof content === 'string' ? content : content.default || '';
    } catch (error) {
      console.error(`[LegalDocumentService] Failed to load markdown: ${filename}`, error);

      // Return placeholder content for development
      return `# ${filename}\n\nContent not found during development.\n\nThis is a placeholder.`;
    }
  }

  /**
   * Get a document from cache
   */
  static async getDocument(documentId: string): Promise<LegalDocument | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${documentId}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        console.warn(`[LegalDocumentService] Document not cached: ${documentId}`);
        return null;
      }

      const cache = JSON.parse(cached) as DocumentCache;

      // Check if cache has expired
      if (cache.expiresAt < Date.now()) {
        console.log(`[LegalDocumentService] Cache expired: ${documentId}`);
        await AsyncStorage.removeItem(cacheKey);
        // Reload from bundle
        await this.loadDocumentFromBundle(documentId);
        return this.getDocument(documentId);
      }

      // Get metadata
      const metadata = documentIndex.documents.find(d => d.id === documentId);
      if (!metadata) {
        return null;
      }

      return {
        ...metadata,
        content: cache.content,
      };
    } catch (error) {
      console.error(`[LegalDocumentService] Error getting document: ${documentId}`, error);
      return null;
    }
  }

  /**
   * Get all documents
   */
  static async getAllDocuments(): Promise<LegalDocument[]> {
    try {
      const documents = await Promise.all(
        documentIndex.documents.map(doc => this.getDocument(doc.id))
      );

      return documents.filter((doc): doc is LegalDocument => doc !== null);
    } catch (error) {
      console.error('[LegalDocumentService] Error getting all documents:', error);
      return [];
    }
  }

  /**
   * Get documents by category
   */
  static async getDocumentsByCategory(category: string): Promise<LegalDocument[]> {
    try {
      const allDocs = await this.getAllDocuments();
      return allDocs.filter(doc => doc.category === category);
    } catch (error) {
      console.error('[LegalDocumentService] Error getting documents by category:', error);
      return [];
    }
  }

  /**
   * Get documents that require acceptance
   */
  static async getRequiredDocuments(): Promise<LegalDocument[]> {
    try {
      const allDocs = await this.getAllDocuments();
      return allDocs.filter(doc => doc.requiresAcceptance);
    } catch (error) {
      console.error('[LegalDocumentService] Error getting required documents:', error);
      return [];
    }
  }

  /**
   * Check if there are updates available for any documents
   */
  static async checkForUpdates(): Promise<string[]> {
    try {
      const metadata = await this.getMetadata();
      const currentVersion = metadata?.version || '0.0.0';
      const bundleVersion = documentIndex.metadata.bundleVersion;

      if (currentVersion !== bundleVersion) {
        console.log(`[LegalDocumentService] Updates available: ${currentVersion} -> ${bundleVersion}`);
        return documentIndex.documents.map(d => d.id);
      }

      return [];
    } catch (error) {
      console.error('[LegalDocumentService] Error checking updates:', error);
      return [];
    }
  }

  /**
   * Download/update specific document
   */
  static async downloadUpdate(documentId: string): Promise<boolean> {
    try {
      console.log(`[LegalDocumentService] Downloading update: ${documentId}`);

      // Clear old cache
      const cacheKey = `${this.CACHE_PREFIX}${documentId}`;
      await AsyncStorage.removeItem(cacheKey);

      // Load from bundle
      await this.loadDocumentFromBundle(documentId);

      console.log(`[LegalDocumentService] Update complete: ${documentId}`);
      return true;
    } catch (error) {
      console.error(`[LegalDocumentService] Update failed: ${documentId}`, error);
      return false;
    }
  }

  /**
   * Delete a document from cache
   */
  static async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${documentId}`;
      await AsyncStorage.removeItem(cacheKey);
      console.log(`[LegalDocumentService] Deleted document: ${documentId}`);
      return true;
    } catch (error) {
      console.error(`[LegalDocumentService] Failed to delete document: ${documentId}`, error);
      return false;
    }
  }

  /**
   * Export all documents as text
   */
  static async exportDocuments(): Promise<string> {
    try {
      const allDocs = await this.getAllDocuments();
      let exported = '# ReadingDaily Scripture App - Legal Documents Export\n\n';
      exported += `Exported: ${new Date().toISOString()}\n\n`;

      for (const doc of allDocs) {
        exported += `## ${doc.title} (v${doc.version})\n\n`;
        exported += `Last Updated: ${doc.lastUpdated}\n`;
        exported += `Effective: ${doc.effectiveDate}\n\n`;
        exported += doc.content || '';
        exported += '\n\n---\n\n';
      }

      return exported;
    } catch (error) {
      console.error('[LegalDocumentService] Failed to export documents:', error);
      throw error;
    }
  }

  /**
   * Search documents for text
   */
  static async searchDocuments(query: string): Promise<Map<string, LegalDocument[]>> {
    try {
      const allDocs = await this.getAllDocuments();
      const results = new Map<string, LegalDocument[]>();

      const normalizedQuery = query.toLowerCase();

      for (const doc of allDocs) {
        const titleMatch = doc.title.toLowerCase().includes(normalizedQuery);
        const descriptionMatch = doc.description.toLowerCase().includes(normalizedQuery);
        const contentMatch = doc.content?.toLowerCase().includes(normalizedQuery) || false;

        if (titleMatch || descriptionMatch || contentMatch) {
          const category = doc.category;
          if (!results.has(category)) {
            results.set(category, []);
          }
          results.get(category)?.push(doc);
        }
      }

      return results;
    } catch (error) {
      console.error('[LegalDocumentService] Search failed:', error);
      return new Map();
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalSize: number;
    documentsCount: number;
    cacheSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const legalKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));

      let totalSize = 0;
      for (const key of legalKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
        }
      }

      return {
        totalSize,
        documentsCount: documentIndex.documents.length,
        cacheSize: totalSize,
      };
    } catch (error) {
      console.error('[LegalDocumentService] Failed to get storage stats:', error);
      return {
        totalSize: 0,
        documentsCount: 0,
        cacheSize: 0,
      };
    }
  }

  /**
   * Clear all cached documents
   */
  static async clearCache(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const legalKeys = keys.filter(k => k.startsWith(this.CACHE_PREFIX));

      await AsyncStorage.multiRemove(legalKeys);

      console.log('[LegalDocumentService] Cache cleared');
      return true;
    } catch (error) {
      console.error('[LegalDocumentService] Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get service metadata
   */
  private static async getMetadata(): Promise<any> {
    try {
      const metadata = await AsyncStorage.getItem(this.METADATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('[LegalDocumentService] Failed to get metadata:', error);
      return null;
    }
  }

  /**
   * Get document index (metadata only, no content)
   */
  static getDocumentIndex() {
    return documentIndex;
  }

  /**
   * Get contact emails for different purposes
   */
  static getContactEmails() {
    return documentIndex.metadata;
  }
}

export default LegalDocumentService;
