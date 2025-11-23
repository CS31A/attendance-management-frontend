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

export default {
  getMySchedules,
  getMyProfile,
  getAllInstructors,
}
