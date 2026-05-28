import type { SessionAttendanceRecord } from '@/types/domain/attendance'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteAttendance as apiDeleteAttendance,
  updateAttendance as apiUpdateAttendance,
} from '@/api/attendance'
import { useAttendanceStore } from '@/stores/attendanceStore'

vi.mock('@/api/attendance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/attendance')>()
  return {
    ...actual,
    deleteAttendance: vi.fn(),
    updateAttendance: vi.fn(),
  }
})
vi.mock('@/utils/httpError')

function createSessionAttendanceRecord(overrides: Partial<SessionAttendanceRecord> = {}): SessionAttendanceRecord {
  return {
    id: '1',
    studentId: '1',
    sessionId: '1',
    status: 'present',
    notes: '',
    studentNumber: '',
    studentName: '',
    checkInTime: '',
    ...overrides,
  }
}

describe('attendanceStore rollback on API error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('updateAttendanceRecord rolls back sessionAttendance on error', () => {
    it('restores original records when API call rejects', async () => {
      const store = useAttendanceStore()
      const originalRecords = [
        createSessionAttendanceRecord({ id: '10', studentId: '100', status: 'present' }),
        createSessionAttendanceRecord({ id: '20', studentId: '200', status: 'absent' }),
      ]
      store.sessionAttendance = [...originalRecords]

      vi.mocked(apiUpdateAttendance).mockRejectedValue(new Error('network error'))

      await expect(
        store.updateAttendanceRecord('10', { status: 'late' }),
      ).rejects.toThrow('network error')

      expect(store.sessionAttendance).toEqual(originalRecords)
    })

    it('restores even after in-flight mutation to sessionAttendance', async () => {
      const store = useAttendanceStore()
      const originalRecords = [
        createSessionAttendanceRecord({ id: '10', studentId: '100', status: 'present' }),
      ]
      store.sessionAttendance = [...originalRecords]

      // Simulate in-flight mutation (optimistic UI changes the array before API returns)
      vi.mocked(apiUpdateAttendance).mockImplementation(async () => {
        store.sessionAttendance[0]!.status = 'absent'
        throw new Error('update failed')
      })

      await expect(
        store.updateAttendanceRecord('10', { status: 'late' }),
      ).rejects.toThrow('update failed')

      // After rollback, should match original snapshot
      expect(store.sessionAttendance[0]!.status).toBe('present')
    })
  })

  describe('deleteAttendanceRecord rolls back sessionAttendance on error', () => {
    it('restores original records when API call rejects', async () => {
      const store = useAttendanceStore()
      const originalRecords = [
        createSessionAttendanceRecord({ id: '30', studentId: '300', status: 'present' }),
        createSessionAttendanceRecord({ id: '40', studentId: '400', status: 'late' }),
      ]
      store.sessionAttendance = [...originalRecords]

      vi.mocked(apiDeleteAttendance).mockRejectedValue(new Error('delete failed'))

      await expect(
        store.deleteAttendanceRecord('30'),
      ).rejects.toThrow('delete failed')

      // Records should be fully restored, not partially filtered
      expect(store.sessionAttendance).toHaveLength(2)
      expect(store.sessionAttendance).toEqual(originalRecords)
    })

    it('restores even after in-flight removal from sessionAttendance', async () => {
      const store = useAttendanceStore()
      const originalRecords = [
        createSessionAttendanceRecord({ id: '30', studentId: '300', status: 'present' }),
        createSessionAttendanceRecord({ id: '40', studentId: '400', status: 'late' }),
      ]
      store.sessionAttendance = [...originalRecords]

      // Simulate in-flight removal (UI removes record before API returns)
      vi.mocked(apiDeleteAttendance).mockImplementation(async () => {
        store.sessionAttendance = store.sessionAttendance.filter(r => r.id !== '30')
        throw new Error('delete failed')
      })

      await expect(
        store.deleteAttendanceRecord('30'),
      ).rejects.toThrow('delete failed')

      // After rollback, should match original snapshot
      expect(store.sessionAttendance).toHaveLength(2)
      expect(store.sessionAttendance.find(r => r.id === '30')).toBeDefined()
    })
  })
})
