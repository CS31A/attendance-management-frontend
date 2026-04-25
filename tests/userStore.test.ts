import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import { useUserStore } from '@/stores/userStore'
import { ROLES } from '@/utils/constants'
import { getErrorMessage, getValidationErrorMessages } from '@/utils/httpError'

vi.mock('@/api')
vi.mock('@/utils/httpError')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
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

interface ApiUserProfile {
  id?: EntityId
  firstname?: string
  lastname?: string
  department?: string | null
  sectionId?: EntityId | null
  isRegular?: boolean
}

interface ApiUser {
  userId?: EntityId
  id?: EntityId
  username?: string
  email?: string
  role?: 'Admin' | 'Instructor' | 'Student' | 'Teacher'
  createdAt?: string
  updatedAt?: string
  isDeleted?: boolean
  firstName?: string
  lastName?: string
  profileId?: EntityId
  department?: string | null
  sectionId?: EntityId | null
  isRegular?: boolean
  adminProfile?: ApiUserProfile | null
  instructorProfile?: ApiUserProfile | null
  studentProfile?: ApiUserProfile | null
  deletedAt?: string | null
  [key: string]: unknown
}

interface CreateUserInput {
  Username: string
  FirstName: string
  LastName: string
  Email: string
  Password: string
  RepeatedPassword: string
  Role: 'Admin' | 'Instructor' | 'Student'
  SectionId?: string
}

function createMockApiUser(overrides: Partial<ApiUser> = {}): ApiUser {
  return {
    userId: '1' as EntityId,
    username: 'testuser',
    email: 'test@example.com',
    role: ROLES.INSTRUCTOR,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    ...overrides,
  }
}

function createMockApiUserProfile(overrides: Partial<ApiUserProfile> = {}): ApiUserProfile {
  return {
    id: '1' as EntityId,
    firstname: 'John',
    lastname: 'Doe',
    sectionId: null,
    isRegular: false,
    ...overrides,
  }
}

