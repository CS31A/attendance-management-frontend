<script setup lang="ts">
import type { EntityId } from '@/types'
import { AlertTriangle, Check, Clock, Fingerprint, Loader2, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useFingerprintStore } from '@/stores/fingerprintStore'

const props = defineProps<{
  show: boolean
  studentId: EntityId
  studentName: string
}>()

const emit = defineEmits<{
  close: []
  enrolled: [enrollmentSessionId: string]
  error: [message: string]
}>()

const fingerprintStore = useFingerprintStore()

const selectedDeviceIdentifier = ref('')
const isSubmitting = ref(false)
const isMonitoring = ref(false)
const currentSessionId = ref<string | null>(null)
const status = ref<'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Expired'>('Pending')
const failureReason = ref('')
const error = ref('')
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)

const canSubmit = computed(() => selectedDeviceIdentifier.value && !isSubmitting.value)
const isDone = computed(() => ['Completed', 'Failed', 'Expired'].includes(status.value))

onMounted(() => {
  fingerprintStore.fetchDevices().catch((err) => {
    console.error('Failed to load devices:', err)
  })
})

onUnmounted(() => {
  stopPolling()
})

async function handleStartEnrollment() {
  if (!canSubmit.value)
    return
  await submitEnrollment(false)
}

async function handleStartAndMonitor() {
  if (!canSubmit.value)
    return
  await submitEnrollment(true)
}

async function submitEnrollment(monitor: boolean) {
  isSubmitting.value = true
  error.value = ''

  try {
    const session = await fingerprintStore.createEnrollmentSession(
      props.studentId,
      selectedDeviceIdentifier.value,
    )
    currentSessionId.value = session.enrollmentSessionId
    status.value = session.status

    if (monitor) {
      isMonitoring.value = true
      startPolling(session.enrollmentSessionId)
    }
    else {
      emit('close')
    }
  }
  catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string } } }
    error.value = axiosError.response?.data?.message || 'Failed to start enrollment'
  }
  finally {
    isSubmitting.value = false
  }
}

function startPolling(sessionId: string) {
  stopPolling()
  pollInterval.value = setInterval(async () => {
    try {
      const session = await fingerprintStore.getEnrollmentSession(sessionId)
      status.value = session.status
      if (session.failureReason)
        failureReason.value = session.failureReason

      if (isDone.value) {
        stopPolling()
      }
    }
    catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      error.value = axiosError.response?.data?.message || 'Polling error'
      stopPolling()
    }
  }, 3000)
}

function stopPolling() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

function handleClose() {
  if (status.value === 'Completed' && currentSessionId.value) {
    emit('enrolled', currentSessionId.value)
  }
  stopPolling()
  isMonitoring.value = false
  currentSessionId.value = null
  status.value = 'Pending'
  failureReason.value = ''
  error.value = ''
  selectedDeviceIdentifier.value = ''
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <div class="modal-header">
        <h3>Enroll Fingerprint</h3>
        <button class="close-btn" @click="handleClose">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div class="student-preview">
          <Fingerprint :size="24" />
          <span class="student-name">{{ studentName }}</span>
        </div>

        <div class="field">
          <label>Fingerprint Device</label>
          <select v-model="selectedDeviceIdentifier" :disabled="isSubmitting || isMonitoring">
            <option value="">
              Select device...
            </option>
            <option
              v-for="device in fingerprintStore.devices"
              :key="device.id"
              :value="device.deviceIdentifier"
            >
              {{ device.name || 'Unnamed Device' }} ({{ device.location || device.deviceIdentifier }})
            </option>
          </select>
          <p v-if="fingerprintStore.devices.length === 0 && !fingerprintStore.loading" class="hint">
            No devices available
          </p>
        </div>

        <div v-if="isMonitoring" class="monitor-panel">
          <div class="status-timeline">
            <div class="step" :class="{ active: status === 'Pending', complete: status !== 'Pending' }">
              <Check v-if="status !== 'Pending'" :size="16" />
              <Loader2 v-else class="spin" :size="16" />
              <span>Session created</span>
            </div>
            <div class="step" :class="{ active: status === 'InProgress', complete: ['Completed', 'Failed', 'Expired'].includes(status) }">
              <Check v-if="['Completed', 'Failed', 'Expired'].includes(status)" :size="16" />
              <Loader2 v-else-if="status === 'InProgress'" class="spin" :size="16" />
              <Clock v-else :size="16" />
              <span>Waiting for student scan...</span>
            </div>
            <div class="step" :class="{ active: isDone }">
              <Check v-if="status === 'Completed'" class="success-icon" :size="16" />
              <X v-else-if="['Failed', 'Expired'].includes(status)" class="error-icon" :size="16" />
              <span>{{ status }}</span>
            </div>
          </div>
          <p v-if="failureReason" class="failure-reason">
            {{ failureReason }}
          </p>
        </div>

        <div v-if="error" class="error-banner">
          <AlertTriangle :size="18" />
          <p>{{ error }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" :disabled="isSubmitting" @click="handleClose">
          Cancel
        </button>
        <template v-if="!isMonitoring">
          <button class="btn-secondary" :disabled="!canSubmit" @click="handleStartAndMonitor">
            Start & Monitor
          </button>
          <button class="btn-primary" :disabled="!canSubmit" @click="handleStartEnrollment">
            <Loader2 v-if="isSubmitting" class="spin" :size="16" />
            <span v-else>Start Enrollment</span>
          </button>
        </template>
        <button v-else-if="isDone" class="btn-primary" @click="handleClose">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
}

.student-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: var(--color-gray-50);
  border-radius: 0.5rem;
}

.student-name {
  font-weight: 500;
  color: var(--color-gray-800);
}

.field {
  margin-bottom: 1.25rem;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.field select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

.field select:disabled {
  background: var(--color-gray-100);
  cursor: not-allowed;
}

.hint {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-top: 0.25rem;
}

.monitor-panel {
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: 0.5rem;
}

.status-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

.step.active {
  color: var(--color-gray-800);
  font-weight: 500;
}

.step.complete {
  color: var(--color-success-dark);
}

.success-icon {
  color: var(--color-success-dark);
}

.error-icon {
  color: var(--color-error);
}

.failure-reason {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-error);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  border-radius: 0.5rem;
  color: var(--color-error);
  font-size: 0.875rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
