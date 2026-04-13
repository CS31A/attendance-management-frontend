import type { HandleErrorableModal } from '../src/types/ui'
import { describe, expect, it } from 'vitest'
import { isRef } from 'vue'
import { useModalState } from '../src/composables/useModalState'

interface TestEntity {
  id: number
  name: string
}

describe('useModalState', () => {
  it('returns initial state as closed with null entity and null modalRef', () => {
    const { showModal, selectedEntity, modalRef } = useModalState<TestEntity>()

    expect(showModal.value).toBe(false)
    expect(selectedEntity.value).toBeNull()
    expect(modalRef.value).toBeNull()
  })

  it('returns refs that can be updated', () => {
    const { showModal, selectedEntity, modalRef } = useModalState<TestEntity>()

    showModal.value = true
    selectedEntity.value = { id: 1, name: 'Test' }
    const handleError = (msg?: string) => {
      console.error(msg)
    }
    modalRef.value = { handleError }

    expect(showModal.value).toBe(true)
    expect(selectedEntity.value).toEqual({ id: 1, name: 'Test' })
    expect(modalRef.value).toBeDefined()
    expect(typeof modalRef.value?.handleError).toBe('function')
  })

  it('returns typed refs that are Vue refs', () => {
    const { showModal, selectedEntity, modalRef } = useModalState<TestEntity>()

    expect(isRef(showModal)).toBe(true)
    expect(isRef(selectedEntity)).toBe(true)
    expect(isRef(modalRef)).toBe(true)
  })

  it('allows entity ref to accept typed values', () => {
    const { selectedEntity } = useModalState<TestEntity>()

    selectedEntity.value = { id: 1, name: 'Test Entity' }
    expect(selectedEntity.value?.id).toBe(1)
    expect(selectedEntity.value?.name).toBe('Test Entity')

    selectedEntity.value = null
    expect(selectedEntity.value).toBeNull()
  })

  it('allows modalRef to accept HandleErrorableModal implementation', () => {
    const { modalRef } = useModalState<TestEntity>()

    const handleErrorFn = (message?: string) => {
      console.error(message)
    }
    const mockModal: HandleErrorableModal = { handleError: handleErrorFn }

    modalRef.value = mockModal
    expect(modalRef.value).toStrictEqual(mockModal)
    expect(typeof modalRef.value?.handleError).toBe('function')
  })

  it('works with different entity types', () => {
    interface OtherEntity {
      uuid: string
      count: number
    }

    const { showModal, selectedEntity } = useModalState<OtherEntity>()

    showModal.value = true
    selectedEntity.value = { uuid: 'abc-123', count: 42 }

    expect(showModal.value).toBe(true)
    expect(selectedEntity.value?.uuid).toBe('abc-123')
    expect(selectedEntity.value?.count).toBe(42)
  })

  it('maintains independent state between multiple composable instances', () => {
    const modal1 = useModalState<TestEntity>()
    const modal2 = useModalState<TestEntity>()

    modal1.showModal.value = true
    modal1.selectedEntity.value = { id: 1, name: 'First' }

    modal2.showModal.value = false
    modal2.selectedEntity.value = { id: 2, name: 'Second' }

    expect(modal1.showModal.value).toBe(true)
    expect(modal1.selectedEntity.value?.name).toBe('First')
    expect(modal2.showModal.value).toBe(false)
    expect(modal2.selectedEntity.value?.name).toBe('Second')
  })
})
