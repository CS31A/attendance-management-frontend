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
      // Map the API response fields to match frontend component expectations
      students.value = response.data.map(student => ({
        id: student.id,
        firstName: student.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: student.lastname, // API returns 'lastname', component expects 'lastName'
        studentId: student.userId, // API returns 'userId', component expects 'studentId'
        email: student.email || '-', // Add email placeholder if not in API response
        section: student.sectionId || '-', // API returns 'sectionId', component expects 'section'
        isRegular: student.isRegular,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        deletedAt: student.isDeleted ? student.updatedAt : null, // Use isDeleted to determine deleted status
        isDeleted: student.isDeleted,
        userId: student.userId, // Keep original field for other uses
        sectionId: student.sectionId // Keep original field for other uses
      }))
      return students.value
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
      // Map the API response fields to match frontend component expectations
      currentStudent.value = {
        id: response.data.id,
        firstName: response.data.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: response.data.lastname, // API returns 'lastname', component expects 'lastName'
        studentId: response.data.userId, // API returns 'userId', component expects 'studentId'
        email: response.data.email || '-', // Add email placeholder if not in API response
        section: response.data.sectionId || '-', // API returns 'sectionId', component expects 'section'
        isRegular: response.data.isRegular,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        deletedAt: response.data.isDeleted ? response.data.updatedAt : null, // Use isDeleted to determine deleted status
        isDeleted: response.data.isDeleted,
        userId: response.data.userId, // Keep original field for other uses
        sectionId: response.data.sectionId // Keep original field for other uses
      }
      return currentStudent.value
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
      // Map the API response fields to match frontend component expectations
      const mappedStudent = {
        id: response.data.id,
        firstName: response.data.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: response.data.lastname, // API returns 'lastname', component expects 'lastName'
        studentId: response.data.userId, // API returns 'userId', component expects 'studentId'
        email: response.data.email || '-', // Add email placeholder if not in API response
        section: response.data.sectionId || '-', // API returns 'sectionId', component expects 'section'
        isRegular: response.data.isRegular,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        deletedAt: response.data.isDeleted ? response.data.updatedAt : null, // Use isDeleted to determine deleted status
        isDeleted: response.data.isDeleted,
        userId: response.data.userId, // Keep original field for other uses
        sectionId: response.data.sectionId // Keep original field for other uses
      }
      // Update in local list if exists
      const index = students.value.findIndex(s => s.id === id)
      if (index !== -1) {
        students.value[index] = mappedStudent
      }
      // Update current student if it's the same
      if (currentStudent.value?.id === id) {
        currentStudent.value = mappedStudent
      }
      return mappedStudent
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
      // Update the student's deleted status in the local list instead of removing
      const index = students.value.findIndex(s => s.id === id)
      if (index !== -1) {
        students.value[index].deletedAt = new Date().toISOString() // Set current timestamp
        students.value[index].isDeleted = true // Mark as deleted
      }
      // Update current student if it's the same
      if (currentStudent.value?.id === id) {
        currentStudent.value = {
          ...currentStudent.value,
          deletedAt: new Date().toISOString(),
          isDeleted: true
        }
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
      // Map the API response fields to match frontend component expectations
      const mappedStudent = {
        id: response.data.id,
        firstName: response.data.firstname, // API returns 'firstname', component expects 'firstName'
        lastName: response.data.lastname, // API returns 'lastname', component expects 'lastName'
        studentId: response.data.userId, // API returns 'userId', component expects 'studentId'
        email: response.data.email || '-', // Add email placeholder if not in API response
        section: response.data.sectionId || '-', // API returns 'sectionId', component expects 'section'
        isRegular: response.data.isRegular,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        deletedAt: null, // Restored student should not have deletedAt
        isDeleted: false, // Restored student should not be marked as deleted
        userId: response.data.userId, // Keep original field for other uses
        sectionId: response.data.sectionId // Keep original field for other uses
      }
      // Add back to local list
      students.value.push(mappedStudent)
      return mappedStudent
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
