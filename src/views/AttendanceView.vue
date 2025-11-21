<script setup>
import { AlertTriangle, ClipboardCheck, Loader2, RefreshCw } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useSessionStore } from '@/stores/sessionStore'
import { showError, showSuccess } from '@/utils/toast'

const AttendanceList = defineAsyncComponent(() => import('@/components/attendance/AttendanceList.vue'))
const AttendanceRecord = defineAsyncComponent(() => import('@/components/attendance/AttendanceRecord.vue'))

const route = useRoute()
const router = useRouter()
const attendanceStore = useAttendanceStore()
const sessionStore = useSessionStore()

// State
const errorMessage = ref('')
const currentView = ref('list') // 'list' or 'record'
const selectedSession = ref(null)

// Computed
const sessionId = computed(() => route.params.sessionId)
const isRecordView = computed(() => !!sessionId.value)
const sessions = computed(() => sessionStore.sessions)
const loading = computed(() => sessionStore.loading || attendanceStore.loading)

// Watch for route changes to switch views
watch(sessionId, async (newSessionId) => {
  if (newSessionId) {
    currentView.value = 'record'
    await loadSessionDetails(newSessionId)
  }
  else {
    currentView.value = 'list'
    selectedSession.value = null
    attendanceStore.clearSessionAttendance()
  }
}, { immediate: true })

// Methods
async function loadSessions() {
  errorMessage.value = ''
  try {
    await sessionStore.fetchSessions()
  }
  catch (error) {
    console.error('Failed to load sessions:', error)
    const message = error.response?.data?.message || 'Failed to load sessions. Please try again.'
    showError(message)
    errorMessage.value = message
  }
}

async function loadSessionDetails(sessionId) {
  errorMessage.value = ''
  try {
    const session = await sessionStore.fetchSessionById(sessionId)
    selectedSession.value = session

    // Load attendance data for this session
    await attendanceStore.fetchSessionAttendance(sessionId)
  }
  catch (error) {
    console.error('Failed to load session details:', error)
    const message = error.response?.data?.message || 'Failed to load session details. Please try again.'
    showError(message)
    errorMessage.value = message
  }
}

function handleSelectSession(session) {
  router.push(`/attendance/session/${session.id}`)
}

function handleBackToList() {
  router.push('/attendance')
}

async function handleSubmitAttendance(attendanceData) {
  errorMessage.value = ''
  try {
    await attendanceStore.submitAttendance({
      sessionId: selectedSession.value.id,
      records: attendanceData,
    })
    showSuccess('Attendance recorded successfully!')
  }
  catch (error) {
    console.error('Failed to submit attendance:', error)
    let message = 'Failed to record attendance. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to record attendance for this session.'
    }
    else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Invalid attendance data.'
    }
    showError(message)
    errorMessage.value = message
  }
}

// Lifecycle
onMounted(() => {
  loadSessions()
})
</script>

<template>
  <div class="attendance-view">
    <!-- Header Section -->
    <div class="attendance-header">
      <div class="header-content">
        <h1 class="page-title">
          {{ isRecordView ? 'Record Attendance' : 'Attendance Management' }}
        </h1>
        <p class="page-subtitle">
          {{ isRecordView ? 'Mark student attendance for this session' : 'Select a session to record or view attendance' }}
        </p>
      </div>
      <button v-if="isRecordView" class="btn-back" @click="handleBackToList">
        Back to Sessions
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !sessions.length && !selectedSession" class="loading-state">
      <Loader2 class="spinner" size="40" />
      <p>Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage && !sessions.length && !selectedSession" class="error-state">
      <AlertTriangle size="48" class="error-icon" />
      <h3>Failed to Load Data</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="isRecordView ? loadSessionDetails(sessionId) : loadSessions()">
        <RefreshCw size="18" />
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State for List View -->
    <div v-else-if="!isRecordView && !sessions.length && !loading" class="empty-state">
      <ClipboardCheck size="64" class="empty-icon" />
      <h3>No Sessions Available</h3>
      <p>There are no sessions available for attendance recording.</p>
    </div>

    <!-- List View -->
    <AttendanceList
      v-else-if="!isRecordView"
      :sessions="sessions"
      :loading="loading"
      @select="handleSelectSession"
    />

    <!-- Record View -->
    <AttendanceRecord
      v-else-if="selectedSession"
      :session="selectedSession"
      :attendance="attendanceStore.sessionAttendance"
      :loading="attendanceStore.loading"
      :stats="attendanceStore.sessionStats"
      @submit="handleSubmitAttendance"
      @back="handleBackToList"
    />
  </div>
</template>

<style scoped>
.attendance-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.attendance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.error-state p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 500px;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: #4338ca;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  color: #9ca3af;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  max-width: 500px;
}

/* Responsive */
@media (max-width: 768px) {
  .attendance-view {
    padding: 1rem;
  }

  .attendance-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .btn-back {
    width: 100%;
    justify-content: center;
  }
}
</style>
