/**
 * Type-level tests for instructor interface merging (TDD green phase).
 *
 * `InstructorHandledClassStudent` and `InstructorHomeSectionStudent`
 * have been merged into `InstructorSectionStudent` in types/instructor.ts.
 *
 * These tests verify the unified interface has the expected shape.
 */
import type { InstructorSectionStudent } from '@/types/instructor'
import type { EntityId } from '@/types'

// ── helpers ──────────────────────────────────────────────────────
type IsAny<T> = 0 extends (1 & T) ? true : false
type ExpectTrue<T extends true> = T
type ExpectFalse<T extends false> = T
type Extends<T, U> = T extends U ? true : false

// ── field existence checks ───────────────────────────────────────
// Required fields
type _hasStudentId = ExpectTrue<Extends<InstructorSectionStudent['studentId'], EntityId>>
type _hasFirstname = ExpectTrue<Extends<InstructorSectionStudent['firstname'], string>>
type _hasLastname = ExpectTrue<Extends<InstructorSectionStudent['lastname'], string>>
type _hasIsRegular = ExpectTrue<Extends<InstructorSectionStudent['isRegular'], boolean>>
type _hasEnrollmentType = ExpectTrue<Extends<InstructorSectionStudent['enrollmentType'], string>>
type _hasHasFingerprint = ExpectTrue<Extends<InstructorSectionStudent['hasFingerprint'], boolean>>

// Optional fields (should be present on the type, but may be undefined)
type _hasFingerprintDeviceId = ExpectTrue<
  Extends<InstructorSectionStudent['fingerprintDeviceId'], EntityId | undefined>
>
type _hasFingerprintDeviceName = ExpectTrue<
  Extends<InstructorSectionStudent['fingerprintDeviceName'], string | undefined>
>

// ── not any ──────────────────────────────────────────────────────
type _studentIdNotAny = ExpectFalse<IsAny<InstructorSectionStudent['studentId']>>
type _firstnameNotAny = ExpectFalse<IsAny<InstructorSectionStudent['firstname']>>
type _isRegularNotAny = ExpectFalse<IsAny<InstructorSectionStudent['isRegular']>>

// ── optional fields must accept undefined ────────────────────────
type _fingerprintDeviceIdAcceptsUndefined = ExpectTrue<
  Extends<undefined, InstructorSectionStudent['fingerprintDeviceId']>
>
type _fingerprintDeviceNameAcceptsUndefined = ExpectTrue<
  Extends<undefined, InstructorSectionStudent['fingerprintDeviceName']>
>

// ── full object literal should satisfy the type ──────────────────
type _fullObjectSatisfiesType = ExpectTrue<
  Extends<
    {
      studentId: EntityId
      firstname: string
      lastname: string
      isRegular: boolean
      enrollmentType: string
      hasFingerprint: boolean
      fingerprintDeviceId?: EntityId
      fingerprintDeviceName?: string
    },
    InstructorSectionStudent
  >
>

// ── non-any type guard ───────────────────────────────────────────
type _typeIsNotAny = ExpectFalse<IsAny<InstructorSectionStudent>>

export {}
