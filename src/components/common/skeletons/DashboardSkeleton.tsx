/**
 * DashboardSkeleton Component
 *
 * Animated skeleton loader for progress dashboard.
 * Shows placeholders for stat boxes, chart area, and progress cards.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@constants';
import { SkeletonPlaceholder } from './SkeletonPlaceholder';

interface DashboardSkeletonProps {
  style?: any;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Header/Title */}
      <View style={styles.headerSection}>
        <SkeletonPlaceholder
          width={150}
          height={24}
          borderRadius={BorderRadius.md}
          marginBottom={0}
        />
      </View>

      {/* Stats Row - 3 boxes */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, Shadows.md]}>
          <SkeletonPlaceholder
            width="60%"
            height={16}
            borderRadius={BorderRadius.md}
            marginBottom={Spacing.md}
          />
          <SkeletonPlaceholder
            width="80%"
            height={28}
            borderRadius={BorderRadius.md}
            marginBottom={0}
          />
        </View>

        <View style={[styles.statCard, Shadows.md]}>
          <SkeletonPlaceholder
            width="60%"
            height={16}
            borderRadius={BorderRadius.md}
            marginBottom={Spacing.md}
          />
          <SkeletonPlaceholder
            width="80%"
            height={28}
            borderRadius={BorderRadius.md}
            marginBottom={0}
          />
        </View>

        <View style={[styles.statCard, Shadows.md]}>
          <SkeletonPlaceholder
            width="60%"
            height={16}
            borderRadius={BorderRadius.md}
            marginBottom={Spacing.md}
          />
          <SkeletonPlaceholder
            width="80%"
            height={28}
            borderRadius={BorderRadius.md}
            marginBottom={0}
          />
        </View>
      </View>

      {/* Chart Section */}
      <View style={[styles.chartCard, Shadows.md]}>
        <SkeletonPlaceholder
          width={120}
          height={16}
          borderRadius={BorderRadius.md}
          marginBottom={Spacing.lg}
        />
        <SkeletonPlaceholder
          width="100%"
          height={180}
          borderRadius={BorderRadius.lg}
          marginBottom={0}
        />
      </View>

      {/* Progress Card Section */}
      <View style={[styles.progressCard, Shadows.md]}>
        <SkeletonPlaceholder
          width={140}
          height={16}
          borderRadius={BorderRadius.md}
          marginBottom={Spacing.md}
        />
        <SkeletonPlaceholder
          width="100%"
          height={8}
          borderRadius={BorderRadius.sm}
          marginBottom={Spacing.sm}
        />
        <SkeletonPlaceholder
          width="40%"
          height={14}
          borderRadius={BorderRadius.md}
          marginBottom={0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  chartCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
});
