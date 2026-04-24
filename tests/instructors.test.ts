import type { EntityId } from '@/types'
import type {
  InstructorHandledClassDetail,
  InstructorSectionDetail,
  InstructorSectionOverviewItem,
  InstructorStudentDetail,
} from '@/types/instructor'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api/index'
import {
  getMySectionDetail,
  getMySectionsOverview,
  getMyStudentDetail,
} from '@/api/instructors'

vi.mock('@/api/index', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('instructors API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normalizer functions prefer UUID over integer', () => {
    it('normalizeSectionOverviewItem prefers UUID over integer ID', async () => {
      const mockResponse = {
        data: [
          {
            sectionId: 1,
            sectionUuid: 'section-uuid-123',
            sectionName: 'Section A',
            courseId: 10,
            courseUuid: 'course-uuid-456',
            courseName: 'Course 1',
            handledClassCount: 5,
            uniqueStudentCount: 30,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionsOverview()

      expect(result).toHaveLength(1)
      // Should prefer UUID over integer
      expect(result[0].sectionId).toBe('section-uuid-123' as unknown as EntityId)
      expect(result[0].courseId).toBe('course-uuid-456' as unknown as EntityId)
      expect(result[0].sectionName).toBe('Section A')
      expect(result[0].courseName).toBe('Course 1')
    })

    it('normalizeSectionOverviewItem falls back to integer when UUID not present', async () => {
      const mockResponse = {
        data: [
          {
            sectionId: 1,
            sectionName: 'Section A',
            courseId: 10,
            courseName: 'Course 1',
            handledClassCount: 5,
            uniqueStudentCount: 30,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionsOverview()

      expect(result).toHaveLength(1)
      // Should fall back to integer ID
      expect(result[0].sectionId).toBe(1 as EntityId)
      expect(result[0].courseId).toBe(10 as EntityId)
    })

    it('normalizeSectionDetail prefers UUID over integer ID', async () => {
      const mockResponse = {
        data: {
          sectionId: 1,
          sectionUuid: 'section-uuid-123',
          sectionName: 'Section A',
          courseId: 10,
          courseUuid: 'course-uuid-456',
          courseName: 'Course 1',
          handledClassCount: 5,
          homeSectionStudentCount: 30,
          handledClasses: [
            {
              subjectId: 100,
              subjectUuid: 'subject-uuid-789',
              subjectName: 'Math',
              subjectCode: 'MATH101',
              scheduleId: 200,
              scheduleUuid: 'schedule-uuid-abc',
              dayOfWeek: 'Monday',
              timeIn: '08:00',
              timeOut: '09:00',
              classroomId: 300,
              classroomUuid: 'classroom-uuid-def',
              classroomName: 'Room 101',
              studentCount: 25,
              students: [
                {
                  studentId: 1000,
                  studentUuid: 'student-uuid-ghi',
                  firstname: 'John',
                  lastname: 'Doe',
                  isRegular: true,
                  enrollmentType: 'Regular',
                },
              ],
            },
          ],
          homeSectionStudents: [
            {
              studentId: 2000,
              studentUuid: 'student-uuid-jkl',
              firstname: 'Jane',
              lastname: 'Smith',
              isRegular: true,
              enrollmentType: 'Regular',
            },
          ],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionDetail(1 as EntityId)

      // Section-level IDs should prefer UUID
      expect(result.sectionId).toBe('section-uuid-123' as unknown as EntityId)
      expect(result.courseId).toBe('course-uuid-456' as unknown as EntityId)

      // Handled class IDs should prefer UUID
      expect(result.handledClasses).toHaveLength(1)
      const handledClass = result.handledClasses[0] as InstructorHandledClassDetail
      expect(handledClass.subjectId).toBe('subject-uuid-789' as unknown as EntityId)
      expect(handledClass.scheduleId).toBe('schedule-uuid-abc' as unknown as EntityId)
      expect(handledClass.classroomId).toBe('classroom-uuid-def' as unknown as EntityId)

      // Student IDs should prefer UUID
      expect(handledClass.students).toHaveLength(1)
      expect(handledClass.students[0].studentId).toBe('student-uuid-ghi' as unknown as EntityId)

      // Home section student IDs should prefer UUID
      expect(result.homeSectionStudents).toHaveLength(1)
      expect(result.homeSectionStudents[0].studentId).toBe('student-uuid-jkl' as unknown as EntityId)
    })

    it('normalizeStudentDetail prefers UUID over integer ID', async () => {
      const mockResponse = {
        data: {
          studentId: 1000,
          studentUuid: 'student-uuid-123',
          firstname: 'John',
          lastname: 'Doe',
          sectionId: 1,
          sectionUuid: 'section-uuid-456',
          sectionName: 'Section A',
          courseId: 10,
          courseUuid: 'course-uuid-789',
          courseName: 'Course 1',
          isRegular: true,
          enrollmentType: 'Regular',
          enrollments: [
            {
              subjectId: 100,
              subjectUuid: 'subject-uuid-abc',
              subjectName: 'Math',
              subjectCode: 'MATH101',
              sectionId: 1,
              sectionUuid: 'section-uuid-def',
              sectionName: 'Section A',
              enrollmentType: 'Regular',
            },
          ],
          attendanceSummary: {
            totalSessions: 10,
            presentCount: 8,
            absentCount: 2,
            lateCount: 0,
            attendanceRate: 0.8,
          },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMyStudentDetail(1000 as EntityId)

      // Student-level IDs should prefer UUID
      expect(result.studentId).toBe('student-uuid-123' as unknown as EntityId)
      expect(result.sectionId).toBe('section-uuid-456' as unknown as EntityId)
      expect(result.courseId).toBe('course-uuid-789' as unknown as EntityId)

      // Enrollment IDs should prefer UUID
      expect(result.enrollments).toHaveLength(1)
      expect(result.enrollments[0].subjectId).toBe('subject-uuid-abc' as unknown as EntityId)
      expect(result.enrollments[0].sectionId).toBe('section-uuid-def' as unknown as EntityId)
    })
  })

  describe('*Uuid fields are not in output', () => {
    it('section overview output does not contain *Uuid fields', async () => {
      const mockResponse = {
        data: [
          {
            sectionId: 1,
            sectionUuid: 'section-uuid-123',
            sectionName: 'Section A',
            courseId: 10,
            courseUuid: 'course-uuid-456',
            courseName: 'Course 1',
            handledClassCount: 5,
            uniqueStudentCount: 30,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionsOverview()

      expect(result).toHaveLength(1)
      const section = result[0] as InstructorSectionOverviewItem & Record<string, unknown>

      // Verify *Uuid fields are not in output
      expect(section.sectionUuid).toBeUndefined()
      expect(section.courseUuid).toBeUndefined()

      // Verify only EntityId fields exist
      expect(section.sectionId).toBeDefined()
      expect(section.courseId).toBeDefined()
    })

    it('section detail output does not contain *Uuid fields', async () => {
      const mockResponse = {
        data: {
          sectionId: 1,
          sectionUuid: 'section-uuid-123',
          sectionName: 'Section A',
          courseId: 10,
          courseUuid: 'course-uuid-456',
          courseName: 'Course 1',
          handledClassCount: 5,
          homeSectionStudentCount: 30,
          handledClasses: [
            {
              subjectId: 100,
              subjectUuid: 'subject-uuid-789',
              subjectName: 'Math',
              subjectCode: 'MATH101',
              scheduleId: 200,
              scheduleUuid: 'schedule-uuid-abc',
              dayOfWeek: 'Monday',
              timeIn: '08:00',
              timeOut: '09:00',
              classroomId: 300,
              classroomUuid: 'classroom-uuid-def',
              classroomName: 'Room 101',
              studentCount: 25,
              students: [
                {
                  studentId: 1000,
                  studentUuid: 'student-uuid-ghi',
                  firstname: 'John',
                  lastname: 'Doe',
                  isRegular: true,
                  enrollmentType: 'Regular',
                },
              ],
            },
          ],
          homeSectionStudents: [],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionDetail(1 as EntityId)

      const section = result as InstructorSectionDetail & Record<string, unknown>

      // Verify section-level *Uuid fields are not in output
      expect(section.sectionUuid).toBeUndefined()
      expect(section.courseUuid).toBeUndefined()

      // Verify handled class *Uuid fields are not in output
      const handledClass = result.handledClasses[0] as InstructorHandledClassDetail & Record<string, unknown>
      expect(handledClass.subjectUuid).toBeUndefined()
      expect(handledClass.scheduleUuid).toBeUndefined()
      expect(handledClass.classroomUuid).toBeUndefined()

      // Verify student *Uuid fields are not in output
      const student = handledClass.students[0] as unknown as Record<string, unknown>
      expect(student.studentUuid).toBeUndefined()
    })

    it('student detail output does not contain *Uuid fields', async () => {
      const mockResponse = {
        data: {
          studentId: 1000,
          studentUuid: 'student-uuid-123',
          firstname: 'John',
          lastname: 'Doe',
          sectionId: 1,
          sectionUuid: 'section-uuid-456',
          sectionName: 'Section A',
          courseId: 10,
          courseUuid: 'course-uuid-789',
          courseName: 'Course 1',
          isRegular: true,
          enrollmentType: 'Regular',
          enrollments: [
            {
              subjectId: 100,
              subjectUuid: 'subject-uuid-abc',
              subjectName: 'Math',
              subjectCode: 'MATH101',
              sectionId: 1,
              sectionUuid: 'section-uuid-def',
              sectionName: 'Section A',
              enrollmentType: 'Regular',
            },
          ],
          attendanceSummary: {
            totalSessions: 10,
            presentCount: 8,
            absentCount: 2,
            lateCount: 0,
            attendanceRate: 0.8,
          },
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMyStudentDetail(1000 as EntityId)

      const student = result as InstructorStudentDetail & Record<string, unknown>

      // Verify student-level *Uuid fields are not in output
      expect(student.studentUuid).toBeUndefined()
      expect(student.sectionUuid).toBeUndefined()
      expect(student.courseUuid).toBeUndefined()

      // Verify enrollment *Uuid fields are not in output
      const enrollment = result.enrollments[0] as unknown as Record<string, unknown>
      expect(enrollment.subjectUuid).toBeUndefined()
      expect(enrollment.sectionUuid).toBeUndefined()
    })
  })

  describe('entityId type is used throughout', () => {
    it('handles PascalCase backend response fields', async () => {
      const mockResponse = {
        data: [
          {
            SectionId: 1,
            SectionUuid: 'section-uuid-123',
            SectionName: 'Section A',
            CourseId: 10,
            CourseUuid: 'course-uuid-456',
            CourseName: 'Course 1',
            HandledClassCount: 5,
            UniqueStudentCount: 30,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionsOverview()

      expect(result).toHaveLength(1)
      // Should handle PascalCase and prefer UUID
      expect(result[0].sectionId).toBe('section-uuid-123' as unknown as EntityId)
      expect(result[0].courseId).toBe('course-uuid-456' as unknown as EntityId)
    })

    it('handles mixed camelCase and PascalCase fields', async () => {
      const mockResponse = {
        data: {
          sectionId: 1,
          SectionUuid: 'section-uuid-123',
          sectionName: 'Section A',
          CourseId: 10,
          courseUuid: 'course-uuid-456',
          CourseName: 'Course 1',
          handledClassCount: 5,
          HomeSectionStudentCount: 30,
          handledClasses: [],
          HomeSectionStudents: [],
        },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionDetail(1 as EntityId)

      // Should handle mixed casing and prefer UUID
      expect(result.sectionId).toBe('section-uuid-123' as unknown as EntityId)
      expect(result.courseId).toBe('course-uuid-456' as unknown as EntityId)
      expect(result.sectionName).toBe('Section A')
      expect(result.courseName).toBe('Course 1')
    })

    it('normalizes to EntityId type for all ID fields', async () => {
      const mockResponse = {
        data: [
          {
            sectionUuid: 'section-uuid-123',
            sectionName: 'Section A',
            courseUuid: 'course-uuid-456',
            courseName: 'Course 1',
            handledClassCount: 5,
            uniqueStudentCount: 30,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse as never)

      const result = await getMySectionsOverview()

      expect(result).toHaveLength(1)
      const section = result[0]

      // Verify all ID fields are EntityId type (string or number)
      expect(typeof section.sectionId === 'string' || typeof section.sectionId === 'number').toBe(true)
      expect(typeof section.courseId === 'string' || typeof section.courseId === 'number').toBe(true)
    })
  })
})
