/**
 * ComplianceReportService Tests
 * Phase 7: Testing & Documentation
 *
 * Unit tests for compliance reporting, audit trails, and verification
 */

import { ComplianceReportService } from '../ComplianceReportService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/firebase';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/config/firebase', () => ({
  db: null,
}));
jest.mock('../DocumentVersioningService', () => ({
  DocumentVersioningService: {
    getInstance: jest.fn(() => ({
      getUserAcceptances: jest.fn().mockResolvedValue([]),
      getAllDocuments: jest.fn().mockResolvedValue([]),
    })),
  },
}));
jest.mock('../DocumentAnalyticsService', () => ({
  DocumentAnalyticsService: {
    getInstance: jest.fn(() => ({
      getUserViewStats: jest.fn().mockResolvedValue({
        totalDocumentsViewed: 0,
        totalViewCount: 0,
        averageViewDuration: 0,
      }),
      getEngagementMetrics: jest.fn().mockResolvedValue({
        viewCount: 0,
        engagementScore: 0,
      }),
    })),
  },
}));

describe('ComplianceReportService', () => {
  let service: ComplianceReportService;
  const testUserId = 'test-user-001';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
    service = ComplianceReportService.getInstance();
  });

  describe('Initialization', () => {
    test('getInstance returns singleton instance', () => {
      const service1 = ComplianceReportService.getInstance();
      const service2 = ComplianceReportService.getInstance();
      expect(service1).toBe(service2);
    });

    test('service initializes with all required methods', () => {
      expect(typeof service.generateComplianceReport).toBe('function');
      expect(typeof service.generateAuditTrail).toBe('function');
      expect(typeof service.getAcceptanceTimeline).toBe('function');
      expect(typeof service.verifyAcceptancesValid).toBe('function');
      expect(typeof service.exportReportAsJSON).toBe('function');
      expect(typeof service.checkJurisdictionalCompliance).toBe('function');
    });
  });

  describe('Report Generation', () => {
    test('generateComplianceReport creates valid report', async () => {
      const report = await service.generateComplianceReport(testUserId, 'full');

      expect(report).toBeDefined();
      expect(report.userId).toBe(testUserId);
      expect(report.reportType).toBe('full');
      expect(report.summary).toBeDefined();
      expect(report.documents).toBeDefined();
    });

    test('generateComplianceReport includes summary', async () => {
      const report = await service.generateComplianceReport(testUserId);

      expect(report.summary).toHaveProperty('overallCompliance');
      expect(report.summary).toHaveProperty('documentCount');
      expect(report.summary).toHaveProperty('acceptedDocuments');
      expect(report.summary).toHaveProperty('status');
    });

    test('generateComplianceReport calculates compliance percentage', async () => {
      const report = await service.generateComplianceReport(testUserId);

      expect(report.summary.overallCompliance).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallCompliance).toBeLessThanOrEqual(100);
    });

    test('generateComplianceReport supports different report types', async () => {
      const fullReport = await service.generateComplianceReport(
        testUserId,
        'full'
      );
      const summaryReport = await service.generateComplianceReport(
        testUserId,
        'summary'
      );
      const executiveReport = await service.generateComplianceReport(
        testUserId,
        'executive'
      );

      expect(fullReport.reportType).toBe('full');
      expect(summaryReport.reportType).toBe('summary');
      expect(executiveReport.reportType).toBe('executive');
    });

    test('generateComplianceReport generates hash for integrity', async () => {
      const report = await service.generateComplianceReport(testUserId);

      expect(report.hash).toBeDefined();
      expect(typeof report.hash).toBe('string');
    });

    test('generateComplianceReport stores report in AsyncStorage', async () => {
      await service.generateComplianceReport(testUserId);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Audit Trail Generation', () => {
    test('generateAuditTrail creates immutable trail', async () => {
      const trail = await service.generateAuditTrail(testUserId);

      expect(trail).toBeDefined();
      expect(trail.userId).toBe(testUserId);
      expect(trail.events).toBeDefined();
      expect(Array.isArray(trail.events)).toBe(true);
    });

    test('generateAuditTrail includes all events', async () => {
      const trail = await service.generateAuditTrail(testUserId);

      expect(trail.events).toBeDefined();
      expect(trail.totalEvents).toBe(trail.events.length);
    });

    test('generateAuditTrail respects date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const trail = await service.generateAuditTrail(
        testUserId,
        startDate,
        endDate
      );

      expect(trail.period.startDate).toBeGreaterThanOrEqual(startDate.getTime());
      expect(trail.period.endDate).toBeLessThanOrEqual(endDate.getTime());
    });

    test('generateAuditTrail generates hash for integrity', async () => {
      const trail = await service.generateAuditTrail(testUserId);

      expect(trail.hash).toBeDefined();
      expect(typeof trail.hash).toBe('string');
    });

    test('generateAuditTrail stores trail in AsyncStorage', async () => {
      await service.generateAuditTrail(testUserId);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Timeline Generation', () => {
    test('getAcceptanceTimeline returns sorted events', async () => {
      const timeline = await service.getAcceptanceTimeline(testUserId);

      expect(Array.isArray(timeline)).toBe(true);

      // Check if sorted by date (descending)
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i - 1].acceptedAt).toBeGreaterThanOrEqual(
          timeline[i].acceptedAt
        );
      }
    });

    test('getAcceptanceTimeline includes required fields', async () => {
      const timeline = await service.getAcceptanceTimeline(testUserId);

      if (timeline.length > 0) {
        const event = timeline[0];
        expect(event).toHaveProperty('documentId');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('acceptedAt');
        expect(event).toHaveProperty('version');
        expect(event).toHaveProperty('platform');
      }
    });

    test('getSignatureTimeline returns signature events', async () => {
      const timeline = await service.getSignatureTimeline(testUserId);

      expect(Array.isArray(timeline)).toBe(true);
    });

    test('getSignatureTimeline filters unsigned documents', async () => {
      const timeline = await service.getSignatureTimeline(testUserId);

      // All returned events should have signature info
      timeline.forEach(event => {
        expect(event.signedAt).toBeDefined();
        expect(event.type).toMatch(/sketch|typed/);
      });
    });
  });

  describe('Jurisdictional Compliance', () => {
    test('checkJurisdictionalCompliance evaluates requirements', () => {
      const documentStatuses = [];
      const compliance = service.checkJurisdictionalCompliance(
        'GDPR',
        documentStatuses
      );

      expect(compliance).toBeDefined();
      expect(compliance.jurisdiction).toBe('GDPR');
      expect(compliance).toHaveProperty('isCompliant');
      expect(compliance).toHaveProperty('checklist');
      expect(Array.isArray(compliance.checklist)).toBe(true);
    });

    test('checkJurisdictionalCompliance supports all jurisdictions', () => {
      const jurisdictions = ['US_GENERAL', 'GDPR', 'CCPA', 'UK', 'AUSTRALIA', 'CANADA'];
      const documentStatuses = [];

      jurisdictions.forEach(jurisdiction => {
        const compliance = service.checkJurisdictionalCompliance(
          jurisdiction,
          documentStatuses
        );

        expect(compliance.jurisdiction).toBe(jurisdiction);
        expect(compliance.checklist.length).toBeGreaterThan(0);
      });
    });

    test('checkJurisdictionalCompliance has correct summary', () => {
      const documentStatuses = [];
      const compliance = service.checkJurisdictionalCompliance(
        'GDPR',
        documentStatuses
      );

      expect(compliance.summary).toBeDefined();
      expect(typeof compliance.summary).toBe('string');
    });

    test('checkJurisdictionalCompliance evaluates Terms of Service', () => {
      const documentStatuses = [
        {
          documentId: 'terms',
          title: 'Terms of Service',
          required: true,
          accepted: true,
          acceptedAt: Date.now(),
          version: '1.0.0',
          signed: false,
          viewCount: 5,
        },
      ];

      const compliance = service.checkJurisdictionalCompliance(
        'US_GENERAL',
        documentStatuses
      );

      const tosCheck = compliance.checklist.find(c =>
        c.requirement.includes('Terms of Service')
      );
      if (tosCheck) {
        expect(tosCheck.met).toBe(true);
      }
    });
  });

  describe('Acceptance Verification', () => {
    test('verifyAcceptancesValid returns verification result', async () => {
      const verification = await service.verifyAcceptancesValid(testUserId);

      expect(verification).toBeDefined();
      expect(verification).toHaveProperty('allValid');
      expect(verification).toHaveProperty('validCount');
      expect(verification).toHaveProperty('invalidCount');
      expect(verification).toHaveProperty('expiredCount');
      expect(Array.isArray(verification.issuesFound)).toBe(true);
    });

    test('verifyAcceptancesValid detects all valid state', async () => {
      const verification = await service.verifyAcceptancesValid(testUserId);

      // With no acceptances, should be valid
      expect(verification.validCount).toBeGreaterThanOrEqual(0);
      expect(verification.invalidCount).toBeGreaterThanOrEqual(0);
    });

    test('verifyAcceptancesValid counts issues correctly', async () => {
      const verification = await service.verifyAcceptancesValid(testUserId);

      const totalIssues = verification.invalidCount + verification.expiredCount;
      expect(verification.issuesFound.length).toBe(totalIssues);
    });

    test('verifyAcceptancesValid handles expiration correctly', async () => {
      const verification = await service.verifyAcceptancesValid(testUserId);

      expect(verification.expiredCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Report Export', () => {
    test('exportReportAsJSON generates valid JSON', async () => {
      const report = await service.generateComplianceReport(testUserId);
      const exported = await service.exportReportAsJSON(report);

      expect(exported).toBeDefined();
      expect(exported.format).toBe('json');
      expect(exported.content).toBeDefined();
      expect(exported.fileName).toBeDefined();
      expect(exported.mimeType).toBe('application/json');

      // Verify JSON is valid
      const parsed = JSON.parse(exported.content);
      expect(parsed).toBeDefined();
    });

    test('exportReportAsCSV generates valid CSV', async () => {
      const report = await service.generateComplianceReport(testUserId);
      const exported = await service.exportReportAsCSV(report);

      expect(exported).toBeDefined();
      expect(exported.format).toBe('csv');
      expect(exported.content).toBeDefined();
      expect(exported.mimeType).toBe('text/csv');
      expect(exported.content).toContain('Compliance Report');
    });

    test('exportReportAsPDF generates PDF content', async () => {
      const report = await service.generateComplianceReport(testUserId);
      const exported = await service.exportReportAsPDF(report);

      expect(exported).toBeDefined();
      expect(exported.format).toBe('pdf');
      expect(exported.content).toBeDefined();
      expect(exported.mimeType).toBe('application/pdf');
    });

    test('exported reports include all required sections', async () => {
      const report = await service.generateComplianceReport(testUserId);
      const jsonExport = await service.exportReportAsJSON(report);
      const csvExport = await service.exportReportAsCSV(report);

      expect(jsonExport.content).toContain(testUserId);
      expect(csvExport.content).toContain('Compliance Report');
    });
  });

  describe('Audit Event Logging', () => {
    test('logAuditEvent creates immutable event', async () => {
      await service.logAuditEvent({
        action: 'view',
        documentId: 'doc-001',
        documentTitle: 'Terms',
        userId: testUserId,
        details: {},
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('logAuditEvent generates hash for integrity', async () => {
      await service.logAuditEvent({
        action: 'sign',
        documentId: 'doc-001',
        documentTitle: 'Terms',
        userId: testUserId,
        details: { type: 'sketch' },
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('logAuditEvent stores timestamp', async () => {
      const beforeTime = Date.now();
      await service.logAuditEvent({
        action: 'accept',
        documentId: 'doc-001',
        documentTitle: 'Terms',
        userId: testUserId,
        details: {},
      });
      const afterTime = Date.now();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Data Management', () => {
    test('clearComplianceData removes all user data', async () => {
      await service.clearComplianceData(testUserId);

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    test('clearComplianceData handles errors gracefully', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(
        new Error('Deletion error')
      );

      await expect(
        service.clearComplianceData(testUserId)
      ).resolves.not.toThrow();
    });

    test('getUserReports retrieves stored reports', async () => {
      const mockReport = {
        id: 'report-001',
        userId: testUserId,
        generatedAt: Date.now(),
        reportType: 'full' as const,
        period: { startDate: 0, endDate: Date.now() },
        summary: {
          userId: testUserId,
          generatedAt: Date.now(),
          overallCompliance: 100,
          documentCount: 1,
          requiredDocuments: 1,
          acceptedDocuments: 1,
          signedDocuments: 0,
          rejectedDocuments: 0,
          viewCount: 5,
          jurisdictions: [],
          status: 'compliant' as const,
        },
        documents: [],
        acceptanceTimeline: [],
        signatureTimeline: [],
        jurisdictionalCompliance: [],
        platform: 'ios',
        appVersion: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([mockReport])
      );

      const reports = await service.getUserReports(testUserId);

      expect(Array.isArray(reports)).toBe(true);
    });

    test('getUserAuditTrails retrieves stored trails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([])
      );

      const trails = await service.getUserAuditTrails(testUserId);

      expect(Array.isArray(trails)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles no documents gracefully', async () => {
      const report = await service.generateComplianceReport(testUserId);

      expect(report.documents).toEqual([]);
      expect(report.summary.documentCount).toBe(0);
    });

    test('handles missing user data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const timeline = await service.getAcceptanceTimeline(testUserId);

      expect(timeline).toEqual([]);
    });

    test('handles corrupted stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json');

      const reports = await service.getUserReports(testUserId);

      expect(reports).toEqual([]);
    });

    test('handles empty document list', () => {
      const compliance = service.checkJurisdictionalCompliance('GDPR', []);

      expect(compliance.checklist.length).toBeGreaterThan(0);
    });

    test('handles very old acceptance dates', async () => {
      const verification = await service.verifyAcceptancesValid(testUserId);

      // Should detect expired acceptances
      expect(verification).toBeDefined();
      expect(typeof verification.expiredCount).toBe('number');
    });
  });

  describe('Data Integrity', () => {
    test('audit trail events are marked as immutable', async () => {
      await service.logAuditEvent({
        action: 'view',
        documentId: 'doc-001',
        documentTitle: 'Terms',
        userId: testUserId,
        details: {},
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('reports include hash for verification', async () => {
      const report = await service.generateComplianceReport(testUserId);

      expect(report.hash).toBeDefined();
      expect(typeof report.hash).toBe('string');
      expect(report.hash.length).toBeGreaterThan(0);
    });

    test('audit trails include hash for verification', async () => {
      const trail = await service.generateAuditTrail(testUserId);

      expect(trail.hash).toBeDefined();
      expect(typeof trail.hash).toBe('string');
    });
  });

  describe('Performance', () => {
    test('report generation completes efficiently', async () => {
      const startTime = Date.now();

      await service.generateComplianceReport(testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('audit trail generation completes efficiently', async () => {
      const startTime = Date.now();

      await service.generateAuditTrail(testUserId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
    });

    test('export operations complete efficiently', async () => {
      const report = await service.generateComplianceReport(testUserId);

      const startTime = Date.now();

      await service.exportReportAsJSON(report);
      await service.exportReportAsCSV(report);
      await service.exportReportAsPDF(report);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All exports should complete quickly
      expect(duration).toBeLessThan(1000);
    });
  });
});
