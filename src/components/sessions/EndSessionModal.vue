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
      <form @submit.prevent="endSession" class="modal-body">
        <!-- Notes/Description -->
        <div class="form-group">
          <label>Session Notes (Optional)</label>
          <textarea
            v-model="notes"
            placeholder="Add any notes or comments about this session (optional)"
            rows="5"
            maxlength="1000"
          ></textarea>
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
            <p class="notice-title">Confirm Session End</p>
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

<script setup>
import { ref } from 'vue'
import { X, AlertTriangle, StopCircle } from 'lucide-vue-next'

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['end', 'cancel'])

// State
const notes = ref('')
const errorMessage = ref('')

// Methods
const getCourseName = (session) => {
  if (!session) return 'N/A'
  return session.courseName || session.courseCode || 'Unknown Course'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (datetimeString) => {
  if (!datetimeString) return 'N/A'
  const date = new Date(datetimeString)
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const endSession = () => {
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

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1f2937;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.helper-text {
  display: block;
  font-size: 0.813rem;
  margin-top: 0.375rem;
}

.helper-text.info {
  color: #6b7280;
}

/* Confirmation Notice */
.confirmation-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.notice-icon {
  flex-shrink: 0;
  color: #ea580c;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9a3412;
  margin: 0 0 0.25rem 0;
}

.notice-text {
  font-size: 0.813rem;
  color: #c2410c;
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
  background: #dc2626;
  color: white;
}

.btn-end:hover {
  background: #b91c1c;
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
