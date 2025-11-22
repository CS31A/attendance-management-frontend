import api from './index'

/**
 * Student API Service
 * Interfaces with StudentController endpoints
 */

const STUDENT_ENDPOINT = '/students'

export default {
  /**
   * Get all students
   * GET /api/students
   * @returns {Promise} Response with array of students
   */
  getAllStudents() {
    return api.get(STUDENT_ENDPOINT)
  },

  /**
   * Get student by ID
   * GET /api/students/{id}
   * @param {number} id - Student ID
   * @returns {Promise} Response with student details
   */
  getStudentById(id) {
    return api.get(`${STUDENT_ENDPOINT}/${id}`)
  },

  /**
   * Update student
   * PATCH /api/students/{id}
   * @param {number} id - Student ID
   * @param {object} data - Student data to update
   * @returns {Promise} Response with updated student
   */
  updateStudent(id, data) {
    return api.patch(`${STUDENT_ENDPOINT}/${id}`, data)
  },

  /**
   * Soft delete student
   * PATCH /api/students/{id}/soft-delete
   * @param {number} id - Student ID
   * @returns {Promise} Response confirming soft delete
   */
  softDeleteStudent(id) {
    return api.patch(`${STUDENT_ENDPOINT}/${id}/soft-delete`)
  },

  /**
   * Hard delete student
   * DELETE /api/students/{id}
   * @param {number} id - Student ID
   * @returns {Promise} Response confirming deletion
   */
  hardDeleteStudent(id) {
    return api.delete(`${STUDENT_ENDPOINT}/${id}`)
  },

  /**
   * Restore soft-deleted student
   * PATCH /api/students/{id}/restore
   * @param {number} id - Student ID
   * @returns {Promise} Response with restored student
   */
  restoreStudent(id) {
    return api.patch(`${STUDENT_ENDPOINT}/${id}/restore`)
  },
}
