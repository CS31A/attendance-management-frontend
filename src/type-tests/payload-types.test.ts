/**
 * Type-level tests for payload types (TDD green phase).
 *
 * ClassroomPayload, CoursePayload, SubjectPayload, SectionPayload,
 * and SchedulePayload each have specific named fields matching the
 * form data their views submit.
 *
 * These tests verify the typed payloads have the expected shape.
 */
import type { ClassroomPayload } from '@/api/classrooms'
import type { CoursePayload } from '@/api/courses'
import type { SchedulePayload } from '@/api/schedules'
import type { SectionPayload } from '@/api/sections'
import type { SubjectPayload } from '@/api/subjects'
import type { EntityId } from '@/types'

// ── helpers ──────────────────────────────────────────────────────
type IsAny<T> = 0 extends (1 & T) ? true : false
type IsRecordStringUnknown<T> = T extends Record<string, unknown> ? true : false
type ExpectTrue<T extends true> = T
type ExpectFalse<T extends false> = T
type Extends<T, U> = T extends U ? true : false

// ═══════════════════════════════════════════════════════════════
// ClassroomPayload — form field: name
// ═══════════════════════════════════════════════════════════════
type _classroomPayloadNotRecord = ExpectFalse<IsRecordStringUnknown<ClassroomPayload>>
type _classroomPayloadNotAny = ExpectFalse<IsAny<ClassroomPayload>>
type _classroomHasName = ExpectTrue<Extends<ClassroomPayload['name'], string>>

// Object literal with expected fields should satisfy the type
type _classroomPayloadAcceptsName = ExpectTrue<
  Extends<{ name: string }, ClassroomPayload>
>

// ═══════════════════════════════════════════════════════════════
// CoursePayload — form field: name
// ═══════════════════════════════════════════════════════════════
type _coursePayloadNotRecord = ExpectFalse<IsRecordStringUnknown<CoursePayload>>
type _coursePayloadNotAny = ExpectFalse<IsAny<CoursePayload>>
type _courseHasName = ExpectTrue<Extends<CoursePayload['name'], string>>

type _coursePayloadAcceptsName = ExpectTrue<
  Extends<{ name: string }, CoursePayload>
>

// ═══════════════════════════════════════════════════════════════
// SubjectPayload — form fields: name, code
// ═══════════════════════════════════════════════════════════════
type _subjectPayloadNotRecord = ExpectFalse<IsRecordStringUnknown<SubjectPayload>>
type _subjectPayloadNotAny = ExpectFalse<IsAny<SubjectPayload>>
type _subjectHasName = ExpectTrue<Extends<SubjectPayload['name'], string>>
type _subjectHasCode = ExpectTrue<Extends<SubjectPayload['code'], string>>

type _subjectPayloadAcceptsNameCode = ExpectTrue<
  Extends<{ name: string, code: string }, SubjectPayload>
>

// ═══════════════════════════════════════════════════════════════
// SectionPayload — form fields: name, courseId
// ═══════════════════════════════════════════════════════════════
type _sectionPayloadNotRecord = ExpectFalse<IsRecordStringUnknown<SectionPayload>>
type _sectionPayloadNotAny = ExpectFalse<IsAny<SectionPayload>>
type _sectionHasName = ExpectTrue<Extends<SectionPayload['name'], string>>
type _sectionHasCourseId = ExpectTrue<Extends<SectionPayload['courseId'], EntityId>>

type _sectionPayloadAcceptsNameCourseId = ExpectTrue<
  Extends<{ name: string, courseId: EntityId }, SectionPayload>
>

// ═══════════════════════════════════════════════════════════════
// SchedulePayload — form fields: timeIn, timeOut, dayOfWeek,
//   subjectId, classroomId, sectionId, instructorId
// ═══════════════════════════════════════════════════════════════
type _schedulePayloadNotRecord = ExpectFalse<IsRecordStringUnknown<SchedulePayload>>
type _schedulePayloadNotAny = ExpectFalse<IsAny<SchedulePayload>>
type _scheduleHasTimeIn = ExpectTrue<Extends<SchedulePayload['timeIn'], string>>
type _scheduleHasTimeOut = ExpectTrue<Extends<SchedulePayload['timeOut'], string>>
type _scheduleHasDayOfWeek = ExpectTrue<Extends<SchedulePayload['dayOfWeek'], string>>
type _scheduleHasSubjectId = ExpectTrue<Extends<SchedulePayload['subjectId'], EntityId>>
type _scheduleHasClassroomId = ExpectTrue<Extends<SchedulePayload['classroomId'], EntityId>>
type _scheduleHasSectionId = ExpectTrue<Extends<SchedulePayload['sectionId'], EntityId>>
type _scheduleHasInstructorId = ExpectTrue<Extends<SchedulePayload['instructorId'], EntityId>>

type _schedulePayloadAcceptsAllFields = ExpectTrue<
  Extends<
    {
      timeIn: string
      timeOut: string
      dayOfWeek: string
      subjectId: EntityId
      classroomId: EntityId
      sectionId: EntityId
      instructorId: EntityId
    },
    SchedulePayload
  >
>

export {}
