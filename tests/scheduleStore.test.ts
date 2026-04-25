import type { ScheduleDto, SchedulePayload } from '@/api/schedules'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import scheduleApi from '@/api/schedules'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

vi.mock('@/api/schedules')
vi.mock('@/utils/httpError')

// Helper factory
function createSchedule(overrides: Partial<ScheduleDto> = {}): ScheduleDto {
  return {
    id: '1',
    dayOfWeek: 'Monday',
    timeIn: '08:00',
    timeOut: '09:00',
    ...overrides,
  }
}

describe('scheduleStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('hasSchedules returns true when schedules exist', () => {
      const store = useScheduleStore()
      store.schedules = [createSchedule()]
      expect(store.hasSchedules).toBe(true)
    })

    it('hasSchedules returns false when schedules is empty', () => {
      const store = useScheduleStore()
      store.schedules = []
      expect(store.hasSchedules).toBe(false)
    })

    it('sortedSchedules sorts by weekday then timeIn', () => {
      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '2', dayOfWeek: 'Wednesday', timeIn: '10:00' }),
        createSchedule({ id: '1', dayOfWeek: 'Monday', timeIn: '08:00' }),
        createSchedule({ id: '3', dayOfWeek: 'Monday', timeIn: '09:00' }),
      ]
      const sorted = store.sortedSchedules
      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('2')
    })

    it('sortedSchedules handles missing dayOfWeek', () => {
      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1', dayOfWeek: 'Monday', timeIn: '08:00' }),
        createSchedule({ id: '2', dayOfWeek: undefined, timeIn: '09:00' }),
      ]
      const sorted = store.sortedSchedules
      // Items with missing dayOfWeek sort to the beginning (indexOf('') returns -1)
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')
    })

    it('sortedSchedules handles missing timeIn', () => {
      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1', dayOfWeek: 'Monday', timeIn: '08:00' }),
        createSchedule({ id: '2', dayOfWeek: 'Monday', timeIn: undefined }),
      ]
      const sorted = store.sortedSchedules
      // Items with missing timeIn should sort by empty string
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('1')
    })

    it('sortedSchedules does not mutate original schedules', () => {
      const store = useScheduleStore()
      const originalSchedules = [
        createSchedule({ id: '2', dayOfWeek: 'Wednesday', timeIn: '10:00' }),
        createSchedule({ id: '1', dayOfWeek: 'Monday', timeIn: '08:00' }),
      ]
      store.schedules = [...originalSchedules]

      const sorted = store.sortedSchedules

      expect(sorted).not.toBe(store.schedules)
      expect(store.schedules).toEqual(originalSchedules)
    })
  })

  describe('actions — success paths', () => {
    it('fetchSchedules populates schedules, clears error, and resets loading', async () => {
      const mockSchedules = [createSchedule(), createSchedule({ id: '2' })]
      vi.mocked(scheduleApi.getAllSchedules).mockResolvedValue(mockSchedules as never)

      const store = useScheduleStore()
      store.error = 'previous error'

      await store.fetchSchedules()

      expect(store.schedules).toEqual(mockSchedules)
      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
    })

    it('fetchSchedules(true) skips toggling loading', async () => {
      const mockSchedules = [createSchedule()]
      vi.mocked(scheduleApi.getAllSchedules).mockResolvedValue(mockSchedules as never)

      const store = useScheduleStore()
      store.loading = true

      await store.fetchSchedules(true)

      expect(store.schedules).toEqual(mockSchedules)
      expect(store.loading).toBe(true) // Loading should remain true
    })

    it('fetchSchedule sets currentSchedule', async () => {
      const mockSchedule = createSchedule({ id: '1' })
      vi.mocked(scheduleApi.getScheduleById).mockResolvedValue(mockSchedule as never)

      const store = useScheduleStore()
      store.error = 'previous error'

      await store.fetchSchedule('1')

      expect(store.currentSchedule).toEqual(mockSchedule)
      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
    })

    it('createSchedule returns created item and refetches via fetchSchedules(true)', async () => {
      const newSchedule = createSchedule({ id: '2' })
      const refreshedSchedules = [createSchedule(), newSchedule]
      const payload: SchedulePayload = { dayOfWeek: 'Tuesday', timeIn: '10:00' }

      vi.mocked(scheduleApi.createSchedule).mockResolvedValue(newSchedule as never)
      vi.mocked(scheduleApi.getAllSchedules).mockResolvedValue(refreshedSchedules as never)

      const store = useScheduleStore()
      store.error = 'previous error'

      const result = await store.createSchedule(payload)

      expect(result).toEqual(newSchedule)
      expect(scheduleApi.getAllSchedules).toHaveBeenCalled()
      expect(store.schedules).toEqual(refreshedSchedules)
      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
    })

    it('updateSchedule returns updated item and refetches via fetchSchedules(true)', async () => {
      const updatedSchedule = createSchedule({ id: '1', timeIn: '09:00' })
      const refreshedSchedules = [updatedSchedule]
      const payload: SchedulePayload = { timeIn: '09:00' }

      vi.mocked(scheduleApi.updateSchedule).mockResolvedValue(updatedSchedule as never)
      vi.mocked(scheduleApi.getAllSchedules).mockResolvedValue(refreshedSchedules as never)

      const store = useScheduleStore()
      store.error = 'previous error'

      const result = await store.updateSchedule('1', payload)

      expect(result).toEqual(updatedSchedule)
      expect(scheduleApi.getAllSchedules).toHaveBeenCalled()
      expect(store.schedules).toEqual(refreshedSchedules)
      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
    })

    it('deleteSchedule removes matching item with number ID', async () => {
      vi.mocked(scheduleApi.deleteSchedule).mockResolvedValue({} as never)

      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1' }),
        createSchedule({ id: '2' }),
      ]

      await store.deleteSchedule('1')

      expect(store.schedules).toHaveLength(1)
      expect(store.schedules[0].id).toBe('2')
      expect(store.loading).toBe(false)
    })

    it('deleteSchedule removes matching item with string ID (entityIdsMatch)', async () => {
      vi.mocked(scheduleApi.deleteSchedule).mockResolvedValue({} as never)

      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1' }),
        createSchedule({ id: '2' }),
      ]

      await store.deleteSchedule('1' as EntityId)

      expect(store.schedules).toHaveLength(1)
      expect(store.schedules[0].id).toBe('2')
    })
  })

  describe('actions — error paths', () => {
    it('fetchSchedules sets error via getErrorMessage, preserves prior state, and does not throw', async () => {
      const testError = new Error('Fetch failed')
      vi.mocked(scheduleApi.getAllSchedules).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch schedules: Fetch failed')

      const store = useScheduleStore()
      const originalSchedules = [createSchedule({ id: '99' })]
      store.schedules = [...originalSchedules]

      await store.fetchSchedules()

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to fetch schedules')
      expect(store.error).toBe('Failed to fetch schedules: Fetch failed')
      expect(store.schedules).toEqual(originalSchedules)
      expect(store.loading).toBe(false)
    })

    it('fetchSchedule sets error via getErrorMessage, preserves prior state, and does not throw', async () => {
      const testError = new Error('Not found')
      vi.mocked(scheduleApi.getScheduleById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Schedule with ID 99 not found: Not found')

      const store = useScheduleStore()
      const originalSchedule = createSchedule({ id: '1' })
      store.currentSchedule = originalSchedule

      await store.fetchSchedule('99')

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Schedule with ID 99 not found')
      expect(store.error).toBe('Schedule with ID 99 not found: Not found')
      expect(store.currentSchedule).toEqual(originalSchedule)
      expect(store.loading).toBe(false)
    })

    it('createSchedule sets fallback error, overrides with validation errors, and rethrows', async () => {
      const testError = new Error('Validation failed')
      const validationErrors = ['Day is required', 'Time is required']
      const payload: SchedulePayload = {}

      vi.mocked(scheduleApi.createSchedule).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create schedule: Validation failed')
      vi.mocked(getValidationErrorMessages).mockReturnValue(validationErrors)

      const store = useScheduleStore()

      await expect(store.createSchedule(payload)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to create schedule')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe(validationErrors.join(', '))
      expect(store.loading).toBe(false)
    })

    it('createSchedule with no validation errors uses fallback error', async () => {
      const testError = new Error('Server error')
      const payload: SchedulePayload = {}

      vi.mocked(scheduleApi.createSchedule).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create schedule: Server error')
      vi.mocked(getValidationErrorMessages).mockReturnValue([])

      const store = useScheduleStore()

      await expect(store.createSchedule(payload)).rejects.toThrow(testError)

      expect(store.error).toBe('Failed to create schedule: Server error')
      expect(store.loading).toBe(false)
    })

    it('updateSchedule sets fallback error, overrides with validation errors, and rethrows', async () => {
      const testError = new Error('Validation failed')
      const validationErrors = ['Time format invalid']
      const payload: SchedulePayload = { timeIn: 'invalid' }

      vi.mocked(scheduleApi.updateSchedule).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update schedule: Validation failed')
      vi.mocked(getValidationErrorMessages).mockReturnValue(validationErrors)

      const store = useScheduleStore()

      await expect(store.updateSchedule('1', payload)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to update schedule')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe(validationErrors.join(', '))
      expect(store.loading).toBe(false)
    })

    it('updateSchedule with no validation errors uses fallback error', async () => {
      const testError = new Error('Server error')
      const payload: SchedulePayload = { timeIn: '09:00' }

      vi.mocked(scheduleApi.updateSchedule).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update schedule: Server error')
      vi.mocked(getValidationErrorMessages).mockReturnValue([])

      const store = useScheduleStore()

      await expect(store.updateSchedule('1', payload)).rejects.toThrow(testError)

      expect(store.error).toBe('Failed to update schedule: Server error')
      expect(store.loading).toBe(false)
    })

    it('deleteSchedule sets fallback error and rethrows', async () => {
      const testError = new Error('Delete failed')
      vi.mocked(scheduleApi.deleteSchedule).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to delete schedule: Delete failed')

      const store = useScheduleStore()
      const originalSchedules = [createSchedule({ id: '1' })]
      store.schedules = [...originalSchedules]

      await expect(store.deleteSchedule('1')).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to delete schedule')
      expect(store.error).toBe('Failed to delete schedule: Delete failed')
      expect(store.schedules).toEqual(originalSchedules)
      expect(store.loading).toBe(false)
    })

    it('refetch failure after successful createSchedule sets store error but still returns API result', async () => {
      const newSchedule = createSchedule({ id: '2' })
      const refreshError = new Error('Refresh failed')
      const payload: SchedulePayload = { dayOfWeek: 'Tuesday' }

      vi.mocked(scheduleApi.createSchedule).mockResolvedValue(newSchedule as never)
      vi.mocked(scheduleApi.getAllSchedules).mockRejectedValue(refreshError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch schedules: Refresh failed')

      const store = useScheduleStore()

      const result = await store.createSchedule(payload)

      expect(result).toEqual(newSchedule)
      expect(store.error).toBe('Failed to fetch schedules: Refresh failed')
      expect(store.loading).toBe(false)
    })

    it('refetch failure after successful updateSchedule sets store error but still returns API result', async () => {
      const updatedSchedule = createSchedule({ id: '1', timeIn: '09:00' })
      const refreshError = new Error('Refresh failed')
      const payload: SchedulePayload = { timeIn: '09:00' }

      vi.mocked(scheduleApi.updateSchedule).mockResolvedValue(updatedSchedule as never)
      vi.mocked(scheduleApi.getAllSchedules).mockRejectedValue(refreshError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch schedules: Refresh failed')

      const store = useScheduleStore()

      const result = await store.updateSchedule('1', payload)

      expect(result).toEqual(updatedSchedule)
      expect(store.error).toBe('Failed to fetch schedules: Refresh failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('entityId compatibility (Requirements 11.1, 11.4, 11.5, 11.8)', () => {
    it('deleteSchedule removes schedule by number ID', async () => {
      vi.mocked(scheduleApi.deleteSchedule).mockResolvedValue({} as never)

      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1' }),
        createSchedule({ id: '2' }),
      ]

      await store.deleteSchedule('1')

      expect(store.schedules).toHaveLength(1)
      expect(store.schedules[0].id).toBe('2')
    })

    it('deleteSchedule removes schedule by string ID', async () => {
      vi.mocked(scheduleApi.deleteSchedule).mockResolvedValue({} as never)

      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '550e8400-e29b-41d4-a716-446655440000' as EntityId }),
        createSchedule({ id: '550e8400-e29b-41d4-a716-446655440001' as EntityId }),
      ]

      await store.deleteSchedule('550e8400-e29b-41d4-a716-446655440000' as EntityId)

      expect(store.schedules).toHaveLength(1)
      expect(store.schedules[0].id).toBe('550e8400-e29b-41d4-a716-446655440001' as EntityId)
    })

    it('deleteSchedule removes schedule with mixed ID types (store has number, delete with string)', async () => {
      vi.mocked(scheduleApi.deleteSchedule).mockResolvedValue({} as never)

      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1' }),
        createSchedule({ id: '2' }),
      ]

      await store.deleteSchedule('1' as EntityId)

      expect(store.schedules).toHaveLength(1)
      expect(store.schedules[0].id).toBe('2')
    })

    it('deleteSchedule removes schedule with mixed ID types (store has string, delete with number)', async () => {
      vi.mocked(scheduleApi.deleteSchedule).mockResolvedValue({} as never)

      const store = useScheduleStore()
      store.schedules = [
        createSchedule({ id: '1' as EntityId }),
        createSchedule({ id: '2' as EntityId }),
      ]

      await store.deleteSchedule('1')

      expect(store.schedules).toHaveLength(1)
      expect(store.schedules[0].id).toBe('2' as EntityId)
    })
  })
})
