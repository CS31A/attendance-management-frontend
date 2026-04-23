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
  timeIn: string // ISO time format (e.g., "08:00:00")
  timeOut: string // ISO time format (e.g., "10:00:00")
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
  enrollmentType: string // "Regular", "Irregular", "Retake"
}
