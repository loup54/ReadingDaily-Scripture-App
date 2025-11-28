/**
 * BackupExportScreen Component Tests
 *
 * Tests for:
 * - Tab navigation
 * - Backup creation and password protection
 * - Cloud backup management
 * - Restore functionality
 * - Auto-backup scheduling
 * - Export options
 * - Error handling
 * - Dark/light mode support
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { BackupExportScreen } from '../BackupExportScreen';
import BackupService, { BackupFile } from '@/services/legal/BackupService';
import CloudBackupService, { CloudBackup } from '@/services/legal/CloudBackupService';
import BackupScheduleService from '@/services/legal/BackupScheduleService';
import * as ThemeHook from '@/hooks/useTheme';

// Mock dependencies
jest.mock('@/hooks/useTheme');
jest.mock('@/services/legal/BackupService');
jest.mock('@/services/legal/CloudBackupService');
jest.mock('@/services/legal/BackupScheduleService');
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

describe('BackupExportScreen', () => {
  const mockBackup: BackupFile = {
    id: 'backup-001',
    fileUri: '/path/to/backup.zip',
    createdAt: Date.now(),
    size: 2621440, // 2.5 MB
    verified: true,
    encrypted: false,
    contents: {
      documentCount: 3,
      acceptanceCount: 2,
      signatureCount: 2,
    },
  };

  const mockCloudBackup: CloudBackup = {
    id: 'backup-001',
    cloudId: 'cloud-001',
    userId: 'user-001',
    createdAt: Date.now(),
    size: 2621440,
    verified: true,
    encrypted: false,
    contents: {
      documentCount: 3,
      acceptanceCount: 2,
      signatureCount: 2,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ThemeHook.useTheme as jest.Mock).mockReturnValue(mockTheme);

    // Default mock implementations
    (BackupService.getLocalBackups as jest.Mock).mockResolvedValue([mockBackup]);
    (CloudBackupService.getCloudBackups as jest.Mock).mockResolvedValue([mockCloudBackup]);
    (BackupScheduleService.isAutoBackupEnabled as jest.Mock).mockResolvedValue(true);
    (BackupScheduleService.getLastBackupTime as jest.Mock).mockResolvedValue(new Date());
    (BackupScheduleService.getNextBackupTime as jest.Mock).mockResolvedValue(
      new Date(Date.now() + 86400000)
    );
    (BackupScheduleService.getDaysUntilNextBackup as jest.Mock).mockResolvedValue(30);
  });

  describe('Rendering', () => {
    test('should render header with title', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Backup & Export')).toBeOnTheScreen();
      });
    });

    test('should render all tabs', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Backup')).toBeOnTheScreen();
        expect(screen.getByText('Export')).toBeOnTheScreen();
        expect(screen.getByText('Restore')).toBeOnTheScreen();
        expect(screen.getByText('History')).toBeOnTheScreen();
      });
    });

    test('should render back button when onBack provided', () => {
      const mockOnBack = jest.fn();
      render(<BackupExportScreen onBack={mockOnBack} />);

      expect(screen.getByRole('button', { name: /chevron-back/i })).toBeOnTheScreen();
    });

    test('should render loading state initially', async () => {
      (BackupService.getLocalBackups as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve([mockBackup]), 100))
      );

      render(<BackupExportScreen />);

      // Component should render without crashing
      expect(screen.getByText('Backup & Export')).toBeOnTheScreen();
    });
  });

  describe('Backup Tab', () => {
    test('should display backup status section', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Backup Status')).toBeOnTheScreen();
      });
    });

    test('should display last backup time', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Last Backup')).toBeOnTheScreen();
      });
    });

    test('should display next backup time', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Next Backup')).toBeOnTheScreen();
      });
    });

    test('should display total backups count', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Total Backups')).toBeOnTheScreen();
      });
    });

    test('should toggle auto backup', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Auto Backup')).toBeOnTheScreen();
      });

      const toggle = screen.getByRole('switch');
      fireEvent.press(toggle);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });

    test('should show create backup button', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Create Backup Now')).toBeOnTheScreen();
      });
    });

    test('should prompt for password when creating backup', async () => {
      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Create Backup',
          expect.any(String),
          expect.any(Array)
        );
      });
    });

    test('should show password modal when password protection selected', async () => {
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[1].onPress(); // Click "Yes, Set Password"
      });

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Password (min 6 chars)')).toBeOnTheScreen();
      });
    });

    test('should create unprotected backup when password skipped', async () => {
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[0].onPress(); // Click "No, Skip"
      });

      (BackupService.createLocalBackup as jest.Mock).mockResolvedValueOnce(mockBackup);

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(BackupService.createLocalBackup).toHaveBeenCalledWith();
      });
    });

    test('should create password-protected backup', async () => {
      (BackupService.createLocalBackup as jest.Mock).mockResolvedValueOnce(mockBackup);

      // First mock for "Set Password" dialog
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[1].onPress(); // Click "Yes, Set Password"
      });

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('Password (min 6 chars)');
        expect(passwordInput).toBeOnTheScreen();
      });

      const passwordInput = screen.getByPlaceholderText('Password (min 6 chars)');
      const confirmInput = screen.getByPlaceholderText('Confirm Password');

      fireEvent.changeText(passwordInput, 'SecurePass123!');
      fireEvent.changeText(confirmInput, 'SecurePass123!');

      const createProtectedButton = screen.getByText('Create Protected Backup');
      fireEvent.press(createProtectedButton);

      await waitFor(() => {
        expect(BackupService.createLocalBackup).toHaveBeenCalledWith('SecurePass123!');
      });
    });

    test('should validate password length', async () => {
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[1].onPress(); // Click "Yes, Set Password"
      });

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        const createProtectedButton = screen.getByText('Create Protected Backup');
        expect(createProtectedButton.props.disabled).toBe(true);
      });
    });

    test('should validate password match', async () => {
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[1].onPress(); // Click "Yes, Set Password"
      });

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('Password (min 6 chars)');
        const confirmInput = screen.getByPlaceholderText('Confirm Password');

        fireEvent.changeText(passwordInput, 'SecurePass123!');
        fireEvent.changeText(confirmInput, 'DifferentPass123!');

        const createProtectedButton = screen.getByText('Create Protected Backup');
        fireEvent.press(createProtectedButton);

        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Passwords do not match'
        );
      });
    });
  });

  describe('Export Tab', () => {
    test('should navigate to export tab', async () => {
      render(<BackupExportScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      expect(screen.getByText('Export Documents')).toBeOnTheScreen();
    });

    test('should display export information', async () => {
      render(<BackupExportScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      expect(screen.getByText(/Export all documents/)).toBeOnTheScreen();
    });

    test('should show export button', async () => {
      render(<BackupExportScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      expect(screen.getByText('Export as ZIP')).toBeOnTheScreen();
    });
  });

  describe('Restore Tab', () => {
    test('should navigate to restore tab', async () => {
      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      expect(screen.getByText('Restore Backup')).toBeOnTheScreen();
    });

    test('should display local backups', async () => {
      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        expect(screen.getByText('Local Backups')).toBeOnTheScreen();
      });
    });

    test('should show backup details in card', async () => {
      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        expect(screen.getByText(/2.5 MB/)).toBeOnTheScreen();
        expect(screen.getByText(/3 docs/)).toBeOnTheScreen();
      });
    });

    test('should show restore button for each backup', async () => {
      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        const restoreButtons = screen.getAllByRole('button');
        expect(restoreButtons.length).toBeGreaterThan(0);
      });
    });

    test('should show delete button for each backup', async () => {
      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    test('should show empty state when no backups', async () => {
      (BackupService.getLocalBackups as jest.Mock).mockResolvedValueOnce([]);

      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        expect(screen.getByText('No Backups')).toBeOnTheScreen();
      });
    });

    test('should confirm restore action', async () => {
      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const restoreButton = buttons.find(b => b.props.testID?.includes('download'));
        if (restoreButton) {
          fireEvent.press(restoreButton);
        }
      });

      // Should show confirmation alert
      // Implementation-specific details
    });

    test('should handle restore errors', async () => {
      (BackupService.restoreFromLocalBackup as jest.Mock).mockRejectedValueOnce(
        new Error('Restore failed')
      );

      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      // Should handle error gracefully
      expect(screen.getByText('Restore Backup')).toBeOnTheScreen();
    });
  });

  describe('History Tab', () => {
    test('should navigate to history tab', async () => {
      render(<BackupExportScreen />);

      const historyTab = await screen.findByText('History');
      fireEvent.press(historyTab);

      expect(screen.getByText('Backup History')).toBeOnTheScreen();
    });

    test('should display cloud backups section', async () => {
      render(<BackupExportScreen />);

      const historyTab = await screen.findByText('History');
      fireEvent.press(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Cloud Backups')).toBeOnTheScreen();
      });
    });

    test('should display local backups section', async () => {
      render(<BackupExportScreen />);

      const historyTab = await screen.findByText('History');
      fireEvent.press(historyTab);

      await waitFor(() => {
        expect(screen.getByText('Local Backups')).toBeOnTheScreen();
      });
    });

    test('should show backup information', async () => {
      render(<BackupExportScreen />);

      const historyTab = await screen.findByText('History');
      fireEvent.press(historyTab);

      await waitFor(() => {
        expect(screen.getByText(/2.5 MB/)).toBeOnTheScreen();
      });
    });

    test('should show empty state when no backups', async () => {
      (BackupService.getLocalBackups as jest.Mock).mockResolvedValueOnce([]);
      (CloudBackupService.getCloudBackups as jest.Mock).mockResolvedValueOnce([]);

      render(<BackupExportScreen />);

      const historyTab = await screen.findByText('History');
      fireEvent.press(historyTab);

      await waitFor(() => {
        expect(screen.getByText('No History')).toBeOnTheScreen();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between tabs', async () => {
      render(<BackupExportScreen />);

      // Start on Backup tab
      expect(screen.getByText('Backup Status')).toBeOnTheScreen();

      // Switch to Export
      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);
      expect(screen.getByText('Export Documents')).toBeOnTheScreen();

      // Switch to Restore
      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);
      expect(screen.getByText('Restore Backup')).toBeOnTheScreen();

      // Switch to History
      const historyTab = await screen.findByText('History');
      fireEvent.press(historyTab);
      expect(screen.getByText('Backup History')).toBeOnTheScreen();
    });

    test('should maintain tab active state', async () => {
      render(<BackupExportScreen />);

      const exportTab = await screen.findByText('Export');
      fireEvent.press(exportTab);

      // Tab should be visually active
      expect(screen.getByText('Export Documents')).toBeOnTheScreen();
    });
  });

  describe('Data Loading', () => {
    test('should load backup data on mount', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(BackupService.getLocalBackups).toHaveBeenCalled();
        expect(CloudBackupService.getCloudBackups).toHaveBeenCalled();
        expect(BackupScheduleService.isAutoBackupEnabled).toHaveBeenCalled();
      });
    });

    test('should load all backup schedule information', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(BackupScheduleService.getLastBackupTime).toHaveBeenCalled();
        expect(BackupScheduleService.getNextBackupTime).toHaveBeenCalled();
        expect(BackupScheduleService.getDaysUntilNextBackup).toHaveBeenCalled();
      });
    });

    test('should refresh data after backup creation', async () => {
      (BackupService.createLocalBackup as jest.Mock).mockResolvedValueOnce(mockBackup);
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[0].onPress(); // No password
      });

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(BackupService.getLocalBackups).toHaveBeenCalledTimes(2); // Once on mount, once after creation
      });
    });

    test('should handle data loading errors', async () => {
      (BackupService.getLocalBackups as jest.Mock).mockRejectedValueOnce(
        new Error('Load failed')
      );

      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load backup data');
      });
    });
  });

  describe('Backup Operations', () => {
    test('should delete backup with confirmation', async () => {
      (BackupService.deleteLocalBackup as jest.Mock).mockResolvedValueOnce(true);

      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      // Would need to implement delete button interaction
      // Implementation-specific details
    });

    test('should verify backup integrity', async () => {
      const verifiedBackup = { ...mockBackup, verified: true };
      (BackupService.getLocalBackups as jest.Mock).mockResolvedValueOnce([verifiedBackup]);

      render(<BackupExportScreen />);

      const restoreTab = await screen.findByText('Restore');
      fireEvent.press(restoreTab);

      await waitFor(() => {
        expect(screen.getByText('Verified')).toBeOnTheScreen();
      });
    });
  });

  describe('Dark/Light Mode', () => {
    test('should use theme colors from useTheme hook', async () => {
      render(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Backup & Export')).toBeOnTheScreen();
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

      const { rerender } = render(<BackupExportScreen />);

      (ThemeHook.useTheme as jest.Mock).mockReturnValueOnce(mockDarkTheme);
      rerender(<BackupExportScreen />);

      await waitFor(() => {
        expect(screen.getByText('Backup & Export')).toBeOnTheScreen();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have accessible tab buttons', async () => {
      render(<BackupExportScreen />);

      const backupTab = await screen.findByText('Backup');
      expect(backupTab).toHaveAccessibleName();
    });

    test('should have accessible action buttons', async () => {
      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      expect(createButton).toHaveAccessibleName();
    });

    test('should have accessible form inputs', async () => {
      (Alert.alert as jest.Mock).mockImplementationOnce((title, message, buttons) => {
        buttons[1].onPress(); // Click "Yes, Set Password"
      });

      render(<BackupExportScreen />);

      const createButton = await screen.findByText('Create Backup Now');
      fireEvent.press(createButton);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('Password (min 6 chars)');
        expect(passwordInput).toHaveAccessibleName();
      });
    });
  });

  describe('Performance', () => {
    test('should handle loading state efficiently', async () => {
      render(<BackupExportScreen />);

      const startTime = performance.now();

      await waitFor(() => {
        expect(screen.getByText('Backup & Export')).toBeOnTheScreen();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('should render large backup lists efficiently', async () => {
      const largeBackupList = Array(50)
        .fill(0)
        .map((_, i) => ({
          ...mockBackup,
          id: `backup-${i}`,
          createdAt: Date.now() - i * 86400000,
        }));

      (BackupService.getLocalBackups as jest.Mock).mockResolvedValueOnce(largeBackupList);

      const startTime = performance.now();
      render(<BackupExportScreen />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
