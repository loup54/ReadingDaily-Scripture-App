import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedBookLoader } from './AnimatedBookLoader';

interface LoadingScreenProps {
  message?: string;
  showSettings?: boolean;
  onSettingsPress?: () => void;
  showProgress?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Preparing your readings...',
  showSettings = false,
  onSettingsPress,
  showProgress = false,
}) => {
  const { colors } = useTheme();
  const [progress, setProgress] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const fadeAnim = new Animated.Value(0.4);

  useEffect(() => {
    console.log('[LoadingScreen] Mounted - AnimatedBookLoader should now be animating');

    // Subtle pulsing animation for the background
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animated dots for "Loading..."
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  useEffect(() => {
    if (!showProgress) return;

    // Simulate loading progress with varied increments
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return prev; // Cap at 95% until actual completion
        }
        // Variable increment: 2-8% per tick for natural feel
        const increment = Math.random() * 6 + 2;
        return Math.min(prev + increment, 95);
      });
    }, 300);

    return () => clearInterval(interval);
  }, [showProgress]);

  const dots = Array(dotCount).fill('•').join('');

  return (
    <LinearGradient colors={colors.primary.gradient} style={styles.container}>
      {/* Animated Accent Elements */}
      <Animated.View
        style={[
          styles.accentOrb,
          styles.orbTop,
          { opacity: fadeAnim }
        ]}
      />
      <Animated.View
        style={[
          styles.accentOrb,
          styles.orbBottom,
          { opacity: fadeAnim }
        ]}
      />

      {/* Settings Button */}
      {showSettings && onSettingsPress && (
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.background.card }]}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        {/* Animated Book Loader */}
        <View style={styles.loaderContainer}>
          <AnimatedBookLoader size={140} color={colors.text.white} />
        </View>

        {/* Main Message with Brand Touch */}
        <View style={styles.messageContainer}>
          <Text style={[styles.messageTitle, { color: colors.text.white }]}>
            {message}
          </Text>
          <Text style={[styles.loadingIndicator, { color: colors.text.white }]}>
            {dots}
          </Text>
        </View>

        {/* Loading Progress */}
        {showProgress && (
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: colors.background.secondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: colors.text.white,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text.white }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}

        {/* Motivational Quote */}
        <View style={styles.quoteContainer}>
          <Ionicons name="book-outline" size={14} color={colors.text.white} style={{ opacity: 0.6 }} />
          <Text style={[styles.quote, { color: colors.text.white }]}>
            "In your light, we see light"
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  accentOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
  },
  orbTop: {
    width: 300,
    height: 300,
    top: -150,
    right: -100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orbBottom: {
    width: 200,
    height: 200,
    bottom: -100,
    left: -50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    zIndex: 5,
  },
  loaderContainer: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  messageContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  messageTitle: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loadingIndicator: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.white,
    minHeight: 24,
    letterSpacing: 2,
    opacity: 0.8,
  },
  progressSection: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.white,
    letterSpacing: 0.3,
  },
  quoteContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  quote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.text.white,
    opacity: 0.7,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
});