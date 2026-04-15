import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { AuthUserProfile, CheckAuthResponse } from '@/types/auth'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/api'
import { useAuthStore } from '@/stores/authStore'
import { ROLES } from '@/utils/constants'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

vi.mock('@/api')
vi.mock('@/utils/httpError')

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
}

function createMockUserProfile(overrides: Partial<AuthUserProfile> = {}): AuthUserProfile {
  return {
    userId: '1',
    username: 'testuser',
    role: ROLES.INSTRUCTOR,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function createMockCheckAuthResponse(overrides: Partial<CheckAuthResponse> = {}): CheckAuthResponse {
  return {
    user: { id: '1', name: 'Test User', email: 'test@example.com' } as CheckAuthResponse['user'],
    ...overrides,
  }
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('fetchUserProfile', () => {
    it('stores profile data and normalizes Teacher to Instructor', async () => {
      // eslint-disable-next-line ts/no-explicit-any -- Testing legacy Teacher role normalization
      const mockProfile = createMockUserProfile({ role: 'Teacher' as any })
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse(mockProfile) as never)

      const store = useAuthStore()
      const result = await store.fetchUserProfile()

      expect(api.get).toHaveBeenCalledWith('/account/me')
      expect(result).toEqual(mockProfile)
      expect(store.userProfile).toEqual({ ...mockProfile, role: ROLES.INSTRUCTOR })
    })

    it('failure returns null and clears userProfile', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const store = useAuthStore()
      store.userProfile = createMockUserProfile()

      const result = await store.fetchUserProfile()

      expect(result).toBe(null)
      expect(store.userProfile).toBe(null)
    })
  })

  describe('checkAuth', () => {
    it('with valid response sets user, sets isAuthenticated = true, fetches/stores profile, and clears isLoading when not background mode', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile()
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
      expect(store.user).toEqual(mockCheckResponse.user)
      expect(store.isAuthenticated).toBe(true)
      expect(store.userProfile).toEqual(mockProfile)
      expect(store.isLoading).toBe(false)
    })

    it('with missing user clears auth state and returns false', async () => {
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse({}) as never)

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      const result = await store.checkAuth()

      expect(result).toBe(false)
      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })

    it('401 clears auth state and returns false', async () => {
      const error = { response: { status: 401 } }
      vi.mocked(api.get).mockRejectedValue(error)
      vi.mocked(getErrorStatus).mockReturnValue(401)

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      const result = await store.checkAuth()

      expect(result).toBe(false)
      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })

    it('background mode does not set isLoading to true', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile()
      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      store.isLoading = false

      await store.checkAuth(true)

      expect(store.isLoading).toBe(false)
    })
  })

  describe('login', () => {
    it('succeeds for Instructor', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile({ role: ROLES.INSTRUCTOR })
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
      const result = await store.login('test@example.com', 'password')

      expect(result).toEqual({ success: true })
      expect(store.isAuthenticated).toBe(true)
      expect(store.userProfile?.role).toBe(ROLES.INSTRUCTOR)
    })

    it('succeeds for Admin', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile({ role: ROLES.ADMIN })
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
      expect(store.isAuthenticated).toBe(true)
      expect(store.userProfile?.role).toBe(ROLES.ADMIN)
    })

    it('with { success: false } returns { success: false, message: \'Login failed\' }', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { success: false } } as never)

      const store = useAuthStore()
      const result = await store.login('test@example.com', 'password')

      expect(result).toEqual({ success: false, message: 'Login failed' })
    })

    it('rejected request uses getErrorMessage', async () => {
      const testError = new Error('Network error')
      vi.mocked(api.post).mockRejectedValue(testError)
      vi.mocked(getErrorMessage).mockReturnValue('Invalid credentials')

      const store = useAuthStore()
      const result = await store.login('test@example.com', 'password')

      expect(getErrorMessage).toHaveBeenCalledWith(testError, 'Invalid credentials')
      expect(result).toEqual({ success: false, message: 'Invalid credentials' })
    })

    it('with Student profile calls logout endpoint, clears state, and returns access-denied message', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile({ role: ROLES.STUDENT })
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
      const result = await store.login('student@example.com', 'password')

      expect(api.post).toHaveBeenCalledWith('/account/web/logout')
      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
      expect(result).toEqual({
        success: false,
        message: 'Access denied. Students cannot log in to the web application.',
      })
    })

    it('with unsupported role calls logout endpoint, clears state, and returns access-denied message', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      // eslint-disable-next-line ts/no-explicit-any -- Testing unsupported role handling
      const mockProfile = createMockUserProfile({ role: 'Unknown' as any })
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
      const result = await store.login('test@example.com', 'password')

      expect(api.post).toHaveBeenCalledWith('/account/web/logout')
      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
      expect(result).toEqual({
        success: false,
        message: 'Access denied. Only instructors and administrators can log in.',
      })
    })
  })

  describe('logout', () => {
    it('clears local auth state', async () => {
      vi.mocked(api.post).mockResolvedValue({} as never)

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      await store.logout()

      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })

    it('still clears state when API logout fails', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Logout failed'))

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      await store.logout()

      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('initializeAuth', () => {
    it('calls checkAuth only when user === null && isLoading === true', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile()
      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      await store.initializeAuth()

      expect(api.get).toHaveBeenCalledWith('/account/check')
    })

    it('does not call checkAuth when user is already set', async () => {
      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.isLoading = true

      await store.initializeAuth()

      expect(api.get).not.toHaveBeenCalled()
      expect(store.isLoading).toBe(false)
    })

    it('sets isLoading to false when it is still true after check', async () => {
      vi.mocked(api.get).mockResolvedValue(createAxiosResponse({}) as never)

      const store = useAuthStore()
      store.isLoading = true

      await store.initializeAuth()

      expect(store.isLoading).toBe(false)
    })
  })

  describe('refreshToken', () => {
    it('success calls checkAuth and returns true', async () => {
      const mockCheckResponse = createMockCheckAuthResponse()
      const mockProfile = createMockUserProfile()
      vi.mocked(api.post).mockResolvedValue({ data: { success: true } } as never)
      vi.mocked(api.get).mockImplementation((path) => {
        if (path === '/account/check')
          return Promise.resolve(createAxiosResponse(mockCheckResponse) as never)
        if (path === '/account/me')
          return Promise.resolve(createAxiosResponse(mockProfile) as never)
        return Promise.reject(new Error('Unexpected path'))
      })

      const store = useAuthStore()
      const result = await store.refreshToken()

      expect(api.get).toHaveBeenCalledWith('/account/check')
      expect(result).toBe(true)
    })

    it('with { success: false } clears state', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { success: false } } as never)

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      const result = await store.refreshToken()

      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
      expect(result).toBe(false)
    })

    it('with 401 clears state and returns false', async () => {
      const error = { response: { status: 401 } }
      vi.mocked(api.post).mockRejectedValue(error)
      vi.mocked(getErrorStatus).mockReturnValue(401)

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      const result = await store.refreshToken()

      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
      expect(result).toBe(false)
    })

    it('with 403 clears state and returns false', async () => {
      const error = { response: { status: 403 } }
      vi.mocked(api.post).mockRejectedValue(error)
      vi.mocked(getErrorStatus).mockReturnValue(403)

      const store = useAuthStore()
      store.user = createMockCheckAuthResponse().user as NonNullable<CheckAuthResponse['user']>
      store.userProfile = createMockUserProfile()
      store.isAuthenticated = true

      const result = await store.refreshToken()

      expect(store.user).toBe(null)
      expect(store.userProfile).toBe(null)
      expect(store.isAuthenticated).toBe(false)
      expect(result).toBe(false)
    })
  })
})
