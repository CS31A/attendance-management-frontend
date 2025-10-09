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
  { name: 'Christian Sayson', time: '8:01 AM', status: 'present' },
  { name: 'Christina Cassandra', time: '8:05 AM', status: 'present' },
  { name: 'Jose Rizal', time: '8:10 AM', status: 'present' },
])

// Get initials for avatar
const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}
// Computed values
const attendanceRate = computed(() => {
  return ((presentToday.value / totalStudents.value) * 100).toFixed(1)
})

// Chart data with modern colors
const attendanceChartData = computed(() => ({
  labels: ['Present', 'Absent'],
  datasets: [{
    data: [presentToday.value, totalStudents.value - presentToday.value],
    backgroundColor: [
      'rgba(16, 185, 129, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ],
    borderColor: [
      'rgba(16, 185, 129, 1)',
      'rgba(239, 68, 68, 1)'
    ],
    borderWidth: 2,
    hoverOffset: 10
  }]
}))

const weeklyChartData = computed(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  datasets: [
    {
      label: 'Present',
      data: [28, 26, 25, 29, 27],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2,
      borderRadius: 6
    },
    {
      label: 'Absent', 
      data: [2, 4, 5, 1, 3],
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 2,
      borderRadius: 6
    }
  ]
}))

// Enhanced chart options
const attendanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        font: {
          size: 13,
          weight: '500'
        },
        usePointStyle: true
      }
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
  }
}

const weeklyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        font: {
          size: 13,
          weight: '500'
        },
        usePointStyle: true
      }
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
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 12
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 12,
          weight: '500'
        }
      }
    }
  }
}
// Search and filter state
const searchQuery = ref('')
const filterStatus = ref('all') // 'all', 'present', 'absent'

// Filtered logs based on search and filter
const filteredLogs = computed(() => {
  let logs = recentLogs.value
  
  // Filter by search query
  if (searchQuery.value) {
    logs = logs.filter(log => 
      log.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // Filter by status
  if (filterStatus.value !== 'all') {
    logs = logs.filter(log => log.status === filterStatus.value)
  }
  
  return logs
})
//functions to get gradients
const getGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  ]
  return gradients[index % gradients.length]
}
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
    <h1 class="title">Admin Dashboard </h1>
  </div>

</div>

    <!-- Enhanced Summary Cards -->
<div class="summary-cards">
  <div class="card total-card">
    <div class="card-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="card-content">
      <h3>Total Students</h3>
      <p class="card-value">{{ totalStudents }}</p>
      <span class="card-label">Enrolled this semester</span>
    </div>
    <div class="card-decoration"></div>
  </div>
  
  <div class="card present-card">
    <div class="card-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="card-content">
      <h3>Present Today</h3>
      <p class="card-value">{{ presentToday }}</p>
      <span class="card-label">{{ attendanceRate }}% attendance rate</span>
    </div>
    <div class="card-decoration"></div>
  </div>
  
  <div class="card absent-card">
    <div class="card-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="card-content">
      <h3>Absent Today</h3>
      <p class="card-value">{{ totalStudents - presentToday }}</p>
      <span class="card-label">{{ (100 - attendanceRate).toFixed(1) }}% of total students</span>
    </div>
    <div class="card-decoration"></div>
  </div>
</div>

      <!-- Charts Section -->
  <div class="charts-section">
  <div class="chart-card">
    <div class="chart-header">
      <h2>Attendance Overview</h2>
      <span class="chart-badge">Today</span>
    </div>
    <div class="chart-wrapper">
      <Doughnut 
        :data="attendanceChartData" 
        :options="attendanceChartOptions"
      />
    </div>
  </div>
  
  <div class="chart-card">
    <div class="chart-header">
      <h2>Weekly Attendance Trend</h2>
      <span class="chart-badge">This Week</span>
    </div>
    <div class="chart-wrapper">
      <Bar 
        :data="weeklyChartData" 
        :options="weeklyChartOptions"
      />
    </div>
  </div>
</div>

<!-- Enhanced Search and Filter Bar -->
<div class="search-filter-bar">
  <div class="search-wrapper">
    <div class="search-box">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="search-icon">
        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2.5"/>
        <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Search students by name..." 
        class="search-input"
      />
      <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
  
  <div class="filter-section">
    <span class="filter-label">Filter:</span>
    <div class="filter-buttons">
      <button 
        @click="filterStatus = 'all'" 
        :class="['filter-btn', { active: filterStatus === 'all' }]"
      >
        <span class="filter-count">{{ recentLogs.length }}</span>
        All
      </button>
      <button 
        @click="filterStatus = 'present'" 
        :class="['filter-btn filter-present', { active: filterStatus === 'present' }]"
      >
        <span class="filter-count">{{ recentLogs.filter(log => log.status === 'present').length }}</span>
        Present
      </button>
      <button 
        @click="filterStatus = 'absent'" 
        :class="['filter-btn filter-absent', { active: filterStatus === 'absent' }]"
      >
        <span class="filter-count">0</span>
        Absent
      </button>
    </div>
  </div>
