import api from './index'

/**
 * Instructor API Service
 * Handles all instructor-related API requests
 */

/**
 * Get current instructor's schedules
 * @returns {Promise<Array>} List of schedule objects
 */
export async function getMySchedules() {
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
export async function getMyProfile() {
  try {
    const response = await api.get('/instructors/me')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor profile:', error)
    return Promise.reject(error)
  }
}

/**
 * Get all instructors (admin functionality)
 * @returns {Promise<Array>} List of instructor objects
 */
export async function getAllInstructors() {
  try {
    const response = await api.get('/instructors')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch all instructors:', error)
    return Promise.reject(error)
  }
}

/**
 * Get instructor by ID
 * @param {number} id - Instructor ID
 * @returns {Promise<object>} Instructor object
 */
export async function getInstructorById(id) {
  try {
    const response = await api.get(`/instructors/${id}`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Update instructor information
 * @param {number} id - Instructor ID
 * @param {object} data - Instructor data to update (firstname, lastname)
 * @returns {Promise<object>} Updated instructor object
 */
export async function updateInstructor(id, data) {
  try {
    const response = await api.patch(`/instructors/${id}`, data)
    return response.data
  }
  catch (error) {
    console.error(`Failed to update instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Soft delete instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<object>} Soft delete response
 */
export async function softDeleteInstructor(id) {
  try {
    const response = await api.patch(`/instructors/${id}/soft-delete`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to soft delete instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Hard delete instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<object>} Delete response
 */
export async function hardDeleteInstructor(id) {
  try {
    const response = await api.delete(`/instructors/${id}`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to delete instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Restore soft-deleted instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<object>} Restored instructor object
 */
export async function restoreInstructor(id) {
  try {
    const response = await api.patch(`/instructors/${id}/restore`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to restore instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Get subjects assigned to a specific instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<Array>} List of subject objects
 */
export async function getInstructorSubjects(id) {
  try {
    const response = await api.get(`/instructors/${id}/subjects`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch subjects for instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

export default {
  getMySchedules,
  getMyProfile,
  getAllInstructors,
  getInstructorById,
  updateInstructor,
  softDeleteInstructor,
  hardDeleteInstructor,
  restoreInstructor,
  getInstructorSubjects,
}
