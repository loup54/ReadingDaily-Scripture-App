/**
 * Reading Calendar Component
 *
 * Displays a monthly calendar view of reading history
 * Shows which days had readings and allows month navigation
 * Phase E: Progress Tracking (Task 2.3)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { BorderRadius, Shadows } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import type { ReadingRecord } from '@/types/progress.types';

export interface ReadingCalendarProps {
  /**
   * Reading history keyed by date (YYYY-MM-DD)
   */
  readings: Record<string, ReadingRecord>;

  /**
   * Callback when a day is pressed
   */
  onDayPress?: (date: string) => void;

  /**
   * Optional style override
   */
  style?: ViewStyle;
}

interface CalendarDay {
  date: string | null;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasReading: boolean;
  readingRecord?: ReadingRecord;
}

export const ReadingCalendar: React.FC<ReadingCalendarProps> = ({
  readings,
  onDayPress,
  style,
}) => {
  const { colors } = useTheme();
  const [displayDate, setDisplayDate] = useState(new Date());

  /**
   * Get first day of month (0 = Sunday, 6 = Saturday)
   */
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  /**
   * Get number of days in month
   */
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  /**
   * Format date as YYYY-MM-DD for comparison
   */
  const formatDateKey = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  /**
   * Check if two dates are the same
   */
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  /**
   * Generate calendar days array
   */
  const generateCalendarDays = (): CalendarDay[] => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = getFirstDayOfMonth(displayDate);
    const daysInMonth = getDaysInMonth(displayDate);
    const prevMonthDays = getDaysInMonth(new Date(year, month - 1, 1));

    const days: CalendarDay[] = [];
    const today = new Date();

    // Previous month days (grayed out)
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());

      days.push({
        date: dateKey,
        day,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        hasReading: !!readings[dateKey],
        readingRecord: readings[dateKey],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(year, month, day);

      days.push({
        date: dateKey,
        day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        hasReading: !!readings[dateKey],
        readingRecord: readings[dateKey],
      });
    }

    // Next month days (grayed out)
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());

      days.push({
        date: dateKey,
        day,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        hasReading: !!readings[dateKey],
        readingRecord: readings[dateKey],
      });
    }

    return days;
  };

  /**
   * Handle previous month
   */
  const handlePreviousMonth = (): void => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1));
  };

  /**
   * Handle next month
   */
  const handleNextMonth = (): void => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1));
  };

  /**
   * Format month/year for display
   */
  const getMonthYearString = (): string => {
    return displayDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Render individual calendar day
   */
  const renderDay = (day: CalendarDay): React.ReactElement => {
    const isClickable = day.isCurrentMonth && day.date && onDayPress;

    return (
      <TouchableOpacity
        key={day.date}
        style={[
          styles.dayContainer,
          !day.isCurrentMonth && styles.otherMonthDay,
          {
            borderColor: colors.ui.border,
          },
        ]}
        onPress={() => {
          if (isClickable && day.date) {
            onDayPress(day.date);
          }
        }}
        disabled={!isClickable}
        activeOpacity={isClickable ? 0.7 : 1}
      >
        {/* Background for today */}
        {day.isToday && day.isCurrentMonth && (
          <View
            style={[
              styles.todayBackground,
              {
                borderColor: colors.primary.main,
              },
            ]}
          />
        )}

        {/* Day number background for reading days */}
        {day.hasReading && day.isCurrentMonth && (
          <View
            style={[
              styles.readingDayBackground,
              {
                backgroundColor: colors.primary.main,
              },
            ]}
          />
        )}

        {/* Day number */}
        <Text
          style={[
            styles.dayNumber,
            {
              color: day.isCurrentMonth ? colors.text.primary : colors.text.secondary,
            },
          ]}
        >
          {day.day}
        </Text>

        {/* Indicator dot for reading */}
        {day.hasReading && day.isCurrentMonth && (
          <View
            style={[
              styles.indicatorDot,
              {
                backgroundColor: colors.primary.main,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={[styles.container, style]}>
      {/* Header with Month/Year and Navigation */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.ui.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousMonth}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.monthYearText,
            {
              color: colors.text.primary,
            },
          ]}
        >
          {getMonthYearString()}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdayHeader, { backgroundColor: colors.background.secondary }]}>
        {weekDays.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                {
                  color: colors.text.secondary,
                },
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={[styles.calendarGrid, { backgroundColor: colors.background.card }]}>
        {calendarDays.map((day) => (
          <View key={day.date} style={styles.dayWrapper}>
            {renderDay(day)}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View
        style={[
          styles.legend,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.ui.border,
          },
        ]}
      >
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendIndicator,
              {
                backgroundColor: colors.primary.main,
              },
            ]}
          />
          <Text
            style={[
              styles.legendText,
              {
                color: colors.text.primary,
              },
            ]}
          >
            Reading Completed
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendIndicator,
              {
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: colors.primary.main,
              },
            ]}
          />
          <Text
            style={[
              styles.legendText,
              {
                color: colors.text.primary,
              },
            ]}
          >
            Today
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendIndicator,
              {
                backgroundColor: colors.background.tertiary || colors.background.secondary,
                borderWidth: 1,
                borderColor: colors.ui.border,
              },
            ]}
          />
          <Text
            style={[
              styles.legendText,
              {
                color: colors.text.secondary,
              },
            ]}
          >
            No Reading
          </Text>
        </View>
      </View>

      {/* Stats Footer */}
      <View
        style={[
          styles.stats,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.ui.border,
            borderTopColor: colors.ui.border,
          },
        ]}
      >
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statLabel,
              {
                color: colors.text.secondary,
              },
            ]}
          >
            Days Read This Month
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.primary.main,
              },
            ]}
          >
            {calendarDays.filter(
              (d) => d.isCurrentMonth && d.hasReading
            ).length}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.ui.border,
            },
          ]}
        />

        <View style={styles.statItem}>
          <Text
            style={[
              styles.statLabel,
              {
                color: colors.text.secondary,
              },
            ]}
          >
            Possible Days
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.text.primary,
              },
            ]}
          >
            {calendarDays.filter((d) => d.isCurrentMonth).length}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.ui.border,
            },
          ]}
        />

        <View style={styles.statItem}>
          <Text
            style={[
              styles.statLabel,
              {
                color: colors.text.secondary,
              },
            ]}
          >
            Consistency
          </Text>
          <Text
            style={[
              styles.statValue,
              {
                color: colors.primary.main,
              },
            ]}
          >
            {Math.round(
              (calendarDays.filter((d) => d.isCurrentMonth && d.hasReading)
                .length /
                calendarDays.filter((d) => d.isCurrentMonth).length) *
                100
            )}
            %
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  navButton: {
    padding: Spacing.sm,
  },

  monthYearText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },

  // Weekday Headers
  weekdayHeader: {
    flexDirection: 'row',
  },

  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },

  weekdayText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayWrapper: {
    width: '14.28%', // 7 columns
    aspectRatio: 1,
  },

  dayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    position: 'relative',
  },

  otherMonthDay: {
    opacity: 0.4,
  },

  todayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
  },

  readingDayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.sm,
  },

  dayNumber: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    zIndex: 1,
  },

  indicatorDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: BorderRadius.full,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  legendIndicator: {
    width: 16,
    height: 16,
    borderRadius: BorderRadius.sm,
  },

  legendText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },

  // Stats Footer
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderRadius: BorderRadius.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xs,
  },

  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs / 2,
    textAlign: 'center',
  },

  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },

  divider: {
    width: 1,
    marginHorizontal: Spacing.md,
  },
});
