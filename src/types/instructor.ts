/**
 * TypeScript interfaces for Instructor Class Student View feature
 * These interfaces match the frontend JSON payload shape (camelCase properties)
 * returned by the ASP.NET Core API.
 */

/**
 * Response DTO for instructor sections with students
 * Matches: InstructorSectionsWithStudentsResponseDto.cs
 */
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

// ==================== Section-First Drilldown Types ====================

export interface InstructorSectionOverviewItem {
  sectionId: number
  sectionUuid: string
  sectionName: string
  courseId: number
  courseUuid: string
  courseName: string
  handledClassCount: number
  uniqueStudentCount: number
}

export interface InstructorHandledClassStudent {
  studentId: number
  studentUuid: string
  firstname: string
  lastname: string
  isRegular: boolean
  enrollmentType: string
}

export interface InstructorHandledClassDetail {
  subjectId: number
  subjectUuid: string
  subjectName: string
  subjectCode: string
  scheduleId: number
  scheduleUuid: string
  dayOfWeek: string
  timeIn: string
  timeOut: string
  classroomId: number
  classroomUuid: string
  classroomName: string
  studentCount: number
  students: InstructorHandledClassStudent[]
}

export interface InstructorHomeSectionStudent {
  studentId: number
  studentUuid: string
  firstname: string
  lastname: string
  isRegular: boolean
  enrollmentType: string
}

export interface InstructorSectionDetail {
  sectionId: number
  sectionUuid: string
  sectionName: string
  courseId: number
  courseUuid: string
  courseName: string
  handledClassCount: number
  homeSectionStudentCount: number
  handledClasses: InstructorHandledClassDetail[]
  homeSectionStudents: InstructorHomeSectionStudent[]
}

export interface InstructorStudentEnrollment {
  subjectId: number
  subjectName: string
  subjectCode: string
  sectionId: number
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
  studentId: number
  studentUuid: string
  firstname: string
  lastname: string
  sectionId: number | null
  sectionName: string | null
  courseId: number | null
  courseName: string | null
  isRegular: boolean
  enrollmentType: string
  enrollments: InstructorStudentEnrollment[]
  attendanceSummary: InstructorStudentAttendanceSummary
}
