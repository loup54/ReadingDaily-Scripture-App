/**
 * OfferedOverlay — Phase 4: Completion State
 *
 * A quiet post-audio hold that replaces "Reading complete ✓" with something
 * more fitting for the spiritual context. The season's completion colour sets
 * the emotional register. After a short hold, a gentle prompt appears inviting
 * the user to stay with a verse (Meditatio / pronunciation practice).
 *
 * Design intent: grace, not task management. No confetti. No badge pop.
 * Just a moment to rest in what was heard.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants';

interface OfferedOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  onStayWithVerse: () => void;
}

export const OfferedOverlay: React.FC<OfferedOverlayProps> = ({
  visible,
  onDismiss,
  onStayWithVerse,
}) => {
  const { liturgical, colors } = useTheme();
  const [promptVisible, setPromptVisible] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const symbolScale = useRef(new Animated.Value(0.6)).current;
  const symbolOpacity = useRef(new Animated.Value(0)).current;
  const promptOpacity = useRef(new Animated.Value(0)).current;

  const completionColor = liturgical?.theme.completionColor ?? '#C9A227';

  useEffect(() => {
    if (visible) {
      setPromptVisible(false);

      // Fade in backdrop + symbol
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(symbolScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(symbolOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();

      // After quiet hold (1.8s), fade in the prompt
      const promptTimer = setTimeout(() => {
        setPromptVisible(true);
        Animated.timing(promptOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }, 1800);

      return () => clearTimeout(promptTimer);
    } else {
      // Reset all animations for next use
      backdropOpacity.setValue(0);
      symbolScale.setValue(0.6);
      symbolOpacity.setValue(0);
      promptOpacity.setValue(0);
      setPromptVisible(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      {/* Seasonal backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <LinearGradient
          colors={liturgical?.theme.backgroundGradient ?? ['#1A1A1A', '#0D0D0D']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Content — centred, non-tappable pass-through except buttons */}
      <View style={styles.content} pointerEvents="box-none">
        {/* Symbol + "Offered" */}
        <Animated.View
          style={[
            styles.symbolContainer,
            { opacity: symbolOpacity, transform: [{ scale: symbolScale }] },
          ]}
        >
          <Text style={[styles.symbol, { color: completionColor }]}>✦</Text>
          <Text style={[styles.offeredLabel, { color: completionColor }]}>Offered</Text>
        </Animated.View>

        {/* Prompt — appears after quiet hold */}
        {promptVisible && (
          <Animated.View style={[styles.promptContainer, { opacity: promptOpacity }]}>
            <TouchableOpacity
              style={[styles.stayButton, { borderColor: completionColor }]}
              onPress={() => { onDismiss(); onStayWithVerse(); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.stayButtonText, { color: completionColor }]}>
                Sit with a verse
              </Text>
            </TouchableOpacity>

            <Text style={[styles.dismissHint, { color: colors.text.white }]}>
              Tap anywhere to continue
            </Text>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  symbolContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  symbol: {
    fontSize: 64,
  },
  offeredLabel: {
    ...Typography.displayMedium,
    fontSize: 28,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  promptContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  stayButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderRadius: 24,
  },
  stayButtonText: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
  dismissHint: {
    ...Typography.caption,
    opacity: 0.5,
    fontSize: 12,
  },
});
