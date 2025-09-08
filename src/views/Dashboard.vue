<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

// Reactive data
const totalStudents = ref(30)
const presentToday = ref(25)
const recentLogs = ref([
  { name: 'Christian Sayson', time: '8:01 AM' },
  { name: 'Christina Cassandra', time: '8:05 AM' },
  { name: 'Jose Rizal', time: '8:10 AM' },
])

// Chart refs
const attendanceChart = ref(null)
const weeklyChart = ref(null)
const attendanceChartCanvas = ref(null)
const weeklyChartCanvas = ref(null)

// Simplified chart creation
const createAttendanceChart = () => {
  attendanceChart.value = new Chart(attendanceChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent'],
      datasets: [{
        data: [presentToday.value, totalStudents.value - presentToday.value],
        backgroundColor: ['#10b981', '#ef4444']
      }]
    },
    options: { responsive: true }
  })
}

const createWeeklyChart = () => {
  weeklyChart.value = new Chart(weeklyChartCanvas.value, {
    type: 'bar',
    data: {
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
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false
    }
  })
}

const createCharts = () => {
  createAttendanceChart()
  createWeeklyChart()
}

// Lifecycle hooks
onMounted(() => {
  createCharts()
})

onUnmounted(() => {
  // Clean up charts when component is destroyed
  if (attendanceChart.value) {
    attendanceChart.value.destroy()
  }
  if (weeklyChart.value) {
    weeklyChart.value.destroy()
  }
})
</script>

<template>
  <div class="dashboard">
    <h1 class="title">Admin Dashboard</h1>

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
        <canvas ref="attendanceChartCanvas" width="400" height="200"></canvas>
      </div>
      
      <div class="chart-container">
        <h2>Weekly Attendance Trend</h2>
        <canvas ref="weeklyChartCanvas" width="400" height="200"></canvas>
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
  </div>
</template>

<style scoped>
.dashboard {
  padding: 30px;
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