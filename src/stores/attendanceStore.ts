import type {
  AttendanceQueryParams,
  AttendanceStatus,
  AttendanceUpdateInput,
  BackendAttendanceStatus,
  RecordAttendancePayload,
} from '@/api/attendance'
import type { EntityId } from '@/types'
import type { AttendanceRecord, AttendanceSummary, SessionAttendanceRecord } from '@/types/domain/attendance'
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
  toAttendanceRecord,
  toAttendanceSummary,
  toSessionAttendanceRecord,
} from '@/api/attendance'
import { useLoadingState } from '@/composables/useLoadingState'
import { normalizeNotes } from '@/utils/attendanceRecord'
import { createAttendanceSubmissionError } from '@/utils/attendanceSubmission'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorStatus } from '@/utils/httpError'
import { withRollback } from '@/utils/withRollback'

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
  const attendanceRecords = ref<AttendanceRecord[]>([])

  /** @type {import('vue').Ref<Array>} */
  const sessionAttendance = ref<SessionAttendanceRecord[]>([])

  const { loading, withLoading, resetLoading } = useLoadingState()

  /** @type {import('vue').Ref<object | null>} */
  const currentRecord = ref<AttendanceRecord | null>(null)

  /** @type {import('vue').Ref<object | null>} */
  const summary = ref<AttendanceSummary | null>(null)

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

  function applyAttendanceUpdates(records: AttendanceRecord[], allowInsert = false) {
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

      // Optimistic insert: API create/update returns AttendanceResponseDto (no student metadata).
      // Background refresh (refreshSessionAttendanceWithRetry) replaces these with full data shortly after.

      if (allowInsert) {
        sessionAttendance.value.push({
          ...record,
          studentNumber: '',
          studentName: '',
          checkInTime: '',
        })
      }
    })
  }

  // Re-fetch keeps enriched student metadata (name/number/check-in) that mutation responses do not always include.
  async function refreshSessionAttendanceWithRetry(sessionId: EntityId, retries = 1): Promise<boolean> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const refreshedAttendance = (await apiFetchSessionAttendance(sessionId)).map(toSessionAttendanceRecord)
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
    return withLoading(async () => {
      const data = (await apiFetchAllAttendance(params)).map(toAttendanceRecord)
      attendanceRecords.value = data
      return data
    }, err => console.error('Failed to fetch attendance records:', err))
  }

  /**
   * Fetch a single attendance record by ID
   * @param {number} id - Attendance record ID
   * @returns {Promise<object>} Attendance record
   */
  const fetchAttendanceById = async (id: EntityId) => {
    return withLoading(async () => {
      const data = toAttendanceRecord(await apiFetchAttendanceById(id))
      currentRecord.value = data
      return data
    }, err => console.error('Failed to fetch attendance record:', err))
  }

  /**
   * Fetch attendance records for a specific session
   * @param {number} sessionId - Session ID
   * @returns {Promise<Array>} Array of attendance records
   */
  const fetchSessionAttendance = async (sessionId: EntityId) => {
    currentSessionId.value = sessionId
    clearSyncWarning()

    return withLoading(async () => {
      try {
        // API returns attendanceRecords array directly (extracted in api layer)
        const data = (await apiFetchSessionAttendance(sessionId)).map(toSessionAttendanceRecord)
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
    })
  }

  /**
   * Fetch attendance records for a specific student
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Array of attendance records
   */
  const fetchStudentAttendance = async (studentId: EntityId) => {
    return withLoading(async () => {
      const data = (await apiFetchStudentAttendance(studentId)).map(toAttendanceRecord)
      return data
    }, err => console.error('Failed to fetch student attendance:', err))
  }

  /**
   * Fetch attendance summary statistics
   * @param {object} [params] - Query parameters
   * @returns {Promise<object>} Summary statistics
   */
  const fetchAttendanceSummary = async (params: AttendanceQueryParams = {}) => {
    return withLoading(async () => {
      const data = toAttendanceSummary(await apiFetchAttendanceSummary(params))
      summary.value = data
      return data
    }, err => console.error('Failed to fetch attendance summary:', err))
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
    clearSyncWarning()
    const submittedRecords: AttendanceRecord[] = []

    return withLoading(async () => {
      try {
        for (const record of payload.records) {
          const normalizedNotes = normalizeNotes(record.notes)
          const backendStatus = mapAttendanceStatusForWrite(record.status)
          const existingRecordId = record.id

          const savedRecordDto = existingRecordId !== undefined && existingRecordId !== null
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

          submittedRecords.push(toAttendanceRecord(savedRecordDto))
        }

        if (isCurrentSession(payload.sessionId)) {
          applyAttendanceUpdates(submittedRecords, true)
        }

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
    })
  }

  /**
   * Update a single attendance record
   * @param {number} id - Attendance record ID
   * @param {object} payload - Update data
   * @returns {Promise<object>} Updated attendance record
   */
  const updateAttendanceRecord = async (id: EntityId, payload: AttendanceUpdateInput) => {
    clearSyncWarning()

    return withLoading(() => withRollback(sessionAttendance, async () => {
      const recordIndex = sessionAttendance.value.findIndex(r => entityIdsMatch(r.id, id))
      const updatedRecord = toAttendanceRecord(await apiUpdateAttendance(id, {
        ...payload,
        status: payload.status ? mapAttendanceStatusForWrite(payload.status) : undefined,
      }))
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
        sessionAttendance.value[recordIndex] = {
          ...sessionAttendance.value[recordIndex],
          ...updatedRecord,
        }
      }

      return updatedRecord
    }))
  }

  /**
   * Delete an attendance record
   * @param {number} id - Attendance record ID
   * @returns {Promise<void>}
   */
  const deleteAttendanceRecord = async (id: EntityId) => {
    return withLoading(() => withRollback(sessionAttendance, async () => {
      await apiDeleteAttendance(id)

      // Remove from local state
      sessionAttendance.value = sessionAttendance.value.filter(r => !entityIdsMatch(r.id, id))
    }))
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
    resetLoading()
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
