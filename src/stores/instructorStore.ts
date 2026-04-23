import type { InstructorSectionsWithStudentsResponseDto } from '@/types/instructor'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getMySectionsWithStudents } from '@/api/instructors'

/**
 * Instructor Store
 *
 * Manages instructor-specific data including sections with enrolled students.
 * Provides centralized state management for instructor class views.
 *
 * @typedef {object} InstructorState
 * @property {Array} sections - Array of sections with students
 * @property {boolean} loading - Whether data is being fetched
 * @property {string | null} error - Error message if fetch fails
 */
export const useInstructorStore = defineStore('instructorStore', () => {
  // ==================== STATE ====================

  /** @type {import('vue').Ref<InstructorSectionsWithStudentsResponseDto | null>} */
  const instructorData = ref<InstructorSectionsWithStudentsResponseDto | null>(null)

  /** @type {import('vue').Ref<number>} */
  const loadingCount = ref(0)

  /** @type {import('vue').Ref<string | null>} */
  const error = ref<string | null>(null)

  // ==================== GETTERS ====================

  /**
   * Get loading state
   * @returns {boolean} True if any operation is in progress
   */
  const loading = computed(() => loadingCount.value > 0)

  /**
   * Get sections array
   * @returns {Array} Array of sections with students
   */
  const sections = computed(() => instructorData.value?.sections ?? [])

  /**
   * Get instructor information
   * @returns {object | null} Instructor basic info
   */
  const instructorInfo = computed(() => {
    if (!instructorData.value)
      return null

    return {
      id: instructorData.value.instructorId,
      firstname: instructorData.value.instructorFirstname,
      lastname: instructorData.value.instructorLastname,
      fullName: `${instructorData.value.instructorFirstname} ${instructorData.value.instructorLastname}`,
    }
  })

  /**
   * Get total number of sections
   * @returns {number} Total sections count
   */
  const totalSections = computed(() => sections.value.length)

  /**
   * Get total number of students across all sections
   * @returns {number} Total students count
   */
  const totalStudents = computed(() => {
    return sections.value.reduce((total, section) => {
      const sectionStudentCount = section.subjects.reduce((subjectTotal, subject) => {
        return subjectTotal + subject.students.length
      }, 0)
      return total + sectionStudentCount
    }, 0)
  })

  // ==================== HELPER FUNCTIONS ====================

  function beginLoading() {
    loadingCount.value += 1
  }

  function endLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  // ==================== ACTIONS ====================

  /**
   * Fetch sections with enrolled students for the current instructor
   * @returns {Promise<InstructorSectionsWithStudentsResponseDto>} Instructor data with sections
   * @throws {Error} If fetch fails
   */
  const fetchSectionsWithStudents = async () => {
    beginLoading()
    error.value = null

    try {
      const data = await getMySectionsWithStudents()
      instructorData.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch instructor sections with students:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load sections'
      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Reset store to initial state
   */
  const resetStore = () => {
    instructorData.value = null
    loadingCount.value = 0
    error.value = null
  }

  // ==================== RETURN ====================

  return {
    // State
    instructorData,
    loading,
    error,

    // Getters
    sections,
    instructorInfo,
    totalSections,
    totalStudents,

    // Actions
    fetchSectionsWithStudents,
    clearError,
    resetStore,
  }
})
