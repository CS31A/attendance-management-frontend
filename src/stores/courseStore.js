import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import courseApi from '@/api/courses'

export const useCourseStore = defineStore('course', () => {
  // State
  const courses = ref([])
  const currentCourse = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const hasCourses = computed(() => courses.value.length > 0)
  const sortedCourses = computed(() =>
    [...courses.value].sort((a, b) => a.name.localeCompare(b.name)),
  )

  // Actions
  async function fetchCourses() {
    loading.value = true
    error.value = null
    try {
      const response = await courseApi.getAllCourses()
      courses.value = response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch courses'
      console.error('Error fetching courses:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    error.value = null
    try {
      const response = await courseApi.getCourseById(id)
      currentCourse.value = response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || `Course with ID ${id} not found`
      console.error('Error fetching course:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function createCourse(data) {
    loading.value = true
    error.value = null
    try {
      const response = await courseApi.createCourse(data)
      courses.value.push(response.data)
      return response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to create course'

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        error.value = Object.values(validationErrors).flat().join(', ')
      }

      console.error('Error creating course:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateCourse(id, data) {
    loading.value = true
    error.value = null
    try {
      const response = await courseApi.updateCourse(id, data)
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = response.data
      }
      return response.data
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to update course'

      // Handle validation errors
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        error.value = Object.values(validationErrors).flat().join(', ')
      }

      console.error('Error updating course:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteCourse(id) {
    loading.value = true
    error.value = null
    try {
      await courseApi.deleteCourse(id)
      courses.value = courses.value.filter(c => c.id !== id)
    }
    catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete course'
      console.error('Error deleting course:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // State
    courses,
    currentCourse,
    loading,
    error,

    // Getters
    hasCourses,
    sortedCourses,

    // Actions
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
  }
})
