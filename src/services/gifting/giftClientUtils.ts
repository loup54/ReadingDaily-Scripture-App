/**
 * Gift Client Utilities
 * Client-side only utilities for gift code handling (no firebase-admin)
 * Safe to import in React Native/Expo components
 */

/**
 * Validate gift code format before submission
 * Format: GIFT-{8 alphanumeric}-{4 alphanumeric}
 * Example: GIFT-ABC12345-XYZ7
 *
 * @param code - The code to validate
 * @returns true if code format is valid
 */
export function isValidGiftCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const giftCodeRegex = /^GIFT-[A-Z0-9]{8}-[A-Z0-9]{4}$/i;
  return giftCodeRegex.test(code.trim().toUpperCase());
}

/**
 * Format gift code to standard format (uppercase, hyphens)
 * Input: "giftabc12345xyz7" or "GIFT-ABC12345-XYZ7" or "GIFTABC12345XYZ7"
 * Output: "GIFT-ABC12345-XYZ7"
 *
 * @param code - The code to format
 * @returns Formatted code or empty string if invalid
 */
export function formatGiftCode(code: string): string {
  if (!code) return '';

  // Remove all spaces and special chars except alphanumeric
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Should be 16 characters total (4 + 8 + 4 = 16 without hyphens)
  if (cleaned.length !== 16) {
    return '';
  }

  // Extract the three segments: GIFT + 8 chars + 4 chars
  const segment1 = cleaned.substring(0, 4); // Should be "GIFT"
  const segment2 = cleaned.substring(4, 12); // 8 chars
  const segment3 = cleaned.substring(12, 16); // 4 chars

  if (segment1 !== 'GIFT') {
    return '';
  }

  return `${segment1}-${segment2}-${segment3}`;
}

/**
 * Error messages for common redemption failures
 */
export const GiftRedemptionErrors = {
  GIFT_NOT_FOUND: 'Gift code not found. Please check and try again.',
  GIFT_ALREADY_REDEEMED: 'This gift code has already been redeemed.',
  GIFT_EXPIRED: 'This gift code has expired.',
  GIFT_CANCELLED: 'This gift code has been cancelled.',
  INVALID_FORMAT: 'Please enter a valid gift code in format: GIFT-XXXXXXXX-XXXX',
  AUTHENTICATION_REQUIRED: 'Please sign in to redeem a gift code.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;
