import type { PaginationParams } from '@/types'
import api from '@/api'

/**
 * Admin API service for dashboard data
 */

export interface DashboardQueryParams extends PaginationParams {
  startDate?: string
  endDate?: string
  sectionId?: number
}

export type AdminMetricDto = Record<string, unknown>
export type AdminCollectionDto = AdminMetricDto[]

// System Health
export async function fetchSystemHealth(): Promise<AdminMetricDto> {
  const response = await api.get('/health')
  return response.data
}

// Attendance Summary
export async function fetchAttendanceSummary(
  params: DashboardQueryParams = {},
): Promise<AdminMetricDto> {
  const response = await api.get('/attendance/summary', { params })
  return response.data
}

// Active Sessions
export async function fetchActiveSessions(): Promise<AdminCollectionDto> {
  const response = await api.get('/sessions/status/active')
  return response.data
}

// Upcoming Sessions
export async function fetchUpcomingSessions(): Promise<AdminCollectionDto> {
  const response = await api.get('/sessions/status/not_started')
  return response.data
}

// Users
export async function fetchUsers(): Promise<AdminCollectionDto> {
  const response = await api.get('/users')
  return response.data
}

// Students
export async function fetchStudents(): Promise<AdminCollectionDto> {
  const response = await api.get('/students')
  return response.data
}

// Instructors
export async function fetchInstructors(): Promise<AdminCollectionDto> {
  const response = await api.get('/instructors')
  return response.data
}

// All Sessions
export async function fetchSessions(
  params: DashboardQueryParams = {},
): Promise<AdminCollectionDto> {
  const response = await api.get('/sessions', { params })
  return response.data
}

// Courses
export async function fetchCourses(): Promise<AdminCollectionDto> {
  const response = await api.get('/course')
  return response.data
}

// Sections
export async function fetchSections(): Promise<AdminCollectionDto> {
  const response = await api.get('/sections')
  return response.data
}

// Classrooms
export async function fetchClassrooms(): Promise<AdminCollectionDto> {
  const response = await api.get('/classrooms')
  return response.data
}
