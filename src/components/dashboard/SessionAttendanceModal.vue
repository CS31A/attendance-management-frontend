<script setup lang="ts">
import type { SessionAttendanceRecord } from '@/types/domain/attendance'
import type { Session } from '@/types/domain/session'
import type { EntityId } from '@/types'
import { computed, ref, watch } from 'vue'
import { calculateAttendanceStats, fetchSessionAttendance, getStatusLabel } from '@/api/attendance'
import { useSessionStore } from '@/stores/sessionStore'
import { LOCALE } from '@/utils/constants'
import { formatLongDate } from '@/utils/date'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage } from '@/utils/httpError'

const props = defineProps<{
  sessionId: EntityId | null
}>()

const emit = defineEmits<{
  close: []
}>()

const sessionStore = useSessionStore()

interface SessionAttendanceModalData {
  session: Session
  attendanceRecords: SessionAttendanceRecord[]
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  attendanceRate: number
  totalEnrolled: number | null
  attendanceMeta: string
}

const loading = ref(false)
const sessionData = ref<SessionAttendanceModalData | null>(null)
const errorMessage = ref('')
const activeSessionId = ref<EntityId | null>(null)

const visible = computed(() => props.sessionId !== null)

watch(() => props.sessionId, (id) => {
  if (id !== null) {
    void loadData(id)
  }
  else {
    sessionData.value = null
    errorMessage.value = ''
    activeSessionId.value = null
  }
})

async function loadData(sessionId: EntityId) {
  activeSessionId.value = sessionId
  loading.value = true
  sessionData.value = null
  errorMessage.value = ''
  const requestId = sessionId

  try {
    const selectedSession
      = sessionStore.sessions.find(s => entityIdsMatch(s.id, sessionId))
        || sessionStore.activeSessions.find(s => entityIdsMatch(s.id, sessionId))
        || sessionStore.upcomingSessions.find(s => entityIdsMatch(s.id, sessionId))
        || await sessionStore.fetchSessionById(sessionId)
    if (!selectedSession) {
      throw new Error('Session not found')
    }

    const attendanceRecords = await fetchSessionAttendance(sessionId)
    const stats = calculateAttendanceStats(attendanceRecords)
    const totalEnrolled = typeof selectedSession.totalEnrolled === 'number'
      ? selectedSession.totalEnrolled
      : null
    const attendanceMeta = attendanceRecords.length === 0
      ? 'Attendance not recorded yet'
      : `${attendanceRecords.length} attendance record${attendanceRecords.length === 1 ? '' : 's'}`

    if (!entityIdsMatch(activeSessionId.value, requestId)) {
      return
    }

    sessionData.value = {
      session: selectedSession,
      attendanceRecords,
      presentCount: stats.presentCount,
      lateCount: stats.lateCount,
      absentCount: stats.absentCount,
      excusedCount: stats.excusedCount,
      attendanceRate: stats.presentPercentage,
      totalEnrolled,
      attendanceMeta,
    }
  }
  catch (error) {
    console.error('Failed to load session attendance:', error)
    if (!entityIdsMatch(activeSessionId.value, requestId)) {
      return
    }
    sessionData.value = null
    errorMessage.value = getErrorMessage(error, 'Failed to load session attendance. Please try again.')
  }
  finally {
    if (entityIdsMatch(activeSessionId.value, requestId)) {
      loading.value = false
    }
  }
}

function retry() {
  if (activeSessionId.value !== null) {
    void loadData(activeSessionId.value)
  }
}

function close() {
  emit('close')
}

function formatTime(isoString: string | null | undefined) {
  if (!isoString)
    return '-'
  const date = new Date(isoString)
  return date.toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT)
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">
          Session Attendance
        </h2>
        <button class="modal-close" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
        </button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="modal-loading">
          <div class="spinner" />
          <p>Loading attendance data...</p>
        </div>
        <div v-else-if="sessionData" class="modal-content">
          <div class="session-info">
            <h3>{{ sessionData.session.subjectName }} - {{ sessionData.session.sectionName }}</h3>
            <p>
              {{ formatLongDate(sessionData.session.sessionDate, '-') }} •
              {{ sessionData.totalEnrolled === null ? 'Enrollment unavailable' : `${sessionData.totalEnrolled} students enrolled` }}
              • {{ sessionData.attendanceMeta }}
            </p>
          </div>

          <div class="attendance-stats-grid" style="margin: 1.5rem 0;">
            <div class="attendance-stat present">
              <div class="attendance-stat-value">
                {{ sessionData.presentCount }}
              </div>
              <div class="attendance-stat-label">
                Present
              </div>
            </div>
            <div class="attendance-stat late">
              <div class="attendance-stat-value">
                {{ sessionData.lateCount }}
              </div>
              <div class="attendance-stat-label">
                Late
              </div>
            </div>
            <div class="attendance-stat absent">
              <div class="attendance-stat-value">
                {{ sessionData.absentCount }}
              </div>
              <div class="attendance-stat-label">
                Absent
              </div>
            </div>
            <div class="attendance-stat rate">
              <div class="attendance-stat-value" style="color: var(--color-primary);">
                {{ sessionData.attendanceRate?.toFixed(1) }}%
              </div>
              <div class="attendance-stat-label">
                Rate
              </div>
            </div>
          </div>

          <table class="attendance-table">
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Name</th>
                <th>Status</th>
                <th>Check-in Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in sessionData.attendanceRecords" :key="record.id">
                <td>{{ record.studentNumber }}</td>
                <td>{{ record.studentName }}</td>
                <td>
                  <span class="attendance-badge" :class="record.status.toLowerCase()">
                    {{ getStatusLabel(record.status) }}
                  </span>
                </td>
                <td>{{ record.checkInTime ? formatTime(record.checkInTime) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="modal-error-state">
          <p class="modal-error-message">
            {{ errorMessage || 'Failed to load session attendance. Please try again.' }}
          </p>
          <div class="modal-error-actions">
            <button class="btn-secondary" @click="close">
              Close
            </button>
            <button class="btn-primary" @click="retry">
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fadeIn var(--transition-base);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp var(--transition-base);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.modal-close:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--text-secondary);
}

.modal-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-2xl);
  text-align: center;
}

.modal-error-message {
  margin: 0;
  color: var(--text-secondary);
}

.modal-error-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.session-info h3 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.session-info p {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.attendance-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.attendance-stat {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all var(--transition-base);
}

.attendance-stat.present { border-color: var(--color-success); }
.attendance-stat.late { border-color: var(--color-warning); }
.attendance-stat.absent { border-color: var(--color-error); }

.attendance-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.attendance-stat.present .attendance-stat-value { color: var(--color-success); }
.attendance-stat.late .attendance-stat-value { color: var(--color-warning); }
.attendance-stat.absent .attendance-stat-value { color: var(--color-error); }

.attendance-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 500;
  margin: 0;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-table th {
  text-align: left;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-primary);
}

.attendance-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-secondary);
}

.attendance-table tr:hover {
  background: var(--bg-hover);
}

.attendance-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.attendance-badge.present {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.attendance-badge.late {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.attendance-badge.absent {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.attendance-badge.excused {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-primary);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal {
    width: 95%;
    max-height: 95vh;
  }

  .attendance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .attendance-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
