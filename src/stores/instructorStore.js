import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import instructorsApi from '@/api/instructors.js'

export const useInstructorStore = defineStore('instructors', () => {
  // State
  const instructors = ref([])
  const currentInstructor = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getInstructors = computed(() => instructors.value)
  const getCurrentInstructor = computed(() => currentInstructor.value)
  const isLoading = computed(() => loading.value)
  const getError = computed(() => error.value)

  // Actions
  async function fetchInstructors() {
    loading.value = true
    error.value = null
    try {
      // Para sa skeleton loader simulation
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await instructorsApi.getAllInstructors()
      // Map the API response fields to match frontend component expectations
      instructors.value = response.map(instructor => ({
        id: instructor.id,
        firstName: instructor.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: instructor.lastname, // API returns 'lastname', component expects 'lastName'
        instructorId: instructor.userId, // API returns 'userId', component expects 'instructorId'
        email: instructor.email || '-', // Add email placeholder if not in API response
        createdAt: instructor.createdAt,
        updatedAt: instructor.updatedAt,
        deletedAt: instructor.isDeleted ? instructor.updatedAt : null, // Use isDeleted to determine deleted status
        isDeleted: instructor.isDeleted,
        userId: instructor.userId, // Keep original field for other uses
      }))
      return instructors.value
    }
    catch (err) {
      console.error('Error fetching instructors:', err)
      error.value = err.response?.data?.message || 'Failed to fetch instructors'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function fetchInstructorById(id) {
    loading.value = true
    error.value = null
    try {
      const response = await instructorsApi.getInstructorById(id)
      // Map the API response fields to match frontend component expectations
      currentInstructor.value = {
        id: response.id,
        firstName: response.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: response.lastname, // API returns 'lastname', component expects 'lastName'
        instructorId: response.userId, // API returns 'userId', component expects 'instructorId'
        email: response.email || '-', // Add email placeholder if not in API response
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        deletedAt: response.isDeleted ? response.updatedAt : null, // Use isDeleted to determine deleted status
        isDeleted: response.isDeleted,
        userId: response.userId, // Keep original field for other uses
      }
      return currentInstructor.value
    }
    catch (err) {
      console.error('Error fetching instructor:', err)
      error.value = err.response?.data?.message || 'Failed to fetch instructor'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateInstructor(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await instructorsApi.updateInstructor(id, data)
      // Map the API response fields to match frontend component expectations
      const mappedInstructor = {
        id: response.id,
        firstName: response.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: response.lastname, // API returns 'lastname', component expects 'lastName'
        instructorId: response.userId, // API returns 'userId', component expects 'instructorId'
        email: response.email || '-', // Add email placeholder if not in API response
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        deletedAt: response.isDeleted ? response.updatedAt : null, // Use isDeleted to determine deleted status
        isDeleted: response.isDeleted,
        userId: response.userId, // Keep original field for other uses
      }
      // Update in local list if exists
      const index = instructors.value.findIndex(i => i.id === id)
      if (index !== -1) {
        instructors.value[index] = mappedInstructor
      }
      // Update current instructor if it's the same
      if (currentInstructor.value?.id === id) {
        currentInstructor.value = mappedInstructor
      }
      return mappedInstructor
    }
    catch (err) {
      console.error('Error updating instructor:', err)
      error.value = err.response?.data?.message || 'Failed to update instructor'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteInstructor(id) {
    loading.value = true
    error.value = null
    try {
      await instructorsApi.softDeleteInstructor(id)
      // Update the instructor's deleted status in the local list instead of removing
      const index = instructors.value.findIndex(i => i.id === id)
      if (index !== -1) {
        instructors.value[index].deletedAt = new Date().toISOString() // Set current timestamp
        instructors.value[index].isDeleted = true // Mark as deleted
      }
      // Update current instructor if it's the same
      if (currentInstructor.value?.id === id) {
        currentInstructor.value = {
          ...currentInstructor.value,
          deletedAt: new Date().toISOString(),
          isDeleted: true,
        }
      }
    }
    catch (err) {
      console.error('Error deleting instructor:', err)
      error.value = err.response?.data?.message || 'Failed to delete instructor'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function restoreInstructor(id) {
    loading.value = true
    error.value = null
    try {
      const response = await instructorsApi.restoreInstructor(id)
      // Map the API response fields to match frontend component expectations
      const mappedInstructor = {
        id: response.id,
        firstName: response.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: response.lastname, // API returns 'lastname', component expects 'lastName'
        instructorId: response.userId, // API returns 'userId', component expects 'instructorId'
        email: response.email || '-', // Add email placeholder if not in API response
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        deletedAt: null, // Restored instructor should not have deletedAt
        isDeleted: false, // Restored instructor should not be marked as deleted
        userId: response.userId, // Keep original field for other uses
      }
      // Update in local list if exists
      const index = instructors.value.findIndex(i => i.id === id)
      if (index !== -1) {
        instructors.value[index] = mappedInstructor
      }
      else {
        // Add to list if not present
        instructors.value.push(mappedInstructor)
      }
      return mappedInstructor
    }
    catch (err) {
      console.error('Error restoring instructor:', err)
      error.value = err.response?.data?.message || 'Failed to restore instructor'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    instructors,
    currentInstructor,
    loading,
    error,
    // Getters
    getInstructors,
    getCurrentInstructor,
    isLoading,
    getError,
    // Actions
    fetchInstructors,
    fetchInstructorById,
    updateInstructor,
    deleteInstructor,
    restoreInstructor,
    clearError,
  }
})
