/**
 * Upgrade Prompt Banner
 *
 * Inline banner for encouraging upgrades:
 * - Shown when user taps locked feedback tab
 * - Shown in practice results for free tier
 * - Shown in settings screen
 *
 * Provides:
 * - Clear value proposition
 * - CTA button to upgrade
 * - Optional dismiss button
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface UpgradePromptBannerProps {
  title: string;
  message: string;
  icon?: 'lock-closed' | 'star' | 'zap' | 'arrow-up-circle' | 'infinite';
  variant?: 'primary' | 'success' | 'warning';
  onUpgradePress: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export const UpgradePromptBanner: React.FC<UpgradePromptBannerProps> = ({
  title,
  message,
  icon = 'star',
  variant = 'primary',
  onUpgradePress,
  onDismiss,
  dismissible = true,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDismissed(true);
      onDismiss?.();
    });
  };

  if (dismissed) {
    return null;
  }

  const variantStyles = {
    primary: {
      gradient: [Colors.primary.blue + '15', Colors.primary.blue + '08'],
      borderColor: Colors.primary.blue + '30',
      iconColor: Colors.primary.blue,
      titleColor: Colors.primary.blue,
    },
    success: {
      gradient: [Colors.accent.green + '15', Colors.accent.green + '08'],
      borderColor: Colors.accent.green + '30',
      iconColor: Colors.accent.green,
      titleColor: Colors.accent.green,
    },
    warning: {
      gradient: [Colors.ui.warning + '15', Colors.ui.warning + '08'],
      borderColor: Colors.ui.warning + '30',
      iconColor: Colors.ui.warning,
      titleColor: Colors.ui.warning,
    },
  };

  const style = variantStyles[variant];

  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    switch (iconName) {
      case 'lock-closed':
        return 'lock-closed';
      case 'star':
        return 'star';
      case 'zap':
        return 'zap';
      case 'arrow-up-circle':
        return 'arrow-up-circle';
      case 'infinite':
        return 'infinite';
      default:
        return 'star';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={style.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, Shadows.md, { borderColor: style.borderColor }]}
      >
        <View style={styles.contentContainer}>
          <View style={[styles.iconContainer, { backgroundColor: style.iconColor + '20' }]}>
            <Ionicons
              name={getIconName(icon)}
              size={20}
              color={style.iconColor}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: style.titleColor }]}>
              {title}
            </Text>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>

          {dismissible && (
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.dismissButton}
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={onUpgradePress}
            activeOpacity={0.8}
          >
            <Text style={[styles.upgradeButtonText, { color: style.iconColor }]}>
              Upgrade Now
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={style.iconColor}
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  banner: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h3,
    fontWeight: '600',
    fontSize: 14,
  },
  message: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  dismissButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
    marginTop: -Spacing.sm,
  },
  buttonContainer: {
    alignSelf: 'flex-start',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  upgradeButtonText: {
    ...Typography.body,
    fontWeight: '600',
    fontSize: 13,
  },
  buttonIcon: {
    marginLeft: Spacing.xs,
  },
});
