import type { Ref } from 'vue'
import type { HandleErrorableModal } from '@/types/ui'
import { ref } from 'vue'

export interface UseModalStateReturn<T> {
  showModal: Ref<boolean>
  selectedEntity: Ref<T | null>
  modalRef: Ref<HandleErrorableModal | null>
}

/**
 * Composable for managing CRUD modal state.
 * Extracts the repeated "modal-state triad" (showModal, selectedEntity, modalRef)
 * into a reusable, generic composable.
 *
 * Note: This composable only creates and returns the state refs.
 * Modal behavior (open/edit/close) is handled by useCrudModal to preserve
 * the current separation of concerns.
 *
 * @example
 * ```ts
 * const { showModal, selectedEntity: selectedSubject, modalRef } = useModalState<SubjectDto>()
 * ```
 */
export function useModalState<T>(): UseModalStateReturn<T> {
  const showModal: Ref<boolean> = ref(false)
  const selectedEntity: Ref<T | null> = ref(null)
  const modalRef: Ref<HandleErrorableModal | null> = ref(null)

  return {
    showModal,
    selectedEntity,
    modalRef,
  }
}
