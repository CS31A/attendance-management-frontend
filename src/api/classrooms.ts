import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from '@/api'

const CLASSROOM_ENDPOINT = '/classrooms'

export interface ClassroomDto {
  id: EntityId
  name?: string
  [key: string]: unknown
}

export type ClassroomPayload = Record<string, unknown>

export default {
  /**
   * Get all classrooms
   * GET /api/classrooms
   */
  getAllClassrooms(): Promise<AxiosResponse<ClassroomDto[]>> {
    return api.get<ClassroomDto[]>(CLASSROOM_ENDPOINT)
  },

  /**
   * Get classroom by ID
   * GET /api/classrooms/{id}
   */
  getClassroomById(id: EntityId): Promise<AxiosResponse<ClassroomDto>> {
    return api.get<ClassroomDto>(`${CLASSROOM_ENDPOINT}/${id}`)
  },

  /**
   * Create new classroom
   * POST /api/classrooms
   */
  createClassroom(data: ClassroomPayload): Promise<AxiosResponse<ClassroomDto>> {
    return api.post<ClassroomDto>(CLASSROOM_ENDPOINT, data)
  },

  /**
   * Update classroom record
   * PATCH /api/classrooms/{id}
   */
  updateClassroom(id: EntityId, data: ClassroomPayload): Promise<AxiosResponse<ClassroomDto>> {
    return api.patch<ClassroomDto>(`${CLASSROOM_ENDPOINT}/${id}`, data)
  },

  /**
   * Delete classroom by ID
   * DELETE /api/classrooms/{id}
   */
  deleteClassroom(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`${CLASSROOM_ENDPOINT}/${id}`)
  },

  /**
   * Check if classroom has schedules assigned
   * GET /api/classrooms/{id}/has-schedules
   */
  hasSchedulesInClassroom(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${CLASSROOM_ENDPOINT}/${id}/has-schedules`)
  },

  /**
   * Check if classroom has sessions using ActualRoomId
   * GET /api/classrooms/{id}/has-sessions
   */
  hasSessionsInClassroom(id: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`${CLASSROOM_ENDPOINT}/${id}/has-sessions`)
  },
}
