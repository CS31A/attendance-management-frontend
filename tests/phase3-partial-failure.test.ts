import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as attendanceApi from '@/api/attendance'
import { useAttendanceStore } from '@/stores/attendanceStore'

vi.mock('@/api/attendance')

describe('phase 3: Partial-failure behavior and user clarity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows "2 of 3 saved" when record 1 of 3 fails', async () => {
    const store = useAttendanceStore()

    let callCount = 0
    vi.mocked(attendanceApi.createAttendance).mockImplementation(async () => {
      callCount++
      if (callCount === 3) {
        throw new Error('Network error')
      }
      return {
        id: String(callCount),
        sessionId: '1',
        studentId: String(callCount),
        status: 'present',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    try {
      await store.submitAttendance({
        sessionId: '1',
        records: [
          { studentId: '1', status: 'present', notes: '' },
          { studentId: '2', status: 'present', notes: '' },
          { studentId: '3', status: 'present', notes: '' },
        ],
      })
    }
    catch (error) {
      expect(store.syncWarning).toBe('2 of 3 records saved. Please refresh the page to review the latest attendance details.')
      expect((error as { savedCount?: number }).savedCount).toBe(2)
      expect((error as { totalCount?: number }).totalCount).toBe(3)
      return
    }

    throw new Error('Expected submitAttendance to throw')
  })

  it('does not set syncWarning when record 1 of 1 fails', async () => {
    const store = useAttendanceStore()

    vi.mocked(attendanceApi.createAttendance).mockRejectedValue(new Error('Network error'))

    try {
      await store.submitAttendance({
        sessionId: '1',
        records: [
          { studentId: '1', status: 'present', notes: '' },
        ],
      })
    }
    catch (error) {
      expect(store.syncWarning).toBeNull()
      expect((error as { savedCount?: number }).savedCount).toBe(0)
      expect((error as { totalCount?: number }).totalCount).toBe(1)
      return
    }

    throw new Error('Expected submitAttendance to throw')
  })

  it('attaches savedCount and totalCount metadata to error', async () => {
    const store = useAttendanceStore()

    let callCount = 0
    vi.mocked(attendanceApi.createAttendance).mockImplementation(async () => {
      callCount++
      if (callCount === 2) {
        throw new Error('Database error')
      }
      return {
        id: String(callCount),
        sessionId: '1',
        studentId: String(callCount),
        status: 'present',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    try {
      await store.submitAttendance({
        sessionId: '1',
        records: [
          { studentId: '1', status: 'present', notes: '' },
          { studentId: '2', status: 'present', notes: '' },
          { studentId: '3', status: 'present', notes: '' },
          { studentId: '4', status: 'present', notes: '' },
        ],
      })
    }
    catch (error) {
      const enhancedError = error as { savedCount?: number, totalCount?: number }
      expect(enhancedError.savedCount).toBe(1)
      expect(enhancedError.totalCount).toBe(4)
      expect(store.syncWarning).toBe('1 of 4 records saved. Please refresh the page to review the latest attendance details.')
      return
    }

    throw new Error('Expected submitAttendance to throw')
  })
})
