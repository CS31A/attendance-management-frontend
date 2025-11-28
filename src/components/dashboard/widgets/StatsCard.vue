<script setup>
import { Minus, TrendingDown, TrendingUp } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: Object, default: null }, // Component
  trend: { type: Number, default: null }, // Percentage change
  trendLabel: { type: String, default: '' },
  color: { type: String, default: 'primary' }, // primary, success, warning, error, info
  loading: { type: Boolean, default: false },
})

const colorClass = computed(() => `text-${props.color}`)
const bgClass = computed(() => `bg-${props.color}-soft`)

const trendIcon = computed(() => {
  if (props.trend > 0)
    return TrendingUp
  if (props.trend < 0)
    return TrendingDown
  return Minus
})

const trendColor = computed(() => {
  if (props.trend > 0)
    return 'text-success'
  if (props.trend < 0)
    return 'text-error'
  return 'text-muted'
})
</script>

<template>
  <div class="stats-card" :class="{ 'is-loading': loading }">
    <div class="card-body">
      <div class="icon-wrapper" :class="bgClass">
        <component :is="icon" v-if="icon" class="icon" :class="colorClass" />
      </div>

      <div class="content">
        <h4 class="title">
          {{ title }}
        </h4>
        <div class="value-wrapper">
          <span class="value">{{ value }}</span>
        </div>

        <div v-if="trend !== null" class="trend-wrapper" :class="trendColor">
          <component :is="trendIcon" class="trend-icon" />
          <span class="trend-value">{{ Math.abs(trend) }}%</span>
          <span class="trend-label">{{ trendLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary-horizontal);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.stats-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-primary-lg);
  border-color: var(--color-primary-lighter);
}

.stats-card:hover::before {
  opacity: 1;
}

.card-body {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-base);
}

.stats-card:hover .icon-wrapper {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

.icon {
  width: 24px;
  height: 24px;
}

.content {
  flex: 1;
}

.title {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.trend-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.trend-icon {
  width: 14px;
  height: 14px;
}

.trend-label {
  color: var(--text-muted);
  margin-left: var(--spacing-xs);
}

/* Colors */
.text-primary { color: var(--color-primary); }
.bg-primary-soft {
  background: transparent;
}

.text-success { color: var(--color-success); }
.bg-success-soft {
  background: transparent;
}

.text-warning { color: var(--color-warning); }
.bg-warning-soft {
  background: transparent;
}

.text-error { color: var(--color-error); }
.bg-error-soft {
  background: transparent;
}

.text-info { color: var(--color-info); }
.bg-info-soft {
  background: transparent;
}

.text-purple { color: var(--color-secondary); }
.bg-purple-soft {
  background: transparent;
}

.text-blue { color: var(--color-info-light); }
.bg-blue-soft {
  background: transparent;
}

.text-indigo { color: var(--color-primary-lightest); }
.bg-indigo-soft {
  background: transparent;
}
</style>
