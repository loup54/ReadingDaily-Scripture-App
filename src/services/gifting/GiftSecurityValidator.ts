/**
 * Gift Security Validator
 * Implements security checks and fraud prevention for gift codes
 */

import * as admin from 'firebase-admin';

export interface SecurityValidationResult {
  isValid: boolean;
  violations: SecurityViolation[];
  riskScore: number; // 0-100, higher = more risky
  shouldBlock: boolean;
  reason?: string;
}

export interface SecurityViolation {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

/**
 * Security validation constants
 */
export const SECURITY_LIMITS = {
  MAX_REDEMPTION_ATTEMPTS_PER_HOUR: 10,
  MAX_REDEMPTION_ATTEMPTS_PER_IP_PER_HOUR: 5,
  MAX_REDEMPTION_ATTEMPTS_PER_USER_PER_DAY: 20,
  SUSPICIOUS_PATTERN_THRESHOLD: 3, // Multiple codes in short time
  TIME_WINDOW_MINUTES: 60,
  IP_BLOCK_THRESHOLD: 10, // Failed attempts to block IP
  RATE_LIMIT_THRESHOLD: 5, // Requests per minute per user
};

/**
 * Main security validator class
 */
export class GiftSecurityValidator {
  private db = admin.firestore();
  private readonly REDEMPTION_ATTEMPTS_COLLECTION = 'redemptionAttempts';
  private readonly SECURITY_FLAGS_COLLECTION = 'securityFlags';

  /**
   * Comprehensive security validation for redemption attempt
   */
  async validateRedemptionAttempt(
    userId: string,
    giftCode: string,
    ipAddress: string,
    deviceId: string
  ): Promise<SecurityValidationResult> {
    const violations: SecurityViolation[] = [];
    let riskScore = 0;

    // Check 1: Rate limiting (per user)
    const userRateCheck = await this.checkUserRateLimit(userId);
    if (!userRateCheck.allowed) {
      violations.push({
        code: 'RATE_LIMIT_EXCEEDED',
        severity: 'high',
        message: `Too many redemption attempts. Please wait before trying again.`,
      });
      riskScore += 30;
    }

    // Check 2: IP-based rate limiting
    const ipRateCheck = await this.checkIPRateLimit(ipAddress);
    if (!ipRateCheck.allowed) {
      violations.push({
        code: 'IP_RATE_LIMIT_EXCEEDED',
        severity: 'high',
        message: 'Too many attempts from this IP address',
      });
      riskScore += 25;
    }

    // Check 3: Device fingerprinting (same device redeeming multiple codes)
    const deviceCheck = await this.checkDeviceSuspiciousActivity(deviceId);
    if (deviceCheck.suspicious) {
      violations.push({
        code: 'SUSPICIOUS_DEVICE_ACTIVITY',
        severity: 'medium',
        message: `Device has attempted ${deviceCheck.attemptCount} redemptions in the last hour`,
      });
      riskScore += 20;
    }

    // Check 4: User redemption history
    const userHistoryCheck = await this.checkUserRedemptionHistory(userId);
    if (userHistoryCheck.suspicious) {
      violations.push({
        code: 'SUSPICIOUS_USER_PATTERN',
        severity: 'medium',
        message: `User has redeemed ${userHistoryCheck.recentCount} codes recently`,
      });
      riskScore += 15;
    }

    // Check 5: IP geolocation (if flagged as high-risk country/VPN)
    // This would typically integrate with a GeoIP service
    const geoCheck = await this.checkIPReputation(ipAddress);
    if (geoCheck.highRisk) {
      violations.push({
        code: 'HIGH_RISK_IP_LOCATION',
        severity: 'low',
        message: 'Redemption from a high-risk region',
      });
      riskScore += 10;
    }

    // Check 6: Account age verification
    const accountAgeCheck = await this.checkAccountAge(userId);
    if (accountAgeCheck.veryNew) {
      violations.push({
        code: 'NEW_ACCOUNT_REDEMPTION',
        severity: 'low',
        message: `Account is only ${accountAgeCheck.ageHours} hours old`,
      });
      riskScore += 5;
    }

    // Check 7: Simultaneous multi-account redemption (same IP, multiple accounts)
    const multiAccountCheck = await this.checkMultiAccountActivity(ipAddress);
    if (multiAccountCheck.suspicious) {
      violations.push({
        code: 'MULTI_ACCOUNT_ACTIVITY',
        severity: 'high',
        message: `${multiAccountCheck.accountCount} different accounts redeeming from this IP`,
      });
      riskScore += 35;
    }

    // Check 8: Code validity checks
    const codeCheck = await this.validateCodeStructure(giftCode);
    if (!codeCheck.valid) {
      violations.push({
        code: 'INVALID_CODE_FORMAT',
        severity: 'high',
        message: 'Gift code format is invalid',
      });
      riskScore += 40;
    }

    // Determine if we should block
    const shouldBlock = riskScore >= 60 || violations.some((v) => v.severity === 'high' && riskScore > 50);

    // Log attempt for audit trail
    await this.logRedemptionAttempt(userId, giftCode, ipAddress, deviceId, {
      violations,
      riskScore,
      blocked: shouldBlock,
    });

    return {
      isValid: violations.length === 0,
      violations,
      riskScore,
      shouldBlock,
      reason:
        violations.length > 0
          ? violations
              .filter((v) => v.severity === 'high')
              .map((v) => v.message)
              .join('; ')
          : undefined,
    };
  }

