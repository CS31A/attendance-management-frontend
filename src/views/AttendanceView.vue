<script setup lang="ts">
import type { StudentAttendance } from '@/api/attendance'
import type { SessionResponseDto } from '@/api/sessions'
import type { EntityId } from '@/types'
import { AlertTriangle, ClipboardCheck, RefreshCw } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import { useAttendanceStore } from '@/stores/attendanceStore'
import { useSessionStore } from '@/stores/sessionStore'
import { getAttendanceSubmissionErrorMessage } from '@/utils/attendanceSubmission'
import { getErrorMessage } from '@/utils/httpError'

const AttendanceList = defineAsyncComponent(() => import('@/components/attendance/AttendanceList.vue'))
const AttendanceRecord = defineAsyncComponent(() => import('@/components/attendance/AttendanceRecord.vue'))
const LoadingSpinner = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'))

const route = useRoute()
const router = useRouter()
const attendanceStore = useAttendanceStore()
const sessionStore = useSessionStore()

type ToastType = 'success' | 'error'
type AttendanceViewMode = 'list' | 'record'

function toNumericSessionId(id: EntityId): number | null {
  if (typeof id === 'number')
    return id

  const parsed = Number(id)
  return Number.isInteger(parsed) ? parsed : null
}

// State
const errorMessage = ref('')
const currentView = ref<AttendanceViewMode>('list')
const selectedSession = ref<SessionResponseDto | null>(null)

// Computed
const sessionId = computed<EntityId | undefined>(() => {
  const value = route.params.sessionId
  return Array.isArray(value) ? value[0] : value
})
const isRecordView = computed(() => !!sessionId.value)
const sessions = computed(() => sessionStore.sessions)
const loading = computed(() => sessionStore.loading || attendanceStore.loading)
const syncWarning = computed(() => attendanceStore.syncWarning)

// Watch for route changes to switch views
watch(sessionId, async (newSessionId) => {
  if (newSessionId) {
    currentView.value = 'record'
    attendanceStore.clearSyncWarning()
    await loadSessionDetails(newSessionId)
  }
  else {
    currentView.value = 'list'
    selectedSession.value = null
    attendanceStore.clearSyncWarning()
    attendanceStore.clearSessionAttendance()
  }
}, { immediate: true })

watch(syncWarning, (warning) => {
  if (!warning) {
    return
  }

  showToast(warning, 'error', 6000)
  attendanceStore.clearSyncWarning()
})

// Toast state and helpers
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
  duration: 3000,
})

function showToast(message: string, type: ToastType = 'success', duration = 3000) {
  toast.message = message
  toast.type = type
  toast.duration = duration
  toast.show = true
}

function closeToast() {
  toast.show = false
}

// Methods
async function loadSessions() {
  errorMessage.value = ''
  try {
    await sessionStore.fetchSessions()
  }
  catch (error) {
    console.error('Failed to load sessions:', error)
    const message = getErrorMessage(error, 'Failed to load sessions. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

async function loadSessionDetails(sessionId: EntityId) {
  errorMessage.value = ''
  try {
    const session = await sessionStore.fetchSessionById(sessionId)
    selectedSession.value = session

    // Load attendance data for this session
    await attendanceStore.fetchSessionAttendance(sessionId)
  }
  catch (error) {
    console.error('Failed to load session details:', error)
    const message = getErrorMessage(error, 'Failed to load session details. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleSelectSession(session: SessionResponseDto) {
  router.push(`/attendance/session/${session.id}`)
}

function handleBackToList() {
  router.push('/attendance')
}

function retryCurrentView() {
  if (isRecordView.value && sessionId.value) {
    loadSessionDetails(sessionId.value)
    return
  }

  loadSessions()
}

async function handleSubmitAttendance(attendanceData: StudentAttendance[]) {
  errorMessage.value = ''
  if (!selectedSession.value)
    return

  const normalizedSessionId = toNumericSessionId(selectedSession.value.id)
  if (normalizedSessionId === null) {
    const message = 'Invalid session ID.'
    showToast(message, 'error')
    errorMessage.value = message
    throw new Error(message)
  }

  try {
    await attendanceStore.submitAttendance({
      sessionId: normalizedSessionId,
      records: attendanceData,
    })
    showToast('Attendance saved successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to submit attendance:', error)

    const savedCount = (error as { savedCount?: number }).savedCount
    const totalCount = (error as { totalCount?: number }).totalCount

    const isPartialSave = savedCount !== undefined
      && totalCount !== undefined
      && savedCount > 0

    let message = getAttendanceSubmissionErrorMessage(error)
    if (isPartialSave) {
      message = `${savedCount} of ${totalCount} records saved. ${message}`
    }

    // Partial-save warning is surfaced via syncWarning watcher; avoid duplicate error toasts.
    if (!isPartialSave) {
      showToast(message, 'error')
    }

    errorMessage.value = message
    // Re-throw error so child component doesn't reset its state
    throw error
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
    <LoadingSpinner
      v-if="loading && !sessions.length && !selectedSession"
      type="inline"
    />

    <!-- Error State -->
    <div v-else-if="errorMessage && !sessions.length && !selectedSession" class="error-state">
      <AlertTriangle :size="48" class="error-icon" />
      <h3>Failed to Load Data</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="retryCurrentView">
        <RefreshCw :size="18" />
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State for List View -->
    <div v-else-if="!isRecordView && !sessions.length && !loading" class="empty-state">
      <ClipboardCheck :size="64" class="empty-icon" />
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
      :on-submit="handleSubmitAttendance"
      :stats="attendanceStore.sessionStats"
      @back="handleBackToList"
    />

    <!-- Toast Notification -->
    <Toast
      :show="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="closeToast"
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
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-gray-100);
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--color-gray-200);
  border-color: var(--color-gray-400);
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
  color: var(--color-error);
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.error-state p {
  font-size: 1rem;
  color: var(--color-gray-500);
  margin: 0 0 1.5rem 0;
  max-width: 500px;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-secondary-light);
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
  color: var(--color-gray-400);
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-gray-500);
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
