/**
 * Subscription Gifting Types
 * Defines all types for the gift code system
 */

export type GiftStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';
export type GiftCategory = 'personal' | 'promotional' | 'contest' | 'referral' | 'corporate';
export type SubscriptionTier = 'basic' | 'premium' | 'lifetime';

/**
 * Gift Code - Core gift representation
 */
export interface GiftCode {
  // Identity
  giftCodeId: string;
  redeemCode: string; // User-facing code (e.g., GIFT-ABC123-XYZ)

  // Ownership & Purchase
  purchaserId: string;
  purchaserEmail: string;
  purchaseDate: number; // Timestamp

  // Gift Details
  subscriptionTier: SubscriptionTier;
  giftDurationMonths: number | null; // null for lifetime
  message?: string;

  // Recipient
  recipientEmail?: string;
  recipientUserId?: string;

  // Status
  status: GiftStatus;
  redeemedAt?: number; // Timestamp
  redeemedBy?: string; // User ID

  // Expiration
  expiresAt: number; // Timestamp
  expirationDays: number; // Original expiration period

  // Metadata
  giftCategory: GiftCategory;
  campaign?: string;
  trackingId?: string;

  // Tracking
  emailsSent: number;
  emailSentAt?: number; // Timestamp
  viewedAt?: number; // Timestamp
}

/**
 * Gift Code Configuration for creation
 */
export interface GiftCodeConfig {
  subscriptionTier: SubscriptionTier;
  giftDurationMonths?: number;
  recipientEmail?: string;
  message?: string;
  expirationDays?: number; // Default: 365
  giftCategory: GiftCategory;
  campaign?: string;
}

/**
 * Gift Redemption - Audit trail
 */
export interface GiftRedemption {
  redemptionId: string;
  giftCodeId: string;
  userId: string;
  userEmail: string;
  redeemedAt: number; // Timestamp
  redeemCode: string;
  ipAddress: string;
  deviceId: string;
  status: 'successful' | 'failed';
  failureReason?: string;
}

/**
 * Validation Result
 */
export interface GiftCodeValidation {
  isValid: boolean;
  code: string;
  status?: GiftStatus;
  error?: string;
  giftCode?: GiftCode;
}

/**
 * Redemption Result
 */
export interface RedemptionResult {
  success: boolean;
  message: string;
  giftCodeId?: string;
  subscriptionActivated?: {
    tier: SubscriptionTier;
    expiresAt: number;
    durationMonths: number | null;
  };
}

/**
 * User Gift History
 */
export interface UserGiftHistory {
  userId: string;
  giftsReceived: {
    giftCodeId: string;
    fromUserEmail?: string;
    giftMessage?: string;
    tier: SubscriptionTier;
    redeemedAt: number;
    expiresAt: number;
  }[];
  giftsSent: {
    giftCodeId: string;
    toUserEmail?: string;
    sentAt: number;
    status: GiftStatus;
    redeemedAt?: number;
  }[];
  referralStats?: {
    totalGiftsGiven: number;
    totalGiftsRedeemed: number;
    totalValueGiven: number;
    bonusSubscriptions: number;
  };
}

/**
 * Bulk Gift Generation Result
 */
export interface BulkGiftResult {
  totalRequested: number;
  totalGenerated: number;
  codes: GiftCode[];
  downloadUrl?: string; // For CSV download
}

/**
 * Gifting Analytics
 */
export interface GiftingAnalytics {
  dateRange: {
    startDate: number;
    endDate: number;
  };
  metrics: {
    codesGenerated: number;
    codesRedeemed: number;
    redemptionRate: number; // Percentage
    averageRedemptionTime: number; // Days
    totalRevenue: number;
    averageGiftValue: number;
    activeCodesCount: number;
    expiredCodesCount: number;
  };
  topCampaigns: Array<{
    campaign: string;
    codesGenerated: number;
    codesRedeemed: number;
    revenue: number;
  }>;
  fraud: {
    suspiciousPatternsDetected: number;
    blockedRedemptions: number;
    flaggedCodes: number;
  };
}

/**
 * Gift Send Configuration
 */
export interface GiftSendConfig {
  giftCodeId: string;
  recipients: string[]; // Email addresses
  subject?: string;
  bodyTemplate?: 'default' | 'personal' | 'corporate';
}

/**
 * Bulk Send Result
 */
export interface BulkSendResult {
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  failed: Array<{
    email: string;
    error: string;
  }>;
}
