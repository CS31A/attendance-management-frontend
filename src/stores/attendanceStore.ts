import type {
  AttendanceUpdateInput,
  BackendAttendanceStatus,
  AttendanceQueryParams,
  AttendanceResponseDto,
  AttendanceStatus,
  AttendanceSummaryDto,
  RecordAttendancePayload,
  SessionAttendanceResponseDto,
} from '@/api/attendance'
import type { EntityId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createAttendance as apiCreateAttendance,
  deleteAttendance as apiDeleteAttendance,
  fetchAllAttendance as apiFetchAllAttendance,
  fetchAttendanceById as apiFetchAttendanceById,
  fetchAttendanceSummary as apiFetchAttendanceSummary,
  fetchSessionAttendance as apiFetchSessionAttendance,
  fetchStudentAttendance as apiFetchStudentAttendance,
  updateAttendance as apiUpdateAttendance,
  calculateAttendanceStats,
} from '@/api/attendance'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorStatus } from '@/utils/httpError'
import { normalizeNotes } from '@/utils/attendanceRecord'

/**
 * Attendance Store
 *
 * Manages attendance state, including fetching, recording, and updating
 * attendance records. Error handling is delegated to components for flexible
 * UI feedback.
 *
 * @typedef {object} AttendanceState
 * @property {Array} attendanceRecords - Array of attendance record objects
 * @property {Array} sessionAttendance - Attendance records for current session
 * @property {boolean} loading - Whether attendance data is being fetched
 * @property {object | null} currentRecord - Currently selected attendance record
 * @property {object | null} summary - Attendance summary statistics
 */
