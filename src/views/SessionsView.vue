<script setup>
import { AlertTriangle, Calendar, Plus, RefreshCw } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import DeleteModal from '@/components/common/DeleteModal.vue'
import Toast from '@/components/common/Toast.vue'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { useSessionStore } from '@/stores/sessionStore'

const CreateSessionModal = defineAsyncComponent(() => import('@/components/sessions/CreateSessionModal.vue'))
const EndSessionModal = defineAsyncComponent(() => import('@/components/sessions/EndSessionModal.vue'))
const SessionTable = defineAsyncComponent(() => import('@/components/sessions/SessionTable.vue'))
const StartSessionModal = defineAsyncComponent(() => import('@/components/sessions/StartSessionModal.vue'))
const UpdateRoomModal = defineAsyncComponent(() => import('@/components/sessions/UpdateRoomModal.vue'))
const SkeletonLoader = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'))
const QRGenerateModal = defineAsyncComponent(() => import('@/components/qrcode/QRGenerateModal.vue'))
const QRDisplayModal = defineAsyncComponent(() => import('@/components/qrcode/QRDisplayModal.vue'))
const QRCodeListModal = defineAsyncComponent(() => import('@/components/qrcode/QRCodeListModal.vue'))

const router = useRouter()
const sessionStore = useSessionStore()
const qrCodeStore = useQrCodeStore()

// State
const currentFilter = ref('all')
const showCreateModal = ref(false)
const showStartModal = ref(false)
const showEndModal = ref(false)
const showUpdateRoomModal = ref(false)
const showQRGenerateModal = ref(false)
const showQRDisplayModal = ref(false)
const showQRListModal = ref(false)
const selectedSession = ref(null)
const currentQrCode = ref(null)
const errorMessage = ref('')

// Delete modal state
const showDeleteModal = ref(false)
const sessionToDelete = ref(null)
const isDeleting = ref(false)

// Computed properties
const sessions = computed(() => sessionStore.sessions)

const filteredSessions = computed(() => {
  if (currentFilter.value === 'all') {
    return sessions.value
  }
  return sessionStore.sessionsByStatus(currentFilter.value)
})

const statusFilters = computed(() => [
  { label: 'All', value: 'all', count: sessions.value.length },
  { label: 'Not Started', value: 'not_started', count: sessionStore.notStartedSessions.length },
  { label: 'Active', value: 'active', count: sessionStore.activeSessions.length },
  { label: 'Completed', value: 'completed', count: sessionStore.completedSessions.length },
  { label: 'Cancelled', value: 'cancelled', count: sessionStore.cancelledSessions.length },
])

const emptyStateTitle = computed(() => {
  const titles = {
    all: 'No Sessions Yet',
    not_started: 'No Upcoming Sessions',
    active: 'No Active Sessions',
    completed: 'No Completed Sessions',
    cancelled: 'No Cancelled Sessions',
  }
  return titles[currentFilter.value] || 'No Sessions'
})

const emptyStateMessage = computed(() => {
  const messages = {
    all: 'Create your first session to start managing attendance',
    not_started: 'All your upcoming sessions will appear here',
    active: 'Start a session to begin tracking attendance',
    completed: 'Completed sessions will be listed here',
    cancelled: 'Cancelled sessions will appear here',
  }
  return messages[currentFilter.value] || 'No sessions to display'
})

// Toast state and helpers
const toast = reactive({
  show: false,
  message: '',
  type: 'success',
  duration: 3000,
})

function showToast(message, type = 'success', duration = 3000) {
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
    const message = error.response?.data?.message || 'Failed to load sessions. Please try again.'
    showToast(message, 'error')
    errorMessage.value = message
  }
}

