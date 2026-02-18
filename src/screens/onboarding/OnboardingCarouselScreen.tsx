/**
 * Onboarding Carousel Screen
 *
 * Shows new users an introduction to the app's key features.
 * Displayed on first app launch.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'book',
    title: 'Daily Catholic Readings',
    description: 'Access the daily liturgical readings from the USCCB. Stay connected to the Word of God every day.',
    gradient: ['#6B46C1', '#9333EA'],
  },
  {
    id: '2',
    icon: 'mic',
    title: 'Pronunciation Practice',
    description: 'Record yourself reading scripture and get AI-powered feedback on pacing, clarity, and natural rhythm.',
    gradient: ['#4C1D95', '#7C3AED'],
  },
  {
    id: '3',
    icon: 'play-circle',
    title: 'Audio with Highlighting',
    description: 'Listen to readings with professional narration. Words highlight as they\'re spoken—like karaoke for scripture! (Activates with subscription and continued use)',
    gradient: ['#5B21B6', '#8B5CF6'],
  },
  {
    id: '4',
    icon: 'language',
    title: '18 Languages Supported',
    description: 'Tap any word to translate it instantly. Perfect for deepening your understanding or learning new languages.',
    gradient: ['#6D28D9', '#A855F7'],
  },
  {
    id: '5',
    icon: 'trophy',
    title: 'Track Your Progress',
    description: 'Build reading streaks, earn achievements, and watch your spiritual journey grow. Stay motivated every day!',
    gradient: ['#7C3AED', '#C084FC'],
  },
];

interface OnboardingCarouselScreenProps {
  onComplete: () => void;
}

export const OnboardingCarouselScreen: React.FC<OnboardingCarouselScreenProps> = ({
  onComplete,
}) => {
  const { colors } = useTheme();
  const { setOnboardingCompleted } = useSettingsStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setOnboardingCompleted();
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={item.gradient}
        style={styles.slideGradient}
      >
        <View style={styles.slideContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.background.card + '20' }]}>
            <Ionicons name={item.icon} size={64} color={colors.text.white} />
          </View>

          <Text style={[styles.slideTitle, { color: colors.text.white }]}>
            {item.title}
          </Text>

          <Text style={[styles.slideDescription, { color: colors.text.white }]}>
            {item.description}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {ONBOARDING_SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: index === currentIndex
                ? colors.text.white
                : colors.text.white + '40',
              width: index === currentIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.footer}>
        {renderPagination()}

        <View style={styles.buttonContainer}>
          {currentIndex < ONBOARDING_SLIDES.length - 1 && (
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: colors.background.card + '40' }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipText, { color: colors.text.white }]}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.text.white },
              currentIndex === ONBOARDING_SLIDES.length - 1 && styles.getStartedButton,
            ]}
            onPress={handleNext}
          >
            <Text style={[styles.nextText, { color: colors.primary.purple }]}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={currentIndex === ONBOARDING_SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color={colors.primary.purple}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl * 2,
    maxWidth: 400,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  slideTitle: {
    ...Typography.displayMedium,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDescription: {
    ...Typography.body,
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skipButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  skipText: {
    ...Typography.body,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
  },
  getStartedButton: {
    flex: 1,
  },
  nextText: {
    ...Typography.body,
    fontWeight: '700',
    fontSize: 16,
  },
});
