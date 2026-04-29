<script setup>
import { AlertTriangle, Ban, Clock, Download, Maximize, Users, X } from 'lucide-vue-next'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { calculateRemainingTime } from '@/utils/qrcode'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  qrCode: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'revoke', 'fullscreen'])

const qrCodeStore = useQrCodeStore()
const timeRemaining = ref(0)
const timerInterval = ref(null)

// Computed
const isExpired = computed(() => timeRemaining.value <= 0)
const isNearExpiration = computed(() => timeRemaining.value > 0 && timeRemaining.value < 300) // < 5 mins

const scanCount = computed(() => {
  // Try to get from scan history first (real-time), else fallback to prop
  if (qrCodeStore.scanHistory?.scanStatistics?.totalScans !== undefined) {
    return qrCodeStore.scanHistory.scanStatistics.totalScans
  }
  return props.qrCode.usageCount || 0
})

const maxUsage = computed(() => props.qrCode.maxUsage)
const hasUsageLimit = computed(() => maxUsage.value !== null)

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Timer Logic
function updateTimer() {
  if (props.qrCode?.expiresAt) {
    timeRemaining.value = calculateRemainingTime(props.qrCode.expiresAt)
  }
}

function startTimer() {
  updateTimer()
  timerInterval.value = setInterval(updateTimer, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

// Polling Logic
function startPolling() {
  if (props.qrCode?.id) {
    qrCodeStore.startPolling(props.qrCode.id)
  }
}

function stopPolling() {
  qrCodeStore.stopPolling()
}

// Actions
function handleDownload() {
  if (!props.qrCode.qrCodeData)
    return

  const link = document.createElement('a')
  link.href = props.qrCode.qrCodeData
  link.download = `qrcode-session-${props.qrCode.sessionId}-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleFullscreen() {
  emit('fullscreen', props.qrCode.id)
}

function handleRevoke() {
  emit('revoke', props.qrCode)
}

// Lifecycle
watch(() => props.show, (newVal) => {
  if (newVal) {
    startTimer()
    startPolling()
  }
  else {
    stopTimer()
    stopPolling()
  }
}, { immediate: true })

onUnmounted(() => {
  stopTimer()
  stopPolling()
})
</script>

<template>
  <div v-if="show" class="overlay" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title" @click.self="$emit('close')">
    <div class="modal">
      <!-- Header -->
      <div class="modal-header">
        <h2 id="qr-modal-title">
          Session QR Code
        </h2>
        <button
          type="button"
          class="btn-close"
          aria-label="Close modal"
          @click="$emit('close')"
        >
          <X :size="24" />
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Expiration Warning -->
        <div v-if="isNearExpiration && !isExpired" class="warning-banner">
          <AlertTriangle :size="16" />
          <span>Expires in less than 5 minutes!</span>
        </div>

        <div v-if="isExpired" class="error-banner">
          <Ban :size="16" />
          <span>QR Code Expired</span>
        </div>

        <!-- QR Image -->
        <div class="qr-container" :class="{ expired: isExpired }">
          <img
            v-if="qrCode.qrCodeData"
            :src="qrCode.qrCodeData"
            alt="Attendance QR Code"
            class="qr-image"
          >
          <div v-else class="qr-placeholder">
            <p>QR Image Not Available</p>
          </div>

          <!-- Expired Overlay -->
          <div v-if="isExpired" class="expired-overlay">
            <span>EXPIRED</span>
          </div>
        </div>

        <!-- Countdown -->
        <div class="timer-display" :class="{ urgent: isNearExpiration }">
          <Clock :size="20" />
          <span class="time">{{ formattedTime }}</span>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-item">
            <Users :size="18" class="stat-icon" />
            <div class="stat-content">
              <span class="stat-value">{{ scanCount }}</span>
              <span class="stat-label">Scanned</span>
            </div>
          </div>

          <div v-if="hasUsageLimit" class="stat-item">
            <div class="stat-divider">
              /
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ maxUsage }}</span>
              <span class="stat-label">Limit</span>
            </div>
          </div>
        </div>

        <!-- Helper Text -->
        <p class="helper-text">
          Students should scan this code using the mobile app.
        </p>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button class="btn-action secondary" @click="handleFullscreen">
          <Maximize :size="18" />
          Fullscreen
        </button>

        <button
          class="btn-action secondary"
          :disabled="!qrCode.qrCodeData"
          @click="handleDownload"
        >
          <Download :size="18" />
          Download
        </button>

        <button
          class="btn-action danger"
          :disabled="isExpired"
          @click="handleRevoke"
        >
          <Ban :size="18" />
          Revoke
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-gray-800);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.warning-banner, .error-banner {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.warning-banner {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.error-banner {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.qr-container {
  width: 240px;
  height: 240px;
  background: white;
  padding: 1rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.qr-placeholder {
  text-align: center;
  color: var(--color-gray-400);
  font-size: 0.875rem;
}

.expired-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(2px);
  border-radius: 0.8rem;
}

.expired-overlay span {
  background: #ef4444;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  font-weight: 700;
  transform: rotate(-15deg);
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
  font-size: 1.1rem;
  letter-spacing: 0.05em;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  margin-bottom: 1rem;
}

.timer-display.urgent {
  color: #ea580c; /* Orange-600 */
  animation: pulse 2s infinite;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  background: var(--color-gray-50);
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  color: var(--color-gray-400);
}

.stat-content {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  font-size: 1.5rem;
  color: var(--color-gray-300);
  font-weight: 300;
}

.helper-text {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 0.875rem;
  text-align: center;
}

.modal-footer {
  padding: 1.25rem;
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-gray-200);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.btn-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-action.secondary {
  background: white;
  border-color: var(--color-gray-200);
  color: var(--color-gray-700);
}

.btn-action.secondary:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  transform: translateY(-1px);
}

.btn-action.danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.btn-action.danger:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-width: 1200px) {
  .modal {
    max-width: 90%;
  }

  .qr-container {
    width: 220px;
    height: 220px;
  }
}

@media (max-width: 900px) {
  .modal {
    max-width: 95%;
    margin: 1rem;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .qr-container {
    width: 200px;
    height: 200px;
  }

  .timer-display {
    font-size: 1.75rem;
  }

  .modal-footer {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    margin: 0.75rem;
  }

  .qr-container {
    width: 180px;
    height: 180px;
  }

  .timer-display {
    font-size: 1.5rem;
  }

  .modal-footer {
    grid-template-columns: 1fr;
  }

  .btn-action {
    flex-direction: row;
    padding: 0.75rem;
  }
}
</style>
