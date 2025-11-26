/**
 * Validation Service
 * Phase 10D.10: Data Validation
 *
 * Validates content data:
 * - Reading validation
 * - Schema validation
 * - Content integrity
 * - Batch validation
 * - Error reporting
 *
 * Features:
 * - Complete data validation
 * - Schema compliance
 * - Integrity checking
 * - Error collection
 * - Validation reporting
 */

import { ContentReading } from './ContentDatabaseService';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  type: 'required' | 'format' | 'range' | 'type' | 'custom';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  timestamp: number;
}

export interface BatchValidationResult {
  totalItems: number;
  validItems: number;
  invalidItems: number;
  results: ValidationResult[];
  summary: {
    errorCount: number;
    warningCount: number;
    successRate: number; // percentage
  };
}

export interface IntegrityCheckResult {
  isIntegrity: boolean;
  missingIds: string[];
  orphanedFavorites: string[];
  invalidReferences: string[];
  corruptedData: string[];
  issues: string[];
}

class ValidationService {
  private isInitialized = false;
  private validationRules: Map<string, any> = new Map();

  /**
   * Initialize validation service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        console.log('[ValidationService] Already initialized');
        return;
      }

      // Setup validation rules
      this.setupValidationRules();

      this.isInitialized = true;
      console.log('[ValidationService] Initialized');
    } catch (error) {
      console.error('[ValidationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Validate a single reading
   */
  async validateReading(reading: any): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Check required fields
      if (!reading.id) {
        errors.push({
          field: 'id',
          message: 'Reading ID is required',
          type: 'required',
        });
      }

      if (!reading.date) {
        errors.push({
          field: 'date',
          message: 'Date is required',
          type: 'required',
        });
      } else if (!this.isValidDate(reading.date)) {
        errors.push({
          field: 'date',
          message: 'Date must be in YYYY-MM-DD format',
          value: reading.date,
          type: 'format',
        });
      }

      if (!reading.title) {
        errors.push({
          field: 'title',
          message: 'Title is required',
          type: 'required',
        });
      } else if (reading.title.length < 3) {
        errors.push({
          field: 'title',
          message: 'Title must be at least 3 characters',
          value: reading.title,
          type: 'range',
        });
      }

      if (!reading.content) {
        errors.push({
          field: 'content',
          message: 'Content is required',
          type: 'required',
        });
      }

      // Validate type
      const validTypes = ['gospel', 'first-reading', 'psalm', 'second-reading', 'responsorial'];
      if (reading.type && !validTypes.includes(reading.type)) {
        errors.push({
          field: 'type',
          message: `Type must be one of: ${validTypes.join(', ')}`,
          value: reading.type,
          type: 'type',
        });
      }

      // Validate difficulty
      if (reading.difficulty !== undefined) {
        if (typeof reading.difficulty !== 'number' || reading.difficulty < 1 || reading.difficulty > 5) {
          errors.push({
            field: 'difficulty',
            message: 'Difficulty must be a number between 1 and 5',
            value: reading.difficulty,
            type: 'range',
          });
        }
      }

      // Validate language
      if (reading.language && reading.language.length !== 2) {
        warnings.push({
          field: 'language',
          message: 'Language should be a 2-letter code (e.g., "en", "es")',
          value: reading.language,
          type: 'format',
        });
      }

      // Validate word count
      if (reading.wordCount !== undefined) {
        if (typeof reading.wordCount !== 'number' || reading.wordCount < 0) {
          errors.push({
            field: 'wordCount',
            message: 'Word count must be a non-negative number',
            value: reading.wordCount,
            type: 'type',
          });
        }
      }

      // Validate timestamps
      if (reading.createdAt !== undefined && typeof reading.createdAt !== 'number') {
        errors.push({
          field: 'createdAt',
          message: 'Created timestamp must be a number',
          value: reading.createdAt,
          type: 'type',
        });
      }

      if (reading.updatedAt !== undefined && typeof reading.updatedAt !== 'number') {
        errors.push({
          field: 'updatedAt',
          message: 'Updated timestamp must be a number',
          value: reading.updatedAt,
          type: 'type',
        });
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        timestamp: Date.now(),
      };

      if (!result.isValid) {
        console.log('[ValidationService] Validation failed for reading:', reading.id);
      }

