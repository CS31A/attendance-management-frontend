import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'

import api from '@/api'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { getAttendanceSubmissionErrorMessage } from '@/utils/attendanceSubmission'

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

  test('submitAttendance posts one new attendance record and accepts 201 Created', async () => {
    const attendanceStore = useAttendanceStore()
    const createdRecord = {
      id: 101,
      studentId: 1,
      sessionId: 55,
      status: 'present',
      notes: 'On time',
    }
    const calls = []

    api.post = async (url, payload) => {
      calls.push({ url, payload })
      return {
        status: 201,
        data: createdRecord,
      }
    }

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

    expect(calls).toEqual([
      {
        url: '/attendance',
        payload: {
          sessionId: 55,
          studentId: 1,
          status: 'Present',
          notes: 'On time',
          checkInTime: undefined,
        },
      },
    ])
    expect(result).toEqual([createdRecord])
  })

  test('submitAttendance treats 200 OK idempotent retries as successful saves', async () => {
    const attendanceStore = useAttendanceStore()
    const existingRecord = {
      id: 101,
      studentId: 1,
      sessionId: 55,
      status: 'present',
      notes: 'Already recorded',
    }

    api.post = async () => {
      return {
        status: 200,
        data: existingRecord,
      }
    }

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

  test('submitAttendance preserves 409 conflicts as real business errors', async () => {
    const attendanceStore = useAttendanceStore()
    const conflictError = new Error('Conflict')

    conflictError.response = {
      status: 409,
      data: {
        message: 'Student is not enrolled in this session.',
      },
    }

    api.post = async () => {
      throw conflictError
    }

    let caughtError
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

    expect(caughtError).toBe(conflictError)
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
    const postCalls = []
    const putCalls = []

    api.post = async (url, payload) => {
      postCalls.push({ url, payload })
      return {
        status: 201,
        data: {
          id: 999,
          ...payload,
        },
      }
    }

    api.put = async (url, payload) => {
      putCalls.push({ url, payload })
      return {
        status: 200,
        data: updatedRecord,
      }
    }

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
    const calls = []

    api.put = async (url, payload) => {
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

    api.post = async (url, payload) => {
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

    expect(calls).toEqual([
      {
        method: 'put',
        url: '/attendance/101',
        payload: {
          status: 'Present',
          notes: 'Kept present',
        },
      },
      {
        method: 'post',
        url: '/attendance',
        payload: {
          sessionId: 55,
          studentId: 2,
          status: 'Absent',
          notes: 'No show',
          checkInTime: undefined,
        },
      },
    ])

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
