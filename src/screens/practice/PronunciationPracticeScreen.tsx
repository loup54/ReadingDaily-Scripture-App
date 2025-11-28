/**
 * Pronunciation Practice Screen
 *
 * Main screen for pronunciation practice feature.
 * Integrates all pronunciation components and manages practice flow.
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { IconButton, Button, FeatureOverlay } from '@/components/common';
import {
  RecordingControls,
  PronunciationFeedback,
  PracticeSentenceDisplay,
} from '@/components/pronunciation';
import { usePracticeStore } from '@/stores/usePracticeStore';
import { useReadingStore } from '@/stores/useReadingStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { ONBOARDING_FEATURES } from '@/constants/onboarding';
import { useTheme } from '@/hooks/useTheme';
import { AudioRecordingService } from '@/services/speech';

interface PronunciationPracticeScreenProps {
  onBack?: () => void;
}

export const PronunciationPracticeScreen: React.FC<PronunciationPracticeScreenProps> = ({
  onBack,
}) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const processingDotOpacity = useRef(new Animated.Value(0.3)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const bannerTimeout = useRef<NodeJS.Timeout | null>(null);
  const processingAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const [liveDuration, setLiveDuration] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [showPronunciationTip, setShowPronunciationTip] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const { addDiscoveredFeature, hasDiscoveredFeature } = useSettingsStore();

  // Handle modal close - scroll back to top to show header with recording button
  const handleModalClose = useCallback(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  // Live timer during recording
  useEffect(() => {
    if (recordingState === 'recording') {
      setLiveDuration(0);
      timerInterval.current = setInterval(() => {
        setLiveDuration(prev => prev + 100);
      }, 100);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [recordingState]);

  // Pulse animation for FAB when recording
  useEffect(() => {
    if (recordingState === 'recording') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState, pulseAnim]);
  const {
    currentSession,
    recordingState,
    recordingDuration,
    latestResult,
    latestAttempt,
    error,
    hasPermissions,
    isLoadingSession,
    isAssessing,
    startSession,
    startRecording,
    stopRecording,
    nextSentence,
    previousSentence,
    goToSentence,
    requestPermissions,
    checkPermissions,
    clearError,
    reset,
  } = usePracticeStore();

  const { readings } = useReadingStore();

  // Debug: Log readings structure
  useEffect(() => {
    if (readings) {
      console.log('[PronunciationPracticeScreen] Readings received:', {
        hasGospel: !!readings.gospel,
        hasPsalm: !!readings.psalm,
        hasFirstReading: !!readings.firstReading,
        hasSecondReading: !!readings.secondReading,
        gospelContentLength: readings.gospel?.content?.length || 0,
        psalmContentLength: readings.psalm?.content?.length || 0,
        firstReadingContentLength: readings.firstReading?.content?.length || 0,
        secondReadingContentLength: readings.secondReading?.content?.length || 0,
      });
    }
  }, [readings]);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  // Show pronunciation practice tutorial on first visit
  useEffect(() => {
    if (!hasDiscoveredFeature(ONBOARDING_FEATURES.PRONUNCIATION_PRACTICE)) {
      setShowPronunciationTip(true);
    }
  }, [hasDiscoveredFeature]);

  // Initialize session when readings are available
  useEffect(() => {
    if (readings && !currentSession && !isLoadingSession) {
      handleStartSession();
    }
  }, [readings, currentSession, isLoadingSession]);


  const handleStartSession = async () => {
    if (!readings) {
      Alert.alert('Error', 'No readings available. Please load readings first.');
      return;
    }

    try {
      await startSession(readings);
    } catch (err) {
      Alert.alert('Error', 'Failed to start practice session. Please try again.');
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    setShowPermissionModal(false);
    if (!granted) {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in your device settings to use pronunciation practice.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => console.log('Open settings') },
        ]
      );
    }
  };

  const handleStartRecording = async () => {
    if (!hasPermissions) {
      await handleRequestPermissions();
      return;
    }

    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  // Define current sentence BEFORE using it in useMemo
  const currentSentence = currentSession ? currentSession.sentences[currentSession.currentIndex] : undefined;


  // Get reading structure: map each reading to its sentence indices
  const { readingOrder, readingMap, currentReading, currentReadingIndex, totalReadings, currentReadingSentences } = useMemo(() => {
    if (!currentSession || currentSession.sentences.length === 0) {
      return {
        readingOrder: [],
        readingMap: new Map<string, number[]>(),
        currentReading: '',
        currentReadingIndex: -1,
        totalReadings: 0,
        currentReadingSentences: [],
      };
    }

    const order: string[] = [];
    const map = new Map<string, number[]>();
    const seen = new Set<string>();

    currentSession.sentences.forEach((sentence, index) => {
      const source = sentence.source;
      if (!seen.has(source)) {
        order.push(source);
        seen.add(source);
      }
      if (!map.has(source)) {
        map.set(source, []);
      }
      map.get(source)!.push(index);
    });

    const current = currentSentence ? currentSentence.source : '';
    const readIdx = order.indexOf(current);
    const currentSentences = current ? map.get(current) || [] : [];

    console.log('[Reading structure]', {
      totalSentences: currentSession.sentences.length,
      readingOrder: order,
      currentSentenceSource: current,
      currentReadingIndex: readIdx,
      totalReadings: order.length,
      readingMap: Array.from(map.entries()),
    });

    return {
      readingOrder: order,
      readingMap: map,
      currentReading: current,
      currentReadingIndex: readIdx,
      totalReadings: order.length,
      currentReadingSentences: currentSentences,
    };
  }, [currentSession, currentSentence]);

  const isFirstSentenceInReading = currentReadingSentences.length > 0 && currentSession.currentIndex === currentReadingSentences[0];
  const isLastSentenceInReading = currentReadingSentences.length > 0 && currentSession.currentIndex === currentReadingSentences[currentReadingSentences.length - 1];

  // Handle reading navigation - memoized with proper dependencies
  const handlePreviousReading = useCallback(() => {
    console.log('[handlePreviousReading] Called with:', {
      currentReadingIndex,
      totalReadings,
      readingOrder,
      canGo: currentReadingIndex > 0,
    });
    if (currentReadingIndex > 0) {
      const previousReading = readingOrder[currentReadingIndex - 1];
      console.log('[handlePreviousReading] Going to:', previousReading);
      const sentencesToPrevious = readingMap.get(previousReading) || [];
      if (sentencesToPrevious.length > 0) {
        const targetIndex = sentencesToPrevious[0];
        console.log('[handlePreviousReading] Target index:', targetIndex);
        goToSentence(targetIndex);
      }
    }
  }, [currentReadingIndex, currentReading, readingOrder, readingMap, goToSentence]);

  const handleNextReading = useCallback(() => {
    console.log('[handleNextReading] Called with:', {
      currentReadingIndex,
      totalReadings,
      readingOrder,
      canGo: currentReadingIndex < totalReadings - 1,
    });
    if (currentReadingIndex < totalReadings - 1) {
      const nextReading = readingOrder[currentReadingIndex + 1];
      console.log('[handleNextReading] Going to:', nextReading);
      const sentencesToNext = readingMap.get(nextReading) || [];
      if (sentencesToNext.length > 0) {
        const targetIndex = sentencesToNext[0];
        console.log('[handleNextReading] Target index:', targetIndex);
        goToSentence(targetIndex);
      }
    }
  }, [currentReadingIndex, totalReadings, readingOrder, readingMap, goToSentence]);

  // Sentence navigation: cycle through all sentences (0, 1, 2, 3)
  const handleNextSentence = useCallback(() => {
    if (currentSession && currentSession.sentences.length > 0) {
      const nextIndex = (currentSession.currentIndex + 1) % currentSession.sentences.length;
      goToSentence(nextIndex);
    }
  }, [currentSession, goToSentence]);

  const handlePreviousSentence = useCallback(() => {
    if (currentSession && currentSession.sentences.length > 0) {
      const prevIndex = (currentSession.currentIndex - 1 + currentSession.sentences.length) % currentSession.sentences.length;
      goToSentence(prevIndex);
    }
  }, [currentSession, goToSentence]);

  const handleTryAgain = () => {
    // Clear latest result to allow re-recording
    reset();
    handleStartSession();
  };

  const handleFinish = () => {
    Alert.alert(
      'Practice Complete!',
      'Great job! Your progress has been saved.',
      [
        { text: 'Practice Again', onPress: handleTryAgain },
        { text: 'Done', onPress: onBack },
      ]
    );
  };

  // Show error alert if error occurs
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error.message,
        [{ text: 'OK', onPress: clearError }]
      );
    }
  }, [error]);

  // Banner auto-dismiss animation
  useEffect(() => {
    if (latestResult && !isAssessing) {
      // Show banner with fade-in animation
      setShowBanner(true);
      bannerOpacity.setValue(0);
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4 seconds
      if (bannerTimeout.current) {
        clearTimeout(bannerTimeout.current);
      }
      bannerTimeout.current = setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowBanner(false);
        });
      }, 4000);
    }

    return () => {
      if (bannerTimeout.current) {
        clearTimeout(bannerTimeout.current);
      }
    };
  }, [latestResult, isAssessing]);

  // Processing animation while analyzing
  useEffect(() => {
    if (isAssessing) {
      processingDotOpacity.setValue(0.3);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(processingDotOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(processingDotOpacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      processingAnimation.current = animation;
      animation.start();
    } else {
      if (processingAnimation.current) {
        processingAnimation.current.stop();
      }
      processingDotOpacity.setValue(0.3);
    }

    return () => {
      if (processingAnimation.current) {
        processingAnimation.current.stop();
      }
    };
  }, [isAssessing]);

  // Loading state
  if (isLoadingSession || !currentSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <LinearGradient
          colors={colors.primary.gradient}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text.white} />
            <Text style={[styles.loadingText, { color: colors.text.white }]}>Preparing practice session...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const isSessionComplete = currentSession.completed;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <LinearGradient
        colors={colors.primary.gradient}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-back"
              onPress={onBack}
              variant="default"
              size="md"
              color={colors.text.white}
            />

            <Text style={[styles.title, { color: colors.text.white }]}>Pronunciation Practice</Text>

            <View style={{ width: 40 }} />
          </View>

          <Text style={[styles.subtitle, { color: colors.text.white }]}>
            Practice speaking scripture with AI feedback
          </Text>
        </View>

        {/* Main Content */}
        <ScrollView
          ref={scrollViewRef}
          style={[styles.content, { backgroundColor: colors.background.primary }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Sentence Display */}
          <PracticeSentenceDisplay
            sentence={currentSentence}
            currentIndex={currentSession.currentIndex}
            totalSentences={currentSession.sentences.length}
            // Reading navigation (top header)
            onPreviousReading={handlePreviousReading}
            onNextReading={handleNextReading}
            currentReadingIndex={currentReadingIndex}
            totalReadings={totalReadings}
            // Sentence navigation (bottom controls)
            onPreviousSentence={handlePreviousSentence}
            onNextSentence={handleNextSentence}
            isFirstSentenceInReading={isFirstSentenceInReading}
            isLastSentenceInReading={isLastSentenceInReading}
            // Legacy
            onPrevious={handlePreviousSentence}
            onNext={handleNextSentence}
            showNavigation={!isSessionComplete}
            recordingState={recordingState}
            recordingDuration={recordingDuration}
            liveDuration={liveDuration}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordingDisabled={!hasPermissions}
            onModalClose={handleModalClose}
          />

          {/* Assessment Loading */}
          {isAssessing && (
            <View style={[styles.assessingContainer, { backgroundColor: colors.background.card }]}>
              <ActivityIndicator size="large" color={colors.primary.blue} />
              <Text style={[styles.assessingText, { color: colors.text.primary }]}>
                Analyzing your pronunciation...
              </Text>
            </View>
          )}

          {/* Pronunciation Feedback */}
          {latestResult && !isAssessing && (
            <View style={styles.feedbackSection}>
              <PronunciationFeedback
                result={latestResult}
                referenceText={currentSentence.text}
                recordedAudioUri={latestAttempt?.audioUri}
                subscriptionTier="basic"
              />

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title="Try Again"
                  onPress={handleTryAgain}
                  variant="outline"
                  size="md"
                  style={styles.actionButton}
                />

                {!isSessionComplete ? (
                  <Button
                    title="Next Sentence"
                    onPress={handleNextSentence}
                    variant="primary"
                    size="md"
                    icon={<Ionicons name="arrow-forward" size={20} color={colors.text.white} />}
                    style={styles.actionButton}
                  />
                ) : (
                  <Button
                    title="Finish"
                    onPress={handleFinish}
                    variant="accent"
                    size="md"
                    icon={<Ionicons name="checkmark-circle" size={20} color={colors.text.white} />}
                    style={styles.actionButton}
                  />
                )}
              </View>
            </View>
          )}

          {/* Session Complete */}
          {isSessionComplete && !latestResult && (
            <View style={[styles.completeContainer, { backgroundColor: colors.background.card }]}>
              <Ionicons name="trophy" size={64} color={colors.accent.yellow} />
              <Text style={[styles.completeTitle, { color: colors.text.primary }]}>Practice Complete!</Text>
              <Text style={[styles.completeText, { color: colors.text.secondary }]}>
                You've completed all {currentSession.sentences.length} sentences.
              </Text>
              <Button
                title="Practice Again"
                onPress={handleTryAgain}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
          )}
        </ScrollView>

        {/* Processing Indicator */}
        {isAssessing && (
          <View style={[styles.processingNotification, { backgroundColor: colors.primary.blue }]}>
            <View style={styles.processingDotsContainer}>
              <Animated.View
                style={[
                  styles.processingDot,
                  { opacity: processingDotOpacity },
                ]}
              />
              <Animated.View
                style={[
                  styles.processingDot,
                  {
                    opacity: processingDotOpacity.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [1, 0.3],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.processingDot,
                  {
                    opacity: processingDotOpacity.interpolate({
                      inputRange: [0.3, 1],
                      outputRange: [0.3, 1],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.processingText, { color: colors.text.white }]}>Analyzing your pronunciation...</Text>
          </View>
        )}

        {/* Toast Notification for Results Ready */}
        {showBanner && (
          <Animated.View
            style={[
              styles.toastNotification,
              {
                opacity: bannerOpacity,
                transform: [
                  {
                    translateY: bannerOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [150, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.text.white} />
            <Text style={[styles.toastText, { color: colors.text.white }]}>Your Results Are Ready!{'\n'}Scroll below</Text>
          </Animated.View>
        )}
      </LinearGradient>

      {/* Pronunciation Practice Tutorial Overlay */}
      <FeatureOverlay
        title="Pronunciation Practice 🎤"
        description="Record yourself reading to get AI feedback on your pacing and clarity. Our system will listen and provide suggestions to help you improve."
        icon="mic-outline"
        actionLabel="Got It"
        visible={showPronunciationTip}
        onDismiss={() => {
          setShowPronunciationTip(false);
          addDiscoveredFeature(ONBOARDING_FEATURES.PRONUNCIATION_PRACTICE);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.white,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white + 'CC',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.white,
    marginTop: Spacing.md,
  },
  permissionPrompt: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  permissionText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  assessingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    ...Shadows.md,
  },
  assessingText: {
    ...Typography.body,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  feedbackSection: {
    marginTop: Spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  completeContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    ...Shadows.lg,
  },
  completeTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  completeText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  processingNotification: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    zIndex: 1000,
    ...Shadows.lg,
  },
  processingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.white,
  },
  processingText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  toastNotification: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    zIndex: 1000,
    ...Shadows.lg,
  },
  toastText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
});
