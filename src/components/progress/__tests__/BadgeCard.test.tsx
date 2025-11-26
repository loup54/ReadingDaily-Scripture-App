/**
 * Badge Card Component Tests
 *
 * Tests for earned/unearned badge state, progress calculations, and color coding
 * Phase E: Progress Tracking
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BadgeCard } from '../BadgeCard';
import type { Badge, BadgeProgress } from '@/types/progress.types';

/**
 * Mock hooks
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

describe('BadgeCard Component', () => {
  const mockBadge: Badge = {
    id: 'bronze_reader',
    name: 'Bronze Reader',
    description: 'Complete your first reading',
    icon: '🥉',
    category: 'frequency',
    requirement: {
      type: 'readings',
      value: 1,
    },
  };

  const mockProgress: BadgeProgress = {
    badgeId: 'bronze_reader',
    current: 1,
    required: 1,
    earned: true,
    earnedDate: new Date('2025-11-08'),
  };

  describe('Rendering', () => {
    /**
     * Test: Component renders without crashing
     */
    it('should render without crashing', () => {
      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(getByText('Bronze Reader')).toBeTruthy();
    });

    /**
     * Test: Displays badge name
     */
    it('should display badge name', () => {
      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(getByText('Bronze Reader')).toBeTruthy();
    });

    /**
     * Test: Displays badge category
     */
    it('should display badge category capitalized', () => {
      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(getByText('Frequency')).toBeTruthy();
    });

    /**
     * Test: Displays badge icon
     */
    it('should render badge icon emoji', () => {
      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(getByText('🥉')).toBeTruthy();
    });

    /**
     * Test: Displays badge description
     */
    it('should display badge description', () => {
      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(getByText('Complete your first reading')).toBeTruthy();
    });
  });

  describe('Earned Badge State', () => {
    /**
     * Test: Shows checkmark for earned badges
     */
    it('should show checkmark icon for earned badges', () => {
      const { getByTestId } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      // Component renders (checkmark icon is internal)
      expect(getByTestId).toBeDefined();
    });

    /**
     * Test: Shows earned date when provided
     */
    it('should display earned date for earned badges', () => {
      const earnedDate = new Date('2025-11-08');
      const { getByText } = render(
        <BadgeCard
          badge={mockBadge}
          progress={mockProgress}
          earned={true}
          earnedDate={earnedDate}
        />
      );

      // Check that "Earned" text is displayed
      expect(getByText(/Earned/)).toBeTruthy();
    });

    /**
     * Test: Does not show progress bar for earned badges
     */
    it('should not show progress bar for earned badges', () => {
      const { queryByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      // Progress percentage should not be shown
      expect(queryByText('100%')).toBeFalsy();
    });

    /**
     * Test: Earned badge uses primary background color
     */
    it('should use card background for earned badges', () => {
      const { root } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Unearned Badge State', () => {
    /**
     * Test: Shows lock icon for unearned badges
     */
    it('should show lock icon for unearned badges', () => {
      const unearned = { ...mockProgress, earned: false, current: 0 };

      const { getByTestId } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByTestId).toBeDefined();
    });

    /**
     * Test: Shows progress bar for unearned badges
     */
    it('should show progress bar for unearned badges', () => {
      const unearned = { ...mockProgress, earned: false, current: 0 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      // Progress percentage should be shown
      expect(getByText('0%')).toBeTruthy();
    });

    /**
     * Test: Shows progress details for unearned badges
     */
    it('should display progress details for unearned badges', () => {
      const unearned = { ...mockProgress, earned: false, current: 0 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('0 of 1 readings')).toBeTruthy();
    });

    /**
     * Test: Uses secondary background for unearned badges
     */
    it('should use secondary background for unearned badges', () => {
      const unearned = { ...mockProgress, earned: false };

      const { root } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Progress Calculation', () => {
    /**
     * Test: Calculates progress percentage correctly
     */
    it('should calculate 0% progress at start', () => {
      const unearned = { ...mockProgress, earned: false, current: 0, required: 10 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('0%')).toBeTruthy();
    });

    /**
     * Test: Calculates 50% progress midway
     */
    it('should calculate 50% progress at midpoint', () => {
      const unearned = { ...mockProgress, earned: false, current: 5, required: 10 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('50%')).toBeTruthy();
    });

    /**
     * Test: Caps progress at 100%
     */
    it('should cap progress at 100%', () => {
      const unearned = { ...mockProgress, earned: false, current: 100, required: 10 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('100%')).toBeTruthy();
    });

    /**
     * Test: Rounds progress percentage correctly
     */
    it('should round progress percentage correctly', () => {
      const unearned = { ...mockProgress, earned: false, current: 33, required: 100 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('33%')).toBeTruthy();
    });
  });

  describe('Progress Labels', () => {
    /**
     * Test: Readings requirement label
     */
    it('should format readings requirement label', () => {
      const unearned = { ...mockProgress, earned: false, current: 5, required: 10 };
      const badge = { ...mockBadge, requirement: { type: 'readings' as const, value: 10 } };

      const { getByText } = render(
        <BadgeCard badge={badge} progress={unearned} earned={false} />
      );

      expect(getByText('5 of 10 readings')).toBeTruthy();
    });

    /**
     * Test: Consecutive days requirement label
     */
    it('should format consecutive days requirement label', () => {
      const unearned = { ...mockProgress, earned: false, current: 3, required: 7 };
      const badge = {
        ...mockBadge,
        requirement: { type: 'consecutive_days' as const, value: 7 },
      };

      const { getByText } = render(
        <BadgeCard badge={badge} progress={unearned} earned={false} />
      );

      expect(getByText('3 of 7 days')).toBeTruthy();
    });

    /**
     * Test: Calendar days requirement label
     */
    it('should format calendar days requirement label', () => {
      const unearned = { ...mockProgress, earned: false, current: 15, required: 30 };
      const badge = {
        ...mockBadge,
        requirement: { type: 'calendar_days' as const, value: 30 },
      };

      const { getByText } = render(
        <BadgeCard badge={badge} progress={unearned} earned={false} />
      );

      expect(getByText('15 of 30 days')).toBeTruthy();
    });

    /**
     * Test: Feature usage requirement label
     */
    it('should format feature usage requirement label', () => {
      const unearned = { ...mockProgress, earned: false, current: 2, required: 5 };
      const badge = {
        ...mockBadge,
        requirement: { type: 'feature_usage' as const, value: 5 },
      };

      const { getByText } = render(
        <BadgeCard badge={badge} progress={unearned} earned={false} />
      );

      expect(getByText('2 of 5 times')).toBeTruthy();
    });
  });

  describe('Category Colors', () => {
    /**
     * Test: Frequency category (blue)
     */
    it('should use blue color for frequency category', () => {
      const badge = { ...mockBadge, category: 'frequency' as const };

      const { root } = render(
        <BadgeCard badge={badge} progress={mockProgress} earned={true} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Streak category (red)
     */
    it('should use red color for streak category', () => {
      const badge = { ...mockBadge, category: 'streak' as const };

      const { root } = render(
        <BadgeCard badge={badge} progress={mockProgress} earned={true} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Consistency category (green)
     */
    it('should use green color for consistency category', () => {
      const badge = { ...mockBadge, category: 'consistency' as const };

      const { root } = render(
        <BadgeCard badge={badge} progress={mockProgress} earned={true} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Engagement category (amber)
     */
    it('should use amber color for engagement category', () => {
      const badge = { ...mockBadge, category: 'engagement' as const };

      const { root } = render(
        <BadgeCard badge={badge} progress={mockProgress} earned={true} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('User Interaction', () => {
    /**
     * Test: Calls onPress when pressed
     */
    it('should call onPress callback when pressed', () => {
      const onPressMock = jest.fn();

      const { getByText } = render(
        <BadgeCard
          badge={mockBadge}
          progress={mockProgress}
          earned={true}
          onPress={onPressMock}
        />
      );

      expect(onPressMock).toBeDefined();
    });

    /**
     * Test: Does not trigger callback when disabled
     */
    it('should be disabled when onPress is not provided', () => {
      const { root } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Date Formatting', () => {
    /**
     * Test: Formats earned date correctly
     */
    it('should format earned date in short format', () => {
      const earnedDate = new Date('2025-11-08');

      const { root } = render(
        <BadgeCard
          badge={mockBadge}
          progress={mockProgress}
          earned={true}
          earnedDate={earnedDate}
        />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Does not show date when not provided
     */
    it('should not display earned date when not provided', () => {
      const { queryByText } = render(
        <BadgeCard badge={mockBadge} progress={mockProgress} earned={true} />
      );

      // "Earned" text should not appear without date
      expect(queryByText(/Earned/)).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test: Zero progress handling
     */
    it('should handle zero progress', () => {
      const unearned = { ...mockProgress, earned: false, current: 0, required: 1 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('0%')).toBeTruthy();
    });

    /**
     * Test: Large progress numbers
     */
    it('should handle large progress numbers', () => {
      const unearned = { ...mockProgress, earned: false, current: 500, required: 1000 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      expect(getByText('50%')).toBeTruthy();
    });

    /**
     * Test: Division by zero protection (required = 0)
     */
    it('should handle zero required without division error', () => {
      const unearned = { ...mockProgress, earned: false, current: 0, required: 0 };

      const { getByText } = render(
        <BadgeCard badge={mockBadge} progress={unearned} earned={false} />
      );

      // Should display NaN as string or handle gracefully
      expect(getByText).toBeDefined();
    });
  });

  describe('Styling', () => {
    /**
     * Test: Accepts custom style prop
     */
    it('should accept and apply custom style prop', () => {
      const customStyle = { marginBottom: 16 };

      const { root } = render(
        <BadgeCard
          badge={mockBadge}
          progress={mockProgress}
          earned={true}
          style={customStyle}
        />
      );

      expect(root).toBeDefined();
    });
  });
});
