/**
 * Fraud Detection Service
 *
 * Prevents trial abuse by:
 * 1. Device fingerprinting - detecting when same device creates multiple accounts
 * 2. Email abuse prevention - blocking repeated signup attempts with different emails
 * 3. Time-based analysis - detecting suspicious signup patterns
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceFingerprint } from '../types/trial.types';
import {
  generateDeviceFingerprint,
  compareFingerprints,
  detectSuspiciousActivity,
  calculateSimilarity,
} from '../utils/device-fingerprint';

interface FraudRecord {
  email: string;
  deviceFingerprint: DeviceFingerprint;
  signupTime: number;
  ipAddress?: string;
}

interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  reason?: string;
  blockedUntil?: number; // Unix timestamp
}

class FraudDetectionServiceClass {
  private readonly FRAUD_RECORDS_KEY = 'fraud_records';
  private readonly MAX_SIGNUPS_PER_DEVICE = 1; // Only 1 trial signup per device
  private readonly MAX_SIGNUPS_PER_24H = 5; // Max 5 signups per 24h across all devices
  private readonly FRAUD_BLOCK_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly EMAIL_SIMILARITY_THRESHOLD = 0.8; // For catching variations like "test@gmail.com" vs "test.1@gmail.com"

  /**
   * Check if email/device combination is fraudulent
   */
  async checkFraudRisk(
    email: string,
    fingerprint: DeviceFingerprint
  ): Promise<FraudDetectionResult> {
    try {
      const records = await this.getFraudRecords();

      // Check 1: Same device trying multiple trials
      const sameDeviceSignups = records.filter((r) => compareFingerprints(r.deviceFingerprint, fingerprint));

      if (sameDeviceSignups.length >= this.MAX_SIGNUPS_PER_DEVICE) {
        return {
          isFraudulent: true,
          riskScore: 95,
          reason: 'Device has already used trial access',
          blockedUntil: Date.now() + this.FRAUD_BLOCK_DURATION_MS,
        };
      }

      // Check 2: Same email trying to signup again
      const sameEmailSignups = records.filter((r) => r.email.toLowerCase() === email.toLowerCase());

      if (sameEmailSignups.length > 0) {
        return {
          isFraudulent: true,
          riskScore: 90,
          reason: 'Email has already been used for trial signup',
          blockedUntil: sameEmailSignups[0].signupTime + this.FRAUD_BLOCK_DURATION_MS,
        };
      }

      // Check 3: Email variations (test@gmail.com, test.1@gmail.com, etc.)
      const baseEmail = this.extractBaseEmail(email);
      const similarEmails = records.filter((r) => {
        const recordBase = this.extractBaseEmail(r.email);
        return this.calculateEmailSimilarity(baseEmail, recordBase) >= this.EMAIL_SIMILARITY_THRESHOLD;
      });

      if (similarEmails.length > 0) {
        return {
          isFraudulent: true,
          riskScore: 85,
          reason: 'Email variation of previously used email detected',
        };
      }

      // Check 4: Too many signups in 24h (potential mass signup abuse)
      const last24hSignups = records.filter(
        (r) => Date.now() - r.signupTime < 24 * 60 * 60 * 1000
      );

      if (last24hSignups.length >= this.MAX_SIGNUPS_PER_24H) {
        return {
          isFraudulent: true,
          riskScore: 80,
          reason: 'Too many signup attempts in 24 hours',
        };
      }

      // Check 5: Device similarity to previous fraudulent attempts
      const riskScore = this.calculateDeviceRiskScore(fingerprint, records);

      if (riskScore > 70) {
        return {
          isFraudulent: true,
          riskScore,
          reason: 'Device similarity to suspicious accounts detected',
        };
      }

      // All checks passed
      return {
        isFraudulent: false,
        riskScore: Math.max(0, riskScore),
      };
    } catch (error) {
      console.error('[FraudDetectionService] Error checking fraud risk:', error);
      // On error, allow signup but log for investigation
      return {
        isFraudulent: false,
        riskScore: 0,
      };
    }
  }

  /**
   * Record a signup for fraud tracking
   */
  async recordSignup(email: string, fingerprint: DeviceFingerprint): Promise<void> {
    try {
      const records = await this.getFraudRecords();

      // Add new record
      const newRecord: FraudRecord = {
        email,
        deviceFingerprint: fingerprint,
        signupTime: Date.now(),
        ipAddress: fingerprint.ipAddress,
      };

      records.push(newRecord);

      // Keep only records from last 90 days (fraud statute of limitations)
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const recentRecords = records.filter((r) => r.signupTime > ninetyDaysAgo);

      await AsyncStorage.setItem(this.FRAUD_RECORDS_KEY, JSON.stringify(recentRecords));

      console.log('[FraudDetectionService] Signup recorded for:', email);
    } catch (error) {
      console.error('[FraudDetectionService] Error recording signup:', error);
    }
  }

  /**
   * Clear all fraud records (admin function, use with caution)
   */
  async clearFraudRecords(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.FRAUD_RECORDS_KEY);
      console.log('[FraudDetectionService] All fraud records cleared');
    } catch (error) {
      console.error('[FraudDetectionService] Error clearing fraud records:', error);
    }
  }

  /**
   * Get all fraud records
   */
  private async getFraudRecords(): Promise<FraudRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(this.FRAUD_RECORDS_KEY);
      if (!stored) return [];

      return JSON.parse(stored) as FraudRecord[];
    } catch (error) {
      console.error('[FraudDetectionService] Error retrieving fraud records:', error);
      return [];
    }
  }

  /**
   * Extract base email (before +) for pattern matching
   * test+alias@gmail.com -> test@gmail.com
   */
  private extractBaseEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const baseLocal = localPart.split('+')[0]; // Remove +alias
    return `${baseLocal}@${domain}`.toLowerCase();
  }

  /**
   * Calculate similarity between two emails
   * Accounts for common variations and typos
   */
  private calculateEmailSimilarity(email1: string, email2: string): number {
    if (email1 === email2) return 1;

    // Levenshtein distance for typo detection
    const distance = this.levenshteinDistance(email1, email2);
    const maxLength = Math.max(email1.length, email2.length);

    // Similarity = 1 - (distance / maxLength)
    return Math.max(0, 1 - distance / maxLength);
  }

  /**
   * Levenshtein distance for string similarity
   */
  private levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Calculate risk score based on device similarity to known fraudulent devices
   */
  private calculateDeviceRiskScore(
    fingerprint: DeviceFingerprint,
    records: FraudRecord[]
  ): number {
    if (records.length === 0) return 0;

    // Get similarity scores against all previous devices
    const similarities = records.map((r) => calculateSimilarity(r.deviceFingerprint, fingerprint));

    if (similarities.length === 0) return 0;

    // Average similarity score
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    // Convert to risk score (higher similarity = higher risk)
    // Scale from 0-100
    return Math.round(avgSimilarity);
  }
}

// Export singleton instance
export const fraudDetectionService = new FraudDetectionServiceClass();
