import type { HandleErrorableModal } from '@/types/ui'

import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useCrudModal } from '@/composables/useCrudModal'

interface TestEntity {
  id: number
  name: string
}

interface TestPayload {
  name: string
}

function createTestOptions(overrides?: Record<string, unknown>) {
  const entity = ref<TestEntity | null>(null)
  const showModal = ref(false)
  const modalRef = ref<HandleErrorableModal | null>(null)
  const showToast = vi.fn()
  const createFn = vi.fn(async () => ({ id: 1, name: 'Created' }))
  const updateFn = vi.fn(async () => ({ id: 1, name: 'Updated' }))
  const onSuccess = vi.fn()

  return {
    entity,
    showModal,
    modalRef,
    showToast,
    createFn,
    updateFn,
    entityLabel: 'TestEntity',
    onSuccess,
    ...overrides,
  }
}

describe('useCrudModal', () => {
  describe('handleSave', () => {
    it('create path calls createFn, shows success toast, closes modal, clears entity, and runs onSuccess', async () => {
      const options = createTestOptions()
      const { handleSave } = useCrudModal<TestPayload, TestEntity>(options)

      const payload: TestPayload = { name: 'New Entity' }
      await handleSave(payload)

      expect(options.createFn).toHaveBeenCalledWith(payload)
      expect(options.createFn).toHaveBeenCalledTimes(1)
      expect(options.updateFn).not.toHaveBeenCalled()
      expect(options.showToast).toHaveBeenCalledWith('TestEntity created successfully', 'success')
      expect(options.showModal.value).toBe(false)
      expect(options.entity.value).toBeNull()
      expect(options.onSuccess).toHaveBeenCalledTimes(1)
    })

    it('update path calls updateFn(id, payload), shows success toast, closes modal, clears entity, and runs onSuccess', async () => {
      const options = createTestOptions()
      const existingEntity: TestEntity = { id: 5, name: 'Existing' }
      options.entity.value = { ...existingEntity }

      const { handleSave } = useCrudModal<TestPayload, TestEntity>(options)

      const payload: TestPayload = { name: 'Updated Entity' }
      await handleSave(payload)

      expect(options.updateFn).toHaveBeenCalledWith(5, payload)
      expect(options.updateFn).toHaveBeenCalledTimes(1)
      expect(options.createFn).not.toHaveBeenCalled()
      expect(options.showToast).toHaveBeenCalledWith('TestEntity updated successfully', 'success')
      expect(options.showModal.value).toBe(false)
      expect(options.entity.value).toBeNull()
      expect(options.onSuccess).toHaveBeenCalledTimes(1)
    })

    it('failed save calls modalRef.handleError with normalized error message and does not close modal', async () => {
      const handleError = vi.fn()
      const options = createTestOptions()
      options.modalRef.value = { handleError }
      options.showModal.value = true
      options.createFn = vi.fn(async () => {
        throw new Error('Network error')
      })

      const { handleSave } = useCrudModal<TestPayload, TestEntity>(options)

      const payload: TestPayload = { name: 'New Entity' }
      await handleSave(payload)

      expect(options.createFn).toHaveBeenCalled()
      expect(handleError).toHaveBeenCalledWith('Network error')
      expect(options.showToast).not.toHaveBeenCalled()
      expect(options.onSuccess).not.toHaveBeenCalled()
      expect(options.showModal.value).toBe(true)
    })

    it('uses error message from error object when available', async () => {
      const handleError = vi.fn()
      const options = createTestOptions({
        modalRef: { value: { handleError } },
        updateFn: vi.fn(async () => {
          throw new Error('Validation failed')
        }),
      })
      options.entity.value = { id: 1, name: 'Existing' }

      const { handleSave } = useCrudModal<TestPayload, TestEntity>(options)
      await handleSave({ name: 'Updated' })

      expect(handleError).toHaveBeenCalledWith('Validation failed')
    })
  })

  describe('openAddModal', () => {
    it('clears any selected entity and opens the modal', () => {
      const options = createTestOptions()
      options.entity.value = { id: 1, name: 'Existing' }
      options.showModal.value = false

      const { openAddModal } = useCrudModal<TestPayload, TestEntity>(options)
      openAddModal()

      expect(options.entity.value).toBeNull()
      expect(options.showModal.value).toBe(true)
    })

    it('works correctly when no entity was previously selected', () => {
      const options = createTestOptions()
      options.entity.value = null
      options.showModal.value = false

      const { openAddModal } = useCrudModal<TestPayload, TestEntity>(options)
      openAddModal()

      expect(options.entity.value).toBeNull()
      expect(options.showModal.value).toBe(true)
    })
  })

  describe('openEditModal', () => {
    it('clones the entity instead of keeping the original reference', () => {
      const options = createTestOptions()
      const originalEntity: TestEntity = { id: 3, name: 'Original' }
      options.showModal.value = false

      const { openEditModal } = useCrudModal<TestPayload, TestEntity>(options)
      openEditModal(originalEntity)

      expect(options.entity.value).toEqual(originalEntity)
      expect(options.entity.value).not.toBe(originalEntity)
      expect(options.showModal.value).toBe(true)
    })

    it('overwrites any previously selected entity', () => {
      const options = createTestOptions()
      options.entity.value = { id: 1, name: 'Old' }

      const newEntity: TestEntity = { id: 2, name: 'New' }
      const { openEditModal } = useCrudModal<TestPayload, TestEntity>(options)
      openEditModal(newEntity)

      expect(options.entity.value).toEqual(newEntity)
      expect(options.entity.value).not.toBe(newEntity)
    })
  })

  describe('closeModal', () => {
    it('hides the modal and clears selected entity', () => {
      const options = createTestOptions()
      options.entity.value = { id: 1, name: 'Selected' }
      options.showModal.value = true

      const { closeModal } = useCrudModal<TestPayload, TestEntity>(options)
      closeModal()

      expect(options.showModal.value).toBe(false)
      expect(options.entity.value).toBeNull()
    })

    it('remains closed when called on already closed modal', () => {
      const options = createTestOptions()
      options.entity.value = null
      options.showModal.value = false

      const { closeModal } = useCrudModal<TestPayload, TestEntity>(options)
      closeModal()

      expect(options.showModal.value).toBe(false)
      expect(options.entity.value).toBeNull()
    })
  })

  describe('integration scenarios', () => {
    it('full workflow: open add modal → save → open edit modal → save', async () => {
      const options = createTestOptions()
      const { handleSave, openAddModal, openEditModal } = useCrudModal<TestPayload, TestEntity>(options)

      openAddModal()
      expect(options.showModal.value).toBe(true)
      expect(options.entity.value).toBeNull()

      await handleSave({ name: 'New' })
      expect(options.showToast).toHaveBeenCalledWith('TestEntity created successfully', 'success')
      expect(options.showModal.value).toBe(false)
      expect(options.onSuccess).toHaveBeenCalledTimes(1)

      const existingEntity: TestEntity = { id: 10, name: 'Existing' }
      openEditModal(existingEntity)
      expect(options.showModal.value).toBe(true)
      expect(options.entity.value).toEqual(existingEntity)

      await handleSave({ name: 'Updated' })
      expect(options.updateFn).toHaveBeenCalledWith(10, { name: 'Updated' })
      expect(options.showToast).toHaveBeenLastCalledWith('TestEntity updated successfully', 'success')
      expect(options.onSuccess).toHaveBeenCalledTimes(2)
    })

    it('handles modalRef being null gracefully during error', async () => {
      const options = createTestOptions()
      options.modalRef.value = null
      options.showModal.value = true
      options.createFn = vi.fn(async () => {
        throw new Error('Error with null modalRef')
      })
      const { handleSave } = useCrudModal<TestPayload, TestEntity>(options)

      await expect(handleSave({ name: 'Test' })).resolves.not.toThrow()
      expect(options.showModal.value).toBe(true)
    })

    it('handles modalRef.handleError being undefined gracefully during error', async () => {
      const options = createTestOptions()
      options.modalRef.value = {} as HandleErrorableModal
      options.showModal.value = true
      options.createFn = vi.fn(async () => {
        throw new Error('Error with undefined handleError')
      })
      const { handleSave } = useCrudModal<TestPayload, TestEntity>(options)

      await expect(handleSave({ name: 'Test' })).resolves.not.toThrow()
      expect(options.showModal.value).toBe(true)
    })
  })
})
