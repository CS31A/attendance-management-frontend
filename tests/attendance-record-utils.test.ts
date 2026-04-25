import type { EditableAttendanceRecord } from '@/utils/attendanceRecord'
import { describe, expect, it } from 'vitest'
import { hasUnsavedAttendanceChanges, mergeAttendanceWithLocalChanges } from '@/utils/attendanceRecord'

function createEditableAttendanceRecord(
  overrides: Partial<EditableAttendanceRecord> = {},
): EditableAttendanceRecord {
  return {
    studentId: '1',
    status: 'present',
    ...overrides,
  }
}

describe('attendance record helpers', () => {
  it('preserves unsaved local changes during background refresh', () => {
    const previousRecords: EditableAttendanceRecord[] = [
      createEditableAttendanceRecord({
        id: 11,
        studentId: '1',
        sessionId: '9',
        status: 'late',
        notes: 'Traffic',
        originalStatus: 'present',
        originalNotes: '',
        studentName: 'Alice',
        studentNumber: '2024-001',
      }),
    ]

    const incomingRecords: EditableAttendanceRecord[] = [
      createEditableAttendanceRecord({
        id: 11,
        studentId: '1',
        sessionId: '9',
        status: 'present',
        notes: '',
        studentName: 'Alice Santos',
        studentNumber: '2024-001',
        checkInTime: '08:05:00',
      }),
    ]

    const [merged] = mergeAttendanceWithLocalChanges(incomingRecords, previousRecords)

    expect(merged.status).toBe('late')
    expect(merged.notes).toBe('Traffic')
    expect(merged.originalStatus).toBe('present')
    expect(merged.originalNotes).toBeUndefined()
    expect(merged.studentName).toBe('Alice Santos')
    expect(merged.checkInTime).toBe('08:05:00')
    expect(hasUnsavedAttendanceChanges(merged)).toBe(true)
  })

  it('accepts refreshed server data when there are no unsaved edits', () => {
    const previousRecords: EditableAttendanceRecord[] = [
      createEditableAttendanceRecord({
        id: 22,
        studentId: '2',
        sessionId: '9',
        status: 'present',
        notes: '',
        originalStatus: 'present',
        originalNotes: '',
        studentName: 'Bob',
        studentNumber: '2024-002',
      }),
    ]

    const incomingRecords: EditableAttendanceRecord[] = [
      createEditableAttendanceRecord({
        id: 22,
        studentId: '2',
        sessionId: '9',
        status: 'excused',
        notes: 'Clinic visit',
        checkInTime: '09:15:00',
      }),
    ]

    const [merged] = mergeAttendanceWithLocalChanges(incomingRecords, previousRecords)

    expect(merged.status).toBe('excused')
    expect(merged.notes).toBe('Clinic visit')
    expect(merged.studentName).toBe('Bob')
    expect(merged.studentNumber).toBe('2024-002')
    expect(merged.originalStatus).toBe('excused')
    expect(merged.originalNotes).toBe('Clinic visit')
    expect(hasUnsavedAttendanceChanges(merged)).toBe(false)
  })
})
