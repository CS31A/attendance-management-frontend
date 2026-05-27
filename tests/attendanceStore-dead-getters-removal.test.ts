import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAttendanceStore } from '@/stores/attendanceStore'

describe('attendanceStore dead getters removal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('removed getters no longer exist on store', () => {
    it('does NOT export presentRecords', () => {
      const store = useAttendanceStore()
      expect(store).not.toHaveProperty('presentRecords')
    })

    it('does NOT export absentRecords', () => {
      const store = useAttendanceStore()
      expect(store).not.toHaveProperty('absentRecords')
    })

    it('does NOT export lateRecords', () => {
      const store = useAttendanceStore()
      expect(store).not.toHaveProperty('lateRecords')
    })

    it('does NOT export excusedRecords', () => {
      const store = useAttendanceStore()
      expect(store).not.toHaveProperty('excusedRecords')
    })

    it('does NOT export recordsByStatus', () => {
      const store = useAttendanceStore()
      expect(store).not.toHaveProperty('recordsByStatus')
    })
  })

  describe('retained state still exists', () => {
    it('exports sessionAttendance', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('sessionAttendance')
    })

    it('exports loading', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('loading')
    })

    it('exports currentRecord', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('currentRecord')
    })

    it('exports summary', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('summary')
    })

    it('exports currentSessionId', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('currentSessionId')
    })

    it('exports syncWarning', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('syncWarning')
    })
  })

  describe('retained getters still exist', () => {
    it('exports sessionStats', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('sessionStats')
    })

    it('exports getRecordByStudentId', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('getRecordByStudentId')
    })

    it('exports hasAttendanceData', () => {
      const store = useAttendanceStore()
      expect(store).toHaveProperty('hasAttendanceData')
    })
  })

  describe('retained actions still exist', () => {
    const expectedActions = [
      'fetchAllAttendance',
      'fetchAttendanceById',
      'fetchSessionAttendance',
      'fetchStudentAttendance',
      'fetchAttendanceSummary',
      'submitAttendance',
      'updateAttendanceRecord',
      'deleteAttendanceRecord',
      'updateLocalStatus',
      'markAllAs',
      'clearSessionAttendance',
      'clearCurrentRecord',
      'clearSyncWarning',
      'resetStore',
    ]

    for (const actionName of expectedActions) {
      it(`exports ${actionName}`, () => {
        const store = useAttendanceStore()
        expect(store).toHaveProperty(actionName)
        expect(typeof store[actionName as keyof typeof store]).toBe('function')
      })
    }
  })
})
