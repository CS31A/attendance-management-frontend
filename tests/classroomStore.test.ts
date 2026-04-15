import type { ClassroomDto, ClassroomPayload } from '@/api/classrooms'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import classroomApi from '@/api/classrooms'
import { useClassroomStore } from '@/stores/classroomStore'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

vi.mock('@/api/classrooms')
vi.mock('@/utils/httpError')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

// Helper factory
function createClassroom(overrides: Partial<ClassroomDto> = {}): ClassroomDto {
  return {
    id: '1' as EntityId,
    name: 'Classroom 1',
    ...overrides,
  }
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  let reject!: Deferred<T>['reject']

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('classroomStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('hasClassrooms returns false when empty', () => {
      const store = useClassroomStore()
      store.classrooms = []
      expect(store.hasClassrooms).toBe(false)
    })

    it('hasClassrooms returns true when classrooms exist', () => {
      const store = useClassroomStore()
      store.classrooms = [createClassroom()]
      expect(store.hasClassrooms).toBe(true)
    })

    it('sortedClassrooms returns classrooms sorted by name', () => {
      const store = useClassroomStore()
      store.classrooms = [
        createClassroom({ id: '2' as EntityId, name: 'Zulu' }),
        createClassroom({ id: '1' as EntityId, name: 'Alpha' }),
        createClassroom({ id: '3' as EntityId, name: 'Bravo' }),
      ]
      expect(store.sortedClassrooms.map(c => c.name)).toEqual(['Alpha', 'Bravo', 'Zulu'])
    })

    it('sortedClassrooms returns empty array when classrooms is empty', () => {
      const store = useClassroomStore()
      store.classrooms = []
      expect(store.sortedClassrooms).toEqual([])
    })

    it('sortedClassrooms handles missing names with (name || "")', () => {
      const store = useClassroomStore()
      store.classrooms = [
        createClassroom({ id: '1' as EntityId, name: undefined }),
        createClassroom({ id: '2' as EntityId, name: 'Beta' }),
      ]
      const sorted = store.sortedClassrooms
      expect(sorted[0].name).toBeUndefined()
      expect(sorted[1].name).toBe('Beta')
    })

    it('sortedClassrooms handles empty names safely', () => {
      const store = useClassroomStore()
      store.classrooms = [
        createClassroom({ id: '1' as EntityId, name: '' }),
        createClassroom({ id: '2' as EntityId, name: 'Beta' }),
      ]
      const sorted = store.sortedClassrooms
      expect(sorted[0].name).toBe('')
      expect(sorted[1].name).toBe('Beta')
    })

    it('sortedClassrooms does not mutate source array', () => {
      const store = useClassroomStore()
      const originalClassrooms = [
        createClassroom({ id: '2' as EntityId, name: 'Zulu' }),
        createClassroom({ id: '1' as EntityId, name: 'Alpha' }),
      ]
      store.classrooms = [...originalClassrooms]

      const sorted = store.sortedClassrooms

      // Original array should remain unchanged
      expect(store.classrooms[0].name).toBe('Zulu')
      expect(store.classrooms[1].name).toBe('Alpha')

      // Sorted array should be different
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Zulu')
    })
  })

  describe('actions — success paths', () => {
    it('fetchClassrooms clears error, populates classrooms, and resets loading', async () => {
      const mockClassrooms = [createClassroom(), createClassroom({ id: '2' as EntityId })]
      vi.mocked(classroomApi.getAllClassrooms).mockResolvedValue({ data: mockClassrooms } as never)

      const store = useClassroomStore()
      store.error = 'previous error'

      await store.fetchClassrooms()

      expect(store.error).toBe('')
      expect(store.classrooms).toEqual(mockClassrooms)
      expect(store.loading).toBe(false)
    })

    it('fetchClassroom clears error, sets currentClassroom, and resets loading', async () => {
      const classroom = createClassroom({ id: '99' as EntityId })
      vi.mocked(classroomApi.getClassroomById).mockResolvedValue({ data: classroom } as never)

      const store = useClassroomStore()
      store.error = 'previous error'

      await store.fetchClassroom('99' as EntityId)

      expect(store.error).toBe('')
      expect(store.currentClassroom).toEqual(classroom)
      expect(store.loading).toBe(false)
    })

    it('createClassroom clears error, appends classroom to classrooms, and returns created classroom', async () => {
      const newClassroom = createClassroom({ id: '2' as EntityId, name: 'New Classroom' })
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.createClassroom>>>()
      vi.mocked(classroomApi.createClassroom).mockImplementation(() => deferred.promise)

      const store = useClassroomStore()
      store.classrooms = [createClassroom()]
      store.error = 'previous error'

      const payload = { name: 'New Classroom' } as ClassroomPayload
      const promise = store.createClassroom(payload)

      expect(store.loading).toBe(true)
      deferred.resolve({ data: newClassroom } as never)
      const result = await promise

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.classrooms).toHaveLength(2)
      expect(store.classrooms[1]).toEqual(newClassroom)
      expect(result).toEqual(newClassroom)
    })

    it('updateClassroom clears error, updates matching classroom in local state, and returns updated classroom', async () => {
      const existingClassroom = createClassroom({ id: '1' as EntityId, name: 'Old Name' })
      const updatedClassroom = createClassroom({ id: '1' as EntityId, name: 'Updated Name' })
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.updateClassroom>>>()
      vi.mocked(classroomApi.updateClassroom).mockImplementation(() => deferred.promise)

      const store = useClassroomStore()
      store.classrooms = [existingClassroom]
      store.error = 'previous error'

      const payload = { name: 'Updated Name' } as ClassroomPayload
      const promise = store.updateClassroom('1' as EntityId, payload)

      expect(store.loading).toBe(true)
      deferred.resolve({ data: updatedClassroom } as never)
      const result = await promise

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.classrooms[0]).toEqual(updatedClassroom)
      expect(result).toEqual(updatedClassroom)
    })

    it('deleteClassroom clears error and removes matching classroom from local state', async () => {
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.deleteClassroom>>>()
      vi.mocked(classroomApi.deleteClassroom).mockImplementation(() => deferred.promise)

      const store = useClassroomStore()
      store.classrooms = [createClassroom({ id: '1' as EntityId }), createClassroom({ id: '2' as EntityId })]
      store.error = 'previous error'

      const promise = store.deleteClassroom('1' as EntityId)

      expect(store.loading).toBe(true)
      deferred.resolve({} as never)
      await promise

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.classrooms).toHaveLength(1)
      expect(store.classrooms[0].id).toBe('2' as EntityId)
    })
  })

  describe('actions — error paths', () => {
    it('fetchClassrooms sets error using getErrorMessage, does not throw, and resets loading', async () => {
      const testError = new Error('Network error')
      vi.mocked(classroomApi.getAllClassrooms).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch classrooms: Network error')

      const store = useClassroomStore()

      await store.fetchClassrooms()

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to fetch classrooms')
      expect(store.error).toBe('Failed to fetch classrooms: Network error')
      expect(store.loading).toBe(false)
    })

    it('fetchClassroom sets error using getErrorMessage, does not throw, leaves currentClassroom unchanged', async () => {
      const testError = new Error('Not found')
      vi.mocked(classroomApi.getClassroomById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Classroom with ID 99 not found')

      const store = useClassroomStore()
      store.currentClassroom = createClassroom({ id: '1' as EntityId })

      await store.fetchClassroom('99' as EntityId)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Classroom with ID 99 not found')
      expect(store.error).toBe('Classroom with ID 99 not found')
      expect(store.loading).toBe(false)
      expect(store.currentClassroom).toEqual(createClassroom({ id: '1' as EntityId }))
    })

    it('createClassroom sets fallback error from getErrorMessage, overrides with joined validation messages when present, does not mutate classrooms, and rethrows error', async () => {
      const testError = new Error('Validation failed')
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.createClassroom>>>()
      vi.mocked(classroomApi.createClassroom).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create classroom')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Name is required', 'Code is required'])

      const store = useClassroomStore()
      store.classrooms = [createClassroom()]

      const promise = store.createClassroom({ name: 'New' } as ClassroomPayload)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to create classroom')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe('Name is required, Code is required')
      expect(store.loading).toBe(false)
      expect(store.classrooms).toHaveLength(1)
    })

    it('createClassroom uses fallback error when no validation errors present', async () => {
      const testError = new Error('Server error')
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.createClassroom>>>()
      vi.mocked(classroomApi.createClassroom).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create classroom: Server error')
      vi.mocked(getValidationErrorMessages).mockReturnValue([])

      const store = useClassroomStore()

      const promise = store.createClassroom({ name: 'New' } as ClassroomPayload)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(store.error).toBe('Failed to create classroom: Server error')
      expect(store.loading).toBe(false)
    })

    it('updateClassroom sets fallback error from getErrorMessage, overrides with joined validation messages when present, preserves original classroom on failure, and rethrows error', async () => {
      const testError = new Error('Validation failed')
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.updateClassroom>>>()
      vi.mocked(classroomApi.updateClassroom).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update classroom')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Name is invalid'])

      const store = useClassroomStore()
      const originalClassroom = createClassroom({ id: '1' as EntityId, name: 'Original' })
      store.classrooms = [originalClassroom]

      const promise = store.updateClassroom('1' as EntityId, { name: 'Updated' } as ClassroomPayload)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to update classroom')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe('Name is invalid')
      expect(store.loading).toBe(false)
      expect(store.classrooms[0]).toEqual(originalClassroom)
    })

    it('deleteClassroom sets error using getErrorMessage, does not remove classroom, and rethrows error', async () => {
      const testError = new Error('Delete failed')
      const deferred = createDeferred<Awaited<ReturnType<typeof classroomApi.deleteClassroom>>>()
      vi.mocked(classroomApi.deleteClassroom).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to delete classroom: Delete failed')

      const store = useClassroomStore()
      store.classrooms = [createClassroom({ id: '1' as EntityId }), createClassroom({ id: '2' as EntityId })]
      store.error = 'previous error'

      const promise = store.deleteClassroom('1' as EntityId)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to delete classroom')
      expect(store.error).toBe('Failed to delete classroom: Delete failed')
      expect(store.loading).toBe(false)
      expect(store.classrooms).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('updateClassroom with ID not present in local state returns API response and leaves classrooms unchanged', async () => {
      const updatedClassroom = createClassroom({ id: '99' as EntityId, name: 'Updated' })
      vi.mocked(classroomApi.updateClassroom).mockResolvedValue({ data: updatedClassroom } as never)

      const store = useClassroomStore()
      const originalClassrooms = [createClassroom({ id: '1' as EntityId })]
      store.classrooms = [...originalClassrooms]

      const result = await store.updateClassroom('99' as EntityId, { name: 'Updated' } as ClassroomPayload)

      expect(result).toEqual(updatedClassroom)
      expect(store.classrooms).toEqual(originalClassrooms)
    })

    it('deleteClassroom with ID not present in local state leaves classrooms unchanged after successful API call', async () => {
      vi.mocked(classroomApi.deleteClassroom).mockResolvedValue({} as never)

      const store = useClassroomStore()
      const originalClassrooms = [createClassroom({ id: '1' as EntityId })]
      store.classrooms = [...originalClassrooms]

      await store.deleteClassroom('99' as EntityId)

      expect(store.classrooms).toEqual(originalClassrooms)
    })
  })
})
