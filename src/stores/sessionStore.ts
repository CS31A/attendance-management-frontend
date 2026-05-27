import type {
  CreateSessionPayload,
  DeleteSessionPayload,
  EndSessionPayload,
  SessionResponseDto,
  StartSessionPayload,
  UpdateSessionRoomPayload,
} from '@/api/sessions'
import type { EntityId } from '@/types'
import type { SessionStatus } from '@/utils/constants'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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
import { entityIdsMatch } from '@/utils/entityId'
import { isSessionScheduledForToday } from '@/utils/sessionDateHelpers'
import { useLoadingState } from '@/composables/useLoadingState'

/**
 * Session Store
 *
 * Manages session lifecycle state, including create, start, end, and room updates.
 * Error handling is delegated to components for flexible UI feedback.
 *
 * @typedef {object} SessionState
 * @property {Array} sessions - Array of session objects
 * @property {boolean} loading - Whether sessions are being fetched
 * @property {object | null} currentSession - Currently selected session for details
 */
export const useSessionStore = defineStore('sessionStore', () => {
  // ==================== STATE ====================

  /** @type {import('vue').Ref<Array>} */
  const sessions = ref<SessionResponseDto[]>([])

  const { loading, withLoading, resetLoading } = useLoadingState()

  /** @type {import('vue').Ref<object | null>} */
  const currentSession = ref<SessionResponseDto | null>(null)

  // ==================== GETTERS ====================

  /**
   * Get sessions filtered by status
   * @param {string} status - Session status ('not_started' | 'active' | 'ended' | 'cancelled')
   * @returns {Array} Filtered sessions
   */
  const sessionsByStatus = computed(() => (status: SessionStatus) => {
    return sessions.value.filter(session => session.status === status)
  })

  /**
   * Get all not started sessions
   * @returns {Array} Not started sessions
   */
  const notStartedSessions = computed(() => {
    return sessions.value.filter(session => session.status === 'not_started')
  })

  /**
   * Get all active sessions
   * @returns {Array} Active sessions
   */
  const activeSessions = computed(() => {
    return sessions.value.filter(session => session.status === 'active')
  })

  /**
   * Get all ended sessions
   * @returns {Array} Ended sessions
   */
  const endedSessions = computed(() => {
    return sessions.value.filter(session => session.status === 'ended')
  })

  /**
   * Get all cancelled sessions
   * @returns {Array} Cancelled sessions
   */
  const cancelledSessions = computed(() => {
    return sessions.value.filter(session => session.status === 'cancelled')
  })

  /**
   * Get upcoming sessions (not started, sorted by date)
   * @returns {Array} Upcoming sessions
   */
  const upcomingSessions = computed(() => {
    return sessions.value
      .filter(session => session.status === 'not_started')
      .sort((a, b) => {
        const left = new Date(`${a.sessionDate ?? ''}Z`).getTime()
        const right = new Date(`${b.sessionDate ?? ''}Z`).getTime()
        return left - right
      })
  })

  /**
   * Get completed sessions (ended or cancelled, sorted by date descending)
   * @returns {Array} Completed sessions
   */
  const completedSessions = computed(() => {
    return sessions.value
      .filter(session => session.status === 'ended' || session.status === 'cancelled')
      .sort((a, b) => {
        const left = new Date(`${b.sessionDate ?? ''}Z`).getTime()
        const right = new Date(`${a.sessionDate ?? ''}Z`).getTime()
        return left - right
      })
  })

  /**
   * Get session by ID from local state
   * @param {number} sessionId - Session ID
   * @returns {object | undefined} Session object
   */
  const getSessionById = computed(() => (sessionId: EntityId) => {
    return sessions.value.find(session => entityIdsMatch(session.id, sessionId))
  })

  // ==================== ACTIONS ====================

  /**
   * Fetch sessions for the current instructor
   * Uses instructor-scoped endpoint for instructor views
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessions = async () => {
    return withLoading(async () => {
      const data = await apiFetchMySessions()
      sessions.value = data
      return data
    }, err => console.error('Failed to fetch sessions:', err))
  }

  /**
   * Fetch a single session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<object>} Session object
   */
  const fetchSessionById = async (sessionId: EntityId) => {
    return withLoading(async () => {
      const data = await apiFetchSessionById(sessionId)
      currentSession.value = data

      // Update in sessions array if it exists, otherwise push it
      const index = sessions.value.findIndex(s => entityIdsMatch(s.id, sessionId))
      if (index !== -1) {
        sessions.value[index] = data
      }
      else {
        sessions.value.push(data)
      }

      return data
    }, err => console.error('Failed to fetch session:', err))
  }

  /**
   * Fetch sessions for a specific schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsBySchedule = async (scheduleId: EntityId) => {
    return withLoading(async () => {
      const data = await apiFetchSessionsBySchedule(scheduleId)
      return data
    }, err => console.error('Failed to fetch sessions by schedule:', err))
  }

  /**
   * Fetch sessions by status
   * @param {string} status - Session status
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsByStatusApi = async (status: SessionStatus) => {
    return withLoading(async () => {
      const data = await apiFetchSessionsByStatus(status)
      return data
    }, err => console.error('Failed to fetch sessions by status:', err))
  }

  /**
   * Fetch sessions for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsByDate = async (date: string) => {
    return withLoading(async () => {
      const data = await apiFetchSessionsByDate(date)
      return data
    }, err => console.error('Failed to fetch sessions by date:', err))
  }

  /**
   * Create a new session
   * @param {object} payload - Session creation data
   * @param {number} payload.scheduleId - Schedule ID
   * @param {string} [payload.sessionDate] - Session date (optional)
   * @param {string} [payload.description] - Session description (optional)
   * @returns {Promise<object>} Created session object
   * @throws {Error} 403 if not instructor, 400 if business rule violated
   */
  const createSession = async (payload: CreateSessionPayload) => {
    return withLoading(async () => {
      const newSession = await apiCreateSession(payload)

      // Add to local state
      sessions.value.push(newSession)

      return newSession
    }, err => console.error('Failed to create session:', err))
  }

  /**
   * Start a session
   * @param {number} sessionId - Session ID
   * @param {object} [payload] - Start session options
   * @param {number} [payload.actualRoomId] - Actual room ID
   * @param {number} [payload.attendanceCutoffMinutes] - Cutoff minutes
   * @returns {Promise<object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const startSession = async (
    sessionId: EntityId,
    payload: Omit<StartSessionPayload, 'rowVersion'> = {},
  ) => {
    // Store original state for rollback
    const originalSession = sessions.value.find(s => entityIdsMatch(s.id, sessionId))
    const originalSessionSnapshot = originalSession ? { ...originalSession } : null
    const originalCurrentSession = currentSession.value
    const sessionIndex = sessions.value.findIndex(s => entityIdsMatch(s.id, sessionId))

    return withLoading(async () => {
      try {
        // Client-side validation
        if (originalSessionSnapshot && originalSessionSnapshot.status !== 'not_started') {
          throw new Error('Only sessions in "not_started" status can be started')
        }

        if (originalSessionSnapshot && !isSessionScheduledForToday(originalSessionSnapshot)) {
          throw new Error('Session can only be started on its scheduled date')
        }

        const rowVersion = requireSessionRowVersion(originalSessionSnapshot, 'start')
        const updatedSession = await apiStartSession(sessionId, { ...payload, rowVersion })

        // Update local state
        if (sessionIndex !== -1) {
          sessions.value[sessionIndex] = updatedSession
        }
        if (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId)) {
          currentSession.value = updatedSession
        }

        return updatedSession
      }
      catch (err) {
        console.error('Failed to start session:', err)

        // Rollback optimistic update if any
        if (sessionIndex !== -1 && originalSessionSnapshot) {
          sessions.value[sessionIndex] = originalSessionSnapshot
        }
        if ((originalCurrentSession && entityIdsMatch(originalCurrentSession.id, sessionId)) || (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId))) {
          currentSession.value = originalCurrentSession
        }

        throw err
      }
    })
  }

  /**
   * End a session
   * @param {number} sessionId - Session ID
   * @param {object} [payload] - End session options
   * @param {string} [payload.description] - Completion notes
   * @returns {Promise<object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const endSession = async (sessionId: EntityId, payload: Omit<EndSessionPayload, 'rowVersion'> = {}) => {
    // Store original state for rollback
    const originalSession = sessions.value.find(s => entityIdsMatch(s.id, sessionId))
    const originalSessionSnapshot = originalSession ? { ...originalSession } : null
    const originalCurrentSession = currentSession.value
    const sessionIndex = sessions.value.findIndex(s => entityIdsMatch(s.id, sessionId))

    return withLoading(async () => {
      try {
        // Client-side validation
        if (originalSessionSnapshot && originalSessionSnapshot.status !== 'active') {
          throw new Error('Only active sessions can be ended')
        }

        const rowVersion = requireSessionRowVersion(originalSessionSnapshot, 'end')
        const updatedSession = await apiEndSession(sessionId, { ...payload, rowVersion })

        // Update local state
        if (sessionIndex !== -1) {
          sessions.value[sessionIndex] = updatedSession
        }
        if (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId)) {
          currentSession.value = updatedSession
        }

        return updatedSession
      }
      catch (err) {
        console.error('Failed to end session:', err)

        // Rollback optimistic update if any
        if (sessionIndex !== -1 && originalSessionSnapshot) {
          sessions.value[sessionIndex] = originalSessionSnapshot
        }
        if ((originalCurrentSession && entityIdsMatch(originalCurrentSession.id, sessionId)) || (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId))) {
          currentSession.value = originalCurrentSession
        }

        throw err
      }
    })
  }

  /**
   * Delete/cancel a session
   * @param {number} sessionId - Session ID
   * @param {string} reason - Reason for cancelling the session
   * @returns {Promise<void>}
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const deleteSession = async (sessionId: EntityId, reason: string) => {
    // Store original state for rollback
    const originalSessions = [...sessions.value]
    const originalSession = sessions.value.find(s => entityIdsMatch(s.id, sessionId))
    const originalCurrentSession = currentSession.value
    const sessionIndex = sessions.value.findIndex(s => entityIdsMatch(s.id, sessionId))

    return withLoading(async () => {
      try {
        // Client-side validation
        if (originalSession && originalSession.status !== 'not_started') {
          throw new Error('Only sessions in "not_started" status can be deleted')
        }

        const payload: DeleteSessionPayload = {
          reason,
          rowVersion: requireSessionRowVersion(originalSession, 'cancel'),
        }
        const updatedSession = await apiDeleteSession(sessionId, payload)

        if (sessionIndex !== -1) {
          sessions.value[sessionIndex] = updatedSession
        }
        if (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId)) {
          currentSession.value = updatedSession
        }

        return updatedSession
      }
      catch (err) {
        console.error('Failed to delete session:', err)

        // Rollback optimistic update
        sessions.value = originalSessions
        if ((originalCurrentSession && entityIdsMatch(originalCurrentSession.id, sessionId)) || (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId))) {
          currentSession.value = originalCurrentSession
        }

        throw err
      }
    })
  }

  /**
   * Update session room
   * @param {number} sessionId - Session ID
   * @param {object} payload - Room update data
   * @param {number} payload.actualRoomId - New room ID
   * @returns {Promise<object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status or room
   */
  const updateSessionRoom = async (
    sessionId: EntityId,
    payload: Omit<UpdateSessionRoomPayload, 'rowVersion'>,
  ) => {
    // Store original state for rollback
    const originalSession = sessions.value.find(s => entityIdsMatch(s.id, sessionId))
    const originalSessionSnapshot = originalSession ? { ...originalSession } : null
    const originalCurrentSession = currentSession.value
    const sessionIndex = sessions.value.findIndex(s => entityIdsMatch(s.id, sessionId))

    return withLoading(async () => {
      try {
        // Client-side validation
        if (originalSessionSnapshot && originalSessionSnapshot.status !== 'active') {
          throw new Error('Room can only be updated for active sessions')
        }

        const rowVersion = requireSessionRowVersion(originalSessionSnapshot, 'update the room for')
        const updatedSession = await apiUpdateSessionRoom(sessionId, { ...payload, rowVersion })

        // Update local state
        if (sessionIndex !== -1) {
          sessions.value[sessionIndex] = updatedSession
        }
        if (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId)) {
          currentSession.value = updatedSession
        }

        return updatedSession
      }
      catch (err) {
        console.error('Failed to update session room:', err)

        // Rollback optimistic update if any
        if (sessionIndex !== -1 && originalSessionSnapshot) {
          sessions.value[sessionIndex] = originalSessionSnapshot
        }
        if ((originalCurrentSession && entityIdsMatch(originalCurrentSession.id, sessionId)) || (currentSession.value && entityIdsMatch(currentSession.value.id, sessionId))) {
          currentSession.value = originalCurrentSession
        }

        throw err
      }
    })
  }

  /**
   * Clear current session
   */
  const clearCurrentSession = () => {
    currentSession.value = null
  }

  /**
   * Reset store to initial state
   */
  const resetStore = () => {
    sessions.value = []
    resetLoading()
    currentSession.value = null
  }

  function requireSessionRowVersion(
    session: SessionResponseDto | null | undefined,
    action: string,
  ): string {
    if (!session?.rowVersion) {
      throw new Error(`Cannot ${action} this session without a rowVersion token`)
    }

    return session.rowVersion
  }

  // ==================== RETURN ====================

  return {
    // State
    sessions,
    loading,
    currentSession,

    // Getters
    sessionsByStatus,
    notStartedSessions,
    activeSessions,
    endedSessions,
    cancelledSessions,
    upcomingSessions,
    completedSessions,
    getSessionById,

    // Actions
    fetchSessions,
    fetchSessionById,
    fetchSessionsBySchedule,
    fetchSessionsByStatusApi,
    fetchSessionsByDate,
    createSession,
    startSession,
    endSession,
    deleteSession,
    updateSessionRoom,
    clearCurrentSession,
    resetStore,
  }
})
