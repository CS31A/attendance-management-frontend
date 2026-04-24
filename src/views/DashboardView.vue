<script setup lang="ts">
import type { AttendanceSummaryDto, SessionAttendanceResponseDto } from '@/api/attendance'
import type { SessionResponseDto } from '@/api/sessions'
import type { EntityId } from '@/types'
import { ArcElement, CategoryScale, Chart as ChartJS, DoughnutController, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { calculateAttendanceStats, fetchAttendanceSummary, fetchSessionAttendance } from '@/api/attendance'
import { getInstructorSubjects, getMySchedules } from '@/api/instructors'
import AdminDashboard from '@/components/dashboard/AdminDashboard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { LOCALE } from '@/utils/constants'
import { formatLongDate } from '@/utils/date'
import { entityIdsMatch } from '@/utils/entityId'
import { getErrorMessage } from '@/utils/httpError'

const Doughnut = defineAsyncComponent(() => import('vue-chartjs').then(module => ({ default: module.Doughnut })))

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

interface DashboardAttendanceSummary extends AttendanceSummaryDto {
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

interface SessionAttendanceModalData {
  session: SessionResponseDto
  attendanceRecords: SessionAttendanceResponseDto[]
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  attendanceRate: number
  totalEnrolled: number | null
  attendanceMeta: string
}

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, DoughnutController, ArcElement)

const authStore = useAuthStore()
const sessionStore = useSessionStore()
const router = useRouter()

// State
const isLoading = ref(true)
const instructorProfile = ref<InstructorProfile | null>(null)
const schedules = ref<ScheduleItem[]>([])
const activeSessions = ref<SessionResponseDto[]>([])
const upcomingSessions = ref<SessionResponseDto[]>([])
const attendanceSummary = ref<DashboardAttendanceSummary | null>(null)
const subjects = ref<InstructorSubject[]>([])
const todaySessions = ref<SessionResponseDto[]>([])
const showModal = ref(false)
const modalSessionData = ref<SessionAttendanceModalData | null>(null)
const modalLoading = ref(false)
const modalErrorMessage = ref('')
const activeModalSessionId = ref<EntityId | null>(null)
const currentDateTime = ref(new Date())
const refreshIntervals = ref<RefreshIntervalMap>({})

// Computed
const isAuthenticated = computed(() => authStore.getIsAuthenticated)
const user = computed(() => authStore.userProfile) // Changed from authStore.user to authStore.userProfile for role info
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

// Attendance chart data
const attendanceChartData = computed(() => {
  if (!attendanceSummary.value) {
    return {
      labels: ['Present', 'Late', 'Absent', 'Excused'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          'var(--color-success)',
          'var(--color-warning)',
          'var(--color-error)',
          'var(--color-info)',
        ],
        borderWidth: 0,
      }],
    }
  }

  return {
    labels: ['Present', 'Late', 'Absent', 'Excused'],
    datasets: [{
      data: [
        attendanceSummary.value.totalPresent || 0,
        attendanceSummary.value.totalLate || 0,
        attendanceSummary.value.totalAbsent || 0,
        attendanceSummary.value.totalExcused || 0,
      ],
      backgroundColor: [
        'var(--color-success)',
        'var(--color-warning)',
        'var(--color-error)',
        'var(--color-info)',
      ],
      borderWidth: 0,
    }],
  }
})

const attendanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
}

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
    // Fetch the user profile from the store
    await authStore.fetchUserProfile()
    // Get the instructor profile from the store's userProfile
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

