import type { SubjectDto } from '@/api/subjects'
import type { EntityId } from '@/types'
import subjectsApi from '@/api/subjects'
import { createDeleteFlow } from './useEntityDeleteFlow'
import type { DeleteFlowInternalReturn } from './useEntityDeleteFlow'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SubjectsStoreLike {
  subjects: SubjectDto[]
  deleteSubject: (id: EntityId) => Promise<unknown>
}

export interface SubjectDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  subjectToDelete: import('vue').Ref<SubjectDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
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

interface CreateSubjectDeleteFlowOptions {
  subjectsStore: SubjectsStoreLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export function createSubjectDeleteFlow(options: CreateSubjectDeleteFlowOptions): SubjectDeleteFlowState | SubjectDeleteFlowInternalReturn {
  const { subjectsStore, onDeleteSuccess, logDependencyCheckError, showToast: externalShowToast } = options
  
  const flow = createDeleteFlow<SubjectDto>({
    store: {
      items: subjectsStore.subjects,
      deleteItem: subjectsStore.deleteSubject,
    },
    dependencyChecks: [
      {
        check: subjectsApi.hasSchedulesInSubject,
        message: 'Cannot delete: Subject has schedules assigned. Remove schedules first.',
      },
      {
        check: subjectsApi.hasEnrollmentsInSubject,
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
