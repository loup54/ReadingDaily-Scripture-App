import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '@constants';
import { useTheme } from '@/hooks/useTheme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  noPadding?: boolean;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = true,
  noPadding = false,
  testID,
}) => {
  const { colors } = useTheme();

  const cardStyle = [
    styles.card,
    { backgroundColor: colors.background.card, borderColor: colors.ui.border },
    elevated && Shadows.md,
    !noPadding && styles.padding,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  padding: {
    padding: Spacing.md,
  },
});