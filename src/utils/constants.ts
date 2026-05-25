/**
 * User Role Constants
 * Matches the roles defined in the backend
 */
export const ROLES = {
  ADMIN: 'Admin',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Student',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const SESSION_STATUSES = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
} as const

export type SessionStatus = (typeof SESSION_STATUSES)[keyof typeof SESSION_STATUSES]
/**
 * Locale Constants
 * Standardized locale and formatting options for date/time display
 */
export const LOCALE = {
  DEFAULT: 'en-US',
  TIME_FORMAT: {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  },
  TIME_FORMAT_SHORT: {
    hour: '2-digit',
    minute: '2-digit',
  },
  DATE_FORMAT: {
    weekday: 'long',
  },
  DATE_FORMAT_SHORT: {
    weekday: 'short',
  },
  DATE_FORMAT_MONTH: {
    month: 'short',
  },
} as const
