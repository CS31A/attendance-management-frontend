<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement)


const authStore = useAuthStore()

// Computed properties for auth state
const isAuthenticated = authStore.getIsAuthenticated

// Reactive data
const totalStudents = ref(30)
const presentToday = ref(25)
const recentLogs = ref([
  { name: 'Christian Sayson', time: '8:01 AM' },
  { name: 'Christina Cassandra', time: '8:05 AM' },
  { name: 'Jose Rizal', time: '8:10 AM' },
])

// Computed values
const attendanceRate = computed(() => {
  return ((presentToday.value / totalStudents.value) * 100).toFixed(1)
})

// Chart data
const attendanceChartData = computed(() => ({
  labels: ['Present', 'Absent'],
  datasets: [{
    data: [presentToday.value, totalStudents.value - presentToday.value],
    backgroundColor: ['#10b981', '#ef4444']
  }]
}))

const weeklyChartData = computed(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [
    {
      label: 'Present',
      data: [28, 26, 25, 29, 27],
      backgroundColor: '#10b981'
    },
    {
      label: 'Absent', 
      data: [2, 4, 5, 1, 3],
      backgroundColor: '#ef4444'
    }
  ]
}))

// Chart options
const attendanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

const weeklyChartOptions = {
  responsive: true,
  maintainAspectRatio: false
}

onMounted(() => {
  if (!isAuthenticated && !authStore.getUser) {
    router.push("/login")
  }
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

      <div class="dashboard-header">
  <div>
    <h1 class="title">Dashboard Overview</h1>
    <p class="subtitle">Track and monitor student attendance in real-time</p>
  </div>
  <div class="header-badge">
    <span class="live-indicator"></span>
    Live Data
  </div>
</div>

     <div class="summary-cards">
  <div class="card total-card">
    <div class="card-icon">👥</div>
    <div class="card-content">
      <h3>Total Students</h3>
      <p class="card-value">{{ totalStudents }}</p>
      <span class="card-label">Enrolled</span>
    </div>
  </div>
  
  <div class="card present-card">
    <div class="card-icon">✓</div>
    <div class="card-content">
      <h3>Present Today</h3>
      <p class="card-value">{{ presentToday }}</p>
      <span class="card-label">{{ attendanceRate }}% attendance</span>
    </div>
  </div>
  
  <div class="card absent-card">
    <div class="card-icon">✗</div>
    <div class="card-content">
      <h3>Absent Today</h3>
      <p class="card-value">{{ totalStudents - presentToday }}</p>
      <span class="card-label">{{ (100 - attendanceRate).toFixed(1) }}% absent</span>
    </div>
  </div>
</div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h2>Attendance Overview</h2>
          <Doughnut 
            :data="attendanceChartData" 
            :options="attendanceChartOptions" 
            style="height: 300px;"
          />
        </div>
        
        <div class="chart-container">
          <h2>Weekly Attendance Trend</h2>
          <Bar 
            :data="weeklyChartData" 
            :options="weeklyChartOptions" 
            style="height: 300px;"
          />
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Attendance</h2>
        <ul>
          <li v-for="(log, index) in recentLogs" :key="index">
            {{ log.name }} - {{ log.time }}
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>

:root {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --background: #f8fafc;
  --card-background: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}

.dashboard {
  padding: 2rem;
  background: var(--background);
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

.header-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--card-background);
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.live-indicator {
  width: 8px;
  height: 8px;
  background: var(--success-color);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem
}

.card {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
  opacity: 0;
  transition: opacity 0.3s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card:hover::before {
  opacity: 1;
}

.total-card {
  --accent-color: #3b82f6;
  --accent-light: #60a5fa;
}

.card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #4b5563;
}

.card p {
  font-size: 24px;
  font-weight: bold;
  color: #111827;
}

/* Charts Section Styles */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.chart-container {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.chart-container h2 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #374151;
  text-align: center;
}

.chart-container canvas {
  max-height: 300px;
}

.recent-activity h2 {
  font-size: 22px;
  margin-bottom: 10px;
}

.recent-activity ul {
  list-style: none;
  padding: 0;
}

.recent-activity li {
  background: #f3f4f6;
  margin-bottom: 8px;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: 16px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    flex-direction: column;
  }
}
</style>