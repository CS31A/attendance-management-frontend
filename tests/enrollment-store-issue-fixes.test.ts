import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import enrollmentsApi from '@/api/enrollments'
import { useEnrollmentStore } from '@/stores/enrollmentStore'

vi.mock('@/api/enrollments')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  }
}

describe('enrollment store issue fixes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('dropStudent keeps API-refreshed section students when sectionId is provided', async () => {
    const store = useEnrollmentStore()
    const droppedEnrollmentId: EntityId = '10'
    const sectionId: EntityId = '1'
    const refreshedStudents: EnrollmentDto[] = [
      { id: '1', enrollmentId: '10', firstName: 'Ada', lastName: 'Lovelace' },
      { id: '2', enrollmentId: '11', firstName: 'Alan', lastName: 'Turing' },
    ]

    store.sectionStudents = [
      { id: '1', enrollmentId: '10', firstName: 'Stale', lastName: 'Student' },
    ]

    vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue(createAxiosResponse({}))
    vi.mocked(enrollmentsApi.getSectionStudents).mockResolvedValue(createAxiosResponse(refreshedStudents))

    await store.dropStudent(droppedEnrollmentId, sectionId)

    expect(store.sectionStudents).toEqual(refreshedStudents)
  })

  it('dropStudent filters local state only when sectionId is not provided', async () => {
    const store = useEnrollmentStore()
    const droppedEnrollmentId: EntityId = '22'

    store.sectionStudents = [
      { id: '1', enrollmentId: '21', firstName: 'Grace', lastName: 'Hopper' },
      { id: '2', enrollmentId: '22', firstName: 'Katherine', lastName: 'Johnson' },
    ]

    vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue(createAxiosResponse({}))

    await store.dropStudent(droppedEnrollmentId)

    expect(store.sectionStudents).toEqual([
      { id: '1', enrollmentId: '21', firstName: 'Grace', lastName: 'Hopper' },
    ])
  })

  it('keeps loading state true while concurrent requests are still pending', async () => {
    const store = useEnrollmentStore()
    const sectionDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getSectionStudents>>>()
    const studentDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getStudentEnrollments>>>()

    vi.mocked(enrollmentsApi.getSectionStudents).mockImplementation(() => sectionDeferred.promise)
    vi.mocked(enrollmentsApi.getStudentEnrollments).mockImplementation(() => studentDeferred.promise)

    const sectionRequest = store.fetchSectionStudents('1')
    const studentRequest = store.fetchStudentEnrollments('2')

    expect(store.isLoading).toBe(true)

    sectionDeferred.resolve(createAxiosResponse([{ id: '101', enrollmentId: '901' }]))
    await sectionRequest
    expect(store.isLoading).toBe(true)

    studentDeferred.resolve(createAxiosResponse({
      studentId: '2',
      enrollments: [{ id: '102', enrollmentId: '902' }],
    }))
    await studentRequest
    expect(store.isLoading).toBe(false)
  })

  describe('error paths', () => {
    it('dropStudent with sectionId preserves local state on API failure', async () => {
      const store = useEnrollmentStore()
      const droppedEnrollmentId: EntityId = '10'
      const sectionId: EntityId = '1'
      const apiError = new Error('Drop failed')

      const originalStudents = [
        { id: '1', enrollmentId: '10', firstName: 'Ada', lastName: 'Lovelace' },
        { id: '2', enrollmentId: '11', firstName: 'Alan', lastName: 'Turing' },
      ]
      store.sectionStudents = [...originalStudents]

      vi.mocked(enrollmentsApi.dropStudent).mockRejectedValue(apiError)

      await expect(store.dropStudent(droppedEnrollmentId, sectionId)).rejects.toThrow('Drop failed')

      expect(store.sectionStudents).toEqual(originalStudents)
    })

    it('dropStudent without sectionId preserves local state on API failure', async () => {
      const store = useEnrollmentStore()
      const droppedEnrollmentId: EntityId = '22'
      const apiError = new Error('Drop failed')

      const originalStudents = [
        { id: '1', enrollmentId: '21', firstName: 'Grace', lastName: 'Hopper' },
        { id: '2', enrollmentId: '22', firstName: 'Katherine', lastName: 'Johnson' },
      ]
      store.sectionStudents = [...originalStudents]

      vi.mocked(enrollmentsApi.dropStudent).mockRejectedValue(apiError)

      await expect(store.dropStudent(droppedEnrollmentId)).rejects.toThrow('Drop failed')

      expect(store.sectionStudents).toEqual(originalStudents)
    })

    it('dropStudent with sectionId preserves local state when refresh API fails', async () => {
      const store = useEnrollmentStore()
      const droppedEnrollmentId: EntityId = '10'
      const sectionId: EntityId = '1'
      const refreshError = new Error('Refresh failed')

      const originalStudents = [
        { id: '1', enrollmentId: '10', firstName: 'Ada', lastName: 'Lovelace' },
      ]
      store.sectionStudents = [...originalStudents]

      vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue(createAxiosResponse({}))
      vi.mocked(enrollmentsApi.getSectionStudents).mockRejectedValue(refreshError)

      await expect(store.dropStudent(droppedEnrollmentId, sectionId)).rejects.toThrow('Refresh failed')

      expect(store.sectionStudents).toEqual(originalStudents)
    })

    it('fetchSectionStudents resets loading and sets error on API failure', async () => {
      const store = useEnrollmentStore()
      const apiError = new Error('Fetch failed')

      vi.mocked(enrollmentsApi.getSectionStudents).mockRejectedValue(apiError)

      await expect(store.fetchSectionStudents('1')).rejects.toThrow('Fetch failed')

      expect(store.loading).toBe(false)
    })

    it('fetchStudentEnrollments resets loading and sets error on API failure', async () => {
      const store = useEnrollmentStore()
      const apiError = new Error('Fetch failed')

      vi.mocked(enrollmentsApi.getStudentEnrollments).mockRejectedValue(apiError)

      await expect(store.fetchStudentEnrollments('1')).rejects.toThrow('Fetch failed')

      expect(store.loading).toBe(false)
    })

    it('concurrent requests reset loading when one fails', async () => {
      const store = useEnrollmentStore()
      const sectionDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getSectionStudents>>>()
      const studentDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getStudentEnrollments>>>()

      vi.mocked(enrollmentsApi.getSectionStudents).mockImplementation(() => sectionDeferred.promise)
      vi.mocked(enrollmentsApi.getStudentEnrollments).mockImplementation(() => studentDeferred.promise)

      const sectionRequest = store.fetchSectionStudents('1')
      const studentRequest = store.fetchStudentEnrollments('2')

      expect(store.isLoading).toBe(true)

      sectionDeferred.reject(new Error('Section fetch failed'))

      await expect(sectionRequest).rejects.toThrow('Section fetch failed')
      expect(store.isLoading).toBe(true)

      studentDeferred.resolve(createAxiosResponse({
        studentId: '2',
        enrollments: [{ id: '102', enrollmentId: '902' }],
      }))
      await studentRequest
      expect(store.isLoading).toBe(false)
    })
  })
})
