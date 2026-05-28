import type { EntityId } from '@/types'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRecord {
  id: EntityId
  studentId: EntityId
  sessionId: EntityId
  status: AttendanceStatus
  notes: string
}

export interface SessionAttendanceRecord extends AttendanceRecord {
  studentNumber: string
  studentName: string
  checkInTime: string
}

export interface AttendanceSummary {
  totalSessions: number
  totalEnrolled: number
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalExcused: number
  attendanceRate: number
  averageCheckInTime: string
  mostFrequentStatus: string
}
