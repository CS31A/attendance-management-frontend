import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useSectionStore = defineStore('sectionStore', () => {
  const sections = ref([])

  return {
    sections
  }
}) 
