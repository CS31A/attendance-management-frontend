<script setup>
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useUserStore } from '@/stores/userStore'

const SessionCard = defineAsyncComponent(() => import('@/components/sessions/SessionCard.vue'))
const Line = defineAsyncComponent(() => import('vue-chartjs').then(module => ({ default: module.Line })))

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const authStore = useAuthStore()
const userStore = useUserStore()
const sessionStore = useSessionStore()

// Computed properties for auth state
const isAuthenticated = authStore.getIsAuthenticated
const user = authStore.user

// Check if user is a student
const isStudent = computed(() => user?.role === 'Student')

// Get upcoming and active sessions for students
const upcomingSessions = computed(() => {
  if (!isStudent.value)
    return []
  return sessionStore.upcomingSessions.slice(0, 3) // Show max 3 upcoming sessions
})

const activeSessions = computed(() => {
  if (!isStudent.value)
    return []
  return sessionStore.activeSessions
})

const hasAnySessions = computed(() => {
  return upcomingSessions.value.length > 0 || activeSessions.value.length > 0
})

// Get real data from userStore
const totalStudents = computed(() => userStore.students.length)
const totalTeachers = computed(() => userStore.instructors.length)
const totalUsers = computed(() => userStore.users.length)
const userManagement = computed(() => userStore.users.length)

// Calculate percentages based on real data
const registeredPercentage = computed(() => {
  const target = 100 // Target number of users
  return Math.min((totalUsers.value / target) * 100, 100)
})

const studentsPercentage = computed(() => {
  const target = 50 // Target number of students
  return Math.min((totalStudents.value / target) * 100, 100)
})

const teachersPercentage = computed(() => {
  const target = 20 // Target number of teachers
  return Math.min((totalTeachers.value / target) * 100, 100)
})

const managementPercentage = computed(() => {
  const target = 100 // Target for user management
  return Math.min((totalUsers.value / target) * 100, 100)
})

// Loading state
const isLoading = computed(() => userStore.loading)

// Profile picture upload functionality
const userProfilePicture = ref(localStorage.getItem('userProfilePicture') || null)
const fileInput = ref(null)
const isUploading = ref(false)

// Profile picture methods
function _triggerFileUpload() {
  fileInput.value?.click()
}

async function _handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file)
    return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB')
    return
  }

  isUploading.value = true

  try {
    // Convert to base64 for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      userProfilePicture.value = e.target.result
      // Save to localStorage to persist across refreshes
      localStorage.setItem('userProfilePicture', e.target.result)
    }
    reader.readAsDataURL(file)

    // Here you would upload to your backend
    // await uploadProfilePicture(file)
  }
  catch (error) {
    console.error('Error uploading profile picture:', error)
    alert('Failed to upload profile picture')
  }
  finally {
    isUploading.value = false
  }
}

// Method to clear profile picture
function _clearProfilePicture() {
  userProfilePicture.value = null
  localStorage.removeItem('userProfilePicture')
}

// Load data when component mounts
onMounted(async () => {
  if (userStore.users.length === 0) {
    await userStore.fetchUsers()
  }

  // Fetch sessions for students
  if (isStudent.value && sessionStore.sessions.length === 0) {
    try {
      await sessionStore.fetchSessions()
    }
    catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }
})

// Chart.js data
const chartData = computed(() => ({
  labels: ['S', 'S', 'M', 'M', 'T', 'T', 'W', 'W', 'T', 'T', 'F', 'F', 'S'],
  datasets: [
    {
      label: 'This Week',
      data: [30, 45, 35, 50, 45, 55, 50, 60, 55, 65, 60, 50, 55],
      borderColor: 'rgb(236, 72, 153)',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: 'rgb(236, 72, 153)',
      pointHoverBorderColor: 'var(--text-white)',
      pointHoverBorderWidth: 2,
    },
    {
      label: 'Last Week',
      data: [25, 35, 40, 35, 45, 40, 50, 45, 55, 50, 45, 35, 40],
      borderColor: 'var(--color-gray-900)',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: 'var(--color-gray-900)',
      pointHoverBorderColor: 'var(--text-white)',
      pointHoverBorderWidth: 2,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold',
      },
      bodyFont: {
        size: 13,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 60,
      ticks: {
        stepSize: 10,
        font: {
          size: 12,
        },
        color: 'var(--color-gray-400)',
      },
      grid: {
        color: 'var(--color-gray-100)',
        drawBorder: false,
      },
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 12,
          weight: '500',
        },
        color: 'var(--color-gray-400)',
      },
    },
  },
}

// Get user initials
const _getUserInitials = computed(() => {
  if (!user?.name)
    return 'U'
  return user.name.split(' ').map(n => n[0]).join('').toUpperCase()
})
</script>

