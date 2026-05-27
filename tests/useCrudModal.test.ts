import type { EntityId } from '../src/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isRef } from 'vue'
import { useCrudModal } from '../src/composables/useCrudModal'

interface TestEntity {
  id: EntityId
  name: string
}

interface TestPayload { name: string }

function createDefaultOptions() {
  return {
    showToast: vi.fn(),
    createFn: vi.fn().mockResolvedValue(undefined),
    updateFn: vi.fn().mockResolvedValue(undefined),
    entityLabel: 'Item',
  }
}

describe('useCrudModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('modal state management', () => {
    it('creates showModal ref defaulting to false', () => {
      const { showModal } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      expect(isRef(showModal)).toBe(true)
      expect(showModal.value).toBe(false)
    })

    it('creates selectedEntity ref defaulting to null', () => {
      const { selectedEntity } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      expect(isRef(selectedEntity)).toBe(true)
      expect(selectedEntity.value).toBeNull()
    })

    it('creates modalRef ref defaulting to null', () => {
      const { modalRef } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      expect(isRef(modalRef)).toBe(true)
      expect(modalRef.value).toBeNull()
    })

    it('returns independent state for each instance', () => {
      const opts1 = createDefaultOptions()
      const opts2 = createDefaultOptions()
      const modal1 = useCrudModal<TestPayload, TestEntity>(opts1)
      const modal2 = useCrudModal<TestPayload, TestEntity>(opts2)

      modal1.showModal.value = true
      modal1.selectedEntity.value = { id: '1', name: 'First' }

      modal2.showModal.value = false
      modal2.selectedEntity.value = { id: '2', name: 'Second' }

      expect(modal1.showModal.value).toBe(true)
      expect(modal1.selectedEntity.value?.name).toBe('First')
      expect(modal2.showModal.value).toBe(false)
      expect(modal2.selectedEntity.value?.name).toBe('Second')
    })
  })

  describe('openAddModal', () => {
    it('sets showModal to true and selectedEntity to null', () => {
      const { showModal, selectedEntity, openAddModal } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      openAddModal()

      expect(showModal.value).toBe(true)
      expect(selectedEntity.value).toBeNull()
    })
  })

  describe('openEditModal', () => {
    it('sets showModal to true and selectedEntity to a copy of the item', () => {
      const { showModal, selectedEntity, openEditModal } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      openEditModal({ id: '42', name: 'Test' })

      expect(showModal.value).toBe(true)
      expect(selectedEntity.value).toEqual({ id: '42', name: 'Test' })
    })

    it('creates a shallow copy to avoid mutating the original', () => {
      const { selectedEntity, openEditModal } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())
      const original = { id: '42', name: 'Original' }

      openEditModal(original)
      selectedEntity.value!.name = 'Mutated'

      expect(original.name).toBe('Original')
    })
  })

  describe('closeModal', () => {
    it('sets showModal to false and clears selectedEntity', () => {
      const { showModal, selectedEntity, openAddModal, closeModal } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      openAddModal()
      expect(showModal.value).toBe(true)

      closeModal()

      expect(showModal.value).toBe(false)
      expect(selectedEntity.value).toBeNull()
    })
  })

  describe('handleSave', () => {
    it('calls createFn and shows success toast when no entity is selected', async () => {
      const opts = createDefaultOptions()
      const { openAddModal, handleSave } = useCrudModal<TestPayload, TestEntity>(opts)

      openAddModal()
      await handleSave({ name: 'New' })

      expect(opts.createFn).toHaveBeenCalledWith({ name: 'New' })
      expect(opts.updateFn).not.toHaveBeenCalled()
      expect(opts.showToast).toHaveBeenCalledWith('Item created successfully', 'success')
    })

    it('calls updateFn and shows success toast when entity is selected', async () => {
      const opts = createDefaultOptions()
      const { openEditModal, handleSave } = useCrudModal<TestPayload, TestEntity>(opts)

      openEditModal({ id: '42', name: 'Existing' })
      await handleSave({ name: 'Updated' })

      expect(opts.updateFn).toHaveBeenCalledWith('42', { name: 'Updated' })
      expect(opts.createFn).not.toHaveBeenCalled()
      expect(opts.showToast).toHaveBeenCalledWith('Item updated successfully', 'success')
    })

    it('closes modal after successful save', async () => {
      const { showModal, openAddModal, handleSave } = useCrudModal<TestPayload, TestEntity>(createDefaultOptions())

      openAddModal()
      expect(showModal.value).toBe(true)

      await handleSave({ name: 'New' })

      expect(showModal.value).toBe(false)
    })

    it('calls onSuccess after successful save', async () => {
      const onSuccess = vi.fn()
      const opts = { ...createDefaultOptions(), onSuccess }
      const { openAddModal, handleSave } = useCrudModal<TestPayload, TestEntity>(opts)

      openAddModal()
      await handleSave({ name: 'New' })

      expect(onSuccess).toHaveBeenCalled()
    })

    it('handles errors and calls modalRef.handleError', async () => {
      const opts = createDefaultOptions()
      opts.createFn.mockRejectedValue(new Error('Network error'))

      const { modalRef, openAddModal, handleSave } = useCrudModal<TestPayload, TestEntity>(opts)

      const handleError = vi.fn()
      modalRef.value = { handleError }

      openAddModal()
      await handleSave({ name: 'Bad' })

      expect(handleError).toHaveBeenCalledWith(expect.stringContaining('Network error'))
    })

    it('calls onErrorHandled after error is handled', async () => {
      const onErrorHandled = vi.fn()
      const opts = { ...createDefaultOptions(), onErrorHandled }
      opts.createFn.mockRejectedValue(new Error('fail'))

      const { openAddModal, handleSave } = useCrudModal<TestPayload, TestEntity>(opts)

      openAddModal()
      await handleSave({ name: 'Bad' })

      expect(onErrorHandled).toHaveBeenCalled()
    })
  })
})
