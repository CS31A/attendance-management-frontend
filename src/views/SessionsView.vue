<template>
  <div class="sessions-view">
    <!-- Header Section -->
    <div class="sessions-header">
      <div class="header-content">
        <h1 class="page-title">Session Management</h1>
        <p class="page-subtitle">Manage your class sessions and attendance tracking</p>
      </div>
      <button @click="showCreateModal = true" class="btn-create-session">
        <Plus size="20" />
        <span>Create Session</span>
      </button>
    </div>

    <!-- Status Filter Tabs -->
    <div class="filter-tabs">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        @click="currentFilter = filter.value"
        class="filter-tab"
        :class="{ 'filter-active': currentFilter === filter.value }"
      >
        {{ filter.label }}
        <span v-if="filter.count !== undefined" class="count-badge">
          {{ filter.count }}
        </span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="sessionStore.loading && !sessions.length" class="loading-state">
      <Loader2 class="spinner" size="40" />
      <p>Loading sessions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="error-state">
      <AlertTriangle size="48" class="error-icon" />
      <h3>Failed to Load Sessions</h3>
      <p>{{ errorMessage }}</p>
      <button @click="loadSessions" class="btn-retry">
        <RefreshCw size="18" />
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredSessions.length && !sessionStore.loading" class="empty-state">
      <Calendar size="64" class="empty-icon" />
      <h3>{{ emptyStateTitle }}</h3>
      <p>{{ emptyStateMessage }}</p>
      <button v-if="currentFilter === 'all'" @click="showCreateModal = true" class="btn-empty-action">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Calendar, Loader2, AlertTriangle, RefreshCw } from 'lucide-vue-next'
import { useSessionStore } from '@/stores/sessionStore'
import SessionTable from '@/components/sessions/SessionTable.vue'
import CreateSessionModal from '@/components/sessions/CreateSessionModal.vue'
import StartSessionModal from '@/components/sessions/StartSessionModal.vue'
import EndSessionModal from '@/components/sessions/EndSessionModal.vue'
import UpdateRoomModal from '@/components/sessions/UpdateRoomModal.vue'
import { showSuccess, showError } from '@/utils/toast'

const sessionStore = useSessionStore()

// State
const currentFilter = ref('all')
const showCreateModal = ref(false)
const showStartModal = ref(false)
const showEndModal = ref(false)
const showUpdateRoomModal = ref(false)
const selectedSession = ref(null)
const errorMessage = ref('')

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
  { label: 'Cancelled', value: 'cancelled', count: sessionStore.cancelledSessions.length }
])

const emptyStateTitle = computed(() => {
  const titles = {
    all: 'No Sessions Yet',
    not_started: 'No Upcoming Sessions',
    active: 'No Active Sessions',
    completed: 'No Completed Sessions',
    cancelled: 'No Cancelled Sessions'
  }
  return titles[currentFilter.value] || 'No Sessions'
})

const emptyStateMessage = computed(() => {
  const messages = {
    all: 'Create your first session to start managing attendance',
    not_started: 'All your upcoming sessions will appear here',
    active: 'Start a session to begin tracking attendance',
    completed: 'Completed sessions will be listed here',
    cancelled: 'Cancelled sessions will appear here'
  }
  return messages[currentFilter.value] || 'No sessions to display'
})

// Methods
const loadSessions = async () => {
  errorMessage.value = ''
  try {
    await sessionStore.fetchSessions()
  } catch (error) {
    console.error('Failed to load sessions:', error)
    const message = error.response?.data?.message || 'Failed to load sessions. Please try again.'
    showError(message)
    errorMessage.value = message
  }
}

const handleCreateSession = async (payload) => {
  errorMessage.value = ''
  try {
    await sessionStore.createSession(payload)
    showCreateModal.value = false
    showSuccess('Session created successfully!')
  } catch (error) {
    console.error('Failed to create session:', error)
    const message = error.response?.data?.message || 'Failed to create session. Please try again.'
    showError(message)
    errorMessage.value = message
  }
}

const handleStartSession = (session) => {
  selectedSession.value = session
  showStartModal.value = true
}

const handleConfirmStart = async (payload) => {
  errorMessage.value = ''
  try {
    await sessionStore.startSession(selectedSession.value.id, payload)
    showStartModal.value = false
    selectedSession.value = null
    showSuccess('Session started successfully!')
  } catch (error) {
    console.error('Failed to start session:', error)
    let message = 'Failed to start session. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to start this session. Only the assigned instructor can manage this session.'
    } else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot start this session. Check the session status.'
    }
    showError(message)
    errorMessage.value = message
  }
}

const handleEndSession = (session) => {
  selectedSession.value = session
  showEndModal.value = true
}

const handleConfirmEnd = async (payload) => {
  errorMessage.value = ''
  try {
    await sessionStore.endSession(selectedSession.value.id, payload)
    showEndModal.value = false
    selectedSession.value = null
    showSuccess('Session ended successfully!')
  } catch (error) {
    console.error('Failed to end session:', error)
    let message = 'Failed to end session. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to end this session. Only the assigned instructor can manage this session.'
    } else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot end this session. Check the session status.'
    }
    showError(message)
    errorMessage.value = message
  }
}

const handleDeleteSession = async (sessionId) => {
  if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
    return
  }

  errorMessage.value = ''
  try {
    await sessionStore.deleteSession(sessionId)
    showSuccess('Session deleted successfully!')
  } catch (error) {
    console.error('Failed to delete session:', error)
    let message = 'Failed to delete session. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to delete this session. Only the assigned instructor can manage this session.'
    } else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot delete this session. Only sessions that have not started can be deleted.'
    }
    showError(message)
    errorMessage.value = message
  }
}

const handleUpdateRoom = (session) => {
  selectedSession.value = session
  showUpdateRoomModal.value = true
}

const handleConfirmUpdateRoom = async (payload) => {
  errorMessage.value = ''
  try {
    await sessionStore.updateSessionRoom(selectedSession.value.id, payload)
    showUpdateRoomModal.value = false
    selectedSession.value = null
    showSuccess('Session room updated successfully!')
  } catch (error) {
    console.error('Failed to update room:', error)
    let message = 'Failed to update room. Please try again.'
    if (error.response?.status === 403) {
      message = 'You are not authorized to update this session. Only the assigned instructor can manage this session.'
    } else if (error.response?.status === 400) {
      message = error.response?.data?.message || 'Cannot update room. Check the session status.'
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

<style scoped>
.sessions-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.sessions-header {
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

.btn-create-session {
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

.btn-create-session:hover {
  background: #4338ca;
}

/* Filter Tabs */
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0;
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-tab:hover {
  color: #4f46e5;
  background: #f9fafb;
}

.filter-active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
  background: #f9fafb;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  background: #e5e7eb;
  color: #4b5563;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-active .count-badge {
  background: #4f46e5;
  color: white;
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
  margin: 0 0 1.5rem 0;
  max-width: 500px;
}

.btn-empty-action {
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

.btn-empty-action:hover {
  background: #4338ca;
}

/* Sessions Content */
.sessions-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style>
