import type { Ref } from 'vue'
import { ref } from 'vue'

export interface UseDeleteModalLifecycleReturn<T> {
  showDeleteModal: Ref<boolean>
  entityToDelete: Ref<T | null>
  isDeleting: Ref<boolean>
  openDeleteModal: (entity: T) => void
  closeDeleteModal: () => void
  startDeleting: () => void
  finishDeleting: () => void
}

/**
 * Internal primitive for managing delete modal lifecycle state.
 * Extracts the shared "modal-state triad" used by both useEntityDelete
 * and createSectionDeleteFlow to ensure consistent behavior.
 *
 * This is an internal primitive - external code should use useEntityDelete
 * or entity-specific delete flows instead.
 *
 * @internal
 */
export function useDeleteModalLifecycle<T>(): UseDeleteModalLifecycleReturn<T> {
  const showDeleteModal: Ref<boolean> = ref(false)
  const entityToDelete: Ref<T | null> = ref(null)
  const isDeleting: Ref<boolean> = ref(false)

  function openDeleteModal(entity: T) {
    entityToDelete.value = entity
    showDeleteModal.value = true
  }

  function closeDeleteModal() {
    showDeleteModal.value = false
    entityToDelete.value = null
  }

  function startDeleting() {
    isDeleting.value = true
  }

  function finishDeleting() {
    isDeleting.value = false
  }

  return {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  }
}
