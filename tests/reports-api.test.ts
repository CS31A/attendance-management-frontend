import type { EntityId } from '@/types'
import type {
  AttendanceRecordItemDto,
  ClassAttendanceSummaryReportDto,
  InstructorSessionsReportDto,
  ReportsFilter,
  SessionAttendanceReportDto,
  StudentAttendanceReportDto,
} from '@/api/reports'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import * as reportsApi from '@/api/reports'

vi.mock('@/api')

describe('reports API module with EntityId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchStudentAttendanceReport', () => {
    it('fetches student attendance report with EntityId (number)', async () => {
      const studentId = 123 as EntityId

      const mockResponse: StudentAttendanceReportDto = {
        studentId: 123 as EntityId,
        studentName: 'John Doe',
        studentNumber: 'S12345',
        totalSessions: 20,
        presentCount: 15,
        lateCount: 2,
        absentCount: 3,
        excusedCount: 0,
        attendancePercentage: 75,
        attendanceRecords: [
          {
            id: 1 as EntityId,
            sessionId: 100 as EntityId,
            sessionDate: '2024-01-01',
            status: 'present',
            checkInTime: '09:00:00',
            subjectName: 'Math',
            sectionName: 'Section A',
            scheduleTitle: 'Math 101',
            isManualEntry: false,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchStudentAttendanceReport(studentId)

      expect(api.get).toHaveBeenCalledWith('/reports/student-attendance/123')
      expect(result.studentId).toBe(123 as EntityId)
      expect(result.studentName).toBe('John Doe')
      expect(result.attendanceRecords).toHaveLength(1)
      expect(result.attendanceRecords[0].id).toBe(1 as EntityId)
      expect(result.attendanceRecords[0].sessionId).toBe(100 as EntityId)
    })

    it('fetches student attendance report with EntityId (string UUID)', async () => {
      const studentId = '550e8400-e29b-41d4-a716-446655440000' as EntityId

      const mockResponse: StudentAttendanceReportDto = {
        studentId: '550e8400-e29b-41d4-a716-446655440000' as EntityId,
        studentName: 'Jane Smith',
        studentNumber: 'S67890',
        totalSessions: 15,
        presentCount: 12,
        lateCount: 1,
        absentCount: 2,
        excusedCount: 0,
        attendancePercentage: 80,
        attendanceRecords: [
          {
            id: '660e8400-e29b-41d4-a716-446655440001' as EntityId,
            sessionId: '770e8400-e29b-41d4-a716-446655440002' as EntityId,
            sessionDate: '2024-01-02',
            status: 'present',
            subjectName: 'Physics',
            sectionName: 'Section B',
            scheduleTitle: 'Physics 201',
            isManualEntry: true,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchStudentAttendanceReport(studentId)

      expect(api.get).toHaveBeenCalledWith('/reports/student-attendance/550e8400-e29b-41d4-a716-446655440000')
      expect(result.studentId).toBe('550e8400-e29b-41d4-a716-446655440000' as EntityId)
      expect(result.attendanceRecords[0].id).toBe('660e8400-e29b-41d4-a716-446655440001' as EntityId)
      expect(result.attendanceRecords[0].sessionId).toBe('770e8400-e29b-41d4-a716-446655440002' as EntityId)
    })
  })

  describe('fetchSessionAttendanceReport', () => {
    it('fetches session attendance report with EntityId (number)', async () => {
      const sessionId = 200 as EntityId

      const mockResponse: SessionAttendanceReportDto = {
        sessionId: 200 as EntityId,
        sessionDate: '2024-01-15',
        scheduleId: 300 as EntityId,
        scheduleTitle: 'Chemistry Lab',
        subjectName: 'Chemistry',
        sectionName: 'Section C',
        totalEnrolled: 25,
        presentCount: 20,
        lateCount: 3,
        absentCount: 2,
        attendanceRate: 80,
        attendanceRecords: [
          {
            studentId: 400 as EntityId,
            studentName: 'Alice Johnson',
            studentNumber: 'S11111',
            attendanceRecordId: 500 as EntityId,
            status: 'present',
            checkInTime: '10:00:00',
            isManualEntry: false,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchSessionAttendanceReport(sessionId)

      expect(api.get).toHaveBeenCalledWith('/reports/session-attendance/200')
      expect(result.sessionId).toBe(200 as EntityId)
      expect(result.scheduleId).toBe(300 as EntityId)
      expect(result.attendanceRecords).toHaveLength(1)
      expect(result.attendanceRecords[0].studentId).toBe(400 as EntityId)
      expect(result.attendanceRecords[0].attendanceRecordId).toBe(500 as EntityId)
    })

    it('fetches session attendance report with EntityId (string UUID)', async () => {
      const sessionId = '880e8400-e29b-41d4-a716-446655440003' as EntityId

      const mockResponse: SessionAttendanceReportDto = {
        sessionId: '880e8400-e29b-41d4-a716-446655440003' as EntityId,
        sessionDate: '2024-01-20',
        scheduleId: '990e8400-e29b-41d4-a716-446655440004' as EntityId,
        scheduleTitle: 'Biology Lecture',
        subjectName: 'Biology',
        sectionName: 'Section D',
        totalEnrolled: 30,
        presentCount: 28,
        lateCount: 1,
        absentCount: 1,
        attendanceRate: 93.33,
        attendanceRecords: [
          {
            studentId: '111e8400-e29b-41d4-a716-446655440005' as EntityId,
            studentName: 'Bob Williams',
            studentNumber: 'S22222',
            attendanceRecordId: '222e8400-e29b-41d4-a716-446655440006' as EntityId,
            status: 'late',
            checkInTime: '10:15:00',
            isManualEntry: true,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchSessionAttendanceReport(sessionId)

      expect(api.get).toHaveBeenCalledWith('/reports/session-attendance/880e8400-e29b-41d4-a716-446655440003')
      expect(result.sessionId).toBe('880e8400-e29b-41d4-a716-446655440003' as EntityId)
      expect(result.scheduleId).toBe('990e8400-e29b-41d4-a716-446655440004' as EntityId)
      expect(result.attendanceRecords[0].studentId).toBe('111e8400-e29b-41d4-a716-446655440005' as EntityId)
      expect(result.attendanceRecords[0].attendanceRecordId).toBe('222e8400-e29b-41d4-a716-446655440006' as EntityId)
    })
  })

  describe('fetchClassAttendanceReport', () => {
    it('fetches class attendance report with EntityId (number)', async () => {
      const sectionId = 600 as EntityId

      const mockResponse: ClassAttendanceSummaryReportDto = {
        sectionId: 600 as EntityId,
        sectionName: 'Section E',
        totalSessions: 40,
        totalPresent: 800,
        totalLate: 50,
        totalAbsent: 150,
        totalExcused: 0,
        attendanceRate: 85,
        sessions: [
          {
            sessionId: 700 as EntityId,
            sessionDate: '2024-01-10',
            subjectName: 'History',
            scheduleTitle: 'History 101',
            status: 'ended',
            presentCount: 20,
            lateCount: 2,
            absentCount: 3,
            excusedCount: 0,
            totalRecords: 25,
            totalEnrolled: 25,
            attendanceRate: 80,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchClassAttendanceReport(sectionId)

      expect(api.get).toHaveBeenCalledWith('/reports/class-attendance/600', { params: {} })
      expect(result.sectionId).toBe(600 as EntityId)
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].sessionId).toBe(700 as EntityId)
    })

    it('fetches class attendance report with EntityId (string UUID) and filters', async () => {
      const sectionId = '333e8400-e29b-41d4-a716-446655440007' as EntityId
      const filters: ReportsFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        scheduleId: '444e8400-e29b-41d4-a716-446655440008' as EntityId,
      }

      const mockResponse: ClassAttendanceSummaryReportDto = {
        sectionId: '333e8400-e29b-41d4-a716-446655440007' as EntityId,
        sectionName: 'Section F',
        totalSessions: 20,
        totalPresent: 400,
        totalLate: 20,
        totalAbsent: 80,
        totalExcused: 0,
        attendanceRate: 80,
        sessions: [
          {
            sessionId: '555e8400-e29b-41d4-a716-446655440009' as EntityId,
            sessionDate: '2024-01-15',
            subjectName: 'Geography',
            scheduleTitle: 'Geography 301',
            status: 'ended',
            presentCount: 18,
            lateCount: 1,
            absentCount: 1,
            excusedCount: 0,
            totalRecords: 20,
            totalEnrolled: 20,
            attendanceRate: 90,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchClassAttendanceReport(sectionId, filters)

      expect(api.get).toHaveBeenCalledWith('/reports/class-attendance/333e8400-e29b-41d4-a716-446655440007', { params: filters })
      expect(result.sectionId).toBe('333e8400-e29b-41d4-a716-446655440007' as EntityId)
      expect(result.sessions[0].sessionId).toBe('555e8400-e29b-41d4-a716-446655440009' as EntityId)
    })
  })

  describe('fetchInstructorSessionsReport', () => {
    it('fetches instructor sessions report with EntityId (number)', async () => {
      const instructorId = 800 as EntityId

      const mockResponse: InstructorSessionsReportDto = {
        instructorId: 800 as EntityId,
        instructorName: 'Dr. Smith',
        totalSessions: 50,
        sessions: [
          {
            sessionId: 900 as EntityId,
            sessionDate: '2024-01-25',
            subjectName: 'English',
            scheduleTitle: 'English 101',
            sectionName: 'Section G',
            status: 'ended',
            presentCount: 22,
            lateCount: 1,
            absentCount: 2,
            excusedCount: 0,
            totalRecords: 25,
            totalEnrolled: 25,
            attendanceRate: 88,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchInstructorSessionsReport(instructorId)

      expect(api.get).toHaveBeenCalledWith('/reports/instructor-sessions/800', { params: {} })
      expect(result.instructorId).toBe(800 as EntityId)
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].sessionId).toBe(900 as EntityId)
    })

    it('fetches instructor sessions report with EntityId (string UUID) and filters', async () => {
      const instructorId = '666e8400-e29b-41d4-a716-446655440010' as EntityId
      const filters: ReportsFilter = {
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        sectionId: '777e8400-e29b-41d4-a716-446655440011' as EntityId,
      }

      const mockResponse: InstructorSessionsReportDto = {
        instructorId: '666e8400-e29b-41d4-a716-446655440010' as EntityId,
        instructorName: 'Prof. Johnson',
        totalSessions: 30,
        sessions: [
          {
            sessionId: '888e8400-e29b-41d4-a716-446655440012' as EntityId,
            sessionDate: '2024-02-10',
            subjectName: 'Computer Science',
            scheduleTitle: 'CS 101',
            sectionName: 'Section H',
            status: 'ended',
            presentCount: 28,
            lateCount: 0,
            absentCount: 2,
            excusedCount: 0,
            totalRecords: 30,
            totalEnrolled: 30,
            attendanceRate: 93.33,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchInstructorSessionsReport(instructorId, filters)

      expect(api.get).toHaveBeenCalledWith('/reports/instructor-sessions/666e8400-e29b-41d4-a716-446655440010', { params: filters })
      expect(result.instructorId).toBe('666e8400-e29b-41d4-a716-446655440010' as EntityId)
      expect(result.sessions[0].sessionId).toBe('888e8400-e29b-41d4-a716-446655440012' as EntityId)
    })
  })

  describe('ReportsFilter with EntityId', () => {
    it('supports all EntityId filter fields', async () => {
      const sectionId = 1000 as EntityId
      const filters: ReportsFilter = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        sectionId: 1100 as EntityId,
        studentId: 1200 as EntityId,
        sessionId: 1300 as EntityId,
        scheduleId: 1400 as EntityId,
      }

      const mockResponse: ClassAttendanceSummaryReportDto = {
        sectionId: 1000 as EntityId,
        sectionName: 'Test Section',
        totalSessions: 10,
        totalPresent: 100,
        totalLate: 10,
        totalAbsent: 10,
        totalExcused: 0,
        attendanceRate: 90,
        sessions: [],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      await reportsApi.fetchClassAttendanceReport(sectionId, filters)

      expect(api.get).toHaveBeenCalledWith('/reports/class-attendance/1000', { params: filters })
    })

    it('supports EntityId filter fields with string UUIDs', async () => {
      const sectionId = '999e8400-e29b-41d4-a716-446655440013' as EntityId
      const filters: ReportsFilter = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        sectionId: '111e8400-e29b-41d4-a716-446655440014' as EntityId,
        studentId: '222e8400-e29b-41d4-a716-446655440015' as EntityId,
        sessionId: '333e8400-e29b-41d4-a716-446655440016' as EntityId,
        scheduleId: '444e8400-e29b-41d4-a716-446655440017' as EntityId,
      }

      const mockResponse: ClassAttendanceSummaryReportDto = {
        sectionId: '999e8400-e29b-41d4-a716-446655440013' as EntityId,
        sectionName: 'UUID Test Section',
        totalSessions: 5,
        totalPresent: 50,
        totalLate: 5,
        totalAbsent: 5,
        totalExcused: 0,
        attendanceRate: 85,
        sessions: [],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      await reportsApi.fetchClassAttendanceReport(sectionId, filters)

      expect(api.get).toHaveBeenCalledWith('/reports/class-attendance/999e8400-e29b-41d4-a716-446655440013', { params: filters })
    })
  })

  describe('mixed ID types in attendance records', () => {
    it('handles mixed EntityId types in attendance record items', async () => {
      const studentId = 1500 as EntityId

      const mockResponse: StudentAttendanceReportDto = {
        studentId: 1500 as EntityId,
        studentName: 'Mixed ID Student',
        studentNumber: 'S99999',
        totalSessions: 3,
        presentCount: 3,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
        attendancePercentage: 100,
        attendanceRecords: [
          {
            id: 1600 as EntityId,
            sessionId: 1700 as EntityId,
            sessionDate: '2024-01-01',
            status: 'present',
            subjectName: 'Math',
            sectionName: 'Section A',
            scheduleTitle: 'Math 101',
            isManualEntry: false,
          },
          {
            id: '555e8400-e29b-41d4-a716-446655440018' as EntityId,
            sessionId: '666e8400-e29b-41d4-a716-446655440019' as EntityId,
            sessionDate: '2024-01-02',
            status: 'present',
            subjectName: 'Physics',
            sectionName: 'Section B',
            scheduleTitle: 'Physics 201',
            isManualEntry: true,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse } as never)

      const result = await reportsApi.fetchStudentAttendanceReport(studentId)

      expect(result.attendanceRecords).toHaveLength(2)
      expect(result.attendanceRecords[0].id).toBe(1600 as EntityId)
      expect(result.attendanceRecords[0].sessionId).toBe(1700 as EntityId)
      expect(result.attendanceRecords[1].id).toBe('555e8400-e29b-41d4-a716-446655440018' as EntityId)
      expect(result.attendanceRecords[1].sessionId).toBe('666e8400-e29b-41d4-a716-446655440019' as EntityId)
    })
  })
})
