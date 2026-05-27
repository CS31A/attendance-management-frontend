<script setup lang="ts">
import type { TooltipItem } from 'chart.js'
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js'
import { AlertCircle, BarChart3, CheckCircle, Clock, Download, FileSpreadsheet, GraduationCap, MoreVertical, Printer, TrendingUp, Users, XCircle } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { exportToCsv, fetchReportsSummary } from '@/api/reports'
import { useSectionStore } from '@/stores/sectionStore'
import { formatLongDate } from '@/utils/date'

const Bar = defineAsyncComponent(() => import('vue-chartjs').then(module => ({ default: module.Bar })))
const Line = defineAsyncComponent(() => import('vue-chartjs').then(module => ({ default: module.Line })))

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const sectionStore = useSectionStore()

// Active tab
const tabs = ['Today', 'Week', 'Month', 'Year'] as const
type ReportsTab = (typeof tabs)[number]
const activeTab = ref<ReportsTab>('Today')

// Loading state
const isLoading = ref(false)

// Stats data
const presentToday = ref(0)
const lateToday = ref(0)
const absentToday = ref(0)
const excusedToday = ref(0)
const summaryRate = ref(0)
const summaryTotalRecords = ref(0)
const summaryTotalEnrolled = ref(0)
const totalStudents = computed(() => summaryTotalEnrolled.value)
const attendanceRate = computed(() => {
  const rate = summaryRate.value
  if (rate === 0)
    return 0
  return rate.toFixed(1)
})

// Attendance Trend Chart Data
const attendanceTrendLabels = ref<string[]>([])
const attendanceTrendValues = ref<number[]>([])

const attendanceTrendData = computed(() => ({
  labels: attendanceTrendLabels.value,
  datasets: [{
    label: 'Attendance Rate (%)',
    data: attendanceTrendValues.value,
    borderColor: 'rgb(30, 58, 138)',
    backgroundColor: 'rgba(30, 58, 138, 0.1)',
    tension: 0.4,
    borderWidth: 3,
    pointRadius: 6,
    pointBackgroundColor: 'rgb(30, 58, 138)',
    pointBorderColor: 'var(--text-white)',
    pointBorderWidth: 2,
    pointHoverRadius: 8,
    fill: true,
  }],
}))

const attendanceTrendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context: TooltipItem<'line'>) => `${context.parsed.y}% Attendance`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        callback: (value: number | string) => `${value}%`,
        font: {
          size: 12,
        },
        color: 'var(--color-gray-400)',
      },
      grid: {
        color: 'rgb(243, 244, 246)',
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
        },
        color: 'var(--color-gray-400)',
      },
    },
  },
}

// Class Performance Chart Data
const classPerformanceLabels = ref<string[]>([])
const classPerformanceValues = ref<number[]>([])

// Empty state checks
const hasNoAttendanceData = computed(() => {
  return !isLoading.value && attendanceTrendValues.value.length === 0
})

const hasNoClassPerformanceData = computed(() => {
  return !isLoading.value && classPerformanceValues.value.length === 0
})

const classPerformanceData = computed(() => ({
  labels: classPerformanceLabels.value,
  datasets: [{
    label: 'Performance',
    data: classPerformanceValues.value,
    backgroundColor: [
      'rgb(16, 185, 129)',
      'rgb(30, 58, 138)',
      'rgb(16, 185, 129)',
      'rgb(30, 58, 138)',
      'rgb(16, 185, 129)',
    ],
    borderRadius: 8,
    barThickness: 40,
  }],
}))

const classPerformanceOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      borderRadius: 8,
      displayColors: false,
      callbacks: {
        label: (context: TooltipItem<'bar'>) => `${context.parsed.y}% Performance`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        callback: (value: number | string) => `${value}%`,
        font: {
          size: 12,
        },
        color: 'var(--color-gray-400)',
      },
      grid: {
        color: 'rgb(243, 244, 246)',
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
        },
        color: 'var(--color-gray-400)',
      },
    },
  },
}

function getDateRange(tab: ReportsTab): { startDate: string, endDate: string } {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  if (tab === 'Today')
    return { startDate: `${todayStr}T00:00:00`, endDate: `${todayStr}T23:59:59` }
  const past = new Date(today)
  if (tab === 'Week')
    past.setDate(today.getDate() - 6)
  else if (tab === 'Month')
    past.setMonth(today.getMonth() - 1)
  else past.setFullYear(today.getFullYear() - 1)
  const pastStr = past.toISOString().split('T')[0]
  return { startDate: `${pastStr}T00:00:00`, endDate: `${todayStr}T23:59:59` }
}

function setActiveTab(tab: ReportsTab) {
  activeTab.value = tab
  fetchDashboardData()
}