      return result;
    } catch (error) {
      console.error('[ValidationService] Validation error:', error);
      throw error;
    }
  }

  /**
   * Validate batch of readings
   */
  async validateBatch(readings: any[]): Promise<BatchValidationResult> {
    try {
      const results: ValidationResult[] = [];
      let validCount = 0;
      let invalidCount = 0;
      let errorTotal = 0;
      let warningTotal = 0;

      for (const reading of readings) {
        const result = await this.validateReading(reading);
        results.push(result);

        if (result.isValid) {
          validCount++;
        } else {
          invalidCount++;
        }

        errorTotal += result.errors.length;
        warningTotal += result.warnings.length;
      }

      const successRate =
        readings.length > 0 ? Math.round((validCount / readings.length) * 100) : 0;

      const batchResult: BatchValidationResult = {
        totalItems: readings.length,
        validItems: validCount,
        invalidItems: invalidCount,
        results,
        summary: {
          errorCount: errorTotal,
          warningCount: warningTotal,
          successRate,
        },
      };

      console.log('[ValidationService] Batch validation complete:', {
        total: readings.length,
        valid: validCount,
        invalid: invalidCount,
      });

      return batchResult;
    } catch (error) {
      console.error('[ValidationService] Batch validation failed:', error);
      throw error;
    }
  }

  /**
   * Check data integrity
   */
  async checkIntegrity(readings: ContentReading[], favorites?: string[]): Promise<IntegrityCheckResult> {
    try {
      const missingIds: string[] = [];
      const orphanedFavorites: string[] = [];
      const invalidReferences: string[] = [];
      const corruptedData: string[] = [];
      const issues: string[] = [];

      // Check for missing IDs
      const readingIds = new Set(readings.map((r) => r.id));
      readings.forEach((reading) => {
        if (!reading.id) {
          missingIds.push('Unknown');
        }
      });

      // Check for orphaned favorites
      if (favorites) {
        favorites.forEach((favId) => {
          if (!readingIds.has(favId)) {
            orphanedFavorites.push(favId);
          }
        });
      }

      // Check for invalid references
      readings.forEach((reading) => {
        if (reading.reference && reading.reference.length === 0) {
          invalidReferences.push(reading.id);
        }
      });

      // Check for corrupted data
      readings.forEach((reading) => {
        try {
          if (!reading.date || !reading.title || !reading.content) {
            corruptedData.push(reading.id);
          }
        } catch (error) {
          corruptedData.push(reading.id);
        }
      });

      // Compile issues
      if (missingIds.length > 0) {
        issues.push(`${missingIds.length} readings missing IDs`);
      }
      if (orphanedFavorites.length > 0) {
        issues.push(`${orphanedFavorites.length} orphaned favorite references`);
      }
      if (invalidReferences.length > 0) {
        issues.push(`${invalidReferences.length} invalid references`);
      }
      if (corruptedData.length > 0) {
        issues.push(`${corruptedData.length} corrupted records`);
      }

      const isIntegrity = issues.length === 0;

      const result: IntegrityCheckResult = {
        isIntegrity,
        missingIds,
        orphanedFavorites,
        invalidReferences,
        corruptedData,
        issues,
      };

      console.log('[ValidationService] Integrity check complete:', {
        isIntegrity,
        issues: issues.length,
      });

      return result;
    } catch (error) {
      console.error('[ValidationService] Integrity check failed:', error);
      throw error;
    }
  }

  /**
   * Validate reading schema
   */
  async validateSchema(reading: any): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Check all required properties exist
      const requiredFields = ['id', 'date', 'title', 'content', 'type', 'reference'];
      requiredFields.forEach((field) => {
        if (!(field in reading)) {
          warnings.push({
            field,
            message: `Field "${field}" is missing from schema`,
            type: 'required',
          });
        }
      });

      // Check property types
      if (typeof reading.id !== 'string') {
        errors.push({
          field: 'id',
          message: 'id must be a string',
          type: 'type',
        });
      }

      if (typeof reading.date !== 'string') {
        errors.push({
          field: 'date',
          message: 'date must be a string',
          type: 'type',
        });
      }

      if (typeof reading.title !== 'string') {
        errors.push({
          field: 'title',
          message: 'title must be a string',
          type: 'type',
        });
      }

      if (typeof reading.content !== 'string') {
        errors.push({
          field: 'content',
          message: 'content must be a string',
          type: 'type',
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ValidationService] Schema validation failed:', error);
      throw error;
    }
  }

  /**
   * Get validation rules
   */
  getValidationRules(): Record<string, any> {
    return Object.fromEntries(this.validationRules);
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    try {
      this.validationRules.clear();
      this.isInitialized = false;
      console.log('[ValidationService] Shutdown complete');
    } catch (error) {
      console.error('[ValidationService] Shutdown error:', error);
      throw error;
    }
  }

  // ============ Private Methods ============

  /**
   * Setup validation rules
   */
  private setupValidationRules(): void {
    try {
      this.validationRules.set('reading', {
        id: { required: true, type: 'string' },
        date: { required: true, type: 'string', format: 'YYYY-MM-DD' },
        title: { required: true, type: 'string', minLength: 3 },
        content: { required: true, type: 'string' },
        type: {
          type: 'string',
          enum: ['gospel', 'first-reading', 'psalm', 'second-reading', 'responsorial'],
        },
        reference: { type: 'string' },
        difficulty: { type: 'number', min: 1, max: 5 },
        language: { type: 'string', pattern: '^[a-z]{2}$' },
        wordCount: { type: 'number', min: 0 },
        isFavorite: { type: 'boolean' },
        createdAt: { type: 'number' },
        updatedAt: { type: 'number' },
      });

      console.log('[ValidationService] Validation rules setup complete');
    } catch (error) {
      console.error('[ValidationService] Failed to setup rules:', error);
    }
  }

  /**
   * Check if date is valid YYYY-MM-DD format
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    try {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    } catch {
      return false;
    }
  }
}

// Export singleton
export const validationService = new ValidationService();
