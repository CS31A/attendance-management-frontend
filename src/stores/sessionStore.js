import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchSessions as apiFetchSessions,
  fetchSessionById as apiFetchSessionById,
  fetchSessionsBySchedule as apiFetchSessionsBySchedule,
  fetchSessionsByStatus as apiFetchSessionsByStatus,
  fetchSessionsByDate as apiFetchSessionsByDate,
  createSession as apiCreateSession,
  startSession as apiStartSession,
  endSession as apiEndSession,
  deleteSession as apiDeleteSession,
  updateSessionRoom as apiUpdateSessionRoom
} from '@/api/sessions.js'

/**
 * Session Store
 *
 * Manages session lifecycle state, including create, start, end, and room updates.
 * Error handling is delegated to components for flexible UI feedback.
 *
 * @typedef {Object} SessionState
 * @property {Array} sessions - Array of session objects
 * @property {boolean} loading - Whether sessions are being fetched
 * @property {Object|null} currentSession - Currently selected session for details
 */
export const useSessionStore = defineStore('sessionStore', () => {
  // ==================== STATE ====================

  /** @type {import('vue').Ref<Array>} */
  const sessions = ref([])

  /** @type {import('vue').Ref<boolean>} */
  const loading = ref(false)

  /** @type {import('vue').Ref<Object|null>} */
  const currentSession = ref(null)

  // ==================== GETTERS ====================

  /**
   * Get sessions filtered by status
   * @param {string} status - Session status ('not_started' | 'active' | 'ended' | 'cancelled')
   * @returns {Array} Filtered sessions
   */
  const sessionsByStatus = computed(() => (status) => {
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
      .sort((a, b) => new Date(a.sessionDate) - new Date(b.sessionDate))
  })

  /**
   * Get completed sessions (ended or cancelled, sorted by date descending)
   * @returns {Array} Completed sessions
   */
  const completedSessions = computed(() => {
    return sessions.value
      .filter(session => session.status === 'ended' || session.status === 'cancelled')
      .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
  })

  /**
   * Get session by ID from local state
   * @param {number} sessionId - Session ID
   * @returns {Object|undefined} Session object
   */
  const getSessionById = computed(() => (sessionId) => {
    return sessions.value.find(session => session.id === sessionId)
  })

  // ==================== ACTIONS ====================

  /**
   * Fetch all sessions
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessions = async () => {
    loading.value = true

    try {
      const data = await apiFetchSessions()
      sessions.value = data
      return data
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single session by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<Object>} Session object
   */
  const fetchSessionById = async (sessionId) => {
    loading.value = true

    try {
      const data = await apiFetchSessionById(sessionId)
      currentSession.value = data

      // Update in sessions array if it exists
      const index = sessions.value.findIndex(s => s.id === sessionId)
      if (index !== -1) {
        sessions.value[index] = data
      } else {
        sessions.value.push(data)
      }

      return data
    } catch (err) {
      console.error('Failed to fetch session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch sessions for a specific schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsBySchedule = async (scheduleId) => {
    loading.value = true

    try {
      const data = await apiFetchSessionsBySchedule(scheduleId)
      return data
    } catch (err) {
      console.error('Failed to fetch sessions by schedule:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch sessions by status
   * @param {string} status - Session status
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsByStatusApi = async (status) => {
    loading.value = true

    try {
      const data = await apiFetchSessionsByStatus(status)
      return data
    } catch (err) {
      console.error('Failed to fetch sessions by status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch sessions for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of session objects
   */
  const fetchSessionsByDate = async (date) => {
    loading.value = true

    try {
      const data = await apiFetchSessionsByDate(date)
      return data
    } catch (err) {
      console.error('Failed to fetch sessions by date:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new session
   * @param {Object} payload - Session creation data
   * @param {number} payload.scheduleId - Schedule ID
   * @param {string} [payload.sessionDate] - Session date (optional)
   * @param {string} [payload.description] - Session description (optional)
   * @returns {Promise<Object>} Created session object
   * @throws {Error} 403 if not instructor, 400 if business rule violated
   */
  const createSession = async (payload) => {
    loading.value = true

    try {
      const newSession = await apiCreateSession(payload)

      // Add to local state
      sessions.value.push(newSession)

      return newSession
    } catch (err) {
      console.error('Failed to create session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Start a session
   * @param {number} sessionId - Session ID
   * @param {Object} [payload={}] - Start session options
   * @param {number} [payload.actualRoomId] - Actual room ID
   * @param {number} [payload.attendanceCutoffMinutes] - Cutoff minutes
   * @returns {Promise<Object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const startSession = async (sessionId, payload = {}) => {
    loading.value = true

    // Store original state for rollback
    const originalSession = sessions.value.find(s => s.id === sessionId)
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)

    try {
      // Client-side validation
      if (originalSession && originalSession.status !== 'not_started') {
        throw new Error('Only sessions in "not_started" status can be started')
      }

      const updatedSession = await apiStartSession(sessionId, payload)

      // Update local state
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex] = updatedSession
      }

      return updatedSession
    } catch (err) {
      console.error('Failed to start session:', err)

      // Rollback optimistic update if any
      if (sessionIndex !== -1 && originalSession) {
        sessions.value[sessionIndex] = originalSession
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * End a session
   * @param {number} sessionId - Session ID
   * @param {Object} [payload={}] - End session options
   * @param {string} [payload.description] - Completion notes
   * @returns {Promise<Object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const endSession = async (sessionId, payload = {}) => {
    loading.value = true

    // Store original state for rollback
    const originalSession = sessions.value.find(s => s.id === sessionId)
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)

    try {
      // Client-side validation
      if (originalSession && originalSession.status !== 'active') {
        throw new Error('Only active sessions can be ended')
      }

      const updatedSession = await apiEndSession(sessionId, payload)

      // Update local state
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex] = updatedSession
      }

      return updatedSession
    } catch (err) {
      console.error('Failed to end session:', err)

      // Rollback optimistic update if any
      if (sessionIndex !== -1 && originalSession) {
        sessions.value[sessionIndex] = originalSession
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete/cancel a session
   * @param {number} sessionId - Session ID
   * @returns {Promise<void>}
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status
   */
  const deleteSession = async (sessionId) => {
    loading.value = true

    // Store original state for rollback
    const originalSessions = [...sessions.value]
    const session = sessions.value.find(s => s.id === sessionId)

    try {
      // Client-side validation
      if (session && session.status !== 'not_started') {
        throw new Error('Only sessions in "not_started" status can be deleted')
      }

      await apiDeleteSession(sessionId)

      // Remove from local state
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
    } catch (err) {
      console.error('Failed to delete session:', err)

      // Rollback optimistic update
      sessions.value = originalSessions

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update session room
   * @param {number} sessionId - Session ID
   * @param {Object} payload - Room update data
   * @param {number} payload.actualRoomId - New room ID
   * @returns {Promise<Object>} Updated session object
   * @throws {Error} 403 if not assigned instructor, 400 if invalid status or room
   */
  const updateSessionRoom = async (sessionId, payload) => {
    loading.value = true

    // Store original state for rollback
    const originalSession = sessions.value.find(s => s.id === sessionId)
    const sessionIndex = sessions.value.findIndex(s => s.id === sessionId)

    try {
      // Client-side validation
      if (originalSession && originalSession.status !== 'active') {
        throw new Error('Room can only be updated for active sessions')
      }

      const updatedSession = await apiUpdateSessionRoom(sessionId, payload)

      // Update local state
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex] = updatedSession
      }

      return updatedSession
    } catch (err) {
      console.error('Failed to update session room:', err)

      // Rollback optimistic update if any
      if (sessionIndex !== -1 && originalSession) {
        sessions.value[sessionIndex] = originalSession
      }

      throw err
    } finally {
      loading.value = false
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
    loading.value = false
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
    resetStore
  }
})
