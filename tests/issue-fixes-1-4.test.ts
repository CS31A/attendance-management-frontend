import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { EntityId } from '@/types'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'

import api from '@/api'
import { adminGuard, instructorGuard } from '@/router/authGuard'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { ROLES } from '@/utils/constants'

interface MockUser extends Record<string, unknown> {
  userId: EntityId
  role: 'Instructor'
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

describe('issue fixes 1-4', () => {
  it('createUser surfaces 401 errors instead of faking success', async () => {
    setActivePinia(createPinia())
    const userStore = useUserStore()

    const originalPost = api.post
    api.post = (async () => {
      const error = new Error('Unauthorized') as Error & {
        response?: {
          status: number
          data?: { message?: string }
        }
      }
      error.response = {
        status: 401,
        data: { message: 'Session expired' },
      }
      throw error
    }) as typeof api.post

    try {
      const result = await userStore.createUser({
        Username: 'instructor.user',
        FirstName: 'Test',
        LastName: 'Instructor',
        Email: 'instructor@example.com',
        Password: 'Password123!',
        RepeatedPassword: 'Password123!',
        Role: 'Instructor',
        SectionId: undefined,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session expired')
      expect(userStore.users).toEqual([])
    }
    finally {
      api.post = originalPost
    }
  })

  it('createUser preserves server-provided student section id instead of forcing default section 3', async () => {
    setActivePinia(createPinia())
    const userStore = useUserStore()

    const originalPost = api.post
    const capturedPayloads: Array<Record<string, unknown>> = []

    api.post = (async (_url: string, payload?: unknown, _config?: unknown) => {
      capturedPayloads.push(payload as Record<string, unknown>)
      return createAxiosResponse<Record<string, unknown>>({
        userId: '77',
        username: 'student.user',
        email: 'student@example.com',
        role: 'Student',
        studentProfile: {
          id: 88,
          firstname: 'Section',
          lastname: 'Student',
          sectionId: '42',
          isRegular: true,
        },
      })
    }) as typeof api.post

    try {
      const result = await userStore.createUser({
        Username: 'student.user',
        FirstName: 'Section',
        LastName: 'Student',
        Email: 'student@example.com',
        Password: 'Password123!',
        RepeatedPassword: 'Password123!',
        Role: 'Student',
        SectionId: '42',
      })

      expect(result.success).toBe(true)
      expect(capturedPayloads).toHaveLength(1)
      expect(capturedPayloads[0]?.sectionId).toBe('42')
      expect(userStore.users[0]?.sectionId).toBe('42')
    }
    finally {
      api.post = originalPost
    }
  })

  it('updateUser uses the admin profile update endpoint', async () => {
    setActivePinia(createPinia())
    const userStore = useUserStore()
    userStore.users = [{ userId: '1', role: 'Instructor', profileId: '1' }] as unknown as MockUser[]

    let endpoint = ''
    const originalPatch = api.patch
    api.patch = (async (url: string, _data?: unknown, _config?: unknown) => {
      endpoint = url
      return createAxiosResponse({})
    }) as typeof api.patch

    try {
      await userStore.updateUser('1', { firstName: 'Updated' })
      expect(endpoint).toBe('/account/admin/users/1')
    }
    finally {
      api.patch = originalPatch
    }
  })

  it('api sessions does not redeclare SessionStatus type', () => {
    const apiSessionsSource = readFileSync('src/api/sessions.ts', 'utf8')
    expect(apiSessionsSource.includes('export type SessionStatus =')).toBe(false)
  })

  it('roles constants expose INSTRUCTOR canonical value', () => {
    expect(ROLES.INSTRUCTOR).toBe('Instructor')
  })

  it('instructorTableSection no longer dereferences parseUtcDate directly in the template', () => {
    const source = readFileSync('src/components/tables/InstructorTableSection.vue', 'utf8')
    expect(source.includes('parseUtcDate(instructor.createdAt).toLocaleDateString()')).toBe(false)
  })

  it('qRCode utilities expose a shared date-time formatter', () => {
    const source = readFileSync('src/utils/date.ts', 'utf8')
    expect(source.includes('export function formatDateTime(')).toBe(true)
  })

  it('qRCodeListModal uses the shared QR date-time formatter instead of a local helper', () => {
    const source = readFileSync('src/components/qrcode/QRCodeListModal.vue', 'utf8')
    expect(source.includes('function formatDate(dateString)')).toBe(false)
    expect(source.includes('formatDateTime')).toBe(true)
  })

  it('apiUser role union keeps only the legacy compatibility literal', () => {
    const source = readFileSync('src/types/user.ts', 'utf8')
    expect(source.includes('role?: UserRole | \'Teacher\'')).toBe(true)
    expect(source.includes('role?: UserRole | \'Instructor\' | \'Teacher\'')).toBe(false)
  })

  it('mapUserProfile normalizes legacy Teacher role to Instructor', async () => {
    setActivePinia(createPinia())
    const userStore = useUserStore()

    const originalGet = api.get
    api.get = (async (_url: string, _config?: unknown) => createAxiosResponse<Array<Record<string, unknown>>>([
      {
        userId: '1',
        username: 'legacy.teacher',
        email: 'legacy@example.com',
        role: 'Teacher',
        instructorProfile: { id: '10', firstname: 'Legacy', lastname: 'Teacher' },
      },
      {
        userId: '2',
        username: 'new.instructor',
        email: 'new@example.com',
        role: 'Instructor',
        instructorProfile: { id: '20', firstname: 'New', lastname: 'Instructor' },
      },
    ])) as typeof api.get

    try {
      await userStore.fetchUsers()
      // Both 'Teacher' (legacy) and 'Instructor' should be normalized to 'Instructor'
      const legacyUser = userStore.users.find(u => u.userId === '1')
      const newUser = userStore.users.find(u => u.userId === '2')
      expect(legacyUser?.role).toBe('Instructor')
      expect(newUser?.role).toBe('Instructor')
      // Legacy user's profile data should still be mapped correctly
      expect(legacyUser?.firstName).toBe('Legacy')
      expect(legacyUser?.lastName).toBe('Teacher')
    }
    finally {
      api.get = originalGet
    }
  })

  it('userStore fetchUsers no longer contains an artificial 500ms delay', () => {
    const source = readFileSync('src/stores/userStore.ts', 'utf8')
    expect(source.includes('setTimeout(resolve, 500)')).toBe(false)
  })

  it('sessionStore fetchSessions no longer contains an artificial 500ms delay', () => {
    const source = readFileSync('src/stores/sessionStore.ts', 'utf8')
    expect(source.includes('setTimeout(resolve, 500)')).toBe(false)
  })

  it('attendanceStore fetchAllAttendance no longer contains an artificial 500ms delay', () => {
    const source = readFileSync('src/stores/attendanceStore.ts', 'utf8')
    expect(source.includes('setTimeout(resolve, 500)')).toBe(false)
  })

  it('section and course stores no longer contain artificial 500ms delays', () => {
    const sectionSource = readFileSync('src/stores/sectionStore.ts', 'utf8')
    const courseSource = readFileSync('src/stores/courseStore.ts', 'utf8')
    expect(sectionSource.includes('setTimeout(resolve, 500)')).toBe(false)
    expect(courseSource.includes('setTimeout(resolve, 500)')).toBe(false)
  })

  it('userStore keeps loading true while concurrent requests are still pending', async () => {
    setActivePinia(createPinia())
    const userStore = useUserStore()

    let resolveGet!: (value: AxiosResponse<Array<Record<string, unknown>>>) => void
    let resolvePost!: (value: AxiosResponse<Record<string, unknown>>) => void

    const getPromise = new Promise<AxiosResponse<Array<Record<string, unknown>>>>((resolve) => {
      resolveGet = resolve
    })
    const postPromise = new Promise<AxiosResponse<Record<string, unknown>>>((resolve) => {
      resolvePost = resolve
    })

    const originalGet = api.get
    const originalPost = api.post

    api.get = (async (_url: string, _config?: unknown) => await getPromise) as typeof api.get
    api.post = (async (_url: string, _data?: unknown, _config?: unknown) => await postPromise) as typeof api.post

    try {
      const fetchPromise = userStore.fetchUsers()
      const createPromise = userStore.createUser({
        Username: 'pending.user',
        FirstName: 'Pending',
        LastName: 'User',
        Email: 'pending@example.com',
        Password: 'Password123!',
        RepeatedPassword: 'Password123!',
        Role: 'Instructor',
      })

      expect(userStore.loading).toBe(true)

      resolveGet(createAxiosResponse([]))
      await fetchPromise
      expect(userStore.loading).toBe(true)

      resolvePost(createAxiosResponse({
        userId: '99',
        username: 'pending.user',
        email: 'pending@example.com',
        role: 'Instructor',
        instructorProfile: {
          id: 55,
          firstname: 'Pending',
          lastname: 'User',
        },
      }))
      await createPromise
      expect(userStore.loading).toBe(false)
    }
    finally {
      api.get = originalGet
      api.post = originalPost
    }
  })

  it('adminGuard redirects unauthenticated users directly to login with the original destination', async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.isAuthenticated = false
    authStore.userProfile = null
    authStore.isLoading = false
    authStore.checkAuth = vi.fn().mockResolvedValue(false)
    const runAdminGuard = adminGuard.bind(undefined)

    const result = await runAdminGuard(
      { fullPath: '/users' } as never,
      { fullPath: '/' } as never,
      undefined as never,
    )

    expect(result).toEqual({ path: '/login', query: { redirect: '/users' } })
  })

  it('instructorGuard redirects unauthenticated users directly to login with the original destination', async () => {
    setActivePinia(createPinia())
    const authStore = useAuthStore()
    authStore.isAuthenticated = false
    authStore.userProfile = null
    authStore.isLoading = false
    authStore.checkAuth = vi.fn().mockResolvedValue(false)
    const runInstructorGuard = instructorGuard.bind(undefined)

    const result = await runInstructorGuard(
      { fullPath: '/sessions' } as never,
      { fullPath: '/' } as never,
      undefined as never,
    )

    expect(result).toEqual({ path: '/login', query: { redirect: '/sessions' } })
  })
})
