import type { SubjectDto } from '@/api/subjects'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSubjectDeleteFlow } from '@/composables/useSubjectDeleteFlow'

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

function createSubject(id = 1, name = 'Test Subject', code = 'SUB101'): SubjectDto {
  return { id, name, code }
}

describe('subjects delete guard regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the delete modal after dependency checks pass', async () => {
    const flow = createSubjectDeleteFlow({
      subjectsStore: {
        subjects: [createSubject()],
        deleteSubject: vi.fn(),
      },
      subjectsApi: {
        hasSchedulesInSubject: vi.fn().mockResolvedValue({ data: false }),
        hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: false }),
      },
    })

    await flow.handleDeleteSubject(1)

    expect(flow.isDeletionChecking.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.subjectToDelete.value?.id).toBe(1)
    expect(flow.toast.show).toBe(false)
  })

  it('blocks delete and shows an actionable toast when schedules exist', async () => {
    const flow = createSubjectDeleteFlow({
      subjectsStore: {
        subjects: [createSubject()],
        deleteSubject: vi.fn(),
      },
      subjectsApi: {
        hasSchedulesInSubject: vi.fn().mockResolvedValue({ data: true }),
        hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: false }),
      },
    })

    await flow.handleDeleteSubject(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.subjectToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Subject has schedules assigned. Remove schedules first.')
  })

  it('blocks delete and shows an actionable toast when enrollments exist', async () => {
    const flow = createSubjectDeleteFlow({
      subjectsStore: {
        subjects: [createSubject()],
        deleteSubject: vi.fn(),
      },
      subjectsApi: {
        hasSchedulesInSubject: vi.fn().mockResolvedValue({ data: false }),
        hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: true }),
      },
    })

    await flow.handleDeleteSubject(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.subjectToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Subject has student enrollments. Remove enrollments first.')
  })

  it('checks schedules before enrollments and blocks on first dependency found', async () => {
    const flow = createSubjectDeleteFlow({
      subjectsStore: {
        subjects: [createSubject()],
        deleteSubject: vi.fn(),
      },
      subjectsApi: {
        hasSchedulesInSubject: vi.fn().mockResolvedValue({ data: true }),
        hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: true }),
      },
    })

    await flow.handleDeleteSubject(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.toast.message).toBe('Cannot delete: Subject has schedules assigned. Remove schedules first.')
  })

  it('keeps the delete path available when dependency checks fail', async () => {
    const logError = vi.fn()
    const flow = createSubjectDeleteFlow({
      subjectsStore: {
        subjects: [createSubject()],
        deleteSubject: vi.fn(),
      },
      subjectsApi: {
        hasSchedulesInSubject: vi.fn().mockRejectedValue(new Error('network down')),
        hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: false }),
      },
      logDependencyCheckError: logError,
    })

    await flow.handleDeleteSubject(1)

    expect(flow.isDeletionChecking.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.subjectToDelete.value?.id).toBe(1)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('warning')
    expect(flow.toast.message).toBe('Warning: Could not verify subject dependencies. Server will validate the delete request.')
    expect(logError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('keeps the modal open and shows the conflict message on a 409 delete failure', async () => {
    const subject = createSubject()
    const conflictMessage = 'Cannot delete: Subject has schedules assigned. Remove schedules first.'
    const flow = createSubjectDeleteFlow({
      subjectsStore: {
        subjects: [subject],
        deleteSubject: vi.fn().mockRejectedValue(createConflictError(conflictMessage)),
      },
    })

    flow.subjectToDelete.value = subject
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.subjectToDelete.value).toEqual(subject)
    expect(flow.isDeleting.value).toBe(false)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe(conflictMessage)
  })

  it('closes the modal and clears selection after a successful delete', async () => {
    const subject = createSubject()
    const onDeleteSuccess = vi.fn()
    const subjectsStore = {
      subjects: [subject],
      deleteSubject: vi.fn().mockImplementation(async (id: number) => {
        subjectsStore.subjects = subjectsStore.subjects.filter(current => current.id !== id)
      }),
    }

    const flow = createSubjectDeleteFlow({
      subjectsStore,
      onDeleteSuccess,
    })

    flow.subjectToDelete.value = subject
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(subjectsStore.subjects).toHaveLength(0)
    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.subjectToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('success')
    expect(flow.toast.message).toBe('Subject deleted successfully')
    expect(onDeleteSuccess).toHaveBeenCalledOnce()
  })

  describe('external toast mode', () => {
    it('delegates schedule-block error to external showToast', async () => {
      const externalShowToast = vi.fn()
      const flow = createSubjectDeleteFlow({
        subjectsStore: {
          subjects: [createSubject()],
          deleteSubject: vi.fn(),
        },
        subjectsApi: {
          hasSchedulesInSubject: vi.fn().mockResolvedValue({ data: true }),
          hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: false }),
        },
        showToast: externalShowToast,
      })

      await flow.handleDeleteSubject(1)

      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.subjectToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith(
        'Cannot delete: Subject has schedules assigned. Remove schedules first.',
        'error',
        5000,
      )
      expect('toast' in flow).toBe(false)
    })

    it('delegates warning toast when dependency checks fail', async () => {
      const externalShowToast = vi.fn()
      const logError = vi.fn()
      const flow = createSubjectDeleteFlow({
        subjectsStore: {
          subjects: [createSubject()],
          deleteSubject: vi.fn(),
        },
        subjectsApi: {
          hasSchedulesInSubject: vi.fn().mockRejectedValue(new Error('network down')),
          hasEnrollmentsInSubject: vi.fn().mockResolvedValue({ data: false }),
        },
        logDependencyCheckError: logError,
        showToast: externalShowToast,
      })

      await flow.handleDeleteSubject(1)

      expect(flow.isDeletionChecking.value).toBe(false)
      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.subjectToDelete.value?.id).toBe(1)
      expect(externalShowToast).toHaveBeenCalledWith(
        'Warning: Could not verify subject dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
      expect(logError).toHaveBeenCalledWith(expect.any(Error))
      expect('toast' in flow).toBe(false)
    })

    it('does not return internal toast API in external mode', () => {
      const externalShowToast = vi.fn()
      const flow = createSubjectDeleteFlow({
        subjectsStore: {
          subjects: [createSubject()],
          deleteSubject: vi.fn(),
        },
        showToast: externalShowToast,
      })

      expect(flow).toHaveProperty('showDeleteModal')
      expect(flow).toHaveProperty('subjectToDelete')
      expect(flow).toHaveProperty('isDeleting')
      expect(flow).toHaveProperty('isDeletionChecking')
      expect(flow).toHaveProperty('handleDeleteSubject')
      expect(flow).toHaveProperty('confirmDelete')
      expect(flow).toHaveProperty('cancelDelete')

      expect('toast' in flow).toBe(false)
      expect('closeToast' in flow).toBe(false)
    })
  })
})
