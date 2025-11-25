import api from '@/api'

const CLASSROOM_ENDPOINT = '/classrooms'

export default {
  /**
   * Get all classrooms
   * GET /api/classrooms
   */
  getAllClassrooms() {
    return api.get(CLASSROOM_ENDPOINT)
  },

  /**
   * Get classroom by ID
   * GET /api/classrooms/{id}
   */
  getClassroomById(id) {
    return api.get(`${CLASSROOM_ENDPOINT}/${id}`)
  },

  /**
   * Create new classroom
   * POST /api/classrooms
   */
  createClassroom(data) {
    return api.post(CLASSROOM_ENDPOINT, data)
  },

  /**
   * Update classroom record
   * PATCH /api/classrooms/{id}
   */
  updateClassroom(id, data) {
    return api.patch(`${CLASSROOM_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete classroom by ID
   * DELETE /api/classrooms/{id}
   */
  deleteClassroom(id) {
    return api.delete(`${CLASSROOM_ENDPOINT}/${id}`)
  },
}
