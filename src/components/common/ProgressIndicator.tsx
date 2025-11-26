/**
 * ProgressIndicator Component
 *
 * Detailed progress indicator for long-running operations.
 * Shows percentage, item count, ETA, and download speed.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { IconSizes } from '@/constants/icons';

interface ProgressIndicatorProps {
  percentage: number; // 0-100
  message: string;
  current?: number; // Current item number
  total?: number; // Total items
  showETA?: boolean;
  elapsedTime?: number; // Milliseconds
  showSpeed?: boolean;
  bytesDownloaded?: number;
  bytesTotal?: number;
  style?: any;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  percentage,
  message,
  current,
  total,
  showETA = false,
  elapsedTime = 0,
  showSpeed = false,
  bytesDownloaded = 0,
  bytesTotal = 0,
  style,
}) => {
  const { colors } = useTheme();
  const { etaText, speedText } = useMemo(() => {
    let eta = '';
    let speed = '';

    // Calculate ETA if we have elapsed time and progress
    if (showETA && elapsedTime > 0 && percentage > 0 && percentage < 100) {
      const rate = percentage / elapsedTime; // percentage per ms
      const remaining = 100 - percentage;
      const msRemaining = remaining / rate;
      const secondsRemaining = Math.round(msRemaining / 1000);

      if (secondsRemaining > 60) {
        const minutes = Math.round(secondsRemaining / 60);
        eta = `~${minutes}m remaining`;
      } else {
        eta = `~${secondsRemaining}s remaining`;
      }
    }

    // Calculate speed if we have bytes downloaded
    if (showSpeed && elapsedTime > 0 && bytesDownloaded > 0) {
      const seconds = elapsedTime / 1000;
      const bytesPerSecond = bytesDownloaded / seconds;
      const mbPerSecond = bytesPerSecond / (1024 * 1024);

      if (mbPerSecond > 1) {
        speed = `${mbPerSecond.toFixed(1)} MB/s`;
      } else {
        const kbPerSecond = bytesPerSecond / 1024;
        speed = `${kbPerSecond.toFixed(0)} KB/s`;
      }
    }

    return { etaText: eta, speedText: speed };
  }, [showETA, elapsedTime, percentage, showSpeed, bytesDownloaded]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.card }, style]}>
      {/* Header with message and percentage */}
      <View style={styles.header}>
        <View style={styles.messageSection}>
          <Text style={[styles.message, { color: colors.text.primary }]}>{message}</Text>
          <Text style={[styles.percentage, { color: colors.primary.blue }]}>{Math.round(percentage)}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: colors.primary.blue },
          ]}
        />
      </View>

      {/* Details Row (current/total, speed, ETA) */}
      <View style={styles.detailsRow}>
        {/* Current / Total */}
        {current !== undefined && total !== undefined && (
          <View style={styles.detail}>
            <Ionicons name="list" size={IconSizes.SMALL} color={colors.text.secondary} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
              {current} of {total}
            </Text>
          </View>
        )}

        {/* Bytes */}
        {bytesTotal > 0 && (
          <View style={styles.detail}>
            <Ionicons name="download" size={IconSizes.SMALL} color={colors.text.secondary} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>
              {formatBytes(bytesDownloaded)} / {formatBytes(bytesTotal)}
            </Text>
          </View>
        )}

        {/* Speed */}
        {speedText && (
          <View style={styles.detail}>
            <Ionicons name="speedometer" size={IconSizes.SMALL} color={colors.text.secondary} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>{speedText}</Text>
          </View>
        )}

        {/* ETA */}
        {etaText && (
          <View style={styles.detail}>
            <Ionicons name="time" size={IconSizes.SMALL} color={colors.text.secondary} />
            <Text style={[styles.detailText, { color: colors.text.secondary }]}>{etaText}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageSection: {
    flex: 1,
  },
  message: {
    ...Typography.body,
    fontWeight: '600',
  },
  percentage: {
    ...Typography.caption,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.caption,
    fontSize: 12,
  },
});
