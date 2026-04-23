import type { EntityId } from '@/types'
import type { InstructorSectionsWithStudentsResponseDto } from '@/types/instructor'
import api from './index'

export type InstructorDto = Record<string, unknown>
export type InstructorCollectionDto = InstructorDto[]

/**
 * Instructor API Service
 * Handles all instructor-related API requests
 */

/**
 * Get current instructor's schedules
 * @returns {Promise<Array>} List of schedule objects
 */
export async function getMySchedules(): Promise<InstructorCollectionDto> {
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
export async function getMyProfile(): Promise<InstructorDto> {
  try {
    const response = await api.get('/instructors/profile')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor profile:', error)
    return Promise.reject(error)
  }
}

/**
 * Get subjects assigned to a specific instructor
 * @param {number} id - Instructor ID
 * @returns {Promise<Array>} List of subject objects
 */
export async function getInstructorSubjects(id: EntityId): Promise<InstructorCollectionDto> {
  try {
    const response = await api.get(`/instructors/${id}/subjects`)
    return response.data
  }
  catch (error) {
    console.error(`Failed to fetch subjects for instructor ${id}:`, error)
    return Promise.reject(error)
  }
}

/**
 * Get current instructor's sections with enrolled students
 * @returns {Promise<InstructorSectionsWithStudentsResponseDto>} Instructor sections with students data
 */
export async function getMySectionsWithStudents(): Promise<InstructorSectionsWithStudentsResponseDto> {
  try {
    const response = await api.get('/instructors/me/sections-with-students')
    return response.data
  }
  catch (error) {
    console.error('Failed to fetch instructor sections with students:', error)
    return Promise.reject(error)
  }
}

export default {
  getMySchedules,
  getMyProfile,
  getInstructorSubjects,
  getMySectionsWithStudents,
}
