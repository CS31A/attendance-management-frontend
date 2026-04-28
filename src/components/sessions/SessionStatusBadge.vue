<script setup>
import { CheckCircle, Clock, PlayCircle, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: value => ['not_started', 'active', 'completed', 'ended', 'cancelled'].includes(value),
  },
})

const statusConfig = {
  not_started: {
    label: 'Not Started',
    icon: Clock,
    class: 'status-not-started',
  },
  active: {
    label: 'Active',
    icon: PlayCircle,
    class: 'status-active',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    class: 'status-completed',
  },
  ended: {
    label: 'Completed',
    icon: CheckCircle,
    class: 'status-completed',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    class: 'status-cancelled',
  },
}

const statusLabel = computed(() => {
  return statusConfig[props.status]?.label || props.status
})

const statusIcon = computed(() => {
  return statusConfig[props.status]?.icon || Clock
})

const statusClass = computed(() => {
  return statusConfig[props.status]?.class || 'status-unknown'
})
</script>

<template>
  <span class="status-badge" :class="statusClass">
    <component :is="statusIcon" :size="16" class="status-icon" />
    <span class="status-text">{{ statusLabel }}</span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-icon {
  flex-shrink: 0;
}

/* Not Started - Blue/Gray */
.status-not-started {
  background: var(--color-info-lighter);
  color: var(--color-primary-light);
}

/* Active - Green with pulse animation */
.status-active {
  background: var(--color-success-bg);
  color: var(--color-success);
  position: relative;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.status-active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0.5rem;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: var(--color-success);
  border-radius: 50%;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ping {
  0% {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }
  75%, 100% {
    transform: translateY(-50%) scale(2);
    opacity: 0;
  }
}

/* Completed - Gray/Dark */
.status-completed {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

/* Cancelled - Red */
.status-cancelled {
  background: var(--color-error-lighter);
  color: var(--color-error-darkest);
}

/* Unknown status fallback */
.status-unknown {
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}
</style>
