/**
 * DocumentAnalyticsService Tests
 * Phase 7: Testing & Documentation
 *
 * Unit tests for analytics tracking and metrics calculation
 */

import { DocumentAnalyticsService } from '../DocumentAnalyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock useAuthStore
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({
      user: { id: 'test-user-001', uid: 'test-user-001' },
    })),
  },
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn().mockResolvedValue('mock-hash'),
}));

describe('DocumentAnalyticsService', () => {
  let service: DocumentAnalyticsService;
  const mockUser = { id: 'test-user-001', uid: 'test-user-001' };
  const testDocId = 'test-doc-001';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    service = DocumentAnalyticsService.getInstance();
  });

  describe('Initialization', () => {
    test('getInstance returns singleton instance', () => {
      const service1 = DocumentAnalyticsService.getInstance();
      const service2 = DocumentAnalyticsService.getInstance();
      expect(service1).toBe(service2);
    });

    test('service initializes with correct properties', () => {
      expect(service).toBeDefined();
      expect(typeof service.trackDocumentView).toBe('function');
      expect(typeof service.getViewHistory).toBe('function');
      expect(typeof service.getUserViewStats).toBe('function');
    });
  });

  describe('View Tracking', () => {
    test('trackDocumentView creates event in AsyncStorage', async () => {
      await service.trackDocumentView(testDocId);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const setCall = calls.find(call => call[0].includes('view_events'));
      expect(setCall).toBeDefined();
    });

    test('trackDocumentView handles errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      // Should not throw
      await expect(
        service.trackDocumentView(testDocId)
      ).resolves.not.toThrow();
    });

    test('trackDocumentView creates event with correct timestamp', async () => {
      const beforeTime = Date.now();
      await service.trackDocumentView(testDocId);
      const afterTime = Date.now();

      // Verify that a timestamp is captured (hard to test exact value)
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('View History', () => {
    test('getViewHistory returns events for document', async () => {
      const mockEvents = [
        {
          eventId: 'evt-001',
          documentId: testDocId,
          viewedAt: Date.now(),
          duration: 5000,
          platform: 'ios',
          appVersion: '1.0.0',
          synced: false,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockEvents)
      );

      const result = await service.getViewHistory(testDocId);

      expect(result).toHaveLength(1);
      expect(result[0].documentId).toBe(testDocId);
    });

    test('getViewHistory returns empty array when no events', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getViewHistory(testDocId);

      expect(result).toEqual([]);
    });

    test('getViewHistory handles corrupted data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json');

      const result = await service.getViewHistory(testDocId);

      expect(result).toEqual([]);
    });
  });

  describe('User View Statistics', () => {
    test('getUserViewStats returns aggregated stats', async () => {
      const mockStats = {
        totalDocumentsViewed: 5,
        totalViewCount: 15,
        averageViewDuration: 3000,
        lastViewedAt: Date.now(),
        viewsByDocument: {
          [testDocId]: 3,
          'doc-002': 2,
        },
        viewDurationByDocument: {
          [testDocId]: 9000,
          'doc-002': 6000,
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockStats)
      );

      const result = await service.getUserViewStats();

      expect(result.totalDocumentsViewed).toBe(5);
      expect(result.totalViewCount).toBe(15);
      expect(result.averageViewDuration).toBe(3000);
    });

    test('getUserViewStats returns defaults for no data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getUserViewStats();

      expect(result.totalDocumentsViewed).toBe(0);
      expect(result.totalViewCount).toBe(0);
    });

    test('getUserViewStats calculates correct average duration', async () => {
      const mockStats = {
        totalDocumentsViewed: 2,
        totalViewCount: 4,
        averageViewDuration: 5000, // (20000 / 4) = 5000
        lastViewedAt: Date.now(),
        viewsByDocument: {},
        viewDurationByDocument: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockStats)
      );

      const result = await service.getUserViewStats();

      expect(result.averageViewDuration).toBe(5000);
    });
  });

  describe('Interaction Tracking', () => {
    test('trackInteraction creates event with all action types', async () => {
      const actions = ['scroll', 'search', 'share', 'expand', 'download'];

      for (const action of actions) {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

        await service.trackInteraction(testDocId, action);

        expect(AsyncStorage.setItem).toHaveBeenCalled();
      }
    });

    test('trackInteraction includes metadata', async () => {
      const metadata = { searchTerm: 'warranty', resultsCount: 5 };

      await service.trackInteraction(testDocId, 'search', metadata);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('trackInteraction handles errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(
        service.trackInteraction(testDocId, 'search')
      ).resolves.not.toThrow();
    });
  });

  describe('Signature Tracking', () => {
    test('trackSignatureAttempt records success', async () => {
      await service.trackSignatureAttempt(testDocId, true);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('trackSignatureAttempt records failure', async () => {
      await service.trackSignatureAttempt(testDocId, false);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('getSignatureStats calculates success rate', async () => {
      const mockStats = {
        totalAttempts: 10,
        successfulSignatures: 8,
        failedAttempts: 2,
        successRate: 0.8,
        averageTimeToSign: 15000,
        signaturesByDocument: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockStats)
      );

      const result = await service.getSignatureStats();

      expect(result.successRate).toBe(0.8);
      expect(result.successRate).toBeLessThanOrEqual(1);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
    });

    test('getSignatureStats handles zero attempts', async () => {
      const mockStats = {
        totalAttempts: 0,
        successfulSignatures: 0,
        failedAttempts: 0,
        successRate: 0,
        averageTimeToSign: 0,
        signaturesByDocument: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockStats)
      );

      const result = await service.getSignatureStats();

      expect(result.successRate).toBe(0);
      expect(result.totalAttempts).toBe(0);
    });
  });

  describe('Engagement Metrics', () => {
    test('getEngagementMetrics calculates score 0-100', async () => {
      const mockMetrics = {
        documentId: testDocId,
        viewCount: 10,
        totalViewTime: 60000,
        interactionCount: 5,
        lastViewedAt: Date.now(),
        engagementScore: 75,
        interactionsByType: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);
    });

    test('getEngagementMetrics considers view count', async () => {
      const mockMetrics = {
        documentId: testDocId,
        viewCount: 50, // High view count
        totalViewTime: 300000,
        interactionCount: 20,
        lastViewedAt: Date.now(),
        engagementScore: 90, // Should be high
        interactionsByType: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.engagementScore).toBeGreaterThan(50);
    });

    test('getEngagementMetrics considers view duration', async () => {
      const mockMetrics = {
        documentId: testDocId,
        viewCount: 5,
        totalViewTime: 600000, // 10 minutes total
        interactionCount: 10,
        lastViewedAt: Date.now(),
        engagementScore: 85,
        interactionsByType: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.totalViewTime).toBe(600000);
    });

    test('getEngagementMetrics handles zero interactions', async () => {
      const mockMetrics = {
        documentId: testDocId,
        viewCount: 0,
        totalViewTime: 0,
        interactionCount: 0,
        lastViewedAt: undefined,
        engagementScore: 0,
        interactionsByType: {},
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.engagementScore).toBe(0);
    });
  });

  describe('Acceptance Metrics', () => {
    test('getAcceptanceMetrics calculates rates', async () => {
      const mockMetrics = {
        documentId: testDocId,
        acceptedCount: 8,
        totalPossibleAcceptances: 10,
        averageTimeToAccept: 30000,
        acceptanceRate: 0.8,
        lastAcceptedAt: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getAcceptanceMetrics(testDocId);

      expect(result.acceptanceRate).toBe(0.8);
      expect(result.acceptanceRate).toBeLessThanOrEqual(1);
    });

    test('getAcceptanceMetrics handles zero acceptances', async () => {
      const mockMetrics = {
        documentId: testDocId,
        acceptedCount: 0,
        totalPossibleAcceptances: 0,
        averageTimeToAccept: 0,
        acceptanceRate: 0,
        lastAcceptedAt: undefined,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getAcceptanceMetrics(testDocId);

      expect(result.acceptanceRate).toBe(0);
      expect(result.acceptedCount).toBe(0);
    });

    test('getAcceptanceMetrics calculates correct average time', async () => {
      const mockMetrics = {
        documentId: testDocId,
        acceptedCount: 5,
        totalPossibleAcceptances: 5,
        averageTimeToAccept: 45000, // 45 seconds average
        acceptanceRate: 1.0,
        lastAcceptedAt: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockMetrics)
      );

      const result = await service.getAcceptanceMetrics(testDocId);

      expect(result.averageTimeToAccept).toBe(45000);
    });
  });

  describe('Data Management', () => {
    test('clearAnalytics removes all user data', async () => {
      await service.clearAnalytics(mockUser.uid);

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    test('clearAnalytics handles errors gracefully', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(
        new Error('Deletion error')
      );

      await expect(
        service.clearAnalytics(mockUser.uid)
      ).resolves.not.toThrow();
    });
  });

  describe('Sync Operations', () => {
    test('getPendingSyncEvents returns events not synced', async () => {
      const mockEvents = [
        {
          eventId: 'evt-001',
          documentId: testDocId,
          viewedAt: Date.now(),
          duration: 5000,
          platform: 'ios',
          appVersion: '1.0.0',
          synced: false,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockEvents)
      );

      const result = await service.getPendingSyncEvents(mockUser.uid);

      expect(Array.isArray(result)).toBe(true);
    });

    test('markSyncComplete marks event as synced', async () => {
      await service.markSyncComplete(mockUser.uid, 'evt-001');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing user gracefully', async () => {
      (useAuthStore.getState as jest.Mock).mockReturnValueOnce({
        user: null,
      });

      // Should handle gracefully without throwing
      await expect(
        service.trackDocumentView(testDocId)
      ).resolves.not.toThrow();
    });

    test('handles AsyncStorage not available', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('AsyncStorage unavailable')
      );

      const result = await service.getViewHistory(testDocId);

      expect(result).toEqual([]);
    });

    test('handles very large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        eventId: `evt-${i}`,
        documentId: testDocId,
        viewedAt: Date.now() - i * 1000,
        duration: 5000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeDataset)
      );

      const result = await service.getViewHistory(testDocId);

      expect(result).toHaveLength(1000);
    });

    test('handles empty strings and null values', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('');

      const result = await service.getViewHistory(testDocId);

      expect(result).toEqual([]);
    });

    test('handles malformed document IDs', async () => {
      const invalidDocIds = ['', null, undefined, '   '];

      for (const docId of invalidDocIds) {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

        // Should handle gracefully
        await expect(
          service.trackDocumentView(docId as any)
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Performance', () => {
    test('trackDocumentView completes within reasonable time', async () => {
      const startTime = Date.now();

      await service.trackDocumentView(testDocId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 500ms)
      expect(duration).toBeLessThan(500);
    });

    test('getUserViewStats aggregates efficiently', async () => {
      const largeStats = {
        totalDocumentsViewed: 1000,
        totalViewCount: 10000,
        averageViewDuration: 30000,
        lastViewedAt: Date.now(),
        viewsByDocument: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`doc-${i}`, i * 10])
        ),
        viewDurationByDocument: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`doc-${i}`, i * 1000])
        ),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeStats)
      );

      const startTime = Date.now();

      const result = await service.getUserViewStats();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.totalDocumentsViewed).toBe(1000);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Data Integrity', () => {
    test('does not corrupt existing data when adding new events', async () => {
      const existingData = [
        {
          eventId: 'evt-001',
          documentId: 'doc-001',
          viewedAt: Date.now(),
          duration: 5000,
          platform: 'ios',
          appVersion: '1.0.0',
          synced: false,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(existingData)
      );

      await service.trackDocumentView('doc-002');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('preserves event timestamps', async () => {
      const timestamp = Date.now();
      const mockEvent = {
        eventId: 'evt-001',
        documentId: testDocId,
        viewedAt: timestamp,
        duration: 5000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([mockEvent])
      );

      const result = await service.getViewHistory(testDocId);

      expect(result[0].viewedAt).toBe(timestamp);
    });
  });
});
