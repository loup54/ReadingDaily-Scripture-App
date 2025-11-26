/**
 * Custom Hook: useFraudDetection
 *
 * Provides fraud detection functionality for components
 * Integrates device fingerprinting and email abuse prevention
 */

import { useState, useCallback, useEffect } from 'react';
import { fraudDetectionService } from '@/services/fraud/FraudDetectionService';
import { generateDeviceFingerprint } from '@/utils/device-fingerprint';
import { DeviceFingerprint } from '@/types/trial.types';

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number;
  reason?: string;
  blockedUntil?: number;
}

export interface UseFraudDetectionState {
  // State
  isChecking: boolean;
  lastCheckResult: FraudCheckResult | null;
  isBlocked: boolean;
  blockReason?: string;

  // Methods
  checkFraudRisk: (email: string) => Promise<FraudCheckResult>;
  recordSignup: (email: string) => Promise<void>;
  clearBlockedStatus: () => void;
}

export function useFraudDetection(): UseFraudDetectionState {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<FraudCheckResult | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string>();
  const [deviceFingerprint, setDeviceFingerprint] = useState<DeviceFingerprint | null>(null);

  // Initialize device fingerprint on mount
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fingerprint = await generateDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
      } catch (error) {
        console.error('[useFraudDetection] Failed to generate fingerprint:', error);
      }
    };

    initFingerprint();
  }, []);

  const checkFraudRisk = useCallback(
    async (email: string): Promise<FraudCheckResult> => {
      if (!deviceFingerprint) {
        console.warn('[useFraudDetection] Device fingerprint not initialized');
        return { isFraudulent: false, riskScore: 0 };
      }

      setIsChecking(true);
      try {
        const result = await fraudDetectionService.checkFraudRisk(email, deviceFingerprint);

        setLastCheckResult(result);

        if (result.isFraudulent) {
          setIsBlocked(true);
          setBlockReason(result.reason);
        } else {
          setIsBlocked(false);
          setBlockReason(undefined);
        }

        console.log('[useFraudDetection] Fraud check result:', {
          email,
          isFraudulent: result.isFraudulent,
          riskScore: result.riskScore,
          reason: result.reason,
        });

        return result;
      } catch (error) {
        console.error('[useFraudDetection] Error checking fraud risk:', error);
        return { isFraudulent: false, riskScore: 0 };
      } finally {
        setIsChecking(false);
      }
    },
    [deviceFingerprint]
  );

  const recordSignup = useCallback(
    async (email: string): Promise<void> => {
      if (!deviceFingerprint) {
        console.warn('[useFraudDetection] Device fingerprint not initialized');
        return;
      }

      try {
        await fraudDetectionService.recordSignup(email, deviceFingerprint);
        console.log('[useFraudDetection] Signup recorded for:', email);
      } catch (error) {
        console.error('[useFraudDetection] Error recording signup:', error);
      }
    },
    [deviceFingerprint]
  );

  const clearBlockedStatus = useCallback(() => {
    setIsBlocked(false);
    setBlockReason(undefined);
    setLastCheckResult(null);
  }, []);

  return {
    isChecking,
    lastCheckResult,
    isBlocked,
    blockReason,
    checkFraudRisk,
    recordSignup,
    clearBlockedStatus,
  };
}
