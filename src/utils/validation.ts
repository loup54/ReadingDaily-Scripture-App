/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
};

export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName || fullName.trim() === '') {
    return { isValid: false, error: 'Full name is required' };
  }

  if (fullName.trim().length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters' };
  }

  return { isValid: true };
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
};

// Sanitize display name — strips HTML tags, control characters, trims whitespace
export const sanitizeDisplayName = (name: string): string => {
  return name
    .replace(/<[^>]*>/g, '')         // strip HTML tags
    .replace(/[<>"'&]/g, '')         // strip dangerous characters
    .replace(/[\x00-\x1F\x7F]/g, '') // strip control characters
    .trim()
    .slice(0, 50);                   // enforce max length
};

export const validateDisplayName = (name: string): ValidationResult => {
  const sanitized = sanitizeDisplayName(name);
  if (!sanitized) {
    return { isValid: false, error: 'Name is required' };
  }
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  return { isValid: true };
};

// Sanitize gift message — strips HTML, limits length
export const sanitizeGiftMessage = (message: string): string => {
  return message
    .replace(/<[^>]*>/g, '')         // strip HTML tags
    .replace(/[<>"'&]/g, '')         // strip dangerous characters
    .replace(/[\x00-\x1F\x7F]/g, '') // strip control characters
    .trim()
    .slice(0, 300);                  // enforce max length
};

export const validateGiftMessage = (message: string): ValidationResult => {
  if (message.length > 300) {
    return { isValid: false, error: 'Message must be 300 characters or less' };
  }
  return { isValid: true };
};