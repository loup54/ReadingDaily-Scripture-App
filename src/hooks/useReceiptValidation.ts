/**
 * Custom Hook: useReceiptValidation
 *
 * Provides receipt validation functionality for subscription components
 * Handles both Apple App Store and Google Play Store receipts
 */

import { useState, useCallback, useEffect } from 'react';
import { clientReceiptService, ReceiptValidationResponse } from '@/services/receipt/ClientReceiptService';
import { Platform } from 'react-native';

export interface UseReceiptValidationState {
  // State
  isValidating: boolean;
  lastValidationResult: ReceiptValidationResponse | null;
  isSubscriptionActive: boolean;
  subscriptionExpiryDate: Date | null;
  validationError: string | null;

  // Methods
  validateReceipt: () => Promise<ReceiptValidationResponse | null>;
  refreshReceipt: () => Promise<boolean>;
  clearValidationState: () => void;
}

export function useReceiptValidation(): UseReceiptValidationState {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<ReceiptValidationResponse | null>(
    null
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Validate receipt based on platform
   */
  const validateReceipt = useCallback(async (): Promise<ReceiptValidationResponse | null> => {
    setIsValidating(true);
    setValidationError(null);

    try {
      let result: ReceiptValidationResponse | null = null;

      if (Platform.OS === 'ios') {
        // Get and validate Apple receipt
        const receipt = await clientReceiptService.getAppleReceipt();
        if (!receipt) {
          throw new Error('Unable to retrieve receipt from App Store');
        }

        result = await clientReceiptService.validateAppleReceipt(receipt);
      } else if (Platform.OS === 'android') {
        // Get and validate Google Play receipt
        // This would require Google Play Billing Library integration
        console.warn('[useReceiptValidation] Google Play validation not yet implemented');
        throw new Error('Google Play receipt validation not yet implemented');
      } else {
        throw new Error(`Unsupported platform: ${Platform.OS}`);
      }

      setLastValidationResult(result);

      if (!result.isValid) {
        setValidationError(result.reason || 'Receipt validation failed');
      }

      console.log('[useReceiptValidation] Validation result:', {
        isValid: result.isValid,
        subscriptionId: result.subscriptionId,
        expiryDate: result.expiryDate,
        platform: Platform.OS,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      setValidationError(errorMessage);
      console.error('[useReceiptValidation] Error validating receipt:', error);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Refresh receipt (typically called after subscription purchase/renewal)
   */
  const refreshReceipt = useCallback(async (): Promise<boolean> => {
    try {
      const success = await clientReceiptService.refreshReceipt();

      if (success) {
        // Validate the refreshed receipt
        await validateReceipt();
      }

      return success;
    } catch (error) {
      console.error('[useReceiptValidation] Error refreshing receipt:', error);
      return false;
    }
  }, [validateReceipt]);

  /**
   * Clear validation state
   */
  const clearValidationState = useCallback(() => {
    setLastValidationResult(null);
    setValidationError(null);
    setIsValidating(false);
  }, []);

  /**
   * Check if subscription is currently active
   */
  const isSubscriptionActive = lastValidationResult?.isValid ?? false;

  /**
   * Get subscription expiry date
   */
  const subscriptionExpiryDate = lastValidationResult?.expiryDate
    ? new Date(lastValidationResult.expiryDate)
    : null;

  return {
    isValidating,
    lastValidationResult,
    isSubscriptionActive,
    subscriptionExpiryDate,
    validationError,
    validateReceipt,
    refreshReceipt,
    clearValidationState,
  };
}
