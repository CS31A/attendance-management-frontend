import { describe, it, expect, expectTypeOf } from 'vitest'
import type { AttendanceRecord, SessionAttendanceRecord } from '@/types/domain/attendance'
import { toSession } from '@/api/sessions'
import { toAttendanceRecord, toSessionAttendanceRecord, toAttendanceSummary } from '@/api/attendance'
import { toSchedule, toScheduleInstructor } from '@/api/schedules'
import { toCourse } from '@/api/courses'
import { toSection } from '@/api/sections'
import { toSubject } from '@/api/subjects'
import { toClassroom } from '@/api/classrooms'
import { toEnrollment } from '@/api/enrollments'

describe('toSession', () => {
  it('maps SessionResponseDto to Session with defaults for missing fields', () => {
    const dto = { id: 'abc', status: 'notStarted' }
    const result = toSession(dto as any)
    expect(result).toEqual({
      id: 'abc',
      status: 'notStarted',
      rowVersion: '',
      sessionDate: '',
      subjectCode: '',
      subjectName: '',
      sectionName: '',
      actualStartTime: '',
      actualEndTime: '',
      scheduledRoomName: '',
      actualRoomName: '',
      scheduledStartTime: '',
      scheduledEndTime: '',
      startTime: '',
      endTime: '',
      courseCode: '',
      courseName: '',
      description: '',
      totalEnrolled: 0,
      startedByName: '',
      updatedAt: '',
      modifiedAt: '',
      roomName: '',
    })
  })

  it('preserves provided values', () => {
    const dto = {
      id: 'abc',
      status: 'active',
      rowVersion: 'v1',
      sessionDate: '2026-01-01',
      subjectCode: 'CS101',
      subjectName: 'Intro to CS',
      sectionName: 'A',
      actualStartTime: '09:00',
      actualEndTime: '10:00',
      scheduledRoomName: 'Room 101',
      actualRoomName: 'Room 202',
      scheduledStartTime: '08:00',
      scheduledEndTime: '11:00',
      startTime: '09:00',
      endTime: '10:00',
      courseCode: 'CS',
      courseName: 'Computer Science',
      description: 'Midterm review',
      totalEnrolled: 30,
      startedByName: 'Prof. Smith',
      updatedAt: '2026-01-01T10:00:00Z',
      modifiedAt: '2026-01-01T10:00:00Z',
      roomName: 'Room 101',
    }
    const result = toSession(dto as any)
    expect(result.id).toBe('abc')
    expect(result.status).toBe('active')
    expect(result.rowVersion).toBe('v1')
    expect(result.subjectCode).toBe('CS101')
    expect(result.scheduledRoomName).toBe('Room 101')
    expect(result.actualRoomName).toBe('Room 202')
    expect(result.totalEnrolled).toBe(30)
    expect(result.startedByName).toBe('Prof. Smith')
    expect(result.description).toBe('Midterm review')
  })

  it('maps all Session domain fields (24 total)', () => {
    const domainKeys = [
      'id', 'status', 'rowVersion', 'sessionDate',
      'subjectCode', 'subjectName', 'sectionName',
      'actualStartTime', 'actualEndTime',
      'scheduledRoomName', 'actualRoomName',
      'scheduledStartTime', 'scheduledEndTime',
      'startTime', 'endTime',
      'courseCode', 'courseName', 'description',
      'totalEnrolled', 'startedByName',
      'updatedAt', 'modifiedAt', 'roomName',
    ]
    const result = toSession({ id: 'x', status: 'notStarted' } as any)
    for (const key of domainKeys) {
      expect(result).toHaveProperty(key)
    }
  })

  it('does not propagate index signature fields', () => {
    const dto = { id: 'abc', status: 'notStarted', randomField: 'should not pass' }
    const result = toSession(dto as any)
    expect(result).not.toHaveProperty('randomField')
  })
})

describe('toAttendanceRecord', () => {
  it('maps AttendanceResponseDto with defaults', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: 'present' }
    const result = toAttendanceRecord(dto as any)
    expect(result).toEqual({
      id: 'a1',
      studentId: 's1',
      sessionId: 'sess1',
      status: 'present',
      notes: '',
    })
  })

  it('normalizes status to lowercase', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: 'Present' }
    const result = toAttendanceRecord(dto as any)
    expect(result.status).toBe('present')
  })
})

describe('toAttendanceRecord type safety', () => {
  it('returns result assignable to AttendanceRecord domain type', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: 'Late', notes: 'test' }
    const result = toAttendanceRecord(dto as any)
    expect(result).toEqual({
      id: 'a1',
      studentId: 's1',
      sessionId: 'sess1',
      status: 'late',
      notes: 'test',
    })
  })

  it('return type satisfies AttendanceRecord (compile-time check)', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: 'Late' }
    const result = toAttendanceRecord(dto as any)
    // Fails at compile time if status is `string` instead of `AttendanceStatus`
    expectTypeOf(result).toMatchTypeOf<AttendanceRecord>()
  })

  it('falls back to absent for invalid status string', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: 'bogus' }
    const result = toAttendanceRecord(dto as any)
    expect(result.status).toBe('absent')
  })

  it('falls back to absent for empty status', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: '' }
    const result = toAttendanceRecord(dto as any)
    expect(result.status).toBe('absent')
  })

  it('falls back to absent for null status', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: null }
    const result = toAttendanceRecord(dto as any)
    expect(result.status).toBe('absent')
  })
})

