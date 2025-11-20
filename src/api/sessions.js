import api from '@/api'

/**
 * Session API service for managing class sessions
 *
 * This module provides functions for all session lifecycle operations
 * and read operations. All functions return promises and handle errors
 * through axios interceptors.
 *
 * @module api/sessions
 */

// ==================== READ OPERATIONS ====================
// All read operations require authentication but no special role

/**
 * Fetch all sessions
 *
 * Returns all sessions accessible to the current user (filtered by role on backend).
 * Instructors see their assigned sessions, admins see all sessions.
 *
 * @returns {Promise<Array<SessionResponseDto>>} Array of session objects
 * @throws {Error} Network or authentication errors
 *
 * @example
 * const sessions = await fetchSessions()
 * console.log(`Found ${sessions.length} sessions`)
 */
export async function fetchSessions() {
  const response = await api.get('/sessions')
  return response.data
}

/**
 * Fetch a single session by ID
 *
 * @param {number} sessionId - Session ID
 * @returns {Promise<SessionResponseDto>} Session object
 * @throws {Error} 404 if session not found, 403 if not authorized
 *
 * @example
 * const session = await fetchSessionById(123)
 * console.log(`Session status: ${session.status}`)
 */
export async function fetchSessionById(sessionId) {
  const response = await api.get(`/sessions/${sessionId}`)
  return response.data
}

/**
 * Fetch all sessions for a specific schedule
 *
 * Useful for displaying all past and upcoming sessions for a particular class.
 *
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Array<SessionResponseDto>>} Array of session objects
 * @throws {Error} 404 if schedule not found
 *
 * @example
 * const sessions = await fetchSessionsBySchedule(456)
 * const upcoming = sessions.filter(s => s.status === 'not_started')
 */
export async function fetchSessionsBySchedule(scheduleId) {
  const response = await api.get(`/sessions/schedule/${scheduleId}`)
  return response.data
}

/**
 * Fetch sessions by status
 *
 * Filter sessions by their current lifecycle status.
 *
 * @param {('not_started'|'active'|'ended'|'cancelled')} status - Session status
 * @returns {Promise<Array<SessionResponseDto>>} Array of session objects
 * @throws {Error} 400 if invalid status provided
 *
 * @example
 * const activeSessions = await fetchSessionsByStatus('active')
 * activeSessions.forEach(s => console.log(`Active: ${s.subjectName}`))
 */
export async function fetchSessionsByStatus(status) {
  const response = await api.get(`/sessions/status/${status}`)
  return response.data
}

/**
 * Fetch sessions for a specific date
 *
 * Returns all sessions scheduled for the given date, regardless of status.
 *
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array<SessionResponseDto>>} Array of session objects
 * @throws {Error} 400 if invalid date format
 *
 * @example
 * const today = new Date().toISOString().split('T')[0]
 * const todaySessions = await fetchSessionsByDate(today)
 */
export async function fetchSessionsByDate(date) {
  const response = await api.get(`/sessions/date/${date}`)
  return response.data
}

// ==================== LIFECYCLE OPERATIONS ====================
// All lifecycle operations require InstructorPolicy authorization

/**
 * Create a new session
 *
 * Creates a session for the specified schedule. The instructor must be
 * assigned to the schedule. Only one session per schedule per date is allowed.
 *
 * @param {CreateSessionPayload} payload - Session creation data
 * @param {number} payload.scheduleId - Schedule ID (required)
 * @param {string} [payload.sessionDate] - Session date (optional, defaults to current date)
 * @param {string} [payload.description] - Session description (optional, max 500 chars)
 * @returns {Promise<SessionResponseDto>} Created session object with status 'not_started'
 * @throws {Error} 403 if not instructor, 400 if duplicate session or invalid schedule
 *
 * @example
 * const newSession = await createSession({
 *   scheduleId: 789,
 *   sessionDate: '2024-03-15',
 *   description: 'Introduction to Arrays'
 * })
 * console.log(`Created session ${newSession.id}`)
 */
export async function createSession(payload) {
  const response = await api.post('/sessions', payload)
  return response.data
}

/**
 * Start a session
 *
 * Marks a session as active and begins attendance tracking. Only sessions
 * in 'not_started' status can be started. Only the assigned instructor can
 * start a session.
 *
 * @param {number} sessionId - Session ID
 * @param {StartSessionPayload} [payload] - Start session options
 * @param {number} [payload.actualRoomId] - Actual room ID if different from scheduled
 * @param {number} [payload.attendanceCutoffMinutes] - Minutes after start for late cutoff (0-120)
 * @returns {Promise<SessionResponseDto>} Updated session object with status 'active'
 * @throws {Error} 403 if not assigned instructor, 400 if not in 'not_started' status
 *
 * @example
 * // Start with default cutoff (15 minutes)
 * const started = await startSession(123)
 *
 * // Start in different room with custom cutoff
 * const started = await startSession(123, {
 *   actualRoomId: 505,
 *   attendanceCutoffMinutes: 20
 * })
 */
export async function startSession(sessionId, payload = {}) {
  const response = await api.patch(`/sessions/${sessionId}/start`, payload)
  return response.data
}

