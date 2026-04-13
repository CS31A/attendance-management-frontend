import type { SectionDto } from '@/api/sections'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'

import sectionsApi from '@/api/sections'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SectionsStoreLike {
  sections: SectionDto[]
  deleteSection: (id: EntityId) => Promise<unknown>
}

interface SectionApiLike {
  hasSchedulesInSection: typeof sectionsApi.hasSchedulesInSection
  hasStudentsInSection: typeof sectionsApi.hasStudentsInSection
  hasEnrollmentsInSection: typeof sectionsApi.hasEnrollmentsInSection
}

interface CreateSectionDeleteFlowOptions {
  sectionsStore: SectionsStoreLike
  sectionsApi?: SectionApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

interface SectionDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  sectionToDelete: import('vue').Ref<SectionDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteSection: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

interface SectionDeleteFlowInternalReturn extends SectionDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

// Internal mode: no showToast provided - composable manages its own toast
export function createSectionDeleteFlow(
  options: Omit<CreateSectionDeleteFlowOptions, 'showToast'>,
): SectionDeleteFlowInternalReturn

// External mode: showToast provided - composable delegates toast, does not return toast state
export function createSectionDeleteFlow(
  options: CreateSectionDeleteFlowOptions & { showToast: (message: string, type?: ToastType, duration?: number) => void },
): SectionDeleteFlowState

// Implementation signature
export function createSectionDeleteFlow({
  sectionsStore,
  sectionsApi: sectionApi = sectionsApi,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error('Failed to check section dependencies:', error),
  showToast: externalShowToast,
}: CreateSectionDeleteFlowOptions) {
  // Use shared modal lifecycle primitive
  const {
    showDeleteModal,
    entityToDelete: sectionToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<SectionDto>()

  const isDeletionChecking = ref(false)

  // Only create internal toast state in internal mode
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

  async function handleDeleteSection(id: EntityId) {
    const section = sectionsStore.sections.find(current => current.id === id)
    if (!section) {
      return
    }

    isDeletionChecking.value = true

    try {
      const [hasSchedules, hasStudents, hasEnrollments] = await Promise.all([
        sectionApi.hasSchedulesInSection(id).then(response => response.data),
        sectionApi.hasStudentsInSection(id).then(response => response.data),
        sectionApi.hasEnrollmentsInSection(id).then(response => response.data),
      ])

      if (hasSchedules) {
        showToast('Cannot delete: Section has schedules assigned. Remove schedules first.', 'error', 5000)
        return
      }

      if (hasStudents) {
        showToast('Cannot delete: Section has assigned students. Reassign students first.', 'error', 5000)
        return
      }

      if (hasEnrollments) {
        showToast('Cannot delete: Section has student enrollments. Remove enrollments first.', 'error', 5000)
        return
      }
    }
    catch (error) {
      logDependencyCheckError(error)
      showToast(
        'Warning: Could not verify section dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
    }
    finally {
      isDeletionChecking.value = false
    }

    openDeleteModal(section)
  }

  async function confirmDelete() {
    if (!sectionToDelete.value) {
      return
    }

    startDeleting()

    try {
      await sectionsStore.deleteSection(sectionToDelete.value.id)
      showToast('Section deleted successfully', 'success')
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
        showToast(`Failed to delete section: ${message}`, 'error')
      }
    }
    finally {
      finishDeleting()
    }
  }

  function cancelDelete() {
    closeDeleteModal()
  }

  // Return different shapes based on mode
  if (externalShowToast) {
    // External mode: delegate toast, don't return toast state
    return {
      showDeleteModal,
      sectionToDelete,
      isDeleting,
      isDeletionChecking,
      handleDeleteSection,
      confirmDelete,
      cancelDelete,
    }
  }

  // Internal mode: return full object with toast state
  return {
    toast: toast!,
    showToast,
    closeToast,
    showDeleteModal,
    sectionToDelete,
    isDeleting,
    isDeletionChecking,
    handleDeleteSection,
    confirmDelete,
    cancelDelete,
  }
}
