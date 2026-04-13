import type { CourseDto } from '@/api/courses'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'

import coursesApi from '@/api/courses'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface CoursesStoreLike {
  courses: CourseDto[]
  deleteCourse: (id: EntityId) => Promise<unknown>
}

interface CourseApiLike {
  hasSectionsInCourse: typeof coursesApi.hasSectionsInCourse
}

interface CreateCourseDeleteFlowOptions {
  coursesStore: CoursesStoreLike
  coursesApi?: CourseApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

interface CourseDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  courseToDelete: import('vue').Ref<CourseDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteCourse: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

interface CourseDeleteFlowInternalReturn extends CourseDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

export function createCourseDeleteFlow(
  options: Omit<CreateCourseDeleteFlowOptions, 'showToast'>,
): CourseDeleteFlowInternalReturn

export function createCourseDeleteFlow(
  options: CreateCourseDeleteFlowOptions & { showToast: (message: string, type?: ToastType, duration?: number) => void },
): CourseDeleteFlowState

export function createCourseDeleteFlow({
  coursesStore,
  coursesApi: courseApi = coursesApi,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error('Failed to check course dependencies:', error),
  showToast: externalShowToast,
}: CreateCourseDeleteFlowOptions) {
  const {
    showDeleteModal,
    entityToDelete: courseToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<CourseDto>()

  const isDeletionChecking = ref(false)

  const toast = externalShowToast
    ? null
    : reactive({
        show: false,
        message: '',
        type: 'success' as ToastType,
        duration: 3000,
      })

  function showToast(message: string, type: ToastType = 'success', duration = 3000) {
    if (externalShowToast) {
      externalShowToast(message, type, duration)
    }
    else if (toast) {
      toast.message = message
      toast.type = type
      toast.duration = duration
      toast.show = true
    }
  }

  function closeToast() {
    if (toast) {
      toast.show = false
    }
  }

  async function handleDeleteCourse(id: EntityId) {
    const course = coursesStore.courses.find(current => current.id === id)
    if (!course) {
      return
    }

    isDeletionChecking.value = true

    try {
      const hasSections = await courseApi.hasSectionsInCourse(id).then(response => response.data)

      if (hasSections) {
        showToast('Cannot delete: Course has sections assigned. Remove sections first.', 'error', 5000)
        return
      }
    }
    catch (error) {
      logDependencyCheckError(error)
      showToast(
        'Warning: Could not verify course dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
    }
    finally {
      isDeletionChecking.value = false
    }

    openDeleteModal(course)
  }

  async function confirmDelete() {
    if (!courseToDelete.value) {
      return
    }

    startDeleting()

    try {
      await coursesStore.deleteCourse(courseToDelete.value.id)
      showToast('Course deleted successfully', 'success')
      onDeleteSuccess?.()
      closeDeleteModal()
    }
    catch (error) {
      const status = getErrorStatus(error)
      const message = getErrorMessage(error, 'Delete request failed')

      if (status === 409) {
        showToast(message, 'error', 5000)
      }
      else {
        showToast(`Failed to delete course: ${message}`, 'error')
      }
    }
    finally {
      finishDeleting()
    }
  }

  function cancelDelete() {
    closeDeleteModal()
  }

  if (externalShowToast) {
    return {
      showDeleteModal,
      courseToDelete,
      isDeleting,
      isDeletionChecking,
      handleDeleteCourse,
      confirmDelete,
      cancelDelete,
    }
  }

  return {
    toast: toast!,
    showToast,
    closeToast,
    showDeleteModal,
    courseToDelete,
    isDeleting,
    isDeletionChecking,
    handleDeleteCourse,
    confirmDelete,
    cancelDelete,
  }
}
