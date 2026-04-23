import type {
  InstructorSectionDetail,
  InstructorSectionOverviewItem,
  InstructorSectionsWithStudentsResponseDto,
  InstructorStudentDetail,
} from '@/types/instructor'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getMySectionDetail,
  getMySectionsOverview,
  getMySectionsWithStudents,
  getMyStudentDetail,
} from '@/api/instructors'

export const useInstructorStore = defineStore('instructorStore', () => {
  // ==================== STATE ====================

  const instructorData = ref<InstructorSectionsWithStudentsResponseDto | null>(null)
  const loadingCount = ref(0)
  const error = ref<string | null>(null)

  const sectionsOverviewList = ref<InstructorSectionOverviewItem[]>([])
  const currentSectionDetail = ref<InstructorSectionDetail | null>(null)
  const currentStudentDetail = ref<InstructorStudentDetail | null>(null)

  // ==================== GETTERS ====================

  const loading = computed(() => loadingCount.value > 0)

  const sections = computed(() => instructorData.value?.sections ?? [])

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

  const totalSections = computed(() => sections.value.length)

  const uniqueStudentIds = computed(() => {
    const ids = new Set<number>()

    for (const section of sections.value) {
      for (const subject of section.subjects) {
        for (const student of subject.students) {
          ids.add(student.studentId)
        }
      }
    }

    return ids
  })

  const totalStudents = computed(() => uniqueStudentIds.value.size)

  const totalUniqueStudents = computed(() => uniqueStudentIds.value.size)

  // ==================== HELPER FUNCTIONS ====================

  function beginLoading() {
    loadingCount.value += 1
  }

  function endLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  // ==================== ACTIONS ====================

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

  const fetchSectionsOverview = async () => {
    beginLoading()
    error.value = null

    try {
      const [overviewData, sectionsWithData] = await Promise.all([
        getMySectionsOverview(),
        getMySectionsWithStudents(),
      ])
      sectionsOverviewList.value = overviewData
      instructorData.value = sectionsWithData
      return overviewData
    }
    catch (err) {
      console.error('Failed to fetch sections overview:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load sections overview'
      throw err
    }
    finally {
      endLoading()
    }
  }

  const fetchSectionDetail = async (sectionId: number) => {
    beginLoading()
    error.value = null

    try {
      const data = await getMySectionDetail(sectionId)
      currentSectionDetail.value = data
      return data
    }
    catch (err) {
      console.error(`Failed to fetch section detail for section ${sectionId}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to load section detail'
      throw err
    }
    finally {
      endLoading()
    }
  }

  const fetchStudentDetail = async (studentId: number) => {
    beginLoading()
    error.value = null

    try {
      const data = await getMyStudentDetail(studentId)
      currentStudentDetail.value = data
      return data
    }
    catch (err) {
      console.error(`Failed to fetch student detail for student ${studentId}:`, err)
      error.value = err instanceof Error ? err.message : 'Failed to load student detail'
      throw err
    }
    finally {
      endLoading()
    }
  }

  const clearSectionDetail = () => {
    currentSectionDetail.value = null
  }

  const clearStudentDetail = () => {
    currentStudentDetail.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const resetStore = () => {
    instructorData.value = null
    loadingCount.value = 0
    error.value = null
    sectionsOverviewList.value = []
    currentSectionDetail.value = null
    currentStudentDetail.value = null
  }

  // ==================== RETURN ====================

  return {
    // State
    instructorData,
    loading,
    error,
    sectionsOverviewList,
    currentSectionDetail,
    currentStudentDetail,

    // Getters
    sections,
    instructorInfo,
    totalSections,
    totalStudents,
    totalUniqueStudents,

    // Actions
    fetchSectionsWithStudents,
    fetchSectionsOverview,
    fetchSectionDetail,
    fetchStudentDetail,
    clearSectionDetail,
    clearStudentDetail,
    clearError,
    resetStore,
  }
})
