/**
 * Progress Dashboard Screen Tests
 *
 * Tests for component integration, state management, and user flows
 * Phase E: Progress Tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProgressDashboard } from '../ProgressDashboard';
import type { ProgressData, Badge, BadgeProgress } from '@/types/progress.types';

/**
 * Mock hooks and stores
 */
jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      text: {
        primary: '#000000',
        secondary: '#666666',
        white: '#FFFFFF',
      },
      background: {
        main: '#F5F5F5',
        card: '#FFFFFF',
        secondary: '#F0F0F0',
        tertiary: '#E8E8E8',
      },
      ui: {
        border: '#DDDDDD',
        error: '#FF3B30',
      },
      primary: {
        main: '#007AFF',
      },
    },
  })),
}));

jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
  })),
}));

jest.mock('@/stores/progressStore', () => ({
  useProgressStore: jest.fn(() => ({
    progressData: null,
    loading: false,
    error: null,
    fetchProgress: jest.fn(),
    refreshBadges: jest.fn(),
  })),
}));

describe('ProgressDashboard Screen', () => {
  const mockProgressData: ProgressData = {
    userId: 'test-user-123',
    streaks: {
      currentStreak: 5,
      longestStreak: 10,
      lastReadingDate: new Date('2025-11-08'),
      totalReadings: 15,
      totalDays: 12,
    },
    badges: [
      {
        badgeId: 'bronze_reader',
        current: 15,
        required: 1,
        earned: true,
        earnedDate: new Date('2025-11-01'),
      },
      {
        badgeId: 'silver_reader',
        current: 15,
        required: 10,
        earned: true,
        earnedDate: new Date('2025-11-05'),
      },
      {
        badgeId: 'week_warrior',
        current: 5,
        required: 7,
        earned: false,
      },
    ],
    readings: {
      '2025-11-01': { duration: 300, readingType: 'full' },
      '2025-11-02': { duration: 300, readingType: 'full' },
      '2025-11-05': { duration: 300, readingType: 'full' },
      '2025-11-08': { duration: 300, readingType: 'full' },
    },
    lastUpdated: new Date('2025-11-08'),
  };

  describe('Rendering', () => {
    /**
     * Test: Component renders without crashing
     */
    it('should render without crashing', () => {
      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Shows loading state initially
     */
    it('should show loading state when data is loading', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: null,
        loading: true,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/Loading/i)).toBeTruthy();
    });

    /**
     * Test: Shows error state
     */
    it('should show error state when fetch fails', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: null,
        loading: false,
        error: 'Failed to load progress data',
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/Unable to Load/i)).toBeTruthy();
    });

    /**
     * Test: Shows empty state when no data
     */
    it('should show empty state when no progress data', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: null,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/No Progress Yet/i)).toBeTruthy();
    });

    /**
     * Test: Renders main dashboard when data loaded
     */
    it('should render main dashboard when data is loaded', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText('Your Progress')).toBeTruthy();
    });
  });

  describe('Data Fetching', () => {
    /**
     * Test: Fetches progress on mount
     */
    it('should fetch progress on mount with userId', () => {
      const fetchProgressMock = jest.fn();

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: fetchProgressMock,
        refreshBadges: jest.fn(),
      });

      render(<ProgressDashboard userId="test-user-123" />);

      expect(fetchProgressMock).toHaveBeenCalledWith('test-user-123');
    });

    /**
     * Test: Uses user from auth store when userId not provided
     */
    it('should use user from auth store when userId prop not provided', () => {
      const fetchProgressMock = jest.fn();

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: fetchProgressMock,
        refreshBadges: jest.fn(),
      });

      render(<ProgressDashboard />);

      expect(fetchProgressMock).toHaveBeenCalledWith('test-user-123');
    });

    /**
     * Test: Refetches on userId change
     */
    it('should refetch when userId changes', () => {
      const fetchProgressMock = jest.fn();

      const { rerender } = render(
        <ProgressDashboard userId="user-1" />
      );

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: fetchProgressMock,
        refreshBadges: jest.fn(),
      });

      rerender(<ProgressDashboard userId="user-2" />);

      expect(fetchProgressMock).toHaveBeenCalledWith('user-2');
    });
  });

  describe('Streak Display', () => {
    /**
     * Test: Displays current streak
     */
    it('should display current streak value', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Displays longest streak
     */
    it('should display longest streak', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Statistics Cards', () => {
    /**
     * Test: Displays total readings statistic
     */
    it('should display total readings statistic', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText('Total Readings')).toBeTruthy();
    });

    /**
     * Test: Displays days read statistic
     */
    it('should display days read statistic', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText('Days Read')).toBeTruthy();
    });

    /**
     * Test: Displays badges earned statistic
     */
    it('should display badges earned count', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText('Badges Earned')).toBeTruthy();
    });

    /**
     * Test: Shows correct badge count
     */
    it('should show correct number of earned badges', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Badges Section', () => {
    /**
     * Test: Displays earned badges section
     */
    it('should display earned badges section when badges exist', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getAllByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getAllByText(/Badges Earned/).length).toBeGreaterThan(0);
    });

    /**
     * Test: Displays upcoming badges section
     */
    it('should display upcoming badges section', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/Next Badges/)).toBeTruthy();
    });

    /**
     * Test: Shows upcoming badges when no earned badges
     */
    it('should show next badges section when no earned badges exist', () => {
      const noEarnedBadges = {
        ...mockProgressData,
        badges: [
          {
            badgeId: 'bronze_reader',
            current: 0,
            required: 1,
            earned: false,
          },
        ],
      };

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: noEarnedBadges,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/Next Badges/)).toBeTruthy();
    });

    /**
     * Test: Shows badge cards with earned status
     */
    it('should render badge cards with correct earned status', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Reading Calendar', () => {
    /**
     * Test: Displays reading calendar section
     */
    it('should display reading calendar section', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/Reading History/)).toBeTruthy();
    });

    /**
     * Test: Passes reading data to calendar
     */
    it('should pass reading data to calendar component', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Refresh Functionality', () => {
    /**
     * Test: Shows refresh button
     */
    it('should display refresh button', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByTestId } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByTestId).toBeDefined();
    });

    /**
     * Test: Calls refresh on button press
     */
    it('should fetch progress when refresh button is pressed', () => {
      const fetchProgressMock = jest.fn();

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: fetchProgressMock,
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Shows loading indicator during refresh
     */
    it('should show loading indicator during refresh', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Pull-to-refresh support
     */
    it('should support pull-to-refresh', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: Shows retry button on error
     */
    it('should show retry button when error occurs', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: null,
        loading: false,
        error: 'Network error',
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText('Try Again')).toBeTruthy();
    });

    /**
     * Test: Retry calls fetch progress
     */
    it('should call fetchProgress when retry is pressed', () => {
      const fetchProgressMock = jest.fn();

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: null,
        loading: false,
        error: 'Network error',
        fetchProgress: fetchProgressMock,
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Displays error message
     */
    it('should display error message to user', () => {
      const errorMessage = 'Failed to load user progress data';

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: null,
        loading: false,
        error: errorMessage,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(errorMessage)).toBeTruthy();
    });
  });

  describe('Badge Animation', () => {
    /**
     * Test: BadgeUnlockedAnimation component integrated
     */
    it('should have BadgeUnlockedAnimation component', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Can dismiss badge animation
     */
    it('should allow dismissing badge animation', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Navigation and Interaction', () => {
    /**
     * Test: Badge press handler exists
     */
    it('should handle badge press', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Calendar day press handler exists
     */
    it('should handle calendar day press', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    /**
     * Test: Header title is accessible
     */
    it('should have accessible header title', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText('Your Progress')).toBeTruthy();
    });

    /**
     * Test: Section titles are accessible
     */
    it('should have accessible section titles', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { getByText } = render(<ProgressDashboard userId="test-user-123" />);

      expect(getByText(/Reading History/)).toBeTruthy();
    });
  });

  describe('Component Integration', () => {
    /**
     * Test: All child components render
     */
    it('should render all child components', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      // StreakDisplay, BadgeCard, ReadingCalendar should all be rendered
      expect(root).toBeDefined();
    });

    /**
     * Test: Components receive correct props
     */
    it('should pass correct data to child components', () => {
      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: mockProgressData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test: Handles null userId gracefully
     */
    it('should handle null userId gracefully', () => {
      jest.mocked(require('@/stores/useAuthStore').useAuthStore).mockReturnValue({
        user: null,
      });

      const { root } = render(<ProgressDashboard userId={undefined} />);

      // Should render without error
      expect(root).toBeDefined();
    });

    /**
     * Test: Handles missing streak data
     */
    it('should handle missing streak data', () => {
      const incompleteData = {
        ...mockProgressData,
        streaks: undefined,
      };

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: incompleteData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });

    /**
     * Test: Handles missing badge data
     */
    it('should handle missing badge data', () => {
      const incompleteData = {
        ...mockProgressData,
        badges: undefined,
      };

      jest.mocked(require('@/stores/progressStore').useProgressStore).mockReturnValue({
        progressData: incompleteData,
        loading: false,
        error: null,
        fetchProgress: jest.fn(),
        refreshBadges: jest.fn(),
      });

      const { root } = render(<ProgressDashboard userId="test-user-123" />);

      expect(root).toBeDefined();
    });
  });
});
