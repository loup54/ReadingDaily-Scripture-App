import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@components/common';
import { Colors, Typography, Spacing, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';

interface LandingScreenProps {
  onStartTrial: () => void;
  onSignIn: () => void;
  onDemo: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartTrial,
  onSignIn,
  onDemo,
}) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.primary.gradient}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/images/hero-bible.png')}
              style={[styles.heroImage, Shadows.lg]}
              resizeMode="cover"
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.white }]}>Improve your ability to read</Text>
          <Text style={[styles.titleHighlight, { color: colors.text.white }]}>the Sacred Scripture</Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.text.white }]}>
            Practice daily Catholic liturgical{'\n'}
            readings with beautiful formatting{'\n'}
            and easy navigation.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Start 7-Day Free Trial"
              variant="accent"
              size="lg"
              fullWidth
              onPress={onStartTrial}
              testID="start-trial-button"
            />

            <Button
              title="Subscribe: $2.99/month"
              variant="secondary"
              size="md"
              fullWidth
              onPress={onStartTrial}
              style={styles.secondaryButton}
              textStyle={{ color: '#000' }}
              testID="subscribe-button"
            />

            <Button
              title="Already have an account? Sign In"
              variant="text"
              onPress={onSignIn}
              textStyle={{ color: colors.text.white }}
              testID="sign-in-link"
            />
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.text.white }]}>
            developed by www.ourengltd.best
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  imageContainer: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  heroImage: {
    width: 200,
    height: 140,
    borderRadius: 16,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  titleHighlight: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 350,
    gap: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  demoButton: {
    marginTop: Spacing.xs,
  },
  footer: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.7,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
});