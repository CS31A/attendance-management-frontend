import type { SectionDto, SectionPayload } from '@/api/sections'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import sectionsApi from '@/api/sections'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage } from '@/utils/httpError'

export const useSectionStore = defineStore('sectionsStore', () => {
  const sections = ref<SectionDto[]>([])
  const itemsPerPage = ref(10)
  const loading = ref(false)
  const error = ref('')
  const fetchError = ref('')

  const getSections = computed(() => sections.value)
  const getItemsPerPage = computed(() => itemsPerPage.value)
  const getNumberOfSections = computed(() => sections.value.length)

  // Basic filtering - can be expanded based on requirements
  const getFilteredSections = computed(() => {
    return sections.value
  })

  const fetchSections = async () => {
    loading.value = true
    error.value = ''
    fetchError.value = ''
    try {
      const resp = await sectionsApi.getAllSections()
      sections.value = resp.data
    }
    catch (err) {
      console.error('Error fetching sections:', err)
      const msg = getErrorMessage(err, 'Failed to fetch sections')
      error.value = msg
      fetchError.value = msg
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const addSection = async (sectionData: SectionPayload) => {
    loading.value = true
    error.value = ''
    try {
      const resp = await sectionsApi.createSection(sectionData)
      // Optimistically add to list or re-fetch
      sections.value.push(resp.data)
      return resp.data
    }
    catch (err) {
      console.error('Error adding section:', err)
      error.value = 'Failed to add section'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateSection = async (id: EntityId, sectionData: SectionPayload) => {
    loading.value = true
    error.value = ''
    try {
      const resp = await sectionsApi.updateSection(id, sectionData)
      // Update in local list
      const index = sections.value.findIndex(s => entityIdsMatch(s.id, id))
      if (index !== -1) {
        sections.value[index] = resp.data
      }
      return resp.data
    }
    catch (err) {
      console.error('Error updating section:', err)
      error.value = 'Failed to update section'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteSection = async (id: EntityId) => {
    loading.value = true
    error.value = ''
    try {
      await sectionsApi.deleteSection(id)
      // Remove from local list
      sections.value = sections.value.filter(s => !entityIdsMatch(s.id, id))
    }
    catch (err) {
      console.error('Error deleting section:', err)
      error.value = 'Failed to delete section'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getSection = async (id: EntityId) => {
    loading.value = true
    try {
      const resp = await sectionsApi.getSection(id)
      return resp.data
    }
    catch (err) {
      console.error('Error fetching section:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // state
    sections,
    itemsPerPage,
    loading,
    error,
    fetchError,
    // getters
    getSections,
    getNumberOfSections,
    getFilteredSections,
    getItemsPerPage,
    // actions
    fetchSections,
    addSection,
    updateSection,
    deleteSection,
    getSection,
  }
})
