import api from '@/api'

const SUBJECT_ENDPOINT = '/subjects'

export default {
  /**
   * Get all subjects
   * GET /api/subjects
   */
  getAllSubjects() {
    return api.get(SUBJECT_ENDPOINT)
  },

  /**
   * Get subject by ID
   * GET /api/subjects/{id}
   */
  getSubjectById(id) {
    return api.get(`${SUBJECT_ENDPOINT}/${id}`)
  },

  /**
   * Create new subject
   * POST /api/subjects
   */
  createSubject(data) {
    return api.post(SUBJECT_ENDPOINT, data)
  },

  /**
   * Update subject record
   * PATCH /api/subjects/{id}
   */
  updateSubject(id, data) {
    return api.patch(`${SUBJECT_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete subject by ID
   * DELETE /api/subjects/{id}
   */
  deleteSubject(id) {
    return api.delete(`${SUBJECT_ENDPOINT}/${id}`)
  },
}
