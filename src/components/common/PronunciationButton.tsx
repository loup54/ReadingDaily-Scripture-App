/**
 * Pronunciation Button Component
 *
 * A compact speaker icon button for playing word pronunciation
 * Handles audio generation, playback, and state management
 * Used in word translation modal for ESL pronunciation practice
 *
 * Features:
 * - Generates audio using Google TTS API
 * - Caches audio locally for faster playback
 * - Shows loading/playing states
 * - Handles errors gracefully
 * - Theme-aware styling
 *
 * Phase: Word Pronunciation Feature (Phase 1)
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { getTTSLanguageCode, validatePronunciation } from '@/utils/wordPronunciation';
import { getGoogleTTSService } from '@/services/tts/GoogleTTSService';
import { audioPlaybackService } from '@/services/audio';

interface PronunciationButtonProps {
  word: string;
  language: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onError?: (error: string) => void;
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'error';

export const PronunciationButton: React.FC<PronunciationButtonProps> = ({
  word,
  language,
  disabled = false,
  size = 'md',
  onError,
}) => {
  const { colors } = useTheme();
  const [state, setState] = useState<PlaybackState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canEnable, setCanEnable] = useState(true);

  // Validate pronunciation requirements on mount and when word/language changes
  useEffect(() => {
    const validation = validatePronunciation(word, language);
    if (!validation.canPronounce) {
      setState('idle');
      setErrorMessage(validation.reason);
      setCanEnable(false);
    } else {
      setErrorMessage(null);
      setCanEnable(true);
    }
  }, [word, language]);

  const handlePress = async () => {
    // Prevent multiple simultaneous requests
    if (state === 'loading' || state === 'playing' || !canEnable) {
      return;
    }

    try {
      // Re-validate pronunciation (safety check)
      const validation = validatePronunciation(word, language);
      if (!validation.canPronounce) {
        console.warn('[PronunciationButton] Word validation failed:', validation.reason);
        setErrorMessage(validation.reason);
        setState('error');
        if (onError) {
          onError(validation.reason);
        }
        // Reset error state after 1.5 seconds
        setTimeout(() => setState('idle'), 1500);
        return;
      }

      // Set loading state
      setState('loading');
      setErrorMessage(null);

      // Get TTS service and generate audio
      const ttsService = getGoogleTTSService();
      const ttsLanguage = getTTSLanguageCode(language);

      console.log('[PronunciationButton] Generating audio for:', word, 'in language:', ttsLanguage);
      const audioUri = await ttsService.generateAndCacheAudio(word, ttsLanguage);

      // Play audio
      setState('playing');
      await audioPlaybackService.playAudioUri(audioUri);

      // Return to idle when playback completes
      setState('idle');
      console.log('[PronunciationButton] Playback completed for:', word);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to play pronunciation';
      console.error('[PronunciationButton] Playback error:', errorMsg, error);

      setErrorMessage(errorMsg);
      setState('error');

      if (onError) {
        onError(errorMsg);
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState('idle');
      }, 2000);
    }
  };

  // Map size to icon size
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const buttonPadding = size === 'sm' ? 6 : size === 'md' ? 8 : 10;

  // Determine button color and opacity based on state
  const getButtonColor = () => {
    if (disabled || !canEnable) {
      return colors.text.secondary; // Disabled color
    }
    if (state === 'error') {
      return colors.accent.red; // Error color
    }
    if (state === 'playing') {
      return colors.accent.orange; // Playing color
    }
    return colors.primary.blue; // Default/loading color
  };

  const isDisabledState = disabled || !canEnable || state === 'loading';

  // Generate background color with opacity
  const getBackgroundColor = () => {
    const color = getButtonColor();
    const opacity = (disabled || !canEnable) ? '14' : '26'; // hex for 0.08 and 0.15 opacity
    return color + opacity;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          padding: buttonPadding,
          backgroundColor: getBackgroundColor(),
        }
      ]}
      onPress={handlePress}
      disabled={isDisabledState}
      activeOpacity={0.7}
    >
      {state === 'loading' ? (
        <ActivityIndicator
          size="small"
          color={colors.primary.blue}
          style={{ width: iconSize, height: iconSize }}
        />
      ) : (
        <Ionicons
          name={state === 'playing' ? 'volume-high' : 'volume-mute'}
          size={iconSize}
          color={getButtonColor()}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PronunciationButton;
