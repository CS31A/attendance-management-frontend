import type { ClassroomDto } from '@/api/classrooms'
import type { EntityId } from '@/types'
import { reactive, ref } from 'vue'

import classroomsApi from '@/api/classrooms'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'
import { useDeleteModalLifecycle } from './useDeleteModalLifecycle'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ClassroomsStoreLike {
  classrooms: ClassroomDto[]
  deleteClassroom: (id: EntityId) => Promise<unknown>
}

interface ClassroomApiLike {
  hasSchedulesInClassroom: typeof classroomsApi.hasSchedulesInClassroom
  hasSessionsInClassroom: typeof classroomsApi.hasSessionsInClassroom
}

interface CreateClassroomDeleteFlowOptions {
  classroomsStore: ClassroomsStoreLike
  classroomsApi?: ClassroomApiLike
  onDeleteSuccess?: () => void
  logDependencyCheckError?: (error: unknown) => void
  showToast?: (message: string, type?: ToastType, duration?: number) => void
}

interface ClassroomDeleteFlowState {
  showDeleteModal: import('vue').Ref<boolean>
  classroomToDelete: import('vue').Ref<ClassroomDto | null>
  isDeleting: import('vue').Ref<boolean>
  isDeletionChecking: import('vue').Ref<boolean>
  handleDeleteClassroom: (id: EntityId) => Promise<void>
  confirmDelete: () => Promise<void>
  cancelDelete: () => void
}

interface ClassroomDeleteFlowInternalReturn extends ClassroomDeleteFlowState {
  toast: {
    show: boolean
    message: string
    type: ToastType
    duration: number
  }
  showToast: (message: string, type?: ToastType, duration?: number) => void
  closeToast: () => void
}

export function createClassroomDeleteFlow(
  options: Omit<CreateClassroomDeleteFlowOptions, 'showToast'>,
): ClassroomDeleteFlowInternalReturn

export function createClassroomDeleteFlow(
  options: CreateClassroomDeleteFlowOptions & { showToast: (message: string, type?: ToastType, duration?: number) => void },
): ClassroomDeleteFlowState

export function createClassroomDeleteFlow({
  classroomsStore,
  classroomsApi: classroomApi = classroomsApi,
  onDeleteSuccess,
  logDependencyCheckError = error => console.error('Failed to check classroom dependencies:', error),
  showToast: externalShowToast,
}: CreateClassroomDeleteFlowOptions) {
  const {
    showDeleteModal,
    entityToDelete: classroomToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    startDeleting,
    finishDeleting,
  } = useDeleteModalLifecycle<ClassroomDto>()

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

  async function handleDeleteClassroom(id: EntityId) {
    const classroom = classroomsStore.classrooms.find(current => current.id === id)
    if (!classroom) {
      return
    }

    isDeletionChecking.value = true

    try {
      const [hasSchedules, hasSessions] = await Promise.all([
        classroomApi.hasSchedulesInClassroom(id).then(response => response.data),
        classroomApi.hasSessionsInClassroom(id).then(response => response.data),
      ])

      if (hasSchedules) {
        showToast('Cannot delete: Classroom has schedules assigned. Remove schedules first.', 'error', 5000)
        return
      }

      if (hasSessions) {
        showToast('Cannot delete: Classroom has sessions assigned. Remove sessions first.', 'error', 5000)
        return
      }
    }
    catch (error) {
      logDependencyCheckError(error)
      showToast(
        'Warning: Could not verify classroom dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
    }
    finally {
      isDeletionChecking.value = false
    }

    openDeleteModal(classroom)
  }

  async function confirmDelete() {
    if (!classroomToDelete.value) {
      return
    }

    startDeleting()

    try {
      await classroomsStore.deleteClassroom(classroomToDelete.value.id)
      showToast('Classroom deleted successfully', 'success')
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
        showToast(`Failed to delete classroom: ${message}`, 'error')
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
      classroomToDelete,
      isDeleting,
      isDeletionChecking,
      handleDeleteClassroom,
      confirmDelete,
      cancelDelete,
    }
  }

  return {
    toast: toast!,
    showToast,
    closeToast,
    showDeleteModal,
    classroomToDelete,
    isDeleting,
    isDeletionChecking,
    handleDeleteClassroom,
    confirmDelete,
    cancelDelete,
  }
}
