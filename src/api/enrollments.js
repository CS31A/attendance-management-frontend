import api from './index'

/**
 * Student Enrollment API Service
 * Interfaces with StudentEnrollmentController endpoints
 */

const ENROLLMENT_ENDPOINT = '/StudentEnrollment'

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
  enrollStudent(enrollmentData) {
    return api.post(`${ENROLLMENT_ENDPOINT}/enroll`, enrollmentData)
  },

  /**
   * Get all enrollments for a specific student
   * GET /api/StudentEnrollment/student/{studentId}
   * @param {number} studentId - Student ID
   * @returns {Promise} Response with array of student enrollments
   */
  getStudentEnrollments(studentId) {
    return api.get(`${ENROLLMENT_ENDPOINT}/student/${studentId}`)
  },

  /**
   * Get all active students enrolled in a specific section
   * GET /api/StudentEnrollment/section/{sectionId}/students
   * @param {number} sectionId - Section ID
   * @returns {Promise} Response with array of enrolled students
   */
  getSectionStudents(sectionId) {
    return api.get(`${ENROLLMENT_ENDPOINT}/section/${sectionId}/students`)
  },

  /**
   * Drop a student from a specific enrollment
   * PATCH /api/StudentEnrollment/{enrollmentId}/drop
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise} Response confirming drop
   */
  dropStudent(enrollmentId) {
    return api.patch(`${ENROLLMENT_ENDPOINT}/${enrollmentId}/drop`)
  },

  /**
   * Re-enroll a student (reactivate enrollment)
   * PATCH /api/StudentEnrollment/{enrollmentId}/reenroll
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise} Response confirming re-enrollment
   */
  reenrollStudent(enrollmentId) {
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
  checkEnrollment(params) {
    return api.get(`${ENROLLMENT_ENDPOINT}/check`, { params })
  },
}
