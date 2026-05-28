<script setup lang="ts">
import type { Session } from '@/types/domain/session'
import type { EntityId } from '@/types'
import { BookOpen, Calendar, CheckCircle, Clock } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getInstructorSubjects, getMySchedules } from '@/api/instructors'
import AdminDashboard from '@/components/dashboard/AdminDashboard.vue'
import SessionAttendanceModal from '@/components/dashboard/SessionAttendanceModal.vue'
import AttendanceChart from '@/components/dashboard/widgets/AttendanceChart.vue'
import StatsCard from '@/components/dashboard/widgets/StatsCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { LOCALE } from '@/utils/constants'

interface InstructorProfile {
  id?: EntityId
  firstname?: string
  lastname?: string
}

interface ScheduleItem {
  id: EntityId
  dayOfWeek?: string
  timeIn?: string
  timeOut?: string
  subject?: { code?: string, name?: string }
  classroom?: { name?: string }
  section?: { name?: string }
}

interface RawScheduleItem extends Record<string, unknown> {
  id?: EntityId
  dayOfWeek?: string
  timeIn?: string
  timeOut?: string
  subject?: { code?: string, name?: string }
  classroom?: { name?: string }
  section?: { name?: string }
}

interface RefreshIntervalMap {
  activeSessions?: ReturnType<typeof setInterval>
  upcomingSessions?: ReturnType<typeof setInterval>
  attendanceStats?: ReturnType<typeof setInterval>
  timeUpdate?: ReturnType<typeof setInterval>
}

interface DashboardAttendanceSummary {
  totalSessions?: number
  totalPresent?: number
  totalLate?: number
  totalAbsent?: number
  totalExcused?: number
  attendanceRate?: number
}

interface InstructorSubject extends Record<string, unknown> {
  id?: EntityId
  code?: string
  name?: string
}

const authStore = useAuthStore()
const sessionStore = useSessionStore()
const router = useRouter()

// State
const isLoading = ref(true)
const instructorProfile = ref<InstructorProfile | null>(null)
const schedules = ref<ScheduleItem[]>([])
const activeSessions = ref<Session[]>([])
const upcomingSessions = ref<Session[]>([])
const attendanceSummary = ref<DashboardAttendanceSummary | null>(null)
const subjects = ref<InstructorSubject[]>([])
const todaySessions = ref<Session[]>([])
const activeModalSessionId = ref<EntityId | null>(null)
const currentDateTime = ref(new Date())
const refreshIntervals = ref<RefreshIntervalMap>({})

// Computed
const isAuthenticated = computed(() => authStore.getIsAuthenticated)
const user = computed(() => authStore.userProfile)
const isStudent = computed(() => user.value?.role === 'Student')
const isInstructor = computed(() => user.value?.role === 'Instructor')
const isAdmin = computed(() => user.value?.role === 'Admin')

// User initials for avatar
const userInitials = computed(() => {
  if (!instructorProfile.value)
    return 'IN'
  const first = instructorProfile.value.firstname?.[0] || ''
  const last = instructorProfile.value.lastname?.[0] || ''
  return (first + last).toUpperCase() || 'IN'
})

// Full name
const fullName = computed(() => {
  if (!instructorProfile.value)
    return 'Instructor'
  return `${instructorProfile.value.firstname} ${instructorProfile.value.lastname}`
})

// Formatted date and time
const formattedDate = computed(() => {
  return currentDateTime.value.toLocaleDateString(LOCALE.DEFAULT, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
})

const formattedTime = computed(() => {
  return currentDateTime.value.toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT)
})

// Weekly schedule grouped by day
const weeklySchedule = computed(() => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const grouped: Record<string, ScheduleItem[]> = {}

  days.forEach((day) => {
    grouped[day] = schedules.value.filter(s => s.dayOfWeek === day)
  })

  return grouped
})

const currentDay = computed(() => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
})

// API Functions
async function loadInstructorData() {
  try {
    await authStore.fetchUserProfile()
    const profile = authStore.userProfile
    instructorProfile.value = profile?.instructorProfile || null

    if (instructorProfile.value?.id) {
      const subjectsData = await getInstructorSubjects(instructorProfile.value.id as EntityId)
      subjects.value = subjectsData.filter((item): item is InstructorSubject => typeof item === 'object' && item !== null)
    }
  }
  catch (error) {
    console.error('Failed to load instructor data:', error)
  }
}