  /**
   * Check user rate limiting (max attempts per hour)
   */
  private async checkUserRateLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
    const oneHourAgo = Date.now() - SECURITY_LIMITS.TIME_WINDOW_MINUTES * 60 * 1000;

    try {
      const snapshot = await this.db
        .collection(this.REDEMPTION_ATTEMPTS_COLLECTION)
        .where('userId', '==', userId)
        .where('timestamp', '>', oneHourAgo)
        .where('status', '==', 'attempted')
        .get();

      const count = snapshot.size;
      return {
        allowed: count < SECURITY_LIMITS.MAX_REDEMPTION_ATTEMPTS_PER_HOUR,
        count,
      };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking user rate limit:', error);
      // On error, allow attempt (fail open)
      return { allowed: true, count: 0 };
    }
  }

  /**
   * Check IP-based rate limiting
   */
  private async checkIPRateLimit(ipAddress: string): Promise<{ allowed: boolean; count: number }> {
    if (!ipAddress || ipAddress === 'unknown') {
      // Can't rate limit without IP, allow but log
      return { allowed: true, count: 0 };
    }

    const oneHourAgo = Date.now() - SECURITY_LIMITS.TIME_WINDOW_MINUTES * 60 * 1000;

    try {
      const snapshot = await this.db
        .collection(this.REDEMPTION_ATTEMPTS_COLLECTION)
        .where('ipAddress', '==', ipAddress)
        .where('timestamp', '>', oneHourAgo)
        .where('status', '==', 'attempted')
        .get();

      const count = snapshot.size;
      const allowed = count < SECURITY_LIMITS.MAX_REDEMPTION_ATTEMPTS_PER_IP_PER_HOUR;

      if (!allowed && count > SECURITY_LIMITS.IP_BLOCK_THRESHOLD) {
        // Flag IP as blocked
        await this.flagIPAddress(ipAddress, 'blocked', 'Excessive redemption attempts');
      }

      return { allowed, count };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking IP rate limit:', error);
      return { allowed: true, count: 0 };
    }
  }

  /**
   * Check device for suspicious activity
   */
  private async checkDeviceSuspiciousActivity(
    deviceId: string
  ): Promise<{ suspicious: boolean; attemptCount: number }> {
    if (!deviceId || deviceId === 'unknown') {
      return { suspicious: false, attemptCount: 0 };
    }

    const oneHourAgo = Date.now() - SECURITY_LIMITS.TIME_WINDOW_MINUTES * 60 * 1000;

    try {
      const snapshot = await this.db
        .collection(this.REDEMPTION_ATTEMPTS_COLLECTION)
        .where('deviceId', '==', deviceId)
        .where('timestamp', '>', oneHourAgo)
        .where('status', '==', 'successful')
        .get();

      const count = snapshot.size;
      return {
        suspicious: count > SECURITY_LIMITS.SUSPICIOUS_PATTERN_THRESHOLD,
        attemptCount: count,
      };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking device activity:', error);
      return { suspicious: false, attemptCount: 0 };
    }
  }

  /**
   * Check user's redemption history
   */
  private async checkUserRedemptionHistory(
    userId: string
  ): Promise<{ suspicious: boolean; recentCount: number }> {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    try {
      const snapshot = await this.db
        .collection(this.REDEMPTION_ATTEMPTS_COLLECTION)
        .where('userId', '==', userId)
        .where('timestamp', '>', oneDayAgo)
        .where('status', '==', 'successful')
        .get();

      const count = snapshot.size;
      // Flag if user is redeeming many codes in a short time (possible reseller)
      return {
        suspicious: count > 5,
        recentCount: count,
      };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking user history:', error);
      return { suspicious: false, recentCount: 0 };
    }
  }

