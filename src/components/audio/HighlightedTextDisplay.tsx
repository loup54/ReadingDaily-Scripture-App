/**
 * Highlighted Text Display Component
 * Renders scripture text with karaoke-style word highlighting
 * Synchronized with audio playback from AudioHighlightingService
 *
 * Features:
 * - Word-level highlighting with smooth transitions
 * - Fade-out effect for previous words
 * - Responsive text sizing
 * - Theme support (light/dark mode)
 * - Customizable highlight colors
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { WordTiming, HighlightingConfig, DEFAULT_HIGHLIGHTING_CONFIG } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface HighlightedTextDisplayProps {
  /** Full text to display */
  text: string;
  /** Array of word timings */
  words: WordTiming[];
  /** Currently highlighted word index (-1 if none) */
  currentWordIndex: number;
  /** Highlight configuration */
  config?: Partial<HighlightingConfig>;
  /** Callback when word is tapped */
  onWordPress?: (word: WordTiming, index: number) => void;
  /** Font size override */
  fontSize?: number;
  /** Line height override */
  lineHeight?: number;
  /** Whether to show word boundaries (debug) */
  showBoundaries?: boolean;
  /** Enable fade-out effect on previous words */
  enableFadeOut?: boolean;
  /** Text alignment */
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  /** Custom style override */
  style?: any;
}

/**
 * Word segment component (individual word with highlighting)
 */
const WordSegment: React.FC<{
  word: WordTiming;
  isCurrentWord: boolean;
  isPreviousWord: boolean;
  config: HighlightingConfig;
  onPress: () => void;
  fontSize: number;
  lineHeight: number;
  showBoundary: boolean;
}> = ({
  word,
  isCurrentWord,
  isPreviousWord,
  config,
  onPress,
  fontSize,
  lineHeight,
  showBoundary,
}) => {
  // Determine text color
  const textColor = isCurrentWord ? config.highlightTextColor : '#000';

  // Determine background color
  const backgroundColor = isCurrentWord ? config.highlightColor : 'transparent';

  // Opacity for fade-out effect
  const opacity = isPreviousWord && config.useFadeOut ? 0.5 : 1;

  return (
    <Text
      key={`${word.index}-${word.word}`}
      style={[
        {
          backgroundColor,
          color: textColor,
          fontSize,
          lineHeight,
          opacity,
          paddingHorizontal: 2,
          paddingVertical: 4,
          borderRadius: isCurrentWord ? BorderRadius.sm : 0,
          borderWidth: showBoundary ? 0.5 : 0,
          borderColor: showBoundary ? '#CCC' : 'transparent',
        },
      ]}
      onPress={onPress}
      suppressHighlighting={!isCurrentWord}
    >
      {word.word}{' '}
    </Text>
  );
};

/**
 * Main HighlightedTextDisplay Component
 */