async function fetchDashboardData() {
  isLoading.value = true
  try {
    // 1. Summary stats from reports endpoint (no date filter for all-time data)
    const summary = await fetchReportsSummary({})
    presentToday.value = summary.totalPresent
    lateToday.value = summary.totalLate
    absentToday.value = summary.totalAbsent
    excusedToday.value = summary.totalExcused
    summaryRate.value = summary.attendanceRate
    summaryTotalRecords.value = summary.totalSessions
    summaryTotalEnrolled.value = summary.totalEnrolled ?? summary.totalSessions

    // 2. Attendance trend with per-period breakdown
    const trendLabels: string[] = []
    const trendValues: number[] = []

    // Always show overall attendance rate as a single point for consistency
    trendLabels.push('All Time')
    trendValues.push(Number(summary.attendanceRate))

    attendanceTrendLabels.value = trendLabels
    attendanceTrendValues.value = trendValues

    // 3. Class performance: section-wise attendance rates
    if (!sectionStore.sections.length)
      await sectionStore.fetchSections()

    const performanceLabels: string[] = []
    const performanceValues: number[] = []

    // Show all sections up to 5, even if they have no attendance data
    const sectionsToShow = sectionStore.sections.slice(0, 5)
    if (sectionsToShow.length === 0) {
      // If no sections exist, show a placeholder
      performanceLabels.push('No Sections')
      performanceValues.push(0)
    }
    else {
      for (const section of sectionsToShow) {
        performanceLabels.push(section.name || 'Unnamed')
        try {
          const sectionStats = await fetchReportsSummary({ sectionId: section.id })
          performanceValues.push(Number(sectionStats.attendanceRate))
        }
        catch {
          performanceValues.push(0)
        }
      }
    }

    classPerformanceLabels.value = performanceLabels
    classPerformanceValues.value = performanceValues
  }
  catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
  finally {
    isLoading.value = false
  }
}

async function handleExportCsv() {
  const { startDate, endDate } = getDateRange(activeTab.value)
  const rows: Record<string, unknown>[] = [
    { Category: 'Summary', Label: 'Date Range', Value: `${formatLongDate(startDate)} to ${formatLongDate(endDate)}` },
    { Category: 'Summary', Label: 'Present', Value: presentToday.value },
    { Category: 'Summary', Label: 'Late', Value: lateToday.value },
    { Category: 'Summary', Label: 'Absent', Value: absentToday.value },
    { Category: 'Summary', Label: 'Excused', Value: excusedToday.value },
    { Category: 'Summary', Label: 'Attendance Rate', Value: `${attendanceRate.value}%` },
    ...attendanceTrendLabels.value.map((label, i) => ({
      Category: 'Trend',
      Label: label,
      Value: `${attendanceTrendValues.value[i] ?? 0}%`,
    })),
    ...classPerformanceLabels.value.map((label, i) => ({
      Category: 'Sections',
      Label: label,
      Value: `${classPerformanceValues.value[i] ?? 0}%`,
    })),
  ]
  exportToCsv(rows, `attendance-report-${activeTab.value.toLowerCase()}.csv`)
}

async function handleExportXlsx() {
  const { startDate, endDate } = getDateRange(activeTab.value)
  const summaryRows = [
    { Label: 'Date Range', Value: `${formatLongDate(startDate)} to ${formatLongDate(endDate)}` },
    { Label: 'Present', Value: presentToday.value },
    { Label: 'Late', Value: lateToday.value },
    { Label: 'Absent', Value: absentToday.value },
    { Label: 'Excused', Value: excusedToday.value },
    { Label: 'Attendance Rate', Value: `${attendanceRate.value}%` },
  ]
  const trendRows = attendanceTrendLabels.value.map((label, i) => ({
    'Period': label,
    'Attendance Rate (%)': attendanceTrendValues.value[i] ?? 0,
  }))
  const sectionRows = classPerformanceLabels.value.map((label, i) => ({
    'Section': label,
    'Attendance Rate (%)': classPerformanceValues.value[i] ?? 0,
  }))
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trendRows), 'Trend')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sectionRows), 'Sections')
  XLSX.writeFile(wb, `attendance-report-${activeTab.value.toLowerCase()}.xlsx`)
}

