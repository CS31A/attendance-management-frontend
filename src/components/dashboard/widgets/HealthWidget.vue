<script setup>
import { Activity, AlertCircle, CheckCircle, Database } from 'lucide-vue-next'
import { computed } from 'vue'
import { LOCALE } from '@/utils/constants'

const props = defineProps({
  health: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const isHealthy = computed(() => props.health?.status === 'healthy')
const dbConnected = computed(() => props.health?.database?.connected)

const lastCheck = computed(() => {
  if (!props.health?.timestamp)
    return 'Never'
  const date = new Date(props.health.timestamp)
  return date.toLocaleTimeString(LOCALE.DEFAULT, LOCALE.TIME_FORMAT)
})
</script>

<template>
  <div class="health-widget" :class="{ 'is-loading': loading }">
    <div class="widget-header">
      <div class="title-wrapper">
        <Activity class="icon" />
        <h3>System Health</h3>
      </div>
      <span class="status-badge" :class="isHealthy ? 'healthy' : 'unhealthy'">
        {{ isHealthy ? 'Healthy' : 'Issues Detected' }}
      </span>
    </div>

    <div class="widget-content">
      <div class="health-item">
        <div class="label">
          <Database class="item-icon" />
          <span>Database</span>
        </div>
        <div class="value" :class="dbConnected ? 'text-success' : 'text-error'">
          <CheckCircle v-if="dbConnected" class="status-icon" />
          <AlertCircle v-else class="status-icon" />
          {{ dbConnected ? 'Connected' : 'Disconnected' }}
        </div>
      </div>

      <div class="health-item">
        <div class="label">
          <span>Last Check</span>
        </div>
        <div class="value text-muted">
          {{ lastCheck }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.health-widget {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.health-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary-horizontal);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.health-widget:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--color-primary-lighter);
}

.health-widget:hover::before {
  opacity: 1;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-primary);
}

.icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.status-badge.healthy {
  background: var(--color-success);
  border: 1px solid var(--color-success);
}

.status-badge.healthy::before {
  content: '';
  position: absolute;
  left: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: var(--color-success);
  border-radius: var(--radius-full);
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 var(--color-success);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 4px transparent;
  }
}

.status-badge.unhealthy {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-light);
  transition: all var(--transition-fast);
}

.health-item:hover {
  padding-left: var(--spacing-xs);
}

.health-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

.item-icon {
  width: 16px;
  height: 16px;
}

.value {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  font-size: 0.875rem;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.text-success { color: var(--color-success); }
.text-error { color: var(--color-error); }
.text-muted { color: var(--text-muted); }
</style>
