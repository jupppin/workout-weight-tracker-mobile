/**
 * Database Utility Functions
 *
 * Provides helper functions for database operations including
 * UUID generation and date formatting.
 */

/**
 * Generates a UUID v4 string.
 * Uses crypto API if available, falls back to Math.random.
 */
export function generateUUID(): string {
  // Try to use crypto.randomUUID if available (React Native Hermes supports this)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the current timestamp in ISO 8601 format for SQLite storage.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Formats a date string for display purposes.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date string with time for display purposes.
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Returns a relative time string (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatDate(dateString);
  }
}

/**
 * Converts weight between lbs and kg.
 */
export function convertWeight(
  weight: number,
  from: 'lbs' | 'kg',
  to: 'lbs' | 'kg'
): number {
  if (from === to) return weight;

  if (from === 'lbs' && to === 'kg') {
    return Math.round(weight * 0.453592 * 10) / 10;
  } else {
    return Math.round(weight * 2.20462 * 10) / 10;
  }
}

/**
 * Escapes special characters for SQLite LIKE queries.
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}

/**
 * Validates that a string is a valid UUID format.
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
