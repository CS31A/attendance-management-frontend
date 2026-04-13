import type { DeleteFlowInternalReturn } from './useEntityDeleteFlow'
import type { SectionDto } from '@/api/sections'
import type { EntityId } from '@/types'
import sectionsApi from '@/api/sections'
import { createDeleteFlow } from './useEntityDeleteFlow'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface SectionsStoreLike {
  sections: SectionDto[]
  deleteSection: (id: EntityId) => Promise<unknown>
}

export interface SectionDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  sectionToDelete: import('vue').Ref<SectionDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteSection: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

export interface SectionDeleteFlowInternalReturn extends SectionDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

interface SectionApiLike {
  hasSchedulesInSection: (id: EntityId) => Promise<import('axios').AxiosResponse<boolean>>
  hasStudentsInSection: (id: EntityId) => Promise<import('axios').AxiosResponse<boolean>>
  hasEnrollmentsInSection: (id: EntityId) => Promise<import('axios').AxiosResponse<boolean>>
}

interface CreateSectionDeleteFlowOptions {
  sectionsStore: SectionsStoreLike
  sectionsApi?: SectionApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export function createSectionDeleteFlow(
  options: Omit<CreateSectionDeleteFlowOptions, 'showToast'>,
): SectionDeleteFlowInternalReturn

export function createSectionDeleteFlow(
  options: CreateSectionDeleteFlowOptions & {
    showToast: (message: string, type?: ToastType, duration?: number) => void
  },
): SectionDeleteFlowState

export function createSectionDeleteFlow(options: CreateSectionDeleteFlowOptions): SectionDeleteFlowState | SectionDeleteFlowInternalReturn {
  const { sectionsStore, sectionsApi: customSectionsApi, onDeleteSuccess, logDependencyCheckError, showToast: externalShowToast } = options

  const api = customSectionsApi || sectionsApi

  const flow = createDeleteFlow<SectionDto>({
    store: {
      items: sectionsStore.sections,
      deleteItem: sectionsStore.deleteSection,
    },
    dependencyChecks: [
      {
        check: api.hasSchedulesInSection,
        message: 'Cannot delete: Section has schedules assigned. Remove schedules first.',
      },
      {
        check: api.hasStudentsInSection,
        message: 'Cannot delete: Section has assigned students. Reassign students first.',
      },
      {
        check: api.hasEnrollmentsInSection,
        message: 'Cannot delete: Section has student enrollments. Remove enrollments first.',
      },
    ],
    labels: {
      entityName: 'Section',
      entityNamePlural: 'Sections',
    },
    onDeleteSuccess,
    logDependencyCheckError,
    showToast: externalShowToast,
  })

  const baseReturn: SectionDeleteFlowState = {
    showDeleteModal: flow.showDeleteModal,
    sectionToDelete: flow.itemToDelete,
    isDeleting: flow.isDeleting,
    isDeletionChecking: flow.isCheckingDependencies,
    handleDeleteSection: flow.handleDelete,
    confirmDelete: flow.confirmDelete,
    cancelDelete: flow.cancelDelete,
  }

  if (externalShowToast) {
    return baseReturn
  }

  const internalFlow = flow as DeleteFlowInternalReturn<SectionDto>
  return {
    ...baseReturn,
    toast: internalFlow.toast,
    showToast: internalFlow.showToast,
    closeToast: internalFlow.closeToast,
  }
}
