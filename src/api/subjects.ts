import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from '@/api'
import { normalizePublicEntityId } from '@/utils/entityIdNormalization'

const SUBJECT_ENDPOINT = '/subjects'

export interface SubjectDto {
  id: EntityId
  uuid?: EntityId
  numericId?: number
  name?: string
  [key: string]: unknown
}

export type SubjectPayload = Record<string, unknown>

export default {
  /**
   * Get all subjects
   * GET /api/subjects
   */
  async getAllSubjects(): Promise<AxiosResponse<SubjectDto[]>> {
    const response = await api.get<SubjectDto[]>(SUBJECT_ENDPOINT)
    response.data = normalizePublicEntityId(response.data)
    return response
  },

  /**
   * Get subject by ID
   * GET /api/subjects/{id}
   * @param {EntityId} id - Subject ID (string UUID)
   * @returns {Promise<AxiosResponse<SubjectDto>>} Subject details
   */
  getSubjectById(id: EntityId): Promise<AxiosResponse<SubjectDto>> {
    return api.get<SubjectDto>(`${SUBJECT_ENDPOINT}/${id}`)
  },

  /**
   * Create new subject
   * POST /api/subjects
   * @param {SubjectPayload} data - Subject data
   * @returns {Promise<AxiosResponse<SubjectDto>>} Created subject
   */
  createSubject(data: SubjectPayload): Promise<AxiosResponse<SubjectDto>> {
    return api.post<SubjectDto>(SUBJECT_ENDPOINT, data)
  },

  /**
   * Update subject record
   * PATCH /api/subjects/{id}
   * @param {EntityId} id - Subject ID (string UUID)
   * @param {SubjectPayload} data - Subject data to update
   * @returns {Promise<AxiosResponse<SubjectDto>>} Updated subject
   */
  updateSubject(id: EntityId, data: SubjectPayload): Promise<AxiosResponse<SubjectDto>> {
    return api.patch<SubjectDto>(`${SUBJECT_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete subject by ID
   * DELETE /api/subjects/{id}
   * @param {EntityId} id - Subject ID (string UUID)
   * @returns {Promise<AxiosResponse<unknown>>} Deletion confirmation
   */
  deleteSubject(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`${SUBJECT_ENDPOINT}/${id}`)
  },

  /**
   * Check if subject has schedules assigned
   * GET /api/subjects/{id}/has-schedules
   * @param {EntityId} id - Subject ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if subject has schedules
   */
  hasSchedulesInSubject(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${SUBJECT_ENDPOINT}/${id}/has-schedules`)
  },

  /**
   * Check if subject has student enrollments
   * GET /api/subjects/{id}/has-enrollments
   * @param {EntityId} id - Subject ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if subject has enrollments
   */
  hasEnrollmentsInSubject(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${SUBJECT_ENDPOINT}/${id}/has-enrollments`)
  },
}
