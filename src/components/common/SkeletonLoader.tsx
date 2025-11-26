/**
 * SkeletonLoader Component
 *
 * Placeholder UI that animates while data loads.
 * Improves perceived performance and provides visual feedback.
 *
 * Features:
 * - Pulsing shimmer animation
 * - Customizable skeleton shape/size
 * - Motion-safe support
 * - Works for text, images, buttons, cards
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@constants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export type SkeletonShape = 'rect' | 'circle' | 'line';

export interface SkeletonLoaderProps {
  /** Shape of skeleton (default: 'rect') */
  shape?: SkeletonShape;

  /** Width (default: '100%') */
  width?: number | string;

  /** Height (required for rect) */
  height: number;

  /** Border radius (default: 4) */
  borderRadius?: number;

  /** Background color (default: Colors.background.secondary) */
  backgroundColor?: string;

  /** Highlight color for shimmer (default: lighter version of background) */
  highlightColor?: string;

  /** Container style */
  style?: ViewStyle;

  /** Disable animation (show static placeholder) */
  disableAnimation?: boolean;
}

/**
 * SkeletonLoader Component
 *
 * Shows placeholder while loading. Best used with FlatList renderItem or conditional render.
 *
 * @example
 * {loading ? (
 *   <SkeletonLoader height={60} width="100%" />
 * ) : (
 *   <DataItem item={item} />
 * )}
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  shape = 'rect',
  width = '100%',
  height,
  borderRadius: radius = 4,
  backgroundColor = Colors.background.secondary,
  highlightColor,
  style,
  disableAnimation = false,
}) => {
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Calculate highlight color if not provided
  const finalHighlightColor = highlightColor || Colors.background.tertiary || Colors.ui.border;

  useEffect(() => {
    if (disableAnimation || prefersReducedMotion) {
      return; // No animation
    }

    const shimmer = Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(shimmer).start();

    return () => {
      shimmerAnim.setValue(0);
    };
  }, [shimmerAnim, disableAnimation, prefersReducedMotion]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle: ViewStyle = {
    width,
    height,
    backgroundColor,
    borderRadius: shape === 'circle' ? height / 2 : radius,
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        skeletonStyle,
        {
          opacity: disableAnimation || prefersReducedMotion ? 0.5 : opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * SkeletonList Component
 *
 * Shows multiple skeleton loaders in a list format.
 * Useful for FlatList/SectionList loading states.
 *
 * @example
 * {loading ? (
 *   <SkeletonList count={5} itemHeight={80} />
 * ) : (
 *   <FlatList data={items} ... />
 * )}
 */
export interface SkeletonListProps {
  /** Number of skeleton items (default: 5) */
  count?: number;

  /** Height of each item (default: 60) */
  itemHeight?: number;

  /** Spacing between items (default: Spacing.md) */
  spacing?: number;

  /** Whether items are full width (default: true) */
  fullWidth?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  itemHeight = 60,
  spacing = Spacing.md,
  fullWidth = true,
}) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            marginBottom: index < count - 1 ? spacing : 0,
          }}
        >
          <SkeletonLoader
            height={itemHeight}
            width={fullWidth ? '100%' : 80}
            borderRadius={8}
          />
        </View>
      ))}
    </View>
  );
};

/**
 * SkeletonCard Component
 *
 * Card-like skeleton with title, subtitle, and image placeholder.
 * Useful for article/scripture card loading states.
 *
 * @example
 * {loading ? (
 *   <SkeletonCard />
 * ) : (
 *   <ScriptureCard item={item} />
 * )}
 */
export interface SkeletonCardProps {
  /** Show image placeholder (default: true) */
  showImage?: boolean;

  /** Show subtitle line (default: true) */
  showSubtitle?: boolean;

  /** Custom style */
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showImage = true,
  showSubtitle = true,
  style,
}) => {
  return (
    <View style={[styles.cardContainer, style]}>
      {showImage && (
        <SkeletonLoader height={120} width="100%" borderRadius={8} style={{ marginBottom: Spacing.md }} />
      )}

      {/* Title skeleton */}
      <SkeletonLoader height={16} width="80%" borderRadius={4} style={{ marginBottom: Spacing.sm }} />

      {/* Subtitle skeleton */}
      {showSubtitle && (
        <SkeletonLoader height={12} width="60%" borderRadius={4} style={{ marginBottom: Spacing.md }} />
      )}

      {/* Content skeleton lines */}
      <View style={{ gap: Spacing.xs }}>
        <SkeletonLoader height={12} width="100%" borderRadius={4} />
        <SkeletonLoader height={12} width="95%" borderRadius={4} />
        <SkeletonLoader height={12} width="85%" borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  cardContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
});
