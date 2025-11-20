<script setup>
import { AlertTriangle, Loader2, Play, X } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { getClassrooms } from '@/api/classrooms'

defineProps({
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['start', 'cancel'])

// State
const actualRoomId = ref(null)
const attendanceCutoffMinutes = ref(15)
const errorMessage = ref('')
const classrooms = ref([])
const loadingClassrooms = ref(false)

// Methods
async function loadClassrooms() {
  loadingClassrooms.value = true
  errorMessage.value = ''

  try {
    classrooms.value = await getClassrooms()
  }
  catch (error) {
    console.error('Failed to load classrooms:', error)
    errorMessage.value = 'Failed to load classrooms. You can still start the session.'
    classrooms.value = []
  }
  finally {
    loadingClassrooms.value = false
  }
}

function getCourseName(session) {
  if (!session)
    return 'N/A'
  return session.courseName || session.courseCode || 'Unknown Course'
}

function formatDate(dateString) {
  if (!dateString)
    return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getScheduledTime(session) {
  if (!session)
    return 'N/A'
  if (session.scheduledStartTime && session.scheduledEndTime) {
    return `${formatTime(session.scheduledStartTime)} - ${formatTime(session.scheduledEndTime)}`
  }
  return 'Time not specified'
}

function formatTime(timeString) {
  if (!timeString)
    return ''
  const [hours, minutes] = timeString.split(':')
  const hour = Number.parseInt(hours, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${period}`
}

function startSession() {
  errorMessage.value = ''

  // Validate cutoff minutes
  if (attendanceCutoffMinutes.value < 0 || attendanceCutoffMinutes.value > 120) {
    errorMessage.value = 'Attendance cutoff must be between 0 and 120 minutes'
    return
  }

  // Build payload
  const payload = {
    attendanceCutoffMinutes: attendanceCutoffMinutes.value,
  }

  // Add actual room ID if different from scheduled
  if (actualRoomId.value !== null) {
    payload.actualRoomId = actualRoomId.value
  }

  emit('start', payload)
}

// Lifecycle
onMounted(() => {
  loadClassrooms()
})
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Start Session</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X size="24" />
        </button>
      </div>

      <!-- Session Info Display -->
      <div class="session-info">
        <div class="info-row">
          <span class="info-label">Course:</span>
          <span class="info-value">{{ getCourseName(session) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">{{ formatDate(session?.sessionDate) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scheduled Time:</span>
          <span class="info-value">{{ getScheduledTime(session) }}</span>
        </div>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Loading State for Classrooms -->
      <div v-if="loadingClassrooms" class="loading-message">
        <Loader2 class="spinner" size="20" />
        <p>Loading classrooms...</p>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="startSession">
        <!-- Actual Room Dropdown -->
        <div class="form-group">
          <label>Actual Room (Optional)</label>
          <select
            v-model="actualRoomId"
            :disabled="loadingClassrooms"
          >
            <option :value="null">
              Use scheduled room ({{ session?.scheduledRoom || 'TBD' }})
            </option>
            <option
              v-for="classroom in classrooms"
              :key="classroom.id"
              :value="classroom.id"
            >
              {{ classroom.name }}
              <template v-if="classroom.building">
                - {{ classroom.building }}
              </template>
            </option>
          </select>
          <small class="helper-text info">
            Select if the session is being held in a different room
          </small>
        </div>

        <!-- Attendance Cutoff -->
        <div class="form-group">
          <label>Attendance Cutoff (minutes)</label>
          <div class="cutoff-input">
            <input
              v-model.number="attendanceCutoffMinutes"
              type="number"
              min="0"
              max="120"
              step="5"
            >
            <span class="input-suffix">minutes</span>
          </div>
          <small class="helper-text info">
            Students can check in up to this many minutes after session start (0-120)
          </small>
        </div>

        <!-- Quick Start Notice -->
        <div class="quick-start-notice">
          <div class="notice-icon">
            <Play size="20" />
          </div>
          <div class="notice-content">
            <p class="notice-title">
              Ready to start?
            </p>
            <p class="notice-text">
              The session will begin immediately and students can start checking in.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            type="submit"
            class="btn-start"
            :disabled="loadingClassrooms"
          >
            <Play size="18" />
            <span>Start Session</span>
          </button>
          <button type="button" class="btn-cancel" @click="$emit('cancel')">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Modal Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

/* Session Info */
.session-info {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

/* Error Message */
.error-message {
  margin: 1rem 1.5rem 0;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-content {
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.error-icon {
  color: #dc2626;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content p {
  color: #991b1b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

/* Loading Message */
.loading-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 1.5rem 0;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.875rem;
}

.spinner {
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-message p {
  margin: 0;
}

/* Modal Body */
.modal-body {
  padding: 1.5rem;
}

/* Form Group */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: all 0.2s;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group select:disabled,
.form-group input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.cutoff-input {
  position: relative;
  display: flex;
  align-items: center;
}

.cutoff-input input {
  padding-right: 5.5rem;
}

.input-suffix {
  position: absolute;
  right: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  pointer-events: none;
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: #6b7280;
}

/* Quick Start Notice */
.quick-start-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  flex-shrink: 0;
  color: #059669;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #065f46;
  margin: 0 0 0.25rem 0;
}

.notice-text {
  font-size: 0.813rem;
  color: #047857;
  margin: 0;
  line-height: 1.5;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-start,
.btn-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex: 1;
}

.btn-start {
  background: #059669;
  color: white;
}

.btn-start:hover:not(:disabled) {
  background: #047857;
}

.btn-start:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f9fafb;
}
</style>
