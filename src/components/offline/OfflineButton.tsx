/**
 * Offline Button Component
 * Smart button that disables when offline if the action requires network
 * Shows tooltip/help text when disabled
 */

import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Animated,
  Tooltip,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@constants';
import { NetworkStatusService, NetworkState } from '@/services/network/NetworkStatusService';

interface OfflineButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  requiresNetwork: boolean; // Set to false for features that work offline
  requiresCachedAudio?: boolean;
  requiresCachedTranslation?: boolean;
  isAudioCached?: boolean;
  isTranslationCached?: boolean;
  disabled?: boolean;
  tooltip?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: string;
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * OfflineButton - Smart button component with network awareness
 */
export const OfflineButton: React.FC<OfflineButtonProps> = ({
  label,
  onPress,
  requiresNetwork = true,
  requiresCachedAudio = false,
  requiresCachedTranslation = false,
  isAudioCached = false,
  isTranslationCached = false,
  disabled = false,
  tooltip,
  size = 'medium',
  variant = 'primary',
  icon,
  loading = false,
  style,
}) => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    NetworkStatusService.getCurrentState()
  );
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Determine if button should be disabled
  const isOnline = networkState.status === 'online';
  const audioNotAvailable = requiresCachedAudio && !isAudioCached && !isOnline;
  const translationNotAvailable = requiresCachedTranslation && !isTranslationCached && !isOnline;
  const networkNotAvailable = requiresNetwork && !isOnline;

  const isDisabled = disabled || loading || audioNotAvailable || translationNotAvailable || networkNotAvailable;

  // Determine tooltip message
  let tooltipMessage = tooltip;
  if (!tooltipMessage) {
    if (audioNotAvailable) {
      tooltipMessage = 'Audio not cached for offline playback';
    } else if (translationNotAvailable) {
      tooltipMessage = 'Translation not available offline';
    } else if (networkNotAvailable) {
      tooltipMessage = 'Internet connection required';
    }
  }

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = NetworkStatusService.onNetworkChange((state) => {
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePress = async () => {
    if (isDisabled) {
      return;
    }

    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onPress();
    } catch (error) {
      console.error('[OfflineButton] Error executing button action:', error);
    }
  };

  // Get button styling
  const buttonStyles = getButtonStyles(size, variant, isDisabled);
  const textStyles = getTextStyles(size, variant, isDisabled);

  return (
    <View style={style}>
      <Animated.View
        style={[
          buttonStyles.container,
          {
            transform: [{ scale: scaleAnim }],
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={isDisabled}
          activeOpacity={isDisabled ? 1 : 0.7}
          style={buttonStyles.touchable}
        >
          <View style={buttonStyles.content}>
            {loading && (
              <Ionicons
                name="hourglass"
                size={buttonStyles.iconSize}
                color={textStyles.color}
                style={{ marginRight: Spacing.sm }}
              />
            )}

            {icon && !loading && (
              <Ionicons
                name={icon as any}
                size={buttonStyles.iconSize}
                color={textStyles.color}
                style={{ marginRight: Spacing.sm }}
              />
            )}

            <Text style={[textStyles.text, buttonStyles.label]}>
              {loading ? 'Loading...' : label}
            </Text>

            {isDisabled && tooltipMessage && (
              <Ionicons
                name="information-circle"
                size={16}
                color={Colors.text.secondary}
                style={{ marginLeft: Spacing.sm }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Tooltip for disabled state */}
      {isDisabled && tooltipMessage && (
        <Text style={styles.tooltipText}>{tooltipMessage}</Text>
      )}
    </View>
  );
};

/**
 * Get button container styles
 */
function getButtonStyles(
  size: 'small' | 'medium' | 'large',
  variant: 'primary' | 'secondary' | 'danger',
  disabled: boolean
) {
  const sizeConfig = {
    small: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.sm,
      iconSize: 16,
    },
    medium: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      iconSize: 18,
    },
    large: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      iconSize: 20,
    },
  };

  const variantConfig = {
    primary: {
      backgroundColor: Colors.primary.blue,
      borderColor: Colors.primary.blue,
    },
    secondary: {
      backgroundColor: Colors.background.secondary,
      borderColor: Colors.ui.border,
    },
    danger: {
      backgroundColor: Colors.error,
      borderColor: Colors.error,
    },
  };

  const config = sizeConfig[size];
  const variantStyle = variantConfig[variant];

  return {
    container: {
      overflow: 'hidden',
      borderRadius: config.borderRadius,
    },
    touchable: {
      paddingVertical: config.paddingVertical,
      paddingHorizontal: config.paddingHorizontal,
      backgroundColor: variantStyle.backgroundColor,
      borderWidth: 1,
      borderColor: variantStyle.borderColor,
      borderRadius: config.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontWeight: '600',
    },
    iconSize: config.iconSize,
  };
}

/**
 * Get text styles
 */
function getTextStyles(size: 'small' | 'medium' | 'large', variant: 'primary' | 'secondary' | 'danger', disabled: boolean) {
  const sizeConfig = {
    small: {
      fontSize: 12,
    },
    medium: {
      fontSize: 14,
    },
    large: {
      fontSize: 16,
    },
  };

  const variantConfig = {
    primary: {
      color: Colors.text.white,
    },
    secondary: {
      color: Colors.text.primary,
    },
    danger: {
      color: Colors.text.white,
    },
  };

  const sizeStyle = sizeConfig[size];
  const variantStyle = variantConfig[variant];

  return {
    text: {
      fontSize: sizeStyle.fontSize,
      ...Typography.body,
    },
    color: variantStyle.color,
  };
}

const styles = StyleSheet.create({
  tooltipText: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
