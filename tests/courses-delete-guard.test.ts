import type { CourseDto } from '@/api/courses'
import type { EntityId } from '@/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createDeleteFlow } from '@/composables/useEntityDeleteFlow'

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

function createCourse(id = '1', name = 'Test Course'): CourseDto {
  return { id, name }
}

describe('courses delete guard regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the delete modal after dependency checks pass', async () => {
    const flow = createDeleteFlow<CourseDto>({
      store: {
        items: () => [createCourse()],
        deleteItem: vi.fn(),
      },
      dependencyChecks: [
        { check: vi.fn().mockResolvedValue({ data: false }), message: 'Cannot delete: Course has sections assigned. Remove sections first.' },
      ],
      labels: { entityName: 'Course', entityNamePlural: 'Courses' },
    })

    await flow.handleDelete('1')

    expect(flow.isCheckingDependencies.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.itemToDelete.value?.id).toBe('1')
    expect(flow.toast.show).toBe(false)
  })

  it('blocks delete and shows an actionable toast when sections exist', async () => {
    const flow = createDeleteFlow<CourseDto>({
      store: {
        items: () => [createCourse()],
        deleteItem: vi.fn(),
      },
      dependencyChecks: [
        { check: vi.fn().mockResolvedValue({ data: true }), message: 'Cannot delete: Course has sections assigned. Remove sections first.' },
      ],
      labels: { entityName: 'Course', entityNamePlural: 'Courses' },
    })

    await flow.handleDelete('1')

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.itemToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Course has sections assigned. Remove sections first.')
  })

  it('keeps the delete path available when dependency checks fail', async () => {
    const logError = vi.fn()
    const flow = createDeleteFlow<CourseDto>({
      store: {
        items: () => [createCourse()],
        deleteItem: vi.fn(),
      },
      dependencyChecks: [
        { check: vi.fn().mockRejectedValue(new Error('network down')), message: 'Cannot delete: Course has sections assigned. Remove sections first.' },
      ],
      labels: { entityName: 'Course', entityNamePlural: 'Courses' },
      logDependencyCheckError: logError,
    })

    await flow.handleDelete('1')

    expect(flow.isCheckingDependencies.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.itemToDelete.value?.id).toBe('1')
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('warning')
    expect(flow.toast.message).toBe('Warning: Could not verify course dependencies. Server will validate the delete request.')
    expect(logError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('keeps the modal open and shows the conflict message on a 409 delete failure', async () => {
    const course = createCourse()
    const conflictMessage = 'Cannot delete: Course has sections assigned. Remove sections first.'
    const flow = createDeleteFlow<CourseDto>({
      store: {
        items: () => [course],
        deleteItem: vi.fn().mockRejectedValue(createConflictError(conflictMessage)),
      },
      dependencyChecks: [],
      labels: { entityName: 'Course', entityNamePlural: 'Courses' },
    })

    flow.itemToDelete.value = course
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.itemToDelete.value).toEqual(course)
    expect(flow.isDeleting.value).toBe(false)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe(conflictMessage)
  })

  it('closes the modal and clears selection after a successful delete', async () => {
    const course = createCourse()
    const onDeleteSuccess = vi.fn()
    const items = [course]
    const store = {
      deleteItem: vi.fn().mockImplementation(async (id: EntityId) => {
        const idx = items.findIndex(current => current.id === id)
        if (idx !== -1) items.splice(idx, 1)
      }),
    }

    const flow = createDeleteFlow<CourseDto>({
      store: {
        items: () => items,
        deleteItem: store.deleteItem,
      },
      dependencyChecks: [],
      labels: { entityName: 'Course', entityNamePlural: 'Courses' },
      onDeleteSuccess,
    })

    flow.itemToDelete.value = course
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(items).toHaveLength(0)
    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.itemToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('success')
    expect(flow.toast.message).toBe('Course deleted successfully')
    expect(onDeleteSuccess).toHaveBeenCalledOnce()
  })

  describe('external toast mode', () => {
    it('delegates sections-block error to external showToast', async () => {
      const externalShowToast = vi.fn()
      const flow = createDeleteFlow<CourseDto>({
        store: {
          items: () => [createCourse()],
          deleteItem: vi.fn(),
        },
        dependencyChecks: [
          { check: vi.fn().mockResolvedValue({ data: true }), message: 'Cannot delete: Course has sections assigned. Remove sections first.' },
        ],
        labels: { entityName: 'Course', entityNamePlural: 'Courses' },
        showToast: externalShowToast,
      })

      await flow.handleDelete('1')

      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.itemToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith(
        'Cannot delete: Course has sections assigned. Remove sections first.',
        'error',
        5000,
      )
      expect('toast' in flow).toBe(false)
    })

    it('delegates warning toast when dependency checks fail', async () => {
      const externalShowToast = vi.fn()
      const logError = vi.fn()
      const flow = createDeleteFlow<CourseDto>({
        store: {
          items: () => [createCourse()],
          deleteItem: vi.fn(),
        },
        dependencyChecks: [
          { check: vi.fn().mockRejectedValue(new Error('network down')), message: 'Cannot delete: Course has sections assigned. Remove sections first.' },
        ],
        labels: { entityName: 'Course', entityNamePlural: 'Courses' },
        logDependencyCheckError: logError,
        showToast: externalShowToast,
      })

      await flow.handleDelete('1')

      expect(flow.isCheckingDependencies.value).toBe(false)
      expect(flow.showDeleteModal.value).toBe(true)
      expect(flow.itemToDelete.value?.id).toBe('1')
      expect(externalShowToast).toHaveBeenCalledWith(
        'Warning: Could not verify course dependencies. Server will validate the delete request.',
        'warning',
        4000,
      )
      expect(logError).toHaveBeenCalledWith(expect.any(Error))
      expect('toast' in flow).toBe(false)
    })

    it('delegates success toast after delete', async () => {
      const externalShowToast = vi.fn()
      const onDeleteSuccess = vi.fn()
      const course = createCourse()
      const items = [course]
      const store = {
        deleteItem: vi.fn().mockImplementation(async (id: EntityId) => {
          const idx = items.findIndex((current: CourseDto) => current.id === id)
          if (idx !== -1) items.splice(idx, 1)
        }),
      }

      const flow = createDeleteFlow<CourseDto>({
        store: {
          items: () => items,
          deleteItem: store.deleteItem,
        },
        dependencyChecks: [],
        labels: { entityName: 'Course', entityNamePlural: 'Courses' },
        onDeleteSuccess,
        showToast: externalShowToast,
      })

      flow.itemToDelete.value = course
      flow.showDeleteModal.value = true

      await flow.confirmDelete()

      expect(items).toHaveLength(0)
      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.itemToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith('Course deleted successfully', 'success', 3000)
      expect(onDeleteSuccess).toHaveBeenCalledOnce()
      expect('toast' in flow).toBe(false)
    })

    it('does not return internal toast API in external mode', () => {
      const externalShowToast = vi.fn()
      const flow = createDeleteFlow<CourseDto>({
        store: {
          items: () => [createCourse()],
          deleteItem: vi.fn(),
        },
        dependencyChecks: [],
        labels: { entityName: 'Course', entityNamePlural: 'Courses' },
        showToast: externalShowToast,
      })

      expect(flow).toHaveProperty('showDeleteModal')
      expect(flow).toHaveProperty('itemToDelete')
      expect(flow).toHaveProperty('isDeleting')
      expect(flow).toHaveProperty('isCheckingDependencies')
      expect(flow).toHaveProperty('handleDelete')
      expect(flow).toHaveProperty('confirmDelete')
      expect(flow).toHaveProperty('cancelDelete')

      expect('toast' in flow).toBe(false)
      expect('closeToast' in flow).toBe(false)
    })
  })
})
