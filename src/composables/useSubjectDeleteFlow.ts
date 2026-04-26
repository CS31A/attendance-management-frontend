import type { AxiosResponse } from 'axios'
import type { Ref } from 'vue'
import type { DeleteFlowInternalReturn } from './useEntityDeleteFlow'
import type { SubjectDto } from '@/api/subjects'
import type { EntityId } from '@/types'
import subjectsApi from '@/api/subjects'
import { createDeleteFlow } from './useEntityDeleteFlow'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SubjectsStoreLike {
  subjects: SubjectDto[]
  deleteSubject: (id: EntityId) => Promise<unknown>
}

export interface SubjectDeleteFlowState {
  showDeleteModal: Ref<boolean>
  subjectToDelete: Ref<SubjectDto | null>
  isDeleting: Ref<boolean>
  isDeletionChecking: Ref<boolean>
  handleDeleteSubject: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

export interface SubjectDeleteFlowInternalReturn extends SubjectDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

interface SubjectApiLike {
  hasSchedulesInSubject: (id: EntityId) => Promise<AxiosResponse<boolean>>
  hasEnrollmentsInSubject: (id: EntityId) => Promise<AxiosResponse<boolean>>
}

interface CreateSubjectDeleteFlowOptions {
  subjectsStore: SubjectsStoreLike
  subjectsApi?: SubjectApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export function createSubjectDeleteFlow(
  options: Omit<CreateSubjectDeleteFlowOptions, 'showToast'>,
): SubjectDeleteFlowInternalReturn

export function createSubjectDeleteFlow(
  options: CreateSubjectDeleteFlowOptions & {
    showToast: (message: string, type?: ToastType, duration?: number) => void
  },
): SubjectDeleteFlowState

export function createSubjectDeleteFlow(options: CreateSubjectDeleteFlowOptions): SubjectDeleteFlowState | SubjectDeleteFlowInternalReturn {
  const { subjectsStore, subjectsApi: customSubjectsApi, onDeleteSuccess, logDependencyCheckError, showToast: externalShowToast } = options

  const api = customSubjectsApi ?? subjectsApi

  const flow = createDeleteFlow<SubjectDto>({
    store: {
      items: () => subjectsStore.subjects,
      deleteItem: subjectsStore.deleteSubject,
    },
    dependencyChecks: [
      {
        check: api.hasSchedulesInSubject,
        message: 'Cannot delete: Subject has schedules assigned. Remove schedules first.',
      },
      {
        check: api.hasEnrollmentsInSubject,
        message: 'Cannot delete: Subject has student enrollments. Remove enrollments first.',
      },
    ],
    labels: {
      entityName: 'Subject',
      entityNamePlural: 'Subjects',
    },
    onDeleteSuccess,
    logDependencyCheckError,
    showToast: externalShowToast,
  })

  const baseReturn: SubjectDeleteFlowState = {
    showDeleteModal: flow.showDeleteModal,
    subjectToDelete: flow.itemToDelete,
    isDeleting: flow.isDeleting,
    isDeletionChecking: flow.isCheckingDependencies,
    handleDeleteSubject: flow.handleDelete,
    confirmDelete: flow.confirmDelete,
    cancelDelete: flow.cancelDelete,
  }

  if (externalShowToast) {
    return baseReturn
  }

  const internalFlow = flow as DeleteFlowInternalReturn<SubjectDto>
  return {
    ...baseReturn,
    toast: internalFlow.toast,
    showToast: internalFlow.showToast,
    closeToast: internalFlow.closeToast,
  }
}