async function loadSchedules() {
  try {
    const data = await getMySchedules()
    schedules.value = data
      .filter((item): item is RawScheduleItem => typeof item === 'object' && item !== null)
      .map((item) => {
        const fallbackId = `${item.dayOfWeek ?? ''}-${item.timeIn ?? ''}-${item.timeOut ?? ''}`
        return {
          id: item.id ?? fallbackId,
          dayOfWeek: item.dayOfWeek,
          timeIn: item.timeIn,
          timeOut: item.timeOut,
          subject: item.subject,
          classroom: item.classroom,
          section: item.section,
        }
      })
  }
  catch (error) {
    console.error('Failed to load schedules:', error)
  }
}

async function loadActiveSessions() {
  try {
    await sessionStore.fetchSessions()
    activeSessions.value = sessionStore.activeSessions
  }
  catch (error) {
    console.error('Failed to load active sessions:', error)
  }
}

async function loadUpcomingSessions() {
  try {
    await sessionStore.fetchSessions()
    upcomingSessions.value = sessionStore.upcomingSessions.slice(0, 5)
  }
  catch (error) {
    console.error('Failed to load upcoming sessions:', error)
  }
}

async function loadAttendanceSummary() {
  try {
    const { fetchAttendanceSummary } = await import('@/api/attendance')
    const data = await fetchAttendanceSummary()
    attendanceSummary.value = data
  }
  catch (error) {
    console.error('Failed to load attendance summary:', error)
  }
}

async function loadTodaySessions() {
  try {
    await sessionStore.fetchSessions()
    const today = new Date().toDateString()
    todaySessions.value = sessionStore.sessions.filter((session) => {
      if (!session.sessionDate)
        return false
      const sessionDate = new Date(session.sessionDate)
      return sessionDate.toDateString() === today
    })
  }
  catch (error) {
    console.error('Failed to load today\'s sessions:', error)
  }
}

// Modal
function openSessionModal(sessionId: EntityId) {
  activeModalSessionId.value = sessionId
}

function onModalClose() {
  activeModalSessionId.value = null
}

// Utility functions
function formatTime(isoString: string | null | undefined) {
  if (!isoString)
    return '-'
  const date = new Date(isoString)
  return date.toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT)
}

function updateDateTime() {
  currentDateTime.value = new Date()
}

// Lifecycle
onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }

  if (isAdmin.value) {
    isLoading.value = false
    return
  }

  if (isStudent.value) {
    isLoading.value = false
    return
  }

  if (!isInstructor.value) {
    isLoading.value = false
    return
  }

  // Update time every second
  updateDateTime()
  const timeInterval = setInterval(updateDateTime, 1000)

  // Load initial data
  isLoading.value = true
  try {
    await Promise.all([
      loadInstructorData(),
      loadSchedules(),
      loadActiveSessions(),
      loadUpcomingSessions(),
      loadAttendanceSummary(),
      loadTodaySessions(),
    ])
  }
  catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
  finally {
    isLoading.value = false
  }

  // Setup refresh intervals
  refreshIntervals.value.activeSessions = setInterval(loadActiveSessions, 30000)
  refreshIntervals.value.upcomingSessions = setInterval(loadUpcomingSessions, 120000)
  refreshIntervals.value.attendanceStats = setInterval(loadAttendanceSummary, 300000)

  refreshIntervals.value.timeUpdate = timeInterval
})

onBeforeUnmount(() => {
  Object.values(refreshIntervals.value).forEach((interval) => {
    if (interval) {
      clearInterval(interval)
    }
  })
})
</script>

