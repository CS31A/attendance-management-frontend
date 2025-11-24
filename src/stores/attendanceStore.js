import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  deleteAttendance as apiDeleteAttendance,
  fetchAllAttendance as apiFetchAllAttendance,
  fetchAttendanceById as apiFetchAttendanceById,
  fetchAttendanceSummary as apiFetchAttendanceSummary,
  fetchSessionAttendance as apiFetchSessionAttendance,
  fetchStudentAttendance as apiFetchStudentAttendance,
  recordAttendance as apiRecordAttendance,
  updateAttendance as apiUpdateAttendance,
  calculateAttendanceStats,
} from '@/api/attendance.js'

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
  const attendanceRecords = ref([])

  /** @type {import('vue').Ref<Array>} */
  const sessionAttendance = ref([])

  /** @type {import('vue').Ref<boolean>} */
  const loading = ref(false)

  /** @type {import('vue').Ref<object | null>} */
  const currentRecord = ref(null)

  /** @type {import('vue').Ref<object | null>} */
  const summary = ref(null)

  /** @type {import('vue').Ref<number | null>} */
  const currentSessionId = ref(null)

  // ==================== GETTERS ====================

  /**
   * Get attendance records filtered by status
   * @param {string} status - Attendance status ('present' | 'absent' | 'late' | 'excused')
   * @returns {Array} Filtered attendance records
   */
  const recordsByStatus = computed(() => (status) => {
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
  const getRecordByStudentId = computed(() => (studentId) => {
    return sessionAttendance.value.find(record => record.studentId === studentId)
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
  const fetchAllAttendance = async (params = {}) => {
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
  const fetchAttendanceById = async (id) => {
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
  const fetchSessionAttendance = async (sessionId) => {
    loading.value = true
    currentSessionId.value = sessionId

    try {
      const data = await apiFetchSessionAttendance(sessionId)
      sessionAttendance.value = data
      return data
    }
    catch (err) {
      console.error('Failed to fetch session attendance:', err)
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
  const fetchStudentAttendance = async (studentId) => {
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
  const fetchAttendanceSummary = async (params = {}) => {
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
   * Record attendance for a session (bulk operation)
   * @param {object} payload - Attendance data
   * @param {number} payload.sessionId - Session ID
   * @param {Array} payload.records - Array of student attendance records
   * @returns {Promise<Array>} Created/updated attendance records
   */
  const submitAttendance = async (payload) => {
    loading.value = true

    try {
      const data = await apiRecordAttendance(payload)

      // Update local state with new records
      if (payload.sessionId === currentSessionId.value) {
        sessionAttendance.value = data
      }

      return data
    }
    catch (err) {
      console.error('Failed to record attendance:', err)
      throw err
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
  const updateAttendanceRecord = async (id, payload) => {
    loading.value = true

    // Store original state for rollback
    const originalRecords = [...sessionAttendance.value]
    const recordIndex = sessionAttendance.value.findIndex(r => r.id === id)

    try {
      const updatedRecord = await apiUpdateAttendance(id, payload)

      // Update local state
      if (recordIndex !== -1) {
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
  const deleteAttendanceRecord = async (id) => {
    loading.value = true

    // Store original state for rollback
    const originalRecords = [...sessionAttendance.value]

    try {
      await apiDeleteAttendance(id)

      // Remove from local state
      sessionAttendance.value = sessionAttendance.value.filter(r => r.id !== id)
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
  const updateLocalStatus = (studentId, status) => {
    const record = sessionAttendance.value.find(r => r.studentId === studentId)
    if (record) {
      record.status = status
    }
  }

  /**
   * Set all students to a specific status (bulk local update)
   * @param {string} status - Status to set for all students
   */
  const markAllAs = (status) => {
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
    resetStore,
  }
})
