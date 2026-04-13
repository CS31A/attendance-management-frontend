import type { Ref } from 'vue'
import type { ToastType } from './useToast'
import type { EntityId } from '@/types'
import { ref } from 'vue'

export interface UseEntityDeleteOptions<T> {
  findEntity: (id: EntityId) => T | undefined
  deleteEntity: (id: EntityId) => Promise<unknown>
  getEntityId: (entity: T) => EntityId
  showToast: (message: string, type?: ToastType, duration?: number) => void
  getSuccessMessage: (entity: T) => string
  getErrorMessage: (error: unknown) => string
  onDeleteSuccess?: (entity: T) => void
  onDeleteError?: (error: unknown) => void
}

export function useEntityDelete<T>(options: UseEntityDeleteOptions<T>) {
  const showDeleteModal: Ref<boolean> = ref(false)
  const entityToDelete: Ref<T | null> = ref(null)
  const isDeleting: Ref<boolean> = ref(false)

  function openDelete(id: EntityId) {
    const entity = options.findEntity(id)
    if (entity) {
      entityToDelete.value = entity
      showDeleteModal.value = true
    }
  }

  async function confirmDelete() {
    if (!entityToDelete.value || isDeleting.value)
      return

    isDeleting.value = true
    try {
      const entity = entityToDelete.value
      await options.deleteEntity(options.getEntityId(entity))
      options.showToast(options.getSuccessMessage(entity), 'success')
      showDeleteModal.value = false
      entityToDelete.value = null
      options.onDeleteSuccess?.(entity)
    }
    catch (error) {
      options.showToast(options.getErrorMessage(error), 'error')
      options.onDeleteError?.(error)
    }
    finally {
      isDeleting.value = false
    }
  }

  function cancelDelete() {
    showDeleteModal.value = false
    entityToDelete.value = null
  }

  return { showDeleteModal, entityToDelete, isDeleting, openDelete, confirmDelete, cancelDelete }
}
