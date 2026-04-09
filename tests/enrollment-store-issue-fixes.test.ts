import type { EnrollmentDto } from '@/api/enrollments'
import type { EntityId } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import enrollmentsApi from '@/api/enrollments'
import { useEnrollmentStore } from '@/stores/enrollmentStore'

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('enrollment store issue fixes', () => {
  const originalDropStudent = enrollmentsApi.dropStudent
  const originalGetSectionStudents = enrollmentsApi.getSectionStudents
  const originalGetStudentEnrollments = enrollmentsApi.getStudentEnrollments

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    enrollmentsApi.dropStudent = originalDropStudent
    enrollmentsApi.getSectionStudents = originalGetSectionStudents
    enrollmentsApi.getStudentEnrollments = originalGetStudentEnrollments
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

    enrollmentsApi.dropStudent = async () => ({ data: {} } as { data: Record<string, unknown> })
    enrollmentsApi.getSectionStudents = async () => (
      { data: refreshedStudents } as { data: EnrollmentDto[] }
    )

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

    enrollmentsApi.dropStudent = async () => ({ data: {} } as { data: Record<string, unknown> })

    await store.dropStudent(droppedEnrollmentId)

    expect(store.sectionStudents).toEqual([
      { id: 1, enrollmentId: 21, firstName: 'Grace', lastName: 'Hopper' },
    ])
  })

  it('keeps loading state true while concurrent requests are still pending', async () => {
    const store = useEnrollmentStore()
    const sectionDeferred = createDeferred<EnrollmentDto[]>()
    const studentDeferred = createDeferred<EnrollmentDto[]>()

    enrollmentsApi.getSectionStudents = async () => (
      { data: await sectionDeferred.promise } as { data: EnrollmentDto[] }
    )
    enrollmentsApi.getStudentEnrollments = async () => (
      { data: await studentDeferred.promise } as { data: EnrollmentDto[] }
    )

    const sectionRequest = store.fetchSectionStudents(1)
    const studentRequest = store.fetchStudentEnrollments(2)

    expect(store.isLoading).toBe(true)

    sectionDeferred.resolve([{ id: 101, enrollmentId: 901 }])
    await sectionRequest
    expect(store.isLoading).toBe(true)

    studentDeferred.resolve([{ id: 102, enrollmentId: 902 }])
    await studentRequest
    expect(store.isLoading).toBe(false)
  })
})
