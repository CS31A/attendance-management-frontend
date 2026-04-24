/**
 * TypeScript interfaces for Instructor Class Student View feature
 * These interfaces match the frontend JSON payload shape (camelCase properties)
 * returned by the ASP.NET Core API.
 */

/**
 * Response DTO for instructor sections with students
 * Matches: InstructorSectionsWithStudentsResponseDto.cs
 */
// ==================== Section-First Drilldown Types ====================

import type { EntityId } from './index'

export interface InstructorSectionsWithStudentsResponseDto {
  instructorId: number
  instructorFirstname: string
  instructorLastname: string
  sections: SectionWithStudentsDto[]
}

/**
 * DTO for section with enrolled students
 * Matches: SectionWithStudentsDto.cs
 */
export interface SectionWithStudentsDto {
  sectionId: number
  sectionName: string
  courseId: number
  courseName: string
  subjects: SubjectScheduleDto[]
}

/**
 * DTO for subject schedule with students
 * Matches: SubjectScheduleDto.cs
 */
export interface SubjectScheduleDto {
  subjectId: number
  subjectName: string
  subjectCode: string
  scheduleId: number
  dayOfWeek: string
  timeIn: string
  timeOut: string
  classroomName: string
  students: StudentDto[]
}

/**
 * DTO for student information
 * Matches: StudentDto.cs
 */
export interface StudentDto {
  studentId: number
  firstname: string
  lastname: string
  isRegular: boolean
  enrollmentType: string
}

export interface InstructorSectionOverviewItem {
  sectionId: EntityId
  sectionName: string
  courseId: EntityId
  courseName: string
  handledClassCount: number
  uniqueStudentCount: number
}

export interface InstructorHandledClassStudent {
  studentId: EntityId
  firstname: string
  lastname: string
  isRegular: boolean
  enrollmentType: string
}

export interface InstructorHandledClassDetail {
  subjectId: EntityId
  subjectName: string
  subjectCode: string
  scheduleId: EntityId
  dayOfWeek: string
  timeIn: string
  timeOut: string
  classroomId: EntityId
  classroomName: string
  studentCount: number
  students: InstructorHandledClassStudent[]
}

export interface InstructorHomeSectionStudent {
  studentId: EntityId
  firstname: string
  lastname: string
  isRegular: boolean
  enrollmentType: string
}

export interface InstructorSectionDetail {
  sectionId: EntityId
  sectionName: string
  courseId: EntityId
  courseName: string
  handledClassCount: number
  homeSectionStudentCount: number
  handledClasses: InstructorHandledClassDetail[]
  homeSectionStudents: InstructorHomeSectionStudent[]
}

export interface InstructorStudentEnrollment {
  subjectId: EntityId
  subjectName: string
  subjectCode: string
  sectionId: EntityId
  sectionName: string
  enrollmentType: string
}

export interface InstructorStudentAttendanceSummary {
  totalSessions: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
}

export interface InstructorStudentDetail {
  studentId: EntityId
  firstname: string
  lastname: string
  sectionId: EntityId | null
  sectionName: string | null
  courseId: EntityId | null
  courseName: string | null
  isRegular: boolean
  enrollmentType: string
  enrollments: InstructorStudentEnrollment[]
  attendanceSummary: InstructorStudentAttendanceSummary
}
