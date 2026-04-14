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
    const droppedEnrollmentId: EntityId = 10
    const sectionId: EntityId = 1
    const refreshedStudents: EnrollmentDto[] = [
      { id: 1, enrollmentId: 10, firstName: 'Ada', lastName: 'Lovelace' },
      { id: 2, enrollmentId: 11, firstName: 'Alan', lastName: 'Turing' },
    ]

    store.sectionStudents = [
      { id: 1, enrollmentId: 10, firstName: 'Stale', lastName: 'Student' },
    ]

    vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue(createAxiosResponse({}))
    vi.mocked(enrollmentsApi.getSectionStudents).mockResolvedValue(createAxiosResponse(refreshedStudents))

    await store.dropStudent(droppedEnrollmentId, sectionId)

    expect(store.sectionStudents).toEqual(refreshedStudents)
  })

  it('dropStudent filters local state only when sectionId is not provided', async () => {
    const store = useEnrollmentStore()
    const droppedEnrollmentId: EntityId = 22

    store.sectionStudents = [
      { id: 1, enrollmentId: 21, firstName: 'Grace', lastName: 'Hopper' },
      { id: 2, enrollmentId: 22, firstName: 'Katherine', lastName: 'Johnson' },
    ]

    vi.mocked(enrollmentsApi.dropStudent).mockResolvedValue(createAxiosResponse({}))

    await store.dropStudent(droppedEnrollmentId)

    expect(store.sectionStudents).toEqual([
      { id: 1, enrollmentId: 21, firstName: 'Grace', lastName: 'Hopper' },
    ])
  })

  it('keeps loading state true while concurrent requests are still pending', async () => {
    const store = useEnrollmentStore()
    const sectionDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getSectionStudents>>>()
    const studentDeferred = createDeferred<Awaited<ReturnType<typeof enrollmentsApi.getStudentEnrollments>>>()

    vi.mocked(enrollmentsApi.getSectionStudents).mockImplementation(() => sectionDeferred.promise)
    vi.mocked(enrollmentsApi.getStudentEnrollments).mockImplementation(() => studentDeferred.promise)

    const sectionRequest = store.fetchSectionStudents(1)
    const studentRequest = store.fetchStudentEnrollments(2)

    expect(store.isLoading).toBe(true)

    sectionDeferred.resolve(createAxiosResponse([{ id: 101, enrollmentId: 901 }]))
    await sectionRequest
    expect(store.isLoading).toBe(true)

    studentDeferred.resolve(createAxiosResponse([{ id: 102, enrollmentId: 902 }]))
    await studentRequest
    expect(store.isLoading).toBe(false)
  })
})
