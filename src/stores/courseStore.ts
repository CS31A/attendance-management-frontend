import type { CourseDto, CoursePayload } from '@/api/courses'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import courseApi from '@/api/courses'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

export const useCourseStore = defineStore('course', () => {
  const courses = ref<CourseDto[]>([])
  const currentCourse = ref<CourseDto | null>(null)
  const loading = ref(false)
  const error = ref('')
  const fetchError = ref('')

  const hasCourses = computed(() => courses.value.length > 0)
  const sortedCourses = computed(() =>
    [...courses.value].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
  )

  async function fetchCourses() {
    loading.value = true
    error.value = ''
    fetchError.value = ''
    try {
      const response = await courseApi.getAllCourses()
      courses.value = response.data
    }
    catch (err) {
      const msg = getErrorMessage(err, 'Failed to fetch courses')
      error.value = msg
      fetchError.value = msg
      console.error('Error fetching courses:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchCourse(id: EntityId) {
    loading.value = true
    error.value = ''
    fetchError.value = ''
    try {
      const response = await courseApi.getCourseById(id)
      currentCourse.value = response.data
    }
    catch (err) {
      const msg = getErrorMessage(err, `Course with ID ${id} not found`)
      error.value = msg
      fetchError.value = msg
      console.error('Error fetching course:', err)
    }
    finally {
      loading.value = false
    }
  }

  async function createCourse(data: CoursePayload) {
    loading.value = true
    error.value = ''
    try {
      const response = await courseApi.createCourse(data)
      courses.value.push(response.data)
      return response.data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to create course')
      const validationErrors = getValidationErrorMessages(err)
      if (validationErrors.length > 0) {
        error.value = validationErrors.join(', ')
      }
      console.error('Error creating course:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function updateCourse(id: EntityId, data: CoursePayload) {
    loading.value = true
    error.value = ''
    try {
      const response = await courseApi.updateCourse(id, data)
      const index = courses.value.findIndex(c => entityIdsMatch(c.id, id))
      if (index !== -1) {
        courses.value[index] = response.data
      }
      return response.data
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to update course')
      const validationErrors = getValidationErrorMessages(err)
      if (validationErrors.length > 0) {
        error.value = validationErrors.join(', ')
      }
      console.error('Error updating course:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  async function deleteCourse(id: EntityId) {
    loading.value = true
    error.value = ''
    try {
      await courseApi.deleteCourse(id)
      courses.value = courses.value.filter(c => !entityIdsMatch(c.id, id))
    }
    catch (err) {
      error.value = getErrorMessage(err, 'Failed to delete course')
      console.error('Error deleting course:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    courses,
    currentCourse,
    loading,
    error,
    fetchError,
    hasCourses,
    sortedCourses,
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
  }
})
