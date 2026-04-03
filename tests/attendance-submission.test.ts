import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'

import api from '@/api'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { getAttendanceSubmissionErrorMessage } from '@/utils/attendanceSubmission'

type SubmissionError = {
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
  savedCount?: number
  totalCount?: number
}

describe('attendance submission contract', () => {
  const originalPost = api.post
  const originalPut = api.put

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    api.post = originalPost
    api.put = originalPut
  })

  test('submitAttendance posts one new attendance record with backend status casing', async () => {
    const attendanceStore = useAttendanceStore()
    const createdRecord = {
      id: 101,
      studentId: 1,
      sessionId: 55,
      status: 'present',
      notes: 'On time',
    }
    const calls: Array<{ url: string, payload: Record<string, unknown> }> = []

    const mockPost = async (url: string, payload: Record<string, unknown>) => {
      calls.push({ url, payload })
      return {
        status: 201,
        data: createdRecord,
      }
    }
    api.post = mockPost as typeof api.post

    const result = await attendanceStore.submitAttendance({
      sessionId: 55,
      records: [
        {
          studentId: 1,
          status: 'present',
          notes: 'On time',
        },
      ],
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('/attendance')
    expect(calls[0].payload).toEqual({
      sessionId: 55,
      studentId: 1,
      status: 'Present',
      notes: 'On time',
    })
    expect(calls[0].payload).not.toHaveProperty('checkInTime')
    expect(result).toEqual([createdRecord])
  })

  test('submitAttendance returns successful data regardless of 200 or 201 when API responds', async () => {
    const attendanceStore = useAttendanceStore()
    const existingRecord = {
      id: 101,
      studentId: 1,
      sessionId: 55,
      status: 'present',
      notes: 'Already recorded',
    }

    const mockPost = async () => {
      return {
        status: 200,
        data: existingRecord,
      }
    }
    api.post = mockPost as typeof api.post

    const result = await attendanceStore.submitAttendance({
      sessionId: 55,
      records: [
        {
          studentId: 1,
          status: 'present',
          notes: 'Retry from UI',
        },
      ],
    })

    expect(result).toEqual([existingRecord])
  })

  test('submitAttendance preserves conflict details and attaches submission metadata', async () => {
    const attendanceStore = useAttendanceStore()
    const conflictError = new Error('Conflict') as Error & {
      response?: {
        status: number
        data: {
          message: string
        }
      }
    }

    conflictError.response = {
      status: 409,
      data: {
        message: 'Student is not enrolled in this session.',
      },
    }

    const mockPost = async () => {
      throw conflictError
    }
    api.post = mockPost as typeof api.post

    let caughtError: unknown
    try {
      await attendanceStore.submitAttendance({
        sessionId: 55,
        records: [
          {
            studentId: 99,
            status: 'present',
          },
        ],
      })
    }
    catch (error) {
      caughtError = error
    }

    const submissionError = caughtError as SubmissionError
    expect(submissionError.response?.status).toBe(409)
    expect(submissionError.savedCount).toBe(0)
    expect(submissionError.totalCount).toBe(1)
    expect(attendanceStore.syncWarning).toBeNull()
  })

  test('submitAttendance updates existing attendance records via PUT instead of POST', async () => {
    const attendanceStore = useAttendanceStore()
    const updatedRecord = {
      id: 101,
      studentId: 1,
      sessionId: 55,
      status: 'late',
      notes: 'Updated by instructor',
    }
    const postCalls: Array<{ url: string, payload: Record<string, unknown> }> = []
    const putCalls: Array<{ url: string, payload: Record<string, unknown> }> = []

    const mockPost = async (url: string, payload: Record<string, unknown>) => {
      postCalls.push({ url, payload })
      return {
        status: 201,
        data: {
          id: 999,
          ...payload,
        },
      }
    }
    api.post = mockPost as typeof api.post

    const mockPut = async (url: string, payload: Record<string, unknown>) => {
      putCalls.push({ url, payload })
      return {
        status: 200,
        data: updatedRecord,
      }
    }
    api.put = mockPut as typeof api.put

    const result = await attendanceStore.submitAttendance({
      sessionId: 55,
      records: [
        {
          id: 101,
          studentId: 1,
          status: 'late',
          notes: 'Updated by instructor',
        },
      ],
    })

    expect(postCalls).toEqual([])
    expect(putCalls).toEqual([
      {
        url: '/attendance/101',
        payload: {
          status: 'Late',
          notes: 'Updated by instructor',
        },
      },
    ])
    expect(result).toEqual([updatedRecord])
  })

  test('submitAttendance supports mixed update and create records in one save', async () => {
    const attendanceStore = useAttendanceStore()
    const calls: Array<{ method: 'put' | 'post', url: string, payload: Record<string, unknown> }> = []

    const mockPut = async (url: string, payload: Record<string, unknown>) => {
      calls.push({ method: 'put', url, payload })
      return {
        status: 200,
        data: {
          id: 101,
          studentId: 1,
          sessionId: 55,
          status: String(payload.status).toLowerCase(),
          notes: payload.notes,
        },
      }
    }
    api.put = mockPut as typeof api.put

    const mockPost = async (url: string, payload: Record<string, unknown>) => {
      calls.push({ method: 'post', url, payload })
      return {
        status: 201,
        data: {
          id: 102,
          studentId: payload.studentId,
          sessionId: payload.sessionId,
          status: String(payload.status).toLowerCase(),
          notes: payload.notes,
        },
      }
    }
    api.post = mockPost as typeof api.post

    const result = await attendanceStore.submitAttendance({
      sessionId: 55,
      records: [
        {
          id: 101,
          studentId: 1,
          status: 'present',
          notes: 'Kept present',
        },
        {
          studentId: 2,
          status: 'absent',
          notes: 'No show',
        },
      ],
    })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({
      method: 'put',
      url: '/attendance/101',
      payload: {
        status: 'Present',
        notes: 'Kept present',
      },
    })
    expect(calls[1].method).toBe('post')
    expect(calls[1].url).toBe('/attendance')
    expect(calls[1].payload).toEqual({
      sessionId: 55,
      studentId: 2,
      status: 'Absent',
      notes: 'No show',
    })
    expect(calls[1].payload).not.toHaveProperty('checkInTime')

    expect(result).toEqual([
      {
        id: 101,
        studentId: 1,
        sessionId: 55,
        status: 'present',
        notes: 'Kept present',
      },
      {
        id: 102,
        studentId: 2,
        sessionId: 55,
        status: 'absent',
        notes: 'No show',
      },
    ])
  })

  test('submitAttendance sets count-aware warning on partial save and includes metadata', async () => {
    const attendanceStore = useAttendanceStore()
    let attempt = 0

    const mockPost = async (_url: string, payload: Record<string, unknown>) => {
      attempt += 1
      if (attempt <= 2) {
        return {
          status: 201,
          data: {
            id: 100 + attempt,
            studentId: payload.studentId,
            sessionId: payload.sessionId,
            status: String(payload.status).toLowerCase(),
            notes: payload.notes,
          },
        }
      }

      const error = new Error('Conflict') as Error & { response?: { status: number } }
      error.response = { status: 409 }
      throw error
    }
    api.post = mockPost as typeof api.post

    let caughtError: unknown
    try {
      await attendanceStore.submitAttendance({
        sessionId: 55,
        records: [
          { studentId: 1, status: 'present' },
          { studentId: 2, status: 'absent' },
          { studentId: 3, status: 'late' },
        ],
      })
    }
    catch (error) {
      caughtError = error
    }

    expect(attendanceStore.syncWarning).toBe(
      '2 of 3 records saved. Please refresh the page to review the latest attendance details.',
    )

    const submissionError = caughtError as SubmissionError
    expect(submissionError.savedCount).toBe(2)
    expect(submissionError.totalCount).toBe(3)
  })

  test('submitAttendance does not set partial-save warning when first record fails', async () => {
    const attendanceStore = useAttendanceStore()

    const mockPost = async () => {
      const error = new Error('Conflict') as Error & { response?: { status: number } }
      error.response = { status: 409 }
      throw error
    }
    api.post = mockPost as typeof api.post

    try {
      await attendanceStore.submitAttendance({
        sessionId: 55,
        records: [
          { studentId: 1, status: 'present' },
        ],
      })
    }
    catch {
      // Expected failure path.
    }

    expect(attendanceStore.syncWarning).toBeNull()
  })

  test('attendance conflict messaging stays actionable for 409 responses', () => {
    const error = {
      response: {
        status: 409,
        data: {},
      },
    }

    expect(getAttendanceSubmissionErrorMessage(error)).toBe(
      'Attendance could not be recorded for one or more students. Please confirm the affected student is enrolled in this session and try again.',
    )
  })
})