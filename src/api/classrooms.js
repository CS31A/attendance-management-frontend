import api from './index'

/**
 * Classroom API Service
 * Handles all classroom-related API requests
 */

/**
 * Get all classrooms
 * @returns {Promise<Array>} List of ClassroomDto objects
 */
export async function getClassrooms() {
  try {
    const response = await api.get('/classrooms')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch classrooms:', error)
    return Promise.reject(error)
  }
}

/**
 * Get a specific classroom by ID
 * @param {number} id - Classroom ID
 * @returns {Promise<object>} ClassroomDto object
 */
export async function getClassroomById(id) {
  try {
    const response = await api.get(`/classrooms/${id}`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch classroom ${id}:`, error)
    return Promise.reject(error)
  }
}

export default {
  getClassrooms,
  getClassroomById,
}
