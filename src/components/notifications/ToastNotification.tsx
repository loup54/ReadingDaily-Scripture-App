/**
 * Toast Notification Component
 * Phase 10B.5: In-App Toast Component
 *
 * Individual toast notification with auto-dismiss, animations, and gesture support
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';

/**
 * Toast notification types and variants
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  NOTIFICATION = 'notification',
}

/**
 * Toast position on screen
 */
export enum ToastPosition {
  TOP = 'top',
  CENTER = 'center',
  BOTTOM = 'bottom',
}

/**
 * Toast notification data
 */
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  position?: ToastPosition;
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Toast component props
 */
interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
  index: number; // Position in stack
}

/**
 * Get styling based on toast type
 */
function getToastStyle(type: ToastType) {
  const baseStyle = {
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
  };

  switch (type) {
    case ToastType.SUCCESS:
      return {
        ...baseStyle,
        backgroundColor: '#F0FFF4',
        borderLeftColor: '#22C55E',
      };
    case ToastType.ERROR:
      return {
        ...baseStyle,
        backgroundColor: '#FEF2F2',
        borderLeftColor: '#EF4444',
      };
    case ToastType.WARNING:
      return {
        ...baseStyle,
        backgroundColor: '#FFFBEB',
        borderLeftColor: '#F59E0B',
      };
    case ToastType.INFO:
      return {
        ...baseStyle,
        backgroundColor: '#F0F9FF',
        borderLeftColor: '#3B82F6',
      };
    case ToastType.NOTIFICATION:
      return {
        ...baseStyle,
        backgroundColor: '#F3F4F6',
        borderLeftColor: '#6B7280',
      };
    default:
      return baseStyle;
  }
}

/**
 * Get icon emoji for toast type
 */
function getToastIcon(type: ToastType): string {
  switch (type) {
    case ToastType.SUCCESS:
      return '✅';
    case ToastType.ERROR:
      return '❌';
    case ToastType.WARNING:
      return '⚠️';
    case ToastType.INFO:
      return 'ℹ️';
    case ToastType.NOTIFICATION:
      return '🔔';
    default:
      return '📢';
  }
}

/**
 * Get text color based on toast type
 */
function getTextColor(type: ToastType): string {
  switch (type) {
    case ToastType.SUCCESS:
      return '#166534';
    case ToastType.ERROR:
      return '#991B1B';
    case ToastType.WARNING:
      return '#92400E';
    case ToastType.INFO:
      return '#0C4A6E';
    case ToastType.NOTIFICATION:
      return '#374151';
    default:
      return '#000';
  }
}

/**
 * Individual Toast Notification Component
 */
export function ToastNotification({
  toast,
  onDismiss,
  index,
}: ToastNotificationProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: Animated.event(
        [null, { dx: animatedValue }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, { vx }) => {
        // If swiped right (vx > 0.3), dismiss
        if (vx > 0.3) {
          handleDismiss();
        } else {
          // Reset animation
          Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  /**
   * Animate in when component mounts
   */
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  /**
   * Auto-dismiss timer
   */
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id]);

  /**
   * Handle dismissal with animation
   */
  const handleDismiss = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(toast.id);
    });
  };

  const toastStyle = getToastStyle(toast.type);
  const textColor = getTextColor(toast.type);
  const icon = getToastIcon(toast.type);

  // Calculate vertical offset based on position in stack
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, index * 100],
  });

  const opacity = animatedValue;

  const animatedStyle: Animated.AnimatedProps<ViewStyle> = {
    transform: [{ translateY }],
    opacity,
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [400, 0],
              }),
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.toast,
          toastStyle as any,
          {
            marginBottom: index > 0 ? 12 : 0,
          },
        ]}
      >
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Icon */}
          <Text style={styles.icon}>{icon}</Text>

          {/* Text Container */}
          <View style={styles.textContainer}>
            {toast.title && (
              <Text
                style={[styles.title, { color: textColor }]}
                numberOfLines={1}
              >
                {toast.title}
              </Text>
            )}
            <Text
              style={[styles.message, { color: textColor }]}
              numberOfLines={2}
            >
              {toast.message}
            </Text>
          </View>

          {/* Action Button */}
          {toast.action && (
            <View style={styles.actionContainer}>
              <Text
                style={styles.actionButton}
                onPress={toast.action.onPress}
              >
                {toast.action.label}
              </Text>
            </View>
          )}
        </View>

        {/* Close Button */}
        <Text
          style={styles.closeButton}
          onPress={handleDismiss}
        >
          ✕
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
  },
  actionContainer: {
    marginLeft: 12,
  },
  actionButton: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButton: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    paddingLeft: 12,
    paddingVertical: 4,
  },
});
