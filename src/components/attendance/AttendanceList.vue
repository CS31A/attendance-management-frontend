<script setup>
import { Calendar, ChevronRight, Clock, Filter, MapPin, Search } from 'lucide-vue-next'
import { computed, defineAsyncComponent, ref } from 'vue'
import { formatShortWeekdayDate as formatDate } from '@/utils/date'

const props = defineProps({
  sessions: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

const LoadingSpinner = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'))

// State
const searchQuery = ref('')
const selectedDate = ref(getTodayDate())
const statusFilter = ref('all')

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

// Computed
const filteredSessions = computed(() => {
  let result = props.sessions

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((session) => {
      return (
        session.subjectName?.toLowerCase().includes(query)
        || session.subjectCode?.toLowerCase().includes(query)
        || session.sectionName?.toLowerCase().includes(query)
        || session.startedByName?.toLowerCase().includes(query)
      )
    })
  }

  // Filter by date
  if (selectedDate.value) {
    result = result.filter((session) => {
      const sessionDate = session.sessionDate?.split('T')[0]
      return sessionDate === selectedDate.value
    })
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(session => session.status === statusFilter.value)
  }

  // Sort by actual start time or session date
  return result.sort((a, b) => {
    const timeA = a.actualStartTime || a.sessionDate || ''
    const timeB = b.actualStartTime || b.sessionDate || ''
    return timeA.localeCompare(timeB)
  })
})

const sessionCounts = computed(() => ({
  total: props.sessions.length,
  filtered: filteredSessions.value.length,
  active: props.sessions.filter(s => s.status === 'active').length,
  notStarted: props.sessions.filter(s => s.status === 'not_started').length,
  ended: props.sessions.filter(s => s.status === 'ended').length,
}))

// Methods
function handleSelectSession(session) {
  emit('select', session)
}

function formatTime(timeString) {
  if (!timeString)
    return 'N/A'
  // Handle both time-only format (HH:MM:SS) and full datetime format
  if (timeString.includes('T')) {
    const time = timeString.split('T')[1]
    return time.substring(0, 5) // HH:MM format
  }
  return timeString.substring(0, 5) // HH:MM format
}

function getStatusLabel(status) {
  const labels = {
    not_started: 'Not Started',
    active: 'Active',
    ended: 'Ended',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

function getStatusClass(status) {
  return `status-${status?.replace('_', '-')}`
}

function clearFilters() {
  searchQuery.value = ''
  selectedDate.value = getTodayDate()
  statusFilter.value = 'all'
}
</script>

<template>
  <div class="attendance-list">
    <!-- Filters Section -->
    <div class="filters-section">
      <div class="filter-row">
        <!-- Search -->
        <div class="search-wrapper">
          <Search :size="18" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search sessions..."
            class="search-input"
          >
        </div>

        <!-- Date Filter -->
        <div class="filter-group">
          <Calendar :size="18" class="filter-icon" />
          <input
            v-model="selectedDate"
            type="date"
            class="date-input"
          >
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <Filter :size="18" class="filter-icon" />
          <select v-model="statusFilter" class="status-select">
            <option value="all">
              All Status
            </option>
            <option value="not_started">
              Not Started
            </option>
            <option value="active">
              Active
            </option>
            <option value="ended">
              Ended
            </option>
          </select>
        </div>

        <!-- Clear Filters -->
        <button class="btn-clear" @click="clearFilters">
          Clear Filters
        </button>
      </div>

      <!-- Results Count -->
      <div class="results-info">
        <span class="results-count">
          Showing {{ filteredSessions.length }} of {{ sessions.length }} sessions
        </span>
        <div class="status-summary">
          <span class="summary-badge active">{{ sessionCounts.active }} Active</span>
          <span class="summary-badge not-started">{{ sessionCounts.notStarted }} Pending</span>
          <span class="summary-badge ended">{{ sessionCounts.ended }} Ended</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      type="inline"
      message="Loading sessions..."
      size="medium"
    />

    <!-- Empty State -->
    <div v-else-if="!filteredSessions.length" class="empty-state">
      <Calendar :size="48" class="empty-icon" />
      <h3>No Sessions Found</h3>
      <p v-if="searchQuery || selectedDate || statusFilter !== 'all'">
        Try adjusting your filters or selecting a different date.
      </p>
      <p v-else>
        No sessions available for attendance recording.
      </p>
    </div>

    <!-- Sessions Grid -->
    <div v-else class="sessions-grid">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="session-card"
        :class="{ 'is-active': session.status === 'active' }"
        @click="handleSelectSession(session)"
      >
        <div class="card-header">
          <div class="course-info">
            <span class="course-code">{{ session.subjectCode }}</span>
            <span class="section-name">{{ session.sectionName }}</span>
          </div>
          <span class="status-badge" :class="getStatusClass(session.status)">
            {{ getStatusLabel(session.status) }}
          </span>
        </div>

        <h3 class="course-name">
          {{ session.subjectName }}
        </h3>

        <div class="session-details">
          <div class="detail-item">
            <Calendar :size="16" />
            <span>{{ formatDate(session.sessionDate) }}</span>
          </div>
          <div v-if="session.actualStartTime" class="detail-item">
            <Clock :size="16" />
            <span>Started: {{ formatTime(session.actualStartTime) }}</span>
          </div>
          <div v-if="session.attendanceCutOff" class="detail-item">
            <Clock :size="16" />
            <span>Cut-off: {{ formatTime(session.attendanceCutOff) }}</span>
          </div>
          <div v-if="session.actualRoomName || session.scheduledRoomName" class="detail-item">
            <MapPin :size="16" />
            <span>{{ session.actualRoomName || session.scheduledRoomName }}</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="instructor-name">{{ session.startedByName || 'N/A' }}</span>
          <ChevronRight :size="20" class="arrow-icon" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-list {
  width: 100%;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-gray-50);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-gray-200);
}

.filter-icon {
  color: var(--color-gray-500);
}

.date-input,
.status-select {
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: var(--color-gray-700);
  cursor: pointer;
}

.date-input:focus,
.status-select:focus {
  outline: none;
}

.btn-clear {
  padding: 0.75rem 1rem;
  background: transparent;
  color: var(--color-gray-500);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.results-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.results-count {
  font-size: 0.9rem;
  color: var(--color-gray-500);
}

.status-summary {
  display: flex;
  gap: 0.75rem;
}

.summary-badge {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
}

.summary-badge.active {
  background: var(--color-success-bg);
  color: rgb(22, 101, 52);
}

.summary-badge.not-started {
  background: rgb(254, 249, 195);
  color: rgb(133, 77, 14);
}

.summary-badge.ended {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  color: var(--color-gray-400);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-gray-500);
  margin: 0;
}

/* Sessions Grid */
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.session-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.session-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.session-card.is-active {
  border-color: var(--color-success);
  background: linear-gradient(135deg, var(--color-success-bg) 0%, white 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-code {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-secondary);
}

.section-name {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-not-started {
  background: var(--color-warning-bg);
  color: rgb(146, 64, 14);
}

.status-active {
  background: var(--color-success-bg);
  color: rgb(6, 95, 70);
}

.status-ended {
  background: var(--color-gray-200);
  color: var(--color-gray-600);
}

.status-cancelled {
  background: var(--color-error-lighter);
  color: var(--color-error-darkest);
}

.course-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 1rem 0;
  line-height: 1.3;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-gray-500);
}

.detail-item svg {
  color: var(--color-gray-400);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.instructor-name {
  font-size: 0.9rem;
  color: var(--color-gray-700);
  font-weight: 500;
}

.arrow-icon {
  color: var(--color-gray-400);
  transition: transform 0.2s;
}

.session-card:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--color-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }

  .search-wrapper {
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .results-info {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .sessions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
