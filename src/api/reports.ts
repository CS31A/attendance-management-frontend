import type { EntityId } from '@/types'
import api from '@/api'

// ==================== QUERY PARAMS ====================

export interface ReportsFilter {
  startDate?: string
  endDate?: string
  sectionId?: EntityId
  studentId?: EntityId
  sessionId?: EntityId
  scheduleId?: EntityId
}

// ==================== RESPONSE TYPES ====================

export interface AttendanceSummaryReportDto {
  totalSessions: number
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalExcused: number
  attendanceRate: number
  averageCheckInTime?: string
  mostFrequentStatus: string
}

export interface AttendanceRecordItemDto {
  id: EntityId
  sessionId: EntityId
  sessionDate: string
  status: string
  checkInTime?: string
  notes?: string
  subjectName: string
  sectionName: string
  scheduleTitle: string
  isManualEntry: boolean
}

export interface StudentAttendanceReportDto {
  studentId: EntityId
  studentName: string
  studentNumber: string
  totalSessions: number
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  attendancePercentage: number
  attendanceRecords: AttendanceRecordItemDto[]
}

export interface SessionAttendanceReportDto {
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
  attendanceRate: number
  attendanceRecords: SessionAttendanceRecordItemDto[]
}

export interface SessionAttendanceRecordItemDto {
  studentId: EntityId
  studentName: string
  studentNumber: string
  attendanceRecordId?: EntityId
  status: string
  checkInTime?: string
  isManualEntry: boolean
}

export interface SessionAttendanceStatsDto {
  sessionId: EntityId
  sessionDate: string
  subjectName: string
  scheduleTitle: string
  status: string
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  totalRecords: number
  totalEnrolled: number
  attendanceRate: number
}

export interface ClassAttendanceSummaryReportDto {
  sectionId: EntityId
  sectionName: string
  totalSessions: number
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalExcused: number
  attendanceRate: number
  sessions: SessionAttendanceStatsDto[]
}

export interface InstructorSessionItemDto extends SessionAttendanceStatsDto {
  sectionName: string
}

export interface InstructorSessionsReportDto {
  instructorId: EntityId
  instructorName: string
  totalSessions: number
  sessions: InstructorSessionItemDto[]
}

// ==================== API CALLS ====================

/**
 * Fetch attendance summary report with optional filters
 * @param {ReportsFilter} params - Optional filter parameters (date range, entity IDs)
 * @returns {Promise<AttendanceSummaryReportDto>} Attendance summary statistics
 */
export async function fetchReportsSummary(params: ReportsFilter = {}): Promise<AttendanceSummaryReportDto> {
  const response = await api.get('/reports/attendance-summary', { params })
  return response.data
}

/**
 * Fetch detailed attendance report for a specific student
 * @param {EntityId} studentId - Student ID (string UUID)
 * @returns {Promise<StudentAttendanceReportDto>} Student attendance report with records
 */
export async function fetchStudentAttendanceReport(studentId: EntityId): Promise<StudentAttendanceReportDto> {
  const response = await api.get(`/reports/student-attendance/${studentId}`)
  return response.data
}

/**
 * Fetch attendance report for a specific session
 * @param {EntityId} sessionId - Session ID (string UUID)
 * @returns {Promise<SessionAttendanceReportDto>} Session attendance report with student records
 */
export async function fetchSessionAttendanceReport(sessionId: EntityId): Promise<SessionAttendanceReportDto> {
  const response = await api.get(`/reports/session-attendance/${sessionId}`)
  return response.data
}

/**
 * Fetch attendance summary report for a class/section
 * @param {EntityId} sectionId - Section ID (string UUID)
 * @param {ReportsFilter} params - Optional filter parameters (date range)
 * @returns {Promise<ClassAttendanceSummaryReportDto>} Class attendance summary with session stats
 */
export async function fetchClassAttendanceReport(
  sectionId: EntityId,
  params: ReportsFilter = {},
): Promise<ClassAttendanceSummaryReportDto> {
  const response = await api.get(`/reports/class-attendance/${sectionId}`, { params })
  return response.data
}

/**
 * Fetch sessions report for a specific instructor
 * @param {EntityId} instructorId - Instructor ID (string UUID)
 * @param {ReportsFilter} params - Optional filter parameters (date range)
 * @returns {Promise<InstructorSessionsReportDto>} Instructor sessions report with attendance stats
 */
export async function fetchInstructorSessionsReport(
  instructorId: EntityId,
  params: ReportsFilter = {},
): Promise<InstructorSessionsReportDto> {
  const response = await api.get(`/reports/instructor-sessions/${instructorId}`, { params })
  return response.data
}

// ==================== EXPORT HELPERS ====================

/**
 * Trigger a file download in the browser
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Name for the downloaded file
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV format and trigger download
 * @param {Record<string, unknown>[]} rows - Array of data objects to export
 * @param {string} filename - Name for the CSV file
 */
export function exportToCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0)
    return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => JSON.stringify(row[h] ?? '')).join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

/**
 * Export data to XLSX format and trigger download
 * @param {Record<string, unknown>[]} rows - Array of data objects to export
 * @param {string} filename - Name for the XLSX file
 * @returns {Promise<void>}
 */
export async function exportToXlsx(rows: Record<string, unknown>[], filename: string): Promise<void> {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, filename)
}
