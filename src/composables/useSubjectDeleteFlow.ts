import type { SubjectDto } from '@/api/subjects'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'

import subjectsApi from '@/api/subjects'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SubjectsStoreLike {
  subjects: SubjectDto[]
  deleteSubject: (id: EntityId) => Promise<unknown>
}

interface SubjectApiLike {
  hasSchedulesInSubject: typeof subjectsApi.hasSchedulesInSubject
  hasEnrollmentsInSubject: typeof subjectsApi.hasEnrollmentsInSubject
}

interface CreateSubjectDeleteFlowOptions {
  subjectsStore: SubjectsStoreLike
  subjectsApi?: SubjectApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

interface SubjectDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  subjectToDelete: import('vue').Ref<SubjectDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteSubject: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

interface SubjectDeleteFlowInternalReturn extends SubjectDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

export function createSubjectDeleteFlow(
  options: Omit<CreateSubjectDeleteFlowOptions, 'showToast'>,
): SubjectDeleteFlowInternalReturn

export function createSubjectDeleteFlow(
  options: CreateSubjectDeleteFlowOptions & { showToast: (message: string, type?: ToastType, duration?: number) => void },
): SubjectDeleteFlowState

export function createSubjectDeleteFlow({
  subjectsStore,
  subjectsApi: subjectApi = subjectsApi,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error('Failed to check subject dependencies:', error),
  showToast: externalShowToast,
}: CreateSubjectDeleteFlowOptions) {
  const {
    showDeleteModal,
    entityToDelete: subjectToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<SubjectDto>()

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

  async function handleDeleteSubject(id: EntityId) {
    const subject = subjectsStore.subjects.find(current => current.id === id)
    if (!subject) {
      return
    }

    isDeletionChecking.value = true

    try {
      const [hasSchedules, hasEnrollments] = await Promise.all([
        subjectApi.hasSchedulesInSubject(id).then(response => response.data),
        subjectApi.hasEnrollmentsInSubject(id).then(response => response.data),
      ])

      if (hasSchedules) {
        showToast('Cannot delete: Subject has schedules assigned. Remove schedules first.', 'error', 5000)
        return
      }

      if (hasEnrollments) {
        showToast('Cannot delete: Subject has student enrollments. Remove enrollments first.', 'error', 5000)
        return
      }
    }
    catch (error) {
      logDependencyCheckError(error)
      showToast(
        'Warning: Could not verify subject dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
    }
    finally {
      isDeletionChecking.value = false
    }

    openDeleteModal(subject)
  }

  async function confirmDelete() {
    if (!subjectToDelete.value) {
      return
    }

    startDeleting()

    try {
      await subjectsStore.deleteSubject(subjectToDelete.value.id)
      showToast('Subject deleted successfully', 'success')
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
        showToast(`Failed to delete subject: ${message}`, 'error')
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
      subjectToDelete,
      isDeleting,
      isDeletionChecking,
      handleDeleteSubject,
      confirmDelete,
      cancelDelete,
    }
  }

  return {
    toast: toast!,
    showToast,
    closeToast,
    showDeleteModal,
    subjectToDelete,
    isDeleting,
    isDeletionChecking,
    handleDeleteSubject,
    confirmDelete,
    cancelDelete,
  }
}
