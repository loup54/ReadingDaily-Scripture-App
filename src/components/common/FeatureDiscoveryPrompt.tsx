/**
 * Feature Discovery Prompt Component
 *
 * "Did you know?" style prompts that appear periodically to highlight
 * unused features and encourage user engagement.
 * Phase 4: Settings Tooltips & Feature Prompts
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

export interface FeatureDiscoveryPromptProps {
  /**
   * Unique identifier for this prompt
   */
  featureId: string;

  /**
   * Title/headline for the prompt
   */
  title: string;

  /**
   * Description explaining the feature benefit
   */
  description: string;

  /**
   * Label for the primary action button
   */
  actionLabel: string;

  /**
   * Callback when user taps primary action
   */
  onAction: () => void;

  /**
   * Callback when user dismisses prompt
   */
  onDismiss: () => void;

  /**
   * Whether prompt is visible
   */
  visible?: boolean;

  /**
   * Optional icon name to display
   */
  icon?: string;

  /**
   * Optional background gradient start color
   */
  gradientStart?: string;

  /**
   * Optional background gradient end color
   */
  gradientEnd?: string;
}

/**
 * FeatureDiscoveryPrompt - Encourage users to try unused features
 *
 * @example
 * <FeatureDiscoveryPrompt
 *   featureId="audio-highlighting"
 *   title="💡 Did you know?"
 *   description="Word highlighting helps you follow along with the audio and improves your reading speed."
 *   actionLabel="Try It"
 *   onAction={() => navigateToSettings()}
 *   onDismiss={() => dismissPrompt()}
 *   icon="sparkles"
 * />
 */
export const FeatureDiscoveryPrompt: React.FC<
  FeatureDiscoveryPromptProps
> = ({
  featureId,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  visible = true,
  icon = 'lightbulb-outline',
  gradientStart = '#007AFF',
  gradientEnd = '#0051D5',
}) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(500)).current;

  /**
   * Slide in animation
   */
  useEffect(() => {
    if (!visible) {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) {
    return null;
  }

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleAction = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onAction();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      {/* Semi-transparent backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <View style={styles.backdrop} />
      </TouchableOpacity>

      {/* Animated prompt card */}
      <Animated.View
        style={[
          styles.promptContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>

          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>{icon}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description */}
          <Text style={styles.description}>{description}</Text>

          {/* Action buttons */}
          <View style={styles.buttonGroup}>
            {/* Primary action button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}
              onPress={handleAction}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>{actionLabel}</Text>
            </TouchableOpacity>

            {/* Secondary dismiss button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  promptContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },

  gradient: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },

  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },

  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  iconEmoji: {
    fontSize: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },

  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  buttonGroup: {
    gap: Spacing.sm,
  },

  primaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  secondaryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
