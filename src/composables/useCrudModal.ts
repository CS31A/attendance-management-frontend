import type { Ref } from 'vue'
import type { ToastType } from './useToast'
import type { EntityId } from '@/types'
import type { HandleErrorableModal } from '@/types/ui'
import { ref } from 'vue'
import { getErrorMessage } from '@/utils/httpError'

export interface UseCrudModalOptions<TPayload> {
  showToast: (message: string, type: ToastType, duration?: number) => void
  createFn: (data: TPayload) => Promise<unknown>
  updateFn: (id: EntityId, data: TPayload) => Promise<unknown>
  entityLabel: string
  onSuccess?: () => void
  onErrorHandled?: () => void
}

export function useCrudModal<TPayload, TEntity extends { id: EntityId }>(
  options: UseCrudModalOptions<TPayload>,
) {
  const showModal: Ref<boolean> = ref(false)
  const selectedEntity: Ref<TEntity | null> = ref(null)
  const modalRef: Ref<HandleErrorableModal | null> = ref(null)
  async function handleSave(data: TPayload) {
    try {
      if (selectedEntity.value) {
        await options.updateFn(selectedEntity.value.id, data)
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
      modalRef.value?.handleError?.(getErrorMessage(error, `Failed to save ${options.entityLabel.toLowerCase()}`))
      options.onErrorHandled?.()
    }
  }

  function openAddModal() {
    selectedEntity.value = null
    showModal.value = true
  }

  function openEditModal(item: TEntity) {
    selectedEntity.value = { ...item }
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedEntity.value = null
  }

  return { showModal, selectedEntity, modalRef, handleSave, openAddModal, openEditModal, closeModal }
}
