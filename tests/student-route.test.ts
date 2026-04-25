import { describe, expect, it } from 'vitest'
import { parseStudentRouteParam, resolveStudentProfileId } from '@/utils/studentRoute'

describe('studentRoute utilities', () => {
  describe('resolveStudentProfileId', () => {
    it('returns the student profile id for student users without numeric coercion', () => {
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: '550e8400-e29b-41d4-a716-446655440000',
        userId: 'student-user-id',
      })).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('accepts trimmed string profile ids', () => {
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: ' 550e8400-e29b-41d4-a716-446655440001 ',
      })).toBe('550e8400-e29b-41d4-a716-446655440001')
    })

    it('rejects blank or non-string profile ids', () => {
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: 42.5 as unknown as string,
      })).toBeNull()
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: '   ',
      })).toBeNull()
      expect(resolveStudentProfileId({
        role: 'Student',
        profileId: -3 as unknown as string,
      })).toBeNull()
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
        profileId: '42',
      })).toBeNull()
    })
  })

  describe('parseStudentRouteParam', () => {
    it('returns string route params as-is after trimming', () => {
      expect(parseStudentRouteParam('550e8400-e29b-41d4-a716-446655440010')).toBe('550e8400-e29b-41d4-a716-446655440010')
      expect(parseStudentRouteParam(' 550e8400-e29b-41d4-a716-446655440011 ')).toBe('550e8400-e29b-41d4-a716-446655440011')
    })

    it('rejects non-string route params', () => {
      expect(parseStudentRouteParam(42 as unknown as string)).toBeNull()
      expect(parseStudentRouteParam(undefined)).toBeNull()
    })

    it('rejects blank route params', () => {
      expect(parseStudentRouteParam('   ')).toBeNull()
      expect(parseStudentRouteParam(0 as unknown as string)).toBeNull()
    })
  })
})
