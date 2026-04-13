import type { ToastType } from './useToast'
import type { EntityId } from '@/types'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

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
  const {
    showDeleteModal,
    entityToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<T>()

  function openDelete(id: EntityId) {
    const entity = options.findEntity(id)
    if (entity) {
      openDeleteModal(entity)
    }
  }

  async function confirmDelete() {
    if (!entityToDelete.value || isDeleting.value)
      return

    startDeleting()
    try {
      const entity = entityToDelete.value
      await options.deleteEntity(options.getEntityId(entity))
      options.showToast(options.getSuccessMessage(entity), 'success')
      closeDeleteModal()
      options.onDeleteSuccess?.(entity)
    }
    catch (error) {
      options.showToast(options.getErrorMessage(error), 'error')
      options.onDeleteError?.(error)
    }
    finally {
      finishDeleting()
    }
  }

  function cancelDelete() {
    closeDeleteModal()
  }

  return { showDeleteModal, entityToDelete, isDeleting, openDelete, confirmDelete, cancelDelete }
}
