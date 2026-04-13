import { describe, expect, it } from 'vitest'
import { useDeleteModalLifecycle } from '@/composables/useDeleteModalLifecycle'

interface TestEntity {
  id: number
  name: string
}

function createTestEntity(id = 1, name = 'Test Entity'): TestEntity {
  return { id, name }
}

describe('useDeleteModalLifecycle', () => {
  it('initializes with closed modal and null entity', () => {
    const { showDeleteModal, entityToDelete, isDeleting } = useDeleteModalLifecycle<TestEntity>()

    expect(showDeleteModal.value).toBe(false)
    expect(entityToDelete.value).toBeNull()
    expect(isDeleting.value).toBe(false)
  })

  it('opens modal with entity', () => {
    const { showDeleteModal, entityToDelete, openDeleteModal } = useDeleteModalLifecycle<TestEntity>()
    const entity = createTestEntity(1, 'Entity 1')

    openDeleteModal(entity)

    expect(showDeleteModal.value).toBe(true)
    expect(entityToDelete.value).toEqual(entity)
  })

  it('closes modal and clears entity', () => {
    const { showDeleteModal, entityToDelete, openDeleteModal, closeDeleteModal }
      = useDeleteModalLifecycle<TestEntity>()
    const entity = createTestEntity(1, 'Entity 1')

    openDeleteModal(entity)
    closeDeleteModal()

    expect(showDeleteModal.value).toBe(false)
    expect(entityToDelete.value).toBeNull()
  })

  it('tracks deleting state', () => {
    const { isDeleting, startDeleting, finishDeleting } = useDeleteModalLifecycle<TestEntity>()

    expect(isDeleting.value).toBe(false)

    startDeleting()
    expect(isDeleting.value).toBe(true)

    finishDeleting()
    expect(isDeleting.value).toBe(false)
  })

  it('maintains separate state for different entity types', () => {
    interface EntityA { id: number, name: string }
    interface EntityB { id: string, title: string }

    const flowA = useDeleteModalLifecycle<EntityA>()
    const flowB = useDeleteModalLifecycle<EntityB>()

    flowA.openDeleteModal({ id: 1, name: 'A' })
    flowB.openDeleteModal({ id: '2', title: 'B' })

    expect(flowA.entityToDelete.value).toEqual({ id: 1, name: 'A' })
    expect(flowB.entityToDelete.value).toEqual({ id: '2', title: 'B' })
    expect(flowA.showDeleteModal.value).toBe(true)
    expect(flowB.showDeleteModal.value).toBe(true)
  })
})
