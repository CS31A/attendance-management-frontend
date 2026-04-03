import type { AttendanceStatus } from '@/api/attendance'

export interface EditableAttendanceRecord {
  studentId: number
  status: AttendanceStatus
  notes?: string
  studentName?: string
  studentNumber?: string
  checkInTime?: string
  originalStatus?: AttendanceStatus | null
  originalNotes?: string
  [key: string]: unknown
}

export function normalizeNotes(notes: unknown): string {
  return typeof notes === 'string' ? notes : ''
}

export function hasUnsavedAttendanceChanges(record: EditableAttendanceRecord): boolean {
  return record.status !== record.originalStatus
    || normalizeNotes(record.notes) !== normalizeNotes(record.originalNotes)
}

export function mergeAttendanceWithLocalChanges(
  incomingRecords: EditableAttendanceRecord[],
  previousRecords: EditableAttendanceRecord[],
): EditableAttendanceRecord[] {
  const previousByStudentId = new Map(previousRecords.map(record => [record.studentId, record]))

  return incomingRecords.map((record) => {
    const previousRecord = previousByStudentId.get(record.studentId)
    const preserveLocalChanges = previousRecord ? hasUnsavedAttendanceChanges(previousRecord) : false
    const nextNotes = preserveLocalChanges
      ? normalizeNotes(previousRecord?.notes)
      : normalizeNotes(record.notes) || normalizeNotes(previousRecord?.notes)

    return {
      ...previousRecord,
      ...record,
      studentName: record.studentName || previousRecord?.studentName,
      studentNumber: record.studentNumber || previousRecord?.studentNumber,
      checkInTime: record.checkInTime || previousRecord?.checkInTime,
      status: preserveLocalChanges ? previousRecord!.status : record.status,
      notes: nextNotes,
      originalStatus: record.status,
      originalNotes: normalizeNotes(record.notes),
    }
  })
}
