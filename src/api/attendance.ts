import type { ApiEnvelope, EntityId, PaginationParams } from '@/types'
import api from '@/api'

/**
 * Attendance API service for managing student attendance records
 *
 * This module provides functions for all attendance-related operations
 * including recording, retrieving, and updating attendance data.
 * All functions return promises and handle errors through axios interceptors.
 *
 * @module api/attendance
 */

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type BackendAttendanceStatus = Capitalize<AttendanceStatus>

export interface AttendanceResponseDto {
  id: number
  studentId: number
  sessionId: number
  status: AttendanceStatus
  notes?: string
  [key: string]: unknown
}

export interface SessionAttendanceResponseDto extends AttendanceResponseDto {
  studentNumber?: string
  studentName?: string
  checkInTime?: string
}

export interface AttendanceSummaryDto {
  total?: number
  presentCount?: number
  absentCount?: number
  lateCount?: number
  excusedCount?: number
  [key: string]: unknown
}

export interface AttendanceQueryParams extends PaginationParams {
  date?: string
  startDate?: string
  endDate?: string
  sessionId?: number
  studentId?: number
  sectionId?: number
}

export interface StudentAttendance {
  id?: EntityId
  studentId: number
  status: AttendanceStatus
  notes?: string
  checkInTime?: string
}

export interface RecordAttendancePayload {
  sessionId: number
  records: StudentAttendance[]
}

export interface CreateAttendancePayload {
  studentId: number
  status: BackendAttendanceStatus
  notes?: string
  checkInTime?: string
  sessionId: number
}

export interface UpdateAttendancePayload {
  status?: BackendAttendanceStatus
  notes?: string
}

export interface AttendanceUpdateInput {
  status?: AttendanceStatus
  notes?: string
}

export type AttendanceRecordResponseDto = AttendanceResponseDto

interface SessionAttendanceResponse {
  attendanceRecords?: SessionAttendanceResponseDto[]
}

// ==================== READ OPERATIONS ====================

/**
 * Fetch all attendance records
 *
 * Returns all attendance records accessible to the current user.
 * Can be filtered by query parameters.
 *
 * @param {object} [params] - Optional query parameters
 * @param {string} [params.date] - Filter by date (YYYY-MM-DD)
 * @param {number} [params.sessionId] - Filter by session ID
 * @param {number} [params.studentId] - Filter by student ID
 * @returns {Promise<Array<AttendanceResponseDto>>} Array of attendance records
 * @throws {Error} Network or authentication errors
 *
 * @example
 * const attendance = await fetchAllAttendance({ date: '2024-03-15' })
 * console.log(`Found ${attendance.length} records`)
 */
export async function fetchAllAttendance(
  params: AttendanceQueryParams = {},
): Promise<AttendanceResponseDto[]> {
  const response = await api.get('/attendance', { params })
  return response.data
}

/**
 * Fetch a single attendance record by ID
 *
 * @param {number} id - Attendance record ID
 * @returns {Promise<AttendanceResponseDto>} Attendance record object
 * @throws {Error} 404 if attendance record not found
 *
 * @example
 * const record = await fetchAttendanceById(123)
 * console.log(`Status: ${record.status}`)
 */
export async function fetchAttendanceById(id: EntityId): Promise<AttendanceResponseDto> {
  const response = await api.get(`/attendance/${id}`)
  return response.data
}

/**
 * Fetch attendance records for a specific student
 *
 * Returns all attendance records for a particular student.
 *
 * @param {number} studentId - Student ID
 * @returns {Promise<Array<AttendanceResponseDto>>} Array of attendance records
 * @throws {Error} 404 if student not found
 *
 * @example
 * const studentAttendance = await fetchStudentAttendance(456)
 * const presentCount = studentAttendance.filter(a => a.status === 'present').length
 */
export async function fetchStudentAttendance(studentId: EntityId): Promise<AttendanceResponseDto[]> {
  const response = await api.get(`/attendance/student/${studentId}`)
  return response.data
}

/**
 * Fetch attendance records for a specific session
 *
 * Returns all attendance records for a particular session,
 * including student information.
 *
 * @param {number} sessionId - Session ID
 * @returns {Promise<Array<SessionAttendanceResponseDto>>} Array of attendance records
 * @throws {Error} 404 if session not found
 *
 * @example
 * const sessionAttendance = await fetchSessionAttendance(789)
 * sessionAttendance.forEach(a => console.log(`${a.studentName}: ${a.status}`))
 */
export async function fetchSessionAttendance(sessionId: EntityId): Promise<SessionAttendanceResponseDto[]> {
  const response = await api.get<SessionAttendanceResponse>(`/attendance/session/${sessionId}`)
  // Backend returns a wrapper object with attendanceRecords array
  // Extract just the attendanceRecords array for frontend consumption
  return response.data.attendanceRecords || []
}

