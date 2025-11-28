<script setup>
import {
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutGrid,
  User,
  Users,
} from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// API
import {
  fetchActiveSessions,
  fetchAttendanceSummary,
  fetchClassrooms,
  fetchCourses,
  fetchInstructors,
  fetchSections,
  fetchStudents,
  fetchSystemHealth,
  fetchUpcomingSessions,
  fetchUsers,
} from '@/api/admin'

import ActiveSessionsTable from './widgets/ActiveSessionsTable.vue'
import AttendanceChart from './widgets/AttendanceChart.vue'
// Components
import HealthWidget from './widgets/HealthWidget.vue'
import StatsCard from './widgets/StatsCard.vue'

// State
const loading = ref(true)
const systemHealth = ref(null)
const attendanceSummary = ref(null)
const activeSessions = ref([])
const upcomingSessions = ref([])
const stats = ref({
  users: 0,
  students: 0,
  instructors: 0,
  courses: 0,
  sections: 0,
  classrooms: 0,
})

const refreshIntervals = ref([])

// Data Loading
async function loadDashboardData() {
  try {
    const [
      health,
      attendance,
      active,
      upcoming,
      users,
      students,
      instructors,
      courses,
      sections,
      classrooms,
    ] = await Promise.all([
      fetchSystemHealth().catch(() => ({ status: 'unhealthy' })),
      fetchAttendanceSummary().catch(() => null),
      fetchActiveSessions().catch(() => []),
      fetchUpcomingSessions().catch(() => []),
      fetchUsers().catch(() => []),
      fetchStudents().catch(() => []),
      fetchInstructors().catch(() => []),
      fetchCourses().catch(() => []),
      fetchSections().catch(() => []),
      fetchClassrooms().catch(() => []),
    ])

    systemHealth.value = health
    attendanceSummary.value = attendance
    activeSessions.value = active
    upcomingSessions.value = upcoming

    stats.value = {
      users: users.length,
      students: students.length,
      instructors: instructors.length,
      courses: courses.length,
      sections: sections.length,
      classrooms: classrooms.length,
    }
  }
  catch (error) {
    console.error('Failed to load admin dashboard data:', error)
  }
  finally {
    loading.value = false
  }
}

// Real-time updates
async function updateRealtimeData() {
  try {
    const [health, active, upcoming] = await Promise.all([
      fetchSystemHealth().catch(() => systemHealth.value),
      fetchActiveSessions().catch(() => activeSessions.value),
      fetchUpcomingSessions().catch(() => upcomingSessions.value),
    ])

    systemHealth.value = health
    activeSessions.value = active
    upcomingSessions.value = upcoming
  }
  catch (error) {
    console.error('Realtime update failed:', error)
  }
}

onMounted(() => {
  loadDashboardData()

  // Refresh real-time data every 30 seconds
  const interval = setInterval(updateRealtimeData, 30000)
  refreshIntervals.value.push(interval)
})

onBeforeUnmount(() => {
  refreshIntervals.value.forEach(clearInterval)
})
</script>

<template>
  <div class="admin-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p class="subtitle">
          System Overview & Monitoring
        </p>
      </div>
      <div class="header-actions">
        <HealthWidget :health="systemHealth" :loading="loading" />
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <StatsCard
        title="Total Users"
        :value="stats.users"
        :icon="Users"
        color="primary"
        :loading="loading"
      />
      <StatsCard
        title="Total Students"
        :value="stats.students"
        :icon="GraduationCap"
        color="primary"
        :loading="loading"
      />
      <StatsCard
        title="Instructors"
        :value="stats.instructors"
        :icon="User"
        color="primary"
        :loading="loading"
      />
      <StatsCard
        title="Courses"
        :value="stats.courses"
        :icon="BookOpen"
        color="primary"
        :loading="loading"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="main-content-grid">
      <!-- Left Column -->
      <div class="left-col">
        <div class="grid-row">
          <div class="col-8">
            <ActiveSessionsTable :sessions="activeSessions" :loading="loading" />
          </div>
          <div class="col-4">
            <AttendanceChart :data="attendanceSummary" :loading="loading" />
          </div>
        </div>

        <!-- Resource Stats -->
        <div class="resource-stats-grid">
          <StatsCard
            title="Active Sections"
            :value="stats.sections"
            :icon="LayoutGrid"
            color="purple"
            :loading="loading"
          />
          <StatsCard
            title="Classrooms"
            :value="stats.classrooms"
            :icon="LayoutGrid"
            color="blue"
            :loading="loading"
          />
          <StatsCard
            title="Upcoming Sessions"
            :value="upcomingSessions.length"
            :icon="Calendar"
            color="indigo"
            :loading="loading"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
  padding: 0;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  background: var(--bg-primary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
}

.dashboard-header:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

h1 {
  font-size: 1.875rem;
  font-weight: 700;
  background: var(--gradient-primary-diagonal);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.main-content-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.grid-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.resource-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

@media (max-width: 1024px) {
  .grid-row {
    grid-template-columns: 1fr;
  }

  .resource-stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .header-actions {
    width: 100%;
  }

  .admin-dashboard {
    padding: var(--spacing-md);
  }
}
</style>
