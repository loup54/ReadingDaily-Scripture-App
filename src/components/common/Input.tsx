import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '@constants';
import { useTheme } from '@/hooks/useTheme';
import { IconSizes } from '@/constants/icons';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  ...textInputProps
}) => {
  const { colors } = useTheme();
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  const toggleSecureEntry = () => {
    setIsSecure(!isSecure);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background.card,
            borderColor: error ? colors.ui.error : isFocused ? colors.primary.blue : colors.ui.border,
            borderWidth: error || isFocused ? 2 : 1,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={IconSizes.SMALL}
            color={error ? colors.ui.error : isFocused ? colors.primary.blue : colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          {...textInputProps}
          secureTextEntry={isPassword ? isSecure : secureTextEntry}
          style={[styles.input, { color: colors.text.primary }, textInputProps.style]}
          placeholderTextColor={colors.text.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {isPassword && (
          <TouchableOpacity onPress={toggleSecureEntry} style={styles.rightIconButton}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={IconSizes.SMALL}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Ionicons name={rightIcon} size={IconSizes.SMALL} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={[styles.errorText, { color: colors.ui.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.md,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIconButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});