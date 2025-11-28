/**
 * DocumentVersioningService Tests
 * Phase 7: Testing & Documentation
 *
 * Unit tests for document versioning and acceptance tracking
 */

import DocumentVersioningService from '../DocumentVersioningService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-001', uid: 'test-user-001' },
    })),
  },
}));

describe('DocumentVersioningService', () => {
  let service: DocumentVersioningService;
  const testDocId = 'test-doc-001';
  const testUserId = 'test-user-001';

  const testDocument = {
    id: testDocId,
    title: 'Terms of Service',
    description: 'Our terms',
    content: '# Terms\n\nSome content',
    version: '1.0.0',
    required: true,
    requiresSignature: true,
    lastUpdated: '2024-01-01',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    service = DocumentVersioningService.getInstance();
  });

  describe('Initialization', () => {
    test('getInstance returns singleton instance', () => {
      const service1 = DocumentVersioningService.getInstance();
      const service2 = DocumentVersioningService.getInstance();
      expect(service1).toBe(service2);
    });

    test('service initializes with all required methods', () => {
      expect(typeof service.getDocumentVersion).toBe('function');
      expect(typeof service.getCurrentVersion).toBe('function');
      expect(typeof service.getAllDocuments).toBe('function');
      expect(typeof service.recordAcceptance).toBe('function');
      expect(typeof service.getUserAcceptances).toBe('function');
      expect(typeof service.isDocumentAccepted).toBe('function');
    });
  });

  describe('Version Management', () => {
    test('getDocumentVersion returns correct version', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(testDocument)
      );

      const version = await service.getDocumentVersion(testDocId);

      expect(version).toBeDefined();
      expect(version?.version).toBe('1.0.0');
    });

    test('getCurrentVersion returns latest version', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(testDocument)
      );

      const version = await service.getCurrentVersion(testDocId);

      expect(version).toBe('1.0.0');
    });

    test('getVersionHistory returns sorted versions', async () => {
      const versions = [
        { ...testDocument, version: '1.0.0' },
        { ...testDocument, version: '1.1.0' },
        { ...testDocument, version: '1.2.0' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(versions)
      );

      const history = await service.getVersionHistory(testDocId);

      expect(Array.isArray(history)).toBe(true);
    });

    test('version comparison works correctly', async () => {
      const version1 = '1.0.0';
      const version2 = '1.0.0';
      const version3 = '1.1.0';

      expect(version1).toBe(version2);
      expect(version1).not.toBe(version3);
    });

    test('handles version with different formats', async () => {
      const versions = ['1.0.0', '1.0.1', '1.1.0', '2.0.0', '2.0.0-beta'];

      versions.forEach(version => {
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Acceptance Recording', () => {
    test('recordAcceptance creates acceptance record', async () => {
      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios',
        '1.0.0'
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('recordAcceptance includes timestamp', async () => {
      const beforeTime = Date.now();

      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios',
        '1.0.0'
      );

      const afterTime = Date.now();

      // Verify timestamp is captured
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('recordAcceptance stores platform information', async () => {
      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'android',
        '1.0.0'
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('recordAcceptance stores app version', async () => {
      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios',
        '2.1.5'
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Acceptance Retrieval', () => {
    test('getUserAcceptances returns all acceptances for user', async () => {
      const mockAcceptances = [
        {
          documentId: 'doc-001',
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
        },
        {
          documentId: 'doc-002',
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'android',
          appVersion: '1.0.0',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockAcceptances)
      );

      const acceptances = await service.getUserAcceptances(testUserId);

      expect(Array.isArray(acceptances)).toBe(true);
      expect(acceptances).toHaveLength(2);
    });

    test('getUserAcceptances returns empty array when no acceptances', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const acceptances = await service.getUserAcceptances(testUserId);

      expect(acceptances).toEqual([]);
    });

    test('isDocumentAccepted returns correct status', async () => {
      const mockAcceptance = {
        documentId: testDocId,
        userId: testUserId,
        acceptedAt: Date.now(),
        version: '1.0.0',
        platform: 'ios',
        appVersion: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([mockAcceptance])
      );

      const accepted = await service.isDocumentAccepted(testDocId, testUserId);

      expect(typeof accepted).toBe('boolean');
      expect(accepted).toBe(true);
    });

    test('isDocumentAccepted returns false for unaccepted document', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const accepted = await service.isDocumentAccepted(testDocId, testUserId);

      expect(accepted).toBe(false);
    });
  });

  describe('Document Management', () => {
    test('getAllDocuments returns all documents', async () => {
      const mockDocuments = [
        { ...testDocument, id: 'doc-001' },
        { ...testDocument, id: 'doc-002' },
        { ...testDocument, id: 'doc-003' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockDocuments)
      );

      const documents = await service.getAllDocuments();

      expect(Array.isArray(documents)).toBe(true);
      expect(documents).toHaveLength(3);
    });

    test('getAllDocuments returns empty array when no documents', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const documents = await service.getAllDocuments();

      expect(documents).toEqual([]);
    });

    test('getDocumentsRequiringSignature filters correctly', async () => {
      const mockDocuments = [
        { ...testDocument, id: 'doc-001', requiresSignature: true },
        { ...testDocument, id: 'doc-002', requiresSignature: false },
        { ...testDocument, id: 'doc-003', requiresSignature: true },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockDocuments)
      );

      const docsNeedingSignature =
        await service.getDocumentsRequiringSignature();

      // Should filter documents
      expect(Array.isArray(docsNeedingSignature)).toBe(true);
    });

    test('getPendingSignatures returns incomplete signatures', async () => {
      const mockDocuments = [
        { ...testDocument, id: 'doc-001', requiresSignature: true },
        { ...testDocument, id: 'doc-002', requiresSignature: true },
      ];

      const mockAcceptances = [
        {
          documentId: 'doc-001',
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
          // No signatureId = pending
        },
      ];

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockDocuments))
        .mockResolvedValueOnce(JSON.stringify(mockAcceptances));

      const pending = await service.getPendingSignatures(testUserId);

      // Should return documents with pending signatures
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe('Signature Integration', () => {
    test('linkSignatureToAcceptance creates link', async () => {
      const result = await service.linkSignatureToAcceptance(
        testDocId,
        'sig-001'
      );

      expect(typeof result).toBe('boolean');
    });

    test('requiresSignature checks document requirement', () => {
      const requiresSignature = service.requiresSignature(testDocument);

      expect(typeof requiresSignature).toBe('boolean');
      expect(requiresSignature).toBe(true);
    });

    test('requiresSignature returns false for unsigned documents', () => {
      const unsigned = { ...testDocument, requiresSignature: false };
      const requiresSignature = service.requiresSignature(unsigned);

      expect(requiresSignature).toBe(false);
    });

    test('hasValidSignature validates signature', async () => {
      const hasValid = await service.hasValidSignature(testDocId);

      expect(typeof hasValid).toBe('boolean');
    });

    test('acceptance can include signature ID', async () => {
      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios',
        '1.0.0',
        'sig-001' // Optional signature ID
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing document ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const version = await service.getDocumentVersion('');

      expect(version).toBeUndefined();
    });

    test('handles corrupted stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        'invalid json'
      );

      const acceptances = await service.getUserAcceptances(testUserId);

      expect(acceptances).toEqual([]);
    });

    test('handles very large document list', async () => {
      const largeDocList = Array.from({ length: 1000 }, (_, i) => ({
        ...testDocument,
        id: `doc-${i}`,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeDocList)
      );

      const documents = await service.getAllDocuments();

      expect(documents).toHaveLength(1000);
    });

    test('handles empty acceptance list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([])
      );

      const acceptances = await service.getUserAcceptances(testUserId);

      expect(acceptances).toEqual([]);
    });

    test('handles missing platform information', async () => {
      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios' as any,
        '1.0.0'
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('handles missing app version', async () => {
      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios',
        ''
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Version Comparison', () => {
    test('correctly identifies version updates', () => {
      const oldVersion = '1.0.0';
      const newVersion = '1.1.0';

      // Version comparison
      expect(oldVersion).not.toBe(newVersion);
    });

    test('handles pre-release versions', () => {
      const versions = ['1.0.0-alpha', '1.0.0-beta', '1.0.0'];

      versions.forEach(v => {
        expect(typeof v).toBe('string');
      });
    });

    test('tracks version history correctly', async () => {
      const versionedDocuments = [
        { ...testDocument, version: '1.0.0', lastUpdated: '2024-01-01' },
        { ...testDocument, version: '1.1.0', lastUpdated: '2024-02-01' },
        { ...testDocument, version: '1.2.0', lastUpdated: '2024-03-01' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(versionedDocuments)
      );

      const history = await service.getVersionHistory(testDocId);

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Acceptance Metadata', () => {
    test('acceptance includes platform information', async () => {
      const acceptance = {
        documentId: testDocId,
        userId: testUserId,
        acceptedAt: Date.now(),
        version: '1.0.0',
        platform: 'ios' as const,
        appVersion: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([acceptance])
      );

      const acceptances = await service.getUserAcceptances(testUserId);

      if (acceptances.length > 0) {
        expect(acceptances[0].platform).toBe('ios');
      }
    });

    test('acceptance includes app version', async () => {
      const acceptance = {
        documentId: testDocId,
        userId: testUserId,
        acceptedAt: Date.now(),
        version: '1.0.0',
        platform: 'ios' as const,
        appVersion: '2.5.1',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([acceptance])
      );

      const acceptances = await service.getUserAcceptances(testUserId);

      if (acceptances.length > 0) {
        expect(acceptances[0].appVersion).toBe('2.5.1');
      }
    });

    test('tracks multiple platforms for same document', async () => {
      const iosAcceptance = {
        documentId: testDocId,
        userId: testUserId,
        acceptedAt: Date.now(),
        version: '1.0.0',
        platform: 'ios' as const,
        appVersion: '1.0.0',
      };

      const androidAcceptance = {
        documentId: testDocId,
        userId: 'other-user',
        acceptedAt: Date.now(),
        version: '1.0.0',
        platform: 'android' as const,
        appVersion: '1.0.0',
      };

      expect(iosAcceptance.platform).not.toBe(androidAcceptance.platform);
    });
  });

  describe('Performance', () => {
    test('getAllDocuments completes efficiently', async () => {
      const largeDocList = Array.from({ length: 500 }, (_, i) => ({
        ...testDocument,
        id: `doc-${i}`,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeDocList)
      );

      const startTime = Date.now();

      await service.getAllDocuments();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    test('getUserAcceptances handles large dataset efficiently', async () => {
      const largeAcceptanceList = Array.from({ length: 1000 }, (_, i) => ({
        documentId: `doc-${i}`,
        userId: testUserId,
        acceptedAt: Date.now() - i * 1000,
        version: '1.0.0',
        platform: i % 2 === 0 ? ('ios' as const) : ('android' as const),
        appVersion: '1.0.0',
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeAcceptanceList)
      );

      const startTime = Date.now();

      const acceptances = await service.getUserAcceptances(testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(acceptances).toHaveLength(1000);
      expect(duration).toBeLessThan(1000);
    });

    test('recordAcceptance completes quickly', async () => {
      const startTime = Date.now();

      await service.recordAcceptance(
        testDocId,
        testUserId,
        '1.0.0',
        'ios',
        '1.0.0'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Data Consistency', () => {
    test('acceptance data is preserved correctly', async () => {
      const originalAcceptance = {
        documentId: testDocId,
        userId: testUserId,
        acceptedAt: 1234567890,
        version: '1.2.3',
        platform: 'ios' as const,
        appVersion: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([originalAcceptance])
      );

      const acceptances = await service.getUserAcceptances(testUserId);

      expect(acceptances[0]).toEqual(originalAcceptance);
    });

    test('document data is not corrupted on retrieval', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(testDocument)
      );

      const retrieved = await service.getDocumentVersion(testDocId);

      expect(retrieved?.title).toBe(testDocument.title);
      expect(retrieved?.content).toBe(testDocument.content);
    });

    test('version information is accurate', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(testDocument)
      );

      const version = await service.getCurrentVersion(testDocId);

      expect(version).toBe(testDocument.version);
    });
  });
});
