import type { SessionResponseDto } from '@/api/sessions'

/**
 * Convert Date to local date key (YYYY-MM-DD format)
 *
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse session date string to local date key
 *
 * Handles various date formats and returns YYYY-MM-DD format.
 * Returns null if the date cannot be parsed.
 *
 * @param {string | undefined} sessionDate - Session date string
 * @returns {string | null} Formatted date string or null
 */
export function getSessionDateKey(sessionDate: string | undefined): string | null {
  if (!sessionDate) {
    return null
  }

  const normalizedSessionDate = sessionDate.trim()
  if (!normalizedSessionDate) {
    return null
  }

  // Keep exact YYYY-MM-DD values as-is to avoid UTC parsing shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedSessionDate)) {
    return normalizedSessionDate
  }

  // Parse datetime strings and convert to a local date key for comparisons.
  const parsed = new Date(normalizedSessionDate)
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalDateKey(parsed)
  }

  // Backward compatibility for legacy strings that begin with YYYY-MM-DD.
  const legacyDatePrefix = normalizedSessionDate.match(/^(\d{4}-\d{2}-\d{2})/)
  return legacyDatePrefix?.[1] ?? null
}

/**
 * Check whether a session is scheduled for the current local date
 *
 * @param {SessionResponseDto} session - Session object
 * @param {Date} [now] - Date override for deterministic tests
 * @returns {boolean} Whether the session date matches today's date
 */
export function isSessionScheduledForToday(
  session: SessionResponseDto,
  now: Date = new Date(),
): boolean {
  const sessionDateKey = getSessionDateKey(session.sessionDate)
  if (!sessionDateKey) {
    return false
  }

  return sessionDateKey === toLocalDateKey(now)
}