<template>
  <div class="instructor-dashboard">
    <!-- Unauthenticated State -->
    <div v-if="!isAuthenticated" class="unauthenticated">
      <h2>Access Denied</h2>
      <p>You need to be logged in to view this page.</p>
      <router-link to="/login" class="login-link">
        Go to Login
      </router-link>
    </div>

    <!-- Student View - Redirect or Show Different Content -->
    <div v-else-if="isStudent" class="redirect-message">
      <h2>Student Dashboard</h2>
      <p>This is the instructor dashboard. Redirecting to student view...</p>
    </div>

    <!-- Admin Dashboard -->
    <AdminDashboard v-else-if="isAdmin" />

    <!-- Instructor Dashboard (Instructors Only) -->
    <template v-else-if="isInstructor">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="profile-section">
          <div class="avatar-wrapper">
            <div class="avatar">
              <span>{{ userInitials }}</span>
            </div>
            <div class="status-indicator" />
          </div>
          <div class="profile-info">
            <h1 class="welcome-text">
              Welcome back, <span class="name">{{ fullName }}</span>
            </h1>
            <p class="role-badge">
              Instructor
            </p>
          </div>
        </div>
        <div class="header-actions">
          <div class="date-time-display">
            <div class="current-date">
              {{ formattedDate }}
            </div>
            <div class="current-time">
              {{ formattedTime }}
            </div>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner" />
        <p>Loading dashboard...</p>
      </div>

      <!-- Main Content -->
      <template v-else>
        <!-- Statistics Cards -->
        <section class="stats-section">
          <div class="stats-grid">
            <StatsCard
              title="Total Sessions"
              :value="attendanceSummary?.totalSessions || 0"
              :icon="Calendar"
              color="purple"
            />
            <StatsCard
              title="Attendance Rate"
              :value="`${attendanceSummary?.attendanceRate?.toFixed(1) || 0}%`"
              :icon="CheckCircle"
              color="success"
            />
            <StatsCard
              title="Active Classes"
              :value="activeSessions.length"
              :icon="Clock"
              color="warning"
            />
            <StatsCard
              title="Subjects Taught"
              :value="subjects.length"
              :icon="BookOpen"
              color="info"
            />
          </div>
        </section>

        <!-- Main Grid -->
        <div class="main-grid">
          <!-- Left Column -->
          <div class="left-column">
            <!-- Active Sessions -->
            <div class="widget">
              <div class="widget-header">
                <h2 class="widget-title">
                  <span class="pulse-dot" />
                  Active Sessions
                </h2>
              </div>
              <div class="widget-content">
                <div v-if="activeSessions.length === 0" class="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                  <p>No active sessions</p>
                </div>
                <div v-else>
                  <div
                    v-for="session in activeSessions"
                    :key="session.id"
                    class="session-card active"
                    @click="openSessionModal(session.id)"
                  >
                    <div class="session-header">
                      <div>
                        <div class="session-title">
                          {{ session.subjectName }}
                        </div>
                        <div class="session-code">
                          {{ session.subjectCode }} - {{ session.sectionName }}
                        </div>
                      </div>
                      <span class="session-status-badge active">Active</span>
                    </div>
                    <div class="session-details">
                      <div class="session-detail-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span>{{ session.actualRoomName || session.scheduledRoomName }}</span>
                      </div>
                      <div class="session-detail-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span>Started {{ formatTime(session.actualStartTime) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upcoming Sessions -->
            <div class="widget">
              <div class="widget-header">
                <h2 class="widget-title">
                  Upcoming Today
                </h2>
              </div>
              <div class="widget-content">
                <div v-if="upcomingSessions.length === 0" class="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <p>No upcoming sessions today</p>
                </div>
                <div v-else>
                  <div
                    v-for="session in upcomingSessions"
                    :key="session.id"
                    class="session-card"
                    @click="openSessionModal(session.id)"
                  >
                    <div class="session-header">
                      <div>
                        <div class="session-title">
                          {{ session.subjectName }}
                        </div>
                        <div class="session-code">
                          {{ session.subjectCode }} - {{ session.sectionName }}
                        </div>
                      </div>
                      <span class="session-status-badge not-started">Upcoming</span>
                    </div>
                    <div class="session-details">
                      <div class="session-detail-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span>{{ session.scheduledRoomName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Attendance Overview -->
            <AttendanceChart :data="attendanceSummary" />
          </div>

          <!-- Right Column -->
          <div class="right-column">
            <!-- Weekly Schedule -->
            <div class="widget schedule-widget">
              <div class="widget-header">
                <h2 class="widget-title">
                  Weekly Schedule
                </h2>
              </div>
              <div class="widget-content">
                <div v-if="schedules.length === 0" class="empty-state">
                  <p>No schedules found</p>
                </div>
                <div v-else>
                  <div
                    v-for="(daySessions, day) in weeklySchedule"
                    :key="day"
                    class="schedule-day"
                    :class="{ today: day === currentDay }"
                  >
                    <div v-if="daySessions.length > 0">
                      <div class="schedule-day-header">
                        {{ day }}{{ day === currentDay ? ' (Today)' : '' }}
                      </div>
                      <div class="schedule-items">
                        <div
                          v-for="schedule in daySessions"
                          :key="schedule.id"
                          class="schedule-item"
                        >
                          <div class="schedule-time">
                            {{ schedule.timeIn }} - {{ schedule.timeOut }}
                          </div>
                          <div class="schedule-subject">
                            {{ schedule.subject?.code || '-' }} - {{ schedule.subject?.name || 'Unknown Subject' }}
                          </div>
                          <div class="schedule-location">
                            {{ schedule.classroom?.name || 'TBA' }} • {{ schedule.section?.name || 'TBA' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Today's Timeline -->
            <div class="widget">
              <div class="widget-header">
                <h2 class="widget-title">
                  Today's Timeline
                </h2>
              </div>
              <div class="widget-content">
                <div v-if="todaySessions.length === 0" class="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                  <p>No sessions scheduled for today</p>
                </div>
                <div v-else class="timeline">
                  <div
                    v-for="session in todaySessions"
                    :key="session.id"
                    class="timeline-item"
                    :class="{ active: session.status === 'active' }"
                  >
                    <div class="timeline-time">
                      {{ session.actualStartTime ? formatTime(session.actualStartTime) : 'Scheduled' }}
                    </div>
                    <div class="timeline-content">
                      <div class="session-title">
                        {{ session.subjectName }}
                      </div>
                      <div class="session-code">
                        {{ session.subjectCode }} - {{ session.sectionName }}
                      </div>
                      <div class="session-detail-row" style="margin-top: 0.5rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span>{{ session.actualRoomName || session.scheduledRoomName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Session Attendance Modal -->
    <SessionAttendanceModal
      :session-id="activeModalSessionId"
      @close="onModalClose"
    />
  </div>
</template>

<style scoped>
/* Dashboard Container */
.instructor-dashboard {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.profile-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--gradient-primary-diagonal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  box-shadow: var(--shadow-primary);
  transition: transform var(--transition-base);
}

.avatar:hover {
  transform: scale(1.05);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: var(--color-success);
  border: 3px solid var(--bg-secondary);
  border-radius: var(--radius-full);
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.welcome-text {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.welcome-text .name {
  color: var(--color-primary);
}

.role-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  background: var(--gradient-primary-diagonal);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  width: fit-content;
  margin: 0;
}

.header-actions {
  text-align: right;
}

.current-date {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.current-time {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Statistics */
.stats-section {
  margin-bottom: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Widget */
.widget {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.widget:hover {
  box-shadow: var(--shadow-md);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: var(--color-success);
  border-radius: var(--radius-full);
  animation: pulseDot 2s ease infinite;
}

@keyframes pulseDot {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-tertiary);
}

.empty-state svg {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state p {
  font-size: 0.875rem;
  margin: 0;
}

/* Session Card */
.session-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.session-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--gradient-primary);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.session-card:hover::before {
  opacity: 1;
}

.session-card:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
  box-shadow: var(--shadow-sm);
}

.session-card.active::before {
  opacity: 1;
  background: linear-gradient(180deg, var(--color-success), var(--color-success-light));
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: var(--spacing-sm);
}

.session-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.session-code {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.session-status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.session-status-badge.active {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.session-status-badge.not-started {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.session-detail-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.session-detail-row svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Schedule */
.schedule-widget {
  min-height: 600px;
}

.schedule-day {
  margin-bottom: var(--spacing-md);
}

.schedule-day-header {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-primary);
}

.schedule-day.today .schedule-day-header {
  color: var(--color-primary);
}

.schedule-item {
  background: var(--bg-secondary);
  border-left: 3px solid var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: var(--spacing-sm);
  transition: all var(--transition-base);
}

.schedule-item:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}

.schedule-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.schedule-subject {
  font-weight: 600;
  color: var(--text-primary);
  margin: 0.25rem 0;
}

.schedule-location {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: var(--spacing-lg);
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-primary);
}

.timeline-item {
  position: relative;
  padding-bottom: var(--spacing-lg);
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  border: 3px solid var(--bg-secondary);
}

.timeline-item.active::before {
  background: var(--color-success);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
  animation: pulseDot 2s ease infinite;
}

.timeline-time {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.timeline-content {
  background: var(--bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
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

/* Unauthenticated */
.unauthenticated,
.redirect-message {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  max-width: 500px;
  margin: 4rem auto;
  box-shadow: var(--shadow-md);
}

.unauthenticated h2,
.redirect-message h2 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.unauthenticated p,
.redirect-message p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.login-link {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: var(--gradient-primary-diagonal);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-base);
}

.login-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary-lg);
}

/* Responsive */
@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .instructor-dashboard {
    padding: var(--spacing-md);
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .welcome-text {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .schedule-widget {
    min-height: auto;
  }
}
</style>
