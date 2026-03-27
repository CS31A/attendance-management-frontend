/**
 * QR Code Utility Functions
 *
 * Helper functions for QR code attendance management, including
 * time calculations, formatting, and validation.
 *
 * @module utils/qrcode
 */

/**
 * Parse a date string as UTC if it doesn't have timezone information
 *
 * @param {string|Date} dateString - Date string from backend
 * @returns {Date} Date object
 */
export function parseUtcDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString)
    return null

  // If already a Date object, return it
  if (dateString instanceof Date)
    return dateString

  // If the date string doesn't end with 'Z' or have timezone offset (+/-)
  // treat it as UTC by appending 'Z'
  if (!/Z|[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(`${dateString}Z`)
  }

  return new Date(dateString)
}

/**
 * Calculate remaining seconds until expiration
 *
 * @param {string|Date} expiresAt - Expiration timestamp
 * @returns {number} Seconds remaining (0 if expired)
 */
export function calculateRemainingTime(expiresAt: string | Date | null | undefined): number {
  if (!expiresAt)
    return 0

  const now = new Date()
  const expiration = parseUtcDate(expiresAt)
  if (!expiration)
    return 0

  const diff = expiration.getTime() - now.getTime()

  return Math.max(0, Math.floor(diff / 1000))
}

/**
 * Format seconds into MM:SS string
 *
 * @param {number|string|Date} input - Seconds or expiration date
 * @returns {string} Formatted time (e.g., "05:30")
 */
export function formatCountdown(input: number | string | Date | null | undefined): string {
  let seconds: number

  // If input is a date/string (expiresAt), calculate remaining seconds
  if (typeof input === 'string' || input instanceof Date) {
    seconds = calculateRemainingTime(input)
  }
  else {
    seconds = Number(input) || 0
  }

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Check if QR code is expired
 *
 * @param {string|Date} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired
 */
export function isQrExpired(expiresAt: string | Date | null | undefined): boolean {
  return calculateRemainingTime(expiresAt) <= 0
}

/**
 * Format scan timestamp to human-readable time
 *
 * @param {string|Date} timestamp - Scan timestamp
 * @returns {string} Formatted string (e.g., "10:30 AM")
 */
export function formatScanTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp)
    return '-'

  const parsed = parseUtcDate(timestamp)
  if (!parsed)
    return '-'

  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format date to readable string
 *
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "Mar 15, 2024")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date)
    return '-'

  const parsed = parseUtcDate(date)
  if (!parsed)
    return '-'

  return parsed.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default {
  parseUtcDate,
  calculateRemainingTime,
  formatCountdown,
  isQrExpired,
  formatScanTime,
  formatDate,
}