describe('userStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('fetchUsers', () => {
    it('maps nested adminProfile, instructorProfile, and studentProfile into flat user objects', async () => {
      const mockUsers = [
        {
          userId: '1' as EntityId,
          username: 'admin',
          email: 'admin@example.com',
          role: ROLES.ADMIN,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminProfile: createMockApiUserProfile({ firstname: 'Admin', lastname: 'User' }),
        },
        {
          userId: '2' as EntityId,
          username: 'instructor',
          email: 'instructor@example.com',
          role: ROLES.INSTRUCTOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructorProfile: createMockApiUserProfile({ firstname: 'Instructor', lastname: 'User' }),
        },
        {
          userId: '3' as EntityId,
          username: 'student',
          email: 'student@example.com',
          role: ROLES.STUDENT,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentProfile: createMockApiUserProfile({ firstname: 'Student', lastname: 'User', sectionId: '1' as EntityId, isRegular: true }),
        },
      ]
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockUsers) as never)

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.users[0].firstName).toBe('Admin')
      expect(store.users[0].lastName).toBe('User')
      expect(store.users[1].firstName).toBe('Instructor')
      expect(store.users[1].lastName).toBe('User')
      expect(store.users[1].department).toBeNull()
      expect(store.users[2].firstName).toBe('Student')
      expect(store.users[2].lastName).toBe('User')
      expect(store.users[2].sectionId).toBe('1' as EntityId)
      expect(store.users[2].isRegular).toBe(true)
    })

    it('maps instructor department from nested instructor profiles', async () => {
      const mockUsers = [
        {
          userId: '2' as EntityId,
          username: 'instructor',
          email: 'instructor@example.com',
          role: ROLES.INSTRUCTOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructorProfile: createMockApiUserProfile({
            firstname: 'Instructor',
            lastname: 'User',
            department: 'Engineering',
          }),
        },
      ]
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockUsers) as never)

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.users[0].department).toBe('Engineering')
    })

    it('normalizes legacy Teacher to Instructor', async () => {
      const mockUsers = [
        {
          userId: '1' as EntityId,
          username: 'teacher',
          email: 'teacher@example.com',
          role: 'Teacher' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructorProfile: createMockApiUserProfile({ firstname: 'Teacher', lastname: 'User' }),
        },
      ]
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockUsers) as never)

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.users[0].role).toBe(ROLES.INSTRUCTOR)
    })

    it('failure sets error = \'Failed to fetch users\' and resets loading', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.error).toBe('Failed to fetch users')
      expect(store.loading).toBe(false)
    })
  })

  describe('createUser', () => {
    it('sends transformed register payload, preserving string sectionId for students', async () => {
      const userData: CreateUserInput = {
        Username: 'student1',
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'student@example.com',
        Password: 'password123',
        RepeatedPassword: 'password123',
        Role: 'Student',
        SectionId: '123',
      }
      vi.mocked(api.post).mockResolvedValue({ data: { userId: '1' } } as never)

      const store = useUserStore()
      await store.createUser(userData)

      expect(api.post).toHaveBeenCalledWith('/account/register', {
        username: 'student1',
        firstname: 'John',
        lastname: 'Doe',
        email: 'student@example.com',
        password: 'password123',
        repeatedPassword: 'password123',
        role: 'Student',
        sectionId: '123',
      })
    })

    it('appends mapped user from API response with nested profile data', async () => {
      const userData: CreateUserInput = {
        Username: 'instructor1',
        FirstName: 'Jane',
        LastName: 'Smith',
        Email: 'instructor@example.com',
        Password: 'password123',
        RepeatedPassword: 'password123',
        Role: 'Instructor',
      }
      const mockResponse = {
        userId: '1' as EntityId,
        username: 'instructor1',
        email: 'instructor@example.com',
        role: ROLES.INSTRUCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        instructorProfile: createMockApiUserProfile({ firstname: 'Jane', lastname: 'Smith' }),
      }
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse } as never)

      const store = useUserStore()
      await store.createUser(userData)

      expect(store.users).toHaveLength(1)
      expect(store.users[0].firstName).toBe('Jane')
      expect(store.users[0].lastName).toBe('Smith')
    })

    it('fallback branch works when response has no userId', async () => {
      const userData: CreateUserInput = {
        Username: 'user1',
        FirstName: 'Test',
        LastName: 'User',
        Email: 'user@example.com',
        Password: 'password123',
        RepeatedPassword: 'password123',
        Role: 'Admin',
      }
      const mockResponse = {
        id: '999' as EntityId,
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
      }
      vi.mocked(api.post).mockResolvedValue({ data: mockResponse } as never)

      const store = useUserStore()
      await store.createUser(userData)

      expect(store.users).toHaveLength(1)
      expect(store.users[0].id).toBe('999' as EntityId)
      expect(store.users[0].firstName).toBe('Test')
    })

    it('returns joined validation errors when getValidationErrorMessages is non-empty', async () => {
      const userData: CreateUserInput = {
        Username: 'user1',
        FirstName: 'Test',
        LastName: 'User',
        Email: 'user@example.com',
        Password: 'password123',
        RepeatedPassword: 'password123',
        Role: 'Admin',
      }
      const testError = new Error('Validation failed')
      vi.mocked(api.post).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create user')
      vi.mocked(getValidationErrorMessages).mockReturnValue(['Username is required', 'Email is invalid'])

      const store = useUserStore()
      // eslint-disable-next-line ts/no-explicit-any -- Type compatibility issue with store's CreateUserInput
      const result = await store.createUser(userData as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Username is required, Email is invalid')
    })

    it('falls back to getErrorMessage when validation errors are empty', async () => {
      const userData: CreateUserInput = {
        Username: 'user1',
        FirstName: 'Test',
        LastName: 'User',
        Email: 'user@example.com',
        Password: 'password123',
        RepeatedPassword: 'password123',
        Role: 'Admin',
      }
      const testError = new Error('Server error')
      vi.mocked(api.post).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Failed to create user: Server error')
      vi.mocked(getValidationErrorMessages).mockReturnValue([])

      const store = useUserStore()
      // eslint-disable-next-line ts/no-explicit-any -- Type compatibility issue with store's CreateUserInput
      const result = await store.createUser(userData as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create user: Server error')
    })
  })

  describe('updateUser', () => {
    it('uses /account/admin/users/:userId for instructors', async () => {
      const store = useUserStore()
      store.users = [createMockApiUser({ userId: '1' as EntityId, role: ROLES.INSTRUCTOR, profileId: '101' as EntityId }) as ApiUser]

      const userData = {
        firstName: 'Updated',
        department: 'Engineering',
      }
      vi.mocked(api.patch).mockResolvedValue({ data: { ...store.users[0], firstName: 'Updated' } } as never)

      await store.updateUser('1' as EntityId, userData)

      expect(api.patch).toHaveBeenCalledWith('/account/admin/users/1', userData)
    })

    it('uses /account/admin/users/:userId for students', async () => {
      const store = useUserStore()
      store.users = [createMockApiUser({ userId: '1' as EntityId, role: ROLES.STUDENT, profileId: '102' as EntityId }) as ApiUser]

      const userData = { firstName: 'Updated' }
      vi.mocked(api.patch).mockResolvedValue({ data: { ...store.users[0], firstName: 'Updated' } } as never)

      await store.updateUser('1' as EntityId, userData)

      expect(api.patch).toHaveBeenCalledWith('/account/admin/users/1', userData)
    })

    it('preserves original role in local state', async () => {
      const store = useUserStore()
      const originalUser = createMockApiUser({ userId: '1' as EntityId, role: ROLES.INSTRUCTOR })
      store.users = [originalUser as ApiUser]

      const userData = { firstName: 'Updated' }
      const mockResponse = { ...originalUser, role: 'Teacher' as const, firstName: 'Updated' }
      vi.mocked(api.patch).mockResolvedValue({ data: mockResponse } as never)

      await store.updateUser('1' as EntityId, userData)

      expect(store.users[0].role).toBe(ROLES.INSTRUCTOR)
    })

    it('with missing local user returns { success: false, error: \'User not found\' }', async () => {
      const store = useUserStore()
      store.users = []

      const userData = { firstName: 'Updated' }
      vi.mocked(getErrorMessage).mockReturnValue('User not found')

      const result = await store.updateUser('1' as EntityId, userData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not found')
    })

    it('aPI failure leaves original local user unchanged', async () => {
      const store = useUserStore()
      const originalUser = createMockApiUser({ userId: '1' as EntityId, firstName: 'Original' })
      store.users = [originalUser as ApiUser]

      const userData = { firstName: 'Updated' }
      vi.mocked(api.patch).mockRejectedValue(new Error('Update failed'))
      vi.mocked(getErrorMessage).mockReturnValue('Failed to update user')

      const result = await store.updateUser('1' as EntityId, userData)

      expect(result.success).toBe(false)
      expect(store.users[0].firstName).toBe('Original')
    })
  })

  describe('softDeleteUser', () => {
    it('marks user deleted locally', async () => {
      vi.mocked(api.patch).mockResolvedValue({} as never)

      const store = useUserStore()
      store.users = [createMockApiUser({ userId: '1' as EntityId }) as ApiUser]

      const result = await store.softDeleteUser('1' as EntityId)

      expect(result.success).toBe(true)
      expect(store.users[0].isDeleted).toBe(true)
      expect(store.users[0].deletedAt).toBeTruthy()
    })

    it('failure preserves local state and returns { success: false }', async () => {
      vi.mocked(api.patch).mockRejectedValue(new Error('Delete failed'))
      vi.mocked(getErrorMessage).mockReturnValue('Failed to soft delete user')

      const store = useUserStore()
      const originalUser = createMockApiUser({ userId: '1' as EntityId, isDeleted: false })
      store.users = [originalUser as ApiUser]

      const result = await store.softDeleteUser('1' as EntityId)

      expect(result.success).toBe(false)
      expect(store.users[0].isDeleted).toBe(false)
    })
  })

  describe('restoreUser', () => {
    it('clears deleted flags locally', async () => {
      vi.mocked(api.patch).mockResolvedValue({} as never)

      const store = useUserStore()
      store.users = [createMockApiUser({ userId: '1' as EntityId, isDeleted: true, deletedAt: '2024-01-01' }) as ApiUser]

      const result = await store.restoreUser('1' as EntityId)

      expect(result.success).toBe(true)
      expect(store.users[0].isDeleted).toBe(false)
      expect(store.users[0].deletedAt).toBe(null)
    })

    it('failure preserves local state and returns { success: false }', async () => {
      vi.mocked(api.patch).mockRejectedValue(new Error('Restore failed'))
      vi.mocked(getErrorMessage).mockReturnValue('Failed to restore user')

      const store = useUserStore()
      const originalUser = createMockApiUser({ userId: '1' as EntityId, isDeleted: true, deletedAt: '2024-01-01' })
      store.users = [originalUser as ApiUser]

      const result = await store.restoreUser('1' as EntityId)

      expect(result.success).toBe(false)
      expect(store.users[0].isDeleted).toBe(true)
      expect(store.users[0].deletedAt).toBe('2024-01-01')
    })
  })

  describe('hardDeleteUser', () => {
    it('removes user locally', async () => {
      vi.mocked(api.delete).mockResolvedValue({} as never)

      const store = useUserStore()
      store.users = [createMockApiUser({ userId: '1' as EntityId }) as ApiUser, createMockApiUser({ userId: '2' as EntityId }) as ApiUser]

      const result = await store.hardDeleteUser('1' as EntityId)

      expect(result.success).toBe(true)
      expect(store.users).toHaveLength(1)
      expect(store.users[0].userId).toBe('2' as EntityId)
    })

    it('failure preserves local state and returns { success: false }', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'))
      vi.mocked(getErrorMessage).mockReturnValue('Failed to permanently delete user')

      const store = useUserStore()
      const originalUsers = [createMockApiUser({ userId: '1' as EntityId }) as ApiUser, createMockApiUser({ userId: '2' as EntityId }) as ApiUser]
      store.users = [...originalUsers]

      const result = await store.hardDeleteUser('1' as EntityId)

      expect(result.success).toBe(false)
      expect(store.users).toHaveLength(2)
    })
  })

  describe('filteredUsers', () => {
    it('matches firstName, lastName, email, username, and legacy lowercase fields', () => {
      const store = useUserStore()
      store.users = [
        createMockApiUser({
          userId: '1' as EntityId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
        }) as ApiUser,
        createMockApiUser({
          userId: '2' as EntityId,
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane@example.com',
          username: 'janesmith',
        }) as ApiUser,
      ]

      const filtered = store.filteredUsers('john', 'All Roles')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].firstName).toBe('John')
    })

    it('matches full name search', () => {
      const store = useUserStore()
      store.users = [
        createMockApiUser({
          userId: '1' as EntityId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
        }) as ApiUser,
      ]

      const filtered = store.filteredUsers('john doe', 'All Roles')

      expect(filtered).toHaveLength(1)
    })
  })

  describe('pagination', () => {
    beforeEach(() => {
      const store = useUserStore()
      // Create 25 users for pagination testing
      store.users = Array.from({ length: 25 }, (_, i) =>
        createMockApiUser({
          userId: `${i + 1}` as EntityId,
          firstName: `User${i + 1}`,
          lastName: 'Test',
          email: `user${i + 1}@example.com`,
          username: `user${i + 1}`,
          role: ROLES.STUDENT,
        }) as ApiUser)
    })

    it('totalPages calculates correct number of pages', () => {
      const store = useUserStore()
      store.itemsPerPage = 10

      const totalPages = store.totalPages('', 'All Roles')

      expect(totalPages).toBe(3)
    })

    it('hasNextPage returns true when not on last page', () => {
      const store = useUserStore()
      store.currentPage = 1
      store.itemsPerPage = 10

      const hasNext = store.hasNextPage('', 'All Roles')

      expect(hasNext).toBe(true)
    })

    it('hasNextPage returns false when on last page', () => {
      const store = useUserStore()
      store.currentPage = 3
      store.itemsPerPage = 10

      const hasNext = store.hasNextPage('', 'All Roles')

      expect(hasNext).toBe(false)
    })

    it('hasPreviousPage returns true when not on first page', () => {
      const store = useUserStore()
      store.currentPage = 2

      const hasPrevious = store.hasPreviousPage

      expect(hasPrevious).toBe(true)
    })

    it('hasPreviousPage returns false when on first page', () => {
      const store = useUserStore()
      store.currentPage = 1

      const hasPrevious = store.hasPreviousPage

      expect(hasPrevious).toBe(false)
    })

    it('setItemsPerPage resets page to 1', () => {
      const store = useUserStore()
      store.currentPage = 3

      store.setItemsPerPage(20)

      expect(store.currentPage).toBe(1)
      expect(store.itemsPerPage).toBe(20)
    })

    it('nextPage does not move outside valid bounds', () => {
      const store = useUserStore()
      store.currentPage = 3
      store.itemsPerPage = 10

      store.nextPage('', 'All Roles')

      expect(store.currentPage).toBe(3)
    })

    it('previousPage does not move below page 1', () => {
      const store = useUserStore()
      store.currentPage = 1

      store.previousPage()

      expect(store.currentPage).toBe(1)
    })

    it('goToPage does not move outside valid bounds', () => {
      const store = useUserStore()
      store.currentPage = 1
      store.itemsPerPage = 10

      store.goToPage(10, '', 'All Roles')

      expect(store.currentPage).toBe(1)
    })
  })

  describe('concurrent requests', () => {
    it('concurrent requests keep loading === true until all pending operations resolve', async () => {
      const deferred1 = createDeferred<Awaited<ReturnType<typeof api.get>>>()
      const deferred2 = createDeferred<Awaited<ReturnType<typeof api.get>>>()
      vi.mocked(api.get).mockImplementation(() => {
        return Math.random() > 0.5 ? deferred1.promise : deferred2.promise as never
      })

      const store = useUserStore()

      const promise1 = store.fetchUsers()
      const promise2 = store.fetchUsers()

      expect(store.loading).toBe(true)

      deferred1.resolve(createAxiosResponse([]) as never)
      deferred2.resolve(createAxiosResponse([]) as never)

      await Promise.all([promise1, promise2])

      expect(store.loading).toBe(false)
    })
  })
})
