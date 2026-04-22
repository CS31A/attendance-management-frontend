import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from './index'

/**
 * Student Enrollment API Service
 * Interfaces with StudentEnrollmentController endpoints
 */

const ENROLLMENT_ENDPOINT = '/StudentEnrollment'

export interface EnrollmentData {
  studentId: EntityId
  sectionId: EntityId
  subjectId: EntityId
  enrollmentType: string
  academicYear?: string
  semester?: string
}

export interface EnrollmentStatusQuery {
  studentId: EntityId
  sectionId: EntityId
  subjectId: EntityId
}

export interface EnrollmentDto {
  id: EntityId
  enrollmentId?: EntityId
  studentId?: EntityId
  studentFirstname?: string
  studentLastname?: string
  enrollmentType?: string
  enrolledAt?: string | null
  isActive?: boolean
  status?: string
  [key: string]: unknown
}

export interface StudentSectionsResponseDto {
  studentId: EntityId
  enrollments: EnrollmentDto[]
}

export interface CheckEnrollmentResponse {
  isEnrolled: boolean
}

export default {
  /**
   * Enroll a student in a section-subject combination
   * POST /api/StudentEnrollment/enroll
   * @param {object} enrollmentData - Enrollment data
   * @param {EntityId} enrollmentData.studentId - Student ID
   * @param {EntityId} enrollmentData.sectionId - Section ID
   * @param {EntityId} enrollmentData.subjectId - Subject ID
   * @param {string} enrollmentData.enrollmentType - Enrollment type (e.g., "Regular", "Irregular")
   * @param {string} [enrollmentData.academicYear] - Academic year (optional)
   * @param {string} [enrollmentData.semester] - Semester (optional)
   * @returns {Promise} Response with created enrollment
   */
  enrollStudent(enrollmentData: EnrollmentData): Promise<AxiosResponse<EnrollmentDto>> {
    return api.post<EnrollmentDto>(`${ENROLLMENT_ENDPOINT}/enroll`, enrollmentData)
  },

  /**
   * Get all enrollments for a specific student
   * GET /api/StudentEnrollment/student/{studentId}
   * @param {EntityId} studentId - Student ID
   * @returns {Promise} Response with array of student enrollments
   */
  getStudentEnrollments(studentId: EntityId): Promise<AxiosResponse<StudentSectionsResponseDto>> {
    return api.get<StudentSectionsResponseDto>(`${ENROLLMENT_ENDPOINT}/student/${studentId}`)
  },

  /**
   * Get all active students enrolled in a specific section
   * GET /api/StudentEnrollment/section/{sectionId}/students
   * @param {EntityId} sectionId - Section ID
   * @returns {Promise} Response with array of enrolled students
   */
  getSectionStudents(sectionId: EntityId): Promise<AxiosResponse<EnrollmentDto[]>> {
    return api.get<EnrollmentDto[]>(`${ENROLLMENT_ENDPOINT}/section/${sectionId}/students`)
  },

  /**
   * Drop a student from a specific enrollment
   * PATCH /api/StudentEnrollment/{enrollmentId}/drop
   * @param {EntityId} enrollmentId - Enrollment ID
   * @returns {Promise} Response confirming drop
   */
  dropStudent(enrollmentId: EntityId): Promise<AxiosResponse<unknown>> {
    return api.patch(`${ENROLLMENT_ENDPOINT}/${enrollmentId}/drop`)
  },

  /**
   * Re-enroll a student (reactivate enrollment)
   * PATCH /api/StudentEnrollment/{enrollmentId}/reenroll
   * @param {EntityId} enrollmentId - Enrollment ID
   * @returns {Promise} Response confirming re-enrollment
   */
  reenrollStudent(enrollmentId: EntityId): Promise<AxiosResponse<unknown>> {
    return api.patch(`${ENROLLMENT_ENDPOINT}/${enrollmentId}/reenroll`)
  },

  /**
   * Check if a student is enrolled in a specific section-subject combination
   * GET /api/StudentEnrollment/check
   * @param {object} params - Query parameters
   * @param {EntityId} params.studentId - Student ID
   * @param {EntityId} params.sectionId - Section ID
   * @param {EntityId} params.subjectId - Subject ID
   * @returns {Promise} Response with enrollment status
   */
  checkEnrollment(params: EnrollmentStatusQuery): Promise<AxiosResponse<CheckEnrollmentResponse>> {
    return api.get<CheckEnrollmentResponse>(`${ENROLLMENT_ENDPOINT}/check`, { params })
  },
}
