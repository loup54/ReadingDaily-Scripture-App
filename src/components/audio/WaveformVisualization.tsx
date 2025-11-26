/**
 * Waveform Visualization Component
 * Phase D3: Pronunciation UI
 *
 * Animated waveform visualization for audio recording/analysis
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

interface WaveformVisualizationProps {
  isActive: boolean;
  barCount?: number;
}

export const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  isActive,
  barCount = 20,
}) => {
  const { colors } = useTheme();
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (isActive) {
      // Start animation
      const animations = animatedValues.map((animValue, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: Math.random() * 0.5 + 0.5, // Random height between 0.5 and 1
              duration: 300 + Math.random() * 200, // Random duration
              useNativeDriver: false,
              delay: index * 30, // Stagger animation
            }),
            Animated.timing(animValue, {
              toValue: 0.2 + Math.random() * 0.3,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ])
        );
      });

      // Start all animations
      Animated.parallel(animations).start();

      return () => {
        // Stop all animations
        animatedValues.forEach(val => val.stopAnimation());
      };
    } else {
      // Reset to baseline
      animatedValues.forEach(val => {
        Animated.timing(val, {
          toValue: 0.2,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      <View style={styles.waveformContainer}>
        {animatedValues.map((animValue, index) => {
          const height = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['20%', '100%'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: colors.primary.blue,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    gap: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: '20%',
  },
});
