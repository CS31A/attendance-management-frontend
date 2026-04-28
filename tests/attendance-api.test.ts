import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'
import {
  createAttendance,
  fetchAllAttendance,
  fetchAttendanceById,
  fetchAttendanceSummary,
  fetchSessionAttendance,
  fetchStudentAttendance,
  updateAttendance,
} from '@/api/attendance'

vi.mock('@/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('attendance api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes PascalCase statuses from attendance read responses', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          items: [{ id: '1', studentId: '10', sessionId: '20', status: 'Present' }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 50,
        },
      } as never)
      .mockResolvedValueOnce({ data: { id: '2', studentId: '10', sessionId: '20', status: 'Absent' } } as never)
      .mockResolvedValueOnce({
        data: {
          studentId: '10',
          studentName: 'Alice',
          attendanceRecords: [{ id: '3', studentId: '10', sessionId: '20', status: 'Late' }],
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          attendanceRecords: [
            { id: '4', studentId: '10', sessionId: '20', status: 'Excused', studentName: 'Alice' },
          ],
        },
      } as never)

    await expect(fetchAllAttendance()).resolves.toMatchObject([{ status: 'present' }])
    await expect(fetchAttendanceById('2')).resolves.toMatchObject({ status: 'absent' })
    await expect(fetchStudentAttendance('10')).resolves.toMatchObject([{ status: 'late' }])
    await expect(fetchSessionAttendance('20')).resolves.toMatchObject([{ status: 'excused' }])
  })

  it('keeps backward compatibility with legacy flat attendance arrays', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: '1', studentId: '10', sessionId: '20', status: 'Present' }] } as never)
      .mockResolvedValueOnce({ data: [{ id: '2', studentId: '10', sessionId: '20', status: 'Late' }] } as never)

    await expect(fetchAllAttendance()).resolves.toMatchObject([{ status: 'present' }])
    await expect(fetchStudentAttendance('10')).resolves.toMatchObject([{ status: 'late' }])
  })

  it('types attendance summary with backend field names', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        totalSessions: 12,
        totalPresent: 9,
        totalLate: 1,
        totalAbsent: 2,
        totalExcused: 0,
        attendanceRate: 75,
      },
    } as never)

    await expect(fetchAttendanceSummary()).resolves.toMatchObject({
      totalSessions: 12,
      totalPresent: 9,
      totalAbsent: 2,
    })
  })

  it('normalizes PascalCase statuses from attendance mutation responses', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { id: '1', studentId: '10', sessionId: '20', status: 'Present' },
    } as never)
    vi.mocked(api.put).mockResolvedValue({
      data: { id: '1', studentId: '10', sessionId: '20', status: 'Late' },
    } as never)

    await expect(createAttendance({
      studentId: '10',
      sessionId: '20',
      status: 'Present',
    })).resolves.toMatchObject({ status: 'present' })
    await expect(updateAttendance('1', { status: 'Late' })).resolves.toMatchObject({ status: 'late' })
  })
})
