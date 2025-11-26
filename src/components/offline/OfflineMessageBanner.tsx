/**
 * Offline Message Banner Component
 * Displays offline-related alerts and informational messages
 * Shows storage warnings, sync issues, and offline mode status
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@constants';

export type BannerType = 'info' | 'warning' | 'error' | 'success';

export interface OfflineMessageBannerProps {
  visible: boolean;
  type: BannerType;
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

/**
 * OfflineMessageBanner - Shows contextual messages related to offline functionality
 */
export const OfflineMessageBanner: React.FC<OfflineMessageBannerProps> = ({
  visible,
  type,
  title,
  message,
  action,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
}) => {
  const slideAnim = useRef(new Animated.Value(visible ? 0 : -120)).current;
  const dismissTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log('[OfflineMessageBanner] Banner visibility changed:', {
      visible,
      type,
      title,
    });

    // Clear existing timeout
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    // Animate slide in/out
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -120,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss if enabled
    if (visible && autoDismiss && onDismiss) {
      dismissTimeoutRef.current = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [visible, autoDismiss, autoDismissDelay, onDismiss, slideAnim]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return Colors.error;
      case 'warning':
        return Colors.warning;
      case 'success':
        return Colors.success;
      case 'info':
      default:
        return Colors.primary.blue;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: visible ? 1 : 0,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor: getBackgroundColor(),
          },
        ]}
      >
        <Ionicons
          name={getIcon()}
          size={20}
          color={Colors.text.white}
          style={styles.icon}
        />

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.actions}>
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          )}

          {onDismiss && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={Colors.text.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 75,
  },
  banner: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: Spacing.md,
    marginTop: 2,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  message: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.9,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  actionText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: Spacing.sm,
  },
});
