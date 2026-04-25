<script setup lang="ts">
import type { ClassroomDto } from '@/api/classrooms'
import type { ScheduleDto } from '@/api/schedules'
import type { SessionResponseDto } from '@/api/sessions'
import type { EntityId } from '@/types'
import { AlertTriangle, Play, X } from 'lucide-vue-next'
import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
import classroomApi from '@/api/classrooms'
import { getScheduleById } from '@/api/schedules'
import { formatLongWeekdayDate as formatDate } from '@/utils/date'

const props = defineProps<{
  session: SessionResponseDto
}>()

const emit = defineEmits<{
  start: [payload: { attendanceCutoffMinutes: number, actualRoomId?: EntityId }]
  cancel: []
}>()

const LoadingSpinner = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'))

// State
const actualRoomId = ref<EntityId | null>(null)
const attendanceCutoffMinutes = ref(15)
const errorMessage = ref('')
const classrooms = ref<ClassroomDto[]>([])
const loadingClassrooms = ref(false)
const scheduleDetails = ref<ScheduleDto | null>(null)
const loadingSchedule = ref(false)

// Methods
async function loadClassrooms() {
  loadingClassrooms.value = true
  errorMessage.value = ''

  try {
    const response = await classroomApi.getAllClassrooms()
    classrooms.value = response.data || response
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

function getCourseName(session: SessionResponseDto | null) {
  if (!session)
    return 'N/A'
  // Try different field combinations based on API response structure
  if (session.subjectCode && session.subjectName) {
    return `${session.subjectCode} - ${session.subjectName}`
  }
  if (session.courseCode && session.courseName) {
    return `${session.courseCode} - ${session.courseName}`
  }
  return session.subjectName || session.courseName || session.subjectCode || session.courseCode || 'Unknown Course'
}

function getScheduledTime(session: SessionResponseDto | null) {
  if (!session)
    return 'N/A'

  // Check session fields first - cast from unknown to string
  let startTime = (session.scheduledStartTime as string | undefined) || (session.startTime as string | undefined) || (session.timeIn as string | undefined)
  let endTime = (session.scheduledEndTime as string | undefined) || (session.endTime as string | undefined) || (session.timeOut as string | undefined)

  // Fall back to fetched schedule details if session doesn't have time
  if (!startTime && scheduleDetails.value) {
    startTime = scheduleDetails.value.timeIn || scheduleDetails.value.startTime
    endTime = scheduleDetails.value.timeOut || scheduleDetails.value.endTime
  }

  if (startTime && endTime) {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
  }
  if (startTime) {
    return formatTime(startTime)
  }

  // Show loading state if still fetching schedule
  if (loadingSchedule.value) {
    return 'Loading...'
  }

  return 'Time not specified'
}

function formatTime(timeString: string | undefined) {
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
  const payload: { attendanceCutoffMinutes: number, actualRoomId?: EntityId } = {
    attendanceCutoffMinutes: attendanceCutoffMinutes.value,
  }

  // Add actual room ID if different from scheduled
  if (actualRoomId.value !== null) {
    payload.actualRoomId = actualRoomId.value
  }

  emit('start', payload)
}

async function loadScheduleDetails() {
  if (!props.session?.scheduleId) {
    return
  }

  loadingSchedule.value = true
  try {
    const scheduleId = props.session.scheduleId as EntityId
    const response = await getScheduleById(scheduleId)
    scheduleDetails.value = (response.data || response) as ScheduleDto
  }
  catch (error) {
    console.error('Failed to load schedule details:', error)
    // Don't show error - time display will just show fallback
  }
  finally {
    loadingSchedule.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadClassrooms()
  loadScheduleDetails()
})

// Watch for session changes
watch(() => props.session?.scheduleId, (newScheduleId) => {
  if (newScheduleId) {
    loadScheduleDetails()
  }
})
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Start Session</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X :size="24" />
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
          <AlertTriangle class="error-icon" :size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Loading State for Classrooms -->
      <LoadingSpinner
        v-if="loadingClassrooms"
        type="inline"
        message="Loading classrooms..."
        size="small"
      />

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
              Use scheduled room ({{ session?.scheduledRoomName || session?.actualRoomName || 'TBD' }})
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
            <Play :size="20" />
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
            <Play :size="18" />
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
  z-index: var(--z-modal);
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
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-800);
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
  color: var(--color-gray-500);
  cursor: pointer;
}

/* Session Info */
.session-info {
  padding: 1rem 1.5rem;
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-200);
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
  color: var(--color-gray-500);
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-800);
}

/* Error Message */
.error-message {
  margin: 1rem 1.5rem 0;
  padding: 1rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-light);
  border-radius: 8px;
}

.error-content {
  display: flex;
  align-items: start;
  gap: 0.75rem;
}

.error-icon {
  color: var(--color-error-dark);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.error-content p {
  color: var(--color-error-darkest);
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
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-lighter);
  border-radius: 8px;
  color: var(--color-info);
  font-size: 0.875rem;
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
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-gray-800);
  transition: all 0.2s;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group select:disabled,
.form-group input:disabled {
  background: var(--color-gray-50);
  color: var(--color-gray-400);
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
  color: var(--color-gray-500);
  pointer-events: none;
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: var(--color-gray-500);
}

/* Quick Start Notice */
.quick-start-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-light);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  flex-shrink: 0;
  color: var(--color-success);
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-success);
  margin: 0 0 0.25rem 0;
}

.notice-text {
  font-size: 0.813rem;
  color: var(--color-success);
  margin: 0;
  line-height: 1.5;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
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
  background: var(--color-success);
  color: white;
}

.btn-start:hover:not(:disabled) {
  background: var(--color-success-light);
}

.btn-start:disabled {
  background: var(--color-gray-300);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.btn-cancel {
  background: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
}

.btn-cancel:hover {
  background: var(--color-gray-50);
}

/* Responsive */
@media (max-width: 1200px) {
  .modal {
    max-width: 90%;
  }
}

@media (max-width: 900px) {
  .modal {
    max-width: 95%;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .session-info,
  .modal-body {
    padding: 1.25rem;
  }

  .actions {
    flex-direction: column;
  }

  .btn-start,
  .btn-cancel {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .modal {
    max-width: 100%;
    margin: 0.75rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .session-info,
  .modal-body {
    padding: 1rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .info-label,
  .info-value {
    font-size: 0.813rem;
  }
}
</style>
