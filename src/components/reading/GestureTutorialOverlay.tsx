/**
 * Gesture Tutorial Overlay Component
 *
 * Teaches users how to tap words to translate
 * Displays animated finger gesture pointing at example word
 * Phase 3: Gesture Tutorial & Translation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

export interface GestureTutorialOverlayProps {
  /**
   * Example word to show in tutorial
   */
  word: string;

  /**
   * Translation of the example word
   */
  translation: string;

  /**
   * Callback when user dismisses tutorial
   */
  onDismiss: () => void;

  /**
   * Whether tutorial is visible
   */
  visible?: boolean;
}

export const GestureTutorialOverlay: React.FC<
  GestureTutorialOverlayProps
> = ({ word, translation, onDismiss, visible = true }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  /**
   * Animate finger gesture pulsing
   */
  useEffect(() => {
    if (!visible) return;

    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    return () => {
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.6);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      {/* Semi-transparent backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.backdrop} />
      </TouchableOpacity>

      {/* Tutorial content */}
      <View style={styles.centerContent}>
        <LinearGradient
          colors={['#007AFF', '#0051D5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* Instruction text */}
          <Text style={styles.instruction}>👆 Tap Any Word to Translate</Text>

          {/* Example word with animated finger */}
          <View style={styles.exampleContainer}>
            <Text style={styles.exampleWord}>{word}</Text>

            <Animated.View
              style={[
                styles.fingerIcon,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <Ionicons
                name="finger-print"
                size={40}
                color="rgba(255, 255, 255, 0.9)"
              />
            </Animated.View>
          </View>

          {/* Translation display */}
          <View style={styles.translationBox}>
            <Text style={styles.translationLabel}>Translation:</Text>
            <Text style={styles.translationText}>{translation}</Text>
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            This works for any word in the reading. Try it now!
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Got It!</Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Tap to dismiss overlay */}
      <TouchableOpacity
        style={styles.dismissOverlay}
        onPress={onDismiss}
        activeOpacity={1}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },

  container: {
    width: 300,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  instruction: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  exampleContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },

  exampleWord: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },

  fingerIcon: {
    marginTop: Spacing.md,
  },

  translationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },

  translationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  translationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  helperText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginVertical: Spacing.md,
    lineHeight: 18,
  },

  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
});
