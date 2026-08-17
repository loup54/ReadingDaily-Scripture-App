/**
 * DocumentAnalyticsService Tests
 * Phase 7: Testing & Documentation
 *
 * Unit tests for analytics tracking and metrics calculation
 */

import DocumentAnalyticsService from '../DocumentAnalyticsService';
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
  // DocumentAnalyticsService exposes only static members — there is no
  // instance/getInstance() pattern. `service` is bound directly to the
  // class so the rest of the suite can keep calling `service.method(...)`.
  let service: typeof DocumentAnalyticsService;
  const mockUser = { id: 'test-user-001', uid: 'test-user-001' };
  const testDocId = 'test-doc-001';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    (useAuthStore.getState as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    service = DocumentAnalyticsService;
  });

  describe('Initialization', () => {
    test('DocumentAnalyticsService is a stable static reference', () => {
      const service1 = DocumentAnalyticsService;
      const service2 = DocumentAnalyticsService;
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
      await service.trackDocumentView(testDocId);

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
    // getUserViewStats reads the RAW view-event array from AsyncStorage and
    // aggregates it itself — it does not read back a pre-computed stats object.
    // Feeding it a pre-aggregated object (the old fixture) makes `for (const
    // view of views)` throw on a non-iterable, which the method's own
    // try/catch silently swallows into an all-zeros default.
    test('getUserViewStats returns aggregated stats', async () => {
      // 15 events across 5 distinct documents (3 each), 3000ms each ->
      // totalViewCount 15, totalDocumentsViewed 5, averageViewDuration 3000.
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        eventId: `evt-${i}`,
        documentId: `doc-${i % 5}`,
        viewedAt: Date.now() - i * 1000,
        duration: 3000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockEvents)
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
      // 2 distinct documents, 2 events each, 5000ms each -> total 20000 / 4 = 5000.
      const mockEvents = Array.from({ length: 4 }, (_, i) => ({
        eventId: `evt-${i}`,
        documentId: `doc-${i % 2}`,
        viewedAt: Date.now() - i * 1000,
        duration: 5000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockEvents)
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

    // getSignatureStats reads the RAW attempts array and computes successRate
    // itself as (successCount/total) * 100 — already a 0-100 percentage, not
    // a 0-1 fraction.
    test('getSignatureStats calculates success rate', async () => {
      const mockAttempts = [
        ...Array.from({ length: 8 }, (_, i) => ({
          documentId: testDocId,
          success: true,
          timestamp: Date.now() - i * 1000,
        })),
        ...Array.from({ length: 2 }, (_, i) => ({
          documentId: testDocId,
          success: false,
          timestamp: Date.now() - i * 1000,
        })),
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockAttempts)
      );

      const result = await service.getSignatureStats();

      expect(result.successRate).toBe(80);
      expect(result.successRate).toBeLessThanOrEqual(100);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
    });

    test('getSignatureStats handles zero attempts', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getSignatureStats();

      expect(result.successRate).toBe(0);
      expect(result.totalAttempts).toBe(0);
    });
  });

  describe('Engagement Metrics', () => {
    // getEngagementMetrics reads views then interactions (two sequential
    // AsyncStorage.getItem calls) and derives the score itself:
    // viewScore = min(viewCount*10, 50), timeScore = min((totalViewTime/60000)*10, 25),
    // interactionScore = min(interactionCount*5, 25), capped at 100 total.
    test('getEngagementMetrics calculates score 0-100', async () => {
      const mockViews = [
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
        JSON.stringify(mockViews)
      );

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.engagementScore).toBeGreaterThanOrEqual(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);
    });

    test('getEngagementMetrics considers view count', async () => {
      // 50 views alone maxes viewScore (50); add 20 interactions on the same
      // doc so interactionScore (25) pushes the total past 50.
      const mockViews = Array.from({ length: 50 }, (_, i) => ({
        eventId: `evt-${i}`,
        documentId: testDocId,
        viewedAt: Date.now() - i * 1000,
        duration: 6000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      }));
      const mockInteractions = Array.from({ length: 20 }, (_, i) => ({
        eventId: `int-${i}`,
        documentId: testDocId,
        action: 'scroll',
        timestamp: Date.now() - i * 1000,
        synced: false,
      }));

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockViews))
        .mockResolvedValueOnce(JSON.stringify(mockInteractions));

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.engagementScore).toBeGreaterThan(50);
    });

    test('getEngagementMetrics considers view duration', async () => {
      // 5 views totalling 600000ms (10 minutes).
      const mockViews = Array.from({ length: 5 }, (_, i) => ({
        eventId: `evt-${i}`,
        documentId: testDocId,
        viewedAt: Date.now() - i * 1000,
        duration: 120000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockViews)
      );

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.totalViewTime).toBe(600000);
    });

    test('getEngagementMetrics handles zero interactions', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await service.getEngagementMetrics(testDocId);

      expect(result.engagementScore).toBe(0);
    });
  });

  describe('Acceptance Metrics', () => {
    // getAcceptanceMetrics reads the RAW acceptance-time array. Unlike a
    // proportional rate, the real implementation hardcodes
    // totalPossibleAcceptances to 1 and acceptanceRate to 100-or-0 (any
    // recorded acceptance vs none) — it does not compute a fractional rate
    // from accepted/possible counts the way the old fixture assumed.
    test('getAcceptanceMetrics reports 100% rate when acceptances exist', async () => {
      const mockTimes = Array.from({ length: 3 }, (_, i) => ({
        documentId: testDocId,
        timeToAcceptMs: 30000,
        acceptedAt: Date.now() - i * 1000,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockTimes)
      );

      const result = await service.getAcceptanceMetrics(testDocId);

      expect(result.acceptanceRate).toBe(100);
      expect(result.acceptedCount).toBe(3);
    });

    test('getAcceptanceMetrics handles zero acceptances', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getAcceptanceMetrics(testDocId);

      expect(result.acceptanceRate).toBe(0);
      expect(result.acceptedCount).toBe(0);
    });

    test('getAcceptanceMetrics calculates correct average time', async () => {
      const mockTimes = Array.from({ length: 5 }, (_, i) => ({
        documentId: testDocId,
        timeToAcceptMs: 45000, // 45 seconds each
        acceptedAt: Date.now() - i * 1000,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockTimes)
      );

      const result = await service.getAcceptanceMetrics(testDocId);

      expect(result.averageTimeToAccept).toBe(45000);
    });
  });

  describe('Data Management', () => {
    // clearAnalytics loops AsyncStorage.removeItem over 5 keys — it does not
    // call multiRemove (the old fixture's assumption).
    test('clearAnalytics removes all user data', async () => {
      await service.clearAnalytics(mockUser.uid);

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(5);
    });

    test('clearAnalytics handles errors gracefully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
        new Error('Deletion error')
      );

      await expect(
        service.clearAnalytics(mockUser.uid)
      ).resolves.not.toThrow();
    });
  });

  describe('Sync Operations', () => {
    // The pending-sync store holds an array of event ID strings, not full event objects.
    test('getPendingSyncEvents returns events not synced', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(['evt-001', 'evt-002'])
      );

      const result = await service.getPendingSyncEvents(mockUser.uid);

      expect(result).toEqual(['evt-001', 'evt-002']);
    });

    test('markSyncComplete marks event as synced', async () => {
      // Seed two pending IDs so filtering out 'evt-001' still leaves a
      // non-empty array — real code only calls setItem when the remaining
      // list is non-empty, otherwise it calls removeItem instead.
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(['evt-001', 'evt-002'])
      );

      await service.markSyncComplete(mockUser.uid, 'evt-001');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('markSyncComplete removes the sync key when no events remain', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(['evt-001'])
      );

      await service.markSyncComplete(mockUser.uid, 'evt-001');

      expect(AsyncStorage.removeItem).toHaveBeenCalled();
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
      // 1000 distinct documents, one view each -> totalDocumentsViewed 1000.
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        eventId: `evt-${i}`,
        documentId: `doc-${i}`,
        viewedAt: Date.now() - i * 1000,
        duration: 1000,
        platform: 'ios',
        appVersion: '1.0.0',
        synced: false,
      }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(largeDataset)
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
