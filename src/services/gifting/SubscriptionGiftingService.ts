/**
 * Subscription Gifting Service
 * Handles gift code generation, validation, and redemption
 */

import * as admin from 'firebase-admin';
import {
  GiftCode,
  GiftCodeConfig,
  GiftCodeValidation,
  RedemptionResult,
  GiftRedemption,
  UserGiftHistory,
  BulkGiftResult,
  GiftingAnalytics,
} from '@/types/gifting.types';

class SubscriptionGiftingServiceClass {
  private db = admin.firestore();
  private readonly GIFT_CODES_COLLECTION = 'giftCodes';
  private readonly GIFT_REDEMPTIONS_COLLECTION = 'giftRedemptions';
  private readonly CODE_LENGTH = 12;
  private readonly CODE_FORMAT = 'GIFT-{SEGMENT1}-{SEGMENT2}'; // GIFT-ABC12345-XYZ

  /**
   * Generate a single gift code
   */
  async generateGiftCode(config: GiftCodeConfig): Promise<GiftCode> {
    try {
      const giftCodeId = this.generateUniqueId();
      const redeemCode = this.generateRedeemCode();
      const now = Date.now();

      const expirationDays = config.expirationDays || 365;
      const expiresAt = now + expirationDays * 24 * 60 * 60 * 1000;

      const giftCode: GiftCode = {
        giftCodeId,
        redeemCode,
        purchaserId: '', // Set by caller
        purchaserEmail: '',
        purchaseDate: now,
        subscriptionTier: config.subscriptionTier,
        giftDurationMonths: config.giftDurationMonths || null,
        message: config.message,
        recipientEmail: config.recipientEmail,
        status: 'active',
        expiresAt,
        expirationDays,
        giftCategory: config.giftCategory,
        campaign: config.campaign,
        emailsSent: 0,
      };

      // Save to Firestore
      await this.db
        .collection(this.GIFT_CODES_COLLECTION)
        .doc(giftCodeId)
        .set(giftCode);

      console.log('[SubscriptionGiftingService] Gift code generated:', redeemCode);
      return giftCode;
    } catch (error) {
      console.error('[SubscriptionGiftingService] Error generating gift code:', error);
      throw error;
    }
  }

