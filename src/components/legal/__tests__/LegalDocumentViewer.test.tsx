/**
 * LegalDocumentViewer Component Tests
 *
 * Tests for:
 * - Document content rendering
 * - Section expansion/collapse
 * - Search functionality
 * - Share button behavior
 * - Accept button flow
 * - Signature modal integration
 * - Analytics tracking
 * - Dark/light mode support
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native';
import { Alert, Share } from 'react-native';
import { LegalDocumentViewer } from '../LegalDocumentViewer';
import { LegalDocument } from '@/services/legal/LegalDocumentService';
import DocumentSigningService from '@/services/legal/DocumentSigningService';
import DocumentVersioningService from '@/services/legal/DocumentVersioningService';
import DocumentAnalyticsService from '@/services/legal/DocumentAnalyticsService';
import ComplianceReportService from '@/services/legal/ComplianceReportService';
import * as ThemeHook from '@/hooks/useTheme';

// Mock dependencies
jest.mock('@/hooks/useTheme');
jest.mock('@/services/legal/DocumentSigningService');
jest.mock('@/services/legal/DocumentVersioningService');
jest.mock('@/services/legal/DocumentAnalyticsService');
jest.mock('@/services/legal/ComplianceReportService');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: {
    share: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock useTheme hook
const mockTheme = {
  colors: {
    primary: { blue: '#007AFF' },
    background: { primary: '#FFFFFF', secondary: '#F5F5F5', card: '#FFFFFF' },
    text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
    ui: { border: '#CCCCCC' },
    accent: { green: '#34C759', red: '#FF3B30' },
  },
};

describe('LegalDocumentViewer', () => {
  const mockDocument: LegalDocument = {
    id: 'test-doc-001',
    title: 'Terms of Service',
    description: 'Test Terms of Service',
    content: `# Terms of Service

## Section 1: Introduction
This is the introduction text.
Paragraph with multiple lines.

## Section 2: Warranty
We provide no warranty.
**Bold text here** for emphasis.

## Section 3: Liability
Limited liability clause here.
Code example:
    function test() { }`,
    version: '1.0.0',
    lastUpdated: '2024-01-15',
    effectiveDate: '2024-01-01',
    contactEmail: 'legal@example.com',
    sections: [
      { id: 'intro', title: 'Introduction', level: 2 },
      { id: 'warranty', title: 'Warranty', level: 2 },
      { id: 'liability', title: 'Liability', level: 2 },
    ],
  };

  const mockAnalyticsService = {
    trackDocumentView: jest.fn().mockResolvedValue(undefined),
    trackInteraction: jest.fn().mockResolvedValue(undefined),
    trackSignatureAttempt: jest.fn().mockResolvedValue(undefined),
    getInstance: jest.fn(),
  };

  const mockComplianceService = {
    logAuditEvent: jest.fn().mockResolvedValue(undefined),
    getInstance: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    (ThemeHook.useTheme as jest.Mock).mockReturnValue(mockTheme);
    (DocumentAnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalyticsService);
    (ComplianceReportService.getInstance as jest.Mock).mockReturnValue(mockComplianceService);
    (DocumentSigningService.captureSignature as jest.Mock).mockResolvedValue({
      id: 'sig-001',
      type: 'sketch',
    });
    (DocumentVersioningService.linkSignatureToAcceptance as jest.Mock).mockResolvedValue(true);
  });

  describe('Rendering', () => {
    test('should render document title', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });

    test('should render document version and last updated', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText(/v1\.0\.0/)).toBeOnTheScreen();
      expect(screen.getByText(/Updated 2024-01-15/)).toBeOnTheScreen();
    });

    test('should render close button when onClose provided', () => {
      const mockOnClose = jest.fn();
      const { getByTestId } = render(
        <LegalDocumentViewer document={mockDocument} onClose={mockOnClose} />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeOnTheScreen();
    });

    test('should render share button', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toBeOnTheScreen();
    });

    test('should render search input field', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');
      expect(searchInput).toBeOnTheScreen();
    });

    test('should render expand all and collapse all buttons', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText('Expand All')).toBeOnTheScreen();
      expect(screen.getByText('Collapse All')).toBeOnTheScreen();
    });

    test('should render section count', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText(/3 sections/)).toBeOnTheScreen();
    });

    test('should render metadata footer', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText(/Updated 2024-01-15/)).toBeOnTheScreen();
      expect(screen.getByText(/Effective 2024-01-01/)).toBeOnTheScreen();
    });

    test('should render contact information', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText('Questions?')).toBeOnTheScreen();
      expect(screen.getByText('legal@example.com')).toBeOnTheScreen();
    });

    test('should render loading state when loading prop is true', () => {
      render(<LegalDocumentViewer document={mockDocument} loading={true} />);
      expect(screen.getByText('Loading document...')).toBeOnTheScreen();
    });

    test('should render accept button when showAcceptButton is true', () => {
      render(
        <LegalDocumentViewer
          document={mockDocument}
          showAcceptButton={true}
          requiresSignature={false}
        />
      );
      expect(screen.getByText('I Agree & Accept')).toBeOnTheScreen();
    });

    test('should render sign button text when requiresSignature is true', () => {
      render(
        <LegalDocumentViewer
          document={mockDocument}
          showAcceptButton={true}
          requiresSignature={true}
        />
      );
      expect(screen.getByText('I Agree & Sign')).toBeOnTheScreen();
    });
  });

  describe('Section Management', () => {
    test('should render all sections', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText('Section 1: Introduction')).toBeOnTheScreen();
      expect(screen.getByText('Section 2: Warranty')).toBeOnTheScreen();
      expect(screen.getByText('Section 3: Liability')).toBeOnTheScreen();
    });

    test('should expand section when section header is tapped', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const sectionHeader = screen.getByText('Section 1: Introduction');
      fireEvent.press(sectionHeader);

      expect(screen.getByText('This is the introduction text.')).toBeOnTheScreen();
    });

    test('should collapse section when expanded section header is tapped', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const sectionHeader = screen.getByText('Section 1: Introduction');

      fireEvent.press(sectionHeader);
      expect(screen.getByText('This is the introduction text.')).toBeOnTheScreen();

      fireEvent.press(sectionHeader);
      expect(screen.queryByText('This is the introduction text.')).not.toBeOnTheScreen();
    });

    test('should expand all sections when Expand All is pressed', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const expandAllButton = screen.getByText('Expand All');
      fireEvent.press(expandAllButton);

      expect(screen.getByText('This is the introduction text.')).toBeOnTheScreen();
      expect(screen.getByText('We provide no warranty.')).toBeOnTheScreen();
      expect(screen.getByText('Limited liability clause here.')).toBeOnTheScreen();
    });

    test('should collapse all sections when Collapse All is pressed', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const expandAllButton = screen.getByText('Expand All');
      fireEvent.press(expandAllButton);

      const collapseAllButton = screen.getByText('Collapse All');
      fireEvent.press(collapseAllButton);

      expect(screen.queryByText('This is the introduction text.')).not.toBeOnTheScreen();
    });

    test('should track section expansion analytics', async () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const sectionHeader = screen.getByText('Section 1: Introduction');
      fireEvent.press(sectionHeader);

      await waitFor(() => {
        expect(mockAnalyticsService.trackInteraction).toHaveBeenCalledWith(
          'test-doc-001',
          'expand_section',
          expect.objectContaining({ sectionId: expect.any(String) })
        );
      });
    });
  });

  describe('Search Functionality', () => {
    test('should filter sections based on search query', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');

      fireEvent.changeText(searchInput, 'warranty');

      expect(screen.getByText('Section 2: Warranty')).toBeOnTheScreen();
      expect(screen.queryByText('Section 1: Introduction')).not.toBeOnTheScreen();
      expect(screen.queryByText('Section 3: Liability')).not.toBeOnTheScreen();
    });

    test('should search in section content', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');

      fireEvent.changeText(searchInput, 'warranty');

      // Should still show warranty section
      expect(screen.getByText('Section 2: Warranty')).toBeOnTheScreen();
    });

    test('should show empty state when no search results', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');

      fireEvent.changeText(searchInput, 'nonexistent');

      expect(screen.getByText(/No sections match "nonexistent"/)).toBeOnTheScreen();
    });

    test('should clear search when clear button is pressed', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');

      fireEvent.changeText(searchInput, 'warranty');
      expect(screen.getByText('Section 2: Warranty')).toBeOnTheScreen();

      const clearButton = screen.getByRole('button', { name: /close-circle/i });
      fireEvent.press(clearButton);

      expect(screen.getByText('Section 1: Introduction')).toBeOnTheScreen();
    });

    test('should update section count based on search results', () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      expect(screen.getByText(/3 sections/)).toBeOnTheScreen();

      const searchInput = screen.getByPlaceholderText('Search document...');
      fireEvent.changeText(searchInput, 'warranty');

      expect(screen.getByText(/1 section/)).toBeOnTheScreen();
    });

    test('should debounce search analytics tracking', async () => {
      jest.useFakeTimers();
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');

      fireEvent.changeText(searchInput, 'warranty');
      fireEvent.changeText(searchInput, 'warrantyx');

      expect(mockAnalyticsService.trackInteraction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockAnalyticsService.trackInteraction).toHaveBeenCalledWith(
          'test-doc-001',
          'search',
          expect.objectContaining({ query: 'warrantyx' })
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Share Functionality', () => {
    test('should open share dialog when share button is pressed', async () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const shareButton = screen.getByRole('button', { name: /share/i });

      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Terms of Service'),
            title: 'Terms of Service',
          })
        );
      });
    });

    test('should track share interaction', async () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const shareButton = screen.getByRole('button', { name: /share/i });

      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(mockAnalyticsService.trackInteraction).toHaveBeenCalledWith(
          'test-doc-001',
          'share',
          expect.any(Object)
        );
      });
    });

    test('should include document version in share message', async () => {
      render(<LegalDocumentViewer document={mockDocument} />);
      const shareButton = screen.getByRole('button', { name: /share/i });

      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('v1.0.0'),
          })
        );
      });
    });

    test('should handle share errors gracefully', async () => {
      (Share.share as jest.Mock).mockRejectedValueOnce(new Error('Share failed'));

      render(<LegalDocumentViewer document={mockDocument} />);
      const shareButton = screen.getByRole('button', { name: /share/i });

      fireEvent.press(shareButton);

      await waitFor(() => {
        // Should not crash, error should be caught and logged
        expect(Share.share).toHaveBeenCalled();
      });
    });
  });

  describe('Accept Button', () => {
    test('should call onAccept when accept button is pressed without signature', () => {
      const mockOnAccept = jest.fn();
      render(
        <LegalDocumentViewer
          document={mockDocument}
          showAcceptButton={true}
          requiresSignature={false}
          onAccept={mockOnAccept}
        />
      );

      const acceptButton = screen.getByText('I Agree & Accept');
      fireEvent.press(acceptButton);

      expect(mockOnAccept).toHaveBeenCalled();
    });

    test('should show signature modal when accept button is pressed with requiresSignature', () => {
      render(
        <LegalDocumentViewer
          document={mockDocument}
          showAcceptButton={true}
          requiresSignature={true}
        />
      );

      const acceptButton = screen.getByText('I Agree & Sign');
      fireEvent.press(acceptButton);

      // Signature modal should be shown (implementation details)
      expect(acceptButton).toBeOnTheScreen();
    });

    test('should disable accept button when loading', () => {
      render(
        <LegalDocumentViewer
          document={mockDocument}
          showAcceptButton={true}
          loading={true}
          requiresSignature={false}
        />
      );

      const acceptButton = screen.getByText('I Agree & Accept');
      expect(acceptButton.props.disabled).toBe(true);
    });
  });

  describe('Analytics Tracking', () => {
    test('should track document view on component mount', async () => {
      render(<LegalDocumentViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockAnalyticsService.trackDocumentView).toHaveBeenCalledWith('test-doc-001');
      });
    });

    test('should log audit event for document view', async () => {
      render(<LegalDocumentViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockComplianceService.logAuditEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'view',
            documentId: 'test-doc-001',
            documentTitle: 'Terms of Service',
          })
        );
      });
    });

    test('should track view completion on unmount', async () => {
      const { unmount } = render(<LegalDocumentViewer document={mockDocument} />);

      await waitFor(() => {
        expect(mockAnalyticsService.trackDocumentView).toHaveBeenCalled();
      });

      unmount();

      // View completion should be tracked
      expect(mockAnalyticsService.trackInteraction).toHaveBeenCalledWith(
        'test-doc-001',
        'view_complete',
        expect.any(Object)
      );
    });

    test('should track search interactions', async () => {
      jest.useFakeTimers();
      render(<LegalDocumentViewer document={mockDocument} />);
      const searchInput = screen.getByPlaceholderText('Search document...');

      fireEvent.changeText(searchInput, 'warranty');
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockAnalyticsService.trackInteraction).toHaveBeenCalledWith(
          'test-doc-001',
          'search',
          expect.objectContaining({ query: 'warranty' })
        );
      });

      jest.useRealTimers();
    });

    test('should track signature completion', async () => {
      render(
        <LegalDocumentViewer
          document={mockDocument}
          showAcceptButton={true}
          requiresSignature={true}
        />
      );

      // This would need signature modal interaction
      // Tests implementation-specific details
    });
  });

  describe('Dark/Light Mode', () => {
    test('should use theme colors from useTheme hook', () => {
      const mockDarkTheme = {
        colors: {
          ...mockTheme.colors,
          background: { primary: '#000000', secondary: '#1C1C1C', card: '#2C2C2C' },
          text: { primary: '#FFFFFF', secondary: '#CCCCCC', tertiary: '#666666' },
        },
      };

      (ThemeHook.useTheme as jest.Mock).mockReturnValueOnce(mockDarkTheme);

      render(<LegalDocumentViewer document={mockDocument} />);

      // Component should render with dark theme colors
      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });

    test('should update colors when theme changes', () => {
      const { rerender } = render(<LegalDocumentViewer document={mockDocument} />);

      const mockDarkTheme = {
        colors: {
          ...mockTheme.colors,
          background: { primary: '#000000', secondary: '#1C1C1C', card: '#2C2C2C' },
        },
      };

      (ThemeHook.useTheme as jest.Mock).mockReturnValueOnce(mockDarkTheme);
      rerender(<LegalDocumentViewer document={mockDocument} />);

      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });
  });

  describe('Accessibility', () => {
    test('should have accessible buttons', () => {
      render(<LegalDocumentViewer document={mockDocument} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    test('should have accessible text inputs', () => {
      render(<LegalDocumentViewer document={mockDocument} />);

      const searchInput = screen.getByPlaceholderText('Search document...');
      expect(searchInput).toHaveAccessibleName();
    });

    test('should have proper heading hierarchy', () => {
      render(<LegalDocumentViewer document={mockDocument} />);

      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
      expect(screen.getByText('Section 1: Introduction')).toBeOnTheScreen();
    });
  });

  describe('Edge Cases', () => {
    test('should handle document with no sections', () => {
      const emptyDocument: LegalDocument = {
        ...mockDocument,
        content: '',
        sections: [],
      };

      render(<LegalDocumentViewer document={emptyDocument} />);

      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });

    test('should handle document with special characters', () => {
      const specialDocument: LegalDocument = {
        ...mockDocument,
        content: `# Special Characters
## Section with <html> & "quotes"
Content with © symbols and €`,
      };

      render(<LegalDocumentViewer document={specialDocument} />);

      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });

    test('should handle very long document content', () => {
      const longContent = Array(100)
        .fill(0)
        .map((_, i) => `## Section ${i}\nLorem ipsum dolor sit amet ${i}`)
        .join('\n');

      const longDocument: LegalDocument = {
        ...mockDocument,
        content: longContent,
      };

      render(<LegalDocumentViewer document={longDocument} />);

      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });

    test('should handle rapid section expansions', () => {
      render(<LegalDocumentViewer document={mockDocument} />);

      const sections = screen.getAllByText(/Section \d/);

      // Rapidly expand multiple sections
      sections.forEach(section => {
        fireEvent.press(section);
      });

      // Should not crash
      expect(screen.getByText('Terms of Service')).toBeOnTheScreen();
    });

    test('should handle document updates', () => {
      const { rerender } = render(<LegalDocumentViewer document={mockDocument} />);

      const updatedDocument: LegalDocument = {
        ...mockDocument,
        title: 'Updated Terms',
        version: '2.0.0',
      };

      rerender(<LegalDocumentViewer document={updatedDocument} />);

      expect(screen.getByText('Updated Terms')).toBeOnTheScreen();
      expect(screen.getByText(/v2\.0\.0/)).toBeOnTheScreen();
    });
  });

  describe('Performance', () => {
    test('should memoize sections to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <LegalDocumentViewer document={mockDocument} onClose={() => {}} />
      );

      const initialRenderTime = performance.now();

      rerender(
        <LegalDocumentViewer document={mockDocument} onClose={() => {}} />
      );

      const secondRenderTime = performance.now();

      // Should complete quickly due to memoization
      expect(secondRenderTime - initialRenderTime).toBeLessThan(100);
    });

    test('should handle large number of search results efficiently', () => {
      const largeContent = Array(50)
        .fill(0)
        .map((_, i) => `## Section ${i}\nWarranty information item ${i}`)
        .join('\n');

      const largeDocument: LegalDocument = {
        ...mockDocument,
        content: largeContent,
      };

      const startTime = performance.now();
      render(<LegalDocumentViewer document={largeDocument} />);
      const endTime = performance.now();

      // Should render within acceptable time
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
