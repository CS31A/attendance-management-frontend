import type { DeleteFlowInternalReturn } from './useEntityDeleteFlow'
import type { CourseDto } from '@/api/courses'
import type { EntityId } from '@/types'
import coursesApi from '@/api/courses'
import { createDeleteFlow } from './useEntityDeleteFlow'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface CoursesStoreLike {
  courses: CourseDto[]
  deleteCourse: (id: EntityId) => Promise<unknown>
}

export interface CourseDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  courseToDelete: import('vue').Ref<CourseDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteCourse: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

export interface CourseDeleteFlowInternalReturn extends CourseDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

interface CreateCourseDeleteFlowOptions {
  coursesStore: CoursesStoreLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

export function createCourseDeleteFlow(options: CreateCourseDeleteFlowOptions): CourseDeleteFlowState | CourseDeleteFlowInternalReturn {
  const { coursesStore, onDeleteSuccess, logDependencyCheckError, showToast: externalShowToast } = options

  const flow = createDeleteFlow<CourseDto>({
    store: {
      items: coursesStore.courses,
      deleteItem: coursesStore.deleteCourse,
    },
    dependencyChecks: [
      {
        check: coursesApi.hasSectionsInCourse,
        message: 'Cannot delete: Course has sections assigned. Remove sections first.',
      },
    ],
    labels: {
      entityName: 'Course',
      entityNamePlural: 'Courses',
    },
    onDeleteSuccess,
    logDependencyCheckError,
    showToast: externalShowToast,
  })

  const baseReturn: CourseDeleteFlowState = {
    showDeleteModal: flow.showDeleteModal,
    courseToDelete: flow.itemToDelete,
    isDeleting: flow.isDeleting,
    isDeletionChecking: flow.isCheckingDependencies,
    handleDeleteCourse: flow.handleDelete,
    confirmDelete: flow.confirmDelete,
    cancelDelete: flow.cancelDelete,
  }

  if (externalShowToast) {
    return baseReturn
  }

  const internalFlow = flow as DeleteFlowInternalReturn<CourseDto>
  return {
    ...baseReturn,
    toast: internalFlow.toast,
    showToast: internalFlow.showToast,
    closeToast: internalFlow.closeToast,
  }
}
