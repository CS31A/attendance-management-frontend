import type { SubjectDto, SubjectPayload } from '@/api/subjects'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import subjectApi from '@/api/subjects'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

export const useSubjectStore = defineStore('subject', () => {
  // State
  const subjects = ref<SubjectDto[]>([])
  const currentSubject = ref<SubjectDto | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Getters
  const hasSubjects = computed(() => subjects.value.length > 0)
  const sortedSubjects = computed(() =>
    [...subjects.value].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  )

  // Actions
  async function fetchSubjects() {
    loading.value = true
    error.value = ''
    try {
      const response = await subjectApi.getAllSubjects()
      subjects.value = response.data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to fetch subjects')
      console.error('Error fetching subjects:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchSubject(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      const response = await subjectApi.getSubjectById(id)
      currentSubject.value = response.data
    }
    catch (err) {
      error.value = getErrorMessage(err, `Subject with ID ${id} not found`)
      console.error('Error fetching subject:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function createSubject(data: SubjectPayload) {
    loading.value = true
    error.value = ''
    try {
      const response = await subjectApi.createSubject(data)
      subjects.value.push(response.data)
      return response.data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to create subject')
      const validationErrors = getValidationErrorMessages(err)
      if (validationErrors.length > 0)
        error.value = validationErrors.join(', ')

      console.error('Error creating subject:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateSubject(id: EntityId, data: SubjectPayload) {
    loading.value = true
    error.value = ''
    try {
      const response = await subjectApi.updateSubject(id, data)
      const index = subjects.value.findIndex(s => entityIdsMatch(s.id, id))
      if (index !== -1) {
        subjects.value[index] = response.data
      }
      return response.data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to update subject')
      const validationErrors = getValidationErrorMessages(err)
      if (validationErrors.length > 0)
        error.value = validationErrors.join(', ')

      console.error('Error updating subject:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteSubject(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      await subjectApi.deleteSubject(id)
      subjects.value = subjects.value.filter(s => !entityIdsMatch(s.id, id))
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to delete subject')
      console.error('Error deleting subject:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    subjects,
    currentSubject,
    loading,
    error,

    // Getters
    hasSubjects,
    sortedSubjects,

    // Actions
    fetchSubjects,
    fetchSubject,
    createSubject,
    updateSubject,
    deleteSubject,
  }
})
