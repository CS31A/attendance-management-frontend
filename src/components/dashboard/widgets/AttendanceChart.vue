<script setup>
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { computed, defineAsyncComponent } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      totalExcused: 0,
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

ChartJS.register(ArcElement, Tooltip, Legend)

const Doughnut = defineAsyncComponent(() => import('vue-chartjs').then(module => ({ default: module.Doughnut })))

const chartData = computed(() => ({
  labels: ['Present', 'Late', 'Absent', 'Excused'],
  datasets: [{
    data: [
      props.data?.totalPresent || 0,
      props.data?.totalLate || 0,
      props.data?.totalAbsent || 0,
      props.data?.totalExcused || 0,
    ],
    backgroundColor: [
      '#10b981', // Success (Present)
      '#f59e0b', // Warning (Late)
      '#ef4444', // Error (Absent)
      '#3b82f6', // Info (Excused)
    ],
    borderWidth: 0,
    hoverOffset: 4,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: '\'Inter\', sans-serif',
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1e293b',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      boxPadding: 4,
    },
  },
  cutout: '70%',
}
</script>

<template>
  <div class="attendance-chart-widget" :class="{ 'is-loading': loading }">
    <div class="widget-header">
      <h3>Attendance Distribution</h3>
    </div>

    <div class="chart-container">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner" />
      </div>
      <Doughnut v-else :data="chartData" :options="chartOptions" />

      <!-- Center Text -->
      <div v-if="!loading" class="center-text">
        <span class="total-label">Total</span>
        <span class="total-value">{{
          (props.data?.totalPresent || 0)
            + (props.data?.totalLate || 0)
            + (props.data?.totalAbsent || 0)
            + (props.data?.totalExcused || 0)
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-chart-widget {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.attendance-chart-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary-horizontal);
  opacity: 0;
  transition: opacity var(--transition-base);
  z-index: 1;
}

.attendance-chart-widget:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--color-primary-lighter);
}

.attendance-chart-widget:hover::before {
  opacity: 1;
}

.widget-header {
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-light);
}

h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  margin-top: -20px;
  background: var(--bg-primary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.total-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.total-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  background: var(--gradient-primary-diagonal);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  z-index: 10;
  border-radius: var(--radius-lg);
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
  to { transform: rotate(360deg); }
}
</style>
