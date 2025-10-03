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
      <h1 class="title">Dashboard</h1>

      <div class="summary-cards">
        <div class="card total">
          <h3>Total Students</h3>
          <p>{{ totalStudents }}</p>
        </div>
        <div class="card present">
          <h3>Present Today</h3>
          <p>{{ presentToday }}</p>
        </div>
        <div class="card absent">
          <h3>Absent Today</h3>
          <p>{{ totalStudents - presentToday }}</p>
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
.dashboard {
  padding: 20px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
}

.summary-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.card {
  flex: 1;
  min-width: 200px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-left: 5px solid #0f71d3;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
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