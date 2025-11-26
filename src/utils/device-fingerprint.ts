/**
 * Device Fingerprinting Utility
 *
 * Generates unique device fingerprints to prevent trial abuse.
 * Uses expo-device and expo-network for hardware identification.
 */

import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { DeviceFingerprint } from '../types/trial.types';
import { getUserTimezone } from './timezone';

/**
 * Generate a device fingerprint
 * Combines multiple device identifiers to create a unique fingerprint
 * @returns DeviceFingerprint object
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  try {
    // Get device information
    const deviceId = Device.osInternalBuildId || 'unknown';
    const deviceName = Device.deviceName || undefined;
    const osName = Device.osName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    const modelName = Device.modelName || undefined;
    const brand = Device.brand || undefined;

    // Get network information
    let networkType: string | undefined;
    try {
      const networkState = await Network.getNetworkStateAsync();
      networkType = networkState.type || undefined;
    } catch (err) {
      console.warn('Failed to get network state:', err);
      networkType = undefined;
    }

    // Get IP address (for server-side validation)
    let ipAddress: string | undefined;
    try {
      ipAddress = await Network.getIpAddressAsync();
    } catch (err) {
      console.warn('Failed to get IP address:', err);
      ipAddress = undefined;
    }

    // Get timezone
    const timezone = getUserTimezone();

    return {
      deviceId,
      deviceName,
      osName,
      osVersion,
      modelName,
      brand,
      networkType,
      ipAddress,
      timezone,
    };
  } catch (error) {
    console.error('Failed to generate device fingerprint:', error);
    throw new Error('Device fingerprinting failed');
  }
}

/**
 * Generate a hash from the fingerprint for comparison
 * @param fingerprint - Device fingerprint
 * @returns Hash string
 */
export function hashFingerprint(fingerprint: DeviceFingerprint): string {
  // Combine key identifiers
  const components = [
    fingerprint.deviceId,
    fingerprint.osName,
    fingerprint.osVersion,
    fingerprint.modelName || '',
    fingerprint.brand || '',
  ];

  return components.join('|');
}

/**
 * Compare two fingerprints
 * @param fp1 - First fingerprint
 * @param fp2 - Second fingerprint
 * @returns True if fingerprints match
 */
export function compareFingerprints(
  fp1: DeviceFingerprint,
  fp2: DeviceFingerprint
): boolean {
  // Primary match: deviceId must be identical
  if (fp1.deviceId !== fp2.deviceId) {
    return false;
  }

  // Secondary match: OS and model should match
  if (fp1.osName !== fp2.osName || fp1.osVersion !== fp2.osVersion) {
    return false;
  }

  // Tertiary match: model/brand should match if available
  if (fp1.modelName && fp2.modelName && fp1.modelName !== fp2.modelName) {
    return false;
  }

  return true;
}

/**
 * Calculate similarity score between two fingerprints (0-100)
 * Used for detecting suspicious activity
 * @param fp1 - First fingerprint
 * @param fp2 - Second fingerprint
 * @returns Similarity score (0-100)
 */
export function calculateSimilarity(
  fp1: DeviceFingerprint,
  fp2: DeviceFingerprint
): number {
  let score = 0;
  let total = 0;

  // Device ID (40 points)
  total += 40;
  if (fp1.deviceId === fp2.deviceId) {
    score += 40;
  }

  // OS Name (15 points)
  total += 15;
  if (fp1.osName === fp2.osName) {
    score += 15;
  }

  // OS Version (10 points)
  total += 10;
  if (fp1.osVersion === fp2.osVersion) {
    score += 10;
  }

  // Model Name (15 points)
  total += 15;
  if (fp1.modelName && fp2.modelName && fp1.modelName === fp2.modelName) {
    score += 15;
  }

  // Brand (10 points)
  total += 10;
  if (fp1.brand && fp2.brand && fp1.brand === fp2.brand) {
    score += 10;
  }

  // Timezone (10 points)
  total += 10;
  if (fp1.timezone === fp2.timezone) {
    score += 10;
  }

  return Math.round((score / total) * 100);
}

/**
 * Detect if device fingerprint indicates suspicious activity
 * @param fingerprint - Device fingerprint to check
 * @param storedFingerprint - Previously stored fingerprint
 * @returns Object with suspicion level and reason
 */
export function detectSuspiciousActivity(
  fingerprint: DeviceFingerprint,
  storedFingerprint: DeviceFingerprint | null
): { suspicious: boolean; reason?: string; confidence: number } {
  if (!storedFingerprint) {
    return { suspicious: false, confidence: 100 };
  }

  const similarity = calculateSimilarity(fingerprint, storedFingerprint);

  // Exact match - not suspicious
  if (similarity === 100) {
    return { suspicious: false, confidence: 100 };
  }

  // Device ID changed - highly suspicious
  if (fingerprint.deviceId !== storedFingerprint.deviceId) {
    return {
      suspicious: true,
      reason: 'Device ID changed',
      confidence: 95,
    };
  }

  // OS or model changed - moderately suspicious
  if (
    fingerprint.osName !== storedFingerprint.osName ||
    fingerprint.modelName !== storedFingerprint.modelName
  ) {
    return {
      suspicious: true,
      reason: 'Device hardware changed',
      confidence: 75,
    };
  }

  // Minor changes (OS version, network, etc.) - low suspicion
  if (similarity < 80) {
    return {
      suspicious: true,
      reason: 'Multiple device properties changed',
      confidence: 50,
    };
  }

  return { suspicious: false, confidence: 100 };
}

/**
 * Validate fingerprint format
 * @param fingerprint - Fingerprint to validate
 * @returns True if fingerprint is valid
 */
export function isValidFingerprint(fingerprint: DeviceFingerprint): boolean {
  if (!fingerprint || typeof fingerprint !== 'object') {
    return false;
  }

  // Required fields
  if (!fingerprint.deviceId || fingerprint.deviceId === 'unknown') {
    return false;
  }

  if (!fingerprint.osName || fingerprint.osName === 'unknown') {
    return false;
  }

  if (!fingerprint.timezone) {
    return false;
  }

  return true;
}

/**
 * Serialize fingerprint for storage
 * @param fingerprint - Fingerprint to serialize
 * @returns JSON string
 */
export function serializeFingerprint(fingerprint: DeviceFingerprint): string {
  return JSON.stringify(fingerprint);
}

/**
 * Deserialize fingerprint from storage
 * @param serialized - JSON string
 * @returns DeviceFingerprint or null if invalid
 */
export function deserializeFingerprint(
  serialized: string
): DeviceFingerprint | null {
  try {
    const fingerprint = JSON.parse(serialized) as DeviceFingerprint;
    return isValidFingerprint(fingerprint) ? fingerprint : null;
  } catch (error) {
    console.error('Failed to deserialize fingerprint:', error);
    return null;
  }
}