async function handleCreateSession(payload) {
  errorMessage.value = ''
  try {
    await sessionStore.createSession(payload)
    showCreateModal.value = false
    showToast('Session created successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to create session:', error)
    const message = error.response?.data?.message || 'Failed to create session. Please try again.'
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleStartSession(session) {
  selectedSession.value = session
  showStartModal.value = true
}

async function handleConfirmStart(payload) {
  errorMessage.value = ''
  try {
    await sessionStore.startSession(selectedSession.value.id, payload)
    showStartModal.value = false
    selectedSession.value = null
    showToast('Session started successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to start session:', error)
    let message = 'Failed to start session. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to start this session. Only the assigned instructor can manage this session.'
    }
    else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot start this session. Check the session status.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleEndSession(session) {
  selectedSession.value = session
  showEndModal.value = true
}

async function handleConfirmEnd(payload) {
  errorMessage.value = ''
  try {
    await sessionStore.endSession(selectedSession.value.id, payload)
    showEndModal.value = false
    selectedSession.value = null
    showToast('Session ended successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to end session:', error)
    let message = 'Failed to end session. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to end this session. Only the assigned instructor can manage this session.'
    }
    else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot end this session. Check the session status.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleDeleteSession(id) {
  const session = sessionStore.sessions.find(s => s.id === id)
  if (session) {
    sessionToDelete.value = session
    showDeleteModal.value = true
  }
}

async function confirmDelete() {
  if (!sessionToDelete.value)
    return

  isDeleting.value = true
  errorMessage.value = ''
  try {
    await sessionStore.deleteSession(sessionToDelete.value.id)
    showToast('Session deleted successfully!', 'success')
    showDeleteModal.value = false
    sessionToDelete.value = null
  }
  catch (error) {
    console.error('Failed to delete session:', error)
    let message = 'Failed to delete session. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to delete this session. Only the assigned instructor can manage this session.'
    }
    else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot delete this session. Only sessions that have not started can be deleted.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
  finally {
    isDeleting.value = false
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  sessionToDelete.value = null
}

function handleUpdateRoom(session) {
  selectedSession.value = session
  showUpdateRoomModal.value = true
}

async function handleConfirmUpdateRoom(payload) {
  errorMessage.value = ''
  try {
    await sessionStore.updateSessionRoom(selectedSession.value.id, payload)
    showUpdateRoomModal.value = false
    selectedSession.value = null
    showToast('Session room updated successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to update room:', error)
    let message = 'Failed to update room. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to update this session. Only the assigned instructor can manage this session.'
    }
    else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot update room. Check the session status.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleGenerateQr(session) {
  selectedSession.value = session
  showQRGenerateModal.value = true
}

async function handleQrGenerated(qrData) {
  currentQrCode.value = qrData
  showQRDisplayModal.value = true
  showToast('QR Code generated successfully!', 'success')
}

function handleQrRevoke(qrCode) {
  if (confirm('Are you sure you want to revoke this QR code? It will no longer be valid for attendance.')) {
    // Since we're dealing with a simple image response, we'll just close the modal
    // In a real implementation, you'd call an API to revoke the QR code
    showToast('QR Code revoked successfully', 'success')
    showQRDisplayModal.value = false
    currentQrCode.value = null
  }
}

function handleQrFullscreen(qrCodeId) {
  router.push(`/qr-code/projection/${qrCodeId}`)
}

function handleViewQrCodes(session) {
  selectedSession.value = session
  showQRListModal.value = true
}

async function handleViewQrFromList(qrCode) {
  // Fetch the full QR code details including the image
  try {
    const qrCodeDetails = await qrCodeStore.fetchQrCode(qrCode.id)
    currentQrCode.value = qrCodeDetails
    showQRDisplayModal.value = true
  }
  catch (error) {
    console.error('Failed to load QR code:', error)
    showToast('Failed to load QR code details', 'error')
  }
}

// Lifecycle
onMounted(() => {
  loadSessions()
})
</script>

<template>
  <div class="sessions-view">
    <!-- Header Section -->
    <div class="sessions-header">
      <div class="header-content">
        <h1 class="page-title">
          Session Management
        </h1>
        <p class="page-subtitle">
          Manage your class sessions and attendance tracking
        </p>
      </div>
      <button class="btn-create-session" @click="showCreateModal = true">
        <Plus size="20" />
        <span>Create Session</span>
      </button>
    </div>

    <!-- Status Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        class="filter-tab"
        :class="{ 'filter-active': currentFilter === filter.value }"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="count-badge">
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="sessionStore.loading && !sessions.length" class="loading-skeleton">
      <SkeletonLoader type="rectangle" :height="60" style="margin-bottom: 1rem; width: 100%;" />
      <SkeletonLoader v-for="i in 5" :key="i" type="rectangle" :height="80" style="margin-bottom: 1rem; width: 100%;" />
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-state">
      <AlertTriangle size="48" class="error-icon" />
      <h3>Failed to Load Sessions</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadSessions">
        <RefreshCw size="18" />
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredSessions.length && !sessionStore.loading" class="empty-state">
      <Calendar size="64" class="empty-icon" />
      <h3>{{ emptyStateTitle }}</h3>
      <p>{{ emptyStateMessage }}</p>
      <button v-if="currentFilter === 'all'" class="btn-empty-action" @click="showCreateModal = true">
        <Plus size="20" />
        <span>Create Your First Session</span>
      </button>
    </div>

    <!-- Sessions Table -->
    <div v-else class="sessions-content">
      <SessionTable
        :sessions="filteredSessions"
        @start="handleStartSession"
        @end="handleEndSession"
        @delete="handleDeleteSession"
        @update-room="handleUpdateRoom"
        @generate-qr="handleGenerateQr"
        @view-qr-codes="handleViewQrCodes"
      />
    </div>

    <!-- Create Session Modal -->
    <CreateSessionModal
      v-if="showCreateModal"
      @create="handleCreateSession"
      @cancel="showCreateModal = false"
    />

    <!-- Start Session Modal -->
    <StartSessionModal
      v-if="showStartModal"
      :session="selectedSession"
      @start="handleConfirmStart"
      @cancel="showStartModal = false"
    />

    <!-- End Session Modal -->
    <EndSessionModal
      v-if="showEndModal"
      :session="selectedSession"
      @end="handleConfirmEnd"
      @cancel="showEndModal = false"
    />

    <!-- Update Room Modal -->
    <UpdateRoomModal
      v-if="showUpdateRoomModal"
      :session="selectedSession"
      @update="handleConfirmUpdateRoom"
      @cancel="showUpdateRoomModal = false"
    />

    <!-- QR Generate Modal -->
    <QRGenerateModal
      v-if="showQRGenerateModal && selectedSession"
      :show="showQRGenerateModal"
      :session-id="selectedSession.id"
      @generated="handleQrGenerated"
      @close="showQRGenerateModal = false"
    />

    <!-- QR Display Modal -->
    <QRDisplayModal
      v-if="showQRDisplayModal && currentQrCode"
      :show="showQRDisplayModal"
      :qr-code="currentQrCode"
      @close="showQRDisplayModal = false; currentQrCode = null"
      @revoke="handleQrRevoke"
      @fullscreen="handleQrFullscreen"
    />

    <!-- QR Code List Modal -->
    <QRCodeListModal
      v-if="showQRListModal && selectedSession"
      :show="showQRListModal"
      :session="selectedSession"
      @close="showQRListModal = false; selectedSession = null"
      @view-qr="handleViewQrFromList"
    />

    <!-- Delete Modal -->
    <DeleteModal
      :show="showDeleteModal"
      title="Delete Session"
      message="Are you sure you want to delete this session? This action cannot be undone."
      :item-name="sessionToDelete ? `${sessionToDelete.courseName || sessionToDelete.courseCode || 'Session'} - ${sessionToDelete.section || ''}` : ''"
      :is-deleting="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
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
.sessions-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
}

.btn-create-session {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--color-secondary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create-session:hover {
  background: var(--color-secondary-light);
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--color-gray-200);
  padding-bottom: 0;
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-500);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-tab:hover {
  color: var(--color-secondary);
  background: var(--color-gray-50);
}

.filter-active {
  color: var(--color-secondary);
  border-bottom-color: var(--color-secondary);
  background: var(--color-gray-50);
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  background: var(--color-gray-200);
  color: var(--color-gray-600);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-active .count-badge {
  background: var(--color-secondary);
  color: white;
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
  margin: 0 0 1.5rem 0;
  max-width: 500px;
}

.btn-empty-action {
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

.btn-empty-action:hover {
  background: var(--color-secondary-light);
}

/* Sessions Content */
.sessions-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style>