export const useAttendanceStore = defineStore('attendanceStore', () => {
  // ==================== STATE ====================

  /** @type {import('vue').Ref<Array>} */
  const attendanceRecords = ref<AttendanceResponseDto[]>([])

  /** @type {import('vue').Ref<Array>} */
  const sessionAttendance = ref<SessionAttendanceResponseDto[]>([])

  /** @type {import('vue').Ref<boolean>} */
  const loading = ref(false)

  /** @type {import('vue').Ref<object | null>} */
  const currentRecord = ref<AttendanceResponseDto | null>(null)

  /** @type {import('vue').Ref<object | null>} */
  const summary = ref<AttendanceSummaryDto | null>(null)

  /** @type {import('vue').Ref<number | null>} */
  const currentSessionId = ref<EntityId | null>(null)

  /** @type {import('vue').Ref<string | null>} */
  const syncWarning = ref<string | null>(null)

  function clearSyncWarning() {
    syncWarning.value = null
  }

  function isCurrentSession(sessionId: EntityId) {
    return currentSessionId.value !== null && entityIdsMatch(sessionId, currentSessionId.value)
  }

  const attendanceStatusWriteMap: Record<AttendanceStatus, BackendAttendanceStatus> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
  }

  function mapAttendanceStatusForWrite(
    status: AttendanceStatus,
  ): BackendAttendanceStatus {
    return attendanceStatusWriteMap[status]
  }

  interface AttendanceSubmissionError extends Error {
    savedCount: number
    totalCount: number
    response?: unknown
  }

  function createAttendanceSubmissionError(
    error: unknown,
    savedCount: number,
    totalCount: number,
  ): AttendanceSubmissionError {
    const sourceError = error instanceof Error
      ? error
      : new Error('Failed to record attendance.')

    const enhancedError = new Error(sourceError.message, { cause: error }) as AttendanceSubmissionError
    enhancedError.name = sourceError.name
    enhancedError.savedCount = savedCount
    enhancedError.totalCount = totalCount

    if (error && typeof error === 'object' && 'response' in error) {
      enhancedError.response = (error as { response?: unknown }).response
    }

    return enhancedError
  }

  function applyAttendanceUpdates(records: AttendanceResponseDto[], allowInsert = false) {
    records.forEach((record) => {
      const indexById = sessionAttendance.value.findIndex(existing => entityIdsMatch(existing.id, record.id))
      if (indexById !== -1) {
        sessionAttendance.value[indexById] = {
          ...sessionAttendance.value[indexById],
          ...record,
        }
        return
      }

      const indexByStudent = sessionAttendance.value.findIndex(existing => entityIdsMatch(existing.studentId, record.studentId))
      if (indexByStudent !== -1) {
        sessionAttendance.value[indexByStudent] = {
          ...sessionAttendance.value[indexByStudent],
          ...record,
        }
        return
      }

      if (allowInsert) {
        sessionAttendance.value.push(record)
      }
    })
  }

  // Re-fetch keeps enriched student metadata (name/number/check-in) that mutation responses do not always include.
  async function refreshSessionAttendanceWithRetry(sessionId: EntityId, retries = 1): Promise<boolean> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const refreshedAttendance = await apiFetchSessionAttendance(sessionId)
        if (isCurrentSession(sessionId)) {
          sessionAttendance.value = refreshedAttendance
        }
        return true
      }
      catch (error) {
        console.error(`Failed to refresh session attendance (attempt ${attempt + 1}/${retries + 1}):`, error)
      }
    }

    return false
  }

  function refreshSessionAttendanceInBackground(sessionId: EntityId, warningMessage: string) {
    if (!isCurrentSession(sessionId)) {
      return
    }

    void refreshSessionAttendanceWithRetry(sessionId).then((refreshed) => {
      if (!refreshed && isCurrentSession(sessionId)) {
        syncWarning.value = warningMessage
      }
    })
  }

  // ==================== GETTERS ====================

  /**
   * Get attendance records filtered by status
   * @param {string} status - Attendance status ('present' | 'absent' | 'late' | 'excused')
   * @returns {Array} Filtered attendance records
   */
  const recordsByStatus = computed(() => (status: AttendanceStatus) => {
    return sessionAttendance.value.filter(record => record.status === status)
  })

  /**
   * Get all present students from current session
   * @returns {Array} Present attendance records
   */
  const presentRecords = computed(() => {
    return sessionAttendance.value.filter(record => record.status === 'present')
  })

  /**
   * Get all absent students from current session
   * @returns {Array} Absent attendance records
   */
  const absentRecords = computed(() => {
    return sessionAttendance.value.filter(record => record.status === 'absent')
  })

  /**
   * Get all late students from current session
   * @returns {Array} Late attendance records
   */
  const lateRecords = computed(() => {
    return sessionAttendance.value.filter(record => record.status === 'late')
  })

  /**
   * Get all excused students from current session
   * @returns {Array} Excused attendance records
   */
  const excusedRecords = computed(() => {
    return sessionAttendance.value.filter(record => record.status === 'excused')
  })

  /**
   * Get attendance statistics for current session
   * @returns {object} Statistics object with counts and percentages
   */
  const sessionStats = computed(() => {
    return calculateAttendanceStats(sessionAttendance.value)
  })

  /**
   * Get attendance record by student ID from current session
   * @param {number} studentId - Student ID
   * @returns {object | undefined} Attendance record
   */
  const getRecordByStudentId = computed(() => (studentId: EntityId) => {
    return sessionAttendance.value.find(record => entityIdsMatch(record.studentId, studentId))
  })

  /**
   * Check if current session has any attendance records
   * @returns {boolean} Whether session has attendance data
   */
  const hasAttendanceData = computed(() => {
    return sessionAttendance.value.length > 0
  })

  // ==================== ACTIONS ====================

  /**
   * Fetch all attendance records with optional filters
   * @param {object} [params] - Query parameters
   * @returns {Promise<Array>} Array of attendance records
   */
  const fetchAllAttendance = async (params: AttendanceQueryParams = {}) => {
    loading.value = true

    try {
      // Para sa skeleton loader simulation
      await new Promise(resolve => setTimeout(resolve, 500))

      const data = await apiFetchAllAttendance(params)
      attendanceRecords.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch attendance records:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single attendance record by ID
   * @param {number} id - Attendance record ID
   * @returns {Promise<object>} Attendance record
   */
  const fetchAttendanceById = async (id: EntityId) => {
    loading.value = true

    try {
      const data = await apiFetchAttendanceById(id)
      currentRecord.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch attendance record:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch attendance records for a specific session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Array>} Array of attendance records
   */
  const fetchSessionAttendance = async (sessionId: EntityId) => {
    loading.value = true
    currentSessionId.value = sessionId
    clearSyncWarning()

    try {
      // API returns attendanceRecords array directly (extracted in api layer)
      const data = await apiFetchSessionAttendance(sessionId)
      sessionAttendance.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch session attendance:', err)
      // If attendance doesn't exist yet (404), return empty array
      if (getErrorStatus(err) === 404) {
        sessionAttendance.value = []
        return []
      }
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch attendance records for a specific student
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Array of attendance records
   */
  const fetchStudentAttendance = async (studentId: EntityId) => {
    loading.value = true

    try {
      const data = await apiFetchStudentAttendance(studentId)
      return data
    }
    catch (err) {
      console.error('Failed to fetch student attendance:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch attendance summary statistics
   * @param {object} [params] - Query parameters
   * @returns {Promise<object>} Summary statistics
   */
  const fetchAttendanceSummary = async (params: AttendanceQueryParams = {}) => {
    loading.value = true

    try {
      const data = await apiFetchAttendanceSummary(params)
      summary.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch attendance summary:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Save attendance for a session (bulk create/update operation)
   * Existing records are updated by ID, while new records are created.
   * @param {object} payload - Attendance data
   * @param {number} payload.sessionId - Session ID
   * @param {Array} payload.records - Array of student attendance records
   * @returns {Promise<Array>} Created/updated attendance records
   */
  const submitAttendance = async (payload: RecordAttendancePayload) => {
    loading.value = true
    clearSyncWarning()
    const submittedRecords: AttendanceResponseDto[] = []

    try {
      for (const record of payload.records) {
        const normalizedNotes = normalizeNotes(record.notes)
        const backendStatus = mapAttendanceStatusForWrite(record.status)
        const existingRecordId = record.id

        const savedRecord = existingRecordId !== undefined && existingRecordId !== null
          ? await apiUpdateAttendance(existingRecordId, {
              status: backendStatus,
              notes: normalizedNotes,
            })
          : await apiCreateAttendance({
              sessionId: payload.sessionId,
              studentId: record.studentId,
              status: backendStatus,
              notes: normalizedNotes,
              ...(record.checkInTime !== undefined && { checkInTime: record.checkInTime }),
            })

        submittedRecords.push(savedRecord)

        if (isCurrentSession(payload.sessionId)) {
          applyAttendanceUpdates([savedRecord], true)
        }
      }

      // Use the mutation response immediately, then reconcile richer metadata in the background.
      refreshSessionAttendanceInBackground(
        payload.sessionId,
        'Attendance was saved, but latest details could not be refreshed. Please refresh the page.',
      )

      return submittedRecords
    }
    catch (err) {
      const savedCount = submittedRecords.length
      const totalCount = payload.records.length

      if (savedCount > 0) {
        syncWarning.value = `${savedCount} of ${totalCount} records saved. Please refresh the page to review the latest attendance details.`
      }

      console.error('Failed to record attendance:', err)

      throw createAttendanceSubmissionError(err, savedCount, totalCount)
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update a single attendance record
   * @param {number} id - Attendance record ID
   * @param {object} payload - Update data
   * @returns {Promise<object>} Updated attendance record
   */
  const updateAttendanceRecord = async (id: EntityId, payload: AttendanceUpdateInput) => {
    loading.value = true
    clearSyncWarning()

    // Store original state for rollback
    const originalRecords = [...sessionAttendance.value]
    const recordIndex = sessionAttendance.value.findIndex(r => entityIdsMatch(r.id, id))

    try {
      const updatedRecord = await apiUpdateAttendance(id, {
        ...payload,
        status: payload.status ? mapAttendanceStatusForWrite(payload.status) : undefined,
      })
      if (recordIndex !== -1) {
        applyAttendanceUpdates([updatedRecord])
      }

      if (currentSessionId.value !== null) {
        refreshSessionAttendanceInBackground(
          currentSessionId.value,
          'Attendance was updated, but latest details could not be refreshed. Please refresh the page.',
        )
      }
      else if (recordIndex !== -1) {
        sessionAttendance.value[recordIndex] = updatedRecord
      }

      return updatedRecord
    }
    catch (err) {
      console.error('Failed to update attendance record:', err)

      // Rollback on error
      sessionAttendance.value = originalRecords

      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Delete an attendance record
   * @param {number} id - Attendance record ID
   * @returns {Promise<void>}
   */
  const deleteAttendanceRecord = async (id: EntityId) => {
    loading.value = true

    // Store original state for rollback
    const originalRecords = [...sessionAttendance.value]

    try {
      await apiDeleteAttendance(id)

      // Remove from local state
      sessionAttendance.value = sessionAttendance.value.filter(r => !entityIdsMatch(r.id, id))
    }
    catch (err) {
      console.error('Failed to delete attendance record:', err)

      // Rollback on error
      sessionAttendance.value = originalRecords

      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update local attendance status for a student (optimistic update)
   * Used for immediate UI feedback before submitting to server
   * @param {number} studentId - Student ID
   * @param {string} status - New status
   */
  const updateLocalStatus = (studentId: EntityId, status: AttendanceStatus) => {
    const record = sessionAttendance.value.find(r => entityIdsMatch(r.studentId, studentId))
    if (record) {
      record.status = status
    }
  }

  /**
   * Set all students to a specific status (bulk local update)
   * @param {string} status - Status to set for all students
   */
  const markAllAs = (status: AttendanceStatus) => {
    sessionAttendance.value.forEach((record) => {
      record.status = status
    })
  }

  /**
   * Clear current session attendance data
   */
  const clearSessionAttendance = () => {
    sessionAttendance.value = []
    currentSessionId.value = null
  }

  /**
   * Clear current attendance record
   */
  const clearCurrentRecord = () => {
    currentRecord.value = null
  }

  /**
   * Reset store to initial state
   */
  const resetStore = () => {
    attendanceRecords.value = []
    sessionAttendance.value = []
    loading.value = false
    currentRecord.value = null
    summary.value = null
    currentSessionId.value = null
    syncWarning.value = null
  }

  // ==================== RETURN ====================

  return {
    // State
    attendanceRecords,
    sessionAttendance,
    loading,
    currentRecord,
    summary,
    currentSessionId,
    syncWarning,

    // Getters
    recordsByStatus,
    presentRecords,
    absentRecords,
    lateRecords,
    excusedRecords,
    sessionStats,
    getRecordByStudentId,
    hasAttendanceData,

    // Actions
    fetchAllAttendance,
    fetchAttendanceById,
    fetchSessionAttendance,
    fetchStudentAttendance,
    fetchAttendanceSummary,
    submitAttendance,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    updateLocalStatus,
    markAllAs,
    clearSessionAttendance,
    clearCurrentRecord,
    clearSyncWarning,
    resetStore,
  }
})
