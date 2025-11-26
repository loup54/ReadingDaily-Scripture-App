/**
 * Gifting Service Export Index
 * Central export point for all gift-related services and utilities
 */

export { subscriptionGiftingService } from './SubscriptionGiftingService';
export type {
  GiftCode,
  GiftCodeConfig,
  GiftCodeValidation,
  RedemptionResult,
  GiftRedemption,
  UserGiftHistory,
  BulkGiftResult,
  GiftingAnalytics,
  GiftSendConfig,
  BulkSendResult,
} from '@/types/gifting.types';

export {
  redeemGiftCodeFunction,
  isValidGiftCodeFormat,
  formatGiftCode,
  GiftRedemptionErrors,
} from './redeemGiftCodeFunction';

export {
  GiftEmailTemplates,
  giftReceivedTemplate,
  giftReceiptTemplate,
  giftRedemptionConfirmationTemplate,
} from './GiftEmailTemplates';

export type {
  EmailTemplate,
  GiftReceivedEmailParams,
  GiftReceiptEmailParams,
  GiftRedemptionConfirmationEmailParams,
} from './GiftEmailTemplates';
