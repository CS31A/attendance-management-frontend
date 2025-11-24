import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import studentsApi from '@/api/students.js'

export const useStudentStore = defineStore('students', () => {
  // State
  const students = ref([])
  const currentStudent = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getStudents = computed(() => students.value)
  const getCurrentStudent = computed(() => currentStudent.value)
  const isLoading = computed(() => loading.value)
  const getError = computed(() => error.value)

  // Actions
  async function fetchStudents() {
    loading.value = true
    error.value = null
    try {
      // Para sa skeleton loader simulation
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await studentsApi.getAllStudents()
      students.value = response.data
      return response.data
    }
    catch (err) {
      console.error('Error fetching students:', err)
      error.value = err.response?.data?.message || 'Failed to fetch students'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function fetchStudentById(id) {
    loading.value = true
    error.value = null
    try {
      const response = await studentsApi.getStudentById(id)
      currentStudent.value = response.data
      return response.data
    }
    catch (err) {
      console.error('Error fetching student:', err)
      error.value = err.response?.data?.message || 'Failed to fetch student'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateStudent(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await studentsApi.updateStudent(id, data)
      // Update in local list if exists
      const index = students.value.findIndex(s => s.id === id)
      if (index !== -1) {
        students.value[index] = response.data
      }
      // Update current student if it's the same
      if (currentStudent.value?.id === id) {
        currentStudent.value = response.data
      }
      return response.data
    }
    catch (err) {
      console.error('Error updating student:', err)
      error.value = err.response?.data?.message || 'Failed to update student'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteStudent(id) {
    loading.value = true
    error.value = null
    try {
      await studentsApi.softDeleteStudent(id)
      // Remove from local list
      students.value = students.value.filter(s => s.id !== id)
      // Clear current student if it's the same
      if (currentStudent.value?.id === id) {
        currentStudent.value = null
      }
    }
    catch (err) {
      console.error('Error deleting student:', err)
      error.value = err.response?.data?.message || 'Failed to delete student'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function restoreStudent(id) {
    loading.value = true
    error.value = null
    try {
      const response = await studentsApi.restoreStudent(id)
      // Add back to local list
      students.value.push(response.data)
      return response.data
    }
    catch (err) {
      console.error('Error restoring student:', err)
      error.value = err.response?.data?.message || 'Failed to restore student'
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
    students,
    currentStudent,
    loading,
    error,
    // Getters
    getStudents,
    getCurrentStudent,
    isLoading,
    getError,
    // Actions
    fetchStudents,
    fetchStudentById,
    updateStudent,
    deleteStudent,
    restoreStudent,
    clearError,
  }
})
