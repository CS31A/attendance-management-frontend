<script setup>
import { AlertTriangle, StopCircle, X } from 'lucide-vue-next'
import { ref } from 'vue'

defineProps({
  session: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['end', 'cancel'])

// State
const notes = ref('')
const errorMessage = ref('')

// Methods
function getCourseName(session) {
  if (!session)
    return 'N/A'
  
  // Try subject fields first (most common in session data)
  if (session.subjectCode && session.subjectName) {
    return `${session.subjectCode} - ${session.subjectName}`
  }
  
  // Try course fields as fallback
  if (session.courseCode && session.courseName) {
    return `${session.courseCode} - ${session.courseName}`
  }
  
  // Individual field fallbacks
  return session.subjectName 
      || session.subjectCode 
      || session.courseName 
      || session.courseCode 
      || 'Unknown Course'
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

function formatDateTime(datetimeString) {
  if (!datetimeString)
    return 'N/A'
  const date = new Date(datetimeString)
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function endSession() {
  errorMessage.value = ''

  // Build payload
  const payload = {}

  // Add notes if provided
  if (notes.value.trim()) {
    payload.notes = notes.value.trim()
  }

  emit('end', payload)
}
</script>

<template>
  <div class="overlay">
    <div class="modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>End Session</h2>
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
          <span class="info-label">Room:</span>
          <span class="info-value">{{ session?.actualRoom || session?.scheduledRoom || 'TBD' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Started:</span>
          <span class="info-value">{{ formatDateTime(session?.actualStartTime) }}</span>
        </div>
      </div>

      <!-- Error Message Display -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-content">
          <AlertTriangle class="error-icon" size="20" />
          <p>{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal Body -->
      <form class="modal-body" @submit.prevent="endSession">
        <!-- Notes/Description -->
        <div class="form-group">
          <label>Session Notes (Optional)</label>
          <textarea
            v-model="notes"
            placeholder="Add any notes or comments about this session (optional)"
            rows="5"
            maxlength="1000"
          />
          <small class="helper-text info">
            {{ notes.length }}/1000 characters
          </small>
        </div>

        <!-- Confirmation Notice -->
        <div class="confirmation-notice">
          <div class="notice-icon">
            <AlertTriangle size="20" />
          </div>
          <div class="notice-content">
            <p class="notice-title">
              Confirm Session End
            </p>
            <p class="notice-text">
              Ending this session will stop attendance tracking and mark it as completed.
              This action cannot be undone.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            type="submit"
            class="btn-end"
          >
            <StopCircle size="18" />
            <span>End Session</span>
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
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-800);
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

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-gray-800);
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: var(--color-gray-500);
}

/* Confirmation Notice */
.confirmation-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-light);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  flex-shrink: 0;
  color: var(--color-warning);
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.25rem 0;
}

.notice-text {
  font-size: 0.813rem;
  color: var(--color-warning);
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

.btn-end,
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

.btn-end {
  background: var(--color-error-dark);
  color: white;
}

.btn-end:hover {
  background: var(--color-error-darker);
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
