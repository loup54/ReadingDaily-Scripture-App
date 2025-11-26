/**
 * Progress Chart Component
 * Phase 10C.5: Progress Visualization
 *
 * Displays:
 * - Sessions per day (bar chart)
 * - Score trend (line chart)
 * - Average metrics
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Statistics } from '@/types/subscription.types';

interface ProgressChartProps {
  statistics: Statistics;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ statistics }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;

  // Get last 7 days of data
  const lastSevenDays = statistics.sessionsByDay.slice(-7);
  const maxSessions = Math.max(...lastSevenDays.map((d) => d.count), 1);

  return (
    <View style={styles.container}>
      {/* Dimension Scores */}
      <View style={styles.dimensionSection}>
        <Text style={styles.dimensionTitle}>Skill Breakdown</Text>
        <DimensionBar label="Accuracy" value={statistics.averageAccuracy} />
        <DimensionBar label="Fluency" value={statistics.averageFluency} />
        <DimensionBar label="Completeness" value={statistics.averageCompleteness} />
        <DimensionBar label="Prosody" value={statistics.averageProsody} />
      </View>

      {/* Sessions Bar Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Sessions (Last 7 Days)</Text>
        <View style={[styles.barChart, { width: chartWidth }]}>
          {lastSevenDays.map((day, index) => {
            const height = (day.count / maxSessions) * 100 || 20;
            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <View key={index} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      minHeight: 20,
                      backgroundColor: day.count > 0 ? '#007AFF' : '#E0E0E0',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{dayName}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Trend Info */}
      <View style={styles.trendSection}>
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>Trend</Text>
          <Text style={[styles.trendValue, { color: getTrendColor(statistics.engagementTrend) }]}>
            {getTrendEmoji(statistics.engagementTrend)} {statistics.engagementTrend.toUpperCase()}
          </Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>Progress</Text>
          <Text style={styles.trendValue}>+{statistics.scoreProgress.toFixed(0)}%</Text>
        </View>
        <View style={styles.trendItem}>
          <Text style={styles.trendLabel}>Avg Duration</Text>
          <Text style={styles.trendValue}>{statistics.averageSessionDuration.toFixed(1)}m</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Dimension bar component
 */
const DimensionBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const percentage = Math.min(value, 100);

  return (
    <View style={styles.dimensionRow}>
      <Text style={styles.dimensionLabel}>{label}</Text>
      <View style={styles.dimensionBarContainer}>
        <View
          style={[
            styles.dimensionBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: getDimensionColor(percentage),
            },
          ]}
        />
      </View>
      <Text style={styles.dimensionValue}>{Math.round(value)}%</Text>
    </View>
  );
};

/**
 * Get color based on dimension value
 */
const getDimensionColor = (value: number): string => {
  if (value >= 80) return '#34C759'; // Green
  if (value >= 60) return '#007AFF'; // Blue
  if (value >= 40) return '#FF9500'; // Orange
  return '#FF3B30'; // Red
};

/**
 * Get trend emoji
 */
const getTrendEmoji = (trend: string): string => {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    default:
      return '➡️';
  }
};

/**
 * Get trend color
 */
const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'up':
      return '#34C759';
    case 'down':
      return '#FF3B30';
    default:
      return '#999';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
  },
  dimensionSection: {
    marginBottom: 20,
  },
  dimensionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dimensionLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  dimensionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  dimensionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dimensionValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  chartSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  trendSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});

export default ProgressChart;
