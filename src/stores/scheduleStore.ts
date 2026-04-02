import type { ScheduleCollectionDto, ScheduleDto, SchedulePayload } from '@/api/schedules'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import scheduleApi from '@/api/schedules'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

export const useScheduleStore = defineStore('schedule', () => {
  // State
  const schedules = ref<ScheduleCollectionDto>([])
  const currentSchedule = ref<ScheduleDto | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Getters
  const hasSchedules = computed(() => schedules.value.length > 0)
  const sortedSchedules = computed(() =>
    [...schedules.value].sort((a, b) => {
      // Sort by day of week first, then by time
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const dayDiff = dayOrder.indexOf(a.dayOfWeek || '') - dayOrder.indexOf(b.dayOfWeek || '')
      if (dayDiff !== 0)
        return dayDiff
      return (a.timeIn || '').localeCompare(b.timeIn || '')
    }),
  )

  // Actions
  async function fetchSchedules(skipLoadingState = false) {
    if (!skipLoadingState) {
      loading.value = true
    }
    error.value = ''
    try {
      const data = await scheduleApi.getAllSchedules()
      schedules.value = data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to fetch schedules')
      console.error('Error fetching schedules:', err)
    }
    finally {
      if (!skipLoadingState) {
        loading.value = false
      }
    }
  }

  async function fetchSchedule(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      const data = await scheduleApi.getScheduleById(id)
      currentSchedule.value = data
    }
    catch (err) {
      error.value = getErrorMessage(err, `Schedule with ID ${id} not found`)
      console.error('Error fetching schedule:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function createSchedule(data: SchedulePayload) {
    loading.value = true
    error.value = ''
    try {
      const newSchedule = await scheduleApi.createSchedule(data)
      // Refetch all schedules to ensure we have fully populated data
      await fetchSchedules(true)
      return newSchedule
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to create schedule')
      const validationErrors = getValidationErrorMessages(err)
      if (validationErrors.length > 0)
        error.value = validationErrors.join(', ')

      console.error('Error creating schedule:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateSchedule(id: EntityId, data: SchedulePayload) {
    loading.value = true
    error.value = ''
    try {
      const updatedSchedule = await scheduleApi.updateSchedule(id, data)
      // Refetch all schedules to ensure we have fully populated data
      await fetchSchedules(true)
      return updatedSchedule
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to update schedule')
      const validationErrors = getValidationErrorMessages(err)
      if (validationErrors.length > 0)
        error.value = validationErrors.join(', ')

      console.error('Error updating schedule:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteSchedule(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      await scheduleApi.deleteSchedule(id)
      schedules.value = schedules.value.filter(s => !entityIdsMatch(s.id, id))
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to delete schedule')
      console.error('Error deleting schedule:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    schedules,
    currentSchedule,
    loading,
    error,

    // Getters
    hasSchedules,
    sortedSchedules,

    // Actions
    fetchSchedules,
    fetchSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  }
})
