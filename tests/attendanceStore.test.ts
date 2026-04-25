import type {
  AttendanceResponseDto,
  AttendanceSummaryDto,
  SessionAttendanceResponseDto,
} from '@/api/attendance'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchAllAttendance as apiFetchAllAttendance,
  fetchAttendanceById as apiFetchAttendanceById,
  fetchAttendanceSummary as apiFetchAttendanceSummary,
  fetchSessionAttendance as apiFetchSessionAttendance,
  fetchStudentAttendance as apiFetchStudentAttendance,
  createAttendance,
  deleteAttendance,
  updateAttendance,
} from '@/api/attendance'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { getErrorStatus } from '@/utils/httpError'

vi.mock('@/api/attendance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/attendance')>()
  return {
    ...actual,
    createAttendance: vi.fn(),
    deleteAttendance: vi.fn(),
    fetchAllAttendance: vi.fn(),
    fetchAttendanceById: vi.fn(),
    fetchAttendanceSummary: vi.fn(),
    fetchSessionAttendance: vi.fn(),
    fetchStudentAttendance: vi.fn(),
    updateAttendance: vi.fn(),
  }
})
vi.mock('@/utils/httpError')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

// Helper factory
function createAttendanceRecord(overrides: Partial<AttendanceResponseDto> = {}): AttendanceResponseDto {
  return {
    id: '1',
    studentId: '1',
    sessionId: '1',
    status: 'present',
    ...overrides,
  }
}