/**
 * End a session
 *
 * Marks a session as ended and stops attendance tracking. Only sessions
 * in 'active' status can be ended. Only the assigned instructor can end
 * a session.
 *
 * @param {number} sessionId - Session ID
 * @param {EndSessionPayload} [payload] - End session options
 * @param {string} [payload.description] - Completion notes (optional, max 500 chars)
 * @returns {Promise<SessionResponseDto>} Updated session object with status 'ended'
 * @throws {Error} 403 if not assigned instructor, 400 if not in 'active' status
 *
 * @example
 * const ended = await endSession(123, {
 *   description: 'Covered chapters 1-3. Quiz next week.'
 * })
 */
export async function endSession(sessionId, payload = {}) {
  const response = await api.patch(`/sessions/${sessionId}/end`, payload)
  return response.data
}

/**
 * Delete/cancel a session
 *
 * Cancels a session that hasn't started yet. Only sessions in 'not_started'
 * status can be deleted. Once a session is started, it cannot be deleted,
 * only ended. Only the assigned instructor can delete a session.
 *
 * @param {number} sessionId - Session ID
 * @returns {Promise<SessionResponseDto>} Cancelled session object with status 'cancelled'
 * @throws {Error} 403 if not assigned instructor, 400 if not in 'not_started' status
 *
 * @example
 * await deleteSession(123)
 * console.log('Session cancelled successfully')
 */
export async function deleteSession(sessionId) {
  const response = await api.delete(`/sessions/${sessionId}`)
  return response.data
}

/**
 * Update session room
 *
 * Changes the actual room where an active session is being held.
 * Can only be updated for sessions in 'active' status. Only the
 * assigned instructor can update the room.
 *
 * @param {number} sessionId - Session ID
 * @param {UpdateSessionRoomPayload} payload - Room update data
 * @param {number} payload.actualRoomId - New room ID (required)
 * @returns {Promise<SessionResponseDto>} Updated session object
 * @throws {Error} 403 if not assigned instructor, 400 if not in 'active' status or invalid room
 *
 * @example
 * const updated = await updateSessionRoom(123, {
 *   actualRoomId: 606
 * })
 * console.log(`Room changed to ${updated.actualRoomName}`)
 */
export async function updateSessionRoom(sessionId, payload) {
  const response = await api.patch(`/sessions/${sessionId}/room`, payload)
  return response.data
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date to YYYY-MM-DD format for API
 *
 * Converts Date objects or ISO strings to the format expected by the API.
 *
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string (YYYY-MM-DD)
 *
 * @example
 * const formatted = formatDateForApi(new Date())
 * // Returns: "2024-03-15"
 *
 * const formatted = formatDateForApi("2024-03-15T10:30:00Z")
 * // Returns: "2024-03-15"
 */
export function formatDateForApi(date) {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0]
  }
  return date
}

/**
 * Validate session status value
 *
 * Checks if a status string is one of the valid session statuses.
 *
 * @param {string} status - Status to validate
 * @returns {boolean} Whether status is valid
 *
 * @example
 * isValidStatus('active')  // true
 * isValidStatus('pending') // false
 */
export function isValidStatus(status) {
  return ['not_started', 'active', 'ended', 'cancelled'].includes(status)
}

/**
 * Check if session can be started
 *
 * Client-side validation before calling startSession API.
 *
 * @param {SessionResponseDto} session - Session object
 * @returns {boolean} Whether session can be started
 *
 * @example
 * if (canStartSession(session)) {
 *   await startSession(session.id)
 * }
 */
export function canStartSession(session) {
  return session && session.status === 'not_started'
}

/**
 * Check if session can be ended
 *
 * Client-side validation before calling endSession API.
 *
 * @param {SessionResponseDto} session - Session object
 * @returns {boolean} Whether session can be ended
 */
export function canEndSession(session) {
  return session && session.status === 'active'
}

/**
 * Check if session can be deleted
 *
 * Client-side validation before calling deleteSession API.
 *
 * @param {SessionResponseDto} session - Session object
 * @returns {boolean} Whether session can be deleted
 */
export function canDeleteSession(session) {
  return session && session.status === 'not_started'
}

/**
 * Check if session room can be updated
 *
 * Client-side validation before calling updateSessionRoom API.
 *
 * @param {SessionResponseDto} session - Session object
 * @returns {boolean} Whether session room can be updated
 */
export function canUpdateRoom(session) {
  return session && session.status === 'active'
}

/**
 * Calculate session duration in minutes
 *
 * Returns the duration of a session if it has both start and end times.
 *
 * @param {SessionResponseDto} session - Session object
 * @returns {number|null} Duration in minutes, or null if not ended
 *
 * @example
 * const duration = calculateSessionDuration(session)
 * if (duration) {
 *   console.log(`Session lasted ${duration} minutes`)
 * }
 */
export function calculateSessionDuration(session) {
  if (!session?.actualStartTime || !session?.actualEndTime) {
    return null
  }
  const start = new Date(session.actualStartTime)
  const end = new Date(session.actualEndTime)
  return Math.round((end - start) / 1000 / 60)
}

/**
 * Get session display name
 *
 * Returns a friendly display name for a session.
 *
 * @param {SessionResponseDto} session - Session object
 * @returns {string} Display name
 *
 * @example
 * const name = getSessionDisplayName(session)
 * // Returns: "CS101 - Data Structures (Section A)"
 */
export function getSessionDisplayName(session) {
  if (!session)
    return 'Unknown Session'

  const parts = []
  if (session.subjectCode)
    parts.push(session.subjectCode)
  if (session.subjectName)
    parts.push(session.subjectName)
  if (session.sectionName)
    parts.push(`(${session.sectionName})`)

  return parts.join(' - ') || `Session ${session.id}`
}
