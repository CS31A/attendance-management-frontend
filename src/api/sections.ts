import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from './index'

export interface SectionDto {
  id: EntityId
  name?: string
  [key: string]: unknown
}

export interface SectionPayload {
  name: string
  courseId: EntityId
}

export default {
  /**
   * Get all sections
   * GET /api/sections
   * @returns {Promise<AxiosResponse<SectionDto[]>>} Array of section objects
   */
  getAllSections(): Promise<AxiosResponse<SectionDto[]>> {
    return api.get<SectionDto[]>('/sections')
  },

  /**
   * Get section by ID
   * GET /api/sections/{id}
   * @param {EntityId} id - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<SectionDto>>} Section details
   */
  getSection(id: EntityId): Promise<AxiosResponse<SectionDto>> {
    return api.get<SectionDto>(`/sections/${id}`)
  },

  /**
   * Create new section
   * POST /api/sections
   * @param {SectionPayload} data - Section data
   * @returns {Promise<AxiosResponse<SectionDto>>} Created section
   */
  createSection(data: SectionPayload): Promise<AxiosResponse<SectionDto>> {
    return api.post<SectionDto>('/sections', data)
  },

  /**
   * Update section
   * PUT /api/sections/{id}
   * @param {EntityId} id - Section ID (string UUID)
   * @param {SectionPayload} data - Section data to update
   * @returns {Promise<AxiosResponse<SectionDto>>} Updated section
   */
  updateSection(id: EntityId, data: SectionPayload): Promise<AxiosResponse<SectionDto>> {
    return api.put<SectionDto>(`/sections/${id}`, data)
  },

  /**
   * Delete section
   * DELETE /api/sections/{id}
   * @param {EntityId} id - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<unknown>>} Deletion confirmation
   */
  deleteSection(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`/sections/${id}`)
  },

  /**
   * Get active students in section
   * GET /api/sections/{sectionId}/active-students
   * @param {EntityId} sectionId - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<Record<string, unknown>[]>>} Array of active students
   */
  getActiveStudents(sectionId: EntityId): Promise<AxiosResponse<Record<string, unknown>[]>> {
    return api.get<Record<string, unknown>[]>(`/sections/${sectionId}/active-students`)
  },

  /**
   * Get all students in section
   * GET /api/sections/{sectionId}/all-students
   * @param {EntityId} sectionId - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<Record<string, unknown>[]>>} Array of all students
   */
  getAllStudents(sectionId: EntityId): Promise<AxiosResponse<Record<string, unknown>[]>> {
    return api.get<Record<string, unknown>[]>(`/sections/${sectionId}/all-students`)
  },

  /**
   * Check if section has students
   * GET /api/sections/{sectionId}/has-students
   * @param {EntityId} sectionId - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if section has students
   */
  hasStudentsInSection(sectionId: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`/sections/${sectionId}/has-students`)
  },

  /**
   * Check if section has enrollments
   * GET /api/sections/{sectionId}/has-enrollments
   * @param {EntityId} sectionId - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if section has enrollments
   */
  hasEnrollmentsInSection(sectionId: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`/sections/${sectionId}/has-enrollments`)
  },

  /**
   * Check if section has schedules
   * GET /api/sections/{sectionId}/has-schedules
   * @param {EntityId} sectionId - Section ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if section has schedules
   */
  hasSchedulesInSection(sectionId: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`/sections/${sectionId}/has-schedules`)
  },
}