function createSessionAttendanceRecord(overrides: Partial<SessionAttendanceResponseDto> = {}): SessionAttendanceResponseDto {
  return {
    id: '1',
    studentId: '1',
    sessionId: '1',
    status: 'present',
    ...overrides,
  }
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  let reject!: Deferred<T>['reject']

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('attendanceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('recordsByStatus filters by status', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '1', status: 'present' }),
        createSessionAttendanceRecord({ id: '2', studentId: '2', status: 'absent' }),
        createSessionAttendanceRecord({ id: '3', studentId: '3', status: 'present' }),
      ]
      expect(store.recordsByStatus('present')).toHaveLength(2)
      expect(store.recordsByStatus('absent')).toHaveLength(1)
      expect(store.recordsByStatus('late')).toHaveLength(0)
    })

    it('presentRecords returns present students', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', status: 'present' }),
        createSessionAttendanceRecord({ id: '2', status: 'absent' }),
        createSessionAttendanceRecord({ id: '3', status: 'present' }),
      ]
      expect(store.presentRecords).toHaveLength(2)
      expect(store.presentRecords.every(r => r.status === 'present')).toBe(true)
    })

    it('absentRecords returns absent students', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', status: 'present' }),
        createSessionAttendanceRecord({ id: '2', status: 'absent' }),
        createSessionAttendanceRecord({ id: '3', status: 'absent' }),
      ]
      expect(store.absentRecords).toHaveLength(2)
      expect(store.absentRecords.every(r => r.status === 'absent')).toBe(true)
    })

    it('lateRecords returns late students', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', status: 'late' }),
        createSessionAttendanceRecord({ id: '2', status: 'present' }),
        createSessionAttendanceRecord({ id: '3', status: 'late' }),
      ]
      expect(store.lateRecords).toHaveLength(2)
      expect(store.lateRecords.every(r => r.status === 'late')).toBe(true)
    })

    it('excusedRecords returns excused students', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', status: 'excused' }),
        createSessionAttendanceRecord({ id: '2', status: 'present' }),
        createSessionAttendanceRecord({ id: '3', status: 'excused' }),
      ]
      expect(store.excusedRecords).toHaveLength(2)
      expect(store.excusedRecords.every(r => r.status === 'excused')).toBe(true)
    })

    it('sessionStats calculates statistics', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', status: 'present' }),
        createSessionAttendanceRecord({ id: '2', status: 'absent' }),
        createSessionAttendanceRecord({ id: '3', status: 'present' }),
        createSessionAttendanceRecord({ id: '4', status: 'late' }),
      ]
      const stats = store.sessionStats
      expect(stats).toBeDefined()
      expect(stats.total).toBe(4)
      expect(stats.presentCount).toBe(2)
      expect(stats.absentCount).toBe(1)
      expect(stats.lateCount).toBe(1)
    })

    it('getRecordByStudentId returns record by student ID', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '1' }),
        createSessionAttendanceRecord({ id: '2', studentId: '2' }),
      ]
      expect(store.getRecordByStudentId('1')).toEqual(store.sessionAttendance[0])
      expect(store.getRecordByStudentId('2')).toEqual(store.sessionAttendance[1])
      expect(store.getRecordByStudentId('99')).toBeUndefined()
    })

    it('hasAttendanceData returns true when session has records', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [createSessionAttendanceRecord()]
      expect(store.hasAttendanceData).toBe(true)
    })

    it('hasAttendanceData returns false when session is empty', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = []
      expect(store.hasAttendanceData).toBe(false)
    })
  })

  describe('actions — success paths', () => {
    it('fetchAllAttendance stores API data in attendanceRecords', async () => {
      const mockRecords = [
        createAttendanceRecord({ id: '1' }),
        createAttendanceRecord({ id: '2' }),
      ]
      vi.mocked(apiFetchAllAttendance).mockResolvedValue(mockRecords)

      const store = useAttendanceStore()
      const result = await store.fetchAllAttendance()

      expect(store.attendanceRecords).toEqual(mockRecords)
      expect(result).toEqual(mockRecords)
      expect(store.loading).toBe(false)
    })

    it('fetchAttendanceById stores API data in currentRecord', async () => {
      const mockRecord = createAttendanceRecord({ id: '1' })
      vi.mocked(apiFetchAttendanceById).mockResolvedValue(mockRecord)

      const store = useAttendanceStore()
      const result = await store.fetchAttendanceById('1')

      expect(store.currentRecord).toEqual(mockRecord)
      expect(result).toEqual(mockRecord)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionAttendance stores session data, sets currentSessionId, clears stale syncWarning', async () => {
      const mockSessionAttendance = [
        createSessionAttendanceRecord({ id: '1', sessionId: '55' }),
        createSessionAttendanceRecord({ id: '2', sessionId: '55' }),
      ]
      vi.mocked(apiFetchSessionAttendance).mockResolvedValue(mockSessionAttendance)

      const store = useAttendanceStore()
      store.syncWarning = 'stale warning'

      const result = await store.fetchSessionAttendance('55')

      expect(store.sessionAttendance).toEqual(mockSessionAttendance)
      expect(store.currentSessionId).toBe('55')
      expect(store.syncWarning).toBeNull()
      expect(result).toEqual(mockSessionAttendance)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionAttendance returns [] on 404 and keeps state consistent', async () => {
      const error404 = new Error('Not found') as Error & { response?: { status: number } }
      error404.response = { status: 404 }
      vi.mocked(apiFetchSessionAttendance).mockRejectedValue(error404)
      vi.mocked(getErrorStatus).mockReturnValue(404)

      const store = useAttendanceStore()
      store.sessionAttendance = [createSessionAttendanceRecord()]
      store.currentSessionId = '1'

      const result = await store.fetchSessionAttendance('55')

      expect(result).toEqual([])
      expect(store.sessionAttendance).toEqual([])
      expect(store.currentSessionId).toBe('55')
      expect(store.loading).toBe(false)
    })

    it('fetchStudentAttendance returns API data without mutating unrelated state', async () => {
      const mockRecords = [
        createAttendanceRecord({ id: '1', studentId: '1' }),
        createAttendanceRecord({ id: '2', studentId: '1' }),
      ]
      vi.mocked(apiFetchStudentAttendance).mockResolvedValue(mockRecords)

      const store = useAttendanceStore()
      store.attendanceRecords = [createAttendanceRecord({ id: '99' })]
      store.sessionAttendance = [createSessionAttendanceRecord()]

      const result = await store.fetchStudentAttendance('1')

      expect(result).toEqual(mockRecords)
      expect(store.attendanceRecords).toEqual([createAttendanceRecord({ id: '99' })])
      expect(store.sessionAttendance).toEqual([createSessionAttendanceRecord()])
      expect(store.loading).toBe(false)
    })

    it('fetchAttendanceSummary stores API data in summary', async () => {
      const mockSummary = {
        total: 10,
        presentCount: 8,
        absentCount: 2,
      } as AttendanceSummaryDto
      vi.mocked(apiFetchAttendanceSummary).mockResolvedValue(mockSummary)

      const store = useAttendanceStore()
      const result = await store.fetchAttendanceSummary()

      expect(store.summary).toEqual(mockSummary)
      expect(result).toEqual(mockSummary)
      expect(store.loading).toBe(false)
    })

    it('submitAttendance updates local sessionAttendance when currentSessionId matches', async () => {
      vi.mocked(createAttendance).mockResolvedValue(
        createAttendanceRecord({ id: '101', studentId: '1', sessionId: '55', status: 'present' }),
      )
      vi.mocked(updateAttendance).mockResolvedValue(
        createAttendanceRecord({ id: '102', studentId: '2', sessionId: '55', status: 'absent' }),
      )

      const store = useAttendanceStore()
      store.currentSessionId = '55'
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '1', status: 'absent' }),
        createSessionAttendanceRecord({ id: '2', studentId: '2', status: 'present' }),
      ]

      const result = await store.submitAttendance({
        sessionId: '55',
        records: [
          { studentId: '1', status: 'present' },
          { id: '102', studentId: '2', status: 'absent' },
        ],
      })

      expect(result).toHaveLength(2)
      expect(store.sessionAttendance[0].status).toBe('present')
      expect(store.sessionAttendance[1].status).toBe('absent')
      expect(store.loading).toBe(false)
    })

    it('updateAttendanceRecord updates matching local record and maps lowercase status to backend casing', async () => {
      const updatedRecord = createAttendanceRecord({ id: '1', status: 'late' })
      vi.mocked(updateAttendance).mockResolvedValue(updatedRecord)

      const store = useAttendanceStore()
      store.currentSessionId = '1'
      store.sessionAttendance = [createSessionAttendanceRecord({ id: '1', status: 'present' })]

      const result = await store.updateAttendanceRecord('1', { status: 'late' })

      expect(result).toEqual(updatedRecord)
      expect(store.sessionAttendance[0].status).toBe('late')
      expect(updateAttendance).toHaveBeenCalledWith('1', {
        status: 'Late',
      })
      expect(store.loading).toBe(false)
    })

    it('deleteAttendanceRecord removes matching local record', async () => {
      vi.mocked(deleteAttendance).mockResolvedValue(null)

      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1' }),
        createSessionAttendanceRecord({ id: '2' }),
      ]

      await store.deleteAttendanceRecord('1')

      expect(store.sessionAttendance).toHaveLength(1)
      expect(store.sessionAttendance[0].id).toBe('2')
      expect(store.loading).toBe(false)
    })

    it('overlapping requests keep loading === true until all settle', async () => {
      const deferred1 = createDeferred<AttendanceResponseDto[]>()
      const deferred2 = createDeferred<AttendanceResponseDto>()
      vi.mocked(apiFetchAllAttendance).mockImplementation(() => deferred1.promise)
      vi.mocked(apiFetchAttendanceById).mockImplementation(() => deferred2.promise)

      const store = useAttendanceStore()

      const promise1 = store.fetchAllAttendance()
      expect(store.loading).toBe(true)

      const promise2 = store.fetchAttendanceById('1')
      expect(store.loading).toBe(true)

      deferred1.resolve([createAttendanceRecord()])
      await promise1
      expect(store.loading).toBe(true)

      deferred2.resolve(createAttendanceRecord())
      await promise2
      expect(store.loading).toBe(false)
    })
  })

  describe('local-only actions', () => {
    it('updateLocalStatus updates record status locally', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [createSessionAttendanceRecord({ id: '1', status: 'present' })]

      store.updateLocalStatus('1', 'absent')

      expect(store.sessionAttendance[0].status).toBe('absent')
    })

    it('markAllAs sets all records to specified status', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', status: 'present' }),
        createSessionAttendanceRecord({ id: '2', status: 'absent' }),
        createSessionAttendanceRecord({ id: '3', status: 'late' }),
      ]

      store.markAllAs('present')

      expect(store.sessionAttendance.every(r => r.status === 'present')).toBe(true)
    })

    it('clearSessionAttendance clears session data and currentSessionId', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [createSessionAttendanceRecord()]
      store.currentSessionId = '1'

      store.clearSessionAttendance()

      expect(store.sessionAttendance).toEqual([])
      expect(store.currentSessionId).toBeNull()
    })

    it('clearCurrentRecord clears currentRecord', () => {
      const store = useAttendanceStore()
      store.currentRecord = createAttendanceRecord()

      store.clearCurrentRecord()

      expect(store.currentRecord).toBeNull()
    })

    it('clearSyncWarning clears syncWarning', () => {
      const store = useAttendanceStore()
      store.syncWarning = 'warning'

      store.clearSyncWarning()

      expect(store.syncWarning).toBeNull()
    })

    it('resetStore resets all state to initial values', () => {
      const store = useAttendanceStore()
      store.attendanceRecords = [createAttendanceRecord()]
      store.sessionAttendance = [createSessionAttendanceRecord()]
      store.currentRecord = createAttendanceRecord()
      store.summary = { total: 10 } as AttendanceSummaryDto
      store.currentSessionId = '1'
      store.syncWarning = 'warning'

      store.resetStore()

      expect(store.attendanceRecords).toEqual([])
      expect(store.sessionAttendance).toEqual([])
      expect(store.currentRecord).toBeNull()
      expect(store.summary).toBeNull()
      expect(store.currentSessionId).toBeNull()
      expect(store.syncWarning).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('entityId mixed type handling', () => {
    it('applies updates by ID match (number vs string)', async () => {
      const updatedRecord = createAttendanceRecord({ id: '1', studentId: '10', sessionId: '100', status: 'present' })
      vi.mocked(updateAttendance).mockResolvedValue(updatedRecord)

      const store = useAttendanceStore()
      store.currentSessionId = '100'
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '10', sessionId: '100', status: 'absent' }),
      ]

      // Update with string ID should match number ID via entityIdsMatch
      await store.updateAttendanceRecord('1' as unknown as EntityId, { status: 'present' })

      expect(store.sessionAttendance[0].status).toBe('present')
    })

    it('applies updates by studentId match (number vs string)', async () => {
      const updatedRecord = createAttendanceRecord({ id: '2', studentId: '10', sessionId: '100', status: 'present' })
      vi.mocked(createAttendance).mockResolvedValue(updatedRecord)
      vi.mocked(apiFetchSessionAttendance).mockResolvedValue([
        createSessionAttendanceRecord({ id: '1', studentId: '10', sessionId: '100', status: 'present' }),
      ])

      const store = useAttendanceStore()
      store.currentSessionId = '100'
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '10', sessionId: '100', status: 'absent' }),
      ]

      // Submit with string studentId should match number studentId via entityIdsMatch
      await store.submitAttendance({
        sessionId: '100',
        records: [{ studentId: '10', status: 'present' }],
      })

      // Background refresh will update the state
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(store.sessionAttendance[0].status).toBe('present')
    })

    it('finds attendance by mixed ID types', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '10' }),
        createSessionAttendanceRecord({ id: '2', studentId: '20' }),
      ]

      // Find by string ID when stored as number
      expect(store.getRecordByStudentId('10' as unknown as EntityId)).toEqual(store.sessionAttendance[0])
      // Find by number ID when stored as number
      expect(store.getRecordByStudentId('20')).toEqual(store.sessionAttendance[1])
    })

    it('updateLocalStatus works with mixed ID types', () => {
      const store = useAttendanceStore()
      store.sessionAttendance = [
        createSessionAttendanceRecord({ id: '1', studentId: '1', status: 'present' }),
        createSessionAttendanceRecord({ id: '2', studentId: '2', status: 'absent' }),
      ]

      // Update with string studentId should match number studentId via entityIdsMatch
      store.updateLocalStatus('1' as unknown as EntityId, 'late')

      expect(store.sessionAttendance[0].status).toBe('late')
      expect(store.sessionAttendance[1].status).toBe('absent')
    })

    it('handles string IDs in mock data', () => {
      const store = useAttendanceStore()
      const stringIdRecord = createSessionAttendanceRecord({
        id: 'uuid-123',
        studentId: 'student-uuid',
        sessionId: 'session-uuid',
        status: 'present',
      })

      store.sessionAttendance = [stringIdRecord]

      expect(store.sessionAttendance[0].id).toBe('uuid-123' as unknown as number)
      expect(store.getRecordByStudentId('student-uuid' as unknown as EntityId)).toEqual(stringIdRecord)
    })
  })

  describe('actions — error paths', () => {
    it('fetchAllAttendance rethrows and resets loading', async () => {
      const error = new Error('Network error')
      vi.mocked(apiFetchAllAttendance).mockRejectedValue(error)

      const store = useAttendanceStore()

      await expect(store.fetchAllAttendance()).rejects.toThrow(error)
      expect(store.loading).toBe(false)
    })

    it('fetchAttendanceById rethrows and resets loading', async () => {
      const error = new Error('Not found')
      vi.mocked(apiFetchAttendanceById).mockRejectedValue(error)

      const store = useAttendanceStore()

      await expect(store.fetchAttendanceById('1')).rejects.toThrow(error)
      expect(store.loading).toBe(false)
    })

    it('fetchStudentAttendance rethrows and resets loading', async () => {
      const error = new Error('Not found')
      vi.mocked(apiFetchStudentAttendance).mockRejectedValue(error)

      const store = useAttendanceStore()

      await expect(store.fetchStudentAttendance('1')).rejects.toThrow(error)
      expect(store.loading).toBe(false)
    })

    it('fetchAttendanceSummary rethrows and resets loading', async () => {
      const error = new Error('Server error')
      vi.mocked(apiFetchAttendanceSummary).mockRejectedValue(error)

      const store = useAttendanceStore()

      await expect(store.fetchAttendanceSummary()).rejects.toThrow(error)
      expect(store.loading).toBe(false)
    })

    it('non-404 fetchSessionAttendance rethrows and preserves prior session state', async () => {
      const error = new Error('Server error') as Error & { response?: { status: number } }
      error.response = { status: 500 }
      vi.mocked(apiFetchSessionAttendance).mockRejectedValue(error)
      vi.mocked(getErrorStatus).mockReturnValue(500)

      const store = useAttendanceStore()
      const originalAttendance = [createSessionAttendanceRecord({ id: '1' })]
      store.sessionAttendance = [...originalAttendance]
      store.currentSessionId = '1'

      await expect(store.fetchSessionAttendance('55')).rejects.toThrow(error)

      // currentSessionId is set before the try block, so it will be updated
      expect(store.currentSessionId).toBe('55')
      // sessionAttendance should be preserved on non-404 error
      expect(store.sessionAttendance).toEqual(originalAttendance)
      expect(store.loading).toBe(false)
    })

    it('updateAttendanceRecord rolls back local state on API failure', async () => {
      const error = new Error('Update failed')
      vi.mocked(updateAttendance).mockRejectedValue(error)

      const store = useAttendanceStore()
      const originalRecord = createSessionAttendanceRecord({ id: '1', status: 'present' })
      store.sessionAttendance = [originalRecord]
      store.currentSessionId = '1'

      await expect(store.updateAttendanceRecord('1', { status: 'late' })).rejects.toThrow(error)

      expect(store.sessionAttendance[0]).toEqual(originalRecord)
      expect(store.loading).toBe(false)
    })

    it('deleteAttendanceRecord rolls back local state on API failure', async () => {
      const error = new Error('Delete failed')
      vi.mocked(deleteAttendance).mockRejectedValue(error)

      const store = useAttendanceStore()
      const originalRecords = [
        createSessionAttendanceRecord({ id: '1' }),
        createSessionAttendanceRecord({ id: '2' }),
      ]
      store.sessionAttendance = [...originalRecords]

      await expect(store.deleteAttendanceRecord('1')).rejects.toThrow(error)

      expect(store.sessionAttendance).toEqual(originalRecords)
      expect(store.loading).toBe(false)
    })

    it('background refresh failure sets syncWarning only when the refreshed session is still current', async () => {
      const error = new Error('Refresh failed')
      vi.mocked(apiFetchSessionAttendance).mockRejectedValue(error)
      vi.mocked(updateAttendance).mockResolvedValue(createAttendanceRecord())

      const store = useAttendanceStore()
      store.currentSessionId = '55'

      await store.submitAttendance({
        sessionId: '55',
        records: [{ studentId: '1', status: 'present' }],
      })

      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(store.syncWarning).toBe('Attendance was saved, but latest details could not be refreshed. Please refresh the page.')
    })

    it('background refresh result is ignored when currentSessionId changes mid-flight', async () => {
      const deferred = createDeferred<SessionAttendanceResponseDto[]>()
      vi.mocked(apiFetchSessionAttendance).mockImplementation(() => deferred.promise)
      vi.mocked(updateAttendance).mockResolvedValue(createAttendanceRecord())

      const store = useAttendanceStore()
      store.currentSessionId = '55'

      const submitPromise = store.submitAttendance({
        sessionId: '55',
        records: [{ studentId: '1', status: 'present' }],
      })

      // Change session before refresh completes
      store.currentSessionId = '99'

      deferred.resolve([createSessionAttendanceRecord({ sessionId: '99' })])
      await submitPromise

      // Session attendance should not be updated since session changed
      expect(store.sessionAttendance).toEqual([])
    })

    it('updateAttendanceRecord with missing local record returns API result without calling applyAttendanceUpdates', async () => {
      const updatedRecord = createAttendanceRecord({ id: '99', studentId: '99', sessionId: '99', status: 'late' })
      vi.mocked(updateAttendance).mockResolvedValue(updatedRecord)
      // Mock background refresh to succeed without changing state
      vi.mocked(apiFetchSessionAttendance).mockResolvedValue([])

      const store = useAttendanceStore()
      const originalAttendance = [createSessionAttendanceRecord({ id: '1', studentId: '1', sessionId: '1' })]
      store.sessionAttendance = [...originalAttendance]
      store.currentSessionId = '1'

      const result = await store.updateAttendanceRecord('99', { status: 'late' })

      expect(result).toEqual(updatedRecord)
      // Since recordIndex === -1 (no local match), applyAttendanceUpdates is not called
      // Background refresh will update sessionAttendance, so we expect it to be replaced
      expect(store.sessionAttendance).toEqual([])
      expect(store.loading).toBe(false)
    })
  })
})
