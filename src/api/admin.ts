import type { EntityId, PaginationParams } from '@/types'
import type { ApiUser, ApiUserProfile } from '@/types/user'
import axios from 'axios'
import api from '@/api'


// Helper function to map user profile data from API response to flat structure
export function mapUserProfile(user: ApiUser): ApiUser {
  // Normalize legacy 'Teacher' role to 'Instructor'
  const normalizedRole = user.role === 'Teacher' ? 'Instructor' : user.role

  // Extract base fields
  const mappedUser: ApiUser = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: normalizedRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isDeleted: user.isDeleted,
  }

  // Map profile data based on role
  if (normalizedRole === 'Admin' && user.adminProfile) {
    mappedUser.firstName = user.adminProfile.firstname
    mappedUser.lastName = user.adminProfile.lastname
    mappedUser.profileId = user.adminProfile.id
    mappedUser.createdAt = user.adminProfile.createdAt
    mappedUser.updatedAt = user.adminProfile.updatedAt
  }
  else if (normalizedRole === 'Instructor' && user.instructorProfile) {
    mappedUser.firstName = user.instructorProfile.firstname
    mappedUser.lastName = user.instructorProfile.lastname
    mappedUser.department = user.instructorProfile.department ?? null
    mappedUser.profileId = user.instructorProfile.id
    mappedUser.createdAt = user.instructorProfile.createdAt
    mappedUser.updatedAt = user.instructorProfile.updatedAt
  }
  else if (normalizedRole === 'Student' && user.studentProfile) {
    mappedUser.firstName = user.studentProfile.firstname
    mappedUser.lastName = user.studentProfile.lastname
    mappedUser.sectionId = user.studentProfile.sectionId
    mappedUser.isRegular = user.studentProfile.isRegular
    mappedUser.profileId = user.studentProfile.id
    mappedUser.createdAt = user.studentProfile.createdAt
    mappedUser.updatedAt = user.studentProfile.updatedAt
  }

  return mappedUser
}
/**
 * Admin API service for dashboard data
 */

export type DashboardQueryParams = PaginationParams & {
  startDate?: string
  endDate?: string
  sectionId?: EntityId
}

export type AdminMetricDto = Record<string, unknown>
export type AdminCollectionDto = AdminMetricDto[]

// System Health - uses root path (not /api) since health endpoints are mapped at root level
export async function fetchSystemHealth(): Promise<AdminMetricDto> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  // Remove '/api' suffix if present to get the root base URL
  const rootBaseURL = baseURL.replace(/\/api$/, '')

  const response = await axios.get(`${rootBaseURL}/health`, {
    withCredentials: true,
    timeout: 5000,
  })
  const data = response.data

  // Transform backend health check response to frontend format
  // Backend: { status: "Healthy", checks: [{ name: "database", data: { connected: true } }] }
  // Frontend expects: { status: "healthy", database: { connected: true } }
  const databaseCheck = data.checks?.find((check: { name: string }) => check.name === 'database')

  return {
    status: data.status?.toLowerCase() ?? 'unhealthy',
    timestamp: data.timestamp,
    database: {
      connected: databaseCheck?.data?.connected ?? false,
    },
  }
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