function handlePrint() {
  window.print()
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="reports-dashboard">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              Reports & Analytics
            </h1>
            <p class="page-subtitle">
              Track attendance and performance metrics
            </p>
          </div>

          <!-- Time Period Tabs and Export Actions -->
          <div class="header-controls">
            <div class="tabs-container">
              <button
                v-for="tab in tabs"
                :key="tab"
                class="tab"
                :class="[{ active: activeTab === tab }]"
                @click="setActiveTab(tab)"
              >
                {{ tab }}
              </button>
            </div>
            <div class="export-actions no-print">
              <button class="export-btn" :disabled="isLoading" title="Export CSV" @click="handleExportCsv">
                <Download :size="16" />
                CSV
              </button>
              <button class="export-btn" :disabled="isLoading" title="Export Excel" @click="handleExportXlsx">
                <FileSpreadsheet :size="16" />
                Excel
              </button>
              <button class="export-btn" :disabled="isLoading" title="Print Report" @click="handlePrint">
                <Printer :size="16" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon blue">
              <Users :size="24" />
            </div>
            <!-- <span class="stat-trend positive">+5.2%</span> -->
          </div>
          <h3 class="stat-value">
            {{ totalStudents.toLocaleString() }}
          </h3>
          <p class="stat-label">
            Total Students
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon green">
              <CheckCircle :size="24" />
            </div>
          </div>
          <h3 class="stat-value">
            {{ presentToday.toLocaleString() }}
          </h3>
          <p class="stat-label">
            Present Today
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon amber">
              <Clock :size="24" />
            </div>
          </div>
          <h3 class="stat-value">
            {{ lateToday.toLocaleString() }}
          </h3>
          <p class="stat-label">
            Late Today
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon red">
              <XCircle :size="24" />
            </div>
          </div>
          <h3 class="stat-value">
            {{ absentToday }}
          </h3>
          <p class="stat-label">
            Absent Today
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon purple">
              <AlertCircle :size="24" />
            </div>
          </div>
          <h3 class="stat-value">
            {{ excusedToday.toLocaleString() }}
          </h3>
          <p class="stat-label">
            Excused Today
          </p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon navy">
              <BarChart3 :size="24" />
            </div>
            <!-- <span class="stat-trend positive">+0.8%</span> -->
          </div>
          <h3 class="stat-value">
            {{ attendanceRate }}%
          </h3>
          <p class="stat-label">
            Attendance Rate
          </p>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <!-- Attendance Trend Chart -->
        <div class="chart-card large">
          <div class="chart-header">
            <div class="chart-title-wrapper">
              <div class="chart-icon">
                <TrendingUp :size="24" />
              </div>
              <div>
                <h2 class="chart-title">
                  Attendance Trend
                </h2>
                <p class="chart-subtitle">
                  Weekly attendance overview
                </p>
              </div>
            </div>
            <button class="chart-action-btn">
              <MoreVertical :size="18" />
            </button>
          </div>
          <div class="chart-wrapper">
            <div v-if="isLoading" class="loading-chart">
              Loading...
            </div>
            <Line v-else :data="attendanceTrendData" :options="attendanceTrendOptions" />
          </div>
        </div>

        <!-- Class Performance Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title-wrapper">
              <div class="chart-icon">
                <GraduationCap :size="24" />
              </div>
              <div>
                <h2 class="chart-title">
                  Class Performance
                </h2>
                <p class="chart-subtitle">
                  Section-wise attendance rate
                </p>
              </div>
            </div>
            <button class="chart-action-btn">
              <MoreVertical :size="18" />
            </button>
          </div>
          <div class="chart-wrapper">
            <div v-if="isLoading" class="loading-chart">
              Loading...
            </div>
            <Bar v-else :data="classPerformanceData" :options="classPerformanceOptions" />
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
  background: var(--color-slate-100);
  padding: 2rem;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
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
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--color-gray-500);
  margin: 0;
  font-weight: 300;
}

/* Header Controls */
.header-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

/* Export Actions */
.export-actions {
  display: flex;
  gap: 0.5rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  background: white;
  color: var(--color-gray-600);
  font-size: 0.813rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover:not(:disabled) {
  background: var(--color-gray-100);
  border-color: var(--color-gray-300);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  color: var(--color-gray-500);
  font-weight: 600;
  font-size: 0.938rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3);
}

.tab:not(.active):hover {
  background: var(--color-gray-100);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

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
  color: var(--color-primary-lightest);
}

.stat-icon.green {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.stat-icon.red {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.stat-icon.navy {
  background: rgba(30, 58, 138, 0.1);
  color: var(--color-primary);
}

.stat-icon.amber {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-icon.purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.stat-trend {
  font-size: 0.813rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.stat-trend.positive {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.stat-trend.negative {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-gray-800);
  margin: 0 0 0.5rem 0;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
  font-weight: 500;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
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
  color: var(--color-primary);
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-800);
  margin: 0;
}

.chart-subtitle {
  font-size: 0.813rem;
  color: var(--color-gray-500);
  margin: 0.25rem 0 0 0;
}

.chart-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.chart-action-btn:hover {
  background: var(--color-gray-200);
}

.chart-action-btn svg {
  width: 18px;
  height: 18px;
}

.chart-wrapper {
  height: 300px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-chart {
  color: var(--color-gray-500);
  font-weight: 500;
}

/* Chart Empty State */
.chart-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--color-gray-500);
  height: 100%;
  min-height: 250px;
}

.chart-empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
  color: var(--color-gray-400);
}

.chart-empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-600);
  margin: 0 0 0.5rem 0;
}

.chart-empty-state p {
  font-size: 0.875rem;
  margin: 0 0 0.25rem 0;
  color: var(--color-gray-500);
}

.chart-empty-state .empty-state-hint {
  font-size: 0.813rem;
  color: var(--color-gray-400);
  margin-top: 0.5rem;
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

  .header-controls {
    align-items: stretch;
  }

  .tabs-container {
    width: 100%;
    overflow-x: auto;
  }

  .export-actions {
    flex-wrap: wrap;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .reports-dashboard {
    padding: 0;
    background: white;
  }

  .stat-card,
  .chart-card {
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }
}
</style>
