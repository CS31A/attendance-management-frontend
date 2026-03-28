<script setup lang="ts">
import { AlertTriangle, Clock, Loader2, RefreshCw, Users, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQrCodeStore } from '@/stores/qrCodeStore'
import { calculateRemainingTime } from '@/utils/qrcode'

const route = useRoute()
const router = useRouter()
const qrCodeStore = useQrCodeStore()

const loading = ref(true)
const error = ref('')
const timeRemaining = ref(0)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)

const qrCodeId = computed(() => Number(route.params.qrCodeId))
const qrCode = computed(() => qrCodeStore.getActiveQrCode)
const qrCodeImageSrc = computed(() =>
  typeof qrCode.value?.qrCodeData === 'string' ? qrCode.value.qrCodeData : '',
)
const hasQrCodeImage = computed(() => qrCodeImageSrc.value.length > 0)

const isExpired = computed(() => timeRemaining.value <= 0)
const isNearExpiration = computed(() => timeRemaining.value > 0 && timeRemaining.value < 300)

const scanCount = computed(() => {
  if (qrCodeStore.scanHistory?.scanStatistics?.totalScans !== undefined) {
    return qrCodeStore.scanHistory.scanStatistics.totalScans
  }
  return qrCode.value?.usageCount || 0
})

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

