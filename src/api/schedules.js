import api from './index'

const SCHEDULE_ENDPOINT = '/schedules'

/**
 * Schedule API Service
 * Handles all schedule-related API requests
 */

/**
 * Get all schedules
 * @returns {Promise<Array>} List of schedule objects
 */
export async function getAllSchedules() {
  try {
    const response = await api.get(SCHEDULE_ENDPOINT)
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch schedules:', error)
    return Promise.reject(error)
  }
}

/**
 * Get a specific schedule by ID
 * @param {number} id - Schedule ID
 * @returns {Promise<object>} Schedule object
 */
export async function getScheduleById(id) {
  try {
    const response = await api.get(`${SCHEDULE_ENDPOINT}/${id}`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Create a new schedule
 * @param {object} data - Schedule data
 * @returns {Promise<object>} Created schedule object
 */
export async function createSchedule(data) {
  try {
    const response = await api.post(SCHEDULE_ENDPOINT, data)
    return response.data
  }
  catch (error) {
    console.error('Failed to create schedule:', error)
    return Promise.reject(error)
  }
}

/**
 * Update an existing schedule
 * @param {number} id - Schedule ID
 * @param {object} data - Updated schedule data
 * @returns {Promise<object>} Updated schedule object
 */
export async function updateSchedule(id, data) {
  try {
    const response = await api.put(`${SCHEDULE_ENDPOINT}/${id}`, data)
    return response.data
  }
  catch (error) {
    console.error(`Failed to update schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Delete a schedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 */
export async function deleteSchedule(id) {
  try {
    await api.delete(`${SCHEDULE_ENDPOINT}/${id}`)
  }
  catch (error) {
    console.error(`Failed to delete schedule ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Get schedules by instructor ID
 * @param {number} instructorId - Instructor ID
 * @returns {Promise<Array>} List of schedule objects for the instructor
 */
export async function getSchedulesByInstructor(instructorId) {
  try {
    const response = await api.get(`${SCHEDULE_ENDPOINT}/instructor/${instructorId}`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch schedules for instructor ${instructorId}:`, error)
    return Promise.reject(error)
  }
}

export default {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSchedulesByInstructor,
}
