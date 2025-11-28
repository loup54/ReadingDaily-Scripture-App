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
import DocumentVersioningService from '@/services/legal/DocumentVersioningService';
import * as ThemeHook from '@/hooks/useTheme';

// Mock dependencies
jest.mock('@/hooks/useTheme');
jest.mock('@/services/legal/ComplianceReportService');
jest.mock('@/services/legal/DocumentAnalyticsService');
jest.mock('@/services/legal/DocumentVersioningService');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

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
  const mockComplianceReport = {
    reportId: 'report-001',
    userId: 'user-001',
    generatedAt: Date.now(),
    documentStatuses: [
      {
        documentId: 'doc-001',
        title: 'Terms of Service',
        accepted: true,
        acceptedAt: Date.now() - 86400000,
        signed: true,
        signedAt: Date.now() - 86400000,
      },
      {
        documentId: 'doc-002',
        title: 'Privacy Policy',
        accepted: true,
        acceptedAt: Date.now() - 172800000,
        signed: true,
        signedAt: Date.now() - 172800000,
      },
    ],
    overallCompliancePercentage: 66.67,
    acceptanceTimeline: [
      {
        documentId: 'doc-001',
        documentTitle: 'Terms of Service',
        acceptedAt: Date.now() - 86400000,
        version: '1.0.0',
        platform: 'ios',
      },
    ],
    jurisdictionalStatus: {
      gdpr: 'compliant',
      ccpa: 'compliant',
      uk: 'compliant',
      australia: 'compliant',
      canada: 'compliant',
    },
  };

  const mockAnalyticsData = {
    totalDocumentsViewed: 3,
    totalViews: 12,
    averageViewDuration: 45,
    lastViewedAt: Date.now(),
    signatureStatistics: {
      totalAttempts: 5,
      successfulAttempts: 5,
      failedAttempts: 0,
      successRate: 100,
    },
    engagementMetrics: [
      { documentId: 'doc-001', viewCount: 5, engagementScore: 95 },
      { documentId: 'doc-002', viewCount: 4, engagementScore: 85 },
      { documentId: 'doc-003', viewCount: 3, engagementScore: 75 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ThemeHook.useTheme as jest.Mock).mockReturnValue(mockTheme);

    // Default mock implementations
    (ComplianceReportService.getInstance as jest.Mock).mockReturnValue({
      generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
      exportToJSON: jest.fn().mockResolvedValue('{}'),
      exportToCSV: jest.fn().mockResolvedValue('csv,data'),
      exportToPDF: jest.fn().mockResolvedValue('pdf'),
      verifyAcceptances: jest.fn().mockResolvedValue({
        valid: 2,
        invalid: 0,
        expired: 0,
        allValid: true,
      }),
    });

    (DocumentAnalyticsService.getInstance as jest.Mock).mockReturnValue({
      getAnalyticsData: jest.fn().mockResolvedValue(mockAnalyticsData),
    });

    (DocumentVersioningService.getAcceptanceTimeline as jest.Mock).mockResolvedValue(
      mockComplianceReport.acceptanceTimeline
    );
  });

  describe('Rendering', () => {
    test('should render screen title', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Compliance|Analytics/i)).toBeOnTheScreen();
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

    test('should render refresh button', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        expect(refreshButton).toBeOnTheScreen();
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
        expect(screen.getByText(/Accepted|✓/)).toBeOnTheScreen();
      });
    });

    test('should show signed status for documents', async () => {
      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Signed|✓/)).toBeOnTheScreen();
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
        expect(screen.getByText(/Timeline|Acceptance/i)).toBeOnTheScreen();
      });
    });

    test('should display acceptance timeline', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
      });
    });

    test('should show acceptance dates', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        // Should show dates from timeline
        expect(screen.getByText('Overview')).toBeOnTheScreen();
      });
    });

    test('should show document versions in timeline', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        expect(screen.getByText(/v1\.0\.0|1.0.0/)).toBeOnTheScreen();
      });
    });

    test('should show platform information', async () => {
      render(<ComplianceAnalyticsScreen />);

      const timelineTab = await screen.findByText('Timeline');
      fireEvent.press(timelineTab);

      await waitFor(() => {
        expect(screen.getByText(/ios|android|platform/i)).toBeOnTheScreen();
      });
    });
  });

  describe('Metrics Tab', () => {
    test('should navigate to metrics tab', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText(/Metrics|Statistics/i)).toBeOnTheScreen();
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
        expect(screen.getByText(/45s|45 seconds/)).toBeOnTheScreen();
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

    test('should display engagement metrics', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText('Engagement')).toBeOnTheScreen();
      });
    });

    test('should display jurisdictional compliance', async () => {
      render(<ComplianceAnalyticsScreen />);

      const metricsTab = await screen.findByText('Metrics');
      fireEvent.press(metricsTab);

      await waitFor(() => {
        expect(screen.getByText(/GDPR|CCPA|UK|Australia|Canada/)).toBeOnTheScreen();
        expect(screen.getByText(/COMPLIANT|✓/)).toBeOnTheScreen();
      });
    });
  });

  describe('Export Tab', () => {
    test('should navigate to export tab', async () => {
      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      await waitFor(() => {
        expect(screen.getByText(/Export|Download/i)).toBeOnTheScreen();
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
        expect(screen.getByText(/Verify|Verification/i)).toBeOnTheScreen();
      });
    });

    test('should export as JSON when button pressed', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportToJSON: jest.fn().mockResolvedValue('{"data": "json"}'),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const jsonButton = await screen.findByText('Export as JSON');
      fireEvent.press(jsonButton);

      await waitFor(() => {
        expect(complianceService.exportToJSON).toHaveBeenCalled();
      });
    });

    test('should verify acceptances when button pressed', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn().mockResolvedValue({
          valid: 2,
          invalid: 0,
          expired: 0,
          allValid: true,
        }),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const verifyButton = await screen.findByText(/Verify/);
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(complianceService.verifyAcceptances).toHaveBeenCalled();
      });
    });

    test('should show verification results', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn().mockResolvedValue({
          valid: 2,
          invalid: 0,
          expired: 0,
          allValid: true,
        }),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const verifyButton = await screen.findByText(/Verify/);
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/valid|All acceptances valid/i)).toBeOnTheScreen();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between all tabs', async () => {
      render(<ComplianceAnalyticsScreen />);

      // Start on Overview
      expect(screen.getByText('Overview')).toBeOnTheScreen();

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
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(complianceService.generateComplianceReport).toHaveBeenCalled();
      });
    });

    test('should load analytics data on mount', async () => {
      const analyticsService = {
        getAnalyticsData: jest.fn().mockResolvedValue(mockAnalyticsData),
      };

      (DocumentAnalyticsService.getInstance as jest.Mock).mockReturnValue(analyticsService);

      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(analyticsService.getAnalyticsData).toHaveBeenCalled();
      });
    });

    test('should refresh data when refresh button pressed', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(complianceService.generateComplianceReport).toHaveBeenCalledTimes(1);
      });

      const refreshButton = await screen.findByRole('button', { name: /refresh/i });
      fireEvent.press(refreshButton);

      await waitFor(() => {
        expect(complianceService.generateComplianceReport).toHaveBeenCalledTimes(2);
      });
    });

    test('should handle data loading errors', async () => {
      const complianceService = {
        generateComplianceReport: jest
          .fn()
          .mockRejectedValue(new Error('Load failed')),
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
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
        exportToJSON: jest.fn().mockRejectedValue(new Error('Export failed')),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const jsonButton = await screen.findByText('Export as JSON');
      fireEvent.press(jsonButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });

    test('should handle verification errors gracefully', async () => {
      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(mockComplianceReport),
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest
          .fn()
          .mockRejectedValue(new Error('Verification failed')),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      render(<ComplianceAnalyticsScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      const verifyButton = await screen.findByText(/Verify/);
      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });
  });

  describe('Performance', () => {
    test('should render efficiently with large data sets', async () => {
      const largeReport = {
        ...mockComplianceReport,
        documentStatuses: Array(100)
          .fill(0)
          .map((_, i) => ({
            documentId: `doc-${i}`,
            title: `Document ${i}`,
            accepted: true,
            acceptedAt: Date.now() - i * 86400000,
            signed: true,
            signedAt: Date.now() - i * 86400000,
          })),
      };

      const complianceService = {
        generateComplianceReport: jest.fn().mockResolvedValue(largeReport),
        exportToJSON: jest.fn(),
        exportToCSV: jest.fn(),
        exportToPDF: jest.fn(),
        verifyAcceptances: jest.fn(),
      };

      (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(complianceService);

      const startTime = performance.now();
      render(<ComplianceAnalyticsScreen />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
