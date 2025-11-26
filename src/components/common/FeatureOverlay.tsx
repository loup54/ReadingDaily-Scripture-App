/**
 * FeatureOverlay Component
 *
 * Full-screen modal overlay for introducing features to users.
 * Shows on first activation of a feature to explain how to use it.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface FeatureOverlayProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onDismiss: () => void;
  visible?: boolean;
}

/**
 * FeatureOverlay - Modal for introducing features
 *
 * @example
 * <FeatureOverlay
 *   title="Word Highlighting"
 *   description="Words highlight as the audio plays. This helps you follow along and improve your reading speed."
 *   icon="highlight"
 *   actionLabel="Got It"
 *   onDismiss={() => setShowOverlay(false)}
 *   visible={true}
 * />
 */
export const FeatureOverlay: React.FC<FeatureOverlayProps> = ({
  title,
  description,
  icon,
  actionLabel = 'Got It',
  onDismiss,
  visible = true,
}) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode
                ? Colors.background.secondary
                : Colors.background.primary,
            },
          ]}
        >
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons
                name={icon as any}
                size={48}
                color={Colors.primary.blue}
              />
            </View>
          )}

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: Colors.text.primary },
            ]}
          >
            {title}
          </Text>

          {/* Description */}
          <Text
            style={[
              styles.description,
              { color: Colors.text.secondary },
            ]}
          >
            {description}
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </TouchableOpacity>

          {/* Close Button (small X in corner) */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            activeOpacity={0.6}
          >
            <Ionicons
              name="close"
              size={24}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.displayMedium,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...Typography.bodyLarge,
    lineHeight: 24,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary.blue,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 200,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonText: {
    ...Typography.label,
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
});
