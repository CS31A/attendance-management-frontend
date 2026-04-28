import type { Ref } from 'vue'
import type { ToastType } from './useToast'
import type { EntityId } from '@/types'
import type { HandleErrorableModal } from '@/types/ui'
import { getErrorMessage } from '@/utils/httpError'

export interface UseCrudModalOptions<TPayload, TEntity> {
  entity: Ref<TEntity | null>
  showModal: Ref<boolean>
  modalRef: Ref<HandleErrorableModal | null>
  showToast: (message: string, type: ToastType, duration?: number) => void
  createFn: (data: TPayload) => Promise<unknown>
  updateFn: (id: EntityId, data: TPayload) => Promise<unknown>
  entityLabel: string
  onSuccess?: () => void
  onErrorHandled?: () => void
}

export function useCrudModal<TPayload, TEntity extends { id: EntityId }>(
  options: UseCrudModalOptions<TPayload, TEntity>,
) {
  async function handleSave(data: TPayload) {
    try {
      if (options.entity.value) {
        await options.updateFn(options.entity.value.id, data)
        options.showToast(`${options.entityLabel} updated successfully`, 'success')
      }
      else {
        await options.createFn(data)
        options.showToast(`${options.entityLabel} created successfully`, 'success')
      }
      closeModal()
      options.onSuccess?.()
    }
    catch (error) {
      options.modalRef.value?.handleError?.(getErrorMessage(error, `Failed to save ${options.entityLabel.toLowerCase()}`))
      options.onErrorHandled?.()
    }
  }

  function openAddModal() {
    options.entity.value = null
    options.showModal.value = true
  }

  function openEditModal(item: TEntity) {
    options.entity.value = { ...item }
    options.showModal.value = true
  }

  function closeModal() {
    options.showModal.value = false
    options.entity.value = null
  }

  return { handleSave, openAddModal, openEditModal, closeModal }
}
