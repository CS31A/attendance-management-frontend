import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { EntityId } from '@/types'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import { useUserStore } from '@/stores/userStore'
import { ROLES } from '@/utils/constants'

vi.mock('@/api')
vi.mock('@/utils/httpError')

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
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

describe('userStore with EntityId (mixed types)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('fetchUsers with mixed EntityId types', () => {
    it('handles users with number EntityId', async () => {
      const mockUsers = [
        {
          userId: 1 as EntityId,
          username: 'user1',
          email: 'user1@example.com',
          role: ROLES.INSTRUCTOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructorProfile: createMockApiUserProfile({ id: 101 as EntityId, firstname: 'User', lastname: 'One' }),
        },
      ]
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockUsers) as never)

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.users).toHaveLength(1)
      expect(store.users[0].userId).toBe(1 as EntityId)
      expect(store.users[0].profileId).toBe(101 as EntityId)
    })

    it('handles users with string UUID EntityId', async () => {
      const mockUsers = [
        {
          userId: '550e8400-e29b-41d4-a716-446655440000' as EntityId,
          username: 'user2',
          email: 'user2@example.com',
          role: ROLES.STUDENT,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          studentProfile: createMockApiUserProfile({
            id: '660e8400-e29b-41d4-a716-446655440001' as EntityId,
            firstname: 'User',
            lastname: 'Two',
            sectionId: '770e8400-e29b-41d4-a716-446655440002' as EntityId,
            isRegular: true,
          }),
        },
      ]
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockUsers) as never)

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.users).toHaveLength(1)
      expect(store.users[0].userId).toBe('550e8400-e29b-41d4-a716-446655440000' as EntityId)
      expect(store.users[0].profileId).toBe('660e8400-e29b-41d4-a716-446655440001' as EntityId)
      expect(store.users[0].sectionId).toBe('770e8400-e29b-41d4-a716-446655440002' as EntityId)
    })

    it('handles mixed number and string EntityId in same response', async () => {
      const mockUsers = [
        {
          userId: 1 as EntityId,
          username: 'user1',
          email: 'user1@example.com',
          role: ROLES.ADMIN,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminProfile: createMockApiUserProfile({ id: 101 as EntityId, firstname: 'Admin', lastname: 'User' }),
        },
        {
          userId: '880e8400-e29b-41d4-a716-446655440003' as EntityId,
          username: 'user2',
          email: 'user2@example.com',
          role: ROLES.INSTRUCTOR,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instructorProfile: createMockApiUserProfile({
            id: '990e8400-e29b-41d4-a716-446655440004' as EntityId,
            firstname: 'Instructor',
            lastname: 'User',
          }),
        },
      ]
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockUsers) as never)

      const store = useUserStore()
      await store.fetchUsers()

      expect(store.users).toHaveLength(2)
      expect(store.users[0].userId).toBe(1 as EntityId)
      expect(store.users[0].profileId).toBe(101 as EntityId)
      expect(store.users[1].userId).toBe('880e8400-e29b-41d4-a716-446655440003' as EntityId)
      expect(store.users[1].profileId).toBe('990e8400-e29b-41d4-a716-446655440004' as EntityId)
    })
  })

  describe('updateUser with EntityId', () => {
    it('updates user with number EntityId', async () => {
      const store = useUserStore()
      store.users = [createMockApiUser({ userId: 1 as EntityId, role: ROLES.INSTRUCTOR, profileId: 101 as EntityId }) as ApiUser]

      const userData = { firstName: 'Updated' }
      vi.mocked(api.patch).mockResolvedValue({ data: { ...store.users[0], firstName: 'Updated' } } as never)

      const result = await store.updateUser(1 as EntityId, userData)

      expect(result.success).toBe(true)
      expect(api.patch).toHaveBeenCalledWith('/instructors/101', userData)
    })

    it('updates user with string UUID EntityId', async () => {
      const store = useUserStore()
      const userId = '111e8400-e29b-41d4-a716-446655440005' as EntityId
      const profileId = '222e8400-e29b-41d4-a716-446655440006' as EntityId

      store.users = [createMockApiUser({ userId, role: ROLES.STUDENT, profileId }) as ApiUser]

      const userData = { firstName: 'Updated' }
      vi.mocked(api.patch).mockResolvedValue({ data: { ...store.users[0], firstName: 'Updated' } } as never)

      const result = await store.updateUser(userId, userData)

      expect(result.success).toBe(true)
      expect(api.patch).toHaveBeenCalledWith('/students/222e8400-e29b-41d4-a716-446655440006', userData)
    })
  })

  describe('softDeleteUser with EntityId', () => {
    it('soft deletes user with number EntityId', async () => {
      vi.mocked(api.patch).mockResolvedValue({} as never)

      const store = useUserStore()
      store.users = [createMockApiUser({ userId: 2 as EntityId }) as ApiUser]

      const result = await store.softDeleteUser(2 as EntityId)

      expect(result.success).toBe(true)
      expect(store.users[0].isDeleted).toBe(true)
      expect(api.patch).toHaveBeenCalledWith('/users/2/soft-delete')
    })

    it('soft deletes user with string UUID EntityId', async () => {
      vi.mocked(api.patch).mockResolvedValue({} as never)

      const userId = '333e8400-e29b-41d4-a716-446655440007' as EntityId
      const store = useUserStore()
      store.users = [createMockApiUser({ userId }) as ApiUser]

      const result = await store.softDeleteUser(userId)

      expect(result.success).toBe(true)
      expect(store.users[0].isDeleted).toBe(true)
      expect(api.patch).toHaveBeenCalledWith('/users/333e8400-e29b-41d4-a716-446655440007/soft-delete')
    })
  })

  describe('restoreUser with EntityId', () => {
    it('restores user with number EntityId', async () => {
      vi.mocked(api.patch).mockResolvedValue({} as never)

      const store = useUserStore()
      store.users = [createMockApiUser({ userId: 3 as EntityId, isDeleted: true, deletedAt: '2024-01-01' }) as ApiUser]

      const result = await store.restoreUser(3 as EntityId)

      expect(result.success).toBe(true)
      expect(store.users[0].isDeleted).toBe(false)
      expect(store.users[0].deletedAt).toBe(null)
      expect(api.patch).toHaveBeenCalledWith('/users/3/restore')
    })

    it('restores user with string UUID EntityId', async () => {
      vi.mocked(api.patch).mockResolvedValue({} as never)

      const userId = '444e8400-e29b-41d4-a716-446655440008' as EntityId
      const store = useUserStore()
      store.users = [createMockApiUser({ userId, isDeleted: true, deletedAt: '2024-01-01' }) as ApiUser]

      const result = await store.restoreUser(userId)

      expect(result.success).toBe(true)
      expect(store.users[0].isDeleted).toBe(false)
      expect(store.users[0].deletedAt).toBe(null)
      expect(api.patch).toHaveBeenCalledWith('/users/444e8400-e29b-41d4-a716-446655440008/restore')
    })
  })

  describe('hardDeleteUser with EntityId', () => {
    it('hard deletes user with number EntityId', async () => {
      vi.mocked(api.delete).mockResolvedValue({} as never)

      const store = useUserStore()
      store.users = [
        createMockApiUser({ userId: 4 as EntityId }) as ApiUser,
        createMockApiUser({ userId: 5 as EntityId }) as ApiUser,
      ]

      const result = await store.hardDeleteUser(4 as EntityId)

      expect(result.success).toBe(true)
      expect(store.users).toHaveLength(1)
      expect(store.users[0].userId).toBe(5 as EntityId)
      expect(api.delete).toHaveBeenCalledWith('/users/4')
    })

    it('hard deletes user with string UUID EntityId', async () => {
      vi.mocked(api.delete).mockResolvedValue({} as never)

      const userId1 = '555e8400-e29b-41d4-a716-446655440009' as EntityId
      const userId2 = '666e8400-e29b-41d4-a716-446655440010' as EntityId

      const store = useUserStore()
      store.users = [
        createMockApiUser({ userId: userId1 }) as ApiUser,
        createMockApiUser({ userId: userId2 }) as ApiUser,
      ]

      const result = await store.hardDeleteUser(userId1)

      expect(result.success).toBe(true)
      expect(store.users).toHaveLength(1)
      expect(store.users[0].userId).toBe(userId2)
      expect(api.delete).toHaveBeenCalledWith('/users/555e8400-e29b-41d4-a716-446655440009')
    })
  })

  describe('filteredUsers with EntityId', () => {
    it('filters users with mixed EntityId types', () => {
      const store = useUserStore()
      store.users = [
        createMockApiUser({
          userId: 1 as EntityId,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          username: 'johndoe',
        }) as ApiUser,
        createMockApiUser({
          userId: '777e8400-e29b-41d4-a716-446655440011' as EntityId,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          username: 'janesmith',
        }) as ApiUser,
      ]

      const filtered = store.filteredUsers('john', 'All Roles')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].userId).toBe(1 as EntityId)
      expect(filtered[0].firstName).toBe('John')
    })
  })
})
