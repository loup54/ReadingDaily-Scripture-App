/**
 * Custom Hook: useBiometricAuth
 *
 * Provides biometric authentication functionality for components
 * Handles available state, authentication, and credential management
 */

import { useState, useEffect, useCallback } from 'react';
import { BiometricService, BiometricAvailable, BiometricCredentials } from '@/services/biometric/BiometricService';

export interface UseBiometricAuthState {
  // Device capabilities
  isAvailable: boolean;
  biometricTypes: ('fingerprint' | 'faceRecognition' | 'iris')[];
  isDeviceSecure: boolean;

  // User credentials
  hasSavedCredentials: boolean;
  savedUserEmail: string | null;

  // Authentication state
  isAuthenticating: boolean;
  authenticationError: string | null;
  authenticationSuccess: boolean;

  // Methods
  authenticate: () => Promise<boolean>;
  saveBiometricCredentials: (userId: string, email: string, deviceId: string) => Promise<boolean>;
  clearBiometricCredentials: () => Promise<boolean>;
  reset: () => void;
}

export function useBiometricAuth(): UseBiometricAuthState {
  // Device capability state
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<('fingerprint' | 'faceRecognition' | 'iris')[]>([]);
  const [isDeviceSecure, setIsDeviceSecure] = useState(false);

  // User credential state
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [savedUserEmail, setSavedUserEmail] = useState<string | null>(null);

  // Authentication state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticationError, setAuthenticationError] = useState<string | null>(null);
  const [authenticationSuccess, setAuthenticationSuccess] = useState(false);

  // Check biometric availability and saved credentials on mount
  useEffect(() => {
    checkBiometricAvailability();
    checkSavedCredentials();
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const available = await BiometricService.isBiometricAvailable();
      setIsAvailable(available.isBiometricAvailable);
      setBiometricTypes(available.biometricTypes);
      setIsDeviceSecure(available.isDeviceSecure);
      console.log('[useBiometricAuth] Device biometric capability:', available);
    } catch (error) {
      console.error('[useBiometricAuth] Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  }, []);

  const checkSavedCredentials = useCallback(async () => {
    try {
      const hasSaved = await BiometricService.hasSavedCredentials();
      setHasSavedCredentials(hasSaved);

      if (hasSaved) {
        const email = await BiometricService.getSavedUserEmail();
        setSavedUserEmail(email);
        console.log('[useBiometricAuth] Found saved credentials for:', email);
      }
    } catch (error) {
      console.error('[useBiometricAuth] Error checking saved credentials:', error);
      setHasSavedCredentials(false);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthenticationError(null);
    setAuthenticationSuccess(false);

    try {
      console.log('[useBiometricAuth] Starting biometric authentication...');
      const success = await BiometricService.authenticate();

      if (success) {
        setAuthenticationSuccess(true);
        console.log('[useBiometricAuth] Biometric authentication successful');
      } else {
        setAuthenticationError('Biometric authentication failed');
        console.log('[useBiometricAuth] Biometric authentication failed');
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthenticationError(errorMessage);
      console.error('[useBiometricAuth] Authentication error:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const saveBiometricCredentials = useCallback(
    async (userId: string, email: string, deviceId: string): Promise<boolean> => {
      try {
        const success = await BiometricService.saveBiometricCredentials(userId, email, deviceId);
        if (success) {
          setHasSavedCredentials(true);
          setSavedUserEmail(email);
          console.log('[useBiometricAuth] Credentials saved successfully');
        }
        return success;
      } catch (error) {
        console.error('[useBiometricAuth] Error saving credentials:', error);
        return false;
      }
    },
    []
  );

  const clearBiometricCredentials = useCallback(async (): Promise<boolean> => {
    try {
      const success = await BiometricService.clearBiometricCredentials();
      if (success) {
        setHasSavedCredentials(false);
        setSavedUserEmail(null);
        console.log('[useBiometricAuth] Credentials cleared successfully');
      }
      return success;
    } catch (error) {
      console.error('[useBiometricAuth] Error clearing credentials:', error);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setAuthenticationError(null);
    setAuthenticationSuccess(false);
  }, []);

  return {
    // Device capabilities
    isAvailable,
    biometricTypes,
    isDeviceSecure,

    // User credentials
    hasSavedCredentials,
    savedUserEmail,

    // Authentication state
    isAuthenticating,
    authenticationError,
    authenticationSuccess,

    // Methods
    authenticate,
    saveBiometricCredentials,
    clearBiometricCredentials,
    reset,
  };
}
