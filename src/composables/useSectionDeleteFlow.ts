import type { SectionDto } from '@/api/sections'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'

import sectionsApi from '@/api/sections'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

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
}

export function createSectionDeleteFlow({
  sectionsStore,
  sectionsApi: sectionApi = sectionsApi,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error('Failed to check section dependencies:', error),
}: CreateSectionDeleteFlowOptions) {
  const showDeleteModal = ref(false)
  const sectionToDelete = ref<SectionDto | null>(null)
  const isDeleting = ref(false)
  const isDeletionChecking = ref(false)
  const toast = reactive({
    show: false,
    message: '',
    type: 'success' as ToastType,
    duration: 3000,
  })

  function showToast(message: string, type: ToastType = 'success', duration = 3000) {
    toast.message = message
    toast.type = type
    toast.duration = duration
    toast.show = true
  }

  function closeToast() {
    toast.show = false
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

    sectionToDelete.value = section
    showDeleteModal.value = true
  }

  async function confirmDelete() {
    if (!sectionToDelete.value) {
      return
    }

    isDeleting.value = true

    try {
      await sectionsStore.deleteSection(sectionToDelete.value.id)
      showToast('Section deleted successfully', 'success')
      onDeleteSuccess?.()
      showDeleteModal.value = false
      sectionToDelete.value = null
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
      isDeleting.value = false
    }
  }

  function cancelDelete() {
    showDeleteModal.value = false
    sectionToDelete.value = null
  }

  return {
    toast,
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
