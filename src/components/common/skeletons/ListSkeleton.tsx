/**
 * ListSkeleton Component
 *
 * Reusable skeleton loader for lists of items.
 * Displays multiple ReadingCardSkeleton items to simulate loading state.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '@constants';
import { ReadingCardSkeleton } from './ReadingCardSkeleton';

interface ListSkeletonProps {
  itemCount?: number;
  style?: any;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 1,
  style,
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: itemCount }).map((_, index) => (
        <ReadingCardSkeleton key={`skeleton-${index}`} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
});
