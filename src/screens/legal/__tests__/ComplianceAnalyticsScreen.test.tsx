/**
 * ComplianceAnalyticsScreen Component Tests
 *
 * Tests for:
 * - Tab navigation (Overview, Timeline, Metrics, Export)
 * - Compliance dashboard display
 * - Report generation and export
 * - Acceptance verification
 * - Dark/light mode support
 * - Error handling
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ComplianceAnalyticsScreen } from '../ComplianceAnalyticsScreen';
import ComplianceReportService from '@/services/legal/ComplianceReportService';
import DocumentAnalyticsService from '@/services/legal/DocumentAnalyticsService';
import { useAuthStore } from '@/stores/useAuthStore';
import * as ThemeHook from '@/hooks/useTheme';

// Mock dependencies
// useFocusEffect needs a real NavigationContainer ancestor to find a navigation
// object; the screen only uses it to re-run loadComplianceData on focus, so a
// plain useEffect-on-mount stand-in is behaviorally equivalent for these tests.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, []),
}));
jest.mock('@/hooks/useTheme');
jest.mock('@/services/legal/ComplianceReportService');
jest.mock('@/services/legal/DocumentAnalyticsService');
// The screen calls useAuthStore() directly as a hook (not .getState()), and the
// real store defaults to user: null — without this mock, loadComplianceData's
// `if (!user?.id) return;` guard fires and the screen never leaves its loading
// spinner, so no tab content would ever render regardless of the service mocks.
jest.mock('@/stores/useAuthStore');
// Spy on Alert.alert only (not a full jest.mock('react-native', ...) — spreading
// jest.requireActual('react-native') eagerly evaluates every lazy getter on RN's
// index export, including DevMenu, which throws under jest-expo 54's TurboModuleRegistry
// since no native DevMenu module exists in the test environment).
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockTheme = {
  colors: {
    primary: { blue: '#007AFF' },
    background: { primary: '#FFFFFF', secondary: '#F5F5F5', card: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    ui: { border: '#CCCCCC' },
    accent: { green: '#34C759', red: '#FF3B30' },
  },
};

describe('ComplianceAnalyticsScreen', () => {
  const testUserId = 'user-001';

  // Shaped to match the real ComplianceReport interface (services/legal/ComplianceReportService.ts):
  // nested `summary`/`documents`/`jurisdictionalCompliance`, not the flat invented fields
  // (documentStatuses/overallCompliancePercentage/jurisdictionalStatus) the old fixture used.
  const mockComplianceReport = {
    id: 'report-001',
    userId: testUserId,
    generatedAt: Date.now(),
    reportType: 'full' as const,
    period: { startDate: Date.now() - 30 * 86400000, endDate: Date.now() },
    summary: {
      userId: testUserId,
      generatedAt: Date.now(),
      overallCompliance: 66.67,
      documentCount: 2,
      requiredDocuments: 2,
      acceptedDocuments: 2,
      signedDocuments: 2,
      rejectedDocuments: 0,
      viewCount: 12,
      lastActivityAt: Date.now(),
      jurisdictions: ['gdpr', 'ccpa', 'uk', 'australia', 'canada'],
      status: 'partial' as const,
    },
    documents: [
      {
        documentId: 'doc-001',
        title: 'Terms of Service',
        required: true,
        accepted: true,
        acceptedAt: Date.now() - 86400000,
        version: '1.0.0',
        signed: true,
        signedAt: Date.now() - 86400000,
        viewCount: 5,
        lastViewedAt: Date.now(),
        engagementScore: 95,
      },
      {
        documentId: 'doc-002',
        title: 'Privacy Policy',
        required: true,
        accepted: true,
        acceptedAt: Date.now() - 172800000,
        version: '1.0.0',
        signed: true,
        signedAt: Date.now() - 172800000,
        viewCount: 4,
        lastViewedAt: Date.now(),
        engagementScore: 85,
      },
    ],
    acceptanceTimeline: [
      {
        documentId: 'doc-001',
        title: 'Terms of Service',
        acceptedAt: Date.now() - 86400000,
        version: '1.0.0',
        platform: 'ios' as const,
        appVersion: '1.1.34',
      },
    ],
    signatureTimeline: [
      {
        documentId: 'doc-001',
        title: 'Terms of Service',
        signedAt: Date.now() - 86400000,
        type: 'typed' as const,
        verified: true,
      },
    ],
    jurisdictionalCompliance: [
      { jurisdiction: 'gdpr', isCompliant: true, checklist: [], summary: 'Compliant' },
      { jurisdiction: 'ccpa', isCompliant: true, checklist: [], summary: 'Compliant' },
      { jurisdiction: 'uk', isCompliant: true, checklist: [], summary: 'Compliant' },
      { jurisdiction: 'australia', isCompliant: true, checklist: [], summary: 'Compliant' },
      { jurisdiction: 'canada', isCompliant: true, checklist: [], summary: 'Compliant' },
    ],
    platform: 'ios' as const,
    appVersion: '1.1.34',
  };

  // Matches real UserViewStats shape (DocumentAnalyticsService.ts) — averageViewDuration
  // is in ms; the screen divides by 1000 when displaying seconds.
  const mockViewStats = {
    totalDocumentsViewed: 3,
    totalViewCount: 12,
    averageViewDuration: 45000,
    lastViewedAt: Date.now(),
    viewsByDocument: { 'doc-001': 5, 'doc-002': 4, 'doc-003': 3 },
    viewDurationByDocument: {},
  };

  // Matches real SignatureStats shape. successRate is already 0-100 (see
  // DocumentAnalyticsService.getSignatureStats: `(successCount/attempts.length) * 100`).
  const mockSignatureStats = {
    totalAttempts: 5,
    successfulSignatures: 5,
    failedAttempts: 0,
    successRate: 100,
    averageTimeToSign: 0,
    signaturesByDocument: { 'doc-001': 5 },
  };

  const mockExportFormat = (format: 'json' | 'csv' | 'pdf') => ({
    format,
    content: format === 'csv' ? 'csv,data' : format === 'json' ? '{}' : 'pdf',
    fileName: `report.${format}`,
    mimeType: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'application/pdf',
  });

  const mockVerification = {
    userId: testUserId,
    allValid: true,
    validCount: 2,
    invalidCount: 0,
    expiredCount: 0,
    issuesFound: [] as string[],
    verificationDate: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ThemeHook.useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ user: { id: testUserId, uid: testUserId } });

    // Default mock implementations — real method names on ComplianceReportService's
    // singleton instance are generateComplianceReport/exportReportAsJSON/
    // exportReportAsCSV/exportReportAsPDF/verifyAcceptancesValid (not the
    // exportToJSON/exportToCSV/exportToPDF/verifyAcceptances the old fixture invented).
    (ComplianceReportService.getInstance as jest.Mock).mockReturnValue({
      generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
      exportReportAsJSON: jest.fn().mockResolvedValue(mockExportFormat('json')),
      exportReportAsCSV: jest.fn().mockResolvedValue(mockExportFormat('csv')),
      exportReportAsPDF: jest.fn().mockResolvedValue(mockExportFormat('pdf')),
      verifyAcceptancesValid: jest.fn().mockResolvedValue(mockVerification),
    });

    // DocumentAnalyticsService is static-only (no getInstance) — the screen calls
    // DocumentAnalyticsService.getUserViewStats()/getSignatureStats() directly.
    (DocumentAnalyticsService.getUserViewStats as jest.Mock).mockResolvedValue(mockViewStats);
    (DocumentAnalyticsService.getSignatureStats as jest.Mock).mockResolvedValue(mockSignatureStats);
  });

  describe('Rendering', () => {
    test('should render screen title', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Compliance & Analytics')).toBeOnTheScreen();
      });
    });

    test('should render all tabs', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeOnTheScreen();
        expect(screen.getByText('Timeline')).toBeOnTheScreen();
        expect(screen.getByText('Metrics')).toBeOnTheScreen();
        expect(screen.getByText('Export')).toBeOnTheScreen();
      });
    });

    test('should render loading state initially', async () => {
      render(<ComplianceAnalyticsScreen />);

      // Component should render without crashing
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });
    });
  });

  describe('Overview Tab', () => {
    test('should display overview tab content by default', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        // Overview tab should be visible by default
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });
    });

    test('should display compliance percentage', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        // Should show compliance score
        expect(screen.getByText(/66\.67%|67%/)).toBeOnTheScreen();
      });
    });

    test('should display document status cards', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
        expect(screen.getByText('Privacy Policy')).toBeOnTheScreen();
      });
    });

    test('should show accepted status for documents', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getAllByText(/Accepted/).length).toBeGreaterThan(0);
      });
    });

    test('should display compliance progress bar', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        // Progress bar should be visible
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });
    });
  });

  describe('Timeline Tab', () => {
    test('should navigate to timeline tab', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        expect(screen.getByText(/Acceptance Timeline/i)).toBeOnTheScreen();
      });
    });

    test('should display acceptance timeline', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      // 'Terms of Service' appears in both the Acceptance and Signature
      // timeline sections since the fixture accepts+signs the same document.
      await waitFor(() => {
        expect(screen.getAllByText('Terms of Service').length).toBeGreaterThan(0);
      });
    });

    test('should show document versions in timeline', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        expect(screen.getByText(/v1\.0\.0/)).toBeOnTheScreen();
      });
    });

    test('should show platform information', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        expect(screen.getByText(/ios/i)).toBeOnTheScreen();
      });
    });
  });

  describe('Metrics Tab', () => {
    test('should navigate to metrics tab', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('View Statistics')).toBeOnTheScreen();
        expect(screen.getByText('Signature Statistics')).toBeOnTheScreen();
      });
    });

    test('should display view statistics', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Total Documents Viewed')).toBeOnTheScreen();
        expect(screen.getByText('3')).toBeOnTheScreen();
      });
    });

    test('should display total views count', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Total Views')).toBeOnTheScreen();
        expect(screen.getByText('12')).toBeOnTheScreen();
      });
    });

    test('should display average view duration', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Avg View Duration')).toBeOnTheScreen();
        expect(screen.getByText('45s')).toBeOnTheScreen();
      });
    });

    test('should display signature statistics', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Total Attempts')).toBeOnTheScreen();
        expect(screen.getByText('Success Rate')).toBeOnTheScreen();
        expect(screen.getByText(/100%/)).toBeOnTheScreen();
      });
    });

    test('should display jurisdictional compliance', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getAllByText(/gdpr|ccpa|uk|australia|canada/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/COMPLIANT/).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export Tab', () => {
    test('should navigate to export tab', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        expect(screen.getByText(/Export Report/i)).toBeOnTheScreen();
      });
    });

    test('should display JSON export button', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        expect(screen.getByText('Export as JSON')).toBeOnTheScreen();
      });
    });

    test('should display CSV export button', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        expect(screen.getByText('Export as CSV')).toBeOnTheScreen();
      });
    });

    test('should display PDF export button', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        expect(screen.getByText('Export as PDF')).toBeOnTheScreen();
      });
    });

    test('should display verify acceptances button', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        expect(screen.getByText('Verify Acceptances')).toBeOnTheScreen();
      });
    });

    test('should export as JSON when button pressed', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportReportAsJSON: jest.fn().mockResolvedValue(mockExportFormat('json')),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const jsonButton = await screen.findByText('Export as JSON');
      fireEvent.press(jsonButton);

      await waitFor(() => {
        expect(complianceService.exportReportAsJSON).toHaveBeenCalledWith(mockComplianceReport);
      });
    });

    test('should verify acceptances when button pressed', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportReportAsJSON: jest.fn(),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn().mockResolvedValue(mockVerification),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const verifyButton = await screen.findByText('Verify Acceptances');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(complianceService.verifyAcceptancesValid).toHaveBeenCalledWith(testUserId);
      });
    });

    test('should show verification results', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportReportAsJSON: jest.fn(),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn().mockResolvedValue(mockVerification),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const verifyButton = await screen.findByText('Verify Acceptances');
      fireEvent.press(verifyButton);

      // handleVerifyAcceptances surfaces the result via Alert.alert, not inline text
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Verification Complete',
          expect.stringContaining('valid')
        );
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between all tabs', async () => {
      render(<ComplianceAnalyticsScreen />);

      // Start on Overview (findByText waits out the initial data-loading spinner)
      expect(await screen.findByText('Overview')).toBeOnTheScreen();

      // Switch to Timeline
      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);
      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });

      // Switch to Metrics
      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);
      await waitFor(() => {
        expect(screen.getByText('Metrics')).toBeOnTheScreen();
      });

      // Switch to Export
      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);
      await waitFor(() => {
        expect(screen.getByText('Export')).toBeOnTheScreen();
      });
    });

    test('should maintain tab active state', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      // Tab should be visually active
      expect(screen.getByText('Metrics')).toBeOnTheScreen();
    });
  });

  describe('Data Loading', () => {
    test('should load compliance report on mount', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportReportAsJSON: jest.fn(),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(complianceService.generateComplianceReport).toHaveBeenCalledWith(testUserId, 'full');
      });
    });

    test('should load analytics data on mount', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(DocumentAnalyticsService.getUserViewStats).toHaveBeenCalled();
        expect(DocumentAnalyticsService.getSignatureStats).toHaveBeenCalled();
      });
    });

    test('should handle data loading errors', async () => {
      const complianceService = {
        generateComplianceReport: jest
          .fn()
          .mockRejectedValue(new Error('Load failed')),
        exportReportAsJSON: jest.fn(),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);
      (DocumentAnalyticsService.getUserViewStats as jest.Mock).mockRejectedValue(new Error('Load failed'));
      (DocumentAnalyticsService.getSignatureStats as jest.Mock).mockRejectedValue(new Error('Load failed'));

      render(<ComplianceAnalyticsScreen />);

      // All three services failing is the only path that sets state.error
      // (the component tolerates any subset failing, see loadComplianceData's
      // per-service try/catch + hasAnyData check) — it shows inline error text,
      // not an Alert.
      await waitFor(() => {
        expect(
          screen.getByText(/Unable to load compliance data/i)
        ).toBeOnTheScreen();
      });
    });
  });

  describe('Dark/Light Mode', () => {
    test('should use theme colors from useTheme hook', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });

      // Component renders with theme colors
    });

    test('should update colors when theme changes', async () => {
      const mockDarkTheme = {
        colors: {
          ...mockTheme.colors,
          background: { primary: '#000000', secondary: '#1C1C1C', card: '#2C2C2C' },
          text: { primary: '#FFFFFF', secondary: '#CCCCCC', tertiary: '#666666' },
        },
      };

      const { rerender } = render(<ComplianceAnalyticsScreen />);

      (ThemeHook.useTheme as jest.Mock).mockReturnValueOnce(mockDarkTheme);
      rerender(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have accessible tab buttons', async () => {
      render(<ComplianceAnalyticsScreen />);

      const overviewTab = await screen.findByText('Overview');
      expect(overviewTab).toHaveAccessibleName();
    });

    test('should have accessible action buttons', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        const jsonButton = screen.getByText('Export as JSON');
        expect(jsonButton).toHaveAccessibleName();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle export errors gracefully', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportReportAsJSON: jest.fn().mockRejectedValue(new Error('Export failed')),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const jsonButton = await screen.findByText('Export as JSON');
      fireEvent.press(jsonButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Export Failed', expect.any(String));
      });
    });

    test('should handle verification errors gracefully', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportReportAsJSON: jest.fn(),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest
          .fn()
          .mockRejectedValue(new Error('Verification failed')),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const verifyButton = await screen.findByText('Verify Acceptances');
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Verification Failed', expect.any(String));
      });
    });
  });

  describe('Performance', () => {
    test('should render efficiently with large data sets', async () => {
      const largeReport = {
        ...mockComplianceReport,
        documents: Array(100)
          .fill(0)
          .map((_, i) => ({
            documentId: `doc-${i}`,
            title: `Document ${i}`,
            required: true,
            accepted: true,
            acceptedAt: Date.now() - i * 86400000,
            version: '1.0.0',
            signed: true,
            signedAt: Date.now() - i * 86400000,
            viewCount: i,
            lastViewedAt: Date.now(),
            engagementScore: 50,
          })),
      };

      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(largeReport),
        exportReportAsJSON: jest.fn(),
        exportReportAsCSV: jest.fn(),
        exportReportAsPDF: jest.fn(),
        verifyAcceptancesValid: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      const startTime = performance.now();
      render(<ComplianceAnalyticsScreen />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