  /**
   * Check IP reputation (VPN, proxy, high-risk countries)
   * This would typically call an external GeoIP service
   */
  private async checkIPReputation(ipAddress: string): Promise<{ highRisk: boolean }> {
    // In production, integrate with MaxMind, IP2Proxy, or similar service
    // For now, check against local flagged list
    try {
      const doc = await this.db.collection(this.SECURITY_FLAGS_COLLECTION).doc(ipAddress).get();

      if (doc.exists) {
        const data = doc.data();
        return { highRisk: data?.highRisk === true };
      }

      return { highRisk: false };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking IP reputation:', error);
      return { highRisk: false };
    }
  }

  /**
   * Check account age
   */
  private async checkAccountAge(userId: string): Promise<{ veryNew: boolean; ageHours: number }> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return { veryNew: true, ageHours: 0 };
      }

      const createdAt = userDoc.data()?.createdAt?.toMillis?.() || userDoc.data()?.createdAt;
      if (!createdAt) {
        return { veryNew: false, ageHours: 999 };
      }

      const ageMs = Date.now() - createdAt;
      const ageHours = Math.floor(ageMs / (60 * 60 * 1000));

      // Flag if account is less than 24 hours old
      return { veryNew: ageHours < 24, ageHours };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking account age:', error);
      return { veryNew: false, ageHours: 999 };
    }
  }

  /**
   * Check for multi-account abuse (same IP, multiple accounts)
   */
  private async checkMultiAccountActivity(
    ipAddress: string
  ): Promise<{ suspicious: boolean; accountCount: number }> {
    if (!ipAddress || ipAddress === 'unknown') {
      return { suspicious: false, accountCount: 0 };
    }

    const oneHourAgo = Date.now() - SECURITY_LIMITS.TIME_WINDOW_MINUTES * 60 * 1000;

    try {
      const snapshot = await this.db
        .collection(this.REDEMPTION_ATTEMPTS_COLLECTION)
        .where('ipAddress', '==', ipAddress)
        .where('timestamp', '>', oneHourAgo)
        .get();

      const userIds = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId) {
          userIds.add(data.userId);
        }
      });

      const accountCount = userIds.size;
      return {
        suspicious: accountCount > 2, // Flag if 3+ accounts from same IP
        accountCount,
      };
    } catch (error) {
      console.error('[GiftSecurityValidator] Error checking multi-account activity:', error);
      return { suspicious: false, accountCount: 0 };
    }
  }

  /**
   * Validate code structure
   */
  private async validateCodeStructure(code: string): Promise<{ valid: boolean }> {
    // Format should be: GIFT-{8 alphanumeric}-{4 alphanumeric}
    const codeRegex = /^GIFT-[A-Z0-9]{8}-[A-Z0-9]{4}$/i;
    return {
      valid: codeRegex.test(code.trim().toUpperCase()),
    };
  }

  /**
   * Flag an IP address for suspicious activity
   */
  private async flagIPAddress(
    ipAddress: string,
    flag: 'watch' | 'blocked' | 'cleared',
    reason: string
  ): Promise<void> {
    try {
      await this.db.collection(this.SECURITY_FLAGS_COLLECTION).doc(ipAddress).set(
        {
          flag,
          reason,
          flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
          highRisk: flag === 'blocked',
        },
        { merge: true }
      );

      console.log(`[GiftSecurityValidator] Flagged IP ${ipAddress} as ${flag}: ${reason}`);
    } catch (error) {
      console.error('[GiftSecurityValidator] Error flagging IP:', error);
    }
  }

  /**
   * Log redemption attempt for audit trail
   */
  private async logRedemptionAttempt(
    userId: string,
    giftCode: string,
    ipAddress: string,
    deviceId: string,
    securityData: { violations: SecurityViolation[]; riskScore: number; blocked: boolean }
  ): Promise<void> {
    try {
      const attemptId = `${userId}-${Date.now()}`;

      await this.db
        .collection(this.REDEMPTION_ATTEMPTS_COLLECTION)
        .doc(attemptId)
        .set(
          {
            userId,
            giftCode: giftCode.substring(0, 6) + '***', // Store partial code
            ipAddress,
            deviceId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: securityData.blocked ? 'blocked' : 'attempted',
            riskScore: securityData.riskScore,
            violations: securityData.violations,
            userAgent: 'mobile-app',
          },
          { merge: false }
        );
    } catch (error) {
      console.error('[GiftSecurityValidator] Error logging attempt:', error);
    }
  }
}

/**
 * Export singleton instance
 */
export const giftSecurityValidator = new GiftSecurityValidator();
