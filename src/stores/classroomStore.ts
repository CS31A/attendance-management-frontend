import type { ClassroomDto, ClassroomPayload } from '@/api/classrooms'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import classroomApi from '@/api/classrooms'

export const useClassroomStore = defineStore('classroom', () => {
  // State
  const classrooms = ref<ClassroomDto[]>([])
  const currentClassroom = ref<ClassroomDto | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Getters
  const hasClassrooms = computed(() => classrooms.value.length > 0)
  const sortedClassrooms = computed(() =>
    [...classrooms.value].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  )

  // Actions
  async function fetchClassrooms() {
    loading.value = true
    error.value = ''
    try {
      const response = await classroomApi.getAllClassrooms()
      classrooms.value = response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch classrooms'
      console.error('Error fetching classrooms:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchClassroom(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      const response = await classroomApi.getClassroomById(id)
      currentClassroom.value = response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || `Classroom with ID ${id} not found`
      console.error('Error fetching classroom:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function createClassroom(data: ClassroomPayload) {
    loading.value = true
    error.value = ''
    try {
      const response = await classroomApi.createClassroom(data)
      classrooms.value.push(response.data)
      return response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to create classroom'

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        error.value = Object.values(validationErrors).flat().join(', ')
      }

      console.error('Error creating classroom:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateClassroom(id: EntityId, data: ClassroomPayload) {
    loading.value = true
    error.value = ''
    try {
      const response = await classroomApi.updateClassroom(id, data)
      const index = classrooms.value.findIndex(c => c.id === id)
      if (index !== -1) {
        classrooms.value[index] = response.data
      }
      return response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to update classroom'

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        error.value = Object.values(validationErrors).flat().join(', ')
      }

      console.error('Error updating classroom:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteClassroom(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      await classroomApi.deleteClassroom(id)
      classrooms.value = classrooms.value.filter(c => c.id !== id)
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete classroom'
      console.error('Error deleting classroom:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    classrooms,
    currentClassroom,
    loading,
    error,

    // Getters
    hasClassrooms,
    sortedClassrooms,

    // Actions
    fetchClassrooms,
    fetchClassroom,
    createClassroom,
    updateClassroom,
    deleteClassroom,
  }
})
