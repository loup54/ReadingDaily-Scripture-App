/**
 * Custom Toast Component
 * Provides rich toast notifications with action buttons
 * Supports light/dark theme and multiple toast types
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BaseToastProps } from 'react-native-toast-message';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  actions?: ToastAction[];
}

/**
 * Get colors for toast type
 */
const getToastColors = (type: string, isDark: boolean) => {
  const colorMap = {
    success: {
      bg: isDark ? '#1F3A1F' : '#E8F5E9',
      text: isDark ? '#A5D6A7' : '#2E7D32',
      border: isDark ? '#4CAF50' : '#81C784',
      icon: isDark ? '#66BB6A' : '#4CAF50',
    },
    error: {
      bg: isDark ? '#3A1F1F' : '#FFEBEE',
      text: isDark ? '#EF9A9A' : '#C62828',
      border: isDark ? '#F44336' : '#EF5350',
      icon: isDark ? '#EF5350' : '#F44336',
    },
    info: {
      bg: isDark ? '#1F2A3A' : '#E3F2FD',
      text: isDark ? '#90CAF9' : '#1565C0',
      border: isDark ? '#2196F3' : '#64B5F6',
      icon: isDark ? '#64B5F6' : '#2196F3',
    },
    warning: {
      bg: isDark ? '#3A2A1F' : '#FFF3E0',
      text: isDark ? '#FFB74D' : '#E65100',
      border: isDark ? '#FF9800' : '#FFB74D',
      icon: isDark ? '#FFB74D' : '#FF9800',
    },
  };

  return colorMap[type as keyof typeof colorMap] || colorMap.info;
};

/**
 * Get icon name for toast type
 */
const getIconName = (type: string): any => {
  const iconMap = {
    success: 'checkmark-circle',
    error: 'close-circle',
    info: 'information-circle',
    warning: 'alert-circle',
  };

  return iconMap[type as keyof typeof iconMap] || 'information-circle';
};

/**
 * Custom Toast Component with action buttons
 */
export const CustomToast: React.FC<CustomToastProps> = ({
  text1,
  text2,
  type = 'info',
  onPress,
  actions,
}) => {
  const isDark = useColorScheme() === 'dark';
  const colors = getToastColors(type, isDark);
  const iconName = getIconName(type);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={colors.icon} />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.text1,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {text1}
          </Text>
          {text2 && (
            <Text
              style={[
                styles.text2,
                {
                  color: colors.text,
                  opacity: 0.8,
                },
              ]}
              numberOfLines={2}
            >
              {text2}
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      {actions && actions.length > 0 && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                {
                  borderTopColor: colors.border,
                },
              ]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.actionText,
                  {
                    color: colors.icon,
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  text2: {
    fontSize: 14,
    marginTop: 2,
  },
  actionsContainer: {
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
