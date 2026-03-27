import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from './index'

/**
 * Student Enrollment API Service
 * Interfaces with StudentEnrollmentController endpoints
 */

const ENROLLMENT_ENDPOINT = '/StudentEnrollment'

export interface EnrollmentData {
  studentId: number
  sectionId: number
  subjectId: number
  enrollmentType: string
  academicYear?: string
  semester?: string
}

export interface EnrollmentStatusQuery {
  studentId: number
  sectionId: number
  subjectId: number
}

export interface EnrollmentDto {
  id: EntityId
  enrollmentId?: EntityId
  studentId?: EntityId
  firstName?: string
  lastName?: string
  enrollmentType?: string
  enrollmentDate?: string | null
  status?: string
  [key: string]: unknown
}

export default {
  /**
   * Enroll a student in a section-subject combination
   * POST /api/StudentEnrollment/enroll
   * @param {object} enrollmentData - Enrollment data
   * @param {number} enrollmentData.studentId - Student ID
   * @param {number} enrollmentData.sectionId - Section ID
   * @param {number} enrollmentData.subjectId - Subject ID
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
   * @param {number} studentId - Student ID
   * @returns {Promise} Response with array of student enrollments
   */
  getStudentEnrollments(studentId: EntityId): Promise<AxiosResponse<EnrollmentDto[]>> {
    return api.get<EnrollmentDto[]>(`${ENROLLMENT_ENDPOINT}/student/${studentId}`)
  },

  /**
   * Get all active students enrolled in a specific section
   * GET /api/StudentEnrollment/section/{sectionId}/students
   * @param {number} sectionId - Section ID
   * @returns {Promise} Response with array of enrolled students
   */
  getSectionStudents(sectionId: EntityId): Promise<AxiosResponse<EnrollmentDto[]>> {
    return api.get<EnrollmentDto[]>(`${ENROLLMENT_ENDPOINT}/section/${sectionId}/students`)
  },

  /**
   * Drop a student from a specific enrollment
   * PATCH /api/StudentEnrollment/{enrollmentId}/drop
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise} Response confirming drop
   */
  dropStudent(enrollmentId: EntityId): Promise<AxiosResponse<unknown>> {
    return api.patch(`${ENROLLMENT_ENDPOINT}/${enrollmentId}/drop`)
  },

  /**
   * Re-enroll a student (reactivate enrollment)
   * PATCH /api/StudentEnrollment/{enrollmentId}/reenroll
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise} Response confirming re-enrollment
   */
  reenrollStudent(enrollmentId: EntityId): Promise<AxiosResponse<unknown>> {
    return api.patch(`${ENROLLMENT_ENDPOINT}/${enrollmentId}/reenroll`)
  },

  /**
   * Check if a student is enrolled in a specific section-subject combination
   * GET /api/StudentEnrollment/check
   * @param {object} params - Query parameters
   * @param {number} params.studentId - Student ID
   * @param {number} params.sectionId - Section ID
   * @param {number} params.subjectId - Subject ID
   * @returns {Promise} Response with enrollment status
   */
  checkEnrollment(params: EnrollmentStatusQuery): Promise<AxiosResponse<unknown>> {
    return api.get(`${ENROLLMENT_ENDPOINT}/check`, { params })
  },
}
