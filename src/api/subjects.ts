import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from '@/api'

const SUBJECT_ENDPOINT = '/subjects'

export interface SubjectDto {
  id: EntityId
  name?: string
  [key: string]: unknown
}

export type SubjectPayload = Record<string, unknown>

export default {
  /**
   * Get all subjects
   * GET /api/subjects
   */
  getAllSubjects(): Promise<AxiosResponse<SubjectDto[]>> {
    return api.get<SubjectDto[]>(SUBJECT_ENDPOINT)
  },

  /**
   * Get subject by ID
   * GET /api/subjects/{id}
   */
  getSubjectById(id: EntityId): Promise<AxiosResponse<SubjectDto>> {
    return api.get<SubjectDto>(`${SUBJECT_ENDPOINT}/${id}`)
  },

  /**
   * Create new subject
   * POST /api/subjects
   */
  createSubject(data: SubjectPayload): Promise<AxiosResponse<SubjectDto>> {
    return api.post<SubjectDto>(SUBJECT_ENDPOINT, data)
  },

  /**
   * Update subject record
   * PATCH /api/subjects/{id}
   */
  updateSubject(id: EntityId, data: SubjectPayload): Promise<AxiosResponse<SubjectDto>> {
    return api.patch<SubjectDto>(`${SUBJECT_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete subject by ID
   * DELETE /api/subjects/{id}
   */
  deleteSubject(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`${SUBJECT_ENDPOINT}/${id}`)
  },

  /**
   * Check if subject has schedules assigned
   * GET /api/subjects/{id}/has-schedules
   */
  hasSchedulesInSubject(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${SUBJECT_ENDPOINT}/${id}/has-schedules`)
  },

  /**
   * Check if subject has student enrollments
   * GET /api/subjects/{id}/has-enrollments
   */
  hasEnrollmentsInSubject(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${SUBJECT_ENDPOINT}/${id}/has-enrollments`)
  },
}
