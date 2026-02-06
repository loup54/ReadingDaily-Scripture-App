/**
 * Reading data validator and checksum calculator (TypeScript)
 */

import * as crypto from 'crypto';

interface Reading {
  reference: string;
  citation: string;
  text: string;
  title: string;
  audioUrl?: string | null;
  response?: string; // Only for psalms
}

interface LiturgicalDate {
  season: string;
  dayOfWeek: string;
  feastDay?: string | null;
  liturgicalTitle?: string;
  color?: string;
}

interface ReadingData {
  date: string;
  liturgicalDate: LiturgicalDate;
  firstReading: Reading | null;
  psalm?: Reading | null;
  secondReading?: Reading | null;
  gospel: Reading | null;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate reading data structure and content
 */
export function validateReading(reading: any): ValidationResult {
  const errors: string[] = [];

  // Check required top-level fields
  const requiredFields = ['date', 'liturgicalDate', 'firstReading', 'gospel', 'metadata'];
  for (const field of requiredFields) {
    if (!(field in reading)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate date format
  if ('date' in reading) {
    try {
      const dateStr = reading.date;
      if (typeof dateStr !== 'string' || dateStr.length !== 10) {
        errors.push('Invalid date format (expected YYYY-MM-DD)');
      }
    } catch {
      errors.push('Invalid date value');
    }
  }

  // Validate first reading
  if ('firstReading' in reading && reading.firstReading) {
    errors.push(...validateReadingSection(reading.firstReading, 'First Reading'));
  }

  // Validate gospel (required)
  if ('gospel' in reading && reading.gospel) {
    errors.push(...validateReadingSection(reading.gospel, 'Gospel'));
  } else {
    errors.push('Gospel reading is required but missing');
  }

  // Validate psalm
  if ('psalm' in reading && reading.psalm) {
    errors.push(...validatePsalmSection(reading.psalm));
  }

  // Validate second reading (optional - only on Sundays/Solemnities)
  if ('secondReading' in reading && reading.secondReading) {
    errors.push(...validateReadingSection(reading.secondReading, 'Second Reading'));
  }

  // Validate liturgical date
  if ('liturgicalDate' in reading) {
    const liturgical = reading.liturgicalDate;
    if (typeof liturgical !== 'object' || liturgical === null) {
      errors.push('liturgicalDate must be an object');
    } else {
      if (!('season' in liturgical)) {
        errors.push('liturgicalDate missing season');
      }
      if (!('dayOfWeek' in liturgical)) {
        errors.push('liturgicalDate missing dayOfWeek');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a reading section (first, second, gospel)
 */
function validateReadingSection(section: any, name: string): string[] {
  const errors: string[] = [];

  const requiredFields = ['reference', 'citation', 'text', 'title'];
  for (const field of requiredFields) {
    if (!(field in section)) {
      errors.push(`${name}: Missing field '${field}'`);
    } else if (!section[field]) {
      errors.push(`${name}: Field '${field}' is empty`);
    }
  }

  // Validate text length (should have substantial content)
  if ('text' in section) {
    const text = section.text;
    if (text && text.length < 50) {
      errors.push(`${name}: Text too short (${text.length} chars)`);
    }
  }

  return errors;
}

/**
 * Validate psalm section (has additional 'response' field)
 */
function validatePsalmSection(section: any): string[] {
  const errors = validateReadingSection(section, 'Psalm');

  // Psalm should have response
  if (!('response' in section)) {
    errors.push("Psalm: Missing 'response' field");
  } else if (!section.response) {
    errors.push('Psalm: Response is empty');
  }

  return errors;
}

/**
 * Calculate MD5 checksum of reading content
 * Used for cache validation and data integrity
 */
export function calculateChecksum(reading: ReadingData): string {
  try {
    // Create deterministic JSON representation
    // Only include content fields, not metadata
    const content = {
      date: reading.date,
      firstReading: reading.firstReading,
      psalm: reading.psalm,
      secondReading: reading.secondReading,
      gospel: reading.gospel,
    };

    // Convert to sorted JSON string
    const jsonStr = JSON.stringify(content, Object.keys(content).sort());

    // Calculate MD5 hash
    const hash = crypto.createHash('md5');
    hash.update(jsonStr, 'utf8');
    return hash.digest('hex');

  } catch (error) {
    // Fallback to simple hash if JSON serialization fails
    const hash = crypto.createHash('md5');
    hash.update(String(reading), 'utf8');
    return hash.digest('hex');
  }
}

/**
 * Verify reading data against expected checksum
 */
export function verifyChecksum(reading: ReadingData, expectedChecksum: string): boolean {
  const actualChecksum = calculateChecksum(reading);
  return actualChecksum === expectedChecksum;
}
