import type { SectionDto } from '@/api/sections'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import { createSectionDeleteFlow } from '@/composables/useSectionDeleteFlow'
import { useSectionStore } from '@/stores/sectionStore'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

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

function createSection(id = 1, name = 'Test Section'): SectionDto {
  return { id, name }
}

describe('sections delete guard regression', () => {
  const originalDelete = api.delete

  beforeEach(() => {
    setActivePinia(createPinia())
    api.delete = originalDelete
  })

  it('opens the delete modal after dependency checks pass', async () => {
    const flow = createSectionDeleteFlow({
      sectionsStore: {
        sections: [createSection()],
        deleteSection: vi.fn(),
      },
      sectionsApi: {
        hasSchedulesInSection: vi.fn().mockResolvedValue({ data: false }),
        hasStudentsInSection: vi.fn().mockResolvedValue({ data: false }),
        hasEnrollmentsInSection: vi.fn().mockResolvedValue({ data: false }),
      },
    })

    await flow.handleDeleteSection(1)

    expect(flow.isDeletionChecking.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.sectionToDelete.value?.id).toBe(1)
    expect(flow.toast.show).toBe(false)
  })

  it('blocks delete and shows an actionable toast when schedules exist', async () => {
    const flow = createSectionDeleteFlow({
      sectionsStore: {
        sections: [createSection()],
        deleteSection: vi.fn(),
      },
      sectionsApi: {
        hasSchedulesInSection: vi.fn().mockResolvedValue({ data: true }),
        hasStudentsInSection: vi.fn().mockResolvedValue({ data: false }),
        hasEnrollmentsInSection: vi.fn().mockResolvedValue({ data: false }),
      },
    })

    await flow.handleDeleteSection(1)

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.sectionToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Section has schedules assigned. Remove schedules first.')
  })

  it('keeps the delete path available when dependency checks fail', async () => {
    const logError = vi.fn()
    const flow = createSectionDeleteFlow({
      sectionsStore: {
        sections: [createSection()],
        deleteSection: vi.fn(),
      },
      sectionsApi: {
        hasSchedulesInSection: vi.fn().mockRejectedValue(new Error('network down')),
        hasStudentsInSection: vi.fn().mockResolvedValue({ data: false }),
        hasEnrollmentsInSection: vi.fn().mockResolvedValue({ data: false }),
      },
      logDependencyCheckError: logError,
    })

    await flow.handleDeleteSection(1)

    expect(flow.isDeletionChecking.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.sectionToDelete.value?.id).toBe(1)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('warning')
    expect(flow.toast.message).toBe('Warning: Could not verify section dependencies. Server will validate the delete request.')
    expect(logError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('keeps the modal open and shows the conflict message on a 409 delete failure', async () => {
    const section = createSection()
    const conflictMessage = 'Cannot delete: Section has schedules assigned. Remove schedules first.'
    const flow = createSectionDeleteFlow({
      sectionsStore: {
        sections: [section],
        deleteSection: vi.fn().mockRejectedValue(createConflictError(conflictMessage)),
      },
    })

    flow.sectionToDelete.value = section
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.sectionToDelete.value).toEqual(section)
    expect(flow.isDeleting.value).toBe(false)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe(conflictMessage)
  })

  it('closes the modal and clears selection after a successful delete', async () => {
    const section = createSection()
    const onDeleteSuccess = vi.fn()
    const sectionsStore = {
      sections: [section],
      deleteSection: vi.fn().mockImplementation(async (id: number) => {
        sectionsStore.sections = sectionsStore.sections.filter(current => current.id !== id)
      }),
    }

    const flow = createSectionDeleteFlow({
      sectionsStore,
      onDeleteSuccess,
    })

    flow.sectionToDelete.value = section
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(sectionsStore.sections).toHaveLength(0)
    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.sectionToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('success')
    expect(flow.toast.message).toBe('Section deleted successfully')
    expect(onDeleteSuccess).toHaveBeenCalledOnce()
  })

  it('propagates 409 error with status code for conflict handling', async () => {
    const sectionStore = useSectionStore()
    const sectionId = 1
    const conflictMessage = 'Cannot delete: Section has schedules assigned. Remove schedules first.'

    sectionStore.sections = [{ id: sectionId, name: 'Test Section' }]
    api.delete = async () => {
      throw createConflictError(conflictMessage)
    }

    let caughtError: unknown
    try {
      await sectionStore.deleteSection(sectionId)
    }
    catch (error) {
      caughtError = error
    }

    expect(getErrorStatus(caughtError)).toBe(409)
    expect(getErrorMessage(caughtError, 'Delete request failed')).toBe(conflictMessage)
    expect(sectionStore.sections.find((section: SectionDto) => section.id === sectionId)).toBeDefined()
  })

  it('removes section from store only on successful delete', async () => {
    const sectionStore = useSectionStore()
    const sectionId = 1

    sectionStore.sections = [{ id: sectionId, name: 'Test Section' }]
    api.delete = async () => ({ status: 204, data: {} }) as never

    await sectionStore.deleteSection(sectionId)

    expect(sectionStore.sections.find((section: SectionDto) => section.id === sectionId)).toBeUndefined()
  })

  describe('external toast mode', () => {
    it('delegates schedule-block error to external showToast', async () => {
      const externalShowToast = vi.fn()
      const flow = createSectionDeleteFlow({
        sectionsStore: {
          sections: [createSection()],
          deleteSection: vi.fn(),
        },
        sectionsApi: {
          hasSchedulesInSection: vi.fn().mockResolvedValue({ data: true }),
          hasStudentsInSection: vi.fn().mockResolvedValue({ data: false }),
          hasEnrollmentsInSection: vi.fn().mockResolvedValue({ data: false }),
        },
        showToast: externalShowToast,
      })

      await flow.handleDeleteSection(1)

      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.sectionToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith(
        'Cannot delete: Section has schedules assigned. Remove schedules first.',
        'error',
        5000,
      )
      expect('toast' in flow).toBe(false)
    })

    it('delegates warning toast when dependency checks fail', async () => {
      const externalShowToast = vi.fn()
      const logError = vi.fn()
      const flow = createSectionDeleteFlow({
        sectionsStore: {
          sections: [createSection()],
          deleteSection: vi.fn(),
        },
        sectionsApi: {
          hasSchedulesInSection: vi.fn().mockRejectedValue(new Error('network down')),
          hasStudentsInSection: vi.fn().mockResolvedValue({ data: false }),
          hasEnrollmentsInSection: vi.fn().mockResolvedValue({ data: false }),
        },
        logDependencyCheckError: logError,
        showToast: externalShowToast,
      })

      await flow.handleDeleteSection(1)

      expect(flow.isDeletionChecking.value).toBe(false)
      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.sectionToDelete.value?.id).toBe(1)
      expect(externalShowToast).toHaveBeenCalledWith(
        'Warning: Could not verify section dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
      expect(logError).toHaveBeenCalledWith(expect.any(Error))
      expect('toast' in flow).toBe(false)
    })

    it('delegates success toast after delete', async () => {
      const externalShowToast = vi.fn()
      const onDeleteSuccess = vi.fn()
      const section = createSection()
      const sectionsStore = {
        sections: [section],
        deleteSection: vi.fn().mockImplementation(async (id: number) => {
          sectionsStore.sections = sectionsStore.sections.filter((current: SectionDto) => current.id !== id)
        }),
      }

      const flow = createSectionDeleteFlow({
        sectionsStore,
        onDeleteSuccess,
        showToast: externalShowToast,
      })

      flow.sectionToDelete.value = section
      flow.showDeleteModal.value = true

      await flow.confirmDelete()

      expect(sectionsStore.sections).toHaveLength(0)
      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.sectionToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith('Section deleted successfully', 'success', 3000)
      expect(onDeleteSuccess).toHaveBeenCalledOnce()
      expect('toast' in flow).toBe(false)
    })

    it('does not return internal toast API in external mode', () => {
      const externalShowToast = vi.fn()
      const flow = createSectionDeleteFlow({
        sectionsStore: {
          sections: [createSection()],
          deleteSection: vi.fn(),
        },
        showToast: externalShowToast,
      })

      // Verify only delete-flow state is returned
      expect(flow).toHaveProperty('showDeleteModal')
      expect(flow).toHaveProperty('sectionToDelete')
      expect(flow).toHaveProperty('isDeleting')
      expect(flow).toHaveProperty('isDeletionChecking')
      expect(flow).toHaveProperty('handleDeleteSection')
      expect(flow).toHaveProperty('confirmDelete')
      expect(flow).toHaveProperty('cancelDelete')

      // Verify toast properties are not returned
      expect('toast' in flow).toBe(false)
      expect('closeToast' in flow).toBe(false)
    })
  })
})
