import type { ScheduleDto } from '@/api/schedules'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'

import schedulesApi from '@/api/schedules'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SchedulesStoreLike {
  schedules: ScheduleDto[]
  deleteSchedule: (id: EntityId) => Promise<unknown>
}

interface ScheduleApiLike {
  hasSessionsInSchedule: typeof schedulesApi.hasSessionsInSchedule
}

interface CreateScheduleDeleteFlowOptions {
  schedulesStore: SchedulesStoreLike
  schedulesApi?: ScheduleApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

interface ScheduleDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  scheduleToDelete: import('vue').Ref<ScheduleDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteSchedule: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

interface ScheduleDeleteFlowInternalReturn extends ScheduleDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

export function createScheduleDeleteFlow(
  options: Omit<CreateScheduleDeleteFlowOptions, 'showToast'>,
): ScheduleDeleteFlowInternalReturn

export function createScheduleDeleteFlow(
  options: CreateScheduleDeleteFlowOptions & { showToast: (message: string, type?: ToastType, duration?: number) => void },
): ScheduleDeleteFlowState

export function createScheduleDeleteFlow({
  schedulesStore,
  schedulesApi: scheduleApi = schedulesApi,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error('Failed to check schedule dependencies:', error),
  showToast: externalShowToast,
}: CreateScheduleDeleteFlowOptions) {
  const {
    showDeleteModal,
    entityToDelete: scheduleToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<ScheduleDto>()

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

  async function handleDeleteSchedule(id: EntityId) {
    const schedule = schedulesStore.schedules.find(current => current.id === id)
    if (!schedule) {
      return
    }

    isDeletionChecking.value = true

    try {
      const hasSessions = await scheduleApi.hasSessionsInSchedule(id)

      if (hasSessions) {
        showToast('Cannot delete: Schedule has sessions assigned. Remove sessions first.', 'error', 5000)
        return
      }
    }
    catch (error) {
      logDependencyCheckError(error)
      showToast(
        'Warning: Could not verify schedule dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
    }
    finally {
      isDeletionChecking.value = false
    }

    openDeleteModal(schedule)
  }

  async function confirmDelete() {
    if (!scheduleToDelete.value) {
      return
    }

    startDeleting()

    try {
      await schedulesStore.deleteSchedule(scheduleToDelete.value.id)
      showToast('Schedule deleted successfully', 'success')
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
        showToast(`Failed to delete schedule: ${message}`, 'error')
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
      scheduleToDelete,
      isDeleting,
      isDeletionChecking,
      handleDeleteSchedule,
      confirmDelete,
      cancelDelete,
    }
  }

  return {
    toast: toast!,
    showToast,
    closeToast,
    showDeleteModal,
    scheduleToDelete,
    isDeleting,
    isDeletionChecking,
    handleDeleteSchedule,
    confirmDelete,
    cancelDelete,
  }
}