</div>

<!-- Enhanced Recent Activity -->
<div class="recent-activity-card">
  <div class="activity-header">
    <div class="header-left">
      <h2>Recent Check-ins</h2>
      <span class="activity-count">{{ filteredLogs.length }} students</span>
    </div>
    <button class="view-all-btn">
      <span>View All</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
  <!-- Empty State -->
  <div v-if="filteredLogs.length === 0" class="empty-state">
    <div class="empty-icon">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h3>No students found</h3>
    <p>Try adjusting your search or filter criteria</p>
    <button @click="searchQuery = ''; filterStatus = 'all'" class="reset-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M3 12L6 9M3 12L6 15M3 12H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Reset Filters</span>
    </button>
  </div>
  
  <!-- Activity List -->
  <div v-else class="activity-list">
    <div v-for="(log, index) in filteredLogs" :key="index" class="activity-item">
      <div class="avatar-wrapper">
        <div class="avatar" :style="{ background: getGradient(index) }">
          {{ getInitials(log.name) }}
        </div>
        <div class="avatar-ring"></div>
      </div>
      <div class="activity-details">
        <span class="activity-name">{{ log.name }}</span>
        <div class="activity-meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="activity-time">{{ log.time }}</span>
        </div>
      </div>
      <div class="status-badge status-present">
        <div class="status-pulse"></div>
        <span class="status-dot"></span>
        <span>Present</span>
      </div>
    </div>
  </div>
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
/* Enhanced Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: var(--card-background);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
  opacity: 0;
  transition: opacity 0.4s;
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.card:hover::before {
  opacity: 1;
}

.card:hover .card-decoration {
  transform: scale(1.2) rotate(10deg);
  opacity: 0.15;
}

.total-card {
  --accent-color: #3b82f6;
  --accent-light: #60a5fa;
}

.present-card {
  --accent-color: #10b981;
  --accent-light: #34d399;
}

.absent-card {
  --accent-color: #ef4444;
  --accent-light: #f87171;
}

.card-icon {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
  color: white;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 2;
  transition: all 0.4s;
}

.card:hover .card-icon {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.card-decoration {
  position: absolute;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
  opacity: 0.08;
  right: -50px;
  top: -50px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.card-content {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 2;
}

.card-content h3 {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-value {
  font-size: 2.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  display: block;
}
/* Charts Section Styles */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: var(--shadow-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.chart-badge {
  background: var(--background);
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.chart-wrapper {
  height: 300px;
  position: relative;
}
/* Recent Activity */

/* Enhanced Recent Activity */
.recent-activity-card {
  background: var(--card-background);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--background);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.activity-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.activity-count {
  padding: 0.375rem 0.875rem;
  background: var(--background);
  color: var(--text-secondary);
  border-radius: 50px;
  font-size: 0.813rem;
  font-weight: 700;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--primary-color), #2563eb);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.938rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.view-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: var(--background);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 2rem 0;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: var(--primary-color);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.reset-btn:hover {
  background: #ff0000;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  background: var(--background);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.activity-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--success-color), #34d399);
  opacity: 0;
  transition: opacity 0.3s;
}

.activity-item:hover {
  background: white;
  border-color: var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.activity-item:hover::before {
  opacity: 1;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 2;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid var(--success-color);
  opacity: 0.3;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0;
  }
}

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.activity-name {
  font-size: 1.063rem;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.activity-meta svg {
  flex-shrink: 0;
}

.activity-time {
  font-weight: 500;
}

/* Enhanced Status Badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.status-present {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.15));
  color: #059669;
  border: 2px solid rgba(16, 185, 129, 0.3);
}

.status-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.3);
  animation: status-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes status-pulse {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  position: relative;
  z-index: 2;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Enhanced Search and Filter Bar */
.search-filter-bar {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrapper {
  flex: 1;
  min-width: 300px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  color: var(--text-secondary);
  transition: all 0.3s;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 1rem 3.5rem 1rem 3.5rem;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s;
  background: white;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.search-input:focus + .clear-btn,
.search-input:not(:placeholder-shown) + .clear-btn {
  opacity: 1;
  pointer-events: auto;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--text-secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s;
  z-index: 2;
}

.clear-btn:hover {
  background: var(--danger-color);
  transform: scale(1.1);
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-label {
  font-size: 0.938rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-buttons {
  display: flex;
  gap: 0.75rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  background: transparent;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.938rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--background);
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: var(--background);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: var(--primary-color);
  color: rgb(76, 76, 248);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.filter-present.active {
  background: var(--success-color);
  box-shadow: 0 4px 12px rgba(0, 240, 64, 0.4);
}

.filter-absent.active {
  background: var(--danger-color);
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.4);
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