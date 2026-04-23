import type { EntityId } from '@/types'
import type { InstructorSectionsWithStudentsResponseDto } from '@/types/instructor'
import api from './index'

export type InstructorDto = Record<string, unknown>
export type InstructorCollectionDto = InstructorDto[]

/**
 * Instructor API Service
 * Handles all instructor-related API requests
 */

/**
 * Get current instructor's schedules
 * @returns {Promise<Array>} List of schedule objects
 */
export async function getMySchedules(): Promise<InstructorCollectionDto> {
  try {
    const response = await api.get('/instructors/me/schedules')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor schedules:', error)
    return Promise.reject(error)
  }
}

/**
 * Get current instructor's information
 * @returns {Promise<object>} Instructor object
 */
export async function getMyProfile(): Promise<InstructorDto> {
  try {
    const response = await api.get('/instructors/profile')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor profile:', error)
    return Promise.reject(error)
  }
}

/**
 * Get subjects assigned to a specific instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<Array>} List of subject objects
 */
export async function getInstructorSubjects(id: EntityId): Promise<InstructorCollectionDto> {
  try {
    const response = await api.get(`/instructors/${id}/subjects`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch subjects for instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Get current instructor's sections with enrolled students
 * @returns {Promise<InstructorSectionsWithStudentsResponseDto>} Instructor sections with students data
 */
export async function getMySectionsWithStudents(): Promise<InstructorSectionsWithStudentsResponseDto> {
  try {
    const response = await api.get('/instructors/me/sections-with-students')
    return normalizeInstructorSectionsResponse(response.data)
  }
  catch (error) {
    console.error('Failed to fetch instructor sections with students:', error)
    return Promise.reject(error)
  }
}

function normalizeInstructorSectionsResponse(payload: Record<string, any>): InstructorSectionsWithStudentsResponseDto {
  const sections = Array.isArray(payload.sections) ? payload.sections : payload.Sections ?? []

  return {
    instructorId: payload.instructorId ?? payload.InstructorId ?? 0,
    instructorFirstname: payload.instructorFirstname ?? payload.InstructorFirstname ?? '',
    instructorLastname: payload.instructorLastname ?? payload.InstructorLastname ?? '',
    sections: sections.map((section: Record<string, any>) => ({
      sectionId: section.sectionId ?? section.SectionId ?? 0,
      sectionName: section.sectionName ?? section.SectionName ?? '',
      courseId: section.courseId ?? section.CourseId ?? 0,
      courseName: section.courseName ?? section.CourseName ?? '',
      subjects: (section.subjects ?? section.Subjects ?? []).map((subject: Record<string, any>) => ({
        subjectId: subject.subjectId ?? subject.SubjectId ?? 0,
        subjectName: subject.subjectName ?? subject.SubjectName ?? '',
        subjectCode: subject.subjectCode ?? subject.SubjectCode ?? '',
        scheduleId: subject.scheduleId ?? subject.ScheduleId ?? 0,
        dayOfWeek: subject.dayOfWeek ?? subject.DayOfWeek ?? '',
        timeIn: subject.timeIn ?? subject.TimeIn ?? '',
        timeOut: subject.timeOut ?? subject.TimeOut ?? '',
        classroomName: subject.classroomName ?? subject.ClassroomName ?? '',
        students: (subject.students ?? subject.Students ?? []).map((student: Record<string, any>) => ({
          studentId: student.studentId ?? student.StudentId ?? 0,
          firstname: student.firstname ?? student.Firstname ?? '',
          lastname: student.lastname ?? student.Lastname ?? '',
          isRegular: student.isRegular ?? student.IsRegular ?? false,
          enrollmentType: student.enrollmentType ?? student.EnrollmentType ?? 'Regular',
        })),
      })),
    })),
  }
}

export default {
  getMySchedules,
  getMyProfile,
  getInstructorSubjects,
  getMySectionsWithStudents,
}
