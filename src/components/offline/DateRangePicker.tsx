/**
 * Date Range Picker Component
 * Allows selection of start and end dates for downloads
 * Shows calendar with range highlighting
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

/**
 * Check if date is between start and end
 */
const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const time = date.getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
};

/**
 * Check if date is start or end date
 */
const isDateBoundary = (date: Date, startDate: Date, endDate: Date): boolean => {
  const dateTime = date.getTime();
  return dateTime === startDate.getTime() || dateTime === endDate.getTime();
};

/**
 * Format date for display
 */
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get day name from number
 */
const getDayName = (dayIndex: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

/**
 * Date Range Picker Component
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
  maxDate = new Date(),
}) => {
  const isDark = useColorScheme() === 'dark';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  /**
   * Generate calendar days for current month
   */
  const calendarDays = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty cells before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  /**
   * Handle date selection
   */
  const handleDateSelect = useCallback(
    (date: Date) => {
      if (selectingStart) {
        // If selected start date is after current end date, update end date
        if (date > endDate) {
          onEndDateChange(date);
        }
        onStartDateChange(date);
        setSelectingStart(false);
      } else {
        // If selected end date is before current start date, update start date
        if (date < startDate) {
          onStartDateChange(date);
        }
        onEndDateChange(date);
        setSelectingStart(true);
      }
    },
    [startDate, endDate, selectingStart, onStartDateChange, onEndDateChange]
  );

  /**
   * Handle previous month
   */
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  /**
   * Handle next month
   */
  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  /**
   * Format range text
   */
  const getRangeText = (): string => {
    if (startDate.getTime() === endDate.getTime()) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  /**
   * Calculate days in range
   */
  const daysInRange = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  return (
    <View style={styles.container}>
      {/* Range Display */}
      <View style={[styles.rangeDisplay, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
        <View style={styles.rangeInfo}>
          <Text style={[styles.rangeLabel, { color: isDark ? Colors.text.secondary : Colors.text.secondary }]}>
            Selected Range
          </Text>
          <Text style={[styles.rangeText, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            {getRangeText()}
          </Text>
        </View>
        <View style={styles.daysCount}>
          <Text style={[styles.daysLabel, { color: isDark ? Colors.text.secondary : Colors.text.secondary }]}>
            Days
          </Text>
          <Text style={[styles.daysNumber, { color: Colors.primary.blue }]}>
            {daysInRange}
          </Text>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: selectingStart ? Colors.primary.blue : isDark ? '#2A2A2A' : '#F5F5F5',
            },
          ]}
          onPress={() => setSelectingStart(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modeButtonText,
              {
                color: selectingStart ? Colors.text.white : isDark ? Colors.text.secondary : Colors.text.secondary,
              },
            ]}
          >
            Select Start Date
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            {
              backgroundColor: !selectingStart ? Colors.primary.blue : isDark ? '#2A2A2A' : '#F5F5F5',
            },
          ]}
          onPress={() => setSelectingStart(false)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modeButtonText,
              {
                color: !selectingStart ? Colors.text.white : isDark ? Colors.text.secondary : Colors.text.secondary,
              },
            ]}
          >
            Select End Date
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary.blue} />
        </TouchableOpacity>

        <Text style={[styles.monthYear, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>

        <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={24} color={Colors.primary.blue} />
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.daysOfWeek}>
        {Array.from({ length: 7 }).map((_, index) => (
          <Text
            key={index}
            style={[
              styles.dayName,
              { color: isDark ? Colors.text.secondary : Colors.text.secondary },
            ]}
          >
            {getDayName(index)}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.emptyDay} />;
          }

          const inRange = isDateInRange(day, startDate, endDate);
          const isBoundary = isDateBoundary(day, startDate, endDate);
          const isStart = day.getTime() === startDate.getTime();
          const isEnd = day.getTime() === endDate.getTime();
          const isToday =
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth() &&
            day.getFullYear() === new Date().getFullYear();

          let dayStyle = styles.day;
          let textStyle = [styles.dayText, { color: isDark ? Colors.text.white : Colors.text.primary }];

          if (isBoundary) {
            dayStyle = [dayStyle, styles.boundaryDay];
            textStyle = [styles.dayText, { color: Colors.text.white, fontWeight: '700' }];
          } else if (inRange) {
            dayStyle = [dayStyle, styles.rangeDay];
          } else if (isToday) {
            dayStyle = [dayStyle, styles.todayDay];
          }

          return (
            <TouchableOpacity
              key={`day-${day.getTime()}`}
              style={dayStyle}
              onPress={() => handleDateSelect(day)}
              activeOpacity={0.7}
            >
              <Text style={textStyle}>{day.getDate()}</Text>
              {isBoundary && (
                <Text style={styles.boundaryLabel}>
                  {isStart ? 'S' : 'E'}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Select Buttons */}
      <View style={styles.quickSelect}>
        <TouchableOpacity
          style={[styles.quickButton, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
          onPress={() => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 6);
            onStartDateChange(start);
            onEndDateChange(end);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickButtonText, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            Last 7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickButton, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
          onPress={() => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 13);
            onStartDateChange(start);
            onEndDateChange(end);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickButtonText, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            Last 14 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickButton, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
          onPress={() => {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 29);
            onStartDateChange(start);
            onEndDateChange(end);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.quickButtonText, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            Last 30 Days
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rangeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  rangeInfo: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  rangeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  daysCount: {
    alignItems: 'center',
  },
  daysLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  daysNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
    marginBottom: Spacing.sm,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  boundaryDay: {
    backgroundColor: Colors.primary.blue,
    borderRadius: BorderRadius.md,
  },
  boundaryLabel: {
    position: 'absolute',
    fontSize: 8,
    fontWeight: '700',
    color: Colors.text.white,
    top: 1,
    right: 2,
  },
  rangeDay: {
    backgroundColor: `${Colors.primary.blue}25`,
  },
  todayDay: {
    borderWidth: 1,
    borderColor: Colors.primary.blue,
    borderRadius: BorderRadius.md,
  },
  quickSelect: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
