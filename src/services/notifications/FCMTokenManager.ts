/**
 * FCM Token Manager
 * Phase 10B.7: Firebase Cloud Messaging Setup
 *
 * Manages FCM token persistence, refresh, and validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestore } from '@/services/firebase/config';
import { Platform } from 'react-native';

/**
 * Token data structure
 */
export interface FCMTokenData {
  token: string;
  userId: string;
  platform: string;
  savedAt: number;
  expiresAt: number;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * FCM Token Manager
 * Handles token lifecycle including persistence, refresh, and validation
 */
export class FCMTokenManager {
  private static instance: FCMTokenManager;
  private readonly STORAGE_KEY = '@fcm_token';
  private readonly FIRESTORE_COLLECTION = 'users';
  private readonly FIRESTORE_FCM_DOC = 'fcm';
  private readonly TOKEN_EXPIRY_BUFFER = 60 * 60 * 1000; // 1 hour before actual expiry
  private tokenCache: FCMTokenData | null = null;

  /**
   * Get singleton instance
   */
  static getInstance(): FCMTokenManager {
    if (!FCMTokenManager.instance) {
      FCMTokenManager.instance = new FCMTokenManager();
    }
    return FCMTokenManager.instance;
  }

  /**
   * Save token locally and to Firestore
   */
  async saveToken(token: string, userId: string, expiresIn?: number): Promise<void> {
    try {
      const tokenData: FCMTokenData = {
        token,
        userId,
        platform: Platform.OS,
        savedAt: new Date().getTime(),
        expiresAt: new Date().getTime() + (expiresIn || 24 * 60 * 60 * 1000), // Default 24 hours
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
      this.tokenCache = tokenData;

      // Save to Firestore
      await this.saveTokenToFirestore(userId, tokenData);

      console.log('[FCMTokenManager] Token saved successfully');
    } catch (error) {
      console.error('[FCMTokenManager] Failed to save token:', error);
      throw error;
    }
  }

  /**
   * Get cached token
   */
  async getToken(userId?: string): Promise<string | null> {
    try {
      // Return from cache if available
      if (this.tokenCache && (!userId || this.tokenCache.userId === userId)) {
        const validation = this.validateToken(this.tokenCache);
        if (validation.isValid) {
          return this.tokenCache.token;
        }
      }

      // Try to load from AsyncStorage
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const tokenData = JSON.parse(stored) as FCMTokenData;
        const validation = this.validateToken(tokenData);

        if (validation.isValid && (!userId || tokenData.userId === userId)) {
          this.tokenCache = tokenData;
          return tokenData.token;
        }
      }

      return null;
    } catch (error) {
      console.error('[FCMTokenManager] Failed to get token:', error);
      return null;
    }
  }

  /**
   * Get all token data
   */
  async getTokenData(userId?: string): Promise<FCMTokenData | null> {
    try {
      // Return from cache if valid
      if (this.tokenCache && (!userId || this.tokenCache.userId === userId)) {
        const validation = this.validateToken(this.tokenCache);
        if (validation.isValid) {
          return this.tokenCache;
        }
      }

      // Load from AsyncStorage
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const tokenData = JSON.parse(stored) as FCMTokenData;
        const validation = this.validateToken(tokenData);

        if (validation.isValid && (!userId || tokenData.userId === userId)) {
          this.tokenCache = tokenData;
          return tokenData;
        }
      }

      return null;
    } catch (error) {
      console.error('[FCMTokenManager] Failed to get token data:', error);
      return null;
    }
  }

  /**
   * Validate token (check expiry and format)
   */
  private validateToken(tokenData: FCMTokenData): TokenValidationResult {
    if (!tokenData.token) {
      return { isValid: false, reason: 'Token is empty' };
    }

    if (tokenData.token.length < 100) {
      return { isValid: false, reason: 'Token is too short' };
    }

    const now = new Date().getTime();
    const expiryWithBuffer = tokenData.expiresAt - this.TOKEN_EXPIRY_BUFFER;

    if (now > expiryWithBuffer) {
      return { isValid: false, reason: 'Token has expired' };
    }

    return { isValid: true };
  }

