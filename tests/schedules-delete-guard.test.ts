import type { ScheduleDto } from '@/api/schedules'
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

function createSchedule(id = '1', subjectName = 'Test Subject'): ScheduleDto {
  return { id, subjectName, dayOfWeek: 'Monday', timeIn: '08:00', timeOut: '09:00' }
}

describe('schedules delete guard regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the delete modal after dependency checks pass', async () => {
    const flow = createDeleteFlow<ScheduleDto>({
      store: {
        items: () => [createSchedule()],
        deleteItem: vi.fn(),
      },
      dependencyChecks: [
        { check: vi.fn().mockResolvedValue({ data: false }), message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.' },
      ],
      labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
    })

    await flow.handleDelete('1')

    expect(flow.isCheckingDependencies.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.itemToDelete.value?.id).toBe('1')
    expect(flow.toast.show).toBe(false)
  })

  it('blocks delete and shows an actionable toast when sessions exist', async () => {
    const flow = createDeleteFlow<ScheduleDto>({
      store: {
        items: () => [createSchedule()],
        deleteItem: vi.fn(),
      },
      dependencyChecks: [
        { check: vi.fn().mockResolvedValue({ data: true }), message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.' },
      ],
      labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
    })

    await flow.handleDelete('1')

    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.itemToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe('Cannot delete: Schedule has sessions assigned. Remove sessions first.')
  })

  it('keeps the delete path available when dependency checks fail', async () => {
    const logError = vi.fn()
    const flow = createDeleteFlow<ScheduleDto>({
      store: {
        items: () => [createSchedule()],
        deleteItem: vi.fn(),
      },
      dependencyChecks: [
        { check: vi.fn().mockRejectedValue(new Error('network down')), message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.' },
      ],
      labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
      logDependencyCheckError: logError,
    })

    await flow.handleDelete('1')

    expect(flow.isCheckingDependencies.value).toBe(false)
    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.itemToDelete.value?.id).toBe('1')
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('warning')
    expect(flow.toast.message).toBe('Warning: Could not verify schedule dependencies. Server will validate the delete request.')
    expect(logError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('keeps the modal open and shows the conflict message on a 409 delete failure', async () => {
    const schedule = createSchedule()
    const conflictMessage = 'Cannot delete: Schedule has sessions assigned. Remove sessions first.'
    const flow = createDeleteFlow<ScheduleDto>({
      store: {
        items: () => [schedule],
        deleteItem: vi.fn().mockRejectedValue(createConflictError(conflictMessage)),
      },
      labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
    })

    flow.itemToDelete.value = schedule
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(flow.showDeleteModal.value).toBe(true)
    expect(flow.itemToDelete.value).toEqual(schedule)
    expect(flow.isDeleting.value).toBe(false)
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('error')
    expect(flow.toast.message).toBe(conflictMessage)
  })

  it('closes the modal and clears selection after a successful delete', async () => {
    const schedule = createSchedule()
    const onDeleteSuccess = vi.fn()
    const items = [schedule]
    const deleteItem = vi.fn().mockImplementation(async (id: string) => {
      const idx = items.findIndex(current => current.id === id)
      if (idx !== -1) items.splice(idx, 1)
    })

    const flow = createDeleteFlow<ScheduleDto>({
      store: {
        items: () => items,
        deleteItem,
      },
      labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
      onDeleteSuccess,
    })

    flow.itemToDelete.value = schedule
    flow.showDeleteModal.value = true

    await flow.confirmDelete()

    expect(items).toHaveLength(0)
    expect(flow.showDeleteModal.value).toBe(false)
    expect(flow.itemToDelete.value).toBeNull()
    expect(flow.toast.show).toBe(true)
    expect(flow.toast.type).toBe('success')
    expect(flow.toast.message).toBe('Schedule deleted successfully')
    expect(onDeleteSuccess).toHaveBeenCalledOnce()
  })

  describe('external toast mode', () => {
    it('delegates sessions-block error to external showToast', async () => {
      const externalShowToast = vi.fn()
      const flow = createDeleteFlow<ScheduleDto>({
        store: {
          items: () => [createSchedule()],
          deleteItem: vi.fn(),
        },
        dependencyChecks: [
          { check: vi.fn().mockResolvedValue({ data: true }), message: 'Cannot delete: Schedule has sessions assigned. Remove sessions first.' },
        ],
        labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
        showToast: externalShowToast,
      })

      await flow.handleDelete('1')

      expect(flow.showDeleteModal.value).toBe(false)
      expect(flow.itemToDelete.value).toBeNull()
      expect(externalShowToast).toHaveBeenCalledWith(
        'Cannot delete: Schedule has sessions assigned. Remove sessions first.',
        'error',
        5000,
      )
      expect('toast' in flow).toBe(false)
    })

    it('does not return internal toast API in external mode', () => {
      const externalShowToast = vi.fn()
      const flow = createDeleteFlow<ScheduleDto>({
        store: {
          items: () => [createSchedule()],
          deleteItem: vi.fn(),
        },
        labels: { entityName: 'Schedule', entityNamePlural: 'Schedules' },
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
