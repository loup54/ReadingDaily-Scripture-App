/**
 * Trial System Types
 *
 * Manages 10-minute trial period with device fingerprinting
 * for abuse prevention.
 */

export interface DeviceFingerprint {
  deviceId: string; // expo-device Device.osInternalBuildId
  deviceName?: string; // expo-device Device.deviceName
  osName: string; // expo-device Device.osName
  osVersion: string; // expo-device Device.osVersion
  modelName?: string; // expo-device Device.modelName
  brand?: string; // expo-device Device.brand
  networkType?: string; // expo-network Network.NetworkStateType
  ipAddress?: string; // For server-side validation
  timezone: string; // User's timezone
}

export interface TrialState {
  // Trial status
  isActive: boolean;
  hasExpired: boolean;
  hasPurchased: boolean;

  // Timing
  startTime: number | null; // Unix timestamp (ms)
  endTime: number | null; // Unix timestamp (ms)
  remainingMinutes: number;

  // Device tracking
  deviceFingerprint: DeviceFingerprint | null;
  firstLaunchTime: number | null; // Unix timestamp (ms)

  // Trial metadata
  trialDurationMinutes: number; // From ENV.TRIAL_DURATION_MINUTES (now 7 days = 10080 minutes)
}

export interface TrialStore extends TrialState {
  // Actions
  initializeTrial: () => Promise<void>;
  startTrial: () => Promise<void>;
  checkTrialStatus: () => Promise<void>;
  restorePurchase: () => Promise<boolean>;

  // Device fingerprinting
  generateFingerprint: () => Promise<DeviceFingerprint>;
  validateFingerprint: (fingerprint: DeviceFingerprint) => Promise<boolean>;

  // Helpers
  getRemainingTime: () => number; // Returns remaining milliseconds
  getFormattedTimeRemaining: () => string; // e.g., "5 min 30 sec"
}

/**
 * Trial validation result from server
 */
export interface TrialValidationResult {
  isValid: boolean;
  reason?: string;
  suspiciousActivity?: boolean;
  blockedReason?: 'fingerprint_mismatch' | 'time_manipulation' | 'multiple_devices' | 'banned';
}

/**
 * Purchase result
 */
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  receiptToken?: string;
  error?: string;
}