  /**
   * Check if token needs refresh
   */
  isTokenExpired(userId?: string): boolean {
    if (!this.tokenCache || (userId && this.tokenCache.userId !== userId)) {
      return true;
    }

    const validation = this.validateToken(this.tokenCache);
    return !validation.isValid;
  }

  /**
   * Clear cached token
   */
  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.tokenCache = null;
      console.log('[FCMTokenManager] Token cleared');
    } catch (error) {
      console.error('[FCMTokenManager] Failed to clear token:', error);
      throw error;
    }
  }

  /**
   * Save token to Firestore
   */
  private async saveTokenToFirestore(userId: string, tokenData: FCMTokenData): Promise<void> {
    try {
      await firestore
        .collection(this.FIRESTORE_COLLECTION)
        .doc(userId)
        .collection(this.FIRESTORE_FCM_DOC)
        .doc('token')
        .set(
          {
            token: tokenData.token,
            platform: tokenData.platform,
            savedAt: tokenData.savedAt,
            expiresAt: tokenData.expiresAt,
            lastRefreshed: new Date().getTime(),
          },
          { merge: true }
        );

      console.log('[FCMTokenManager] Token saved to Firestore');
    } catch (error) {
      console.error('[FCMTokenManager] Failed to save token to Firestore:', error);
      // Don't throw - local save was successful
    }
  }

  /**
   * Get token from Firestore (for sync across devices)
   */
  async getTokenFromFirestore(userId: string): Promise<FCMTokenData | null> {
    try {
      const doc = await firestore
        .collection(this.FIRESTORE_COLLECTION)
        .doc(userId)
        .collection(this.FIRESTORE_FCM_DOC)
        .doc('token')
        .get();

      if (doc.exists) {
        const data = doc.data() as any;
        return {
          token: data.token,
          userId,
          platform: data.platform,
          savedAt: data.savedAt,
          expiresAt: data.expiresAt,
        };
      }

      return null;
    } catch (error) {
      console.error('[FCMTokenManager] Failed to get token from Firestore:', error);
      return null;
    }
  }

  /**
   * Delete token from Firestore (for logout)
   */
  async deleteTokenFromFirestore(userId: string): Promise<void> {
    try {
      await firestore
        .collection(this.FIRESTORE_COLLECTION)
        .doc(userId)
        .collection(this.FIRESTORE_FCM_DOC)
        .doc('token')
        .delete();

      console.log('[FCMTokenManager] Token deleted from Firestore');
    } catch (error) {
      console.error('[FCMTokenManager] Failed to delete token from Firestore:', error);
      // Don't throw - continue with local deletion
    }
  }

  /**
   * Refresh token validity (bump expiry)
   */
  async refreshTokenValidity(userId: string, expiresIn: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const tokenData = await this.getTokenData(userId);
      if (tokenData) {
        await this.saveToken(tokenData.token, userId, expiresIn);
        console.log('[FCMTokenManager] Token validity refreshed');
      }
    } catch (error) {
      console.error('[FCMTokenManager] Failed to refresh token validity:', error);
      throw error;
    }
  }

  /**
   * Get token info for debugging
   */
  async getTokenInfo(): Promise<string> {
    try {
      const tokenData = this.tokenCache;
      if (!tokenData) {
        return 'No token cached';
      }

      const now = new Date().getTime();
      const remaining = tokenData.expiresAt - now;
      const remainingHours = Math.floor(remaining / (60 * 60 * 1000));

      return `Token: ${tokenData.token.substring(0, 20)}...
Platform: ${tokenData.platform}
Saved: ${new Date(tokenData.savedAt).toLocaleString()}
Expires In: ${remainingHours} hours
User: ${tokenData.userId}`;
    } catch (error) {
      return `Error getting token info: ${error}`;
    }
  }
}

/**
 * Export singleton instance
 */
export const fcmTokenManager = FCMTokenManager.getInstance();