export const HighlightedTextDisplay: React.FC<HighlightedTextDisplayProps> = ({
  text,
  words,
  currentWordIndex,
  config: configOverride,
  onWordPress,
  fontSize = 18,
  lineHeight = 28,
  showBoundaries = false,
  enableFadeOut = true,
  textAlign = 'left',
  style,
}) => {
  const isDark = useColorScheme() === 'dark';

  // Merge config with defaults
  const config: HighlightingConfig = useMemo(
    () => ({
      ...DEFAULT_HIGHLIGHTING_CONFIG,
      ...configOverride,
      useFadeOut: enableFadeOut,
    }),
    [configOverride, enableFadeOut],
  );

  // Handle word press
  const handleWordPress = useCallback(
    (word: WordTiming) => {
      onWordPress?.(word, word.index);
    },
    [onWordPress],
  );

  // Build segments of text with highlighting info
  const textSegments = useMemo(() => {
    if (!words || words.length === 0) {
      return [{ type: 'text', value: text }];
    }

    const segments: Array<{
      type: 'word' | 'text';
      word?: WordTiming;
      value: string;
      isCurrentWord: boolean;
      isPreviousWord: boolean;
    }> = [];

    for (const word of words) {
      segments.push({
        type: 'word',
        word,
        value: word.word,
        isCurrentWord: word.index === currentWordIndex,
        isPreviousWord: word.index < currentWordIndex,
      });
    }

    return segments;
  }, [words, currentWordIndex, text]);

  // Calculate text color based on theme
  const primaryTextColor = isDark ? Colors.text.white : Colors.text.primary;
  const secondaryTextColor = isDark ? Colors.text.secondary : Colors.text.secondary;

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? Colors.background.card : Colors.background.card,
        },
        style,
      ]}
      scrollEnabled={true}
      showsVerticalScrollIndicator={true}
    >
      <View style={[styles.textContainer, { padding: Spacing.lg }]}>
        <Text
          style={[
            styles.text,
            {
              fontSize,
              lineHeight,
              textAlign,
              color: primaryTextColor,
            },
          ]}
        >
          {textSegments.map((segment, idx) => {
            if (segment.type === 'word' && segment.word) {
              return (
                <WordSegment
                  key={`${segment.word.index}-${idx}`}
                  word={segment.word}
                  isCurrentWord={segment.isCurrentWord}
                  isPreviousWord={segment.isPreviousWord}
                  config={config}
                  onPress={() => handleWordPress(segment.word!)}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  showBoundary={showBoundaries}
                />
              );
            }

            return (
              <Text key={`text-${idx}`} style={{ color: primaryTextColor }}>
                {segment.value}
              </Text>
            );
          })}
        </Text>

        {/* Debug info */}
        {showBoundaries && (
          <View style={[styles.debugInfo, { marginTop: Spacing.lg }]}>
            <Text style={[styles.debugText, { color: secondaryTextColor }]}>
              Word {currentWordIndex + 1} of {words.length}
            </Text>
            {currentWordIndex >= 0 && words[currentWordIndex] && (
              <Text style={[styles.debugText, { color: config.highlightColor }]}>
                Current: {words[currentWordIndex].word}
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

/**
 * Animated Highlighted Text Display
 * Version with Reanimated 2 animations (optional)
 */
export const AnimatedHighlightedTextDisplay: React.FC<HighlightedTextDisplayProps> = (props) => {
  // This is a placeholder for the animated version using Reanimated 2
  // For now, just render the standard version
  // Production would use:
  // - Animated.Text from react-native-reanimated
  // - useSharedValue for positions
  // - withTiming for smooth transitions
  return <HighlightedTextDisplay {...props} />;
};

/**
 * Compact Highlighted Text Display
 * Shows only the current word and surrounding context
 */
interface CompactHighlightedTextDisplayProps extends HighlightedTextDisplayProps {
  /** Number of words to show before/after current word */
  contextWindowSize?: number;
}

export const CompactHighlightedTextDisplay: React.FC<CompactHighlightedTextDisplayProps> = ({
  words,
  currentWordIndex,
  contextWindowSize = 5,
  ...props
}) => {
  // Filter words to show only context window
  const visibleWords = useMemo(() => {
    if (currentWordIndex < 0) return words;

    const start = Math.max(0, currentWordIndex - contextWindowSize);
    const end = Math.min(words.length, currentWordIndex + contextWindowSize + 1);

    return words.slice(start, end);
  }, [words, currentWordIndex, contextWindowSize]);

  // Build context text
  const contextText = useMemo(() => {
    return visibleWords.map((w) => w.word).join(' ');
  }, [visibleWords]);

  return (
    <HighlightedTextDisplay
      {...props}
      words={visibleWords}
      text={contextText}
      currentWordIndex={currentWordIndex >= 0 ? Math.min(contextWindowSize, currentWordIndex) : -1}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.card,
  },
  textContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    fontFamily: 'System',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  debugInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.ui.divider,
  },
  debugText: {
    ...Typography.caption,
    marginVertical: Spacing.xs,
  },
});
