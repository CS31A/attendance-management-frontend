import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { EntityId } from '@/types'
import type { AuthUserProfile, CheckAuthResponse } from '@/types/auth'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { ROLES } from '@/utils/constants'

vi.mock('@/api')
vi.mock('@/utils/httpError')

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
}

function createMockUserProfile(overrides: Partial<AuthUserProfile> = {}): AuthUserProfile {
  return {
    userId: '1' as EntityId,
    username: 'testuser',
    role: ROLES.INSTRUCTOR,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function createMockCheckAuthResponse(overrides: Partial<CheckAuthResponse> = {}): CheckAuthResponse {
  return {
    user: { id: '1' as EntityId, name: 'Test User', email: 'test@example.com' } as CheckAuthResponse['user'],
    ...overrides,
  }
}

describe('authStore with EntityId (mixed types)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('fetchUserProfile with EntityId', () => {
    it('fetches profile with number EntityId', async () => {
      const mockProfile = createMockUserProfile({
        userId: '1',
        username: 'user1',
        role: ROLES.INSTRUCTOR,
      })
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockProfile) as never)

      const store = useAuthStore()
      const result = await store.fetchUserProfile()

      expect(api.get).toHaveBeenCalledWith('/account/me')
      expect(result).toEqual(mockProfile)
      expect(store.userProfile?.userId).toBe('1')
    })

    it('fetches profile with string UUID EntityId', async () => {
      const mockProfile = createMockUserProfile({
        userId: '550e8400-e29b-41d4-a716-446655440000' as EntityId,
        username: 'user2',
        role: ROLES.ADMIN,
      })
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockProfile) as never)

      const store = useAuthStore()
      const result = await store.fetchUserProfile()

      expect(api.get).toHaveBeenCalledWith('/account/me')
      expect(result).toEqual(mockProfile)
      expect(store.userProfile?.userId).toBe('550e8400-e29b-41d4-a716-446655440000' as EntityId)
    })

    it('fetches profile with nested profile EntityId fields', async () => {
      const mockProfile = createMockUserProfile({
        userId: '660e8400-e29b-41d4-a716-446655440001' as EntityId,
        username: 'student1',
        role: ROLES.STUDENT,
        studentProfile: {
          id: '770e8400-e29b-41d4-a716-446655440002' as EntityId,
          firstname: 'Student',
          lastname: 'User',
          sectionId: '880e8400-e29b-41d4-a716-446655440003' as EntityId,
          sectionName: 'Section A',
          isRegular: true,
        },
      })
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockProfile) as never)

      const store = useAuthStore()
      const result = await store.fetchUserProfile()

      expect(result?.studentProfile?.id).toBe('770e8400-e29b-41d4-a716-446655440002' as EntityId)
      expect(result?.studentProfile?.sectionId).toBe('880e8400-e29b-41d4-a716-446655440003' as EntityId)
    })
  })

  describe('checkAuth with EntityId', () => {
    it('checks auth with number EntityId', async () => {
      const mockCheckResponse = createMockCheckAuthResponse({
        user: { id: '1', name: 'User One', email: 'user1@example.com' } as CheckAuthResponse['user'],
      })
      const mockProfile = createMockUserProfile({ userId: '1' })

      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      const result = await store.checkAuth()

      expect(result).toBe(true)
      expect(store.user?.id).toBe('1')
      expect(store.userProfile?.userId).toBe('1')
    })

    it('checks auth with string UUID EntityId', async () => {
      const mockCheckResponse = createMockCheckAuthResponse({
        user: {
          id: '990e8400-e29b-41d4-a716-446655440004' as EntityId,
          name: 'User Two',
          email: 'user2@example.com',
        } as CheckAuthResponse['user'],
      })
      const mockProfile = createMockUserProfile({
        userId: '990e8400-e29b-41d4-a716-446655440004' as EntityId,
      })

      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      const result = await store.checkAuth()

      expect(result).toBe(true)
      expect(store.user?.id).toBe('990e8400-e29b-41d4-a716-446655440004' as EntityId)
      expect(store.userProfile?.userId).toBe('990e8400-e29b-41d4-a716-446655440004' as EntityId)
    })
  })

  describe('login with EntityId', () => {
    it('logs in user with number EntityId', async () => {
      const mockCheckResponse = createMockCheckAuthResponse({
        user: { id: '2', name: 'Instructor', email: 'instructor@example.com' } as CheckAuthResponse['user'],
      })
      const mockProfile = createMockUserProfile({
        userId: '2',
        role: ROLES.INSTRUCTOR,
      })

      vi.mocked(api.post).mockImplementation((path) => {
        if (path === '/account/web/login')
          return Promise.resolve({ data: { success: true } } as never)
        if (path === '/account/web/logout')
          return Promise.resolve({} as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      const result = await store.login('instructor@example.com', 'password')

      expect(result).toEqual({ success: true })
      expect(store.user?.id).toBe('2')
      expect(store.userProfile?.userId).toBe('2')
    })

    it('logs in user with string UUID EntityId', async () => {
      const mockCheckResponse = createMockCheckAuthResponse({
        user: {
          id: '111e8400-e29b-41d4-a716-446655440005' as EntityId,
          name: 'Admin',
          email: 'admin@example.com',
        } as CheckAuthResponse['user'],
      })
      const mockProfile = createMockUserProfile({
        userId: '111e8400-e29b-41d4-a716-446655440005' as EntityId,
        role: ROLES.ADMIN,
      })

      vi.mocked(api.post).mockImplementation((path) => {
        if (path === '/account/web/login')
          return Promise.resolve({ data: { success: true } } as never)
        if (path === '/account/web/logout')
          return Promise.resolve({} as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      const result = await store.login('admin@example.com', 'password')

      expect(result).toEqual({ success: true })
      expect(store.user?.id).toBe('111e8400-e29b-41d4-a716-446655440005' as EntityId)
      expect(store.userProfile?.userId).toBe('111e8400-e29b-41d4-a716-446655440005' as EntityId)
    })
  })

  describe('mixed EntityId scenarios', () => {
    it('handles transition from number to string EntityId', async () => {
      // First login with number ID
      const mockCheckResponse1 = createMockCheckAuthResponse({
        user: { id: '3', name: 'User', email: 'user@example.com' } as CheckAuthResponse['user'],
      })
      const mockProfile1 = createMockUserProfile({ userId: '3' })

      vi.mocked(api.post).mockImplementation((path) => {
        if (path === '/account/web/login')
          return Promise.resolve({ data: { success: true } } as never)
        if (path === '/account/web/logout')
          return Promise.resolve({} as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse1) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile1) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      await store.login('user@example.com', 'password')

      expect(store.user?.id).toBe('3')
      expect(store.userProfile?.userId).toBe('3')

      // Logout
      await store.logout()

      // Second login with string UUID
      const mockCheckResponse2 = createMockCheckAuthResponse({
        user: {
          id: '222e8400-e29b-41d4-a716-446655440006' as EntityId,
          name: 'User',
          email: 'user@example.com',
        } as CheckAuthResponse['user'],
      })
      const mockProfile2 = createMockUserProfile({
        userId: '222e8400-e29b-41d4-a716-446655440006' as EntityId,
      })

      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse2) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile2) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      await store.login('user@example.com', 'password')

      expect(store.user?.id).toBe('222e8400-e29b-41d4-a716-446655440006' as EntityId)
      expect(store.userProfile?.userId).toBe('222e8400-e29b-41d4-a716-446655440006' as EntityId)
    })
  })
})
