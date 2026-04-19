<script setup>
import { AlertTriangle, Plus, X } from 'lucide-vue-next'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { getMySchedules } from '@/api/instructors'

const emit = defineEmits(['create', 'cancel'])

const LoadingSpinner = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'))

// State
const scheduleId = ref('')
const sessionDate = ref('')
const offScheduleReason = ref('')
const description = ref('')
const errorMessage = ref('')
const schedules = ref([])
const loadingSchedules = ref(false)

// Computed
const todayDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return scheduleId.value !== '' && schedules.value.length > 0
})

const selectedSchedule = computed(() => {
  return schedules.value.find(schedule => String(schedule.id) === String(scheduleId.value)) || null
})

function getWeekdayNameFromDate(dateValue) {
  if (!dateValue)
    return null

  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime()))
    return null

  return parsed.toLocaleDateString('en-US', { weekday: 'long' })
}

const isOffScheduleDate = computed(() => {
  if (!selectedSchedule.value || !sessionDate.value)
    return false

  const scheduleDay = selectedSchedule.value.dayOfWeek
  if (!scheduleDay)
    return false

  const selectedDay = getWeekdayNameFromDate(sessionDate.value)
  if (!selectedDay)
    return false

  return String(scheduleDay).toLowerCase() !== selectedDay.toLowerCase()
})

// Methods
async function loadSchedules() {
  loadingSchedules.value = true
  errorMessage.value = ''

  try {
    // Fetch schedules assigned to the current instructor
    schedules.value = await getMySchedules()

    if (schedules.value.length === 0) {
      errorMessage.value = 'No schedules found. Please contact your administrator to assign schedules.'
    }
  }
  catch (error) {
    console.error('Failed to load schedules:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to load schedules. Please try again.'
    schedules.value = []
  }
  finally {
    loadingSchedules.value = false
  }
}

function getScheduleLabel(schedule) {
  // Build a descriptive label from schedule data
  const parts = []

  if (schedule.course) {
    // Handle both object and string formats for course
    const courseName = typeof schedule.course === 'object'
      ? (schedule.course.name || schedule.course.title || schedule.course.courseName)
      : schedule.course
    const courseCode = typeof schedule.course === 'object'
      ? (schedule.course.code || schedule.course.courseCode)
      : null
    if (courseCode && courseName) {
      parts.push(`${courseCode} - ${courseName}`)
    }
    else if (courseName) {
      parts.push(courseName.toString())
    }
    else if (schedule.courseCode) {
      parts.push(schedule.courseCode.toString())
    }
    else if (schedule.courseName) {
      parts.push(schedule.courseName.toString())
    }
  }
  else {
    if (schedule.courseCode && schedule.courseCode !== null && schedule.courseCode !== undefined)
      parts.push(schedule.courseCode.toString())
    if (schedule.courseName && schedule.courseName !== null && schedule.courseName !== undefined)
      parts.push(schedule.courseName.toString())
  }

  if (schedule.section) {
    // Handle both object and string formats for section
    const sectionName = typeof schedule.section === 'object'
      ? (schedule.section.name || schedule.section.title || schedule.section.sectionName)
      : schedule.section
    if (sectionName && sectionName !== null && sectionName !== undefined)
      parts.push(`Section ${sectionName}`)
  }

  if (schedule.classroom) {
    // Handle both object and string formats for classroom
    const classroomName = typeof schedule.classroom === 'object'
      ? (schedule.classroom.name || schedule.classroom.room || schedule.classroom.classroomName)
      : schedule.classroom
    if (classroomName && classroomName !== null && classroomName !== undefined)
      parts.push(classroomName.toString())
  }

  if (schedule.dayOfWeek && (schedule.startTime || schedule.timeIn)) {
    const startTime = schedule.startTime || schedule.timeIn
    const endTime = schedule.endTime || schedule.timeOut
    if (endTime) {
      parts.push(`${schedule.dayOfWeek} ${startTime} - ${endTime}`)
    }
    else {
      parts.push(`${schedule.dayOfWeek} ${startTime}`)
    }
  }

  return parts.length > 0 ? parts.join(' - ') : `Schedule ${schedule.id}`
}

function createSession() {
  errorMessage.value = ''

  if (!scheduleId.value) {
    errorMessage.value = 'Please select a schedule'
    return
  }

  // Build payload
  const payload = {
    scheduleId: Number.parseInt(scheduleId.value, 10),
  }

  // Add optional date if provided
  if (sessionDate.value) {
    payload.sessionDate = sessionDate.value
  }

  // Allow off-schedule session creation only with explicit reason
  if (isOffScheduleDate.value) {
    const trimmedReason = offScheduleReason.value.trim()
    if (!trimmedReason) {
      errorMessage.value = 'Please provide a reason for creating this off-schedule session.'
      return
    }

    payload.allowOffScheduleDate = true
    payload.offScheduleReason = trimmedReason
  }

  // Add optional description if provided
  if (description.value.trim()) {
    payload.description = description.value.trim()
  }

  emit('create', payload)
}

// Lifecycle
onMounted(() => {
  loadSchedules()
})
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Create New Session</h2>
        <button type="button" class="btn-close" @click="$emit('cancel')">
          <X :size="24" />
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" :size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Loading State for Schedules -->
      <LoadingSpinner
        v-if="loadingSchedules"
        type="inline"
        message="Loading your schedules..."
        size="small"
      />

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="createSession">
        <!-- Schedule Dropdown -->
        <div class="form-group">
          <label>Schedule *</label>
          <select
            v-model="scheduleId"
            required
            :disabled="loadingSchedules || !schedules.length"
          >
            <option value="" disabled>
              Select a schedule
            </option>
            <option
              v-for="schedule in schedules"
              :key="schedule.id"
              :value="schedule.id"
            >
              {{ getScheduleLabel(schedule) }}
            </option>
          </select>
          <small class="helper-text info">
            Select the schedule for this session
          </small>
          <small v-if="!loadingSchedules && !schedules.length" class="helper-text error">
            No schedules found. Please contact your administrator.
          </small>
        </div>

        <!-- Session Date -->
        <div class="form-group">
          <label>Session Date</label>
          <input
            v-model="sessionDate"
            type="date"
            :min="todayDate"
          >
          <small class="helper-text info">
            Defaults to today if not specified
          </small>
        </div>

        <div v-if="isOffScheduleDate" class="form-group">
          <label>Reason for Off-Schedule Session *</label>
          <textarea
            v-model="offScheduleReason"
            name="offScheduleReason"
            placeholder="Explain why this class is being held on a different day"
            rows="3"
            maxlength="500"
          />
          <small class="helper-text warning">
            This session date does not match the schedule day. A reason is required.
          </small>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label>Description (Optional)</label>
          <textarea
            v-model="description"
            placeholder="Enter session description or notes (optional)"
            rows="4"
            maxlength="500"
          />
          <small class="helper-text info">
            {{ description.length }}/500 characters
          </small>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            type="submit"
            class="btn-create"
            :disabled="!isFormValid || loadingSchedules"
          >
            <Plus :size="18" />
            <span>Create Session</span>
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

  .actions {
    flex-direction: column;
  }

  .btn-create,
  .btn-cancel {
    width: 100%;
  }
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
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-gray-100);
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

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-gray-800);
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background: var(--color-gray-50);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: var(--color-gray-500);
}

.helper-text.error {
  color: var(--color-error-dark);
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

.btn-create,
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

.btn-create {
  background: var(--color-secondary);
  color: white;
}

.btn-create:hover:not(:disabled) {
  background: var(--color-secondary-light);
}

.btn-create:disabled {
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
</style>
