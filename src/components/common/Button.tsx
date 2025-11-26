import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '@constants';
import { AnimationDurations, SpringAnimations } from '@/constants/animations';
import { useTheme } from '@/hooks/useTheme';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  // Accessibility props
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const { prefersReducedMotion } = usePrefersReducedMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    if (prefersReducedMotion) return;

    Animated.spring(scaleAnim, {
      toValue: 0.95,
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

  const getButtonContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? colors.primary.blue : colors.text.white}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, getTextStyle(), textStyle]} numberOfLines={1}>{title}</Text>
        </>
      )}
    </View>
  );

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...Typography.button,
      fontSize: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, color: colors.text.white };
      case 'secondary':
        return { ...baseStyle, color: colors.text.primary };
      case 'accent':
        return { ...baseStyle, color: colors.text.white };
      case 'outline':
        return { ...baseStyle, color: colors.primary.blue };
      case 'text':
        return { ...baseStyle, color: colors.primary.blue };
      default:
        return baseStyle;
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      paddingVertical: size === 'sm' ? Spacing.sm : size === 'md' ? Spacing.md : Spacing.lg,
      paddingHorizontal: size === 'sm' ? Spacing.md : size === 'md' ? Spacing.lg : Spacing.xl,
      opacity: isDisabled ? 0.5 : 1,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    if (variant === 'outline') {
      return {
        ...baseStyle,
        borderWidth: 2,
        borderColor: colors.primary.blue,
        backgroundColor: 'transparent',
      };
    }

    if (variant === 'text') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        paddingVertical: Spacing.sm,
      };
    }

    return baseStyle;
  };

  if (variant === 'primary') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          style={[styles.button, fullWidth && styles.fullWidth, style]}
          testID={testID}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel={accessibilityLabel || title}
          accessibilityRole="button"
          accessibilityHint={accessibilityHint}
        >
          <LinearGradient
            colors={colors.primary.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[getContainerStyle(), styles.gradient]}
          >
            {getButtonContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'accent') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          style={[
            styles.button,
            getContainerStyle(),
            { backgroundColor: colors.accent.green },
            fullWidth && styles.fullWidth,
            !isDisabled && Shadows.md,
            style,
          ]}
          testID={testID}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel={accessibilityLabel || title}
          accessibilityRole="button"
          accessibilityHint={accessibilityHint}
        >
          {getButtonContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          getContainerStyle(),
          variant === 'secondary' && { backgroundColor: colors.background.secondary },
          fullWidth && styles.fullWidth,
          variant !== 'text' && !isDisabled && Shadows.sm,
          style,
        ]}
        testID={testID}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        {getButtonContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: '100%',
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  text: {
    textAlign: 'center',
  },
});