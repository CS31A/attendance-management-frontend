import type {
  CreateSessionPayload,
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
import { isSessionScheduledForToday } from '@/utils/sessionDateHelpers'

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

  /** @type {import('vue').Ref<boolean>} */
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)

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
    return sessions.value.find(session => session.id === sessionId)
  })

  function beginLoading() {
    loadingCount.value += 1
  }

  function endLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  // ==================== ACTIONS ====================

  /**
   * Fetch sessions for the current instructor
   * Uses instructor-scoped endpoint for instructor views
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessions = async () => {
    beginLoading()

    try {
      const data = await apiFetchMySessions()
      sessions.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch sessions:', err)
      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * Fetch a single session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<object>} Session object
   */
  const fetchSessionById = async (sessionId: EntityId) => {
    beginLoading()

    try {
      const data = await apiFetchSessionById(sessionId)
      currentSession.value = data

      // Update in sessions array if it exists
      const index = sessions.value.findIndex(s => s.id === sessionId)
      if (index !== -1) {
        sessions.value[index] = data
      }
      else {
        sessions.value.push(data)
      }

      return data
    }
    catch (err) {
      console.error('Failed to fetch session:', err)
      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * Fetch sessions for a specific schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsBySchedule = async (scheduleId: EntityId) => {
    beginLoading()

    try {
      const data = await apiFetchSessionsBySchedule(scheduleId)
      return data
    }
    catch (err) {
      console.error('Failed to fetch sessions by schedule:', err)
      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * Fetch sessions by status
   * @param {string} status - Session status
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsByStatusApi = async (status: SessionStatus) => {
    beginLoading()

    try {
      const data = await apiFetchSessionsByStatus(status)
      return data
    }
    catch (err) {
      console.error('Failed to fetch sessions by status:', err)
      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * Fetch sessions for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsByDate = async (date: string) => {
    beginLoading()

    try {
      const data = await apiFetchSessionsByDate(date)
      return data
    }
    catch (err) {
      console.error('Failed to fetch sessions by date:', err)
      throw err
    }
    finally {
      endLoading()
    }
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
    beginLoading()

    try {
      const newSession = await apiCreateSession(payload)

      // Add to local state
      sessions.value.push(newSession)

      return newSession
    }
    catch (err) {
      console.error('Failed to create session:', err)
      throw err
    }
    finally {
      endLoading()
    }
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
    payload: StartSessionPayload = {},
  ) => {
    beginLoading()

    // Store original state for rollback
    const originalSession = sessions.value.find(s => s.id === sessionId)
    const originalSessionSnapshot = originalSession ? { ...originalSession } : null
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)

    try {
      // Client-side validation
      if (originalSessionSnapshot && originalSessionSnapshot.status !== 'not_started') {
        throw new Error('Only sessions in "not_started" status can be started')
      }

      if (originalSessionSnapshot && !isSessionScheduledForToday(originalSessionSnapshot)) {
        throw new Error('Session can only be started on its scheduled date')
      }

      const updatedSession = await apiStartSession(sessionId, payload)

      // Update local state
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex] = updatedSession
      }

      return updatedSession
    }
    catch (err) {
      console.error('Failed to start session:', err)

      // Rollback optimistic update if any
      if (sessionIndex !== -1 && originalSessionSnapshot) {
        sessions.value[sessionIndex] = originalSessionSnapshot
      }

      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * End a session
   * @param {number} sessionId - Session ID
   * @param {object} [payload] - End session options
   * @param {string} [payload.description] - Completion notes
   * @returns {Promise<object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const endSession = async (sessionId: EntityId, payload: EndSessionPayload = {}) => {
    beginLoading()

    // Store original state for rollback
    const originalSession = sessions.value.find(s => s.id === sessionId)
    const originalSessionSnapshot = originalSession ? { ...originalSession } : null
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)

    try {
      // Client-side validation
      if (originalSessionSnapshot && originalSessionSnapshot.status !== 'active') {
        throw new Error('Only active sessions can be ended')
      }

      const updatedSession = await apiEndSession(sessionId, payload)

      // Update local state
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex] = updatedSession
      }

      return updatedSession
    }
    catch (err) {
      console.error('Failed to end session:', err)

      // Rollback optimistic update if any
      if (sessionIndex !== -1 && originalSessionSnapshot) {
        sessions.value[sessionIndex] = originalSessionSnapshot
      }

      throw err
    }
    finally {
      endLoading()
    }
  }

  /**
   * Delete/cancel a session
   * @param {number} sessionId - Session ID
   * @param {string} reason - Reason for cancelling the session
   * @returns {Promise<void>}
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const deleteSession = async (sessionId: EntityId, reason: string) => {
    beginLoading()

    // Store original state for rollback
    const originalSessions = [...sessions.value]
    const session = sessions.value.find(s => s.id === sessionId)

    try {
      // Client-side validation
      if (session && session.status !== 'not_started') {
        throw new Error('Only sessions in "not_started" status can be deleted')
      }

      await apiDeleteSession(sessionId, reason)

      // Remove from local state
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
    }
    catch (err) {
      console.error('Failed to delete session:', err)

      // Rollback optimistic update
      sessions.value = originalSessions

      throw err
    }
    finally {
      endLoading()
    }
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
    payload: UpdateSessionRoomPayload,
  ) => {
    beginLoading()

    // Store original state for rollback
    const originalSession = sessions.value.find(s => s.id === sessionId)
    const originalSessionSnapshot = originalSession ? { ...originalSession } : null
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)

    try {
      // Client-side validation
      if (originalSessionSnapshot && originalSessionSnapshot.status !== 'active') {
        throw new Error('Room can only be updated for active sessions')
      }

      const updatedSession = await apiUpdateSessionRoom(sessionId, payload)

      // Update local state
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex] = updatedSession
      }

      return updatedSession
    }
    catch (err) {
      console.error('Failed to update session room:', err)

      // Rollback optimistic update if any
      if (sessionIndex !== -1 && originalSessionSnapshot) {
        sessions.value[sessionIndex] = originalSessionSnapshot
      }

      throw err
    }
    finally {
      endLoading()
    }
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
    loadingCount.value = 0
    currentSession.value = null
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
