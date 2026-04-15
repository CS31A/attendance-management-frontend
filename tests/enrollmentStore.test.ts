import type { EnrollmentData, EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import enrollmentsApi from '@/api/enrollments'
import { useEnrollmentStore } from '@/stores/enrollmentStore'
import { getErrorMessage } from '@/utils/httpError'

vi.mock('@/api/enrollments')
vi.mock('@/utils/httpError')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

// Helper factory
function createEnrollment(overrides: Partial<EnrollmentDto> = {}): EnrollmentDto {
  return {
    id: '1' as EntityId,
    enrollmentId: '100' as EntityId,
    firstName: 'John',
    lastName: 'Doe',
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

describe('enrollmentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('state and getters', () => {
    it('getSectionStudents reflects state', () => {
      const store = useEnrollmentStore()
      const students = [createEnrollment(), createEnrollment({ id: '2' as EntityId })]
      store.sectionStudents = students
      expect(store.getSectionStudents).toEqual(students)
    })

    it('getStudentEnrollments reflects state', () => {
      const store = useEnrollmentStore()
      const enrollments = [createEnrollment(), createEnrollment({ id: '2' as EntityId })]
      store.studentEnrollments = enrollments
      expect(store.getStudentEnrollments).toEqual(enrollments)
    })

    it('isLoading reflects loading state', () => {
      const store = useEnrollmentStore()
      // Initially not loading
      expect(store.isLoading).toBe(false)
      // Loading is computed from pendingRequests internally
      // We can test this indirectly through async actions
    })

    it('getError reflects error state', () => {
      const store = useEnrollmentStore()
      store.error = 'test error'
      expect(store.getError).toBe('test error')
    })

    it('clearError clears error', () => {
      const store = useEnrollmentStore()
      store.error = 'test error'
      store.clearError()
      expect(store.error).toBe('')
    })

    it('clearSectionStudents empties section list', () => {
      const store = useEnrollmentStore()
      store.sectionStudents = [createEnrollment()]
      store.clearSectionStudents()
      expect(store.sectionStudents).toEqual([])
    })
  })

  describe('actions — success paths', () => {
    it('fetchSectionStudents stores API data and returns it', async () => {
      const mockStudents = [createEnrollment(), createEnrollment({ id: '2' as EntityId })]
      vi.mocked(enrollmentsApi.getSectionStudents).mockResolvedValue({ data: mockStudents } as never)

      const store = useEnrollmentStore()
      store.error = 'previous error'

      const result = await store.fetchSectionStudents('1' as EntityId)

      expect(store.error).toBe('')
      expect(store.sectionStudents).toEqual(mockStudents)
      expect(result).toEqual(mockStudents)
      expect(store.loading).toBe(false)
    })

    it('fetchStudentEnrollments stores API data and returns it', async () => {
      const mockEnrollments = [createEnrollment(), createEnrollment({ id: '2' as EntityId })]
      vi.mocked(enrollmentsApi.getStudentEnrollments).mockResolvedValue({ data: mockEnrollments } as never)

      const store = useEnrollmentStore()
      store.error = 'previous error'

      const result = await store.fetchStudentEnrollments('1' as EntityId)

      expect(store.error).toBe('')
      expect(store.studentEnrollments).toEqual(mockEnrollments)
      expect(result).toEqual(mockEnrollments)
      expect(store.loading).toBe(false)
    })

    it('enrollStudent returns created enrollment', async () => {
      const newEnrollment = createEnrollment({ id: '2' as EntityId })
      const enrollmentData: EnrollmentData = {
        studentId: '1' as EntityId,
        sectionId: '1' as EntityId,
        subjectId: '1' as EntityId,
        enrollmentType: 'Regular',
      }
      vi.mocked(enrollmentsApi.enrollStudent).mockResolvedValue({ data: newEnrollment } as never)

      const store = useEnrollmentStore()
      store.error = 'previous error'

      const result = await store.enrollStudent(enrollmentData)

      expect(store.error).toBe('')
      expect(result).toEqual(newEnrollment)
      expect(store.loading).toBe(false)
    })

    it('enrollStudent refreshes section students only when sectionId exists and section data is already loaded', async () => {
      const newEnrollment = createEnrollment({ id: '2' as EntityId })
      const enrollmentData: EnrollmentData = {
        studentId: '1' as EntityId,
        sectionId: '1' as EntityId,
        subjectId: '1' as EntityId,
        enrollmentType: 'Regular',
      }
      const refreshedStudents = [createEnrollment({ id: '3' as EntityId })]
      vi.mocked(enrollmentsApi.enrollStudent).mockResolvedValue({ data: newEnrollment } as never)
      vi.mocked(enrollmentsApi.getSectionStudents).mockResolvedValue({ data: refreshedStudents } as never)

      const store = useEnrollmentStore()
      store.sectionStudents = [createEnrollment()] // Section data already loaded

      await store.enrollStudent(enrollmentData)

      expect(enrollmentsApi.getSectionStudents).toHaveBeenCalledWith('1' as EntityId)
      expect(store.sectionStudents).toEqual(refreshedStudents)
    })

    it('enrollStudent does not refresh section students when section data is empty', async () => {
      const newEnrollment = createEnrollment({ id: '2' as EntityId })
      const enrollmentData: EnrollmentData = {
        studentId: '1' as EntityId,
        sectionId: '1' as EntityId,
        subjectId: '1' as EntityId,
        enrollmentType: 'Regular',
      }
      vi.mocked(enrollmentsApi.enrollStudent).mockResolvedValue({ data: newEnrollment } as never)

      const store = useEnrollmentStore()
      store.sectionStudents = [] // Section data not loaded

      await store.enrollStudent(enrollmentData)

      expect(enrollmentsApi.getSectionStudents).not.toHaveBeenCalled()
    })

    it('dropStudent refreshes from API when sectionId is passed', async () => {
      const refreshedStudents = [createEnrollment({ id: '3' as EntityId })]
      vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue({} as never)
      vi.mocked(enrollmentsApi.getSectionStudents).mockResolvedValue({ data: refreshedStudents } as never)

      const store = useEnrollmentStore()
      store.sectionStudents = [createEnrollment()]

      await store.dropStudent('100' as EntityId, '1' as EntityId)

      expect(enrollmentsApi.getSectionStudents).toHaveBeenCalledWith('1' as EntityId)
      expect(store.sectionStudents).toEqual(refreshedStudents)
    })

    it('dropStudent filters local state when sectionId is omitted', async () => {
      vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue({} as never)

      const store = useEnrollmentStore()
      store.sectionStudents = [
        createEnrollment({ enrollmentId: '100' as EntityId }),
        createEnrollment({ enrollmentId: '200' as EntityId }),
      ]

      await store.dropStudent('100' as EntityId)

      expect(enrollmentsApi.getSectionStudents).not.toHaveBeenCalled()
      expect(store.sectionStudents).toHaveLength(1)
      expect(store.sectionStudents[0].enrollmentId).toBe('200' as EntityId)
    })

    it('reenrollStudent returns API data and refreshes when sectionId is passed', async () => {
      const reenrolledData = { success: true }
      const refreshedStudents = [createEnrollment({ id: '3' as EntityId })]
      vi.mocked(enrollmentsApi.reenrollStudent).mockResolvedValue({ data: reenrolledData } as never)
      vi.mocked(enrollmentsApi.getSectionStudents).mockResolvedValue({ data: refreshedStudents } as never)

      const store = useEnrollmentStore()

      const result = await store.reenrollStudent('100' as EntityId, '1' as EntityId)

      expect(enrollmentsApi.getSectionStudents).toHaveBeenCalledWith('1' as EntityId)
      expect(result).toEqual(reenrolledData)
      expect(store.sectionStudents).toEqual(refreshedStudents)
    })

    it('checkEnrollment forwards payload and returns API result', async () => {
      const checkResult = { enrolled: true }
      vi.mocked(enrollmentsApi.checkEnrollment).mockResolvedValue({ data: checkResult } as never)

      const store = useEnrollmentStore()

      const result = await store.checkEnrollment('1' as EntityId, '2' as EntityId, '3' as EntityId)

      expect(enrollmentsApi.checkEnrollment).toHaveBeenCalledWith({
        studentId: '1' as EntityId,
        sectionId: '2' as EntityId,
        subjectId: '3' as EntityId,
      })
      expect(result).toEqual(checkResult)
    })

    it('concurrent requests keep isLoading === true until all settle', async () => {
      const sectionDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getSectionStudents>>>()
      const studentDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getStudentEnrollments>>>()

      vi.mocked(enrollmentsApi.getSectionStudents).mockImplementation(() => sectionDeferred.promise)
      vi.mocked(enrollmentsApi.getStudentEnrollments).mockImplementation(() => studentDeferred.promise)

      const store = useEnrollmentStore()

      const sectionRequest = store.fetchSectionStudents('1' as EntityId)
      const studentRequest = store.fetchStudentEnrollments('2' as EntityId)

      expect(store.isLoading).toBe(true)

      sectionDeferred.resolve({ data: [createEnrollment()] } as never)
      await sectionRequest
      expect(store.isLoading).toBe(true)

      studentDeferred.resolve({ data: [createEnrollment()] } as never)
      await studentRequest
      expect(store.isLoading).toBe(false)
    })
  })

  describe('actions — error paths', () => {
    it('fetchSectionStudents sets error via getErrorMessage, rethrows, and resets loading', async () => {
      const testError = new Error('Network error')
      vi.mocked(enrollmentsApi.getSectionStudents).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch section students: Network error')

      const store = useEnrollmentStore()

      await expect(store.fetchSectionStudents('1' as EntityId)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to fetch section students')
      expect(store.error).toBe('Failed to fetch section students: Network error')
      expect(store.loading).toBe(false)
    })

    it('fetchStudentEnrollments sets error via getErrorMessage, rethrows, and resets loading', async () => {
      const testError = new Error('Network error')
      vi.mocked(enrollmentsApi.getStudentEnrollments).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch student enrollments: Network error')

      const store = useEnrollmentStore()

      await expect(store.fetchStudentEnrollments('1' as EntityId)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to fetch student enrollments')
      expect(store.error).toBe('Failed to fetch student enrollments: Network error')
      expect(store.loading).toBe(false)
    })

    it('enrollStudent sets error via getErrorMessage, rethrows, and resets loading', async () => {
      const testError = new Error('Enrollment failed')
      vi.mocked(enrollmentsApi.enrollStudent).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to enroll student: Enrollment failed')

      const store = useEnrollmentStore()

      const enrollmentData: EnrollmentData = {
        studentId: '1' as EntityId,
        sectionId: '1' as EntityId,
        subjectId: '1' as EntityId,
        enrollmentType: 'Regular',
      }

      await expect(store.enrollStudent(enrollmentData)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to enroll student')
      expect(store.error).toBe('Failed to enroll student: Enrollment failed')
      expect(store.loading).toBe(false)
    })

    it('dropStudent sets error via getErrorMessage, rethrows, and resets loading', async () => {
      const testError = new Error('Drop failed')
      vi.mocked(enrollmentsApi.dropStudent).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to drop student: Drop failed')

      const store = useEnrollmentStore()

      await expect(store.dropStudent('100' as EntityId)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to drop student')
      expect(store.error).toBe('Failed to drop student: Drop failed')
      expect(store.loading).toBe(false)
    })

    it('reenrollStudent sets error via getErrorMessage, rethrows, and resets loading', async () => {
      const testError = new Error('Reenroll failed')
      vi.mocked(enrollmentsApi.reenrollStudent).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to re-enroll student: Reenroll failed')

      const store = useEnrollmentStore()

      await expect(store.reenrollStudent('100' as EntityId)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to re-enroll student')
      expect(store.error).toBe('Failed to re-enroll student: Reenroll failed')
      expect(store.loading).toBe(false)
    })

    it('checkEnrollment sets error via getErrorMessage, rethrows, and resets loading', async () => {
      const testError = new Error('Check failed')
      vi.mocked(enrollmentsApi.checkEnrollment).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to check enrollment: Check failed')

      const store = useEnrollmentStore()

      await expect(store.checkEnrollment('1' as EntityId, '2' as EntityId, '3' as EntityId)).rejects.toThrow(testError)

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Failed to check enrollment')
      expect(store.error).toBe('Failed to check enrollment: Check failed')
      expect(store.loading).toBe(false)
    })

    it('failed refresh after successful enrollStudent is surfaced correctly', async () => {
      const newEnrollment = createEnrollment({ id: '2' as EntityId })
      const enrollmentData: EnrollmentData = {
        studentId: '1' as EntityId,
        sectionId: '1' as EntityId,
        subjectId: '1' as EntityId,
        enrollmentType: 'Regular',
      }
      const refreshError = new Error('Refresh failed')
      vi.mocked(enrollmentsApi.enrollStudent).mockResolvedValue({ data: newEnrollment } as never)
      vi.mocked(enrollmentsApi.getSectionStudents).mockRejectedValue(refreshError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch section students: Refresh failed')

      const store = useEnrollmentStore()
      store.sectionStudents = [createEnrollment()]

      await expect(store.enrollStudent(enrollmentData)).rejects.toThrow(refreshError)

      expect(store.error).toBe('Failed to fetch section students: Refresh failed')
      expect(store.loading).toBe(false)
    })

    it('failed refresh after successful reenrollStudent is surfaced correctly', async () => {
      const reenrolledData = { success: true }
      const refreshError = new Error('Refresh failed')
      vi.mocked(enrollmentsApi.reenrollStudent).mockResolvedValue({ data: reenrolledData } as never)
      vi.mocked(enrollmentsApi.getSectionStudents).mockRejectedValue(refreshError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to fetch section students: Refresh failed')

      const store = useEnrollmentStore()

      await expect(store.reenrollStudent('100' as EntityId, '1' as EntityId)).rejects.toThrow(refreshError)

      expect(store.error).toBe('Failed to fetch section students: Refresh failed')
      expect(store.loading).toBe(false)
    })

    it('failed dropStudent does not remove local student state when filtering locally', async () => {
      const testError = new Error('Drop failed')
      vi.mocked(enrollmentsApi.dropStudent).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to drop student: Drop failed')

      const store = useEnrollmentStore()
      const originalStudents = [
        createEnrollment({ enrollmentId: '100' as EntityId }),
        createEnrollment({ enrollmentId: '200' as EntityId }),
      ]
      store.sectionStudents = [...originalStudents]

      await expect(store.dropStudent('100' as EntityId)).rejects.toThrow(testError)

      expect(store.sectionStudents).toEqual(originalStudents)
      expect(store.loading).toBe(false)
    })
  })
})
