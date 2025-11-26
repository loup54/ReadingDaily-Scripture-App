/**
 * Paywall Screen
 *
 * Displays subscription tier options and upgrade flow:
 * - FREE: 10 min/day (current tier for most users)
 * - BASIC: $2.99/month - Unlimited practice + full AI feedback
 *
 * Shown when:
 * - Daily limit reached (practice tab)
 * - User taps locked feedback tab
 * - User manually visits from settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants';
import { useTrialStore } from '@/stores/useTrialStore';
import { SubscriptionTier } from '@/types/subscription.types';
import { analyticsService } from '@/services/analytics/AnalyticsService';

interface PaywallScreenProps {
  onClose?: () => void;
  onUpgradeComplete?: () => void;
  sourceContext?: 'daily_limit' | 'locked_tab' | 'settings' | 'practice';
}

type TierOption = 'free' | 'basic';

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onClose,
  onUpgradeComplete,
  sourceContext = 'practice',
}) => {
  const [selectedTier, setSelectedTier] = useState<TierOption>('basic');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTier = useTrialStore(state => state.currentTier);
  const upgradeToBasic = useTrialStore(state => state.upgradeToBasic);

  // Log when paywall is shown
  useEffect(() => {
    analyticsService.logUpgradePrompted({
      source: sourceContext,
      tier: 'basic',
      promptType: 'modal',
    });
  }, [sourceContext]);

  const handleUpgradePress = async () => {
    setIsProcessing(true);
    try {
      console.log(`💳 Starting upgrade from ${currentTier} to basic`);

      // Upgrade via payment service
      const success = await upgradeToBasic('basic_monthly_subscription');

      if (success) {
        console.log('✅ Upgrade successful');

        // Wait a moment for state to update
        setTimeout(() => {
          onUpgradeComplete?.();
          onClose?.();
        }, 500);
      } else {
        console.error('❌ Upgrade failed');
        // Error handling could be enhanced here with user feedback
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    // Log when paywall is dismissed
    analyticsService.logUpgradeCancelled(sourceContext);
    onClose?.();
  };

  const renderTierCard = (
    tier: TierOption,
    isSelected: boolean,
    isCurrent: boolean
  ) => {
    const tierData = {
      free: {
        title: 'FREE',
        price: '$0',
        period: '/month',
        description: 'Limited practice',
        features: [
          { text: '10 minutes/day', included: true },
          { text: 'Basic feedback', included: true },
          { text: 'Overall score', included: true },
          { text: 'Word-level analysis', included: false },
          { text: 'Phoneme breakdown', included: false },
          { text: 'Prosody feedback', included: false },
          { text: 'Audio comparison', included: false },
        ],
      },
      basic: {
        title: 'BASIC',
        price: '$2.99',
        period: '/month',
        description: 'Unlimited learning',
        features: [
          { text: 'Unlimited daily practice', included: true },
          { text: 'Full AI feedback', included: true },
          { text: 'Overall score', included: true },
          { text: 'Word-level analysis', included: true },
          { text: 'Phoneme breakdown', included: true },
          { text: 'Prosody feedback', included: true },
          { text: 'Audio comparison', included: true },
        ],
      },
    };

    const data = tierData[tier];
    const isBasic = tier === 'basic';

    return (
      <TouchableOpacity
        key={tier}
        style={[
          styles.tierCard,
          isSelected && styles.tierCardSelected,
          isBasic && Shadows.lg,
        ]}
        onPress={() => setSelectedTier(tier)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isBasic
              ? [Colors.accent.green + '15', Colors.accent.green + '08']
              : [Colors.background.secondary, Colors.background.secondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tierGradient}
        >
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.accent.green}
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>Current</Text>
            </View>
          )}

          {isBasic && !isCurrent && (
            <View style={styles.recommendedBadge}>
              <Ionicons
                name="star"
                size={14}
                color={Colors.accent.orange}
                style={styles.badgeIcon}
              />
              <Text style={styles.recommendedBadgeText}>Best Value</Text>
            </View>
          )}

          {isSelected && !isCurrent && (
            <View style={styles.selectedIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.accent.green}
              />
            </View>
          )}

          <Text style={styles.tierTitle}>{data.title}</Text>
          <Text style={styles.tierDescription}>{data.description}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.tierPrice}>{data.price}</Text>
            <Text style={styles.tierPeriod}>{data.period}</Text>
          </View>

          <View style={styles.featureList}>
            {data.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons
                  name={feature.included ? 'checkmark' : 'close'}
                  size={16}
                  color={
                    feature.included
                      ? Colors.accent.green
                      : Colors.text.tertiary
                  }
                  style={styles.featureIcon}
                />
                <Text
                  style={[
                    styles.featureText,
                    !feature.included && styles.featureTextDisabled,
                  ]}
                >
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Continue Learning</Text>
          {onClose && (
            <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={24}
                color={Colors.text.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          Choose your learning plan
        </Text>
      </View>

      {/* Tier Cards */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tierContainer}>
          {renderTierCard('free', selectedTier === 'free', currentTier === 'free')}
          {renderTierCard('basic', selectedTier === 'basic', currentTier === 'basic')}
        </View>

        {/* Benefits Section */}
        <View style={[styles.benefitsCard, Shadows.sm]}>
          <Text style={styles.benefitsTitle}>Why Upgrade?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons
                name="infinite"
                size={20}
                color={Colors.accent.green}
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>
                Practice unlimited anytime
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="analytics"
                size={20}
                color={Colors.accent.green}
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>
                Get detailed pronunciation analysis
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons
                name="bulb"
                size={20}
                color={Colors.accent.green}
                style={styles.benefitIcon}
              />
              <Text style={styles.benefitText}>
                Learn at your own pace
              </Text>
            </View>
          </View>
        </View>

        {/* Guarantee Section */}
        <View style={styles.guaranteeSection}>
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={Colors.accent.green}
            style={styles.guaranteeIcon}
          />
          <Text style={styles.guaranteeText}>
            30-day money-back guarantee
          </Text>
          <Text style={styles.guaranteeSubtext}>
            No questions asked if you're not satisfied
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, Shadows.lg]}>
        {currentTier !== 'basic' && selectedTier === 'basic' && (
          <TouchableOpacity
            style={[styles.upgradeButton, isProcessing && styles.upgradeButtonDisabled]}
            onPress={handleUpgradePress}
            disabled={isProcessing}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.accent.green, Colors.accent.green + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              {isProcessing ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.text.white}
                  style={styles.spinner}
                />
              ) : (
                <>
                  <Ionicons
                    name="card"
                    size={18}
                    color={Colors.text.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.upgradeButtonText}>
                    Upgrade Now
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {currentTier === 'basic' && (
          <View style={[styles.statusContainer, Shadows.sm]}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={Colors.accent.green}
              style={styles.statusIcon}
            />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>You're All Set!</Text>
              <Text style={styles.statusSubtitle}>
                Your Basic subscription is active
              </Text>
            </View>
          </View>
        )}

        {onClose && (
          <TouchableOpacity
            style={[styles.continueButton, selectedTier === 'basic' && styles.continueButtonHidden]}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>
              {selectedTier === 'free' ? 'Continue with Free' : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  tierContainer: {
    gap: Spacing.lg,
  },
  tierCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.background.secondary,
  },
  tierCardSelected: {
    borderColor: Colors.accent.green,
    borderWidth: 2.5,
  },
  tierGradient: {
    padding: Spacing.lg,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.green + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  badgeIcon: {
    marginRight: Spacing.xs,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.accent.green,
    fontWeight: '600',
    fontSize: 11,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent.orange + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  recommendedBadgeText: {
    ...Typography.caption,
    color: Colors.accent.orange,
    fontWeight: '600',
    fontSize: 11,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  tierTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  tierDescription: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontSize: 13,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  tierPrice: {
    ...Typography.h1,
    fontSize: 32,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  tierPeriod: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    fontSize: 13,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: Spacing.md,
    minWidth: 16,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  featureTextDisabled: {
    color: Colors.text.tertiary,
    opacity: 0.6,
  },
  benefitsCard: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  benefitsTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  benefitsList: {
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: Spacing.md,
    minWidth: 20,
  },
  benefitText: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  guaranteeSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  guaranteeIcon: {
    marginBottom: Spacing.sm,
  },
  guaranteeText: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  guaranteeSubtext: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.background.secondary,
  },
  upgradeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  upgradeButtonGradient: {
    paddingVertical: Spacing.lg,
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
  spinner: {
    marginHorizontal: Spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.green + '10',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  statusIcon: {
    marginRight: Spacing.md,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    ...Typography.h3,
    color: Colors.accent.green,
    fontWeight: '600',
  },
  statusSubtitle: {
    ...Typography.caption,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  continueButton: {
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  continueButtonHidden: {
    display: 'none',
  },
  continueButtonText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
