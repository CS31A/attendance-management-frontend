<script setup>
import { ref, computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { useStudentStore } from '@/stores/studentStore' 
import { Users, CheckCircle, XCircle, BarChart3, TrendingUp, MoreVertical, GraduationCap, Clock } from 'lucide-vue-next'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const studentStore = useStudentStore()

// Active tab
const activeTab = ref('Today')
const tabs = ['Today', 'Week', 'Month', 'Year']

// Stats data
const totalStudents = computed(() => studentStore.students.length || 1247)
const presentToday = ref(1156)
const absentToday = computed(() => totalStudents.value - presentToday.value)
const attendanceRate = computed(() => ((presentToday.value / totalStudents.value) * 100).toFixed(1))

// Attendance Trend Chart Data
const attendanceTrendData = computed(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Attendance Rate (%)',
    data: [75, 90, 78, 85, 92, 82, 88],
    borderColor: '#3b5998',
    backgroundColor: 'rgba(59, 89, 152, 0.1)',
    tension: 0.4,
    borderWidth: 3,
    pointRadius: 6,
    pointBackgroundColor: '#3b5998',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointHoverRadius: 8,
    fill: true
  }]
}))

const attendanceTrendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context) => `${context.parsed.y}% Attendance`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        callback: (value) => value + '%',
        font: {
          size: 12
        },
        color: '#9ca3af'
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
          size: 12
        },
        color: '#9ca3af'
      }
    }
  }
}

// Class Performance Chart Data
const classPerformanceData = computed(() => ({
  labels: ['Math', 'Science', 'English', 'History', 'Art'],
  datasets: [{
    label: 'Performance',
    data: [92, 85, 78, 88, 90],
    backgroundColor: [
      '#10b981',
      '#3b5998',
      '#10b981',
      '#3b5998',
      '#10b981'
    ],
    borderRadius: 8,
    barThickness: 40
  }]
}))

const classPerformanceOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context) => `${context.parsed.y}% Performance`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        callback: (value) => value + '%',
        font: {
          size: 12
        },
        color: '#9ca3af'
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
          size: 12
        },
        color: '#9ca3af'
      }
    }
  }
}

const setActiveTab = (tab) => {
  activeTab.value = tab
}
</script>

<template>
  <div class="reports-dashboard">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">Track attendance and performance metrics</p>
          </div>
          
          <!-- Time Period Tabs -->
          <div class="tabs-container">
            <button 
              v-for="tab in tabs" 
              :key="tab"
              @click="setActiveTab(tab)"
              :class="['tab', { active: activeTab === tab }]"
            >
              {{ tab }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon blue">
              <Users size="24" />
            </div>
            <span class="stat-trend positive">+5.2%</span>
          </div>
          <h3 class="stat-value">{{ totalStudents.toLocaleString() }}</h3>
          <p class="stat-label">Total Students</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon green">
              <CheckCircle size="24" />
            </div>
            <span class="stat-trend positive">+2.1%</span>
          </div>
          <h3 class="stat-value">{{ presentToday.toLocaleString() }}</h3>
          <p class="stat-label">Present Today</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon red">
              <XCircle size="24" />
            </div>
            <span class="stat-trend negative">-1.3%</span>
          </div>
          <h3 class="stat-value">{{ absentToday }}</h3>
          <p class="stat-label">Absent Today</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon navy">
              <BarChart3 size="24" />
            </div>
            <span class="stat-trend positive">+0.8%</span>
          </div>
          <h3 class="stat-value">{{ attendanceRate }}%</h3>
          <p class="stat-label">Attendance Rate</p>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Attendance Trend Chart -->
        <div class="chart-card large">
          <div class="chart-header">
            <div class="chart-title-wrapper">
              <div class="chart-icon">
                <TrendingUp size="24" />
              </div>
              <div>
                <h2 class="chart-title">Attendance Trend</h2>
                <p class="chart-subtitle">Weekly attendance overview</p>
              </div>
            </div>
            <button class="chart-action-btn">
              <MoreVertical size="18" />
            </button>
          </div>
          <div class="chart-wrapper">
            <Line :data="attendanceTrendData" :options="attendanceTrendOptions" />
          </div>
        </div>

        <!-- Class Performance Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-wrapper">
              <div class="chart-icon">
                <GraduationCap size="24" />
              </div>
              <div>
                <h2 class="chart-title">Class Performance</h2>
                <p class="chart-subtitle">Subject-wise performance</p>
              </div>
            </div>
            <button class="chart-action-btn">
              <MoreVertical size="18" />
            </button>
          </div>
          <div class="chart-wrapper">
            <Bar :data="classPerformanceData" :options="classPerformanceOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main Container */
.reports-dashboard {
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
  animation: fadeInDown 0.6s ease-out;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-text {
  flex: 1;
  min-width: 250px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e3a8a;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
  font-weight: 300;
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.938rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab.active {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.tab:not(.active):hover {
  background: #f3f4f6;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  animation: fadeIn 0.8s ease-out;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.5s ease-out backwards;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-icon.green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.red {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-icon.navy {
  background: rgba(30, 58, 138, 0.1);
  color: #1e3a8a;
}

.stat-trend {
  font-size: 0.813rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.stat-trend.positive {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-trend.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  animation: fadeIn 0.8s ease-out 0.2s backwards;
}

/* Chart Cards */
.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.chart-card.large {
  grid-column: span 1;
}

.chart-card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.chart-title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chart-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(30, 58, 138, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chart-icon svg {
  width: 24px;
  height: 24px;
  color: #1e3a8a;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.chart-subtitle {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.chart-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.chart-action-btn:hover {
  background: #e5e7eb;
}

.chart-action-btn svg {
  width: 18px;
  height: 18px;
}

.chart-wrapper {
  height: 300px;
  position: relative;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .tabs-container {
    width: 100%;
    overflow-x: auto;
  }
}
</style>