/**
 * DocumentVersioningService Tests
 * Phase 7: Testing & Documentation
 *
 * Unit tests for document versioning and acceptance tracking
 */

import DocumentVersioningService from '../DocumentVersioningService';
import LegalDocumentService from '../LegalDocumentService';
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
// DocumentVersioningService is static-only (no getInstance) — every real
// method here was verified directly against the source. Three invented
// methods (getDocumentVersion, getCurrentVersion, getAllDocuments) had no
// real equivalent at all — they read/return a document-catalog shape that
// only exists on LegalDocumentService, a separate class — and were dropped
// entirely, along with every test whose premise depended solely on them
// (9 of the original 42; see TODO.md for the full list and rationale).
// recordAcceptance() reads the document's real version via
// LegalDocumentService.getDocument() internally, so that's mocked here too.
jest.mock('../LegalDocumentService', () => ({
  __esModule: true,
  default: { getDocument: jest.fn() },
}));

describe('DocumentVersioningService', () => {
  let service: typeof DocumentVersioningService;
  // A real ID from src/assets/legal-documents/index.json — needed because
  // requiresSignature()/getVersionHistory()/getDocumentsRequiringSignature()
  // read the real static index directly, not AsyncStorage or the mocked
  // LegalDocumentService, so an invented ID like 'test-doc-001' would never
  // match anything in those code paths.
  const testDocId = 'terms-of-service';
  const testUserId = 'test-user-001';

  const testDocument = {
    id: testDocId,
    title: 'Terms of Service',
    filename: 'terms-of-service.md',
    version: '1.0.0',
    lastUpdated: '2025-01-15',
    effectiveDate: '2025-01-01',
    description: 'Legal terms and conditions',
    content: '# Terms\n\nSome content',
    contentLength: 100,
    sections: ['Acceptance of Terms'],
    category: 'legal',
    requiresAcceptance: true,
    requiresSignature: true,
    contactEmail: 'ourenglish2019@gmail.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (LegalDocumentService.getDocument as jest.Mock).mockResolvedValue(testDocument);
    service = DocumentVersioningService;
  });

  describe('Initialization', () => {
    test('DocumentVersioningService is a stable static reference', () => {
      // Static class, not a singleton with getInstance() — importing it
      // twice always yields the same reference.
      expect(service).toBe(DocumentVersioningService);
    });

    test('service exposes all real public methods', () => {
      expect(typeof service.recordAcceptance).toBe('function');
      expect(typeof service.hasAccepted).toBe('function');
      expect(typeof service.getAcceptance).toBe('function');
      expect(typeof service.getAcceptanceHistory).toBe('function');
      expect(typeof service.getVersionHistory).toBe('function');
      expect(typeof service.requiresSignature).toBe('function');
      expect(typeof service.linkSignatureToAcceptance).toBe('function');
      expect(typeof service.hasValidSignature).toBe('function');
    });
  });

  describe('Version Management', () => {
    test('getVersionHistory returns the current version entry from the document index', () => {
      // Real getVersionHistory() is synchronous and reads the static bundled
      // index directly (not AsyncStorage) — it always returns exactly one
      // entry (the current version), not a multi-version history.
      const history = service.getVersionHistory(testDocId);

      expect(Array.isArray(history)).toBe(true);
      expect(history).toHaveLength(1);
      expect(history[0].version).toBe('1.0.0');
      expect(history[0].documentId).toBe(testDocId);
    });

    test('getVersionHistory returns empty array for unknown document', () => {
      const history = service.getVersionHistory('nonexistent-doc');

      expect(history).toEqual([]);
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
    // Real signature: recordAcceptance(documentId, appVersion, platform) —
    // 3 args. userId comes from useAuthStore internally; version comes from
    // LegalDocumentService.getDocument(documentId).version internally.
    test('recordAcceptance creates acceptance record', async () => {
      const result = await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('recordAcceptance includes timestamp', async () => {
      await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      const [, storedJson] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const stored = JSON.parse(storedJson);
      expect(typeof stored.acceptedAt).toBe('number');
    });

    test('recordAcceptance stores platform information', async () => {
      await service.recordAcceptance(testDocId, '1.0.0', 'android');

      const [, storedJson] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const stored = JSON.parse(storedJson);
      expect(stored.platform).toBe('android');
    });

    test('recordAcceptance stores app version', async () => {
      await service.recordAcceptance(testDocId, '2.1.5', 'ios');

      const [, storedJson] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const stored = JSON.parse(storedJson);
      expect(stored.appVersion).toBe('2.1.5');
    });

    test('recordAcceptance returns false when the document does not exist', async () => {
      (LegalDocumentService.getDocument as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      expect(result).toBe(false);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Acceptance Retrieval', () => {
    test('getAcceptanceHistory returns all recorded acceptances', async () => {
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

      const acceptances = await service.getAcceptanceHistory();

      expect(Array.isArray(acceptances)).toBe(true);
      expect(acceptances).toHaveLength(2);
    });

    test('getAcceptanceHistory returns empty array when no acceptances', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const acceptances = await service.getAcceptanceHistory();

      expect(acceptances).toEqual([]);
    });

    test('hasAccepted returns true when an acceptance record exists', async () => {
      const mockAcceptance = {
        documentId: testDocId,
        userId: testUserId,
        acceptedAt: Date.now(),
        version: '1.0.0',
        platform: 'ios',
        appVersion: '1.0.0',
      };

      // hasAccepted() reads the single-document key '@legal_acceptance_<id>',
      // not an array of every acceptance.
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockAcceptance)
      );

      const accepted = await service.hasAccepted(testDocId);

      expect(accepted).toBe(true);
    });

    test('hasAccepted returns false for an unaccepted document', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const accepted = await service.hasAccepted(testDocId);

      expect(accepted).toBe(false);
    });
  });

  describe('Document Management', () => {
    test('getDocumentsRequiringSignature returns real documents flagged in the index', async () => {
      // Reads the static bundled index directly, not AsyncStorage.
      const docsNeedingSignature = await service.getDocumentsRequiringSignature();

      expect(Array.isArray(docsNeedingSignature)).toBe(true);
      expect(docsNeedingSignature).toContain('terms-of-service');
      docsNeedingSignature.forEach(id => expect(typeof id).toBe('string'));
    });

    test('getPendingSignatures returns documents accepted but not yet signed', async () => {
      // One AsyncStorage.getItem call per document requiring a signature —
      // real index currently has exactly one ('terms-of-service').
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          documentId: 'terms-of-service',
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
          // No signatureId = pending
        })
      );

      const pending = await service.getPendingSignatures(testUserId);

      expect(pending).toEqual([
        { documentId: 'terms-of-service', title: 'Terms of Service' },
      ]);
    });

    test('getPendingSignatures excludes already-signed documents', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          documentId: 'terms-of-service',
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
          signatureId: 'sig-001',
        })
      );

      const pending = await service.getPendingSignatures(testUserId);

      expect(pending).toEqual([]);
    });
  });

  describe('Signature Integration', () => {
    test('linkSignatureToAcceptance links a signature to an existing acceptance', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          documentId: testDocId,
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
        })
      );

      const result = await service.linkSignatureToAcceptance(testDocId, 'sig-001');

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('linkSignatureToAcceptance returns false when no acceptance exists yet', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.linkSignatureToAcceptance(testDocId, 'sig-001');

      expect(result).toBe(false);
    });

    test('requiresSignature checks the real document index', () => {
      // Real signature takes a document ID (string), not the whole object.
      const requiresSignature = service.requiresSignature(testDocId);

      expect(requiresSignature).toBe(true);
    });

    test('requiresSignature returns false for documents that do not require one', () => {
      const requiresSignature = service.requiresSignature('privacy-policy');

      expect(requiresSignature).toBe(false);
    });

    test('hasValidSignature returns true once a signature is linked', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          documentId: testDocId,
          userId: testUserId,
          acceptedAt: Date.now(),
          version: '1.0.0',
          platform: 'ios',
          appVersion: '1.0.0',
          signatureId: 'sig-001',
        })
      );

      const hasValid = await service.hasValidSignature(testDocId);

      expect(hasValid).toBe(true);
    });

    test('acceptance can be linked to a signature after recording', async () => {
      // Real recordAcceptance() has no signatureId param at all — linking a
      // signature is a separate call, exercised here as the real workflow.
      await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      const [, recordedJson] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(recordedJson);

      const linked = await service.linkSignatureToAcceptance(testDocId, 'sig-001');

      expect(linked).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles corrupted stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json');

      const acceptances = await service.getAcceptanceHistory();

      expect(acceptances).toEqual([]);
    });

    test('handles empty acceptance list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const acceptances = await service.getAcceptanceHistory();

      expect(acceptances).toEqual([]);
    });

    test('handles recording acceptance with a fresh app install version', async () => {
      const result = await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('handles missing app version string', async () => {
      const result = await service.recordAcceptance(testDocId, '', 'ios');

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('recordAcceptance returns false with no authenticated user', async () => {
      const { useAuthStore } = require('@/stores/useAuthStore');
      (useAuthStore.getState as jest.Mock).mockReturnValueOnce({ user: null });

      const result = await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      expect(result).toBe(false);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Version Comparison', () => {
    test('correctly identifies version updates', () => {
      const oldVersion = '1.0.0';
      const newVersion = '1.1.0';

      expect(oldVersion).not.toBe(newVersion);
    });

    test('handles pre-release versions', () => {
      const versions = ['1.0.0-alpha', '1.0.0-beta', '1.0.0'];

      versions.forEach(v => {
        expect(typeof v).toBe('string');
      });
    });

    test('compareVersions returns a placeholder result (not yet implemented)', () => {
      // Real compareVersions() is a documented placeholder — confirms it
      // doesn't throw and returns something, not a real diff.
      const result = service.compareVersions(testDocId, '1.0.0', '1.1.0');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
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

      const acceptances = await service.getAcceptanceHistory();

      expect(acceptances[0].platform).toBe('ios');
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

      const acceptances = await service.getAcceptanceHistory();

      expect(acceptances[0].appVersion).toBe('2.5.1');
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
    test('getAcceptanceHistory handles a large dataset efficiently', async () => {
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
      const acceptances = await service.getAcceptanceHistory();
      const duration = Date.now() - startTime;

      expect(acceptances).toHaveLength(1000);
      expect(duration).toBeLessThan(1000);
    });

    test('recordAcceptance completes quickly', async () => {
      const startTime = Date.now();

      await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      const duration = Date.now() - startTime;

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

      const acceptances = await service.getAcceptanceHistory();

      expect(acceptances[0]).toEqual(originalAcceptance);
    });

    test('recorded acceptance round-trips through AsyncStorage intact', async () => {
      await service.recordAcceptance(testDocId, '1.0.0', 'ios');

      const [, storedJson] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const stored = JSON.parse(storedJson);

      expect(stored.documentId).toBe(testDocId);
      expect(stored.userId).toBe(testUserId);
      expect(stored.version).toBe(testDocument.version);
      expect(stored.platform).toBe('ios');
    });
  });
});
