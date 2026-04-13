import type { AxiosResponse } from 'axios'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface DependencyCheckConfig {
  check: (id: EntityId) => Promise<AxiosResponse<boolean>>
  message: string
}

export interface CreateDeleteFlowOptions<T extends { id: EntityId }> {
  store: {
    items: T[]
    deleteItem: (id: EntityId) => Promise<unknown>
  }
  dependencyChecks: DependencyCheckConfig[]
  labels: {
    entityName: string
    entityNamePlural: string
  }
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export interface DeleteFlowState<T> {
  showDeleteModal: import('vue').Ref<boolean>
  itemToDelete: import('vue').Ref<T | null>
  isDeleting: import('vue').Ref<boolean>
  isCheckingDependencies: import('vue').Ref<boolean>
  handleDelete: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

export interface DeleteFlowInternalReturn<T> extends DeleteFlowState<T> {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

export function createDeleteFlow<T extends { id: EntityId }>({
  store,
  dependencyChecks,
  labels,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error(`Failed to check ${labels.entityName} dependencies:`, error),
  showToast: externalShowToast,
}: CreateDeleteFlowOptions<T>) {
  const {
    showDeleteModal,
    entityToDelete: itemToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<T>()

  const isCheckingDependencies = ref(false)

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

  async function handleDelete(id: EntityId) {
    const item = store.items.find(current => current.id === id)
    if (!item) {
      return
    }

    isCheckingDependencies.value = true

    try {
      const results = await Promise.all(
        dependencyChecks.map(check => check.check(id).then(response => response.data)),
      )

      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          showToast(dependencyChecks[i].message, 'error', 5000)
          return
        }
      }
    }
    catch (error) {
      logDependencyCheckError(error)
      showToast(
        `Warning: Could not verify ${labels.entityName} dependencies. Server will validate the delete request.`,
        'warning',
        4000,
      )
    }
    finally {
      isCheckingDependencies.value = false
    }

    openDeleteModal(item)
  }

  async function confirmDelete() {
    if (!itemToDelete.value) {
      return
    }

    startDeleting()

    try {
      await store.deleteItem(itemToDelete.value.id)
      showToast(`${labels.entityName} deleted successfully`, 'success')
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
        showToast(`Failed to delete ${labels.entityName.toLowerCase()}: ${message}`, 'error')
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
      itemToDelete,
      isDeleting,
      isCheckingDependencies,
      handleDelete,
      confirmDelete,
      cancelDelete,
    }
  }

  return {
    toast: toast!,
    showToast,
    closeToast,
    showDeleteModal,
    itemToDelete,
    isDeleting,
    isCheckingDependencies,
    handleDelete,
    confirmDelete,
    cancelDelete,
  }
}
