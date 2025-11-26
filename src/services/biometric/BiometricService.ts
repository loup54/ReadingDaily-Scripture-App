/**
 * Biometric Authentication Service
 *
 * Handles Face ID / Fingerprint authentication for returning users
 * Provides quick re-login without password entry
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCredentials {
  userId: string;
  email: string;
  deviceId: string;
}

export interface BiometricAvailable {
  isBiometricAvailable: boolean;
  biometricTypes: ('fingerprint' | 'faceRecognition' | 'iris')[];
  isDeviceSecure: boolean;
}

class BiometricServiceClass {
  private readonly BIOMETRIC_STORAGE_KEY = 'biometric_credentials';
  private readonly DEVICE_ID_KEY = 'device_id';

  /**
   * Check if biometric authentication is available on device
   */
  async isBiometricAvailable(): Promise<BiometricAvailable> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricTypes: ('fingerprint' | 'faceRecognition' | 'iris')[] = [];

      // Map LocalAuthentication types to our types
      // types include 1 (fingerprint), 2 (face), 3 (iris)
      if (types & 1) biometricTypes.push('fingerprint');
      if (types & 2) biometricTypes.push('faceRecognition');
      if (types & 3) biometricTypes.push('iris');

      // Device is considered secure if it has compatible hardware and enrolled biometrics
      const isDeviceSecure = compatible && enrolled;

      return {
        isBiometricAvailable: compatible && enrolled,
        biometricTypes,
        isDeviceSecure,
      };
    } catch (error) {
      console.error('[BiometricService] Error checking biometric availability:', error);
      return {
        isBiometricAvailable: false,
        biometricTypes: [],
        isDeviceSecure: false,
      };
    }
  }

  /**
   * Save biometric credentials securely
   * Should only be called after successful authentication
   */
  async saveBiometricCredentials(
    userId: string,
    email: string,
    deviceId: string
  ): Promise<boolean> {
    try {
      const credentials: BiometricCredentials = {
        userId,
        email,
        deviceId,
      };

      await SecureStore.setItemAsync(
        this.BIOMETRIC_STORAGE_KEY,
        JSON.stringify(credentials)
      );

      console.log('[BiometricService] Biometric credentials saved securely');
      return true;
    } catch (error) {
      console.error('[BiometricService] Error saving biometric credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve saved biometric credentials
   */
  async getBiometricCredentials(): Promise<BiometricCredentials | null> {
    try {
      const stored = await SecureStore.getItemAsync(this.BIOMETRIC_STORAGE_KEY);
      if (!stored) return null;

      const credentials: BiometricCredentials = JSON.parse(stored);
      return credentials;
    } catch (error) {
      console.error('[BiometricService] Error retrieving biometric credentials:', error);
      return null;
    }
  }

  /**
   * Clear biometric credentials (on logout)
   */
  async clearBiometricCredentials(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_STORAGE_KEY);
      console.log('[BiometricService] Biometric credentials cleared');
      return true;
    } catch (error) {
      console.error('[BiometricService] Error clearing biometric credentials:', error);
      return false;
    }
  }

  /**
   * Authenticate user with biometric
   * Shows platform-appropriate dialog (Face ID on iPhone, fingerprint on Android, etc)
   */
  async authenticate(): Promise<boolean> {
    try {
      const available = await this.isBiometricAvailable();
      if (!available.isBiometricAvailable) {
        console.log('[BiometricService] Biometric authentication not available');
        return false;
      }

      const authenticated = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false, // Allow PIN/password as fallback
        reason: 'Authenticate to access your account',
        fallbackLabel: 'Use passcode', // iOS fallback label
        requireConfirmation: true, // Require user confirmation
      });

      console.log('[BiometricService] Biometric authentication result:', authenticated.success);
      return authenticated.success;
    } catch (error) {
      console.error('[BiometricService] Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Check if biometric credentials exist for this device
   */
  async hasSavedCredentials(): Promise<boolean> {
    const credentials = await this.getBiometricCredentials();
    return credentials !== null;
  }

  /**
   * Get user email from saved credentials (for display purposes)
   */
  async getSavedUserEmail(): Promise<string | null> {
    const credentials = await this.getBiometricCredentials();
    return credentials?.email || null;
  }
}

// Export singleton instance
export const BiometricService = new BiometricServiceClass();
