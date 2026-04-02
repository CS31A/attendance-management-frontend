import type { EnrollmentData, EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import enrollmentsApi from '@/api/enrollments'
import { getErrorMessage } from '@/utils/httpError'

export const useEnrollmentStore = defineStore('enrollments', () => {
  // State
  const sectionStudents = ref<EnrollmentDto[]>([])
  const studentEnrollments = ref<EnrollmentDto[]>([])
  const loading = ref(false)
  const error = ref('')

  // Getters
  const getSectionStudents = computed(() => sectionStudents.value)
  const getStudentEnrollments = computed(() => studentEnrollments.value)
  const isLoading = computed(() => loading.value)
  const getError = computed(() => error.value)

  // Actions
  async function enrollStudent(enrollmentData: EnrollmentData) {
    loading.value = true
    error.value = ''
    try {
      const response = await enrollmentsApi.enrollStudent(enrollmentData)
      // Optionally add to section students if we're viewing that section
      if (enrollmentData.sectionId && sectionStudents.value.length > 0) {
        // Refresh section students to get updated list
        await fetchSectionStudents(enrollmentData.sectionId)
      }
      return response.data
    }
    catch (err) {
      console.error('Error enrolling student:', err)
      error.value = getErrorMessage(err, 'Failed to enroll student')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSectionStudents(sectionId: EntityId) {
    loading.value = true
    error.value = ''
    try {
      const response = await enrollmentsApi.getSectionStudents(sectionId)
      sectionStudents.value = response.data
      return response.data
    }
    catch (err) {
      console.error('Error fetching section students:', err)
      error.value = getErrorMessage(err, 'Failed to fetch section students')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function fetchStudentEnrollments(studentId: EntityId) {
    loading.value = true
    error.value = ''
    try {
      const response = await enrollmentsApi.getStudentEnrollments(studentId)
      studentEnrollments.value = response.data
      return response.data
    }
    catch (err) {
      console.error('Error fetching student enrollments:', err)
      error.value = getErrorMessage(err, 'Failed to fetch student enrollments')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function dropStudent(enrollmentId: EntityId, sectionId: EntityId | null = null) {
    loading.value = true
    error.value = ''
    try {
      await enrollmentsApi.dropStudent(enrollmentId)
      // Refresh section students if sectionId provided
      if (sectionId) {
        await fetchSectionStudents(sectionId)
      }
      // Update local state
      sectionStudents.value = sectionStudents.value.filter(
        s => s.enrollmentId !== enrollmentId,
      )
    }
    catch (err) {
      console.error('Error dropping student:', err)
      error.value = getErrorMessage(err, 'Failed to drop student')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function reenrollStudent(enrollmentId: EntityId, sectionId: EntityId | null = null) {
    loading.value = true
    error.value = ''
    try {
      const response = await enrollmentsApi.reenrollStudent(enrollmentId)
      // Refresh section students if sectionId provided
      if (sectionId) {
        await fetchSectionStudents(sectionId)
      }
      return response.data
    }
    catch (err) {
      console.error('Error re-enrolling student:', err)
      error.value = getErrorMessage(err, 'Failed to re-enroll student')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function checkEnrollment(studentId: number, sectionId: number, subjectId: number) {
    loading.value = true
    error.value = ''
    try {
      const response = await enrollmentsApi.checkEnrollment({
        studentId,
        sectionId,
        subjectId,
      })
      return response.data
    }
    catch (err) {
      console.error('Error checking enrollment:', err)
      error.value = getErrorMessage(err, 'Failed to check enrollment')
      throw err
    }
    finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = ''
  }

  function clearSectionStudents() {
    sectionStudents.value = []
  }

  return {
    // State
    sectionStudents,
    studentEnrollments,
    loading,
    error,
    // Getters
    getSectionStudents,
    getStudentEnrollments,
    isLoading,
    getError,
    // Actions
    enrollStudent,
    fetchSectionStudents,
    fetchStudentEnrollments,
    dropStudent,
    reenrollStudent,
    checkEnrollment,
    clearError,
    clearSectionStudents,
  }
})
