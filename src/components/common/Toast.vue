<script setup lang="ts">
import { AlertCircle, CheckCircle, Info, Loader2, X, XCircle } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  message: String,
  type: {
    type: String,
    default: 'success', // success, error, warning, info, loading
  },
  duration: {
    type: Number,
    default: 3000,
  },
})

const emit = defineEmits<{ close: [] }>()

const progress = ref(100)
let timer: ReturnType<typeof setTimeout> | null = null
let interval: ReturnType<typeof setInterval> | null = null

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
}

type ToastType = keyof typeof icons
const iconType = computed<ToastType>(() => {
  if (typeof props.type === 'string' && props.type in icons) {
    return props.type as ToastType
  }
  return 'success'
})

const isPaused = ref(false)

function startTimer() {
  if (props.duration <= 0 || props.type === 'loading')
    return

  const step = 100 / (props.duration / 10)
  progress.value = 100

  if (interval) {
    clearInterval(interval)
    interval = null
  }
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  interval = setInterval(() => {
    if (!isPaused.value) {
      progress.value -= step
      if (progress.value <= 0) {
        if (interval) {
          clearInterval(interval)
          interval = null
        }
      }
    }
  }, 10)

  timer = setTimeout(() => {
    emit('close')
  }, props.duration)
}

function stopTimer() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    startTimer()
  }
  else {
    stopTimer()
  }
})

watch(() => props.type, (newVal) => {
  if (newVal !== 'loading' && props.show) {
    startTimer()
  }
  else {
    stopTimer()
  }
})

function pause() {
  isPaused.value = true
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function resume() {
  isPaused.value = false
  if (props.type !== 'loading') {
    // Calculate remaining time based on progress
    const remainingTime = (progress.value / 100) * props.duration
    timer = setTimeout(() => {
      emit('close')
    }, remainingTime)
  }
}
</script>

<template>
  <Transition name="toast">
    <div
      v-if="show"
      class="toast-wrapper"
      @mouseenter="pause"
      @mouseleave="resume"
    >
      <div class="toast-container" :class="type">
        <div class="toast-content">
          <component
            :is="icons[iconType]"
            class="toast-icon"
            :class="{ spin: type === 'loading' }"
          />
          <div class="message-container">
            <span class="toast-message">{{ message }}</span>
          </div>
          <button v-if="type !== 'loading'" class="close-btn" @click="$emit('close')">
            <X :size="16" />
          </button>
        </div>
        <div
          v-if="type !== 'loading'"
          class="progress-bar"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.toast-wrapper {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
}

.toast-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 300px;
  max-width: 400px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.message-container {
  flex: 1;
}

.toast-message {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary-dark);
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-slate-400);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-slate-500);
}

.progress-bar {
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary-lightest), rgb(139, 92, 246));
  transition: width 0.01s linear;
}

/* Type variants */
.success .toast-icon { color: rgb(34, 197, 94); }
.success .progress-bar { background: rgb(34, 197, 94); }

.error .toast-icon { color: var(--color-error); }
.error .progress-bar { background: var(--color-error); }

.warning .toast-icon { color: var(--color-warning); }
.warning .progress-bar { background: var(--color-warning); }

.info .toast-icon { color: var(--color-primary-lightest); }
.info .progress-bar { background: var(--color-primary-lightest); }

.loading .toast-icon { color: var(--color-secondary-light); }

/* Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
