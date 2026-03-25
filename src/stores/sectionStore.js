import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import sectionsApi from '@/api/sections'

export const useSectionStore = defineStore('sectionsStore', () => {
  const sections = ref([])
  const itemsPerPage = ref(10)
  const loading = ref(false)
  const error = ref('')

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
    try {
      // Para sa skeleton loader simulation
      await new Promise(resolve => setTimeout(resolve, 500))

      const resp = await sectionsApi.getAllSections()
      sections.value = resp.data
    }
    catch (err) {
      console.error('Error fetching sections:', err)
      error.value = 'Failed to fetch sections'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const addSection = async (sectionData) => {
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

  const updateSection = async (id, sectionData) => {
    loading.value = true
    error.value = ''
    try {
      const resp = await sectionsApi.updateSection(id, sectionData)
      // Update in local list
      const index = sections.value.findIndex(s => s.id === id)
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

  const deleteSection = async (id) => {
    loading.value = true
    error.value = ''
    try {
      await sectionsApi.deleteSection(id)
      // Remove from local list
      sections.value = sections.value.filter(s => s.id !== id)
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

  const getSection = async (id) => {
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