describe('toSessionAttendanceRecord type safety', () => {
  it('defaults missing student fields to empty strings', () => {
    const dto = { id: 'a1', studentId: 's1', sessionId: 'sess1', status: 'present' }
    const result = toSessionAttendanceRecord(dto as any)
    expect(result.studentNumber).toBe('')
    expect(result.studentName).toBe('')
    expect(result.checkInTime).toBe('')
  })

  it('return type satisfies SessionAttendanceRecord (compile-time check)', () => {
    const dto = {
      id: 'a1',
      studentId: 's1',
      sessionId: 'sess1',
      status: 'Absent',
      studentNumber: '2026001',
      studentName: 'John Doe',
      checkInTime: '',
    }
    const result = toSessionAttendanceRecord(dto as any)
    // Fails at compile time if status is `string` instead of `AttendanceStatus`
    expectTypeOf(result).toMatchTypeOf<SessionAttendanceRecord>()
  })
})

describe('toSessionAttendanceRecord', () => {
  it('extends AttendanceRecord with student info', () => {
    const dto = {
      id: 'a1',
      studentId: 's1',
      sessionId: 'sess1',
      status: 'present',
      studentNumber: '2026001',
      studentName: 'John Doe',
      checkInTime: '09:05',
    }
    const result = toSessionAttendanceRecord(dto as any)
    expect(result.studentNumber).toBe('2026001')
    expect(result.studentName).toBe('John Doe')
    expect(result.checkInTime).toBe('09:05')
  })
})

describe('toAttendanceSummary', () => {
  it('maps with defaults for missing fields', () => {
    const dto = {}
    const result = toAttendanceSummary(dto as any)
    expect(result.totalSessions).toBe(0)
    expect(result.attendanceRate).toBe(0)
  })
})

describe('toSchedule', () => {
  it('maps ScheduleDto with relation flattening', () => {
    const dto = {
      id: 'sch1',
      dayOfWeek: 'Monday',
      timeIn: '09:00',
      timeOut: '10:00',
      subjectId: 'sub1',
      classroomId: 'cls1',
      sectionId: 'sec1',
      instructorId: 'inst1',
      courseId: 'crs1',
      subjectCode: 'CS101',
      subjectName: 'Intro to CS',
      courseCode: 'BSCS',
      courseName: 'BS Computer Science',
      sectionName: 'A',
      classroomName: 'Room 101',
      instructorFirstName: 'John',
      instructorLastName: 'Doe',
    }
    const result = toSchedule(dto as any)
    expect(result.id).toBe('sch1')
    expect(result.dayOfWeek).toBe('Monday')
    expect(result.subjectCode).toBe('CS101')
  })

  it('defaults empty strings for missing relation fields', () => {
    const dto = { id: 'sch1' }
    const result = toSchedule(dto as any)
    expect(result.dayOfWeek).toBe('')
    expect(result.subjectCode).toBe('')
    expect(result.instructorFirstName).toBe('')
  })

  it('flattens nested relation objects', () => {
    const dto = {
      id: 'sch1',
      subject: { id: 'sub1', code: 'CS101', name: 'Intro to CS' },
      instructor: { id: 'inst1', firstName: 'John', lastName: 'Doe' },
    }
    const result = toSchedule(dto as any)
    expect(result.subjectCode).toBe('CS101')
    expect(result.instructorFirstName).toBe('John')
  })

  it('preserves null FK fields from DTO', () => {
    const dto = {
      id: 'sch1',
      dayOfWeek: 'Monday',
      timeIn: '09:00',
      timeOut: '10:00',
      subjectId: null,
      classroomId: null,
      sectionId: null,
      instructorId: null,
      courseId: null,
    }
    const result = toSchedule(dto as any)
    expect(result.subjectId).toBeNull()
    expect(result.classroomId).toBeNull()
    expect(result.sectionId).toBeNull()
    expect(result.instructorId).toBeNull()
    expect(result.courseId).toBeNull()
    // Non-FK fields default to empty string
    expect(result.subjectCode).toBe('')
    expect(result.courseName).toBe('')
  })
})

describe('toScheduleInstructor', () => {
  it('normalizes name field variants', () => {
    const dto = { id: 'inst1', firstname: 'John', lastname: 'Doe' }
    const result = toScheduleInstructor(dto as any)
    expect(result.firstName).toBe('John')
    expect(result.lastName).toBe('Doe')
  })

  it('prefers camelCase over lowercase', () => {
    const dto = { id: 'inst1', firstName: 'John', lastName: 'Doe', firstname: 'j', lastname: 'd' }
    const result = toScheduleInstructor(dto as any)
    expect(result.firstName).toBe('John')
    expect(result.lastName).toBe('Doe')
  })
})

describe('toCourse', () => {
  it('maps with defaults', () => {
    const dto = { id: 'crs1' }
    const result = toCourse(dto as any)
    expect(result).toEqual({ id: 'crs1', name: '' })
  })
})

describe('toSection', () => {
  it('maps with defaults', () => {
    const dto = { id: 'sec1' }
    const result = toSection(dto as any)
    expect(result).toEqual({ id: 'sec1', name: '' })
  })
})

describe('toSubject', () => {
  it('maps with defaults', () => {
    const dto = { id: 'sub1' }
    const result = toSubject(dto as any)
    expect(result).toEqual({ id: 'sub1', name: '', code: '' })
  })
})

describe('toClassroom', () => {
  it('maps with defaults', () => {
    const dto = { id: 'cls1' }
    const result = toClassroom(dto as any)
    expect(result).toEqual({ id: 'cls1', name: '' })
  })
})

describe('toEnrollment', () => {
  it('maps with defaults', () => {
    const dto = { id: 'enr1', studentId: 's1' }
    const result = toEnrollment(dto as any)
    expect(result.id).toBe('enr1')
    expect(result.studentId).toBe('s1')
    expect(result.studentFirstname).toBe('')
    expect(result.isActive).toBe(false)
  })
})
