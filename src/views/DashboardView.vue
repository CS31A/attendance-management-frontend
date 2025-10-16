<script setup>
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { useAuthStore } from '@/stores/authStore'
import { useStudentStore } from '@/stores/studentStore' 
import router from '@/router'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const authStore = useAuthStore()
const studentStore = useStudentStore()

// Computed properties for auth state
const isAuthenticated = authStore.getIsAuthenticated
const user = authStore.user

// Get student count from store
const totalStudents = computed(() => studentStore.students.length)

// Mock data for other stats
const totalRegistered = ref(1336)
const totalTeachers = ref(89)
const userManagement = ref(1336)

// Calculate percentages
const registeredPercentage = computed(() => 70)
const studentsPercentage = computed(() => Math.min((totalStudents.value / 100) * 10, 100))
const teachersPercentage = computed(() => 70)
const managementPercentage = computed(() => 70)

// Chart.js data
const chartData = computed(() => ({
  labels: ['S', 'S', 'M', 'M', 'T', 'T', 'W', 'W', 'T', 'T', 'F', 'F', 'S'],
  datasets: [
    {
      label: 'This Week',
      data: [30, 45, 35, 50, 45, 55, 50, 60, 55, 65, 60, 50, 55],
      borderColor: '#ec4899',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#ec4899',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    },
    {
      label: 'Last Week',
      data: [25, 35, 40, 35, 45, 40, 50, 45, 55, 50, 45, 35, 40],
      borderColor: '#000000',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#000000',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }
  ]
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
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 60,
      ticks: {
        stepSize: 10,
        font: {
          size: 12
        },
        color: '#999'
      },
      grid: {
        color: '#f0f0f0',
        drawBorder: false
      }
    },
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        font: {
          size: 12,
          weight: '500'
        },
        color: '#999'
      }
    }
  }
}

// Get user initials
const getUserInitials = computed(() => {
  if (!user?.name) return 'U'
  return user.name.split(' ').map(n => n[0]).join('').toUpperCase()
})
</script>

<template>
  <div class="dashboard">
    <!-- Unauthenticated state -->
    <div v-if="!isAuthenticated" class="unauthenticated">
      <h2>Access Denied</h2>
      <p>You need to be logged in to view this page.</p>
      <router-link to="/login" class="login-link">Go to Login</router-link>
    </div>
    
    <!-- Authenticated content -->
    <template v-else>
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="title">Dashboard</h1>
          <p class="subtitle">Welcome back, {{ user?.name || 'Admin' }}</p>
        </div>
        <div class="user-avatar">
          {{ getUserInitials }}
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <!-- Total Registered -->
        <div class="stat-card primary-card">
          <div class="stat-content">
            <h2 class="stat-value">{{ totalRegistered.toLocaleString() }}</h2>
            <p class="stat-label">Total Registered</p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: registeredPercentage + '%' }"></div>
              </div>
              <span class="progress-label">{{ registeredPercentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Total Students -->
        <div class="stat-card">
          <div class="stat-content">
            <h2 class="stat-value">{{ totalStudents }}</h2>
            <p class="stat-label">Total Students</p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill green" :style="{ width: studentsPercentage + '%' }"></div>
              </div>
              <span class="progress-label">{{ studentsPercentage.toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <!-- Total Teachers -->
        <div class="stat-card">
          <div class="stat-content">
            <h2 class="stat-value">{{ totalTeachers }}</h2>
            <p class="stat-label">Total Teachers</p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill orange" :style="{ width: teachersPercentage + '%' }"></div>
              </div>
              <span class="progress-label">{{ teachersPercentage }}%</span>
            </div>
          </div>
        </div>

        <!-- User Management -->
        <div class="stat-card">
          <div class="stat-content">
            <h2 class="stat-value">{{ userManagement.toLocaleString() }}</h2>
            <p class="stat-label">User Management</p>
            <div class="stat-progress">
              <div class="progress-bar">
                <div class="progress-fill navy" :style="{ width: managementPercentage + '%' }"></div>
              </div>
              <span class="progress-label">{{ managementPercentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Chart -->
      <div class="performance-card">
        <div class="performance-header">
          <h2>Performance</h2>
          <div class="time-filters">
            <button class="time-btn active">Today</button>
            <button class="time-btn">Weeks</button>
            <button class="time-btn">Months</button>
          </div>
        </div>
        <div class="chart-container">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot pink"></span>
            <span>This Week</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot black"></span>
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
  background: #f8fafc;
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
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
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
  background: #1e3a8a;
  border-radius: 10px;
  transition: width 0.6s ease;
}

.primary-card .progress-fill {
  background: white;
}

.progress-fill.green {
  background: #10b981;
}

.progress-fill.orange {
  background: #f59e0b;
}

.progress-fill.navy {
  background: #1e3a8a;
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
  color: #1a1a1a;
}

.time-filters {
  display: flex;
  gap: 0.5rem;
}

.time-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  background: transparent;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.time-btn.active {
  background: #1e3a8a;
  color: white;
}

.time-btn:hover:not(.active) {
  background: #f5f5f5;
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
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.pink {
  background: #ec4899;
}

.legend-dot.black {
  background: #000000;
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
  color: #1a1a1a;
}

.unauthenticated p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.login-link {
  display: inline-block;
  padding: 1rem 2rem;
  background: #1e3a8a;
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s;
}

.login-link:hover {
  background: #3b82f6;
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
}
</style>