// Modal functions
async function openSessionModal(sessionId: EntityId) {
  activeModalSessionId.value = sessionId
  showModal.value = true
  modalLoading.value = true
  modalSessionData.value = null
  modalErrorMessage.value = ''
  const requestSessionId = sessionId

  try {
    const selectedSession = sessionStore.sessions.find(session => entityIdsMatch(session.id, sessionId))
      || activeSessions.value.find(session => entityIdsMatch(session.id, sessionId))
      || upcomingSessions.value.find(session => entityIdsMatch(session.id, sessionId))
      || todaySessions.value.find(session => entityIdsMatch(session.id, sessionId))
      || await sessionStore.fetchSessionById(sessionId)

    const attendanceRecords = await fetchSessionAttendance(sessionId)
    const stats = calculateAttendanceStats(attendanceRecords)
    const totalEnrolled = typeof selectedSession.totalEnrolled === 'number'
      ? selectedSession.totalEnrolled
      : null
    const attendanceMeta = attendanceRecords.length === 0
      ? 'Attendance not recorded yet'
      : `${attendanceRecords.length} attendance record${attendanceRecords.length === 1 ? '' : 's'}`

    if (!entityIdsMatch(activeModalSessionId.value, requestSessionId)) {
      return
    }

    modalSessionData.value = {
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
    if (!entityIdsMatch(activeModalSessionId.value, requestSessionId)) {
      return
    }
    modalSessionData.value = null
    modalErrorMessage.value = getErrorMessage(error, 'Failed to load session attendance. Please try again.')
  }
  finally {
    if (entityIdsMatch(activeModalSessionId.value, requestSessionId)) {
      modalLoading.value = false
    }
  }
}

function retrySessionModal() {
  if (activeModalSessionId.value !== null) {
    void openSessionModal(activeModalSessionId.value)
  }
}

function closeModal() {
  showModal.value = false
  modalSessionData.value = null
  modalErrorMessage.value = ''
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
    // Admin users have their own dashboard component which handles data loading
    isLoading.value = false
    return
  }

  if (isStudent.value) {
    // Student users see a different dashboard - existing implementation
    isLoading.value = false
    return
  }

  // Only show instructor dashboard for instructors
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
  refreshIntervals.value.activeSessions = setInterval(loadActiveSessions, 30000) // 30 seconds
  refreshIntervals.value.upcomingSessions = setInterval(loadUpcomingSessions, 120000) // 2 minutes
  refreshIntervals.value.attendanceStats = setInterval(loadAttendanceSummary, 300000) // 5 minutes

  // Cleanup timer
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
            <div class="stat-card">
              <div class="stat-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">
                  Total Sessions
                </h3>
                <p class="stat-value">
                  {{ attendanceSummary?.totalSessions || 0 }}
                </p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">
                  Attendance Rate
                </h3>
                <p class="stat-value">
                  {{ attendanceSummary?.attendanceRate?.toFixed(1) || 0 }}%
                </p>
                <div class="trend-indicator" :class="{ positive: (attendanceSummary?.attendanceRate || 0) >= 75 }">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                  <span>{{ (attendanceSummary?.attendanceRate || 0) >= 90 ? 'Excellent' : (attendanceSummary?.attendanceRate || 0) >= 75 ? 'Good' : 'Needs Improvement' }}</span>
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">
                  Active Classes
                </h3>
                <p class="stat-value">
                  {{ activeSessions.length }}
                </p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
              </div>
              <div class="stat-content">
                <h3 class="stat-label">
                  Subjects Taught
                </h3>
                <p class="stat-value">
                  {{ subjects.length }}
                </p>
              </div>
            </div>
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

            <!-- Attendance Statistics -->
            <div class="widget">
              <div class="widget-header">
                <h2 class="widget-title">
                  Attendance Overview
                </h2>
              </div>
              <div class="widget-content">
                <div class="attendance-stats-grid">
                  <div class="attendance-stat present">
                    <div class="attendance-stat-value">
                      {{ attendanceSummary?.totalPresent || 0 }}
                    </div>
                    <div class="attendance-stat-label">
                      Present
                    </div>
                  </div>
                  <div class="attendance-stat late">
                    <div class="attendance-stat-value">
                      {{ attendanceSummary?.totalLate || 0 }}
                    </div>
                    <div class="attendance-stat-label">
                      Late
                    </div>
                  </div>
                  <div class="attendance-stat absent">
                    <div class="attendance-stat-value">
                      {{ attendanceSummary?.totalAbsent || 0 }}
                    </div>
                    <div class="attendance-stat-label">
                      Absent
                    </div>
                  </div>
                  <div class="attendance-stat excused">
                    <div class="attendance-stat-value">
                      {{ attendanceSummary?.totalExcused || 0 }}
                    </div>
                    <div class="attendance-stat-label">
                      Excused
                    </div>
                  </div>
                </div>
                <div class="chart-container">
                  <Doughnut :data="attendanceChartData" :options="attendanceChartOptions" />
                </div>
              </div>
            </div>
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

    <!-- Session Detail Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            Session Attendance
          </h2>
          <button class="modal-close" @click="closeModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="modalLoading" class="modal-loading">
            <div class="spinner" />
            <p>Loading attendance data...</p>
          </div>
          <div v-else-if="modalSessionData" class="modal-content">
            <div class="session-info">
              <h3>{{ modalSessionData.session.subjectName }} - {{ modalSessionData.session.sectionName }}</h3>
              <p>
                {{ formatLongDate(modalSessionData.session.sessionDate, '-') }} •
                {{ modalSessionData.totalEnrolled === null ? 'Enrollment unavailable' : `${modalSessionData.totalEnrolled} students enrolled` }}
                • {{ modalSessionData.attendanceMeta }}
              </p>
            </div>

            <div class="attendance-stats-grid" style="margin: 1.5rem 0;">
              <div class="attendance-stat present">
                <div class="attendance-stat-value">
                  {{ modalSessionData.presentCount }}
                </div>
                <div class="attendance-stat-label">
                  Present
                </div>
              </div>
              <div class="attendance-stat late">
                <div class="attendance-stat-value">
                  {{ modalSessionData.lateCount }}
                </div>
                <div class="attendance-stat-label">
                  Late
                </div>
              </div>
              <div class="attendance-stat absent">
                <div class="attendance-stat-value">
                  {{ modalSessionData.absentCount }}
                </div>
                <div class="attendance-stat-label">
                  Absent
                </div>
              </div>
              <div class="attendance-stat rate">
                <div class="attendance-stat-value" style="color: var(--color-primary);">
                  {{ modalSessionData.attendanceRate?.toFixed(1) }}%
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
                <tr v-for="record in modalSessionData.attendanceRecords" :key="record.studentId">
                  <td>{{ record.studentNumber }}</td>
                  <td>{{ record.studentName }}</td>
                  <td>
                    <span class="attendance-badge" :class="record.status.toLowerCase()">
                      {{ record.status }}
                    </span>
                  </td>
                  <td>{{ record.checkInTime ? formatTime(record.checkInTime) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="modal-error-state">
            <p class="modal-error-message">
              {{ modalErrorMessage || 'Failed to load session attendance. Please try again.' }}
            </p>
            <div class="modal-error-actions">
              <button class="btn-secondary" @click="closeModal">
                Close
              </button>
              <button class="btn-primary" @click="retrySessionModal">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.stat-icon.purple {
  background: var(--gradient-primary-diagonal);
}

.stat-icon.green {
  background: linear-gradient(135deg, var(--color-success), var(--color-success-light));
}

.stat-icon.amber {
  background: linear-gradient(135deg, var(--color-warning), var(--color-warning-light));
}

.stat-icon.blue {
  background: linear-gradient(135deg, var(--color-info), var(--color-info-light));
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin: 0;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-error);
}

.trend-indicator.positive {
  color: var(--color-success);
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

/* Attendance Stats */
.attendance-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
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
.attendance-stat.excused { border-color: var(--color-info); }

.attendance-stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.attendance-stat.present .attendance-stat-value { color: var(--color-success); }
.attendance-stat.late .attendance-stat-value { color: var(--color-warning); }
.attendance-stat.absent .attendance-stat-value { color: var(--color-error); }
.attendance-stat.excused .attendance-stat-value { color: var(--color-info); }

.attendance-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 500;
  margin: 0;
}

.chart-container {
  height: 200px;
  margin-top: var(--spacing-lg);
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

/* Modal */
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

  .attendance-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .welcome-text {
    font-size: 1.5rem;
  }

  .modal {
    width: 95%;
    max-height: 95vh;
  }
}

@media (max-width: 640px) {
  .attendance-stats-grid {
    grid-template-columns: 1fr;
  }

  .schedule-widget {
    min-height: auto;
  }
}
</style>
