import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from '@/api'

const COURSE_ENDPOINT = '/Course'

export interface CourseDto {
  id: EntityId
  name?: string
  [key: string]: unknown
}

export type CoursePayload = Record<string, unknown>

export default {
  /**
   * Get all courses
   * GET /api/Course
   */
  getAllCourses(): Promise<AxiosResponse<CourseDto[]>> {
    return api.get<CourseDto[]>(COURSE_ENDPOINT)
  },

  /**
   * Get course by ID
   * GET /api/Course/{id}
   * @param {EntityId} id - Course ID (string UUID)
   * @returns {Promise<AxiosResponse<CourseDto>>} Course details
   */
  getCourseById(id: EntityId): Promise<AxiosResponse<CourseDto>> {
    return api.get<CourseDto>(`${COURSE_ENDPOINT}/${id}`)
  },

  /**
   * Create new course (Admin only)
   * POST /api/Course
   */
  createCourse(data: CoursePayload): Promise<AxiosResponse<CourseDto>> {
    return api.post<CourseDto>(COURSE_ENDPOINT, data)
  },

  /**
   * Update course (Admin only)
   * PUT /api/Course/{id}
   * @param {EntityId} id - Course ID (string UUID)
   * @param {CoursePayload} data - Course data to update
   * @returns {Promise<AxiosResponse<CourseDto>>} Updated course
   */
  updateCourse(id: EntityId, data: CoursePayload): Promise<AxiosResponse<CourseDto>> {
    return api.put<CourseDto>(`${COURSE_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete course (Admin only)
   * DELETE /api/Course/{id}
   * @param {EntityId} id - Course ID (string UUID)
   * @returns {Promise<AxiosResponse<unknown>>} Deletion confirmation
   */
  deleteCourse(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`${COURSE_ENDPOINT}/${id}`)
  },

  /**
   * Check if course has sections assigned
   * GET /api/Course/{id}/has-sections
   * @param {EntityId} id - Course ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if course has sections
   */
  hasSectionsInCourse(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${COURSE_ENDPOINT}/${id}/has-sections`)
  },
}
