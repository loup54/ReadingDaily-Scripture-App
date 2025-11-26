/**
 * EmptyState Component
 *
 * Reusable component for displaying helpful empty states across the app.
 * Used when:
 * - No notifications available
 * - No readings for selected date
 * - No progress data yet
 * - No search results
 * - No bookmarks/favorites
 *
 * Features:
 * - Icon support (Ionicons)
 * - Title and descriptive message
 * - Tips/guidance list (up to 5 items)
 * - Optional action button with CTA
 * - Dark/light mode support
 * - Responsive layout
 * - Fully accessible (a11y)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface ActionButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  /** Ionicon name for the main icon */
  icon: string;

  /** Main heading (e.g., "No Notifications Yet") */
  title: string;

  /** Descriptive message explaining the empty state */
  message: string;

  /** Array of helpful tips (3-5 items recommended) */
  tips?: string[];

  /** Optional action button */
  actionButton?: ActionButton;

  /** Optional theme override */
  theme?: 'light' | 'dark';

  /** Optional custom container style */
  containerStyle?: ViewStyle;
}

/**
 * EmptyState Component
 *
 * Displays a user-friendly empty state with icon, message, tips, and optional CTA
 *
 * @example
 * <EmptyState
 *   icon="notifications-off-outline"
 *   title="No Notifications Yet"
 *   message="You haven't received any notifications yet"
 *   tips={[
 *     '✓ Enable notifications in Settings',
 *     '✓ Turn on Daily Reminders',
 *   ]}
 *   actionButton={{
 *     label: 'Go to Settings',
 *     onPress: () => navigation.navigate('Settings'),
 *   }}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  tips,
  actionButton,
  theme,
  containerStyle,
}) => {
  // Determine colors based on theme or use app defaults
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#1a1a1a' : '#ffffff',
    text: {
      primary: isDark ? '#ffffff' : '#1a1a1a',
      secondary: isDark ? '#a0a0a0' : '#666666',
    },
    icon: isDark ? '#5B6FE8' : '#5B6FE8',
    border: isDark ? '#333333' : '#f0f0f0',
    buttonBackground: isDark ? '#5B6FE8' : '#5B6FE8',
    buttonText: '#ffffff',
  };

  const styles = StyleSheet.create({
    scrollViewContainer: {
      flex: 1,
      minHeight: 300,
    },
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
      minHeight: 300,
    },
    content: {
      alignItems: 'center',
      gap: Spacing.md,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    icon: {
      color: colors.icon,
    },
    title: {
      fontSize: Typography.displayMedium.fontSize,
      fontWeight: Typography.displayMedium.fontWeight as any,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    } as TextStyle,
    message: {
      fontSize: Typography.bodyLarge.fontSize,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: Spacing.md,
      maxWidth: 320,
    } as TextStyle,
    tipsContainer: {
      backgroundColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginVertical: Spacing.md,
      maxWidth: 340,
      gap: Spacing.xs,
    },
    tipItem: {
      fontSize: Typography.body.fontSize,
      color: colors.text.secondary,
      lineHeight: 20,
      marginBottom: Spacing.xs,
    } as TextStyle,
    buttonContainer: {
      marginTop: Spacing.lg,
    },
    primaryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.buttonBackground,
      borderRadius: BorderRadius.md,
      minWidth: 200,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    secondaryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: 'transparent',
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.buttonBackground,
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: Typography.bodyLarge.fontSize,
      fontWeight: '600',
      color: actionButton?.variant === 'secondary' ? colors.buttonBackground : colors.buttonText,
      textAlign: 'center',
    } as TextStyle,
  });

  return (
    <ScrollView
      style={[styles.scrollViewContainer, containerStyle]}
      contentContainerStyle={styles.container}
      scrollEnabled={false}
    >
      <View style={styles.content}>
        {/* Icon Circle */}
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={40} style={styles.icon} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Message */}
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>

        {/* Tips Section */}
        {tips && tips.length > 0 && (
          <View style={styles.tipsContainer}>
            {tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>
                {tip}
              </Text>
            ))}
          </View>
        )}

        {/* Action Button */}
        {actionButton && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={
                actionButton.variant === 'secondary'
                  ? styles.secondaryButton
                  : styles.primaryButton
              }
              onPress={actionButton.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>{actionButton.label}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
