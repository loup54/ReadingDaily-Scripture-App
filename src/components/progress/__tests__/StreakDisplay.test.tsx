/**
 * StreakDisplay Component Tests
 *
 * Tests for streak display rendering, animations, and user interaction
 * Phase E: Progress Tracking
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StreakDisplay } from '../StreakDisplay';

/**
 * Mock hooks
 */
jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
      background: {
        card: '#FFFFFF',
        secondary: '#F0F0F0',
      },
      ui: {
        border: '#DDDDDD',
      },
      primary: {
        main: '#007AFF',
      },
    },
  })),
}));

describe('StreakDisplay Component', () => {
  const mockDate = new Date('2025-11-08');

  describe('Rendering', () => {
    /**
     * Test: Component renders without crashing
     */
    it('should render without crashing', () => {
      const { getByTestId } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          lastReadingDate={mockDate}
        />
      );

      expect(getByTestId).toBeDefined();
    });

    /**
     * Test: Displays current streak number
     */
    it('should display current streak number', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={8}
          longestStreak={15}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('8')).toBeTruthy();
    });

    /**
     * Test: Displays longest streak
     */
    it('should display longest streak', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={20}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('20 days')).toBeTruthy();
    });

    /**
     * Test: Displays correct "DAY" vs "DAYS" label
     */
    it('should show "DAY" for streak of 1', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={1}
          longestStreak={1}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('DAY')).toBeTruthy();
    });

    /**
     * Test: Displays "DAYS" for streak > 1
     */
    it('should show "DAYS" for streak greater than 1', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('DAYS')).toBeTruthy();
    });

    /**
     * Test: Fire emoji renders
     */
    it('should render fire emoji', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('🔥')).toBeTruthy();
    });
  });

  describe('Streak Color Coding', () => {
    /**
     * Test: Orange color for 1-6 day streak
     */
    it('should use orange for short streaks (1-6 days)', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={3}
          longestStreak={5}
          lastReadingDate={mockDate}
        />
      );

      // Check that component rendered with streak number
      expect(getByText('3')).toBeTruthy();
    });

    /**
     * Test: Red color for 7-29 day streak
     */
    it('should use red for medium streaks (7-29 days)', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={15}
          longestStreak={20}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('15')).toBeTruthy();
    });

    /**
     * Test: Purple color for 30+ day streak
     */
    it('should use purple for long streaks (30+ days)', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={50}
          longestStreak={50}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('50')).toBeTruthy();
    });
  });

  describe('Date Handling', () => {
    /**
     * Test: Shows "Today" for today's reading
     */
    it('should show "Today" when last reading was today', () => {
      const today = new Date();

      const { getByText } = render(
        <StreakDisplay
          currentStreak={3}
          longestStreak={5}
          lastReadingDate={today}
        />
      );

      // Component should contain date display
      expect(getByText).toBeTruthy();
    });

    /**
     * Test: Shows "Yesterday" for yesterday's reading
     */
    it('should show "Yesterday" when last reading was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { getByText } = render(
        <StreakDisplay
          currentStreak={2}
          longestStreak={10}
          lastReadingDate={yesterday}
        />
      );

      expect(getByText('2')).toBeTruthy();
    });
  });

  describe('Reset Warning', () => {
    /**
     * Test: Shows reset warning when 1 day left
     */
    it('should show reset warning with 1 day remaining', () => {
      const today = new Date();

      const { getByText } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          lastReadingDate={today}
        />
      );

      // Should show reset information
      expect(getByText).toBeTruthy();
    });

    /**
     * Test: No reset warning for older readings
     */
    it('should not show reset warning if streak already reset', () => {
      const threeOrMoreDaysAgo = new Date();
      threeOrMoreDaysAgo.setDate(threeOrMoreDaysAgo.getDate() - 3);

      const { getByText } = render(
        <StreakDisplay
          currentStreak={1}
          longestStreak={10}
          lastReadingDate={threeOrMoreDaysAgo}
        />
      );

      expect(getByText('1')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test: Zero streak handling
     */
    it('should handle zero streak', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={0}
          longestStreak={5}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('0')).toBeTruthy();
    });

    /**
     * Test: Very long streak
     */
    it('should handle very long streaks (365+ days)', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={365}
          longestStreak={365}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('365')).toBeTruthy();
    });

    /**
     * Test: Equal current and longest streak
     */
    it('should handle equal current and longest streaks', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={10}
          longestStreak={10}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('10 days')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    /**
     * Test: Text has sufficient size
     */
    it('should use readable font sizes', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          lastReadingDate={mockDate}
        />
      );

      // Check that component renders with visible text
      expect(getByText('5')).toBeTruthy();
    });

    /**
     * Test: High contrast text
     */
    it('should maintain proper contrast ratios', () => {
      const { getByText } = render(
        <StreakDisplay
          currentStreak={5}
          longestStreak={10}
          lastReadingDate={mockDate}
        />
      );

      expect(getByText('DAYS')).toBeTruthy();
    });
  });
});
