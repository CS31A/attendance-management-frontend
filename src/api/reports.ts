import type { EntityId } from '@/types'
import api from '@/api'

// ==================== QUERY PARAMS ====================

export interface ReportsFilter {
  startDate?: string
  endDate?: string
  sectionId?: number
  studentId?: number
  sessionId?: number
  scheduleId?: number
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
  id: number
  sessionId: number
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
  studentId: number
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
  sessionId: number
  sessionDate: string
  scheduleId: number
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
  studentId: number
  studentName: string
  studentNumber: string
  attendanceRecordId?: number
  status: string
  checkInTime?: string
  isManualEntry: boolean
}

export interface SessionAttendanceStatsDto {
  sessionId: number
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
  sectionId: number
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
  instructorId: number
  instructorName: string
  totalSessions: number
  sessions: InstructorSessionItemDto[]
}

// ==================== API CALLS ====================

export async function fetchReportsSummary(params: ReportsFilter = {}): Promise<AttendanceSummaryReportDto> {
  const response = await api.get('/reports/attendance-summary', { params })
  return response.data
}

export async function fetchStudentAttendanceReport(studentId: EntityId): Promise<StudentAttendanceReportDto> {
  const response = await api.get(`/reports/student-attendance/${studentId}`)
  return response.data
}

export async function fetchSessionAttendanceReport(sessionId: EntityId): Promise<SessionAttendanceReportDto> {
  const response = await api.get(`/reports/session-attendance/${sessionId}`)
  return response.data
}

export async function fetchClassAttendanceReport(
  sectionId: EntityId,
  params: ReportsFilter = {},
): Promise<ClassAttendanceSummaryReportDto> {
  const response = await api.get(`/reports/class-attendance/${sectionId}`, { params })
  return response.data
}

export async function fetchInstructorSessionsReport(
  instructorId: EntityId,
  params: ReportsFilter = {},
): Promise<InstructorSessionsReportDto> {
  const response = await api.get(`/reports/instructor-sessions/${instructorId}`, { params })
  return response.data
}

// ==================== EXPORT HELPERS ====================

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

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

export async function exportToXlsx(rows: Record<string, unknown>[], filename: string): Promise<void> {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, filename)
}
