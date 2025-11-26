import {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePasswordMatch,
  validateRequired,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', () => {
      const result = validatePassword('Test1234');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password less than 8 characters', () => {
      const result = validatePassword('Test12');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('test1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('TEST1234');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePassword('TestTest');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });
  });

  describe('validateFullName', () => {
    it('should validate correct full name', () => {
      const result = validateFullName('John Doe');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty name', () => {
      const result = validateFullName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Full name is required');
    });

    it('should reject name less than 2 characters', () => {
      const result = validateFullName('J');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Full name must be at least 2 characters');
    });
  });

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      const result = validatePasswordMatch('Test1234', 'Test1234');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-matching passwords', () => {
      const result = validatePasswordMatch('Test1234', 'Different1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Passwords do not match');
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty value', () => {
      const result = validateRequired('value', 'Field');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty value', () => {
      const result = validateRequired('', 'Field');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field is required');
    });
  });
});