<template>
  <div class="dashboard">
    <!-- Unauthenticated state -->
    <div v-if="!isAuthenticated" class="unauthenticated">
      <h2>Access Denied</h2>
      <p>You need to be logged in to view this page.</p>
      <router-link to="/login" class="login-link">
        Go to Login
      </router-link>
    </div>

    <!-- Authenticated content -->
    <template v-else>
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="title">
            Dashboard
          </h1>
          <p class="subtitle">
            Welcome back, {{ user }}
          </p>
        </div>
        <!-- <div class="user-avatar" @click="triggerFileUpload" :class="{ 'uploading': isUploading }">
          <img v-if="userProfilePicture" :src="userProfilePicture" alt="Profile" class="avatar-image" />
          <span v-else>{{ getUserInitials }}</span>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            style="display: none"
          />
          <div v-if="isUploading" class="upload-overlay">
            <div class="upload-spinner"></div>
          </div>

          <button
            v-if="userProfilePicture && !isUploading"
            @click.stop="clearProfilePicture"
            class="remove-profile-btn"
            title="Remove profile picture"
            style="display: block !important; visibility: visible !important; opacity: 1 !important;"
          >
            ×
          </button>
        </div> -->
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner" />
        <p>Loading dashboard data...</p>
      </div>

      <!-- Stats Grid -->
      <div v-if="!isLoading" class="stats-grid">
        <!-- Total Registered -->
        <div class="stat-card primary-card">
          <div class="stat-content">
            <h2 class="stat-value">
              {{ totalUsers.toLocaleString() }}
            </h2>
            <p class="stat-label">
              Total Registered
            </p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${registeredPercentage}%` }" />
              </div>
              <span class="progress-label">{{ registeredPercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- Total Students -->
        <div class="stat-card">
          <div class="stat-content">
            <h2 class="stat-value">
              {{ totalStudents }}
            </h2>
            <p class="stat-label">
              Total Students
            </p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill green" :style="{ width: `${studentsPercentage}%` }" />
              </div>
              <span class="progress-label">{{ studentsPercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- Total Teachers -->
        <div class="stat-card">
          <div class="stat-content">
            <h2 class="stat-value">
              {{ totalTeachers }}
            </h2>
            <p class="stat-label">
              Total Teachers
            </p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill orange" :style="{ width: `${teachersPercentage}%` }" />
              </div>
              <span class="progress-label">{{ teachersPercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- User Management -->
        <div class="stat-card">
          <div class="stat-content">
            <h2 class="stat-value">
              {{ userManagement.toLocaleString() }}
            </h2>
            <p class="stat-label">
              User Management
            </p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill navy" :style="{ width: `${managementPercentage}%` }" />
              </div>
              <span class="progress-label">{{ managementPercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Sessions Section -->
      <div v-if="!isLoading && isStudent && hasAnySessions" class="sessions-section">
        <h2 class="section-title">
          My Sessions
        </h2>

        <!-- Active Sessions -->
        <div v-if="activeSessions.length > 0" class="sessions-group">
          <h3 class="sessions-group-title">
            Active Sessions
          </h3>
          <div class="sessions-grid">
            <SessionCard
              v-for="session in activeSessions"
              :key="session.id"
              :session="session"
            />
          </div>
        </div>

        <!-- Upcoming Sessions -->
        <div v-if="upcomingSessions.length > 0" class="sessions-group">
          <h3 class="sessions-group-title">
            Upcoming Sessions
          </h3>
          <div class="sessions-grid">
            <SessionCard
              v-for="session in upcomingSessions"
              :key="session.id"
              :session="session"
            />
          </div>
        </div>
      </div>

      <!-- Performance Chart -->
      <div v-if="!isLoading" class="performance-card">
        <div class="performance-header">
          <h2>Performance</h2>
          <div class="time-filters">
            <button class="time-btn active">
              Today
            </button>
            <button class="time-btn">
              Weeks
            </button>
            <button class="time-btn">
              Months
            </button>
          </div>
        </div>
        <div class="chart-container">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot pink" />
            <span>This Week</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot black" />
            <span>Last Week</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: var(--color-slate-100);
  padding: 2rem;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--color-gray-500);
  margin: 0;
}

.user-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.user-avatar.uploading {
  opacity: 0.7;
  cursor: not-allowed;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-avatar::after {
  content: '📷';
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.user-avatar:hover::after {
  opacity: 1;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 3;
}

.upload-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.remove-profile-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-error);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.remove-profile-btn:hover {
  background: var(--color-error-dark);
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.remove-profile-btn:active {
  transform: scale(0.95);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.primary-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-lightest) 100%);
  color: white;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.stat-label {
  font-size: 0.95rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

.primary-card .stat-label {
  opacity: 0.95;
}

.stat-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.primary-card .progress-bar {
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 10px;
  transition: width 0.6s ease;
}

.primary-card .progress-fill {
  background: white;
}

.progress-fill.green {
  background: var(--color-success);
}

.progress-fill.orange {
  background: var(--color-warning);
}

.progress-fill.navy {
  background: var(--color-primary);
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 35px;
}

/* Performance Card */
.performance-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.performance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.performance-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-gray-900);
}

.time-filters {
  display: flex;
  gap: 0.5rem;
}

.time-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  background: transparent;
  color: var(--color-gray-500);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.time-btn.active {
  background: var(--color-primary);
  color: white;
}

.time-btn:hover:not(.active) {
  background: var(--color-gray-100);
}

.chart-container {
  height: 300px;
  margin-bottom: 1.5rem;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-100);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-gray-500);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.pink {
  background: rgb(236, 72, 153);
}

.legend-dot.black {
  background: var(--color-gray-900);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  margin: 2rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-100);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--color-gray-500);
  font-size: 1rem;
  margin: 0;
}

/* Unauthenticated */
.unauthenticated {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  max-width: 500px;
  margin: 4rem auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.unauthenticated h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--color-gray-900);
}

.unauthenticated p {
  color: var(--color-gray-500);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.login-link {
  display: inline-block;
  padding: 1rem 2rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s;
}

.login-link:hover {
  background: var(--color-primary-lightest);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .performance-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .sessions-grid {
    grid-template-columns: 1fr;
  }
}

/* Sessions Section */
.sessions-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 1.5rem 0;
}

.sessions-group {
  margin-bottom: 2rem;
}

.sessions-group:last-child {
  margin-bottom: 0;
}

.sessions-group-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 1rem 0;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}
</style>