function updateTimer() {
  if (qrCode.value?.expiresAt) {
    timeRemaining.value = calculateRemainingTime(qrCode.value.expiresAt)
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

function handleExit() {
  router.back()
}

function handleRefresh() {
  loadQrCode()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleExit()
  }
  else if (event.key === 'r' || event.key === 'R') {
    handleRefresh()
  }
}

async function loadQrCode() {
  loading.value = true
  error.value = ''

  try {
    // Check if we already have this QR code in the store (e.g., from just generating it)
    const existingQrCode = qrCodeStore.getActiveQrCode
    if (existingQrCode && existingQrCode.id === qrCodeId.value && existingQrCode.qrCodeData) {
      // QR code already loaded in store, just start the timer and polling
      startTimer()
      qrCodeStore.startPolling(qrCodeId.value)
    }
    else {
      // Fetch from backend
      await qrCodeStore.fetchQrCode(qrCodeId.value)
      startTimer()
      qrCodeStore.startPolling(qrCodeId.value)
    }
  }
  catch (err) {
    error.value = err.response?.data?.message || 'Failed to load QR code'
    console.error('QR load error:', err)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQrCode()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  stopTimer()
  qrCodeStore.stopPolling()
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="qr-projection-view" role="main" aria-label="QR Code Projection">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state" role="status" aria-live="polite">
      <Loader2 class="spinner" :size="48" aria-hidden="true" />
      <p>Loading QR Code...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <AlertTriangle :size="48" class="error-icon" />
      <h2>Failed to Load QR Code</h2>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="loadQrCode">
        <RefreshCw :size="20" />
        Retry
      </button>
    </div>

    <!-- QR Code Display -->
    <div v-else-if="qrCode" class="projection-content">
      <div class="qr-card">
        <!-- Card Header -->
        <div class="card-header">
          <div class="header-content">
            <h1 class="page-title">
              {{ qrCode.scheduleTitle || 'Attendance' }}
            </h1>
            <p class="page-subtitle">
              <span v-if="qrCode.subjectName">{{ qrCode.subjectName }}</span>
              <span v-if="qrCode.sectionName"> • {{ qrCode.sectionName }}</span>
              <span v-if="qrCode.actualRoomName"> • {{ qrCode.actualRoomName }}</span>
            </p>
          </div>

          <div class="header-actions">
            <button class="btn-refresh" title="Refresh (R)" @click="handleRefresh">
              <RefreshCw :size="18" />
              Refresh
            </button>
            <button class="btn-exit" title="Back" @click="handleExit">
              <X :size="20" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <!-- Warning Banner -->
        <div v-if="isNearExpiration && !isExpired" class="warning-banner">
          <AlertTriangle :size="20" />
          <span>QR code expires soon!</span>
        </div>

        <!-- Main Content Layout -->
        <div class="qr-columns">
          <!-- Left Column: QR Code -->
          <div class="qr-column-left" style="display: flex; align-items: center; justify-content: center;">
            <div class="qr-display" :class="{ expired: isExpired }">
              <img
                v-if="hasQrCodeImage"
                :src="qrCodeImageSrc"
                alt="Attendance QR Code"
                class="qr-image"
              >
              <div v-if="isExpired" class="expired-overlay">
                <span>EXPIRED</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Timer, Counter, Instructions -->
          <div class="qr-column-right">
            <!-- Countdown Timer -->
            <div class="countdown-display" :class="{ urgent: isNearExpiration, expired: isExpired }">
              <Clock class="timer-icon" />
              <span class="timer-text">{{ formattedTime }}</span>
            </div>

            <!-- Scan Counter -->
            <div class="scan-counter">
              <Users :size="24" class="counter-icon" />
              <div class="counter-content">
                <span class="counter-value">{{ scanCount }}</span>
                <span class="counter-label">Students Scanned</span>
              </div>
            </div>

            <!-- Instructions -->
            <div class="instructions">
              <p>Scan this QR code using the mobile app to record attendance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qr-projection-view {
  padding: 0.25rem 0.25rem; /* Reduced side padding while keeping some space */
  min-height: calc(100vh - var(--header-height));
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  padding: 4rem 2rem;
  height: 100%;
}

.spinner {
  animation: spin 1s linear infinite;
  color: var(--color-primary);
}

.error-icon {
  color: var(--color-error);
}

.error-state h2 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.error-state p {
  color: var(--text-tertiary);
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-secondary);
  color: var(--text-white);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: var(--transition-fast);
}

.btn-retry:hover {
  background: var(--color-secondary-light);
}

.projection-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.qr-card {
  background: var(--bg-primary);
  padding: 0.5rem 0.75rem; /* Reduced horizontal padding, kept some vertical */
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-light);
}

.header-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.3;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-exit {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.btn-exit:hover {
  background: var(--bg-hover);
  border-color: var(--color-gray-400);
}

.warning-banner {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 600;
  width: 100%;
}

.qr-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
  align-items: center;
}

.qr-column-left {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-column-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
}

.qr-display {
  width: 100%;
  max-width: 380px;
  aspect-ratio: 1;
  background: var(--bg-primary);
  padding: 0.375rem;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.qr-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.expired-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  border-radius: 1rem;
}

.expired-overlay span {
  background: var(--color-error);
  color: var(--text-white);
  padding: 0.75rem 2rem;
  border-radius: 2rem;
  font-weight: 700;
  font-size: 1.5rem;
  transform: rotate(-15deg);
  box-shadow: var(--shadow-md);
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.countdown-display.urgent {
  color: var(--color-warning);
  animation: pulse 2s infinite;
}

.countdown-display.expired {
  color: var(--color-gray-400);
}

.scan-counter {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  background: var(--bg-tertiary);
  padding: 0.875rem 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
}

.counter-icon {
  color: var(--color-primary);
}

.counter-content {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.counter-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.counter-label {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.instructions {
  font-size: 1rem;
  text-align: center;
  color: var(--text-secondary);
}

.btn-refresh {
  background: var(--color-secondary);
  color: var(--text-white);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
  border: none;
  transition: var(--transition-fast);
  flex-shrink: 0;
}

.btn-refresh:hover {
  background: var(--color-secondary-light);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-width: 1024px) {
  .qr-columns {
    gap: 1.25rem;
  }

  .qr-display {
    max-width: 320px;
  }

  .countdown-display {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .qr-projection-view {
    padding: 0.5rem;
  }

  .qr-card {
    padding: 0.5rem 0.75rem; /* Reduced horizontal padding, kept some vertical */
    gap: 0.875rem;
  }

  .card-header {
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 0.625rem;
  }

  .header-actions {
    align-self: flex-end;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .page-subtitle {
    font-size: 0.875rem;
  }

  .qr-columns {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }

  .qr-display {
    max-width: 280px;
    padding: 0.25rem;
  }

  .countdown-display {
    font-size: 2rem;
    justify-content: center;
  }

  .scan-counter {
    padding: 0.75rem 1.25rem;
  }

  .qr-column-right {
    gap: 0.875rem;
  }

  .instructions {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .qr-projection-view {
    padding: 0.375rem;
  }

  .qr-card {
    padding: 0.375rem 0.5rem; /* Reduced horizontal padding, kept some vertical */
    gap: 0.625rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .qr-display {
    max-width: 240px;
    padding: 0.25rem;
  }

  .countdown-display {
    font-size: 1.75rem;
  }

  .counter-value {
    font-size: 1.25rem;
  }

  .counter-label {
    font-size: 0.75rem;
  }

  .qr-column-right {
    gap: 0.625rem;
  }

  .scan-counter {
    padding: 0.625rem 1rem;
  }
}
</style>
