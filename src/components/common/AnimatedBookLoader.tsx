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
  // Animation values
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const fillAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[AnimatedBookLoader] Component mounted, starting animations');

    // Pulse animation - subtle scaling
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Fill animation - fills from 0% to 100% repeatedly
    const fill = Animated.loop(
      Animated.sequence([
        // Fill up from 0% to 100% over 2 seconds
        Animated.timing(fillAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false, // Can't use native driver for height animations
        }),
        // Brief pause at full
        Animated.delay(300),
        // Empty from 100% to 0% over 1.5 seconds
        Animated.timing(fillAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
        // Brief pause at empty
        Animated.delay(300),
      ])
    );

    pulse.start();
    fill.start();

    return () => {
      console.log('[AnimatedBookLoader] Cleanup - stopping animations');
      pulse.stop();
      fill.stop();
    };
  }, [pulseAnimation, fillAnimation]);

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
        {/* Animated fill overlay */}
        <Animated.View
          style={[
            styles.fillOverlay,
            {
              height: fillAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
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
        {/* Animated fill overlay */}
        <Animated.View
          style={[
            styles.fillOverlay,
            {
              height: fillAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Shimmer Highlight */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
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
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Important: clips the fill overlay to page bounds
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
  fillOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(123, 97, 255, 0.35)', // Purple tint with transparency
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
