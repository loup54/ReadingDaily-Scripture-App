import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@components/common';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants';
import { useTheme } from '@/hooks/useTheme';

interface TrialExpiredModalProps {
  visible: boolean;
  onPurchase: () => void;
  onDismiss?: () => void;
  lifetimePrice: number;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  visible,
  onPurchase,
  onDismiss,
  lifetimePrice,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onDismiss}
        />
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={colors.primary.gradient}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name="time-outline"
                  size={80}
                  color={colors.text.white}
                />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text.white }]}>Trial Expired</Text>
              <Text style={[styles.subtitle, { color: colors.text.white }]}>
                Your 10-minute free trial has ended.{'\n'}
                Continue reading scripture daily with{'\n'}
                lifetime access!
              </Text>

              {/* Features */}
              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Unlimited daily readings
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Audio with adjustable speed
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent.green}
                  />
                  <Text style={[styles.featureText, { color: colors.text.white }]}>
                    Multiple translations
                  </Text>
                </View>
              </View>

              {/* Price Badge */}
              <View style={styles.priceBadge}>
                <Text style={[styles.priceAmount, { color: colors.text.white }]}>${lifetimePrice}</Text>
                <Text style={[styles.priceLabel, { color: colors.text.white }]}>one-time payment</Text>
              </View>

              {/* CTA Button */}
              <Button
                title="Get Lifetime Access"
                variant="accent"
                size="lg"
                fullWidth
                onPress={onPurchase}
                style={styles.purchaseButton}
              />

              {/* Dismiss */}
              {onDismiss && (
                <TouchableOpacity
                  onPress={onDismiss}
                  style={styles.dismissButton}
                >
                  <Text style={[styles.dismissText, { color: colors.text.white }]}>Maybe later</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  gradient: {
    width: '100%',
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.text.white,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.95,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  features: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text.white,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  priceAmount: {
    ...Typography.displayLarge,
    color: Colors.text.white,
    fontWeight: '700',
  },
  priceLabel: {
    ...Typography.caption,
    color: Colors.text.white,
    opacity: 0.9,
    marginTop: Spacing.xs,
  },
  purchaseButton: {
    marginBottom: Spacing.md,
  },
  dismissButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dismissText: {
    ...Typography.body,
    color: Colors.text.white,
    opacity: 0.8,
  },
});
