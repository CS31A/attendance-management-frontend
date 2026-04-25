import { describe, expect, it } from 'vitest'
import { getSessionDateKey, isSessionScheduledForToday, toLocalDateKey } from '@/utils/sessionDateHelpers'

describe('sessionDateHelpers', () => {
  describe('toLocalDateKey', () => {
    it('converts Date to YYYY-MM-DD format', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      expect(toLocalDateKey(date)).toBe('2024-03-15')
    })

    it('handles dates at month boundaries', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      expect(toLocalDateKey(date)).toBe('2024-01-01')
    })

    it('handles single-digit months and days with padding', () => {
      const date = new Date('2024-01-05T10:30:00Z')
      expect(toLocalDateKey(date)).toBe('2024-01-05')
    })
  })

  describe('getSessionDateKey', () => {
    it('returns null for undefined sessionDate', () => {
      expect(getSessionDateKey(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(getSessionDateKey('')).toBeNull()
    })

    it('returns null for malformed date string', () => {
      expect(getSessionDateKey('invalid-date')).toBeNull()
    })

    it('returns null for non-date string', () => {
      expect(getSessionDateKey('not-a-date')).toBeNull()
    })

    it('extracts YYYY-MM-DD from already formatted date', () => {
      expect(getSessionDateKey('2024-03-15')).toBe('2024-03-15')
    })

    it('extracts YYYY-MM-DD from ISO date string', () => {
      expect(getSessionDateKey('2024-03-15T10:30:00Z')).toBe('2024-03-15')
    })

    it('extracts YYYY-MM-DD from ISO date string with time', () => {
      expect(getSessionDateKey('2024-03-15T10:30:00.000Z')).toBe('2024-03-15')
    })

    it('handles date with only year-month-day prefix', () => {
      expect(getSessionDateKey('2024-03-15-suffix')).toBe('2024-03-15')
    })

    it('parses various date formats', () => {
      expect(getSessionDateKey('March 15, 2024')).toBe('2024-03-15')
    })

    it('handles date with timezone offset', () => {
      expect(getSessionDateKey('2024-03-15T10:30:00+08:00')).toBe('2024-03-15')
    })

    it('uses local date for UTC ISO strings near day boundaries', () => {
      const originalTz = process.env.TZ

      try {
        process.env.TZ = 'America/New_York'
        expect(getSessionDateKey('2024-03-16T01:00:00Z')).toBe('2024-03-15')
      }
      finally {
        if (originalTz === undefined) {
          delete process.env.TZ
        }
        else {
          process.env.TZ = originalTz
        }
      }
    })

    it('keeps date-only strings unchanged across timezones', () => {
      const originalTz = process.env.TZ

      try {
        process.env.TZ = 'America/New_York'
        expect(getSessionDateKey('2024-03-15')).toBe('2024-03-15')
      }
      finally {
        if (originalTz === undefined) {
          delete process.env.TZ
        }
        else {
          process.env.TZ = originalTz
        }
      }
    })
  })

  describe('isSessionScheduledForToday', () => {
    const today = new Date('2024-03-15T12:00:00Z')

    it('returns false for session with undefined sessionDate', () => {
      const session = { id: '1', status: 'not_started' as const }
      expect(isSessionScheduledForToday(session, today)).toBe(false)
    })

    it('returns false for session with empty sessionDate', () => {
      const session = { id: '1', status: 'not_started' as const, sessionDate: '' }
      expect(isSessionScheduledForToday(session, today)).toBe(false)
    })

    it('returns false for session with malformed sessionDate', () => {
      const session = { id: '1', status: 'not_started' as const, sessionDate: 'invalid' }
      expect(isSessionScheduledForToday(session, today)).toBe(false)
    })

    it('returns true for session scheduled today (YYYY-MM-DD format)', () => {
      const session = { id: '1', status: 'not_started' as const, sessionDate: '2024-03-15' }
      expect(isSessionScheduledForToday(session, today)).toBe(true)
    })

    it('returns true for session scheduled today (ISO format)', () => {
      const session = { id: '1', status: 'not_started' as const, sessionDate: '2024-03-15T10:30:00Z' }
      expect(isSessionScheduledForToday(session, today)).toBe(true)
    })

    it('returns false for session scheduled for different date', () => {
      const session = { id: '1', status: 'not_started' as const, sessionDate: '2024-03-16' }
      expect(isSessionScheduledForToday(session, today)).toBe(false)
    })

    it('returns false for session scheduled in the past', () => {
      const session = { id: '1', status: 'not_started' as const, sessionDate: '2024-03-14' }
      expect(isSessionScheduledForToday(session, today)).toBe(false)
    })

    it('handles date comparison at month boundaries', () => {
      const endOfMonth = new Date('2024-03-31T12:00:00Z')
      const session = { id: '1', status: 'not_started' as const, sessionDate: '2024-03-31' }
      expect(isSessionScheduledForToday(session, endOfMonth)).toBe(true)
    })

    it('handles date comparison at year boundaries', () => {
      const newYear = new Date('2024-01-01T12:00:00Z')
      const session = { id: '1', status: 'not_started' as const, sessionDate: '2024-01-01' }
      expect(isSessionScheduledForToday(session, newYear)).toBe(true)
    })

    it('uses current date when now parameter is not provided', () => {
      const today = new Date()
      const todayKey = toLocalDateKey(today)
      const session = { id: '1', status: 'not_started' as const, sessionDate: todayKey }
      expect(isSessionScheduledForToday(session)).toBe(true)
    })
  })
})
