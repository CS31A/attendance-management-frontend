import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import api from './index'

export interface SectionDto {
  id: EntityId
  name?: string
  [key: string]: unknown
}

export interface StudentDto {
  id: EntityId
  [key: string]: unknown
}

export type SectionPayload = Record<string, unknown>

export default {
  getAllSections(): Promise<AxiosResponse<SectionDto[]>> {
    return api.get<SectionDto[]>('/sections')
  },

  getSection(id: EntityId): Promise<AxiosResponse<SectionDto>> {
    return api.get<SectionDto>(`/sections/${id}`)
  },

  createSection(data: SectionPayload): Promise<AxiosResponse<SectionDto>> {
    return api.post<SectionDto>('/sections', data)
  },

  updateSection(id: EntityId, data: SectionPayload): Promise<AxiosResponse<SectionDto>> {
    return api.put<SectionDto>(`/sections/${id}`, data)
  },

  deleteSection(id: EntityId): Promise<AxiosResponse<unknown>> {
    return api.delete(`/sections/${id}`)
  },

  getActiveStudents(sectionId: EntityId): Promise<AxiosResponse<StudentDto[]>> {
    return api.get<StudentDto[]>(`/sections/${sectionId}/active-students`)
  },

  getAllStudents(sectionId: EntityId): Promise<AxiosResponse<StudentDto[]>> {
    return api.get<StudentDto[]>(`/sections/${sectionId}/all-students`)
  },

  hasStudentsInSection(sectionId: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`/sections/${sectionId}/has-students`)
  },

  hasEnrollmentsInSection(sectionId: EntityId): Promise<AxiosResponse<boolean>> {
    return api.get<boolean>(`/sections/${sectionId}/has-enrollments`)
  },
}
