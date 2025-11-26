/**
 * TooltipIcon Component
 *
 * Displays a help icon that reveals a tooltip when tapped.
 * Used for contextual help in settings and complex features.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';

interface TooltipIconProps {
  title?: string;
  description: string;
  size?: number;
  color?: string;
  containerStyle?: any;
}

/**
 * TooltipIcon - Tap to reveal helpful information
 *
 * @example
 * <TooltipIcon
 *   title="Word Highlighting"
 *   description="Words highlight as audio plays. Great for following along."
 * />
 */
export const TooltipIcon: React.FC<TooltipIconProps> = ({
  title,
  description,
  size = 16,
  color = Colors.primary.blue,
  containerStyle,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={containerStyle}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="help-circle-outline" size={size} color={color} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              {title && <Text style={styles.title}>{title}</Text>}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>{description}</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.buttonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primary.blue,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    ...Typography.label,
    color: Colors.text.white,
    fontWeight: '600',
  },
});
