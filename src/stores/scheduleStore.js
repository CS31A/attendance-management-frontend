import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import scheduleApi from '@/api/schedules'

export const useScheduleStore = defineStore('schedule', () => {
  // State
  const schedules = ref([])
  const currentSchedule = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const hasSchedules = computed(() => schedules.value.length > 0)
  const sortedSchedules = computed(() =>
    [...schedules.value].sort((a, b) => {
      // Sort by day of week first, then by time
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
      if (dayDiff !== 0)
        return dayDiff
      return a.timeIn?.localeCompare(b.timeIn) || 0
    }),
  )

  // Actions
  async function fetchSchedules(skipLoadingState = false) {
    if (!skipLoadingState) {
      loading.value = true
    }
    error.value = null
    try {
      const data = await scheduleApi.getAllSchedules()
      schedules.value = data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch schedules'
      console.error('Error fetching schedules:', err)
    }
    finally {
      if (!skipLoadingState) {
        loading.value = false
      }
    }
  }

  async function fetchSchedule(id) {
    loading.value = true
    error.value = null
    try {
      const data = await scheduleApi.getScheduleById(id)
      currentSchedule.value = data
    }
    catch (err) {
      error.value = err.response?.data?.message || `Schedule with ID ${id} not found`
      console.error('Error fetching schedule:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function createSchedule(data) {
    loading.value = true
    error.value = null
    try {
      const newSchedule = await scheduleApi.createSchedule(data)
      // Refetch all schedules to ensure we have fully populated data
      await fetchSchedules(true)
      return newSchedule
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to create schedule'

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        error.value = Object.values(validationErrors).flat().join(', ')
      }

      console.error('Error creating schedule:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateSchedule(id, data) {
    loading.value = true
    error.value = null
    try {
      const updatedSchedule = await scheduleApi.updateSchedule(id, data)
      // Refetch all schedules to ensure we have fully populated data
      await fetchSchedules(true)
      return updatedSchedule
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to update schedule'

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        error.value = Object.values(validationErrors).flat().join(', ')
      }

      console.error('Error updating schedule:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteSchedule(id) {
    loading.value = true
    error.value = null
    try {
      await scheduleApi.deleteSchedule(id)
      schedules.value = schedules.value.filter(s => s.id !== id)
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete schedule'
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
