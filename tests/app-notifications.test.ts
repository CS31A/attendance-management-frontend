import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { AuthUserProfile, CheckAuthResponse } from '@/types/auth'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/api'
import App from '@/App.vue'
import { ROLES } from '@/utils/constants'

vi.mock('@/api')

vi.mock('@/components/SideBar.vue', () => ({
  default: {
    name: 'SideBar',
    template: '<aside data-testid="sidebar" />',
  },
}))

vi.mock('@/components/Header.vue', () => ({
  default: {
    name: 'Header',
    template: '<header data-testid="header" />',
    props: ['notificationCount', 'notifications', 'isMobile', 'isSidebarOpen', 'isSidebarCollapsed', 'showSidebar'],
  },
}))

vi.mock('@/components/common/Toast.vue', () => ({
  default: {
    name: 'Toast',
    template: '<div data-testid="toast" />',
    props: ['show', 'message', 'type'],
  },
}))

const routeMock = vi.hoisted(() => ({
  path: '/dashboard',
  name: 'Dashboard',
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({ push: vi.fn() }),
}))

const signalRMock = vi.hoisted(() => {
  const start = vi.fn().mockResolvedValue(undefined)
  const stop = vi.fn().mockResolvedValue(undefined)

  class HubConnectionBuilder {
    withUrl = vi.fn().mockReturnThis()
    withAutomaticReconnect = vi.fn().mockReturnThis()
    build = vi.fn().mockReturnValue({
      start,
      stop,
      on: vi.fn(),
      onreconnecting: vi.fn(),
      onreconnected: vi.fn(),
      onclose: vi.fn(),
    })
  }

  return { HubConnectionBuilder, start, stop }
})

vi.mock('@microsoft/signalr', () => signalRMock)

function createAxiosResponse<T>(data: T): AxiosResponse<T> {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig }
}

function createProfile(): AuthUserProfile {
  return {
    userId: 'admin-1',
    username: 'admin',
    role: ROLES.ADMIN,
    createdAt: '2026-04-27T00:00:00Z',
    updatedAt: '2026-04-27T00:00:00Z',
  }
}

async function mountApp() {
  const wrapper = mount(App, {
    global: {
      stubs: {
        Header: true,
        SideBar: true,
        RouterView: true,
        Toast: true,
      },
    },
  })

  await new Promise(resolve => setTimeout(resolve))
  return wrapper
}

describe('app notification connection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    routeMock.path = '/dashboard'
    routeMock.name = 'Dashboard'
  })

  it('starts notifications after authenticated app initialization succeeds', async () => {
    vi.mocked(api.get).mockImplementation((path) => {
      if (path === '/account/check') {
        return Promise.resolve(createAxiosResponse<CheckAuthResponse>({
          user: { id: 'admin-1', name: 'Admin User', email: 'admin@example.test' },
        }) as never)
      }
      if (path === '/account/me')
        return Promise.resolve(createAxiosResponse(createProfile()) as never)

      return Promise.reject(new Error('Unexpected path'))
    })

    await mountApp()

    expect(signalRMock.start).toHaveBeenCalledTimes(1)
  })

  it('does not start notifications when app initialization is unauthenticated', async () => {
    vi.mocked(api.get).mockResolvedValue(createAxiosResponse<Partial<CheckAuthResponse>>({}) as never)

    await mountApp()

    expect(signalRMock.start).not.toHaveBeenCalled()
  })
})
