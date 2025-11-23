<script setup>
import { AlertCircle, CheckCircle, Info, Loader2, X, XCircle } from 'lucide-vue-next'
import { ref, watch } from 'vue'

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

const emit = defineEmits(['close'])

const progress = ref(100)
let timer = null
let interval = null

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  loading: Loader2,
}

const isPaused = ref(false)

function startTimer() {
  if (props.duration <= 0 || props.type === 'loading')
    return

  const step = 100 / (props.duration / 10)
  progress.value = 100

  clearInterval(interval)
  clearTimeout(timer)

  interval = setInterval(() => {
    if (!isPaused.value) {
      progress.value -= step
      if (progress.value <= 0) {
        clearInterval(interval)
      }
    }
  }, 10)

  timer = setTimeout(() => {
    emit('close')
  }, props.duration)
}

function stopTimer() {
  clearInterval(interval)
  clearTimeout(timer)
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
  clearTimeout(timer)
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
            :is="icons[type]"
            class="toast-icon"
            :class="{ spin: type === 'loading' }"
          />
          <div class="message-container">
            <span class="toast-message">{{ message }}</span>
          </div>
          <button v-if="type !== 'loading'" class="close-btn" @click="$emit('close')">
            <X size="16" />
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
  color: #1e293b;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
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
  color: #64748b;
}

.progress-bar {
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.01s linear;
}

/* Type variants */
.success .toast-icon { color: #22c55e; }
.success .progress-bar { background: #22c55e; }

.error .toast-icon { color: #ef4444; }
.error .progress-bar { background: #ef4444; }

.warning .toast-icon { color: #f59e0b; }
.warning .progress-bar { background: #f59e0b; }

.info .toast-icon { color: #3b82f6; }
.info .progress-bar { background: #3b82f6; }

.loading .toast-icon { color: #6366f1; }

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
