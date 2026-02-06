/**
 * Reading Data Validator
 * Validates scraped reading data structure and calculates checksums
 */

import * as crypto from 'crypto';

interface Reading {
  reference: string;
  citation: string;
  text: string;
  title: string;
  audioUrl: string | null;
  response?: string;
}

interface LiturgicalDate {
  season: string;
  dayOfWeek: string;
  feastDay: string | null;
  liturgicalTitle: string;
  color: string;
}

interface ReadingData {
  date: string;
  liturgicalDate: LiturgicalDate;
  firstReading: Reading | null;
  psalm: Reading | null;
  secondReading: Reading | null;
  gospel: Reading | null;
  metadata: {
    source: string;
    sourceUrl: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate reading data structure
 */
export function validateReading(reading: any): ValidationResult {
  const errors: string[] = [];

  // Check required top-level fields
  const requiredFields = ['date', 'liturgicalDate', 'firstReading', 'gospel', 'metadata'];
  for (const field of requiredFields) {
    if (!reading[field]) {
      errors.push(\`Missing required field: \${field}\`);
    }
  }

  // Validate date format (YYYY-MM-DD)
  if (reading.date && !/^\d{4}-\d{2}-\d{2}$/.test(reading.date)) {
    errors.push(\`Invalid date format: \${reading.date}\`);
  }

  // Validate liturgical date
  if (reading.liturgicalDate) {
    if (!reading.liturgicalDate.season) {
      errors.push('Missing liturgical season');
    }
    if (!reading.liturgicalDate.dayOfWeek) {
      errors.push('Missing day of week');
    }
  }

  // Validate first reading (required)
  if (reading.firstReading) {
    const readingErrors = validateReadingObject(reading.firstReading, 'First Reading');
    errors.push(...readingErrors);
  }

  // Validate gospel (required)
  if (reading.gospel) {
    const gospelErrors = validateReadingObject(reading.gospel, 'Gospel');
    errors.push(...gospelErrors);
  }

  // Validate psalm (optional)
  if (reading.psalm) {
    const psalmErrors = validateReadingObject(reading.psalm, 'Psalm');
    errors.push(...psalmErrors);
  }

  // Validate second reading (optional, only on Sundays/Solemnities)
  if (reading.secondReading) {
    const secondErrors = validateReadingObject(reading.secondReading, 'Second Reading');
    errors.push(...secondErrors);
  }

  // Validate metadata
  if (reading.metadata) {
    if (!reading.metadata.source) {
      errors.push('Missing metadata.source');
    }
    if (!reading.metadata.sourceUrl) {
      errors.push('Missing metadata.sourceUrl');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate individual reading object
 */
function validateReadingObject(reading: any, readingType: string): string[] {
  const errors: string[] = [];

  if (!reading.reference) {
    errors.push(\`\${readingType}: Missing reference\`);
  }
  if (!reading.citation) {
    errors.push(\`\${readingType}: Missing citation\`);
  }
  if (!reading.text || reading.text.trim().length === 0) {
    errors.push(\`\${readingType}: Missing or empty text\`);
  }
  if (!reading.title) {
    errors.push(\`\${readingType}: Missing title\`);
  }

  return errors;
}

/**
 * Calculate MD5 checksum for reading data (for cache validation)
 */
export function calculateChecksum(reading: ReadingData): string {
  // Create a deterministic string representation of the reading
  // Only include content fields, not metadata or timestamps
  const contentData = {
    date: reading.date,
    liturgicalDate: reading.liturgicalDate,
    firstReading: reading.firstReading ? {
      reference: reading.firstReading.reference,
      text: reading.firstReading.text,
      title: reading.firstReading.title,
    } : null,
    psalm: reading.psalm ? {
      reference: reading.psalm.reference,
      text: reading.psalm.text,
      title: reading.psalm.title,
      response: reading.psalm.response,
    } : null,
    secondReading: reading.secondReading ? {
      reference: reading.secondReading.reference,
      text: reading.secondReading.text,
      title: reading.secondReading.title,
    } : null,
    gospel: reading.gospel ? {
      reference: reading.gospel.reference,
      text: reading.gospel.text,
      title: reading.gospel.title,
    } : null,
  };

  // Convert to JSON string (with sorted keys for deterministic output)
  const jsonStr = JSON.stringify(contentData, Object.keys(contentData).sort());

  // Calculate MD5 hash
  const hash = crypto.createHash('md5');
  hash.update(jsonStr, 'utf8');
  return hash.digest('hex');
}
