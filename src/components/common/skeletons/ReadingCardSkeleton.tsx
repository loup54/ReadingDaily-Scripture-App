/**
 * ReadingCardSkeleton Component
 *
 * Animated skeleton loader for reading cards.
 * Matches the layout of DailyReadingCard with reference, title, and text lines.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@constants';
import { SkeletonPlaceholder } from './SkeletonPlaceholder';

interface ReadingCardSkeletonProps {
  style?: any;
  marginBottom?: number;
}

export const ReadingCardSkeleton: React.FC<ReadingCardSkeletonProps> = ({
  style,
  marginBottom = Spacing.lg,
}) => {
  return (
    <View style={[styles.card, { marginBottom }, style, Shadows.md]}>
      {/* Reference/Header */}
      <SkeletonPlaceholder
        width="60%"
        height={14}
        borderRadius={BorderRadius.md}
        marginBottom={Spacing.md}
      />

      {/* Title Line */}
      <SkeletonPlaceholder
        width="85%"
        height={20}
        borderRadius={BorderRadius.md}
        marginBottom={Spacing.md}
      />

      {/* Text Lines (3 lines of varying widths) */}
      <SkeletonPlaceholder
        width="100%"
        height={14}
        borderRadius={BorderRadius.md}
        marginBottom={Spacing.sm}
      />

      <SkeletonPlaceholder
        width="95%"
        height={14}
        borderRadius={BorderRadius.md}
        marginBottom={Spacing.sm}
      />

      <SkeletonPlaceholder
        width="75%"
        height={14}
        borderRadius={BorderRadius.md}
        marginBottom={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.blue,
  },
});
