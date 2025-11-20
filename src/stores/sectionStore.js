import { defineStore } from "pinia";
import api from '@/api/index.js'
import { ref, computed } from "vue";

export const useSectionStore = defineStore('sectionsStore', () => {
  const sections = ref([])
  const itemsPerPage = ref(10)

  const getSections = computed(() => sections.value)
  const getItemsPerPage = computed(() => itemsPerPage.value)
  const getNumberOfSections = computed(() => sections.value.length)
  const getFilteredSections = computed((searchQuery, selectedLevel) => {

    if (selectedLevel !== 'All Levels') {
    }
    return sections.value
  })

  const fetchSections = async () => {
    try {
      const resp = await api.get('/sections')
      sections.value = resp.data
      console.log(resp.data)
    } catch (error) {
      console.log(error)
    }
  }

  return {
    // state
    sections,
    //getters
    getSections,
    getNumberOfSections,
    getFilteredSections,
    getItemsPerPage,
    // actions
    fetchSections
  }
}) 
