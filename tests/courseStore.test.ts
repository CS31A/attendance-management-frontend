import type { CourseDto, CoursePayload } from '@/api/courses'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import courseApi from '@/api/courses'
import { useCourseStore } from '@/stores/courseStore'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

vi.mock('@/api/courses')
vi.mock('@/utils/httpError')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

// Helper factory
function createCourse(overrides: Partial<CourseDto> = {}): CourseDto {
  return {
    id: '1' as EntityId,
    name: 'Course 1',
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

describe('courseStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('hasCourses returns false when empty', () => {
      const store = useCourseStore()
      store.courses = []
      expect(store.hasCourses).toBe(false)
    })

    it('hasCourses returns true when courses exist', () => {
      const store = useCourseStore()
      store.courses = [createCourse()]
      expect(store.hasCourses).toBe(true)
    })

    it('sortedCourses returns courses sorted by name', () => {
      const store = useCourseStore()
      store.courses = [
        createCourse({ id: '2' as EntityId, name: 'Zulu' }),
        createCourse({ id: '1' as EntityId, name: 'Alpha' }),
        createCourse({ id: '3' as EntityId, name: 'Bravo' }),
      ]
      expect(store.sortedCourses.map(c => c.name)).toEqual(['Alpha', 'Bravo', 'Zulu'])
    })

    it('sortedCourses returns empty array when courses is empty', () => {
      const store = useCourseStore()
      store.courses = []
      expect(store.sortedCourses).toEqual([])
    })

    it('sortedCourses handles missing names with (name || "")', () => {
      const store = useCourseStore()
      store.courses = [
        createCourse({ id: '1' as EntityId, name: undefined }),
        createCourse({ id: '2' as EntityId, name: 'Beta' }),
      ]
      const sorted = store.sortedCourses
      expect(sorted[0].name).toBeUndefined()
      expect(sorted[1].name).toBe('Beta')
    })

    it('sortedCourses handles empty names safely', () => {
      const store = useCourseStore()
      store.courses = [
        createCourse({ id: '1' as EntityId, name: '' }),
        createCourse({ id: '2' as EntityId, name: 'Beta' }),
      ]
      const sorted = store.sortedCourses
      expect(sorted[0].name).toBe('')
      expect(sorted[1].name).toBe('Beta')
    })
  })

  describe('actions — success paths', () => {
    it('fetchCourses clears error, populates courses, and resets loading', async () => {
      const mockCourses = [createCourse(), createCourse({ id: '2' as EntityId })]
      vi.mocked(courseApi.getAllCourses).mockResolvedValue({ data: mockCourses } as never)

      const store = useCourseStore()
      store.error = 'previous error'

      await store.fetchCourses()

      expect(store.error).toBe('')
      expect(store.courses).toEqual(mockCourses)
      expect(store.loading).toBe(false)
    })

    it('fetchCourse clears error, sets currentCourse, and resets loading', async () => {
      const course = createCourse({ id: '99' as EntityId })
      vi.mocked(courseApi.getCourseById).mockResolvedValue({ data: course } as never)

      const store = useCourseStore()
      store.error = 'previous error'

      await store.fetchCourse('99' as EntityId)

      expect(store.error).toBe('')
      expect(store.currentCourse).toEqual(course)
      expect(store.loading).toBe(false)
    })

    it('createCourse clears error, appends course to courses, and returns created course', async () => {
      const newCourse = createCourse({ id: '2' as EntityId, name: 'New Course' })
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.createCourse>>>()
      vi.mocked(courseApi.createCourse).mockImplementation(() => deferred.promise)

      const store = useCourseStore()
      store.courses = [createCourse()]
      store.error = 'previous error'

      const payload = { name: 'New Course' } as CoursePayload
      const promise = store.createCourse(payload)

      expect(store.loading).toBe(true)
      deferred.resolve({ data: newCourse } as never)
      const result = await promise

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.courses).toHaveLength(2)
      expect(store.courses[1]).toEqual(newCourse)
      expect(result).toEqual(newCourse)
    })

    it('updateCourse clears error, updates matching course in local state, and returns updated course', async () => {
      const existingCourse = createCourse({ id: '1' as EntityId, name: 'Old Name' })
      const updatedCourse = createCourse({ id: '1' as EntityId, name: 'Updated Name' })
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.updateCourse>>>()
      vi.mocked(courseApi.updateCourse).mockImplementation(() => deferred.promise)

      const store = useCourseStore()
      store.courses = [existingCourse]
      store.error = 'previous error'

      const payload = { name: 'Updated Name' } as CoursePayload
      const promise = store.updateCourse('1' as EntityId, payload)

      expect(store.loading).toBe(true)
      deferred.resolve({ data: updatedCourse } as never)
      const result = await promise

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.courses[0]).toEqual(updatedCourse)
      expect(result).toEqual(updatedCourse)
    })

    it('deleteCourse clears error and removes matching course from local state', async () => {
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.deleteCourse>>>()
      vi.mocked(courseApi.deleteCourse).mockImplementation(() => deferred.promise)

      const store = useCourseStore()
      store.courses = [createCourse({ id: '1' as EntityId }), createCourse({ id: '2' as EntityId })]
      store.error = 'previous error'

      const promise = store.deleteCourse('1' as EntityId)

      expect(store.loading).toBe(true)
      deferred.resolve({} as never)
      await promise

      expect(store.error).toBe('')
      expect(store.loading).toBe(false)
      expect(store.courses).toHaveLength(1)
      expect(store.courses[0].id).toBe('2' as EntityId)
    })
  })

  describe('actions — error paths', () => {
    it('fetchCourses sets error using getErrorMessage, does not rethrow, and resets loading', async () => {
      const testError = new Error('Network error')
      vi.mocked(courseApi.getAllCourses).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch courses: Network error')

      const store = useCourseStore()

      await store.fetchCourses()

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to fetch courses')
      expect(store.error).toBe('Failed to fetch courses: Network error')
      expect(store.loading).toBe(false)
    })

    it('fetchCourse sets error using getErrorMessage, does not rethrow, leaves currentCourse unchanged', async () => {
      const testError = new Error('Not found')
      vi.mocked(courseApi.getCourseById).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Course with ID 99 not found')

      const store = useCourseStore()
      store.currentCourse = createCourse({ id: '1' as EntityId })

      await store.fetchCourse('99' as EntityId)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Course with ID 99 not found')
      expect(store.error).toBe('Course with ID 99 not found')
      expect(store.loading).toBe(false)
      expect(store.currentCourse).toEqual(createCourse({ id: '1' as EntityId }))
    })

    it('createCourse sets fallback error from getErrorMessage, overrides with joined validation messages when present, does not mutate courses, and rethrows error', async () => {
      const testError = new Error('Validation failed')
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.createCourse>>>()
      vi.mocked(courseApi.createCourse).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create course')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Name is required', 'Code is required'])

      const store = useCourseStore()
      store.courses = [createCourse()]

      const promise = store.createCourse({ name: 'New' } as CoursePayload)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to create course')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe('Name is required, Code is required')
      expect(store.loading).toBe(false)
      expect(store.courses).toHaveLength(1)
    })

    it('createCourse uses fallback error when no validation errors present', async () => {
      const testError = new Error('Server error')
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.createCourse>>>()
      vi.mocked(courseApi.createCourse).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create course: Server error')
      vi.mocked(getValidationErrorMessages).mockReturnValue([])

      const store = useCourseStore()

      const promise = store.createCourse({ name: 'New' } as CoursePayload)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(store.error).toBe('Failed to create course: Server error')
      expect(store.loading).toBe(false)
    })

    it('updateCourse sets fallback error from getErrorMessage, overrides with joined validation messages when present, does not incorrectly mutate local state, and rethrows error', async () => {
      const testError = new Error('Validation failed')
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.updateCourse>>>()
      vi.mocked(courseApi.updateCourse).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update course')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Name is invalid'])

      const store = useCourseStore()
      const originalCourse = createCourse({ id: '1' as EntityId, name: 'Original' })
      store.courses = [originalCourse]

      const promise = store.updateCourse('1' as EntityId, { name: 'Updated' } as CoursePayload)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to update course')
      expect(getValidationErrorMessages).toHaveBeenCalledWith(testError)
      expect(store.error).toBe('Name is invalid')
      expect(store.loading).toBe(false)
      expect(store.courses[0]).toEqual(originalCourse)
    })

    it('deleteCourse sets error using getErrorMessage, does not remove course, and rethrows error', async () => {
      const testError = new Error('Delete failed')
      const deferred = createDeferred<Awaited<ReturnType<typeof courseApi.deleteCourse>>>()
      vi.mocked(courseApi.deleteCourse).mockImplementation(() => deferred.promise)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to delete course: Delete failed')

      const store = useCourseStore()
      store.courses = [createCourse({ id: '1' as EntityId }), createCourse({ id: '2' as EntityId })]

      const promise = store.deleteCourse('1' as EntityId)

      expect(store.loading).toBe(true)
      deferred.reject(testError)
      await expect(promise).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to delete course')
      expect(store.error).toBe('Failed to delete course: Delete failed')
      expect(store.loading).toBe(false)
      expect(store.courses).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('updateCourse with ID not present in local state returns API response and leaves courses unchanged', async () => {
      const updatedCourse = createCourse({ id: '99' as EntityId, name: 'Updated' })
      vi.mocked(courseApi.updateCourse).mockResolvedValue({ data: updatedCourse } as never)

      const store = useCourseStore()
      const originalCourses = [createCourse({ id: '1' as EntityId })]
      store.courses = [...originalCourses]

      const result = await store.updateCourse('99' as EntityId, { name: 'Updated' } as CoursePayload)

      expect(result).toEqual(updatedCourse)
      expect(store.courses).toEqual(originalCourses)
    })

    it('deleteCourse with ID not present in local state leaves courses unchanged after successful API call', async () => {
      vi.mocked(courseApi.deleteCourse).mockResolvedValue({} as never)

      const store = useCourseStore()
      const originalCourses = [createCourse({ id: '1' as EntityId })]
      store.courses = [...originalCourses]

      await store.deleteCourse('99' as EntityId)

      expect(store.courses).toEqual(originalCourses)
    })

    it('sortedCourses does not mutate original ordering source array unexpectedly', () => {
      const store = useCourseStore()
      const originalCourses = [
        createCourse({ id: '2' as EntityId, name: 'Zulu' }),
        createCourse({ id: '1' as EntityId, name: 'Alpha' }),
      ]
      store.courses = [...originalCourses]

      const sorted = store.sortedCourses

      // Original array should remain unchanged
      expect(store.courses[0].name).toBe('Zulu')
      expect(store.courses[1].name).toBe('Alpha')

      // Sorted array should be different
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Zulu')
    })
  })
})
