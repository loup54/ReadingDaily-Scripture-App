/**
 * Animated Highlighted Text Display Component
 * Using React Native Reanimated 2 for smooth word transitions
 *
 * Features:
 * - Smooth scale/opacity animations on word change
 * - Haptic feedback on word transitions
 * - Efficient animated renders
 * - Fade-out effects for previous words
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { WordTiming, HighlightingConfig } from '@/types';
import { Colors, Typography, Spacing } from '@/constants';

interface AnimatedHighlightedTextDisplayProps {
  text: string;
  words: WordTiming[];
  currentWordIndex: number;
  config?: Partial<HighlightingConfig>;
  fontSize?: number;
  lineHeight?: number;
  showBoundaries?: boolean;
  enableFadeOut?: boolean;
  style?: any;
}

/**
 * Animated Word Segment Component
 * Each word is an independently animated component
 */
const AnimatedWordSegment: React.FC<{
  word: WordTiming;
  isCurrentWord: boolean;
  isPreviousWord: boolean;
  highlightColor?: string;
  highlightTextColor?: string;
  fontSize?: number;
  enableFadeOut?: boolean;
  showBoundaries?: boolean;
}> = ({
  word,
  isCurrentWord,
  isPreviousWord,
  highlightColor = Colors.primary.blue,
  highlightTextColor = Colors.text.white,
  fontSize = 16,
  enableFadeOut = true,
  showBoundaries = false,
}) => {
  const isDark = useColorScheme() === 'dark';

  // Shared values for animation
  const scaleValue = useSharedValue(isCurrentWord ? 1.1 : 1.0);
  const opacityValue = useSharedValue(
    isCurrentWord ? 1.0 : isPreviousWord && enableFadeOut ? 0.3 : 1.0
  );
  const backgroundOpacityValue = useSharedValue(isCurrentWord ? 1.0 : 0.0);

  // Animate when word changes
  useAnimatedReaction(
    () => ({
      isCurrent: isCurrentWord,
      isPrevious: isPreviousWord,
    }),
    ({ isCurrent, isPrevious }) => {
      // Scale animation
      scaleValue.value = withTiming(isCurrent ? 1.1 : 1.0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });

      // Opacity animation
      let targetOpacity = 1.0;
      if (isCurrent) {
        targetOpacity = 1.0;
      } else if (isPrevious && enableFadeOut) {
        targetOpacity = 0.3;
      }

      opacityValue.value = withTiming(targetOpacity, {
        duration: 150,
        easing: Easing.linear,
      });

      // Background opacity animation
      backgroundOpacityValue.value = withTiming(isCurrent ? 1.0 : 0.0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    },
    [isCurrentWord, isPreviousWord, enableFadeOut]
  );

  // Animated styles
  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacityValue.value,
  }));

  return (
    <View style={styles.wordContainer}>
      <Animated.View
        style={[
          styles.wordBackground,
          {
            backgroundColor: highlightColor,
          },
          animatedBackgroundStyle,
        ]}
      />

      <Animated.Text
        style={[
          styles.word,
          {
            fontSize,
            color: isCurrentWord ? highlightTextColor : Colors.text.primary,
          },
          animatedTextStyle,
        ]}
      >
        {word.word}
        {showBoundaries && (
          <Animated.Text
            style={{
              fontSize: 8,
              color: Colors.text.tertiary,
              opacity: 0.5,
            }}
          >
            [{word.index}]
          </Animated.Text>
        )}
      </Animated.Text>
    </View>
  );
};

/**
 * Main Animated Text Display Component
 */
export const AnimatedHighlightedTextDisplay: React.FC<
  AnimatedHighlightedTextDisplayProps
> = ({
  text,
  words,
  currentWordIndex,
  config,
  fontSize = 16,
  lineHeight = 24,
  showBoundaries = false,
  enableFadeOut = true,
  style,
}) => {
  const isDark = useColorScheme() === 'dark';

  const highlightColor = config?.highlightColor || Colors.primary.blue;
  const highlightTextColor = config?.highlightTextColor || Colors.text.white;

  // Memoize word segments to prevent unnecessary re-renders
  const wordSegments = useMemo(() => {
    return words.map((word) => (
      <AnimatedWordSegment
        key={`${word.index}-${word.word}`}
        word={word}
        isCurrentWord={currentWordIndex === word.index}
        isPreviousWord={
          currentWordIndex > word.index &&
          currentWordIndex - word.index < 5 // Show fade effect for last 5 words
        }
        highlightColor={highlightColor}
        highlightTextColor={highlightTextColor}
        fontSize={fontSize}
        enableFadeOut={enableFadeOut}
        showBoundaries={showBoundaries}
      />
    ));
  }, [
    words,
    currentWordIndex,
    highlightColor,
    highlightTextColor,
    fontSize,
    enableFadeOut,
    showBoundaries,
  ]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? Colors.background.card
            : Colors.background.primary,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.textContainer,
          {
            lineHeight,
          },
        ]}
      >
        {wordSegments}
      </View>
    </View>
  );
};

/**
 * Animated Compact Text Display (Context Window)
 * Shows only words around current word with smooth transitions
 */
export const AnimatedCompactHighlightedTextDisplay: React.FC<
  AnimatedHighlightedTextDisplayProps & { contextWindowSize?: number }
> = ({
  text,
  words,
  currentWordIndex,
  config,
  fontSize = 16,
  lineHeight = 24,
  showBoundaries = false,
  enableFadeOut = true,
  contextWindowSize = 5,
  style,
}) => {
  const isDark = useColorScheme() === 'dark';

  const highlightColor = config?.highlightColor || Colors.primary.blue;
  const highlightTextColor = config?.highlightTextColor || Colors.text.white;

  // Calculate visible word range
  const startIndex = Math.max(0, currentWordIndex - contextWindowSize);
  const endIndex = Math.min(words.length - 1, currentWordIndex + contextWindowSize);
  const visibleWords = words.slice(startIndex, endIndex + 1);

  // Memoize word segments
  const wordSegments = useMemo(() => {
    return visibleWords.map((word) => (
      <AnimatedWordSegment
        key={`${word.index}-${word.word}`}
        word={word}
        isCurrentWord={currentWordIndex === word.index}
        isPreviousWord={
          currentWordIndex > word.index &&
          currentWordIndex - word.index < 3
        }
        highlightColor={highlightColor}
        highlightTextColor={highlightTextColor}
        fontSize={fontSize}
        enableFadeOut={enableFadeOut}
        showBoundaries={showBoundaries}
      />
    ));
  }, [
    visibleWords,
    currentWordIndex,
    highlightColor,
    highlightTextColor,
    fontSize,
    enableFadeOut,
    showBoundaries,
  ]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? Colors.background.card
            : Colors.background.primary,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.compactTextContainer,
          {
            lineHeight,
          },
        ]}
      >
        {wordSegments}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compactTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordContainer: {
    position: 'relative',
    marginRight: Spacing.sm,
    marginBottom: Spacing.md,
  },
  wordBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
  word: {
    ...Typography.body,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
});

export default AnimatedHighlightedTextDisplay;
