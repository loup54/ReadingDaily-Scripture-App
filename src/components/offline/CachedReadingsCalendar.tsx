/**
 * Cached Readings Calendar Component
 * Shows calendar with visual indicators for cached reading dates
 * Allows selection of dates to view cached readings
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants';

interface CachedReadingsCalendarProps {
  cachedDates: string[]; // Array of dates in YYYY-MM-DD format
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

/**
 * Format date for display
 */
const formatDateShort = (date: Date): string => {
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

/**
 * Check if date is cached
 */
const isDateCached = (date: Date, cachedDates: string[]): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  return cachedDates.includes(dateStr);
};

/**
 * Check if date is today
 */
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get day name from number (0-6)
 */
const getDayName = (dayIndex: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

/**
 * Cached Readings Calendar Component
 */
export const CachedReadingsCalendar: React.FC<CachedReadingsCalendarProps> = ({
  cachedDates,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}) => {
  const isDark = useColorScheme() === 'dark';

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [selectedDate]);

  const isSelectedDateCached = isDateCached(selectedDate, cachedDates);

  return (
    <View style={styles.container}>
      {/* Month/Year Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} activeOpacity={0.7}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.primary.blue}
          />
        </TouchableOpacity>

        <Text style={[styles.monthYear, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
          {formatDateShort(selectedDate)}
        </Text>

        <TouchableOpacity onPress={onNextMonth} activeOpacity={0.7}>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={Colors.primary.blue}
          />
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

          const cached = isDateCached(day, cachedDates);
          const selected =
            day.getDate() === selectedDate.getDate() &&
            day.getMonth() === selectedDate.getMonth() &&
            day.getFullYear() === selectedDate.getFullYear();
          const today = isToday(day);

          let dayStyle = styles.day;
          let textStyle = [styles.dayText];

          if (selected) {
            dayStyle = [dayStyle, styles.selectedDay];
            textStyle.push({
              color: Colors.text.white,
              fontWeight: '700',
            });
          } else if (cached) {
            dayStyle = [dayStyle, styles.cachedDay];
            textStyle.push({ color: Colors.primary.blue, fontWeight: '600' });
          } else if (today) {
            dayStyle = [dayStyle, styles.todayDay];
            textStyle.push({ color: isDark ? Colors.text.white : Colors.text.primary });
          } else {
            textStyle.push({ color: isDark ? Colors.text.white : Colors.text.primary });
          }

          return (
            <TouchableOpacity
              key={`day-${day.getTime()}`}
              style={dayStyle}
              onPress={() => onDateSelect(day)}
              activeOpacity={0.7}
            >
              <Text style={textStyle}>{day.getDate()}</Text>

              {/* Indicator for cached dates */}
              {cached && !selected && (
                <View
                  style={[
                    styles.cacheIndicator,
                    { backgroundColor: Colors.primary.blue },
                  ]}
                />
              )}

              {/* Indicator for selected date */}
              {selected && (
                <View
                  style={[
                    styles.selectedIndicator,
                    { backgroundColor: Colors.text.white },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: Colors.primary.blue },
            ]}
          />
          <Text
            style={[
              styles.legendText,
              { color: isDark ? Colors.text.secondary : Colors.text.secondary },
            ]}
          >
            Cached
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: Colors.primary.blue,
              },
            ]}
          />
          <Text
            style={[
              styles.legendText,
              { color: isDark ? Colors.text.secondary : Colors.text.secondary },
            ]}
          >
            Selected
          </Text>
        </View>
      </View>

      {/* Cache Status Indicator */}
      <View
        style={[
          styles.cacheStatus,
          {
            backgroundColor: isSelectedDateCached ? '#E8F5E9' : '#FFEBEE',
            borderColor: isSelectedDateCached ? Colors.status.success : Colors.status.error,
          },
        ]}
      >
        <Ionicons
          name={isSelectedDateCached ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={isSelectedDateCached ? Colors.status.success : Colors.status.error}
        />
        <Text
          style={[
            styles.cacheStatusText,
            {
              color: isSelectedDateCached ? Colors.status.success : Colors.status.error,
            },
          ]}
        >
          {isSelectedDateCached
            ? 'Reading cached offline'
            : 'Reading not cached - download to access offline'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  monthYear: {
    fontSize: 18,
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
    borderRadius: BorderRadius.md,
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
  cachedDay: {
    backgroundColor: `${Colors.primary.blue}15`,
    borderWidth: 1,
    borderColor: Colors.primary.blue,
  },
  selectedDay: {
    backgroundColor: Colors.primary.blue,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: Colors.primary.blue,
  },
  cacheIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  selectedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cacheStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  cacheStatusText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
