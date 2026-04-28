<script setup lang="ts">
import type { CreateSessionPayload, EndSessionPayload, SessionResponseDto, StartSessionPayload, UpdateSessionRoomPayload } from '@/api/sessions'
import type { EntityId } from '@/types'
import type { SessionStatus } from '@/utils/constants'
import { AlertTriangle, Calendar, Plus, RefreshCw } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Toast from '@/components/common/Toast.vue'
import { useToast } from '@/composables/useToast'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { useSessionStore } from '@/stores/sessionStore'
import { SESSION_STATUSES } from '@/utils/constants'
import { getErrorMessage, getErrorStatus } from '@/utils/httpError'

const CancelSessionModal = defineAsyncComponent(() => import('@/components/sessions/CancelSessionModal.vue'))
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

type DisplayedQrCode = Awaited<ReturnType<ReturnType<typeof useQrCodeStore>['fetchQrCode']>>

// State
const currentFilter = ref<'all' | SessionStatus>('all')
const showCreateModal = ref(false)
const showStartModal = ref(false)
const showEndModal = ref(false)
const showUpdateRoomModal = ref(false)
const showQRGenerateModal = ref(false)
const showQRDisplayModal = ref(false)
const showQRListModal = ref(false)
const showCancelModal = ref(false)
const sessionToCancel = ref<SessionResponseDto | null>(null)
const isCancelling = ref(false)
const selectedSession = ref<SessionResponseDto | null>(null)
const currentQrCode = ref<DisplayedQrCode | null>(null)
const errorMessage = ref('')

// Computed properties
const sessions = computed(() => sessionStore.sessions)

const filteredSessions = computed(() => {
  if (currentFilter.value === 'all') {
    return sessions.value
  }
  return sessionStore.sessionsByStatus(currentFilter.value)
})

interface StatusFilter {
  label: string
  value: 'all' | SessionStatus
  count: number
}

const statusFilters = computed<StatusFilter[]>(() => [
  { label: 'All', value: 'all', count: sessions.value.length },
  { label: 'Not Started', value: SESSION_STATUSES.NOT_STARTED, count: sessionStore.notStartedSessions.length },
  { label: 'Active', value: SESSION_STATUSES.ACTIVE, count: sessionStore.activeSessions.length },
  { label: 'Completed', value: SESSION_STATUSES.ENDED, count: sessionStore.endedSessions.length },
  { label: 'Cancelled', value: SESSION_STATUSES.CANCELLED, count: sessionStore.cancelledSessions.length },
])

const emptyStateTitle = computed(() => {
  const titles = {
    all: 'No Sessions Yet',
    not_started: 'No Upcoming Sessions',
    active: 'No Active Sessions',
    ended: 'No Completed Sessions',
    cancelled: 'No Cancelled Sessions',
  }
  return titles[currentFilter.value] || 'No Sessions'
})

const emptyStateMessage = computed(() => {
  const messages = {
    all: 'Create your first session to start managing attendance',
    not_started: 'All your upcoming sessions will appear here',
    active: 'Start a session to begin tracking attendance',
    ended: 'Completed sessions will be listed here',
    cancelled: 'Cancelled sessions will appear here',
  }
  return messages[currentFilter.value] || 'No sessions to display'
})

// Toast state and helpers
const { toast, showToast, closeToast } = useToast()

// Session cancellation handlers
function openCancelSession(sessionId: EntityId) {
  const session = sessionStore.sessions.find(s => s.id === sessionId)
  if (session) {
    sessionToCancel.value = session
    showCancelModal.value = true
  }
}

function closeCancelSession() {
  showCancelModal.value = false
  sessionToCancel.value = null
  isCancelling.value = false
}

