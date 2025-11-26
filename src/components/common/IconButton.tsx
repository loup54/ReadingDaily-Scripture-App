import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@constants';
import { SpringAnimations } from '@/constants/animations';
import { useTheme } from '@/hooks/useTheme';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'default' | 'filled' | 'outline';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  // Accessibility props - REQUIRED for icon-only buttons
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  color,
  backgroundColor,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (prefersReducedMotion) return;

    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      ...SpringAnimations.GENTLE,
    }).start();
  };

  const handlePressOut = () => {
    if (prefersReducedMotion) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...SpringAnimations.GENTLE,
    }).start();
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'sm':
        return 18;
      case 'md':
        return 24;
      case 'lg':
        return 32;
      default:
        return 24;
    }
  };

  const getButtonSize = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 48;
      default:
        return 40;
    }
  };

  const getIconColor = (): string => {
    if (color) return color;
    if (variant === 'filled') return colors.text.white;
    return colors.text.primary;
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: getButtonSize(),
      height: getButtonSize(),
      borderRadius: BorderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    };

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: backgroundColor || colors.primary.blue,
      };
    }

    if (variant === 'outline') {
      return {
        ...baseStyle,
        borderWidth: 2,
        borderColor: color || colors.primary.blue,
        backgroundColor: 'transparent',
      };
    }

    return baseStyle;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[getContainerStyle(), style]}
        activeOpacity={0.7}
        testID={testID}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        <Ionicons name={icon} size={getIconSize()} color={getIconColor()} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Styles are generated dynamically
});