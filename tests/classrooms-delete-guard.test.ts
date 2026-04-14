import type { ClassroomDto } from '@/api/classrooms'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createClassroomDeleteFlow } from '@/composables/useClassroomDeleteFlow'

function createConflictError(message: string) {
  const error = new Error('Request failed with status code 409') as Error & {
    response?: {
      status: number
      data: { message: string }
    }
  }

  error.response = {
    status: 409,
    data: { message },
  }

  return error
}

function createClassroom(id = 1, name = 'Test Classroom'): ClassroomDto {
  return { id, name }
}

describe('classrooms delete guard regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the delete modal after dependency checks pass', async () => {
    const flow = createClassroomDeleteFlow({
      classroomsStore: {
        classrooms: [createClassroom()],
        deleteClassroom: vi.fn(),
      },
      classroomsApi: {
        hasSchedulesInClassroom: vi.fn().mockResolvedValue({ data: false }),
        hasSessionsInClassroom: vi.fn().mockResolvedValue({ data: false }),
      },
    })

    await flow.handleDeleteClassroom(1)

    expect(flow.isDeletionChecking.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.classroomToDelete.value?.id).toBe(1)
    expect(flow.toast.show).toBe(false)
  })

  it('blocks delete and shows an actionable toast when schedules exist', async () => {
    const flow = createClassroomDeleteFlow({
      classroomsStore: {
        classrooms: [createClassroom()],
        deleteClassroom: vi.fn(),
      },
      classroomsApi: {
        hasSchedulesInClassroom: vi.fn().mockResolvedValue({ data: true }),
        hasSessionsInClassroom: vi.fn().mockResolvedValue({ data: false }),
      },
    })

    await flow.handleDeleteClassroom(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.classroomToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Classroom has schedules assigned. Remove schedules first.')
  })

  it('blocks delete and shows an actionable toast when sessions exist', async () => {
    const flow = createClassroomDeleteFlow({
      classroomsStore: {
        classrooms: [createClassroom()],
        deleteClassroom: vi.fn(),
      },
      classroomsApi: {
        hasSchedulesInClassroom: vi.fn().mockResolvedValue({ data: false }),
        hasSessionsInClassroom: vi.fn().mockResolvedValue({ data: true }),
      },
    })

    await flow.handleDeleteClassroom(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.classroomToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Classroom has sessions assigned. Remove sessions first.')
  })

  it('checks schedules before sessions and blocks on first dependency found', async () => {
    const flow = createClassroomDeleteFlow({
      classroomsStore: {
        classrooms: [createClassroom()],
        deleteClassroom: vi.fn(),
      },
      classroomsApi: {
        hasSchedulesInClassroom: vi.fn().mockResolvedValue({ data: true }),
        hasSessionsInClassroom: vi.fn().mockResolvedValue({ data: true }),
      },
    })

    await flow.handleDeleteClassroom(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.toast.message).toBe('Cannot delete: Classroom has schedules assigned. Remove schedules first.')
  })

  it('keeps the delete path available when dependency checks fail', async () => {
    const logError = vi.fn()
    const flow = createClassroomDeleteFlow({
      classroomsStore: {
        classrooms: [createClassroom()],
        deleteClassroom: vi.fn(),
      },
      classroomsApi: {
        hasSchedulesInClassroom: vi.fn().mockRejectedValue(new Error('network down')),
        hasSessionsInClassroom: vi.fn().mockResolvedValue({ data: false }),
      },
      logDependencyCheckError: logError,
    })

    await flow.handleDeleteClassroom(1)

    expect(flow.isDeletionChecking.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.classroomToDelete.value?.id).toBe(1)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('warning')
    expect(flow.toast.message).toBe('Warning: Could not verify classroom dependencies. Server will validate the delete request.')
    expect(logError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('keeps the modal open and shows the conflict message on a 409 delete failure', async () => {
    const classroom = createClassroom()
    const conflictMessage = 'Cannot delete: Classroom has schedules assigned. Remove schedules first.'
    const flow = createClassroomDeleteFlow({
      classroomsStore: {
        classrooms: [classroom],
        deleteClassroom: vi.fn().mockRejectedValue(createConflictError(conflictMessage)),
      },
    })

    flow.classroomToDelete.value = classroom
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.classroomToDelete.value).toEqual(classroom)
    expect(flow.isDeleting.value).toBe(false)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe(conflictMessage)
  })

  it('closes the modal and clears selection after a successful delete', async () => {
    const classroom = createClassroom()
    const onDeleteSuccess = vi.fn()
    const classroomsStore = {
      classrooms: [classroom],
      deleteClassroom: vi.fn().mockImplementation(async (id: number) => {
        classroomsStore.classrooms = classroomsStore.classrooms.filter(current => current.id !== id)
      }),
    }

    const flow = createClassroomDeleteFlow({
      classroomsStore,
      onDeleteSuccess,
    })

    flow.classroomToDelete.value = classroom
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(classroomsStore.classrooms).toHaveLength(0)
    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.classroomToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('success')
    expect(flow.toast.message).toBe('Classroom deleted successfully')
    expect(onDeleteSuccess).toHaveBeenCalledOnce()
  })

  describe('external toast mode', () => {
    it('delegates schedules-block error to external showToast', async () => {
      const externalShowToast = vi.fn()
      const flow = createClassroomDeleteFlow({
        classroomsStore: {
          classrooms: [createClassroom()],
          deleteClassroom: vi.fn(),
        },
        classroomsApi: {
          hasSchedulesInClassroom: vi.fn().mockResolvedValue({ data: true }),
          hasSessionsInClassroom: vi.fn().mockResolvedValue({ data: false }),
        },
        showToast: externalShowToast,
      })

      await flow.handleDeleteClassroom(1)

      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.classroomToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith(
        'Cannot delete: Classroom has schedules assigned. Remove schedules first.',
        'error',
        5000,
      )
      expect('toast' in flow).toBe(false)
    })

    it('does not return internal toast API in external mode', () => {
      const externalShowToast = vi.fn()
      const flow = createClassroomDeleteFlow({
        classroomsStore: {
          classrooms: [createClassroom()],
          deleteClassroom: vi.fn(),
        },
        showToast: externalShowToast,
      })

      expect(flow).toHaveProperty('showDeleteModal')
      expect(flow).toHaveProperty('classroomToDelete')
      expect(flow).toHaveProperty('isDeleting')
      expect(flow).toHaveProperty('isDeletionChecking')
      expect(flow).toHaveProperty('handleDeleteClassroom')
      expect(flow).toHaveProperty('confirmDelete')
      expect(flow).toHaveProperty('cancelDelete')

      expect('toast' in flow).toBe(false)
      expect('closeToast' in flow).toBe(false)
    })
  })
})