async function handleConfirmCancel(reason: string) {
  if (!sessionToCancel.value)
    return

  isCancelling.value = true
  try {
    const sessionId = sessionToCancel.value.id
    await sessionStore.deleteSession(sessionId, reason)
    showToast('Session cancelled successfully!', 'success')
    closeCancelSession()
  }
  catch (error) {
    let message = getErrorMessage(error, 'Failed to cancel session. Please try again.')
    const status = getErrorStatus(error)
    if (status === 403) {
      message = 'You are not authorized to cancel this session. Only the assigned instructor can manage this session.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
  finally {
    isCancelling.value = false
  }
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

async function handleCreateSession(payload: CreateSessionPayload) {
  errorMessage.value = ''
  try {
    await sessionStore.createSession(payload)
    showCreateModal.value = false
    showToast('Session created successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to create session:', error)
    const message = getErrorMessage(error, 'Failed to create session. Please try again.')
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleStartSession(session: SessionResponseDto) {
  selectedSession.value = session
  showStartModal.value = true
}

async function handleConfirmStart(payload: Omit<StartSessionPayload, 'rowVersion'>) {
  errorMessage.value = ''
  if (!selectedSession.value)
    return

  try {
    await sessionStore.startSession(selectedSession.value.id, payload)
    showStartModal.value = false
    selectedSession.value = null
    showToast('Session started successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to start session:', error)
    let message = getErrorMessage(error, 'Failed to start session. Please try again.')
    const status = getErrorStatus(error)
    if (status === 403) {
      message = 'You are not authorized to start this session. Only the assigned instructor can manage this session.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleEndSession(session: SessionResponseDto) {
  selectedSession.value = session
  showEndModal.value = true
}

async function handleConfirmEnd(payload: Omit<EndSessionPayload, 'rowVersion'>) {
  errorMessage.value = ''
  if (!selectedSession.value)
    return

  try {
    await sessionStore.endSession(selectedSession.value.id, payload)
    showEndModal.value = false
    selectedSession.value = null
    showToast('Session ended successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to end session:', error)
    let message = getErrorMessage(error, 'Failed to end session. Please try again.')
    const status = getErrorStatus(error)
    if (status === 403) {
      message = 'You are not authorized to end this session. Only the assigned instructor can manage this session.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleDeleteSession(id: EntityId) {
  errorMessage.value = ''
  openCancelSession(id)
}

function handleUpdateRoom(session: SessionResponseDto) {
  selectedSession.value = session
  showUpdateRoomModal.value = true
}

async function handleConfirmUpdateRoom(payload: Omit<UpdateSessionRoomPayload, 'rowVersion'>) {
  errorMessage.value = ''
  if (!selectedSession.value)
    return

  try {
    await sessionStore.updateSessionRoom(selectedSession.value.id, payload)
    showUpdateRoomModal.value = false
    selectedSession.value = null
    showToast('Session room updated successfully!', 'success')
  }
  catch (error) {
    console.error('Failed to update room:', error)
    let message = getErrorMessage(error, 'Failed to update room. Please try again.')
    const status = getErrorStatus(error)
    if (status === 403) {
      message = 'You are not authorized to update this session. Only the assigned instructor can manage this session.'
    }
    showToast(message, 'error')
    errorMessage.value = message
  }
}

function handleGenerateQr(session: SessionResponseDto) {
  selectedSession.value = session
  showQRGenerateModal.value = true
}

async function handleQrGenerated(qrData: DisplayedQrCode) {
  currentQrCode.value = qrData
  showQRDisplayModal.value = true
  showToast('QR Code generated successfully!', 'success')
}

function handleQrRevoke(_qrCode: DisplayedQrCode) {
  if (confirm('Are you sure you want to revoke this QR code? It will no longer be valid for attendance.')) {
    // Since we're dealing with a simple image response, we'll just close the modal
    // In a real implementation, you'd call an API to revoke the QR code
    showToast('QR Code revoked successfully', 'success')
    showQRDisplayModal.value = false
    currentQrCode.value = null
  }
}

function handleQrFullscreen(qrCodeId: EntityId) {
  router.push(`/qr-code/projection/${qrCodeId}`)
}

function handleViewQrCodes(session: SessionResponseDto) {
  selectedSession.value = session
  showQRListModal.value = true
}

function handleViewSessionDetails(session: SessionResponseDto) {
  router.push(`/sessions/${session.id}`)
}

async function handleViewQrFromList(qrCode: DisplayedQrCode) {
  // Fetch the full QR code details including the image
  try {
    if (qrCode.id == null) {
      showToast('Failed to load QR code details', 'error')
      return
    }
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
        <Plus :size="20" />
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
      <AlertTriangle :size="48" class="error-icon" />
      <h3>Failed to Load Sessions</h3>
      <p>{{ errorMessage }}</p>
      <button class="btn-retry" @click="loadSessions">
        <RefreshCw :size="18" />
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredSessions.length && !sessionStore.loading" class="empty-state">
      <Calendar :size="64" class="empty-icon" />
      <h3>{{ emptyStateTitle }}</h3>
      <p>{{ emptyStateMessage }}</p>
      <button v-if="currentFilter === 'all'" class="btn-empty-action" @click="showCreateModal = true">
        <Plus :size="20" />
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
        @view-details="handleViewSessionDetails"
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
      v-if="showStartModal && selectedSession"
      :session="selectedSession"
      @start="handleConfirmStart"
      @cancel="showStartModal = false"
    />

    <!-- End Session Modal -->
    <EndSessionModal
      v-if="showEndModal && selectedSession"
      :session="selectedSession"
      @end="handleConfirmEnd"
      @cancel="showEndModal = false"
    />

    <!-- Update Room Modal -->
    <UpdateRoomModal
      v-if="showUpdateRoomModal && selectedSession"
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

    <!-- Cancel Session Modal -->
    <CancelSessionModal
      v-if="showCancelModal && sessionToCancel"
      :session="sessionToCancel"
      :is-deleting="isCancelling"
      @confirm="handleConfirmCancel"
      @cancel="closeCancelSession"
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

/* Responsive Styles */

/* Extra wide screens with DevTools */
@media (max-width: 1400px) {
  .sessions-view {
    padding: 0.875rem;
    max-width: 100%;
  }

  .filter-tabs {
    gap: 0.375rem;
  }

  .filter-tab {
    padding: 0.625rem 0.875rem;
    font-size: 0.813rem;
  }
}

/* Medium screens - handles DevTools being open */
@media (max-width: 1200px) {
  .sessions-view {
    padding: 0.75rem;
  }

  .sessions-header {
    gap: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .btn-create-session {
    padding: 0.625rem 1rem;
    font-size: 0.813rem;
  }

  .filter-tabs {
    gap: 0.375rem;
    margin-bottom: 0.875rem;
  }

  .filter-tab {
    padding: 0.625rem 0.75rem;
    font-size: 0.813rem;
  }

  .count-badge {
    min-width: 1.375rem;
    height: 1.375rem;
    font-size: 0.688rem;
  }
}

@media (max-width: 1024px) {
  .sessions-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.875rem;
  }

  .btn-create-session {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .sessions-view {
    padding: 0.75rem;
  }

  .sessions-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.813rem;
  }

  .btn-create-session {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }

  .filter-tabs {
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .filter-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.813rem;
  }

  .count-badge {
    min-width: 1.25rem;
    height: 1.25rem;
    font-size: 0.688rem;
  }

  .empty-state,
  .error-state {
    padding: 3rem 1.5rem;
  }

  .empty-state h3,
  .error-state h3 {
    font-size: 1.25rem;
  }

  .sessions-content {
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .sessions-view {
    padding: 0.5rem;
  }

  .sessions-header {
    margin-bottom: 0.5rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
  }

  .btn-create-session {
    padding: 0.625rem 0.875rem;
    font-size: 0.813rem;
  }

  .filter-tabs {
    margin-bottom: 0.5rem;
  }

  .filter-tab {
    padding: 0.5rem 0.625rem;
    font-size: 0.75rem;
  }

  .count-badge {
    min-width: 1rem;
    height: 1rem;
    padding: 0 0.375rem;
    font-size: 0.625rem;
  }

  .empty-state,
  .error-state {
    padding: 2rem 1rem;
  }

  .empty-icon,
  .error-icon {
    width: 48px;
    height: 48px;
  }

  .empty-state h3,
  .error-state h3 {
    font-size: 1.125rem;
  }

  .empty-state p,
  .error-state p {
    font-size: 0.875rem;
  }

  .btn-empty-action,
  .btn-retry {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  .sessions-content {
    border-radius: 6px;
  }
}
</style>
