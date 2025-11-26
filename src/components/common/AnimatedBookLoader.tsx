import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface AnimatedBookLoaderProps {
  size?: number;
  color?: string;
}

/**
 * AnimatedBookLoader Component
 *
 * Animated book opening with page scaling and opacity effects
 * Perfect for loading screens during app initialization
 */
export const AnimatedBookLoader: React.FC<AnimatedBookLoaderProps> = ({
  size = 120,
  color = '#5B6FE8',
}) => {
  // Single animation value for pulsing effect
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[AnimatedBookLoader] Component mounted, starting pulse animation');

    // Create infinite pulsing animation - very visible and simple
    const animation = Animated.loop(
      Animated.sequence([
        // Pulse up (grow and brighten) - 1s
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        // Pulse down (shrink and dim) - 1s
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      console.log('[AnimatedBookLoader] Cleanup - stopping animation');
      animation.stop();
    };
  }, [pulseAnimation]);

  const pageSize = size * 0.75;
  const spineWidth = size * 0.1;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [
            {
              scale: pulseAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.1],
              }),
            },
          ],
        },
      ]}
    >
      {/* Left Page */}
      <View
        style={[
          styles.page,
          styles.leftPage,
          {
            width: pageSize,
            height: pageSize,
            backgroundColor: color,
          },
        ]}
      >
        {/* Left page content - subtle lines for book effect */}
        <View style={styles.pageContent}>
          <View style={[styles.pageLine, { opacity: 0.4 }]} />
          <View style={[styles.pageLine, { opacity: 0.3 }]} />
          <View style={[styles.pageLine, { opacity: 0.25 }]} />
        </View>
      </View>

      {/* Spine */}
      <View
        style={[
          styles.spine,
          {
            width: spineWidth,
            height: pageSize,
            backgroundColor: color,
          },
        ]}
      />

      {/* Right Page */}
      <View
        style={[
          styles.page,
          styles.rightPage,
          {
            width: pageSize,
            height: pageSize,
            backgroundColor: color,
          },
        ]}
      >
        {/* Right page content - subtle lines for book effect */}
        <View style={styles.pageContent}>
          <View style={[styles.pageLine, { opacity: 0.4 }]} />
          <View style={[styles.pageLine, { opacity: 0.3 }]} />
          <View style={[styles.pageLine, { opacity: 0.25 }]} />
        </View>
      </View>

      {/* Shimmer Highlight */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.5],
            }),
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  pageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  leftPage: {
    marginRight: -2,
  },
  rightPage: {
    marginLeft: -2,
  },
  spine: {
    borderRadius: 1,
  },
  pageContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-around',
    paddingVertical: '15%',
    paddingHorizontal: '12%',
  },
  pageLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    opacity: 0.4,
  },
  shimmer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
    opacity: 0.3,
  },
});
