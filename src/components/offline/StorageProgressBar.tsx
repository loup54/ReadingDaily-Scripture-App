/**
 * Storage Progress Bar Component
 * Visualizes storage usage with color warnings
 * Shows percentage, used/total storage, and warning indicators
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants';

interface StorageProgressBarProps {
  usedBytes: number;
  totalBytes: number;
  maxBytes?: number;
  showWarning?: boolean;
  warningThreshold?: number; // percentage (default 80)
  criticalThreshold?: number; // percentage (default 90)
}

/**
 * Format bytes to human-readable size
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Storage Progress Bar Component
 */
export const StorageProgressBar: React.FC<StorageProgressBarProps> = ({
  usedBytes,
  totalBytes,
  maxBytes,
  showWarning = true,
  warningThreshold = 80,
  criticalThreshold = 90,
}) => {
  const isDark = useColorScheme() === 'dark';
  const displayTotal = maxBytes || totalBytes;

  const percentageUsed = useMemo(() => {
    return displayTotal > 0 ? (usedBytes / displayTotal) * 100 : 0;
  }, [usedBytes, displayTotal]);

  const status = useMemo(() => {
    if (percentageUsed >= criticalThreshold) {
      return { label: 'Critical', color: Colors.status.error };
    }
    if (percentageUsed >= warningThreshold) {
      return { label: 'Warning', color: Colors.status.warning };
    }
    return { label: 'Good', color: Colors.status.success };
  }, [percentageUsed, warningThreshold, criticalThreshold]);

  const barColor = useMemo(() => {
    if (percentageUsed >= criticalThreshold) {
      return Colors.status.error;
    }
    if (percentageUsed >= warningThreshold) {
      return Colors.status.warning;
    }
    return Colors.primary.blue;
  }, [percentageUsed, warningThreshold, criticalThreshold]);

  const backgroundColor = isDark ? '#2A2A2A' : '#F5F5F5';

  return (
    <View style={styles.container}>
      {/* Storage Info Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            Storage Usage
          </Text>
          {showWarning && percentageUsed >= warningThreshold && (
            <Text style={[styles.statusBadge, { backgroundColor: status.color }]}>
              {status.label}
            </Text>
          )}
        </View>
        <Text style={[styles.percentage, { color: barColor }]}>
          {percentageUsed.toFixed(1)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.barContainer, { backgroundColor }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(percentageUsed, 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      {/* Storage Details */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: isDark ? Colors.text.secondary : Colors.text.secondary }]}>
            Used
          </Text>
          <Text style={[styles.detailValue, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            {formatBytes(usedBytes)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: isDark ? Colors.text.secondary : Colors.text.secondary }]}>
            Available
          </Text>
          <Text style={[styles.detailValue, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            {formatBytes(displayTotal - usedBytes)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: isDark ? Colors.text.secondary : Colors.text.secondary }]}>
            Total
          </Text>
          <Text style={[styles.detailValue, { color: isDark ? Colors.text.white : Colors.text.primary }]}>
            {formatBytes(displayTotal)}
          </Text>
        </View>
      </View>

      {/* Warning Messages */}
      {showWarning && percentageUsed >= warningThreshold && (
        <View style={[styles.warningContainer, { backgroundColor: isDark ? '#3A2A1F' : '#FFF3E0' }]}>
          <Text style={[styles.warningText, { color: isDark ? '#FFB74D' : '#E65100' }]}>
            {percentageUsed >= criticalThreshold
              ? '⚠️ Storage critically low. Clear some data to continue.'
              : '⚠️ Storage usage is high. Consider clearing old readings.'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.white,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.ui.divider,
  },
  warningContainer: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
