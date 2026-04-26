import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from '@/api'
import { normalizePublicEntityId } from '@/utils/entityIdNormalization'

const CLASSROOM_ENDPOINT = '/classrooms'

export interface ClassroomDto {
  id: EntityId
  uuid?: EntityId
  numericId?: number
  name?: string
  [key: string]: unknown
}

export type ClassroomPayload = Record<string, unknown>

export default {
  /**
   * Get all classrooms
   * GET /api/classrooms
   */
  async getAllClassrooms(): Promise<AxiosResponse<ClassroomDto[]>> {
    const response = await api.get<ClassroomDto[]>(CLASSROOM_ENDPOINT)
    response.data = normalizePublicEntityId(response.data)
    return response
  },

  /**
   * Get classroom by ID
   * GET /api/classrooms/{id}
   * @param {EntityId} id - Classroom ID (string UUID)
   * @returns {Promise<AxiosResponse<ClassroomDto>>} Classroom details
   */
  getClassroomById(id: EntityId): Promise<AxiosResponse<ClassroomDto>> {
    return api.get<ClassroomDto>(`${CLASSROOM_ENDPOINT}/${id}`)
  },

  /**
   * Create new classroom
   * POST /api/classrooms
   * @param {ClassroomPayload} data - Classroom data
   * @returns {Promise<AxiosResponse<ClassroomDto>>} Created classroom
   */
  createClassroom(data: ClassroomPayload): Promise<AxiosResponse<ClassroomDto>> {
    return api.post<ClassroomDto>(CLASSROOM_ENDPOINT, data)
  },

  /**
   * Update classroom record
   * PATCH /api/classrooms/{id}
   * @param {EntityId} id - Classroom ID (string UUID)
   * @param {ClassroomPayload} data - Classroom data to update
   * @returns {Promise<AxiosResponse<ClassroomDto>>} Updated classroom
   */
  updateClassroom(id: EntityId, data: ClassroomPayload): Promise<AxiosResponse<ClassroomDto>> {
    return api.patch<ClassroomDto>(`${CLASSROOM_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete classroom by ID
   * DELETE /api/classrooms/{id}
   * @param {EntityId} id - Classroom ID (string UUID)
   * @returns {Promise<AxiosResponse<unknown>>} Deletion confirmation
   */
  deleteClassroom(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`${CLASSROOM_ENDPOINT}/${id}`)
  },

  /**
   * Check if classroom has schedules assigned
   * GET /api/classrooms/{id}/has-schedules
   * @param {EntityId} id - Classroom ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if classroom has schedules
   */
  hasSchedulesInClassroom(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${CLASSROOM_ENDPOINT}/${id}/has-schedules`)
  },

  /**
   * Check if classroom has sessions using ActualRoomId
   * GET /api/classrooms/{id}/has-sessions
   * @param {EntityId} id - Classroom ID (string UUID)
   * @returns {Promise<AxiosResponse<boolean>>} True if classroom has sessions
   */
  hasSessionsInClassroom(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${CLASSROOM_ENDPOINT}/${id}/has-sessions`)
  },
}
