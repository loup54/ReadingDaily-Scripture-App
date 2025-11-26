/**
 * ProfileSkeleton Component
 *
 * Animated skeleton loader for profile screen.
 * Shows placeholders for avatar, name, email, stats, and progress bar.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@constants';
import { SkeletonPlaceholder } from './SkeletonPlaceholder';

interface ProfileSkeletonProps {
  style?: any;
}

export const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <SkeletonPlaceholder
          width={100}
          height={100}
          borderRadius={50}
          marginBottom={0}
        />
      </View>

      {/* Name Skeleton */}
      <View style={styles.contentSection}>
        <SkeletonPlaceholder
          width={200}
          height={24}
          borderRadius={BorderRadius.md}
          marginBottom={Spacing.md}
        />

        {/* Email Skeleton */}
        <SkeletonPlaceholder
          width={240}
          height={16}
          borderRadius={BorderRadius.md}
          marginBottom={Spacing.lg}
        />

        {/* Stats Row - 3 boxes */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <SkeletonPlaceholder
              width="100%"
              height={40}
              borderRadius={BorderRadius.lg}
              marginBottom={Spacing.sm}
            />
            <SkeletonPlaceholder
              width="80%"
              height={14}
              borderRadius={BorderRadius.md}
              marginBottom={0}
            />
          </View>

          <View style={styles.statBox}>
            <SkeletonPlaceholder
              width="100%"
              height={40}
              borderRadius={BorderRadius.lg}
              marginBottom={Spacing.sm}
            />
            <SkeletonPlaceholder
              width="80%"
              height={14}
              borderRadius={BorderRadius.md}
              marginBottom={0}
            />
          </View>

          <View style={styles.statBox}>
            <SkeletonPlaceholder
              width="100%"
              height={40}
              borderRadius={BorderRadius.lg}
              marginBottom={Spacing.sm}
            />
            <SkeletonPlaceholder
              width="80%"
              height={14}
              borderRadius={BorderRadius.md}
              marginBottom={0}
            />
          </View>
        </View>

        {/* Progress Bar Section */}
        <View style={styles.progressSection}>
          <SkeletonPlaceholder
            width={80}
            height={14}
            borderRadius={BorderRadius.md}
            marginBottom={Spacing.sm}
          />
          <SkeletonPlaceholder
            width="100%"
            height={8}
            borderRadius={BorderRadius.sm}
            marginBottom={0}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  contentSection: {
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  progressSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
  },
});
