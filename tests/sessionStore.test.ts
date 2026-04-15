import type {
  CreateSessionPayload,
  EndSessionPayload,
  SessionResponseDto,
  StartSessionPayload,
  UpdateSessionRoomPayload,
} from '@/api/sessions'
import type { EntityId } from '@/types'
import type { SessionStatus } from '@/utils/constants'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSession as apiCreateSession,
  deleteSession as apiDeleteSession,
  endSession as apiEndSession,
  fetchMySessions as apiFetchMySessions,
  fetchSessionById as apiFetchSessionById,
  fetchSessionsByDate as apiFetchSessionsByDate,
  fetchSessionsBySchedule as apiFetchSessionsBySchedule,
  fetchSessionsByStatus as apiFetchSessionsByStatus,
  startSession as apiStartSession,
  updateSessionRoom as apiUpdateSessionRoom,
} from '@/api/sessions'
import { useSessionStore } from '@/stores/sessionStore'

vi.mock('@/api/sessions')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

// Helper factory
function createSession(overrides: Partial<SessionResponseDto> = {}): SessionResponseDto {
  return {
    id: 1 as EntityId,
    status: 'not_started' as SessionStatus,
    sessionDate: '2026-01-01T00:00:00',
    ...overrides,
  }
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

describe('sessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('getters', () => {
    it('sessionsByStatus filters by status', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'not_started' }),
        createSession({ id: 2 as EntityId, status: 'active' }),
        createSession({ id: 3 as EntityId, status: 'not_started' }),
      ]
      expect(store.sessionsByStatus('not_started')).toHaveLength(2)
      expect(store.sessionsByStatus('active')).toHaveLength(1)
    })

    it('notStartedSessions returns not_started sessions', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'not_started' }),
        createSession({ id: 2 as EntityId, status: 'active' }),
      ]
      expect(store.notStartedSessions).toHaveLength(1)
      expect(store.notStartedSessions[0].status).toBe('not_started')
    })

    it('activeSessions returns active sessions', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'active' }),
        createSession({ id: 2 as EntityId, status: 'ended' }),
      ]
      expect(store.activeSessions).toHaveLength(1)
      expect(store.activeSessions[0].status).toBe('active')
    })

    it('endedSessions returns ended sessions', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'ended' }),
        createSession({ id: 2 as EntityId, status: 'active' }),
      ]
      expect(store.endedSessions).toHaveLength(1)
      expect(store.endedSessions[0].status).toBe('ended')
    })

    it('cancelledSessions returns cancelled sessions', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'cancelled' }),
        createSession({ id: 2 as EntityId, status: 'active' }),
      ]
      expect(store.cancelledSessions).toHaveLength(1)
      expect(store.cancelledSessions[0].status).toBe('cancelled')
    })

    it('upcomingSessions sorts ascending by date', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'not_started', sessionDate: '2026-01-03T00:00:00' }),
        createSession({ id: 2 as EntityId, status: 'not_started', sessionDate: '2026-01-01T00:00:00' }),
        createSession({ id: 3 as EntityId, status: 'not_started', sessionDate: '2026-01-02T00:00:00' }),
      ]
      const upcoming = store.upcomingSessions
      expect(upcoming).toHaveLength(3)
      expect(upcoming[0].sessionDate).toBe('2026-01-01T00:00:00')
      expect(upcoming[1].sessionDate).toBe('2026-01-02T00:00:00')
      expect(upcoming[2].sessionDate).toBe('2026-01-03T00:00:00')
    })

    it('completedSessions sorts descending by date', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'ended', sessionDate: '2026-01-01T00:00:00' }),
        createSession({ id: 2 as EntityId, status: 'cancelled', sessionDate: '2026-01-03T00:00:00' }),
        createSession({ id: 3 as EntityId, status: 'ended', sessionDate: '2026-01-02T00:00:00' }),
      ]
      const completed = store.completedSessions
      expect(completed).toHaveLength(3)
      expect(completed[0].sessionDate).toBe('2026-01-03T00:00:00')
      expect(completed[1].sessionDate).toBe('2026-01-02T00:00:00')
      expect(completed[2].sessionDate).toBe('2026-01-01T00:00:00')
    })

    it('getSessionById returns session by ID', () => {
      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId }),
        createSession({ id: 2 as EntityId }),
      ]
      expect(store.getSessionById(1 as EntityId)?.id).toBe(1 as EntityId)
      expect(store.getSessionById(2 as EntityId)?.id).toBe(2 as EntityId)
      expect(store.getSessionById(99 as EntityId)).toBeUndefined()
    })
  })

  describe('actions — success paths', () => {
    it('fetchSessions populates sessions', async () => {
      const mockSessions = [createSession(), createSession({ id: 2 as EntityId })]
      vi.mocked(apiFetchMySessions).mockResolvedValue(mockSessions as never)

      const store = useSessionStore()

      const result = await store.fetchSessions()

      expect(store.sessions).toEqual(mockSessions)
      expect(result).toEqual(mockSessions)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionById sets currentSession and replaces existing session in local state', async () => {
      const mockSession = createSession({ id: 1 as EntityId, status: 'active' })
      vi.mocked(apiFetchSessionById).mockResolvedValue(mockSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'not_started' })]

      const result = await store.fetchSessionById(1 as EntityId)

      expect(store.currentSession).toEqual(mockSession)
      expect(store.sessions[0]).toEqual(mockSession)
      expect(result).toEqual(mockSession)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionById pushes when missing from local state', async () => {
      const mockSession = createSession({ id: 99 as EntityId })
      vi.mocked(apiFetchSessionById).mockResolvedValue(mockSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId })]

      const result = await store.fetchSessionById(99 as EntityId)

      expect(store.currentSession).toEqual(mockSession)
      expect(store.sessions).toHaveLength(2)
      expect(store.sessions[1]).toEqual(mockSession)
      expect(result).toEqual(mockSession)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionsBySchedule returns API data without mutating store state', async () => {
      const mockSessions = [createSession()]
      vi.mocked(apiFetchSessionsBySchedule).mockResolvedValue(mockSessions as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 2 as EntityId })]

      const result = await store.fetchSessionsBySchedule(1 as EntityId)

      expect(result).toEqual(mockSessions)
      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(2 as EntityId)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionsByStatusApi returns API data without mutating store state', async () => {
      const mockSessions = [createSession()]
      vi.mocked(apiFetchSessionsByStatus).mockResolvedValue(mockSessions as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 2 as EntityId })]

      const result = await store.fetchSessionsByStatusApi('active')

      expect(result).toEqual(mockSessions)
      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(2 as EntityId)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionsByDate returns API data without mutating store state', async () => {
      const mockSessions = [createSession()]
      vi.mocked(apiFetchSessionsByDate).mockResolvedValue(mockSessions as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 2 as EntityId })]

      const result = await store.fetchSessionsByDate('2026-01-01')

      expect(result).toEqual(mockSessions)
      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(2 as EntityId)
      expect(store.loading).toBe(false)
    })

    it('createSession appends new session', async () => {
      const newSession = createSession({ id: 2 as EntityId })
      vi.mocked(apiCreateSession).mockResolvedValue(newSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId })]

      const payload: CreateSessionPayload = { scheduleId: 1 }
      const result = await store.createSession(payload)

      expect(store.sessions).toHaveLength(2)
      expect(store.sessions[1]).toEqual(newSession)
      expect(result).toEqual(newSession)
      expect(store.loading).toBe(false)
    })

    it('startSession replaces matching session on success', async () => {
      const updatedSession = createSession({ id: 1 as EntityId, status: 'active' })
      vi.mocked(apiStartSession).mockResolvedValue(updatedSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'not_started' })]

      const payload: StartSessionPayload = {}
      const result = await store.startSession(1 as EntityId, payload)

      expect(store.sessions[0]).toEqual(updatedSession)
      expect(result).toEqual(updatedSession)
      expect(store.loading).toBe(false)
    })

    it('endSession replaces matching session on success', async () => {
      const updatedSession = createSession({ id: 1 as EntityId, status: 'ended' })
      vi.mocked(apiEndSession).mockResolvedValue(updatedSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'active' })]

      const payload: EndSessionPayload = {}
      const result = await store.endSession(1 as EntityId, payload)

      expect(store.sessions[0]).toEqual(updatedSession)
      expect(result).toEqual(updatedSession)
      expect(store.loading).toBe(false)
    })

    it('updateSessionRoom replaces matching session on success', async () => {
      const updatedSession = createSession({ id: 1 as EntityId, status: 'active', actualRoomId: 202 })
      vi.mocked(apiUpdateSessionRoom).mockResolvedValue(updatedSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'active', actualRoomId: 101 })]

      const payload: UpdateSessionRoomPayload = { actualRoomId: 202 }
      const result = await store.updateSessionRoom(1 as EntityId, payload)

      expect(store.sessions[0]).toEqual(updatedSession)
      expect(result).toEqual(updatedSession)
      expect(store.loading).toBe(false)
    })

    it('deleteSession removes matching session', async () => {
      vi.mocked(apiDeleteSession).mockResolvedValue({} as never)

      const store = useSessionStore()
      store.sessions = [
        createSession({ id: 1 as EntityId, status: 'not_started' }),
        createSession({ id: 2 as EntityId, status: 'not_started' }),
      ]

      await store.deleteSession(1 as EntityId)

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(2 as EntityId)
      expect(store.loading).toBe(false)
    })

    it('clearCurrentSession clears only current session', () => {
      const store = useSessionStore()
      store.currentSession = createSession()
      store.sessions = [createSession()]

      store.clearCurrentSession()

      expect(store.currentSession).toBeNull()
      expect(store.sessions).toHaveLength(1)
    })

    it('resetStore resets all state', () => {
      const store = useSessionStore()
      store.sessions = [createSession()]
      store.currentSession = createSession()

      store.resetStore()

      expect(store.sessions).toEqual([])
      expect(store.currentSession).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('loading counter stays correct with overlapping requests', async () => {
      const deferred1 = createDeferred<SessionResponseDto[]>()
      const deferred2 = createDeferred<SessionResponseDto[]>()

      vi.mocked(apiFetchMySessions).mockImplementation(() => deferred1.promise)
      vi.mocked(apiFetchSessionsBySchedule).mockImplementation(() => deferred2.promise)

      const store = useSessionStore()

      const request1 = store.fetchSessions()
      const request2 = store.fetchSessionsBySchedule(1 as EntityId)

      expect(store.loading).toBe(true)

      deferred1.resolve([createSession()] as never)
      await request1
      expect(store.loading).toBe(true)

      deferred2.resolve([createSession()] as never)
      await request2
      expect(store.loading).toBe(false)
    })
  })

  describe('actions — error paths', () => {
    it('fetchSessions rethrows, resets loading, and preserves previous state', async () => {
      const testError = new Error('Fetch failed')
      vi.mocked(apiFetchMySessions).mockRejectedValue(testError)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 99 as EntityId })]

      await expect(store.fetchSessions()).rejects.toThrow(testError)

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(99 as EntityId)
      expect(store.loading).toBe(false)
    })

    it('fetchSessionById rethrows, resets loading, and preserves previous state', async () => {
      const testError = new Error('Not found')
      vi.mocked(apiFetchSessionById).mockRejectedValue(testError)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId })]
      store.currentSession = createSession({ id: 2 as EntityId })

      await expect(store.fetchSessionById(99 as EntityId)).rejects.toThrow(testError)

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(1 as EntityId)
      expect(store.currentSession).toEqual(createSession({ id: 2 as EntityId }))
      expect(store.loading).toBe(false)
    })

    it('createSession failure does not append', async () => {
      const testError = new Error('Create failed')
      vi.mocked(apiCreateSession).mockRejectedValue(testError)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId })]

      const payload: CreateSessionPayload = { scheduleId: 1 }
      await expect(store.createSession(payload)).rejects.toThrow(testError)

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(1 as EntityId)
      expect(store.loading).toBe(false)
    })

    it('startSession client-side validation blocks API call unless status is not_started', async () => {
      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'active' })]

      await expect(store.startSession(1 as EntityId)).rejects.toThrow('Only sessions in "not_started" status can be started')

      expect(apiStartSession).not.toHaveBeenCalled()
    })

    it('endSession client-side validation blocks API call unless status is active', async () => {
      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'not_started' })]

      await expect(store.endSession(1 as EntityId)).rejects.toThrow('Only active sessions can be ended')

      expect(apiEndSession).not.toHaveBeenCalled()
    })

    it('deleteSession client-side validation blocks API call unless status is not_started', async () => {
      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'active' })]

      await expect(store.deleteSession(1 as EntityId)).rejects.toThrow('Only sessions in "not_started" status can be deleted')

      expect(apiDeleteSession).not.toHaveBeenCalled()
    })

    it('updateSessionRoom client-side validation blocks API call unless status is active', async () => {
      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'not_started' })]

      const payload: UpdateSessionRoomPayload = { actualRoomId: 202 }
      await expect(store.updateSessionRoom(1 as EntityId, payload)).rejects.toThrow('Room can only be updated for active sessions')

      expect(apiUpdateSessionRoom).not.toHaveBeenCalled()
    })

    it('startSession API failure preserves state', async () => {
      const testError = new Error('Start failed')
      vi.mocked(apiStartSession).mockRejectedValue(testError)

      const store = useSessionStore()
      const originalSession = createSession({ id: 1 as EntityId, status: 'not_started' })
      store.sessions = [originalSession]

      await expect(store.startSession(1 as EntityId)).rejects.toThrow(testError)

      expect(store.sessions[0]).toEqual(originalSession)
      expect(store.loading).toBe(false)
    })

    it('endSession API failure preserves state', async () => {
      const testError = new Error('End failed')
      vi.mocked(apiEndSession).mockRejectedValue(testError)

      const store = useSessionStore()
      const originalSession = createSession({ id: 1 as EntityId, status: 'active' })
      store.sessions = [originalSession]

      await expect(store.endSession(1 as EntityId)).rejects.toThrow(testError)

      expect(store.sessions[0]).toEqual(originalSession)
      expect(store.loading).toBe(false)
    })

    it('deleteSession API failure preserves state', async () => {
      const testError = new Error('Delete failed')
      vi.mocked(apiDeleteSession).mockRejectedValue(testError)

      const store = useSessionStore()
      const originalSessions = [
        createSession({ id: 1 as EntityId, status: 'not_started' }),
        createSession({ id: 2 as EntityId, status: 'not_started' }),
      ]
      store.sessions = [...originalSessions]

      await expect(store.deleteSession(1 as EntityId)).rejects.toThrow(testError)

      expect(store.sessions).toEqual(originalSessions)
      expect(store.loading).toBe(false)
    })

    it('updateSessionRoom API failure preserves state', async () => {
      const testError = new Error('Update failed')
      vi.mocked(apiUpdateSessionRoom).mockRejectedValue(testError)

      const store = useSessionStore()
      const originalSession = createSession({ id: 1 as EntityId, status: 'active', actualRoomId: 101 })
      store.sessions = [originalSession]

      const payload: UpdateSessionRoomPayload = { actualRoomId: 202 }
      await expect(store.updateSessionRoom(1 as EntityId, payload)).rejects.toThrow(testError)

      expect(store.sessions[0]).toEqual(originalSession)
      expect(store.loading).toBe(false)
    })

    it('absent-local-session edge case: success returns API result without corrupting sessions', async () => {
      const updatedSession = createSession({ id: 99 as EntityId, status: 'active' })
      vi.mocked(apiStartSession).mockResolvedValue(updatedSession as never)

      const store = useSessionStore()
      store.sessions = [createSession({ id: 1 as EntityId, status: 'not_started' })]

      const result = await store.startSession(99 as EntityId)

      expect(result).toEqual(updatedSession)
      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe(1 as EntityId)
      expect(store.loading).toBe(false)
    })
  })
})
