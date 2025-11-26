/**
 * Subscription Tiers and Pricing
 */

export const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    price: 2.99,
    duration: 1,
    badge: null,
    description: 'Access to daily Scripture readings and devotionals',
    features: [
      'Daily Scripture readings',
      'Audio narration',
      'Offline access',
    ],
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    duration: 12,
    badge: 'Popular',
    description: 'Full access to all premium features',
    features: [
      'All Basic features',
      'Sync across devices',
      'Ad-free experience',
    ],
  },
  lifetime: {
    name: 'Lifetime',
    price: 59.99,
    duration: null,
    badge: 'Best Value',
    description: 'Permanent access to all features, forever',
    features: [
      'All Premium features',
      'Lifetime updates',
      'Priority support',
      'Exclusive content',
      'Never expires',
      'One-time payment',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const getSubscriptionDurationMonths = (tier: SubscriptionTier): number => {
  const tierData = SUBSCRIPTION_TIERS[tier];
  return tierData.duration ?? 1200; // Lifetime = 100 years
};

export const getSubscriptionExpirationDate = (
  tier: SubscriptionTier,
  startDate: Date = new Date()
): Date => {
  const months = getSubscriptionDurationMonths(tier);
  const expirationDate = new Date(startDate);
  expirationDate.setMonth(expirationDate.getMonth() + months);
  return expirationDate;
};
