import { describe, expect, it } from 'vitest'
import { parseStudentRouteParam, resolveStudentProfileId } from '@/utils/studentRoute'

describe('studentRoute utilities', () => {
  describe('resolveStudentProfileId', () => {
    it('returns the numeric student profile id for student users', () => {
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: 42,
        userId: 'student-user-id',
      })).toBe(42)
    })

    it('accepts string profile ids and normalizes them to numbers', () => {
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: '42',
      })).toBe(42)
    })

    it('does not fall back to auth user ids for student routes', () => {
      expect(resolveStudentProfileId({
        role: 'Student',
        userId: 'student-user-id',
        id: 'student-user-id',
      })).toBeNull()
    })

    it('returns null for non-student users', () => {
      expect(resolveStudentProfileId({
        role: 'Instructor',
        profileId: 42,
      })).toBeNull()
    })
  })

  describe('parseStudentRouteParam', () => {
    it('parses numeric route params', () => {
      expect(parseStudentRouteParam('42')).toBe(42)
      expect(parseStudentRouteParam(42)).toBe(42)
    })

    it('rejects non-numeric route params', () => {
      expect(parseStudentRouteParam('student-user-id')).toBeNull()
      expect(parseStudentRouteParam(undefined)).toBeNull()
    })
  })
})
