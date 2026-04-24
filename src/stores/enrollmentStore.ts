import type { EnrollmentData, EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import enrollmentsApi from '@/api/enrollments'
import { getErrorMessage } from '@/utils/httpError'
import { entityIdsMatch } from '@/utils/entityId'

export const useEnrollmentStore = defineStore('enrollments', () => {
  // State
  const sectionStudents = ref<EnrollmentDto[]>([])
  const studentEnrollments = ref<EnrollmentDto[]>([])
  const pendingRequests = ref(0)
  const loading = computed(() => pendingRequests.value > 0)
  const error = ref('')

  // Getters
  const getSectionStudents = computed(() => sectionStudents.value)
  const getStudentEnrollments = computed(() => studentEnrollments.value)
  const isLoading = computed(() => loading.value)
  const getError = computed(() => error.value)

  function beginRequest() {
    pendingRequests.value += 1
  }

  function endRequest() {
    pendingRequests.value = Math.max(0, pendingRequests.value - 1)
  }

  // Actions
  async function enrollStudent(enrollmentData: EnrollmentData) {
    beginRequest()
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
      endRequest()
    }
  }

  async function fetchSectionStudents(sectionId: EntityId) {
    beginRequest()
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
      endRequest()
    }
  }

  async function fetchStudentEnrollments(studentId: EntityId) {
    beginRequest()
    error.value = ''
    try {
      const response = await enrollmentsApi.getStudentEnrollments(studentId)
      studentEnrollments.value = response.data.enrollments
      return response.data.enrollments
    }
    catch (err) {
      console.error('Error fetching student enrollments:', err)
      error.value = getErrorMessage(err, 'Failed to fetch student enrollments')
      throw err
    }
    finally {
      endRequest()
    }
  }

  async function dropStudent(enrollmentId: EntityId, sectionId: EntityId | null = null) {
    beginRequest()
    error.value = ''
    try {
      await enrollmentsApi.dropStudent(enrollmentId)
      // Refresh section students if sectionId provided
      if (sectionId) {
        await fetchSectionStudents(sectionId)
      }
      else {
        // Update local state only when we are not refreshing from API.
        sectionStudents.value = sectionStudents.value.filter(
          s => !entityIdsMatch(s.enrollmentId, enrollmentId),
        )
      }
    }
    catch (err) {
      console.error('Error dropping student:', err)
      error.value = getErrorMessage(err, 'Failed to drop student')
      throw err
    }
    finally {
      endRequest()
    }
  }

  async function reenrollStudent(enrollmentId: EntityId, sectionId: EntityId | null = null) {
    beginRequest()
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
      endRequest()
    }
  }

  async function checkEnrollment(studentId: EntityId, sectionId: EntityId, subjectId: EntityId) {
    beginRequest()
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
      endRequest()
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
