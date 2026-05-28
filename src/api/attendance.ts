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

import type { AttendanceStatus } from '@/types/domain/attendance'
export type { AttendanceStatus }

/** PascalCase status values required by backend write operations ('Present' | 'Absent' | 'Late' | 'Excused') */
export type BackendAttendanceStatus = Capitalize<AttendanceStatus>

export interface AttendanceResponseDto {
  id: EntityId
  studentId: EntityId
  sessionId: EntityId
  status: AttendanceStatus
  notes?: string
}

export interface SessionAttendanceResponseDto extends AttendanceResponseDto {
  studentNumber?: string
  studentName?: string
  checkInTime?: string
}

export interface SessionAttendanceSummaryDto {
  sessionId: EntityId
  sessionDate: string
  scheduleId: EntityId
  scheduleTitle: string
  subjectName: string
  sectionName: string
  totalEnrolled: number
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  attendanceRate: number
  attendanceRecords: SessionAttendanceResponseDto[]
}

export interface AttendanceSummaryDto {
  totalSessions?: number
  totalEnrolled?: number
  totalPresent?: number
  totalLate?: number
  totalAbsent?: number
  totalExcused?: number
  attendanceRate?: number
  averageCheckInTime?: string
  mostFrequentStatus?: string
}

export type AttendanceQueryParams = PaginationParams & {
  date?: string
  startDate?: string
  endDate?: string
  sessionId?: EntityId
  studentId?: EntityId
  sectionId?: EntityId
}

export interface StudentAttendance {
  id?: EntityId
  studentId: EntityId
  status: AttendanceStatus
  notes?: string
  checkInTime?: string
}

export interface RecordAttendancePayload {
  sessionId: EntityId
  records: StudentAttendance[]
}

export interface CreateAttendancePayload {
  studentId: EntityId
  status: BackendAttendanceStatus
  notes?: string
  checkInTime?: string
  sessionId: EntityId
}

export interface UpdateAttendancePayload {
  status?: BackendAttendanceStatus
  notes?: string
}

export interface AttendanceUpdateInput {
  status?: AttendanceStatus
  notes?: string
}

interface SessionAttendanceResponse {
  attendanceRecords?: SessionAttendanceResponseDto[]
}

interface AttendancePagedResponse {
  items?: AttendanceResponseDto[]
}

interface StudentAttendanceHistoryResponse {
  attendanceRecords?: AttendanceResponseDto[]
}

/**
 * Normalize backend PascalCase status to frontend lowercase
 * Backend returns 'Present' | 'Absent' | 'Late' | 'Excused'
 * Frontend expects 'present' | 'absent' | 'late' | 'excused'
 */
function normalizeStatus(status: string): AttendanceStatus {
  const normalized = status.toLowerCase()
  return isValidAttendanceStatus(normalized) ? normalized : 'absent'
}

function normalizeAttendanceRecord(record: AttendanceResponseDto): AttendanceResponseDto {
  return {
    ...record,
    status: normalizeStatus(record.status),
  }
}

function extractAttendanceRecords(data: AttendanceResponseDto[] | AttendancePagedResponse | StudentAttendanceHistoryResponse): AttendanceResponseDto[] {
  if (Array.isArray(data))
    return data

  if ('items' in data && Array.isArray(data.items))
    return data.items

  if ('attendanceRecords' in data && Array.isArray(data.attendanceRecords))
    return data.attendanceRecords

  return []
}

export function toAttendanceRecord(dto: AttendanceResponseDto): {
  id: EntityId
  studentId: EntityId
  sessionId: EntityId
  status: AttendanceStatus
  notes: string
} {
  const normalized = (dto.status ?? 'absent').toLowerCase()
  return {
    id: dto.id,
    studentId: dto.studentId,
    sessionId: dto.sessionId,
    status: isValidAttendanceStatus(normalized) ? normalized : 'absent',
    notes: dto.notes ?? '',
  }
}

export function toSessionAttendanceRecord(dto: SessionAttendanceResponseDto): {
  id: EntityId
  studentId: EntityId
  sessionId: EntityId
  status: AttendanceStatus
  notes: string
  studentNumber: string
  studentName: string
  checkInTime: string
} {
  return {
    ...toAttendanceRecord(dto),
    studentNumber: dto.studentNumber ?? '',
    studentName: dto.studentName ?? '',
    checkInTime: dto.checkInTime ?? '',
  }
}

export function toAttendanceSummary(dto: AttendanceSummaryDto): {
  totalSessions: number
  totalEnrolled: number
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalExcused: number
  attendanceRate: number
  averageCheckInTime: string
  mostFrequentStatus: string
} {
  return {
    totalSessions: dto.totalSessions ?? 0,
    totalEnrolled: dto.totalEnrolled ?? 0,
    totalPresent: dto.totalPresent ?? 0,
    totalLate: dto.totalLate ?? 0,
    totalAbsent: dto.totalAbsent ?? 0,
    totalExcused: dto.totalExcused ?? 0,
    attendanceRate: dto.attendanceRate ?? 0,
    averageCheckInTime: dto.averageCheckInTime ?? '',
    mostFrequentStatus: dto.mostFrequentStatus ?? '',
  }
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
  const records = extractAttendanceRecords(response.data)
  return records.map(normalizeAttendanceRecord)
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
  return normalizeAttendanceRecord(response.data)
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
  const records = extractAttendanceRecords(response.data)
  return records.map(normalizeAttendanceRecord)
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
  const records: SessionAttendanceResponseDto[] = response.data.attendanceRecords || []
  return records.map(record => ({
    ...record,
    status: normalizeStatus(record.status),
  }))
}

/**
 * Fetch full session attendance report with summary statistics
 *
 * Returns complete session attendance data including summary counts
 * and individual student records.
 *
 * @param {EntityId} sessionId - Session ID
 * @returns {Promise<SessionAttendanceSummaryDto>} Session attendance summary with records
 * @throws {Error} 404 if session not found
 */
export async function fetchSessionAttendanceSummary(sessionId: EntityId): Promise<SessionAttendanceSummaryDto> {
  const response = await api.get(`/attendance/session/${sessionId}`)
  const data = response.data
  return {
    sessionId: data.sessionId,
    sessionDate: data.sessionDate,
    scheduleId: data.scheduleId,
    scheduleTitle: data.scheduleTitle,
    subjectName: data.subjectName,
    sectionName: data.sectionName,
    totalEnrolled: data.totalEnrolled,
    presentCount: data.presentCount,
    lateCount: data.lateCount,
    absentCount: data.absentCount,
    excusedCount: data.excusedCount,
    attendanceRate: data.attendanceRate,
    attendanceRecords: (data.attendanceRecords || []).map((record: SessionAttendanceResponseDto) => ({
      ...record,
      status: normalizeStatus(record.status),
    })),
  }
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

/**
 * Create a single attendance record.
 *
 * Backend write models require PascalCase status values ('Present', 'Absent', 'Late', 'Excused').
 * Callers must map lowercase UI status values before invoking this method.
 * Omit checkInTime if undefined to avoid sending null/undefined to the backend.
 *
 * @param {CreateAttendancePayload} payload - Attendance create payload
 * @returns {Promise<AttendanceResponseDto>} Created attendance record with lowercase status
 * @throws {Error} 400 for validation errors, 403 for authorization errors, 409 for conflicts
 */
export async function createAttendance(
  payload: CreateAttendancePayload,
): Promise<AttendanceResponseDto> {
  const response = await api.post('/attendance', payload)
  return normalizeAttendanceRecord(response.data)
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
  return normalizeAttendanceRecord(response.data)
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
