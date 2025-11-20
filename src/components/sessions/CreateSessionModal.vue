<script setup>
import { AlertTriangle, Loader2, Plus, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { getMySchedules } from '@/api/instructors'

const emit = defineEmits(['create', 'cancel'])

// State
const scheduleId = ref('')
const sessionDate = ref('')
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

  if (schedule.courseCode)
    parts.push(schedule.courseCode)
  if (schedule.courseName)
    parts.push(schedule.courseName)
  if (schedule.section)
    parts.push(`Section ${schedule.section}`)
  if (schedule.dayOfWeek && schedule.startTime) {
    parts.push(`${schedule.dayOfWeek} ${schedule.startTime}`)
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
          <X size="24" />
        </button>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Loading State for Schedules -->
      <div v-if="loadingSchedules" class="loading-message">
        <Loader2 class="spinner" size="20" />
        <p>Loading your schedules...</p>
      </div>

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
            <Plus size="18" />
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

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f9fafb;
  color: #9ca3af;
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
  color: #6b7280;
}

.helper-text.error {
  color: #dc2626;
}

/* Actions */
.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
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
  background: #4f46e5;
  color: white;
}

.btn-create:hover:not(:disabled) {
  background: #4338ca;
}

.btn-create:disabled {
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
