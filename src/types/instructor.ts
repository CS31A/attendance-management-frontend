/**
 * TypeScript interfaces for Instructor Class Student View feature
 * These interfaces match the backend C# DTOs exactly (PascalCase properties)
 * to ensure proper serialization/deserialization
 */

/**
 * Response DTO for instructor sections with students
 * Matches: InstructorSectionsWithStudentsResponseDto.cs
 */
export interface InstructorSectionsWithStudentsResponseDto {
  InstructorId: number
  InstructorFirstname: string
  InstructorLastname: string
  Sections: SectionWithStudentsDto[]
}

/**
 * DTO for section with enrolled students
 * Matches: SectionWithStudentsDto.cs
 */
export interface SectionWithStudentsDto {
  SectionId: number
  SectionName: string
  CourseId: number
  CourseName: string
  Subjects: SubjectScheduleDto[]
}

/**
 * DTO for subject schedule with students
 * Matches: SubjectScheduleDto.cs
 */
export interface SubjectScheduleDto {
  SubjectId: number
  SubjectName: string
  SubjectCode: string
  ScheduleId: number
  DayOfWeek: string
  TimeIn: string // ISO time format (e.g., "08:00:00")
  TimeOut: string // ISO time format (e.g., "10:00:00")
  ClassroomName: string
  Students: StudentDto[]
}

/**
 * DTO for student information
 * Matches: StudentDto.cs
 */
export interface StudentDto {
  StudentId: number
  Firstname: string
  Lastname: string
  IsRegular: boolean
  EnrollmentType: string // "Regular", "Irregular", "Retake"
}
