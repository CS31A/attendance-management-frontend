/**
 * QR Code Utility Functions
 *
 * Helper functions for QR code attendance management, including
 * time calculations, formatting, and validation.
 *
 * @module utils/qrcode
 */

/**
 * Calculate remaining seconds until expiration
 *
 * @param {string|Date} expiresAt - Expiration timestamp
 * @returns {number} Seconds remaining (0 if expired)
 */
export function calculateRemainingTime(expiresAt) {
  if (!expiresAt)
    return 0

  const now = new Date()
  const expiration = new Date(expiresAt)
  const diff = expiration.getTime() - now.getTime()

  return Math.max(0, Math.floor(diff / 1000))
}

/**
 * Format seconds into MM:SS string
 *
 * @param {number|string|Date} input - Seconds or expiration date
 * @returns {string} Formatted time (e.g., "05:30")
 */
export function formatCountdown(input) {
  let seconds

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
export function isQrExpired(expiresAt) {
  return calculateRemainingTime(expiresAt) <= 0
}

/**
 * Format scan timestamp to human-readable time
 *
 * @param {string|Date} timestamp - Scan timestamp
 * @returns {string} Formatted string (e.g., "10:30 AM")
 */
export function formatScanTime(timestamp) {
  if (!timestamp)
    return '-'

  return new Date(timestamp).toLocaleTimeString([], {
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
export function formatDate(date) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default {
  calculateRemainingTime,
  formatCountdown,
  isQrExpired,
  formatScanTime,
  formatDate,
}
