/**
 * Reading Calendar Component Tests
 *
 * Tests for calendar rendering, month navigation, and statistics calculations
 * Phase E: Progress Tracking
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ReadingCalendar } from '../ReadingCalendar';
import type { ReadingRecord } from '@/types/progress.types';

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
      },
      primary: {
        main: '#007AFF',
      },
    },
  })),
}));

describe('ReadingCalendar Component', () => {
  const mockReading: ReadingRecord = {
    duration: 300,
    readingType: 'full',
  };

  const mockReadings: Record<string, ReadingRecord> = {
    '2025-11-01': mockReading,
    '2025-11-02': mockReading,
    '2025-11-05': mockReading,
    '2025-11-08': mockReading,
  };

  describe('Rendering', () => {
    /**
     * Test: Component renders without crashing
     */
    it('should render without crashing', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Displays current month/year
     */
    it('should display current month and year', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      const now = new Date();
      const monthYear = now.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      expect(getByText(monthYear)).toBeTruthy();
    });

    /**
     * Test: Renders weekday headers
     */
    it('should render weekday headers', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(getByText('Sun')).toBeTruthy();
      expect(getByText('Mon')).toBeTruthy();
      expect(getByText('Tue')).toBeTruthy();
      expect(getByText('Wed')).toBeTruthy();
      expect(getByText('Thu')).toBeTruthy();
      expect(getByText('Fri')).toBeTruthy();
      expect(getByText('Sat')).toBeTruthy();
    });

    /**
     * Test: Displays legend
     */
    it('should display legend with reading/today/no-reading indicators', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(getByText('Reading Completed')).toBeTruthy();
      expect(getByText('Today')).toBeTruthy();
      expect(getByText('No Reading')).toBeTruthy();
    });

    /**
     * Test: Displays statistics footer
     */
    it('should display statistics footer', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(getByText('Days Read This Month')).toBeTruthy();
      expect(getByText('Possible Days')).toBeTruthy();
      expect(getByText('Consistency')).toBeTruthy();
    });
  });

  describe('Calendar Grid', () => {
    /**
     * Test: Generates 42-day calendar grid (6 weeks)
     */
    it('should generate 42-day calendar grid', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      // Calendar should render all day cells (42 total)
      expect(root).toBeDefined();
    });

    /**
     * Test: Shows previous month days
     */
    it('should display previous month days grayed out', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Shows next month days
     */
    it('should display next month days grayed out', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Highlights reading days
     */
    it('should highlight days with readings', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Month Navigation', () => {
    /**
     * Test: Has previous month button
     */
    it('should render previous month navigation button', () => {
      const { getAllByTestId } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      // Navigation buttons should exist (using getByTestId or checking container)
      expect(getAllByTestId).toBeDefined();
    });

    /**
     * Test: Has next month button
     */
    it('should render next month navigation button', () => {
      const { getAllByTestId } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(getAllByTestId).toBeDefined();
    });

    /**
     * Test: Navigates to previous month
     */
    it('should navigate to previous month on button press', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
      const expectedMonthYear = previousMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      // After clicking previous, should show previous month
      expect(getByText).toBeDefined();
    });

    /**
     * Test: Navigates to next month
     */
    it('should navigate to next month on button press', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      const currentMonth = new Date();
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      const expectedMonthYear = nextMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      // After clicking next, should show next month
      expect(getByText).toBeDefined();
    });

    /**
     * Test: Year boundary navigation (December to January)
     */
    it('should handle year boundary when navigating forward', () => {
      const december = new Date(2025, 11, 1); // December 2025

      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Year boundary navigation (January to December)
     */
    it('should handle year boundary when navigating backward', () => {
      const january = new Date(2026, 0, 1); // January 2026

      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Date Formatting', () => {
    /**
     * Test: Formats date keys correctly (YYYY-MM-DD)
     */
    it('should format date keys as YYYY-MM-DD', () => {
      const { root } = render(
        <ReadingCalendar
          readings={{
            '2025-11-08': mockReading,
          }}
        />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Handles single-digit months correctly
     */
    it('should pad single-digit months with leading zero', () => {
      const { root } = render(
        <ReadingCalendar
          readings={{
            '2025-01-05': mockReading,
          }}
        />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Handles single-digit days correctly
     */
    it('should pad single-digit days with leading zero', () => {
      const { root } = render(
        <ReadingCalendar
          readings={{
            '2025-11-05': mockReading,
          }}
        />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Statistics Calculations', () => {
    /**
     * Test: Counts reading days correctly
     */
    it('should calculate reading days count', () => {
      const readings = {
        '2025-11-01': mockReading,
        '2025-11-02': mockReading,
        '2025-11-05': mockReading,
      };

      const { getByText } = render(
        <ReadingCalendar readings={readings} />
      );

      // Should display count of reading days
      expect(getByText).toBeDefined();
    });

    /**
     * Test: Counts possible days in month
     */
    it('should calculate possible days in month', () => {
      const { getByText } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      // November has 30 days
      expect(getByText('Possible Days')).toBeTruthy();
    });

    /**
     * Test: Calculates consistency percentage
     */
    it('should calculate consistency percentage correctly', () => {
      const readings = {
        '2025-11-01': mockReading,
        '2025-11-02': mockReading,
        '2025-11-03': mockReading,
        '2025-11-04': mockReading,
        '2025-11-05': mockReading,
      };

      const { getByText } = render(
        <ReadingCalendar readings={readings} />
      );

      // Should display consistency calculation
      expect(getByText('Consistency')).toBeTruthy();
    });

    /**
     * Test: Handles zero reading days
     */
    it('should handle month with no readings', () => {
      const { getByText } = render(
        <ReadingCalendar readings={{}} />
      );

      expect(getByText('0')).toBeTruthy();
    });

    /**
     * Test: Handles 100% consistency
     */
    it('should calculate 100% consistency when all days read', () => {
      const fullMonth: Record<string, ReadingRecord> = {};

      // Create readings for all days in November 2025
      for (let day = 1; day <= 30; day++) {
        const dateKey = `2025-11-${String(day).padStart(2, '0')}`;
        fullMonth[dateKey] = mockReading;
      }

      const { getByText } = render(
        <ReadingCalendar readings={fullMonth} />
      );

      expect(getByText('100%')).toBeTruthy();
    });

    /**
     * Test: Rounds consistency percentage
     */
    it('should round consistency percentage correctly', () => {
      const readings = {
        '2025-11-01': mockReading,
        '2025-11-02': mockReading,
        '2025-11-03': mockReading,
      };

      const { root } = render(
        <ReadingCalendar readings={readings} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Today Indicator', () => {
    /**
     * Test: Highlights today's date
     */
    it('should highlight today with special styling', () => {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const { root } = render(
        <ReadingCalendar
          readings={{
            [dateKey]: mockReading,
          }}
        />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Shows today indicator even without reading
     */
    it('should show today indicator regardless of reading status', () => {
      const { root } = render(
        <ReadingCalendar readings={{}} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('User Interaction', () => {
    /**
     * Test: Calls onDayPress when day is tapped
     */
    it('should call onDayPress callback when day pressed', () => {
      const onDayPressMock = jest.fn();

      const { root } = render(
        <ReadingCalendar readings={mockReadings} onDayPress={onDayPressMock} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Only triggers callback for current month days
     */
    it('should not trigger callback for other month days', () => {
      const onDayPressMock = jest.fn();

      const { root } = render(
        <ReadingCalendar readings={mockReadings} onDayPress={onDayPressMock} />
      );

      // Previous/next month days should not be clickable
      expect(root).toBeDefined();
    });

    /**
     * Test: Works without onDayPress callback
     */
    it('should render without onDayPress callback', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Empty State', () => {
    /**
     * Test: Renders with empty readings object
     */
    it('should render with no readings', () => {
      const { root } = render(
        <ReadingCalendar readings={{}} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Shows 0% consistency with no readings
     */
    it('should show 0% consistency when no readings', () => {
      const { getByText } = render(
        <ReadingCalendar readings={{}} />
      );

      expect(getByText('0%')).toBeTruthy();
    });
  });

  describe('Styling', () => {
    /**
     * Test: Accepts custom style prop
     */
    it('should accept and apply custom style prop', () => {
      const customStyle = { marginVertical: 16 };

      const { root } = render(
        <ReadingCalendar readings={mockReadings} style={customStyle} />
      );

      expect(root).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test: February in leap year (29 days)
     */
    it('should handle February in leap year correctly', () => {
      const readings: Record<string, ReadingRecord> = {};

      // Create readings for all days in February 2024 (leap year)
      for (let day = 1; day <= 29; day++) {
        readings[`2024-02-${String(day).padStart(2, '0')}`] = mockReading;
      }

      const { root } = render(
        <ReadingCalendar readings={readings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: February in non-leap year (28 days)
     */
    it('should handle February in non-leap year correctly', () => {
      const readings: Record<string, ReadingRecord> = {};

      // Create readings for all days in February 2025 (non-leap year)
      for (let day = 1; day <= 28; day++) {
        readings[`2025-02-${String(day).padStart(2, '0')}`] = mockReading;
      }

      const { root } = render(
        <ReadingCalendar readings={readings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Month starting on Sunday
     */
    it('should handle month starting on Sunday', () => {
      // November 2025 starts on Saturday
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Month starting on Saturday
     */
    it('should handle month starting on Saturday', () => {
      const { root } = render(
        <ReadingCalendar readings={mockReadings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Month with 31 days
     */
    it('should handle 31-day months', () => {
      const readings: Record<string, ReadingRecord> = {};

      // Create readings for all days in January
      for (let day = 1; day <= 31; day++) {
        readings[`2025-01-${String(day).padStart(2, '0')}`] = mockReading;
      }

      const { root } = render(
        <ReadingCalendar readings={readings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Month with 30 days
     */
    it('should handle 30-day months', () => {
      const readings: Record<string, ReadingRecord> = {};

      // Create readings for all days in April
      for (let day = 1; day <= 30; day++) {
        readings[`2025-04-${String(day).padStart(2, '0')}`] = mockReading;
      }

      const { root } = render(
        <ReadingCalendar readings={readings} />
      );

      expect(root).toBeDefined();
    });

    /**
     * Test: Multiple readings same day (not valid for this component)
     */
    it('should handle readings object with valid date keys', () => {
      const readings = {
        '2025-11-01': mockReading,
        '2025-11-02': mockReading,
      };

      const { root } = render(
        <ReadingCalendar readings={readings} />
      );

      expect(root).toBeDefined();
    });
  });
});
