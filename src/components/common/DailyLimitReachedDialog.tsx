/**
 * Daily Limit Reached Dialog
 *
 * Shows when free tier user exhausts their 10 minutes of daily practice
 * Offers options to:
 * - Upgrade to Basic ($2.99/month)
 * - Come back tomorrow (close dialog)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';

interface DailyLimitReachedDialogProps {
  visible: boolean;
  minutesUsed?: number; // Optional: show how many minutes were used (e.g., "10 of 10")
  onUpgradePress: () => void;
  onDismiss: () => void;
}

export const DailyLimitReachedDialog: React.FC<DailyLimitReachedDialogProps> = ({
  visible,
  minutesUsed = 10,
  onUpgradePress,
  onDismiss,
}) => {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradePress = async () => {
    setIsUpgrading(true);
    try {
      onUpgradePress();
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Dialog Container */}
        <View style={[styles.dialogContainer, Shadows.xl]}>
          {/* Header with icon */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.ui.warning, Colors.accent.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBackground}
              >
                <Ionicons
                  name="time-outline"
                  size={32}
                  color={Colors.text.white}
                />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Daily Limit Reached</Text>
            <Text style={styles.subtitle}>
              You've completed your free daily practice
            </Text>
          </View>

          {/* Message Section */}
          <View style={styles.messageSection}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Today's Practice</Text>
                <Text style={styles.statValue}>{minutesUsed} min</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Daily Limit</Text>
                <Text style={styles.statValue}>10 min</Text>
              </View>
            </View>

            <Text style={styles.mainMessage}>
              Great work today! Come back tomorrow for your next 10 minutes of
              free practice.
            </Text>

            <View style={styles.upgradePreview}>
              <View style={styles.upgradePreviewHeader}>
                <Ionicons
                  name="star"
                  size={18}
                  color={Colors.accent.green}
                  style={styles.upgradeIcon}
                />
                <Text style={styles.upgradePreviewTitle}>Go Unlimited</Text>
              </View>
              <Text style={styles.upgradePreviewText}>
                Upgrade to Basic and practice as much as you want
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.upgradeButton, Shadows.md]}
              onPress={handleUpgradePress}
              disabled={isUpgrading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.accent.green, Colors.accent.green + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeButtonGradient}
              >
                {isUpgrading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.upgradeButtonText}>Loading...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name="arrow-up-circle"
                      size={18}
                      color={Colors.text.white}
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.upgradeButtonText}>
                      Upgrade to Basic - $2.99/month
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>
                Come Back Tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💳 30-day free trial available. Cancel anytime.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.text.black + '80',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    maxWidth: 380,
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background.primary,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
  messageSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  statValue: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.background.tertiary,
    marginHorizontal: Spacing.md,
  },
  mainMessage: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  upgradePreview: {
    backgroundColor: Colors.accent.green + '15',
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent.green,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  upgradePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  upgradeIcon: {
    marginRight: Spacing.sm,
  },
  upgradePreviewTitle: {
    ...Typography.h3,
    color: Colors.accent.green,
    fontWeight: '600',
    fontSize: 14,
  },
  upgradePreviewText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 20,
  },
  buttonSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  upgradeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
  upgradeButtonText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  dismissButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
