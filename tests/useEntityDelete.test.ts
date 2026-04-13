import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEntityDelete } from '@/composables/useEntityDelete'

interface TestEntity {
  id: number
  name: string
}

function createTestOptions(overrides?: Record<string, unknown>) {
  const entities: TestEntity[] = [
    { id: 1, name: 'Entity 1' },
    { id: 2, name: 'Entity 2' },
  ]

  const findEntity = vi.fn(id => entities.find(e => e.id === id))
  const deleteEntity = vi.fn(async () => ({ success: true }))
  const getEntityId = vi.fn((entity: TestEntity) => entity.id)
  const showToast = vi.fn()
  const getSuccessMessage = vi.fn((entity: TestEntity) => `${entity.name} deleted successfully`)
  const getErrorMessage = vi.fn(() => 'Delete failed')
  const onDeleteSuccess = vi.fn()

  return {
    findEntity,
    deleteEntity,
    getEntityId,
    showToast,
    getSuccessMessage,
    getErrorMessage,
    onDeleteSuccess,
    ...overrides,
  }
}

describe('useEntityDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  it('opens the modal when openDelete finds an entity', () => {
    const options = createTestOptions()
    const { showDeleteModal, entityToDelete, openDelete } = useEntityDelete(options)

    openDelete(1)

    expect(showDeleteModal.value).toBe(true)
    expect(entityToDelete.value).toEqual({ id: 1, name: 'Entity 1' })
    expect(options.findEntity).toHaveBeenCalledWith(1)
  })

  it('no-ops when openDelete cannot find the entity', () => {
    const options = createTestOptions({ findEntity: vi.fn(() => undefined) })
    const { showDeleteModal, entityToDelete, openDelete } = useEntityDelete(options)

    openDelete(999)

    expect(showDeleteModal.value).toBe(false)
    expect(entityToDelete.value).toBeNull()
    expect(options.findEntity).toHaveBeenCalledWith(999)
  })

  it('no-ops when confirmDelete is called with no entity selected', async () => {
    const options = createTestOptions()
    const { confirmDelete } = useEntityDelete(options)

    await confirmDelete()

    expect(options.deleteEntity).not.toHaveBeenCalled()
    expect(options.showToast).not.toHaveBeenCalled()
  })

  it('successfully deletes an entity and shows success toast', async () => {
    const options = createTestOptions()
    const { showDeleteModal, entityToDelete, isDeleting, openDelete, confirmDelete } = useEntityDelete(options)

    openDelete(1)
    await confirmDelete()

    expect(options.deleteEntity).toHaveBeenCalledWith(1)
    expect(options.getSuccessMessage).toHaveBeenCalledWith({ id: 1, name: 'Entity 1' })
    expect(options.showToast).toHaveBeenCalledWith('Entity 1 deleted successfully', 'success')
    expect(options.onDeleteSuccess).toHaveBeenCalledWith({ id: 1, name: 'Entity 1' })
    expect(showDeleteModal.value).toBe(false)
    expect(entityToDelete.value).toBeNull()
    expect(isDeleting.value).toBe(false)
  })

  it('shows error toast and keeps modal open when delete fails', async () => {
    const deleteError = new Error('Delete failed')
    const options = createTestOptions({
      deleteEntity: vi.fn(async () => {
        throw deleteError
      }),
    })
    const { showDeleteModal, entityToDelete, isDeleting, openDelete, confirmDelete } = useEntityDelete(options)

    openDelete(1)
    await confirmDelete()

    expect(options.deleteEntity).toHaveBeenCalledWith(1)
    expect(options.getErrorMessage).toHaveBeenCalledWith(deleteError)
    expect(options.showToast).toHaveBeenCalledWith('Delete failed', 'error')
    expect(options.onDeleteSuccess).not.toHaveBeenCalled()
    expect(showDeleteModal.value).toBe(true)
    expect(entityToDelete.value).toEqual({ id: 1, name: 'Entity 1' })
    expect(isDeleting.value).toBe(false)
  })

  it('closes the modal and clears selected entity on cancelDelete', () => {
    const options = createTestOptions()
    const { showDeleteModal, entityToDelete, openDelete, cancelDelete } = useEntityDelete(options)

    openDelete(1)
    cancelDelete()

    expect(showDeleteModal.value).toBe(false)
    expect(entityToDelete.value).toBeNull()
  })

  it('does not issue a second delete request when delete is already in flight', async () => {
    let resolveDelete: () => void
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve
    })

    const options = createTestOptions({
      deleteEntity: vi.fn(async () => {
        await deletePromise
        return { success: true }
      }),
    })
    const { openDelete, confirmDelete } = useEntityDelete(options)

    openDelete(1)

    const firstDelete = confirmDelete()
    await vi.advanceTimersByTimeAsync(0)

    await confirmDelete()

    expect(options.deleteEntity).toHaveBeenCalledTimes(1)

    resolveDelete!()
    await firstDelete

    expect(options.deleteEntity).toHaveBeenCalledTimes(1)
  })
})