/**
 * Fetch attendance summary statistics
 *
 * Returns aggregate attendance statistics for reporting.
 *
 * @param {object} [params] - Optional query parameters
 * @param {string} [params.startDate] - Start date for summary (YYYY-MM-DD)
 * @param {string} [params.endDate] - End date for summary (YYYY-MM-DD)
 * @param {number} [params.sectionId] - Filter by section ID
 * @returns {Promise<AttendanceSummaryDto>} Summary statistics object
 *
 * @example
 * const summary = await fetchAttendanceSummary({ sectionId: 10 })
 * console.log(`Attendance rate: ${summary.attendanceRate}%`)
 */
export async function fetchAttendanceSummary(
  params: AttendanceQueryParams = {},
): Promise<AttendanceSummaryDto> {
  const response = await api.get('/attendance/summary', { params })
  return response.data
}

// ==================== WRITE OPERATIONS ====================

export async function createAttendance(
  payload: CreateAttendancePayload,
): Promise<AttendanceRecordResponseDto> {
  const response = await api.post('/attendance', payload)
  return response.data
}

/**
 * Update a single attendance record
 *
 * Updates an existing attendance record with new status or notes.
 *
 * @param {number} id - Attendance record ID
 * @param {UpdateAttendancePayload} payload - Update data
 * @param {('Present'|'Absent'|'Late'|'Excused')} [payload.status] - New status
 * @param {string} [payload.notes] - Updated notes
 * @returns {Promise<AttendanceResponseDto>} Updated attendance record
 * @throws {Error} 404 if record not found, 403 if not authorized
 *
 * @example
 * const updated = await updateAttendance(123, {
 *   status: 'Excused',
 *   notes: 'Medical certificate provided'
 * })
 */
export async function updateAttendance(
  id: EntityId,
  payload: UpdateAttendancePayload,
): Promise<AttendanceResponseDto> {
  const response = await api.put(`/attendance/${id}`, payload)
  return response.data
}

/**
 * Delete an attendance record
 *
 * Removes an attendance record. Use with caution.
 *
 * @param {number} id - Attendance record ID
 * @returns {Promise<void>}
 * @throws {Error} 404 if record not found, 403 if not authorized
 *
 * @example
 * await deleteAttendance(123)
 * console.log('Attendance record deleted')
 */
export async function deleteAttendance(id: EntityId): Promise<ApiEnvelope<null> | null> {
  const response = await api.delete<ApiEnvelope<null> | null>(`/attendance/${id}`)
  return response.data
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Attendance status options
 */
export const ATTENDANCE_STATUSES = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const

/**
 * Get display label for attendance status
 *
 * @param {string} status - Attendance status
 * @returns {string} Human-readable label
 *
 * @example
 * getStatusLabel('present') // Returns "Present"
 */
export function getStatusLabel(status: AttendanceStatus | string): string {
  const labels: Record<AttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
  }
  return labels[status as AttendanceStatus] || status
}

/**
 * Get CSS class for attendance status styling
 *
 * @param {string} status - Attendance status
 * @returns {string} CSS class name
 *
 * @example
 * getStatusClass('present') // Returns "status-present"
 */
export function getStatusClass(status: AttendanceStatus | string): string {
  return `status-${status}`
}

/**
 * Validate attendance status value
 *
 * @param {string} status - Status to validate
 * @returns {boolean} Whether status is valid
 *
 * @example
 * isValidAttendanceStatus('present') // true
 * isValidAttendanceStatus('invalid') // false
 */
export function isValidAttendanceStatus(status: string): status is AttendanceStatus {
  return (Object.values(ATTENDANCE_STATUSES) as string[]).includes(status)
}

/**
 * Calculate attendance statistics from records
 *
 * @param {Array<AttendanceResponseDto>} records - Attendance records
 * @returns {object} Statistics object with counts and percentages
 *
 * @example
 * const stats = calculateAttendanceStats(records)
 * console.log(`Present: ${stats.presentCount} (${stats.presentPercentage}%)`)
 */
export function calculateAttendanceStats(records: AttendanceResponseDto[]) {
  if (!records || records.length === 0) {
    return {
      total: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      presentPercentage: 0,
      absentPercentage: 0,
      latePercentage: 0,
      excusedPercentage: 0,
    }
  }

  const total = records.length
  const presentCount = records.filter(r => r.status === ATTENDANCE_STATUSES.PRESENT).length
  const absentCount = records.filter(r => r.status === ATTENDANCE_STATUSES.ABSENT).length
  const lateCount = records.filter(r => r.status === ATTENDANCE_STATUSES.LATE).length
  const excusedCount = records.filter(r => r.status === ATTENDANCE_STATUSES.EXCUSED).length

  return {
    total,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    presentPercentage: Math.round((presentCount / total) * 100),
    absentPercentage: Math.round((absentCount / total) * 100),
    latePercentage: Math.round((lateCount / total) * 100),
    excusedPercentage: Math.round((excusedCount / total) * 100),
  }
}
