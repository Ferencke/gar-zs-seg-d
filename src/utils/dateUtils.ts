/**
 * Date utility functions to prevent timezone-related issues.
 * Always use local date components instead of toISOString() which converts to UTC.
 */

/**
 * Format a Date object to YYYY-MM-DD string using local timezone
 */
export function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to Date object using local timezone
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getTodayDateString(): string {
  return formatDateToLocal(new Date());
}

/**
 * Compare if a date string matches a given Date object (in local timezone)
 */
export function dateStringMatchesDate(dateStr: string, date: Date): boolean {
  return dateStr === formatDateToLocal(date);
}
