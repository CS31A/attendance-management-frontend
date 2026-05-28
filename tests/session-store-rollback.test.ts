import type { SessionResponseDto } from '@/api/sessions'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  endSession as apiEndSession,
  startSession as apiStartSession,
  updateSessionRoom as apiUpdateSessionRoom,
} from '@/api/sessions'
import { useSessionStore } from '@/stores/sessionStore'

vi.mock('@/api/sessions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/sessions')>()

  return {
    ...actual,
    startSession: vi.fn(),
    endSession: vi.fn(),
    updateSessionRoom: vi.fn(),
    toSession: vi.fn(((dto: any) => ({ ...dto })) as any),
  }
})

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

function toLocalDateStart(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}T00:00:00`
}

const todaySessionDate = toLocalDateStart(new Date())

function createSession(overrides: Partial<SessionResponseDto>): SessionResponseDto {
  return {
    id: '1',
    status: 'not_started',
    sessionDate: todaySessionDate,
    rowVersion: 'row-version-1',
    ...overrides,
  }
}

describe('session store rollback snapshots', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(apiStartSession).mockReset()
    vi.mocked(apiEndSession).mockReset()
    vi.mocked(apiUpdateSessionRoom).mockReset()
  })

  describe('success paths', () => {
    it('startSession updates session status to active on successful API call', async () => {
      const store = useSessionStore()
      const updatedSession = createSession({ id: '11', status: 'active' })
      vi.mocked(apiStartSession).mockResolvedValue(updatedSession)

      store.sessions = [createSession({ id: '11', status: 'not_started' })]

      const result = await store.startSession('11')

      expect(result).toEqual(updatedSession)
      expect(store.sessions[0]?.status).toBe('active')
      expect(store.sessions[0]?.rowVersion).toBe(updatedSession.rowVersion)
    })

    it('endSession updates session status to ended on successful API call', async () => {
      const store = useSessionStore()
      const updatedSession = createSession({ id: '22', status: 'ended' })
      vi.mocked(apiEndSession).mockResolvedValue(updatedSession)

      store.sessions = [createSession({ id: '22', status: 'active' })]

      const result = await store.endSession('22')

      expect(result).toEqual(updatedSession)
      expect(store.sessions[0]?.status).toBe('ended')
      expect(store.sessions[0]?.rowVersion).toBe(updatedSession.rowVersion)
    })

    it('updateSessionRoom updates actualRoomId on successful API call', async () => {
      const store = useSessionStore()
      const updatedSession = createSession({ id: '33', status: 'active', actualRoomId: '202' })
      vi.mocked(apiUpdateSessionRoom).mockResolvedValue(updatedSession)

      store.sessions = [createSession({ id: '33', status: 'active', actualRoomId: '101' })]

      const result = await store.updateSessionRoom('33', { actualRoomId: '202' })

      expect(result).toEqual(updatedSession)
      expect(store.sessions[0]?.actualRoomId).toBe('202')
      expect(store.sessions[0]?.rowVersion).toBe(updatedSession.rowVersion)
    })
  })

  it('startSession restores the original status on API failure even after in-flight mutation', async () => {
    const store = useSessionStore()
    const deferred = createDeferred<SessionResponseDto>()
    const apiError = new Error('start failed')

    store.sessions = [createSession({ id: '11', status: 'not_started' })]
    vi.mocked(apiStartSession).mockImplementation(async () => await deferred.promise)

    const startPromise = store.startSession('11')

    store.sessions[0]!.status = 'active'
    deferred.reject(apiError)

    await expect(startPromise).rejects.toThrow('start failed')
    expect(store.sessions[0]?.status).toBe('not_started')
  })

  it('endSession restores the original status on API failure even after in-flight mutation', async () => {
    const store = useSessionStore()
    const deferred = createDeferred<SessionResponseDto>()
    const apiError = new Error('end failed')

    store.sessions = [createSession({ id: '22', status: 'active' })]
    vi.mocked(apiEndSession).mockImplementation(async () => await deferred.promise)

    const endPromise = store.endSession('22')

    store.sessions[0]!.status = 'ended'
    deferred.reject(apiError)

    await expect(endPromise).rejects.toThrow('end failed')
    expect(store.sessions[0]?.status).toBe('active')
  })

  it('updateSessionRoom restores the original room on API failure even after in-flight mutation', async () => {
    const store = useSessionStore()
    const deferred = createDeferred<SessionResponseDto>()
    const apiError = new Error('room update failed')

    store.sessions = [createSession({ id: '33', status: 'active', actualRoomId: '101' })]
    vi.mocked(apiUpdateSessionRoom).mockImplementation(async () => await deferred.promise)

    const updatePromise = store.updateSessionRoom('33', { actualRoomId: '202' })

    store.sessions[0]!.actualRoomId = '303'
    deferred.reject(apiError)

    await expect(updatePromise).rejects.toThrow('room update failed')
    expect(store.sessions[0]?.actualRoomId).toBe('101')
  })
})
