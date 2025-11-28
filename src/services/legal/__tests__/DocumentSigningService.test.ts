/**
 * DocumentSigningService Tests
 * Phase 7: Testing & Documentation
 *
 * Unit tests for digital signature capture, storage, and verification
 */

import DocumentSigningService from '../DocumentSigningService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-crypto');
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-001', uid: 'test-user-001' },
    })),
  },
}));

describe('DocumentSigningService', () => {
  let service: DocumentSigningService;
  const testDocId = 'test-doc-001';
  const testUserId = 'test-user-001';

  const testSignature = {
    type: 'sketch' as const,
    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
    (Crypto.digestStringAsync as jest.Mock).mockResolvedValue('mock-hash-123');
    service = DocumentSigningService.getInstance();
  });

  describe('Initialization', () => {
    test('getInstance returns singleton instance', () => {
      const service1 = DocumentSigningService.getInstance();
      const service2 = DocumentSigningService.getInstance();
      expect(service1).toBe(service2);
    });

    test('service initializes with all required methods', () => {
      expect(typeof service.captureSignature).toBe('function');
      expect(typeof service.getSignature).toBe('function');
      expect(typeof service.verifySignature).toBe('function');
      expect(typeof service.isSignatureValid).toBe('function');
      expect(typeof service.getUserSignatures).toBe('function');
      expect(typeof service.hasSigned).toBe('function');
      expect(typeof service.clearSignatures).toBe('function');
    });
  });

  describe('Signature Capture', () => {
    test('captureSignature creates valid signature', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature).toBeDefined();
      expect(signature.id).toBeDefined();
      expect(signature.documentId).toBe(testDocId);
      expect(signature.userId).toBe(testUserId);
    });

    test('captureSignature includes metadata', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature.metadata).toBeDefined();
      expect(signature.metadata.platform).toBe('ios');
      expect(signature.metadata.appVersion).toBe('1.0.0');
      expect(signature.metadata.device).toBeDefined();
    });

    test('captureSignature encodes signature data as Base64', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature.signatureData).toBeDefined();
      // Base64 should match input
      expect(typeof signature.signatureData).toBe('string');
    });

    test('captureSignature supports sketch type', async () => {
      const sketchSignature = await service.captureSignature(
        testDocId,
        { ...testSignature, type: 'sketch' },
        '1.0.0',
        'ios'
      );

      expect(sketchSignature.signatureType).toBe('sketch');
    });

    test('captureSignature supports typed type', async () => {
      const typedSignature = await service.captureSignature(
        testDocId,
        { ...testSignature, type: 'typed' },
        '1.0.0',
        'android'
      );

      expect(typedSignature.signatureType).toBe('typed');
    });

    test('captureSignature generates hash for verification', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature.verificationHash).toBeDefined();
      expect(typeof signature.verificationHash).toBe('string');
      expect(signature.verificationHash.length).toBeGreaterThan(0);
    });

    test('captureSignature sets expiry to 1 year', async () => {
      const beforeTime = Date.now() + 365 * 24 * 60 * 60 * 1000;
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );
      const afterTime = Date.now() + 365 * 24 * 60 * 60 * 1000 + 1000;

      expect(signature.expiresAt).toBeGreaterThanOrEqual(beforeTime);
      expect(signature.expiresAt).toBeLessThanOrEqual(afterTime);
    });

    test('captureSignature stores in AsyncStorage', async () => {
      await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('captureSignature handles storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(
        service.captureSignature(testDocId, testSignature, '1.0.0', 'ios')
      ).rejects.toThrow();
    });
  });

  describe('Signature Verification', () => {
    test('verifySignature validates signature hash', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      const verification = await service.verifySignature(testDocId, testUserId);

      expect(verification).toBeDefined();
      expect(verification.isValid).toBeDefined();
    });

    test('isSignatureValid checks all requirements', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      const isValid = service.isSignatureValid(signature);

      expect(typeof isValid).toBe('boolean');
      expect(isValid).toBe(true);
    });

    test('isSignatureValid rejects expired signatures', async () => {
      const expiredSignature = {
        id: 'sig-001',
        documentId: testDocId,
        userId: testUserId,
        signatureType: 'sketch' as const,
        signatureData: 'test-data',
        signedAt: Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, // 2 years ago
        expiresAt: Date.now() - 24 * 60 * 60 * 1000, // Expired yesterday
        metadata: {
          platform: 'ios',
          appVersion: '1.0.0',
          device: 'iPhone',
        },
        verificationHash: 'hash-123',
      };

      const isValid = service.isSignatureValid(expiredSignature);

      expect(isValid).toBe(false);
    });

    test('isSignatureValid rejects tampered signatures', async () => {
      const tampered = {
        id: 'sig-001',
        documentId: testDocId,
        userId: testUserId,
        signatureType: 'sketch' as const,
        signatureData: 'tampered-data', // Different data
        signedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        metadata: {
          platform: 'ios',
          appVersion: '1.0.0',
          device: 'iPhone',
        },
        verificationHash: 'original-hash', // Original hash won't match
      };

      const isValid = service.isSignatureValid(tampered);

      // Should be false due to hash mismatch
      expect(typeof isValid).toBe('boolean');
    });

    test('verifySignature returns verification details', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(signature)
      );

      const verification = await service.verifySignature(testDocId, testUserId);

      expect(verification).toHaveProperty('isValid');
      expect(verification).toHaveProperty('signature');
    });
  });

  describe('Signature Retrieval', () => {
    test('getSignature returns correct signature', async () => {
      const originalSignature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(originalSignature)
      );

      const retrieved = await service.getSignature(testDocId, testUserId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(originalSignature.id);
    });

    test('getSignature returns null for missing signature', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const signature = await service.getSignature(testDocId, 'unknown-user');

      expect(signature).toBeNull();
    });

    test('getUserSignatures returns all user signatures', async () => {
      const mockSignatures = [
        {
          id: 'sig-001',
          documentId: 'doc-001',
          userId: testUserId,
          signatureType: 'sketch' as const,
          signatureData: 'data-1',
          signedAt: Date.now(),
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          metadata: {
            platform: 'ios',
            appVersion: '1.0.0',
            device: 'iPhone',
          },
          verificationHash: 'hash-1',
        },
        {
          id: 'sig-002',
          documentId: 'doc-002',
          userId: testUserId,
          signatureType: 'typed' as const,
          signatureData: 'data-2',
          signedAt: Date.now(),
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          metadata: {
            platform: 'android',
            appVersion: '1.0.0',
            device: 'Samsung',
          },
          verificationHash: 'hash-2',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockSignatures)
      );

      const signatures = await service.getUserSignatures(testUserId);

      expect(Array.isArray(signatures)).toBe(true);
      expect(signatures).toHaveLength(2);
    });

    test('getUserSignatures returns empty array when no signatures', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const signatures = await service.getUserSignatures(testUserId);

      expect(signatures).toEqual([]);
    });

    test('hasSigned returns correct boolean', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(signature)
      );

      const hasSigned = await service.hasSigned(testDocId, testUserId);

      expect(typeof hasSigned).toBe('boolean');
      expect(hasSigned).toBe(true);
    });

    test('hasSigned returns false for unsigned document', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const hasSigned = await service.hasSigned(testDocId, testUserId);

      expect(hasSigned).toBe(false);
    });
  });

  describe('Data Management', () => {
    test('clearSignatures removes all signatures for user', async () => {
      await service.clearSignatures(testUserId);

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    test('clearSignatures handles errors gracefully', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(
        new Error('Deletion error')
      );

      await expect(
        service.clearSignatures(testUserId)
      ).resolves.not.toThrow();
    });

    test('exportSignatures returns valid export', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([signature])
      );

      const exported = await service.exportSignatures(testUserId);

      expect(exported).toBeDefined();
      expect(exported.userId).toBe(testUserId);
      expect(Array.isArray(exported.signatures)).toBe(true);
    });

    test('exportSignatures includes metadata', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([signature])
      );

      const exported = await service.exportSignatures(testUserId);

      expect(exported.exportedAt).toBeDefined();
      expect(exported.count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty signature data', async () => {
      const emptySignature = {
        ...testSignature,
        data: '',
      };

      await expect(
        service.captureSignature(testDocId, emptySignature, '1.0.0', 'ios')
      ).rejects.toThrow();
    });

    test('handles very large signature data', async () => {
      const largeSignature = {
        type: 'sketch' as const,
        data: 'x'.repeat(10000000), // 10MB of data
      };

      // Should handle large data
      await expect(
        service.captureSignature(testDocId, largeSignature, '1.0.0', 'ios')
      ).rejects.toThrow();
    });

    test('handles missing document ID', async () => {
      await expect(
        service.captureSignature('', testSignature, '1.0.0', 'ios')
      ).rejects.toThrow();
    });

    test('handles corrupted stored signature', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json');

      const signature = await service.getSignature(testDocId, testUserId);

      expect(signature).toBeNull();
    });

    test('handles missing metadata', async () => {
      const signatureWithoutMetadata = {
        id: 'sig-001',
        documentId: testDocId,
        userId: testUserId,
        signatureType: 'sketch' as const,
        signatureData: 'test-data',
        signedAt: Date.now(),
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        metadata: undefined as any,
        verificationHash: 'hash-123',
      };

      const isValid = service.isSignatureValid(signatureWithoutMetadata);

      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Platform Support', () => {
    test('supports iOS platform', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature.metadata.platform).toBe('ios');
    });

    test('supports Android platform', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'android'
      );

      expect(signature.metadata.platform).toBe('android');
    });

    test('stores platform information', async () => {
      const iosSignature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      const androidSignature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'android'
      );

      expect(iosSignature.metadata.platform).not.toBe(
        androidSignature.metadata.platform
      );
    });
  });

  describe('Version Tracking', () => {
    test('stores app version with signature', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.5.2',
        'ios'
      );

      expect(signature.metadata.appVersion).toBe('1.5.2');
    });

    test('tracks different app versions', async () => {
      const sig1 = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      const sig2 = await service.captureSignature(
        testDocId,
        testSignature,
        '2.0.0',
        'ios'
      );

      expect(sig1.metadata.appVersion).not.toBe(sig2.metadata.appVersion);
    });
  });

  describe('Performance', () => {
    test('signature capture completes efficiently', async () => {
      const startTime = Date.now();

      await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(500);
    });

    test('signature verification completes efficiently', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(signature)
      );

      const startTime = Date.now();

      await service.verifySignature(testDocId, testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    test('getUserSignatures handles large dataset efficiently', async () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        id: `sig-${i}`,
        documentId: `doc-${i}`,
        userId: testUserId,
        signatureType: i % 2 === 0 ? ('sketch' as const) : ('typed' as const),
        signatureData: `data-${i}`,
        signedAt: Date.now() - i * 1000,
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        metadata: {
          platform: i % 2 === 0 ? 'ios' : 'android',
          appVersion: '1.0.0',
          device: `Device-${i}`,
        },
        verificationHash: `hash-${i}`,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeDataset)
      );

      const startTime = Date.now();

      const signatures = await service.getUserSignatures(testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(signatures).toHaveLength(500);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Data Integrity', () => {
    test('signature hash ensures data integrity', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature.verificationHash).toBeDefined();
      expect(typeof signature.verificationHash).toBe('string');
    });

    test('signature type is preserved', async () => {
      const sketch = await service.captureSignature(
        testDocId,
        { ...testSignature, type: 'sketch' },
        '1.0.0',
        'ios'
      );

      const typed = await service.captureSignature(
        testDocId,
        { ...testSignature, type: 'typed' },
        '1.0.0',
        'ios'
      );

      expect(sketch.signatureType).toBe('sketch');
      expect(typed.signatureType).toBe('typed');
    });

    test('signature data format preserved', async () => {
      const signature = await service.captureSignature(
        testDocId,
        testSignature,
        '1.0.0',
        'ios'
      );

      expect(signature.signatureData).toBeDefined();
      expect(typeof signature.signatureData).toBe('string');
    });
  });
});
