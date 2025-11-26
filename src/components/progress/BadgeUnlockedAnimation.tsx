/**
 * Badge Unlocked Animation Component
 *
 * Celebration animation that displays when user earns a new badge
 * Features badge grow animation, confetti particles, and auto-dismiss
 * Phase E: Progress Tracking (Task 2.4)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import type { Badge } from '@/types/progress.types';

export interface BadgeUnlockedAnimationProps {
  /**
   * Whether animation is visible
   */
  visible: boolean;

  /**
   * Badge that was unlocked
   */
  badge: Badge;

  /**
   * Callback when animation is dismissed
   */
  onDismiss: () => void;

  /**
   * Auto-dismiss after this many milliseconds (default: 3000)
   */
  autoDismissMs?: number;

  /**
   * Optional style override
   */
  style?: ViewStyle;
}

interface ConfettiParticle {
  id: string;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
}

export const BadgeUnlockedAnimation: React.FC<
  BadgeUnlockedAnimationProps
> = ({ visible, badge, onDismiss, autoDismissMs = 3000, style }) => {
  const { colors } = useTheme();

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  /**
   * Generate confetti particles for celebration effect
   */
  const generateConfetti = (): ConfettiParticle[] => {
    const particles: ConfettiParticle[] = [];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: `confetti-${i}`,
        left: Math.random() * 100 - 50, // -50% to +50% horizontal
        delay: Math.random() * 200, // Stagger animation start
        duration: 1500 + Math.random() * 500, // 1.5-2s duration
        rotation: Math.random() * 360,
      });
    }

    return particles;
  };

  const confettiParticles = useRef(generateConfetti()).current;

  /**
   * Run badge unlock animation sequence
   */
  useEffect(() => {
    if (!visible) {
      // Reset animations when not visible
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      bounceAnim.setValue(0);
      return;
    }

    // Start animations
    opacityAnim.setValue(1);

    // Badge scale animation (pop in with bounce)
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Bounce animation (up and down)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-dismiss timer
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(autoDismissTimer);
  }, [visible, autoDismissMs]);

  /**
   * Handle dismiss with fade-out animation
   */
  const handleDismiss = (): void => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  /**
   * Get gradient colors based on badge category
   */
  const getGradientColors = (): string[] => {
    switch (badge.category) {
      case 'frequency':
        return ['#3B82F6', '#1D4ED8']; // Blue
      case 'streak':
        return ['#EF4444', '#991B1B']; // Red
      case 'consistency':
        return ['#10B981', '#065F46']; // Green
      case 'engagement':
        return ['#F59E0B', '#B45309']; // Amber
      default:
        return ['#8B5CF6', '#5B21B6']; // Purple
    }
  };

  /**
   * Render confetti particle
   */
  const renderConfetti = (particle: ConfettiParticle): React.ReactElement => {
    const fallAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fallAnim, {
        toValue: 100,
        duration: particle.duration,
        delay: particle.delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        key={particle.id}
        style={[
          styles.confettiParticle,
          {
            transform: [
              {
                translateY: fallAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 400],
                }),
              },
              {
                translateX: fallAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: [particle.left, particle.left * 0.5],
                }),
              },
              {
                rotate: fallAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0deg', `${particle.rotation}deg`],
                }),
              },
            ],
            left: `${50 + particle.left / 4}%`,
          },
        ]}
      >
        <Text style={styles.confettiEmoji}>✨</Text>
      </Animated.View>
    );
  };

  if (!visible) {
    return null;
  }

  const gradientColors = getGradientColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      {/* Semi-transparent overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={0.5}
        onPress={handleDismiss}
      >
        <View style={styles.overlay} />
      </TouchableOpacity>

      {/* Confetti particles */}
      <View style={styles.confettiContainer}>
        {confettiParticles.map((particle) => renderConfetti(particle))}
      </View>

      {/* Main celebration content */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: opacityAnim,
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
              {
                translateY: bounceAnim,
              },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Gradient background */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {/* Stars decoration */}
          <View style={styles.decorationContainer}>
            <Text style={styles.decorationStar}>⭐</Text>
            <Text style={styles.decorationStar}>🌟</Text>
          </View>

          {/* Badge Icon */}
          <Animated.View
            style={[
              styles.badgeIconContainer,
              {
                transform: [
                  {
                    scale: scaleAnim,
                  },
                ],
              },
            ]}
          >
            <View style={styles.badgeIconInner}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
            </View>
          </Animated.View>

          {/* Celebration text */}
          <View style={styles.textContainer}>
            <Text style={styles.celebrationText}>🎉 Badge Unlocked! 🎉</Text>

            <Text style={styles.badgeNameText}>{badge.name}</Text>

            <Text style={styles.badgeDescriptionText}>
              {badge.description}
            </Text>
          </View>

          {/* Dismiss instruction */}
          <View style={styles.dismissContainer}>
            <Ionicons
              name="finger-outline"
              size={16}
              color="rgba(255, 255, 255, 0.7)"
            />
            <Text style={styles.dismissText}>Tap to continue</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Tap to dismiss overlay */}
      <TouchableOpacity
        style={styles.dismissOverlay}
        onPress={handleDismiss}
        activeOpacity={1}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  // Dismiss overlay
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },

  confettiParticle: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confettiEmoji: {
    fontSize: 20,
  },

  // Center content
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },

  // Gradient container
  gradientContainer: {
    width: 280,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },

  // Decoration
  decorationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.md,
  },

  decorationStar: {
    fontSize: 24,
  },

  // Badge Icon
  badgeIconContainer: {
    marginVertical: Spacing.md,
  },

  badgeIconInner: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  badgeIcon: {
    fontSize: 64,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },

  celebrationText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },

  badgeNameText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },

  badgeDescriptionText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Dismiss
  dismissContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },

  dismissText: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: FontWeights.medium,
  },
});