  /**
   * Generate multiple gift codes in bulk
   */
  async bulkGenerateGiftCodes(
    quantity: number,
    config: GiftCodeConfig
  ): Promise<BulkGiftResult> {
    try {
      const codes: GiftCode[] = [];
      const errors: string[] = [];

      console.log(`[SubscriptionGiftingService] Generating ${quantity} gift codes`);

      for (let i = 0; i < quantity; i++) {
        try {
          const code = await this.generateGiftCode(config);
          codes.push(code);
        } catch (error) {
          errors.push(`Code ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      console.log(
        `[SubscriptionGiftingService] Bulk generation complete: ${codes.length}/${quantity} successful`
      );

      return {
        totalRequested: quantity,
        totalGenerated: codes.length,
        codes,
      };
    } catch (error) {
      console.error('[SubscriptionGiftingService] Bulk generation error:', error);
      throw error;
    }
  }

  /**
   * Validate a gift code
   */
  async validateGiftCode(code: string): Promise<GiftCodeValidation> {
    try {
      const normalizedCode = code.toUpperCase().trim();

      // Query for code
      const snapshot = await this.db
        .collection(this.GIFT_CODES_COLLECTION)
        .where('redeemCode', '==', normalizedCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return {
          isValid: false,
          code: normalizedCode,
          error: 'Gift code not found',
        };
      }

      const giftCode = snapshot.docs[0].data() as GiftCode;

      // Check status
      if (giftCode.status === 'redeemed') {
        return {
          isValid: false,
          code: normalizedCode,
          error: 'This gift code has already been redeemed',
          status: 'redeemed',
        };
      }

      if (giftCode.status === 'expired') {
        return {
          isValid: false,
          code: normalizedCode,
          error: 'This gift code has expired',
          status: 'expired',
        };
      }

      if (giftCode.status === 'cancelled') {
        return {
          isValid: false,
          code: normalizedCode,
          error: 'This gift code has been cancelled',
          status: 'cancelled',
        };
      }

      // Check expiration
      if (giftCode.expiresAt < Date.now()) {
        return {
          isValid: false,
          code: normalizedCode,
          error: 'This gift code has expired',
          status: 'expired',
        };
      }

      return {
        isValid: true,
        code: normalizedCode,
        status: 'active',
        giftCode,
      };
    } catch (error) {
      console.error('[SubscriptionGiftingService] Validation error:', error);
      return {
        isValid: false,
        code,
        error: 'Error validating gift code',
      };
    }
  }

  /**
   * Redeem a gift code for a user
   */
  async redeemGiftCode(
    code: string,
    userId: string,
    userEmail: string,
    deviceInfo?: { ipAddress?: string; deviceId?: string }
  ): Promise<RedemptionResult> {
    try {
      // Validate code first
      const validation = await this.validateGiftCode(code);

      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'Invalid gift code',
        };
      }

      const giftCode = validation.giftCode!;

      // Check if user already has active subscription (optional - based on business logic)
      // const userDoc = await this.db.collection('users').doc(userId).get();
      // if (userDoc.exists && userDoc.data()?.subscriptionStatus === 'active') {
      //   return { success: false, message: 'You already have an active subscription' };
      // }

      const now = Date.now();

      // Calculate subscription expiration
      let subscriptionExpiresAt: number;
      if (giftCode.giftDurationMonths === null) {
        // Lifetime
        subscriptionExpiresAt = now + 100 * 365 * 24 * 60 * 60 * 1000; // 100 years
      } else {
        subscriptionExpiresAt = now + giftCode.giftDurationMonths * 30 * 24 * 60 * 60 * 1000;
      }

      // Update gift code status
      await this.db
        .collection(this.GIFT_CODES_COLLECTION)
        .doc(giftCode.giftCodeId)
        .update({
          status: 'redeemed',
          redeemedAt: now,
          redeemedBy: userId,
          recipientUserId: userId,
          recipientEmail: userEmail,
        });

      // Create redemption record (audit trail)
      const redemptionId = this.generateUniqueId();
      const redemption: GiftRedemption = {
        redemptionId,
        giftCodeId: giftCode.giftCodeId,
        userId,
        userEmail,
        redeemedAt: now,
        redeemCode: code.toUpperCase(),
        ipAddress: deviceInfo?.ipAddress || 'unknown',
        deviceId: deviceInfo?.deviceId || 'unknown',
        status: 'successful',
      };

      await this.db
        .collection(this.GIFT_REDEMPTIONS_COLLECTION)
        .doc(redemptionId)
        .set(redemption);

      // Update user's gift history
      await this.updateUserGiftHistory(userId, {
        type: 'received',
        giftCodeId: giftCode.giftCodeId,
        fromUserEmail: giftCode.purchaserEmail,
        giftMessage: giftCode.message,
        tier: giftCode.subscriptionTier,
        redeemedAt: now,
        expiresAt: subscriptionExpiresAt,
      });

      // Update purchaser's gift history
      await this.updateUserGiftHistory(giftCode.purchaserId, {
        type: 'sent',
        giftCodeId: giftCode.giftCodeId,
        toUserEmail: userEmail,
        sentAt: giftCode.purchaseDate,
        status: 'redeemed',
        redeemedAt: now,
      });

      console.log(
        `[SubscriptionGiftingService] Gift code redeemed successfully. Code: ${code}, User: ${userId}`
      );

      return {
        success: true,
        message: 'Gift subscription activated successfully!',
        giftCodeId: giftCode.giftCodeId,
        subscriptionActivated: {
          tier: giftCode.subscriptionTier,
          expiresAt: subscriptionExpiresAt,
          durationMonths: giftCode.giftDurationMonths,
        },
      };
    } catch (error) {
      console.error('[SubscriptionGiftingService] Redemption error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error redeeming gift code',
      };
    }
  }

  /**
   * Get gift code status
   */
  async getGiftCodeStatus(code: string): Promise<GiftCode | null> {
    try {
      const normalizedCode = code.toUpperCase().trim();
      const snapshot = await this.db
        .collection(this.GIFT_CODES_COLLECTION)
        .where('redeemCode', '==', normalizedCode)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as GiftCode;
    } catch (error) {
      console.error('[SubscriptionGiftingService] Error getting code status:', error);
      return null;
    }
  }

  /**
   * Get user's gift history
   */
  async getUserGiftHistory(userId: string): Promise<UserGiftHistory> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('giftHistory')
        .doc('summary')
        .get();

      if (!snapshot.exists) {
        return {
          userId,
          giftsReceived: [],
          giftsSent: [],
        };
      }

      return snapshot.data() as UserGiftHistory;
    } catch (error) {
      console.error('[SubscriptionGiftingService] Error getting gift history:', error);
      return {
        userId,
        giftsReceived: [],
        giftsSent: [],
      };
    }
  }

  /**
   * Cancel a gift code
   */
  async cancelGiftCode(giftCodeId: string): Promise<boolean> {
    try {
      await this.db
        .collection(this.GIFT_CODES_COLLECTION)
        .doc(giftCodeId)
        .update({
          status: 'cancelled',
          updatedAt: Date.now(),
        });

      console.log('[SubscriptionGiftingService] Gift code cancelled:', giftCodeId);
      return true;
    } catch (error) {
      console.error('[SubscriptionGiftingService] Error cancelling code:', error);
      return false;
    }
  }

  /**
   * Extend gift code expiration
   */
  async extendGiftExpiration(giftCodeId: string, additionalDays: number): Promise<boolean> {
    try {
      const giftRef = this.db.collection(this.GIFT_CODES_COLLECTION).doc(giftCodeId);
      const snapshot = await giftRef.get();

      if (!snapshot.exists) {
        return false;
      }

      const giftCode = snapshot.data() as GiftCode;
      const newExpiresAt = giftCode.expiresAt + additionalDays * 24 * 60 * 60 * 1000;

      await giftRef.update({
        expiresAt: newExpiresAt,
        expirationDays: giftCode.expirationDays + additionalDays,
      });

      console.log('[SubscriptionGiftingService] Gift code expiration extended:', giftCodeId);
      return true;
    } catch (error) {
      console.error('[SubscriptionGiftingService] Error extending expiration:', error);
      return false;
    }
  }

  /**
   * Private helper: Generate unique ID
   */
  private generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Private helper: Generate redeem code
   * Format: GIFT-{8 CHARS}-{4 CHARS}
   */
  private generateRedeemCode(): string {
    const segment1 = this.generateRandomString(8).toUpperCase();
    const segment2 = this.generateRandomString(4).toUpperCase();
    return `GIFT-${segment1}-${segment2}`;
  }

  /**
   * Private helper: Generate random alphanumeric string
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Private helper: Update user gift history
   */
  private async updateUserGiftHistory(
    userId: string,
    entry: {
      type: 'received' | 'sent';
      giftCodeId: string;
      fromUserEmail?: string;
      toUserEmail?: string;
      giftMessage?: string;
      tier?: string;
      redeemedAt?: number;
      sentAt?: number;
      expiresAt?: number;
      status?: string;
    }
  ): Promise<void> {
    try {
      const historyRef = this.db
        .collection('users')
        .doc(userId)
        .collection('giftHistory')
        .doc('summary');

      await this.db.runTransaction(async (transaction) => {
        const historyDoc = await transaction.get(historyRef);
        let history = historyDoc.exists
          ? (historyDoc.data() as UserGiftHistory)
          : { userId, giftsReceived: [], giftsSent: [] };

        if (entry.type === 'received') {
          history.giftsReceived.push({
            giftCodeId: entry.giftCodeId,
            fromUserEmail: entry.fromUserEmail,
            giftMessage: entry.giftMessage,
            tier: entry.tier || 'basic',
            redeemedAt: entry.redeemedAt || Date.now(),
            expiresAt: entry.expiresAt || Date.now(),
          });
        } else {
          history.giftsSent.push({
            giftCodeId: entry.giftCodeId,
            toUserEmail: entry.toUserEmail,
            sentAt: entry.sentAt || Date.now(),
            status: entry.status || 'pending',
            redeemedAt: entry.redeemedAt,
          });
        }

        transaction.set(historyRef, history);
      });
    } catch (error) {
      console.error('[SubscriptionGiftingService] Error updating gift history:', error);
    }
  }
}

// Export singleton instance
export const subscriptionGiftingService = new SubscriptionGiftingServiceClass();
