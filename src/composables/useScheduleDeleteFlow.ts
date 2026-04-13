import type { ScheduleDto } from '@/api/schedules'
import type { EntityId } from '@/types'
import schedulesApi from '@/api/schedules'
import { createDeleteFlow } from './useEntityDeleteFlow'
import type { DeleteFlowInternalReturn } from './useEntityDeleteFlow'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SchedulesStoreLike {
  schedules: ScheduleDto[]
  deleteSchedule: (id: EntityId) => Promise<unknown>
}

export interface ScheduleDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  scheduleToDelete: import('vue').Ref<ScheduleDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteSchedule: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

export interface ScheduleDeleteFlowInternalReturn extends ScheduleDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

interface CreateScheduleDeleteFlowOptions {
  schedulesStore: SchedulesStoreLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export function createScheduleDeleteFlow(options: CreateScheduleDeleteFlowOptions): ScheduleDeleteFlowState | ScheduleDeleteFlowInternalReturn {
  const { schedulesStore, onDeleteSuccess, logDependencyCheckError, showToast: externalShowToast } = options
  
  const flow = createDeleteFlow<ScheduleDto>({
    store: {
      items: schedulesStore.schedules,
      deleteItem: schedulesStore.deleteSchedule,
    },
    dependencyChecks: [
      {
        check: schedulesApi.hasSessionsInSchedule,
        message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.',
      },
    ],
    labels: {
      entityName: 'Schedule',
      entityNamePlural: 'Schedules',
    },
    onDeleteSuccess,
    logDependencyCheckError,
    showToast: externalShowToast,
  })

  const baseReturn: ScheduleDeleteFlowState = {
    showDeleteModal: flow.showDeleteModal,
    scheduleToDelete: flow.itemToDelete,
    isDeleting: flow.isDeleting,
    isDeletionChecking: flow.isCheckingDependencies,
    handleDeleteSchedule: flow.handleDelete,
    confirmDelete: flow.confirmDelete,
    cancelDelete: flow.cancelDelete,
  }

  if (externalShowToast) {
    return baseReturn
  }

  const internalFlow = flow as DeleteFlowInternalReturn<ScheduleDto>
  return {
    ...baseReturn,
    toast: internalFlow.toast,
    showToast: internalFlow.showToast,
    closeToast: internalFlow.closeToast,
  }
}
