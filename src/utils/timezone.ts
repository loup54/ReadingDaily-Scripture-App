/**
 * Timezone Utilities
 *
 * Strategy: Store all dates in UTC, convert to user's local timezone for display
 * This ensures consistency across devices and timezones.
 */

/**
 * Get the user's current timezone
 * @returns IANA timezone string (e.g., "America/New_York")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get the user's timezone offset in minutes
 * @returns Offset in minutes (e.g., -300 for EST)
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Convert a local date to UTC timestamp
 * @param date - Local date
 * @returns UTC timestamp in milliseconds
 */
export function toUTC(date: Date): number {
  return date.getTime();
}

/**
 * Convert UTC timestamp to local date
 * @param timestamp - UTC timestamp in milliseconds
 * @returns Local Date object
 */
export function fromUTC(timestamp: number): Date {
  return new Date(timestamp);
}

/**
 * Get start of day in UTC for a given local date
 * @param date - Local date (optional, defaults to today)
 * @returns UTC timestamp for start of day (00:00:00.000)
 */
export function getStartOfDayUTC(date: Date = new Date()): number {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  return localDate.getTime();
}

/**
 * Get end of day in UTC for a given local date
 * @param date - Local date (optional, defaults to today)
 * @returns UTC timestamp for end of day (23:59:59.999)
 */
export function getEndOfDayUTC(date: Date = new Date()): number {
  const localDate = new Date(date);
  localDate.setHours(23, 59, 59, 999);
  return localDate.getTime();
}

/**
 * Format a date for display in the user's local timezone
 * @param date - Date to format
 * @param format - Format style ('short', 'medium', 'long', 'full')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: format,
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format a date with custom pattern
 * @param date - Date to format
 * @param pattern - Pattern ('YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY')
 * @returns Formatted date string
 */
export function formatDatePattern(
  date: Date,
  pattern: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' = 'YYYY-MM-DD'
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (pattern) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get date ID for Firestore document (YYYY-MM-DD format)
 * Always uses the user's local date for consistency
 * @param date - Date (optional, defaults to today)
 * @returns Date ID string (e.g., "2025-10-02")
 */
export function getDateId(date: Date = new Date()): string {
  return formatDatePattern(date, 'YYYY-MM-DD');
}

/**
 * Parse date ID back to Date object
 * @param dateId - Date ID string (YYYY-MM-DD)
 * @returns Date object at start of day
 */
export function parseDateId(dateId: string): Date {
  const [year, month, day] = dateId.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today in user's timezone
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return getDateId(date) === getDateId(today);
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is before today
 */
export function isPast(date: Date): boolean {
  const today = new Date();
  return getStartOfDayUTC(date) < getStartOfDayUTC(today);
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns True if date is after today
 */
export function isFuture(date: Date): boolean {
  const today = new Date();
  return getStartOfDayUTC(date) > getStartOfDayUTC(today);
}

/**
 * Get relative date string (e.g., "Today", "Tomorrow", "Yesterday")
 * @param date - Date to format
 * @returns Relative date string
 */
export function getRelativeDateString(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateId(date) === getDateId(tomorrow)) {
    return 'Tomorrow';
  }

  if (getDateId(date) === getDateId(yesterday)) {
    return 'Yesterday';
  }

  // Return formatted date if not today/tomorrow/yesterday
  return formatDate(date, 'medium');
}

/**
 * Add days to a date
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date object
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the number of days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days (positive if date2 > date1)
 */
export function daysBetween(date1: Date, date2: Date): number {
  const start = getStartOfDayUTC(date1);
  const end = getStartOfDayUTC(date2);
  const milliseconds = end - start;
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
}
