import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('dead code removal', () => {
  describe('deleted files no longer exist', () => {
    it('src/utils/toast.ts has been removed (dead code, 0 imports)', () => {
      expect(existsSync('src/utils/toast.ts')).toBe(false)
    })

    it('src/utils/auth.ts has been removed (dead code, 0 imports)', () => {
      expect(existsSync('src/utils/auth.ts')).toBe(false)
    })
  })

  describe('src/utils/constants.ts retains needed exports', () => {
    it('file still exists', () => {
      expect(existsSync('src/utils/constants.ts')).toBe(true)
    })

    it('exports ROLES constant', async () => {
      const mod = await import('@/utils/constants')
      expect(mod.ROLES).toBeDefined()
      expect(mod.ROLES).toEqual({
        ADMIN: 'Admin',
        INSTRUCTOR: 'Instructor',
        STUDENT: 'Student',
      })
    })

    it('exports SESSION_STATUSES constant', async () => {
      const mod = await import('@/utils/constants')
      expect(mod.SESSION_STATUSES).toBeDefined()
      expect(mod.SESSION_STATUSES).toEqual({
        NOT_STARTED: 'not_started',
        ACTIVE: 'active',
        ENDED: 'ended',
        CANCELLED: 'cancelled',
      })
    })

    it('exports LOCALE constant', async () => {
      const mod = await import('@/utils/constants')
      expect(mod.LOCALE).toBeDefined()
      expect(mod.LOCALE.DEFAULT).toBe('en-US')
    })

    it('does NOT export removed ATTENDANCE_STATUSES', async () => {
      const mod = await import('@/utils/constants')
      expect((mod as Record<string, unknown>).ATTENDANCE_STATUSES).toBeUndefined()
    })

    it('does NOT export removed AttendanceStatus type', async () => {
      const source = (await import('node:fs')).readFileSync(
        'src/utils/constants.ts',
        'utf8',
      )
      expect(source.includes('export type AttendanceStatus')).toBe(false)
    })

    it('does NOT export removed ATTENDANCE_STATUSES constant', async () => {
      const source = (await import('node:fs')).readFileSync(
        'src/utils/constants.ts',
        'utf8',
      )
      expect(source.includes('export const ATTENDANCE_STATUSES')).toBe(false)
    })
  })

  describe('key imports survive dead code removal', () => {
    it('useToast imports from @/composables/useToast', async () => {
      const mod = await import('@/composables/useToast')
      expect(mod.useToast).toBeDefined()
      expect(typeof mod.useToast).toBe('function')
    })

    it('ROLES imports from @/utils/constants', async () => {
      const { ROLES } = await import('@/utils/constants')
      expect(ROLES).toBeDefined()
      expect(ROLES.ADMIN).toBe('Admin')
      expect(ROLES.INSTRUCTOR).toBe('Instructor')
      expect(ROLES.STUDENT).toBe('Student')
    })

    it('SESSION_STATUSES imports from @/utils/constants', async () => {
      const { SESSION_STATUSES } = await import('@/utils/constants')
      expect(SESSION_STATUSES).toBeDefined()
      expect(SESSION_STATUSES.NOT_STARTED).toBe('not_started')
      expect(SESSION_STATUSES.ACTIVE).toBe('active')
      expect(SESSION_STATUSES.ENDED).toBe('ended')
      expect(SESSION_STATUSES.CANCELLED).toBe('cancelled')
    })
  })
})
