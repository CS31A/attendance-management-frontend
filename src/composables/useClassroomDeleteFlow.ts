import type { AxiosResponse } from 'axios'
import type { Ref } from 'vue'
import type { DeleteFlowInternalReturn } from './useEntityDeleteFlow'
import type { ClassroomDto } from '@/api/classrooms'
import type { EntityId } from '@/types'
import classroomsApi from '@/api/classrooms'
import { createDeleteFlow } from './useEntityDeleteFlow'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ClassroomsStoreLike {
  classrooms: ClassroomDto[] | Ref<ClassroomDto[]> | (() => ClassroomDto[])
  deleteClassroom: (id: EntityId) => Promise<unknown>
}

export interface ClassroomDeleteFlowState {
  showDeleteModal: Ref<boolean>
  classroomToDelete: Ref<ClassroomDto | null>
  isDeleting: Ref<boolean>
  isDeletionChecking: Ref<boolean>
  handleDeleteClassroom: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

export interface ClassroomDeleteFlowInternalReturn extends ClassroomDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

interface ClassroomApiLike {
  hasSchedulesInClassroom: (id: EntityId) => Promise<AxiosResponse<boolean>>
  hasSessionsInClassroom: (id: EntityId) => Promise<AxiosResponse<boolean>>
}

interface CreateClassroomDeleteFlowOptions {
  classroomsStore: ClassroomsStoreLike
  classroomsApi?: ClassroomApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export function createClassroomDeleteFlow(
  options: Omit<CreateClassroomDeleteFlowOptions, 'showToast'>,
): ClassroomDeleteFlowInternalReturn

export function createClassroomDeleteFlow(
  options: CreateClassroomDeleteFlowOptions & {
    showToast: (message: string, type?: ToastType, duration?: number) => void
  },
): ClassroomDeleteFlowState

export function createClassroomDeleteFlow(options: CreateClassroomDeleteFlowOptions): ClassroomDeleteFlowState | ClassroomDeleteFlowInternalReturn {
  const { classroomsStore, classroomsApi: customClassroomsApi, onDeleteSuccess, logDependencyCheckError, showToast: externalShowToast } = options

  const api = customClassroomsApi ?? classroomsApi

  const flow = createDeleteFlow<ClassroomDto>({
    store: {
      items: (() => classroomsStore.classrooms) as any,
      deleteItem: classroomsStore.deleteClassroom,
    },
    dependencyChecks: [
      {
        check: api.hasSchedulesInClassroom,
        message: 'Cannot delete: Classroom has schedules assigned. Remove schedules first.',
      },
      {
        check: api.hasSessionsInClassroom,
        message: 'Cannot delete: Classroom has sessions assigned. Remove sessions first.',
      },
    ],
    labels: {
      entityName: 'Classroom',
      entityNamePlural: 'Classrooms',
    },
    onDeleteSuccess,
    logDependencyCheckError,
    showToast: externalShowToast,
  })

  const baseReturn: ClassroomDeleteFlowState = {
    showDeleteModal: flow.showDeleteModal,
    classroomToDelete: flow.itemToDelete,
    isDeleting: flow.isDeleting,
    isDeletionChecking: flow.isCheckingDependencies,
    handleDeleteClassroom: flow.handleDelete,
    confirmDelete: flow.confirmDelete,
    cancelDelete: flow.cancelDelete,
  }

  if (externalShowToast) {
    return baseReturn
  }

  const internalFlow = flow as DeleteFlowInternalReturn<ClassroomDto>
  return {
    ...baseReturn,
    toast: internalFlow.toast,
    showToast: internalFlow.showToast,
    closeToast: internalFlow.closeToast,
  }
}
