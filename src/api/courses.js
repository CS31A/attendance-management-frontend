import api from '@/api'

const COURSE_ENDPOINT = '/Course'

export default {
  /**
   * Get all courses
   * GET /api/Course
   */
  getAllCourses() {
    return api.get(COURSE_ENDPOINT)
  },

  /**
   * Get course by ID
   * GET /api/Course/{id}
   */
  getCourseById(id) {
    return api.get(`${COURSE_ENDPOINT}/${id}`)
  },

  /**
   * Create new course (Admin only)
   * POST /api/Course
   */
  createCourse(data) {
    return api.post(COURSE_ENDPOINT, data)
  },

  /**
   * Update course (Admin only)
   * PUT /api/Course/{id}
   */
  updateCourse(id, data) {
    return api.put(`${COURSE_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete course (Admin only)
   * DELETE /api/Course/{id}
   */
  deleteCourse(id) {
    return api.delete(`${COURSE_ENDPOINT}/${id}`)
  },
}
