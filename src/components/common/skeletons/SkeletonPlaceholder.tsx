/**
 * SkeletonPlaceholder Component
 *
 * Base animated placeholder rectangle for skeleton loaders.
 * Provides a pulsing gray animation to indicate loading content.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@constants';

interface SkeletonPlaceholderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  marginBottom?: number;
  animated?: boolean;
  style?: any;
}

export const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({
  width = '100%',
  height = 20,
  borderRadius: radius = BorderRadius.md,
  marginBottom = 0,
  animated = true,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!animated) return;

    // Create pulsing animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animated, opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          marginBottom,
          opacity: animated ? opacity : 0.6,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.text.tertiary,
    overflow: 'hidden',
  },
});
